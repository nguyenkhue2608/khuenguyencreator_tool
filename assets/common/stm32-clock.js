/**
 * Phần dùng chung cho các tool STM32: dữ liệu chip, đường clock SYSCLK -> AHB -> APB -> Timer,
 * thuật toán chọn PSC/ARR và hình clock tree vẽ theo kiểu STM32CubeMX.
 */
window.KNStm32 = (function () {
	'use strict';

	var PSC_MAX = 65535;
	var AHB_DIVS = [1, 2, 4, 8, 16, 64, 128, 256, 512];
	var APB_DIVS = [1, 2, 4, 8, 16];

	function timers(apb2, apb1, wide, basic) {
		var t = {};
		apb2.forEach(function (n) { t[n] = { bus: 2, bits: 16, pwm: true }; });
		apb1.forEach(function (n) { t[n] = { bus: 1, bits: wide.indexOf(n) >= 0 ? 32 : 16, pwm: basic.indexOf(n) < 0 }; });
		return t;
	}

	/* Clock mặc định = cấu hình tối đa mà CubeMX hay dùng cho từng chip. */
	var CHIPS = {
		f103: {
			name: 'STM32F103C8 (Blue Pill)', sysclk: 72, ahb: 1, apb1: 2, apb2: 1,
			max: { hclk: 72, apb1: 36, apb2: 72 },
			timers: timers(['TIM1'], ['TIM2', 'TIM3', 'TIM4'], [], [])
		},
		f401: {
			name: 'STM32F401 (Black Pill)', sysclk: 84, ahb: 1, apb1: 2, apb2: 1,
			max: { hclk: 84, apb1: 42, apb2: 84 },
			timers: timers(['TIM1', 'TIM9', 'TIM10', 'TIM11'], ['TIM2', 'TIM3', 'TIM4', 'TIM5'], ['TIM2', 'TIM5'], [])
		},
		f411: {
			name: 'STM32F411 (Black Pill)', sysclk: 100, ahb: 1, apb1: 2, apb2: 1,
			max: { hclk: 100, apb1: 50, apb2: 100 },
			timers: timers(['TIM1', 'TIM9', 'TIM10', 'TIM11'], ['TIM2', 'TIM3', 'TIM4', 'TIM5'], ['TIM2', 'TIM5'], [])
		},
		f407: {
			name: 'STM32F407 (Discovery)', sysclk: 168, ahb: 1, apb1: 4, apb2: 2,
			max: { hclk: 168, apb1: 42, apb2: 84 },
			timers: timers(['TIM1', 'TIM8', 'TIM9', 'TIM10', 'TIM11'],
				['TIM2', 'TIM3', 'TIM4', 'TIM5', 'TIM6', 'TIM7', 'TIM12', 'TIM13', 'TIM14'], ['TIM2', 'TIM5'], ['TIM6', 'TIM7'])
		}
	};

	/* ---------- Định dạng ---------- */

	function num(v) {
		if (!isFinite(v)) return '–';
		return String(parseFloat(v.toPrecision(7)));
	}
	function fmtHz(hz) {
		var a = Math.abs(hz);
		if (a >= 1e6) return num(hz / 1e6) + ' MHz';
		if (a >= 1e3) return num(hz / 1e3) + ' kHz';
		return num(hz) + ' Hz';
	}
	function fmtTime(s) {
		var a = Math.abs(s);
		if (a >= 1) return num(s) + ' s';
		if (a >= 1e-3) return num(s * 1e3) + ' ms';
		if (a >= 1e-6) return num(s * 1e6) + ' µs';
		return num(s * 1e9) + ' ns';
	}
	function fmtErr(err) {
		var p = err * 100;
		var s = Math.abs(p) >= 0.0001 ? p.toFixed(4) : p.toPrecision(2);
		return (p > 0 ? '+' : '') + s + ' %';
	}
	function esc(s) {
		return String(s).replace(/[&<>"]/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
		});
	}
	function parse(el) {
		return parseFloat(String(el.value).replace(',', '.'));
	}

	/* ---------- Clock ---------- */

	function clocks(c) {
		var hclk = c.sysclk / c.ahb;
		var p1 = hclk / c.apb1, p2 = hclk / c.apb2;
		return {
			sysclk: c.sysclk, hclk: hclk, pclk1: p1, pclk2: p2,
			tim1: c.apb1 === 1 ? p1 : p1 * 2,
			tim2: c.apb2 === 1 ? p2 : p2 * 2
		};
	}

	/* ---------- Chọn PSC / ARR ---------- */

	/* Điểm "tròn" của tick (Hz), càng nhỏ càng tròn: 1 MHz -> 0, 2 MHz -> 1, 9 MHz -> 2, 36 MHz -> 4. */
	function roundness(n) {
		n = Math.round(n * 1e6) / 1e6;
		if (!isFinite(n) || n <= 0 || Math.floor(n) !== n) return 99;
		while (n % 10 === 0) n /= 10;
		if (n === 1) return 0;
		if (n === 2 || n === 5) return 1;
		return 1 + String(n).length + (n < 10 ? 0 : 1);
	}

	/**
	 * minSteps: số mức tối thiểu của ARR+1 muốn giữ (PWM cần duty mịn), 0 nếu không quan tâm.
	 * Thứ tự ưu tiên: sai số nhỏ nhất -> đủ minSteps -> tick tròn -> ARR lớn.
	 * Trả về { best } hoặc { error: 'high' | 'low' }.
	 */
	function solve(fclk, ftarget, bits, minSteps) {
		var maxArr = bits === 32 ? 4294967295 : 65535;
		var N = fclk / ftarget;
		if (N < 1.5) return { error: 'high' };
		var best = null;
		for (var psc = 0; psc <= PSC_MAX; psc++) {
			var d = psc + 1;
			var q = N / d;
			if (q < 1.5) break;
			var p = Math.max(2, Math.round(q));
			if (p > maxArr + 1) continue;
			var f = fclk / (d * p);
			var err = (f - ftarget) / ftarget;
			if (Math.abs(err) < 1e-12) err = 0;
			var c = { psc: psc, arr: p - 1, f: f, err: err, tick: fclk / d };
			c.key = [Math.abs(err), minSteps && p < minSteps ? 1 : 0, roundness(c.tick), -p];
			if (!best || less(c.key, best.key)) best = c;
		}
		return best ? { best: best } : { error: 'low', minF: fclk / (65536 * (maxArr + 1)) };
	}
	function less(a, b) {
		for (var i = 0; i < a.length; i++) {
			var eps = i === 0 ? 1e-12 : 0;
			if (a[i] < b[i] - eps) return true;
			if (a[i] > b[i] + eps) return false;
		}
		return false;
	}

	/* ---------- Hình: clock tree kiểu CubeMX ---------- */

	var T = 'font-family:var(--kn-mono);';
	function txt(x, y, s, style, anchor) {
		return '<text x="' + x + '" y="' + y + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + ' style="' + T + 'font-size:11px;fill:var(--kn-muted);' + (style || '') + '">' + esc(s) + '</text>';
	}
	function box(x, y, w, h, value, opt) {
		opt = opt || {};
		var stroke = opt.bad ? 'var(--kn-error)' : opt.on ? 'var(--kn-accent)' : 'var(--kn-line)';
		var fill = opt.bad ? 'var(--kn-error-soft)' : opt.hl ? 'var(--kn-accent-soft)' : 'var(--kn-paper)';
		var color = opt.bad ? 'var(--kn-error)' : opt.on ? 'var(--kn-ink)' : 'var(--kn-muted)';
		return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" style="fill:' + fill + ';stroke:' + stroke + ';stroke-width:' + (opt.hl ? 2 : 1.2) + '"/>' +
			'<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 5) + '" text-anchor="middle" style="' + T + 'font-size:' + (opt.small ? 12 : 14) + 'px;font-weight:700;fill:' + color + '">' + esc(value) + '</text>';
	}
	function wire(points, on) {
		return '<polyline points="' + points.join(' ') + '" style="fill:none;stroke:' + (on ? 'var(--kn-accent)' : 'var(--kn-line)') + ';stroke-width:' + (on ? 2 : 1.4) + '"/>';
	}
	function arrow(x, y, on) {
		return '<path d="M' + (x - 7) + ' ' + (y - 4) + ' L' + x + ' ' + y + ' L' + (x - 7) + ' ' + (y + 4) + ' Z" style="fill:' + (on ? 'var(--kn-accent)' : 'var(--kn-line)') + '"/>';
	}
	function mhz(v) { return num(Math.round(v * 1e4) / 1e4); }

	function clockTreeSVG(cfg, chip, timerName) {
		var ck = clocks(cfg), max = chip.max, bus = chip.timers[timerName].bus;
		var hY = 140, c = { 1: 75, 2: 205 };
		var out = '<svg viewBox="0 0 820 268" role="img" aria-label="Clock tree từ SYSCLK tới clock của ' + esc(timerName) + '">';

		out += txt(8, hY - 26, 'SYSCLK (MHz)', 'font-weight:700;fill:var(--kn-ink)');
		out += box(8, hY - 20, 96, 40, mhz(ck.sysclk), { on: true });
		out += wire([[104, hY], [128, hY]], true) + arrow(130, hY, true);
		out += txt(130, hY - 26, 'AHB Prescaler');
		out += box(130, hY - 20, 80, 40, '/ ' + cfg.ahb, { on: true });
		out += wire([[210, hY], [232, hY]], true) + arrow(234, hY, true);
		out += txt(234, hY - 26, 'HCLK (MHz)', 'font-weight:700;fill:var(--kn-ink)');
		out += box(234, hY - 20, 96, 40, mhz(ck.hclk), { on: true, bad: ck.hclk > max.hclk + 1e-9 });
		if (ck.hclk > max.hclk + 1e-9) out += txt(234, hY + 34, 'tối đa ' + max.hclk, 'fill:var(--kn-error)');

		[1, 2].forEach(function (b) {
			var on = b === bus, y = c[b];
			var div = b === 1 ? cfg.apb1 : cfg.apb2;
			var pclk = b === 1 ? ck.pclk1 : ck.pclk2;
			var tclk = b === 1 ? ck.tim1 : ck.tim2;
			var pmax = b === 1 ? max.apb1 : max.apb2;
			var bad = pclk > pmax + 1e-9;

			out += wire([[330, hY], [350, hY], [350, y], [370, y]], on) + arrow(372, y, on);
			out += txt(372, y - 26, 'APB' + b + ' Prescaler');
			out += box(372, y - 20, 80, 40, '/ ' + div, { on: on });
			out += wire([[452, y], [470, y], [470, y - 30], [558, y - 30]], on) + arrow(560, y - 30, on);
			out += box(560, y - 48, 96, 36, mhz(pclk), { on: on, bad: bad, small: true });
			out += txt(664, y - 34, 'APB' + b + ' peripheral clocks', on ? 'fill:var(--kn-ink)' : '');
			out += txt(664, y - 20, bad ? '(MHz) · tối đa ' + pmax : '(MHz)', bad ? 'fill:var(--kn-error)' : '');
			out += wire([[470, y], [470, y + 30], [488, y + 30]], on) + arrow(490, y + 30, on);
			out += box(490, y + 14, 44, 32, div === 1 ? 'X 1' : 'X 2', { on: on, small: true });
			out += wire([[534, y + 30], [558, y + 30]], on) + arrow(560, y + 30, on);
			out += box(560, y + 12, 96, 36, mhz(tclk), { on: on, hl: on, small: true });
			out += txt(664, y + 26, 'APB' + b + ' Timer clocks', on ? 'fill:var(--kn-ink);font-weight:700' : '');
			out += txt(664, y + 40, on ? '(MHz) → ' + timerName : '(MHz)', on ? 'fill:var(--kn-accent-ink);font-weight:700' : '');
		});
		return out + '</svg>';
	}

	/* ---------- Hình: bên trong timer ---------- */

	function chainSVG(o) {
		var W = 820, bw = 136, gap = (W - 16 - bw * 5) / 4, y = 34, h = 44;
		var items = [
			[o.timerName + 'CLK', fmtHz(o.timclk), ''],
			['Prescaler', 'PSC = ' + o.psc, '÷ ' + (o.psc + 1)],
			['CK_CNT', fmtHz(o.timclk / (o.psc + 1)), '1 tick = ' + fmtTime((o.psc + 1) / o.timclk)],
			['Counter Period', 'ARR = ' + o.arr, '÷ ' + (o.arr + 1)],
			[o.resultLabel, o.resultValue, o.resultNote || '']
		];
		var out = '<svg viewBox="0 0 ' + W + ' 104" role="img" aria-label="Đường xung bên trong timer">';
		items.forEach(function (it, i) {
			var x = 8 + i * (bw + gap);
			out += txt(x, y - 8, it[0], 'font-weight:700;fill:var(--kn-ink)');
			out += box(x, y, bw, h, it[1], { on: true, hl: i === 4, small: true });
			if (it[2]) out += txt(x + bw / 2, y + h + 16, it[2], '', 'middle');
			if (i < 4) out += wire([[x + bw, y + h / 2], [x + bw + gap - 2, y + h / 2]], true) + arrow(x + bw + gap, y + h / 2, true);
		});
		return out + '</svg>';
	}

	/* ---------- Khối nhập chip / timer / clock dùng chung ---------- */

	function divOpts(list, sel) {
		return list.map(function (d) { return '<option value="' + d + '"' + (d === sel ? ' selected' : '') + '>/ ' + d + '</option>'; }).join('');
	}

	/**
	 * Vẽ khối chọn chip + timer + clock vào `host`. opts.pwmOnly: ẩn timer cơ bản (TIM6/7).
	 * Trả về { get(), timerOpts() } và gọi onChange() mỗi khi giá trị đổi.
	 */
	function clockForm(host, uid, opts, onChange) {
		var chipOpts = Object.keys(CHIPS).map(function (k) { return '<option value="' + k + '">' + esc(CHIPS[k].name) + '</option>'; }).join('');
		host.innerHTML =
			'<div class="kn-stm__row2">' +
				'<div class="kn-stm__field"><label for="' + uid + '-chip">Chip</label><select id="' + uid + '-chip" data-c="chip">' + chipOpts + '</select></div>' +
				'<div class="kn-stm__field"><label for="' + uid + '-timer">Timer</label><select id="' + uid + '-timer" data-c="timer"></select></div>' +
			'</div>' +
			'<div class="kn-stm__clock">' +
				'<div class="kn-stm__clock-sum"><span data-c="sum"></span><button type="button" class="kn-stm__link" data-c="toggle" aria-expanded="false">Sửa clock</button></div>' +
				'<div class="kn-stm__clock-edit" data-c="edit" hidden>' +
					'<div class="kn-stm__field"><label for="' + uid + '-sys">SYSCLK (MHz)</label><input type="number" id="' + uid + '-sys" data-c="sysclk" min="0" step="any" inputmode="decimal"></div>' +
					'<div class="kn-stm__field"><label for="' + uid + '-ahb">AHB Prescaler</label><select id="' + uid + '-ahb" data-c="ahb"></select></div>' +
					'<div class="kn-stm__field"><label for="' + uid + '-apb1">APB1 Prescaler</label><select id="' + uid + '-apb1" data-c="apb1"></select></div>' +
					'<div class="kn-stm__field"><label for="' + uid + '-apb2">APB2 Prescaler</label><select id="' + uid + '-apb2" data-c="apb2"></select></div>' +
				'</div>' +
			'</div>';

		var q = function (k) { return host.querySelector('[data-c="' + k + '"]'); };

		function loadChip() {
			var chip = CHIPS[q('chip').value], prev = q('timer').value;
			var names = Object.keys(chip.timers).filter(function (n) { return !opts.pwmOnly || chip.timers[n].pwm; });
			q('timer').innerHTML = names.map(function (n) {
				var t = chip.timers[n];
				return '<option value="' + n + '">' + n + ' · APB' + t.bus + (t.bits === 32 ? ' · 32-bit' : '') + '</option>';
			}).join('');
			q('timer').value = names.indexOf(prev) >= 0 ? prev : (names.indexOf('TIM2') >= 0 ? 'TIM2' : names[0]);
			q('sysclk').value = chip.sysclk;
			q('ahb').innerHTML = divOpts(AHB_DIVS, chip.ahb);
			q('apb1').innerHTML = divOpts(APB_DIVS, chip.apb1);
			q('apb2').innerHTML = divOpts(APB_DIVS, chip.apb2);
		}

		function get() {
			var chip = CHIPS[q('chip').value];
			var cfg = { sysclk: parse(q('sysclk')), ahb: Number(q('ahb').value), apb1: Number(q('apb1').value), apb2: Number(q('apb2').value) };
			var name = q('timer').value, t = chip.timers[name];
			var ck = clocks(cfg);
			q('sum').textContent = 'SYSCLK ' + mhz(cfg.sysclk) + ' MHz · AHB /' + cfg.ahb + ' · APB1 /' + cfg.apb1 + ' · APB2 /' + cfg.apb2;
			return { chip: chip, cfg: cfg, timerName: name, timer: t, timclk: (t.bus === 1 ? ck.tim1 : ck.tim2) * 1e6, ok: cfg.sysclk > 0 };
		}

		host.addEventListener('change', function (e) {
			if (e.target.getAttribute('data-c') === 'chip') loadChip();
			onChange();
		});
		host.addEventListener('input', function (e) {
			if (e.target.getAttribute('data-c') === 'sysclk') onChange();
		});
		q('toggle').addEventListener('click', function () {
			var open = q('edit').hidden;
			q('edit').hidden = !open;
			q('toggle').setAttribute('aria-expanded', String(open));
			q('toggle').textContent = open ? 'Thu gọn' : 'Sửa clock';
		});

		loadChip();
		return { get: get };
	}

	/* ---------- Tiện ích giao diện ---------- */

	function reg(name, v) {
		return '<div class="kn-stm__reg"><span class="kn-stm__reg-name">' + name + '</span><span class="kn-stm__reg-val">' + v + '</span></div>';
	}
	function stat(label, value) {
		return '<div><dt>' + label + '</dt><dd>' + value + '</dd></div>';
	}
	function copyButton(btn, pre) {
		btn.addEventListener('click', function () {
			var done = function () { btn.textContent = 'Đã chép'; setTimeout(function () { btn.textContent = 'Sao chép'; }, 1500); };
			var fallback = function () {
				var r = document.createRange(); r.selectNodeContents(pre);
				var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
				btn.textContent = 'Nhấn Ctrl+C';
			};
			if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(pre.textContent).then(done, fallback);
			else fallback();
		});
	}
	function mount(slug, build) {
		function init() {
			Array.prototype.forEach.call(document.querySelectorAll('[data-tool="' + slug + '"]'), function (el) {
				if (!el.getAttribute('data-ready')) { el.setAttribute('data-ready', '1'); build(el); }
			});
		}
		if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
		else init();
	}

	return {
		CHIPS: CHIPS, clocks: clocks, solve: solve,
		num: num, fmtHz: fmtHz, fmtTime: fmtTime, fmtErr: fmtErr, esc: esc, parse: parse,
		clockTreeSVG: clockTreeSVG, chainSVG: chainSVG, clockForm: clockForm,
		reg: reg, stat: stat, copyButton: copyButton, mount: mount
	};
})();
