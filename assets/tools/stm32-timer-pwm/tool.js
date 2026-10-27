/**
 * STM32 Timer / PWM calculator.
 * f_PWM = f_TIM / ((PSC + 1) * (ARR + 1)),  duty = CCR / (ARR + 1)   (PWM mode 1, đếm lên, edge-aligned)
 */
(function () {
	'use strict';

	var SLUG = 'stm32-timer-pwm';
	var PSC_MAX = 65535;
	var TOP_N = 8;

	var PRESETS = [
		{ id: 'f103', name: 'STM32F103 (Blue Pill) – 72 MHz', clk: 72, width: 16 },
		{ id: 'f401', name: 'STM32F401 (Black Pill) – 84 MHz', clk: 84, width: 16 },
		{ id: 'f411', name: 'STM32F411 (Black Pill) – 100 MHz', clk: 100, width: 16 },
		{ id: 'f407-apb2', name: 'STM32F407 – TIM1, 8–11 (APB2) – 168 MHz', clk: 168, width: 16 },
		{ id: 'f407-apb1', name: 'STM32F407 – TIM2–7, 12–14 (APB1) – 84 MHz', clk: 84, width: 16 },
		{ id: 'g030', name: 'STM32G030 / G031 – 64 MHz', clk: 64, width: 16 },
		{ id: 'custom', name: 'Tự nhập clock', clk: null, width: null }
	];

	var UNITS = [
		{ id: 'Hz', kind: 'f', mul: 1 },
		{ id: 'kHz', kind: 'f', mul: 1e3 },
		{ id: 'MHz', kind: 'f', mul: 1e6 },
		{ id: 's', kind: 't', mul: 1 },
		{ id: 'ms', kind: 't', mul: 1e-3 },
		{ id: 'µs', kind: 't', mul: 1e-6 }
	];

	var TIMERS = ['TIM1', 'TIM2', 'TIM3', 'TIM4', 'TIM5', 'TIM8', 'TIM9', 'TIM10', 'TIM11', 'TIM12', 'TIM13', 'TIM14', 'TIM15', 'TIM16', 'TIM17'];

	/* ---------- Tính toán ---------- */

	/* Điểm "tròn" của tick (Hz), càng nhỏ càng tròn: 1 MHz / 10 kHz -> 0, 2 MHz / 500 kHz -> 1, 9 MHz -> 2, 36 MHz -> 4. */
	function roundness(n) {
		if (!isFinite(n) || n <= 0 || Math.floor(n) !== n) return 99;
		while (n % 10 === 0) n /= 10;
		if (n === 1) return 0;
		if (n === 2 || n === 5) return 1;
		return 1 + String(n).length + (n < 10 ? 0 : 1);
	}

	function solve(fclk, ftarget, maxArr, prefer) {
		var N = fclk / ftarget;
		var out = [];
		for (var psc = 0; psc <= PSC_MAX; psc++) {
			var d = psc + 1;
			var q = N / d;
			if (q < 1.5) break;
			var p = Math.max(2, Math.round(q));
			if (p > maxArr + 1) continue;
			var f = fclk / (d * p);
			var err = (f - ftarget) / ftarget;
			if (Math.abs(err) < 1e-12) err = 0;
			out.push({ psc: psc, arr: p - 1, f: f, err: err, tick: fclk / d });
		}
		out.sort(function (a, b) {
			var ea = Math.abs(a.err), eb = Math.abs(b.err);
			if (Math.abs(ea - eb) > 1e-12) return ea - eb;
			if (prefer === 'round') {
				var sa = roundness(Math.round(a.tick * 1e6) / 1e6), sb = roundness(Math.round(b.tick * 1e6) / 1e6);
				if (sa !== sb) return sa - sb;
			}
			return b.arr - a.arr;
		});
		return { N: N, list: out.slice(0, TOP_N) };
	}

	function ccrFor(duty, arr) {
		return Math.min(arr + 1, Math.max(0, Math.round(duty / 100 * (arr + 1))));
	}

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
		if (err === 0) return '0 %';
		var p = err * 100;
		var s = Math.abs(p) >= 0.0001 ? p.toFixed(4) : p.toPrecision(2);
		return (p > 0 ? '+' : '') + s + ' %';
	}

	function hex(v, width) {
		var digits = width === 32 ? 8 : 4;
		var h = v.toString(16).toUpperCase();
		while (h.length < digits) h = '0' + h;
		return '0x' + h;
	}

	function parse(el) {
		return parseFloat(String(el.value).replace(',', '.'));
	}

	function esc(s) {
		return String(s).replace(/[&<>"]/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
		});
	}

	/* ---------- Dạng sóng (SVG) ---------- */

	function waveSVG(arr, ccr, periodS) {
		var W = 640, H = 178, x0 = 44, xEnd = W - 46, periods = 2.5;
		var P = (xEnd - x0) / periods;
		var yTop = 18, yBot = 92, oHigh = 116, oLow = 146;
		var frac = Math.min(1, ccr / (arr + 1));
		var yCcr = yBot - frac * (yBot - yTop);

		var saw = 'M' + x0 + ' ' + yBot;
		var pwm = 'M' + x0 + ' ' + (frac > 0 ? oHigh : oLow);
		for (var k = 0; k < Math.ceil(periods); k++) {
			var xs = x0 + k * P;
			var xe = Math.min(xEnd, xs + P);
			var span = (xe - xs) / P;
			saw += ' L' + xe.toFixed(1) + ' ' + (yBot - span * (yBot - yTop)).toFixed(1);
			if (xe < xEnd) saw += ' L' + xe.toFixed(1) + ' ' + yBot;

			var xh = xs + frac * P;
			if (frac > 0 && frac < 1) {
				if (xh <= xEnd) pwm += ' L' + xh.toFixed(1) + ' ' + oHigh + ' L' + xh.toFixed(1) + ' ' + oLow;
				else pwm += ' L' + xEnd + ' ' + oHigh;
				if (xe < xEnd) pwm += ' L' + xe.toFixed(1) + ' ' + oLow + ' L' + xe.toFixed(1) + ' ' + oHigh;
				else if (xh <= xEnd) pwm += ' L' + xEnd + ' ' + oLow;
			} else {
				pwm += ' L' + xe.toFixed(1) + ' ' + (frac > 0 ? oHigh : oLow);
			}
		}

		var t = 'font-family:var(--kn-mono);font-size:11px;fill:var(--kn-muted)';
		var grid = 'stroke:var(--kn-line);stroke-width:1';
		var bx = x0, bxe = x0 + P, by = H - 14;

		return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Dạng sóng bộ đếm và tín hiệu PWM">' +
			'<line x1="' + x0 + '" y1="' + yTop + '" x2="' + xEnd + '" y2="' + yTop + '" style="' + grid + ';stroke-dasharray:3 3"/>' +
			'<line x1="' + x0 + '" y1="' + yBot + '" x2="' + xEnd + '" y2="' + yBot + '" style="' + grid + '"/>' +
			'<line x1="' + x0 + '" y1="' + yCcr.toFixed(1) + '" x2="' + xEnd + '" y2="' + yCcr.toFixed(1) + '" style="stroke:var(--kn-warn);stroke-width:1.2;stroke-dasharray:5 4"/>' +
			'<path d="' + saw + '" style="fill:none;stroke:var(--kn-ink);stroke-width:1.6"/>' +
			'<line x1="' + x0 + '" y1="' + oLow + '" x2="' + xEnd + '" y2="' + oLow + '" style="' + grid + '"/>' +
			'<path d="' + pwm + '" style="fill:none;stroke:var(--kn-accent);stroke-width:2.2;stroke-linejoin:round"/>' +
			'<text x="4" y="' + (yTop + (yBot - yTop) / 2 + 4) + '" style="' + t + ';font-weight:700">CNT</text>' +
			'<text x="4" y="' + (oHigh + 18) + '" style="' + t + ';font-weight:700">OCx</text>' +
			'<text x="' + (xEnd + 6) + '" y="' + (yTop + 4) + '" style="' + t + '">ARR</text>' +
			'<text x="' + (xEnd + 6) + '" y="' + (yCcr + 4).toFixed(1) + '" style="' + t + ';fill:var(--kn-warn)">CCR</text>' +
			'<text x="' + (xEnd + 6) + '" y="' + (yBot + 4) + '" style="' + t + '">0</text>' +
			'<line x1="' + bx + '" y1="' + (by - 4) + '" x2="' + bx + '" y2="' + (by + 4) + '" style="' + grid + ';stroke:var(--kn-muted)"/>' +
			'<line x1="' + bxe.toFixed(1) + '" y1="' + (by - 4) + '" x2="' + bxe.toFixed(1) + '" y2="' + (by + 4) + '" style="' + grid + ';stroke:var(--kn-muted)"/>' +
			'<line x1="' + bx + '" y1="' + by + '" x2="' + bxe.toFixed(1) + '" y2="' + by + '" style="' + grid + ';stroke:var(--kn-muted)"/>' +
			'<text x="' + (bx + P / 2).toFixed(1) + '" y="' + (by + 12) + '" text-anchor="middle" style="' + t + ';fill:var(--kn-ink)">T = ' + esc(fmtTime(periodS)) + '</text>' +
			'</svg>';
	}

	/* ---------- Code ---------- */

	function codeFor(kind, o) {
		var tim = o.timer, h = 'h' + tim.toLowerCase(), ch = o.channel;
		var head = '<span class="c">/* f_TIM = ' + esc(fmtHz(o.fclk)) + ' -&gt; PWM ' + esc(fmtHz(o.f)) + ', duty ' + num(o.duty) + ' % */</span>\n';
		if (kind === 'hal') {
			return head +
				h + '.Init.Prescaler = ' + o.psc + ';        <span class="c">// PSC</span>\n' +
				h + '.Init.CounterMode = TIM_COUNTERMODE_UP;\n' +
				h + '.Init.Period = ' + o.arr + ';           <span class="c">// ARR</span>\n' +
				'\n' +
				'HAL_TIM_PWM_Start(&amp;' + h + ', TIM_CHANNEL_' + ch + ');\n' +
				'__HAL_TIM_SET_COMPARE(&amp;' + h + ', TIM_CHANNEL_' + ch + ', ' + o.ccr + ');  <span class="c">// CCR' + ch + '</span>';
		}
		if (kind === 'reg') {
			return head +
				tim + '->PSC  = ' + o.psc + ';\n' +
				tim + '->ARR  = ' + o.arr + ';\n' +
				tim + '->CCR' + ch + ' = ' + o.ccr + ';\n' +
				tim + '->EGR  = TIM_EGR_UG;   <span class="c">// nạp PSC/ARR ngay, không chờ update event</span>';
		}
		var w = o.width + ' bits value';
		return '<span class="c">STM32CubeMX &gt; ' + tim + ' &gt; Parameter Settings</span>\n' +
			'Prescaler (PSC - 16 bits value)            ' + o.psc + '\n' +
			'Counter Mode                               Up\n' +
			'Counter Period (AutoReload Register - ' + w + ')  ' + o.arr + '\n' +
			'<span class="c">PWM Generation Channel ' + ch + '</span>\n' +
			'Mode                                       PWM mode 1\n' +
			'Pulse (' + w + ')                       ' + o.ccr;
	}

	/* ---------- Giao diện ---------- */

	function build(root) {
		var uid = root.id || SLUG;
		var id = function (s) { return uid + '-' + s; };

		var presetOpts = PRESETS.map(function (p) {
			return '<option value="' + p.id + '">' + esc(p.name) + '</option>';
		}).join('');
		var unitOpts = UNITS.map(function (u) {
			return '<option value="' + u.id + '">' + (u.kind === 't' ? 'Chu kỳ ' : '') + u.id + '</option>';
		}).join('');
		var timerOpts = TIMERS.map(function (t) {
			return '<option' + (t === 'TIM2' ? ' selected' : '') + '>' + t + '</option>';
		}).join('');

		root.innerHTML =
			'<div class="kn-tpwm__tabs" role="tablist">' +
				'<button type="button" class="kn-tpwm__tab" role="tab" data-mode="forward" aria-selected="true">Tần số → PSC / ARR</button>' +
				'<button type="button" class="kn-tpwm__tab" role="tab" data-mode="reverse" aria-selected="false">PSC / ARR → Tần số</button>' +
			'</div>' +
			'<div class="kn-tpwm__body">' +
				'<div class="kn-tpwm__inputs">' +
					'<div class="kn-tpwm__field"><label for="' + id('preset') + '">Dòng chip / timer</label>' +
						'<select id="' + id('preset') + '" data-k="preset">' + presetOpts + '</select></div>' +
					'<div class="kn-tpwm__row2">' +
						'<div class="kn-tpwm__field"><label for="' + id('clk') + '">Clock timer (MHz)</label>' +
							'<input type="number" id="' + id('clk') + '" data-k="clk" min="0" step="any" value="72" inputmode="decimal"></div>' +
						'<div class="kn-tpwm__field"><span class="kn-tpwm__label">Độ rộng timer</span>' +
							'<div class="kn-tpwm__seg" data-k="width"><button type="button" data-v="16" aria-pressed="true">16-bit</button><button type="button" data-v="32" aria-pressed="false">32-bit</button></div></div>' +
					'</div>' +
					'<p class="kn-tpwm__hint">Clock timer = clock bus APB, nhân 2 nếu bộ chia APB khác 1. TIM2 và TIM5 trên F4, G4, L4 là 32-bit; mọi timer của F103 là 16-bit.</p>' +

					'<div class="kn-tpwm__field" data-show="forward"><label for="' + id('target') + '">Tần số hoặc chu kỳ mong muốn</label>' +
						'<div class="kn-tpwm__pair"><input type="number" id="' + id('target') + '" data-k="target" min="0" step="any" value="1" inputmode="decimal">' +
						'<select id="' + id('unit') + '" data-k="unit" aria-label="Đơn vị">' + unitOpts + '</select></div></div>' +
					'<div class="kn-tpwm__field" data-show="forward"><label for="' + id('duty') + '">Duty cycle (%)</label>' +
						'<input type="number" id="' + id('duty') + '" data-k="duty" min="0" max="100" step="any" value="25" inputmode="decimal"></div>' +
					'<div class="kn-tpwm__field" data-show="forward"><span class="kn-tpwm__label">Khi có nhiều cặp cho cùng sai số, ưu tiên</span>' +
						'<div class="kn-tpwm__seg" data-k="prefer"><button type="button" data-v="round" aria-pressed="true">Tick tròn số</button><button type="button" data-v="res" aria-pressed="false">Độ phân giải cao</button></div></div>' +

					'<div class="kn-tpwm__row2" data-show="reverse" hidden>' +
						'<div class="kn-tpwm__field"><label for="' + id('psc') + '">PSC</label><input type="number" id="' + id('psc') + '" data-k="psc" min="0" max="65535" step="1" value="71"></div>' +
						'<div class="kn-tpwm__field"><label for="' + id('arr') + '">ARR</label><input type="number" id="' + id('arr') + '" data-k="arr" min="1" step="1" value="999"></div>' +
					'</div>' +
					'<div class="kn-tpwm__field" data-show="reverse" hidden><label for="' + id('ccr') + '">CCR (Pulse)</label><input type="number" id="' + id('ccr') + '" data-k="ccr" min="0" step="1" value="250"></div>' +

					'<div class="kn-tpwm__formula">f = f_TIM / ((PSC+1) × (ARR+1))<br>duty = CCR / (ARR+1)</div>' +
				'</div>' +
				'<div class="kn-tpwm__results" aria-live="polite" data-out="results"></div>' +
			'</div>' +
			'<div class="kn-tpwm__more">' +
				'<div><div class="kn-tpwm__section-head"><h3>Code cấu hình</h3>' +
					'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
						'<select data-k="timer" aria-label="Timer" style="width:auto;height:32px">' + timerOpts + '</select>' +
						'<select data-k="channel" aria-label="Kênh" style="width:auto;height:32px"><option value="1">CH1</option><option value="2">CH2</option><option value="3">CH3</option><option value="4">CH4</option></select>' +
						'<div class="kn-tpwm__seg" data-k="code"><button type="button" data-v="hal" aria-pressed="true" style="height:30px;padding:0 10px">HAL</button><button type="button" data-v="reg" aria-pressed="false" style="height:30px;padding:0 10px">Thanh ghi</button><button type="button" data-v="cube" aria-pressed="false" style="height:30px;padding:0 10px">CubeMX</button></div>' +
						'<button type="button" class="kn-tpwm__btn" data-act="copy">Sao chép</button>' +
					'</div></div>' +
					'<pre class="kn-tpwm__code" data-out="code"></pre></div>' +
				'<div data-show="forward"><div class="kn-tpwm__section-head"><h3>Các phương án khác</h3><span class="kn-tpwm__hint">Bấm vào một dòng để dùng phương án đó</span></div>' +
					'<div class="kn-tpwm__table-wrap" data-out="table"></div></div>' +
			'</div>';

		var state = { mode: 'forward', width: 16, prefer: 'round', code: 'hal', sel: 0, cache: null };
		var q = function (k) { return root.querySelector('[data-k="' + k + '"]'); };
		var out = function (k) { return root.querySelector('[data-out="' + k + '"]'); };

		function setSeg(k, v) {
			state[k] = k === 'width' ? Number(v) : v;
			Array.prototype.forEach.call(q(k).querySelectorAll('button'), function (b) {
				b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === String(v)));
			});
		}

		function setMode(m) {
			state.mode = m;
			Array.prototype.forEach.call(root.querySelectorAll('.kn-tpwm__tab'), function (b) {
				b.setAttribute('aria-selected', String(b.getAttribute('data-mode') === m));
			});
			Array.prototype.forEach.call(root.querySelectorAll('[data-show]'), function (el) {
				el.hidden = el.getAttribute('data-show') !== m;
			});
		}

		function regCard(name, v, width) {
			return '<div class="kn-tpwm__reg"><span class="kn-tpwm__reg-name">' + name + '</span>' +
				'<span class="kn-tpwm__reg-val">' + v + '</span>' +
				'<span class="kn-tpwm__reg-hex">' + hex(v, width) + '</span></div>';
		}

		function stat(label, value) {
			return '<div><dt>' + label + '</dt><dd>' + value + '</dd></div>';
		}

		function renderResult(r, msgs) {
			var bits = Math.log2(r.arr + 1);
			var errBadge = r.err === undefined ? '' :
				(r.err === 0 ? ' <span class="kn-tpwm__badge">Chính xác</span>' : ' <span class="kn-tpwm__badge is-warn">' + fmtErr(r.err) + '</span>');
			out('results').innerHTML =
				'<div class="kn-tpwm__regs">' +
					regCard('PSC', r.psc, 16) + regCard('ARR', r.arr, state.width) + regCard('CCR', r.ccr, state.width) +
				'</div>' +
				'<dl class="kn-tpwm__stats">' +
					stat('Tần số thực', esc(fmtHz(r.f)) + errBadge) +
					stat('Chu kỳ', esc(fmtTime(1 / r.f))) +
					stat('Duty thực', num(r.ccr / (r.arr + 1) * 100) + ' %') +
					stat('Độ rộng xung', esc(fmtTime(r.ccr / (r.arr + 1) / r.f))) +
					stat('Tick timer', esc(fmtHz(r.tick)) + ' · ' + esc(fmtTime(1 / r.tick))) +
					stat('Độ phân giải duty', (r.arr + 1) + ' bước · ' + num(Math.round(bits * 10) / 10) + ' bit') +
				'</dl>' +
				msgs.map(function (m) { return '<div class="kn-tpwm__msg is-' + m[0] + '">' + m[1] + '</div>'; }).join('') +
				'<div class="kn-tpwm__wave">' + waveSVG(r.arr, r.ccr, 1 / r.f) + '</div>';

			var timer = q('timer').value, channel = q('channel').value;
			state.codeOpts = { timer: timer, channel: channel, fclk: r.fclk, f: r.f, duty: r.ccr / (r.arr + 1) * 100, psc: r.psc, arr: r.arr, ccr: r.ccr, width: state.width };
			out('code').innerHTML = codeFor(state.code, state.codeOpts);
		}

		function renderError(msg) {
			out('results').innerHTML = '<div class="kn-tpwm__msg is-error">' + msg + '</div>';
			out('code').innerHTML = '<span class="c">/* Nhập thông số hợp lệ để sinh code */</span>';
			out('table').innerHTML = '';
			state.codeOpts = null;
		}

		function warnings(r) {
			var m = [];
			if (r.arr + 1 < 100) m.push(['warn', 'Chỉ có ' + (r.arr + 1) + ' mức duty. Muốn chỉnh duty mịn hơn, hãy hạ tần số PWM hoặc tăng clock timer.']);
			if (r.err !== undefined && r.err !== 0) m.push(['warn', 'Không có cặp PSC/ARR cho đúng tần số này với clock ' + esc(fmtHz(r.fclk)) + '. Đây là phương án sai số nhỏ nhất.']);
			return m;
		}

		function compute(keepSel) {
			var fclk = parse(q('clk')) * 1e6;
			var maxArr = state.width === 32 ? 4294967295 : 65535;
			if (!(fclk > 0)) return renderError('Nhập clock timer lớn hơn 0.');

			if (state.mode === 'reverse') {
				var psc = Math.floor(parse(q('psc'))), arr = Math.floor(parse(q('arr'))), ccr = Math.floor(parse(q('ccr')));
				if (!(psc >= 0 && psc <= PSC_MAX)) return renderError('PSC phải nằm trong khoảng 0 – 65535.');
				if (!(arr >= 1 && arr <= maxArr)) return renderError('ARR phải nằm trong khoảng 1 – ' + maxArr + ' với timer ' + state.width + '-bit.');
				if (!(ccr >= 0)) return renderError('CCR phải từ 0 trở lên.');
				var msgs = [];
				if (ccr > arr + 1) { msgs.push(['warn', 'CCR lớn hơn ARR + 1 nên ngõ ra luôn ở mức cao (duty 100 %).']); ccr = arr + 1; }
				var r = { psc: psc, arr: arr, ccr: ccr, fclk: fclk, tick: fclk / (psc + 1), f: fclk / ((psc + 1) * (arr + 1)) };
				return renderResult(r, msgs.concat(warnings(r)));
			}

			var unit = UNITS.filter(function (u) { return u.id === q('unit').value; })[0];
			var tv = parse(q('target')) * unit.mul;
			var duty = parse(q('duty'));
			if (!(tv > 0)) return renderError('Nhập ' + (unit.kind === 'f' ? 'tần số' : 'chu kỳ') + ' lớn hơn 0.');
			if (!(duty >= 0 && duty <= 100)) return renderError('Duty cycle phải nằm trong khoảng 0 – 100 %.');
			var ft = unit.kind === 'f' ? tv : 1 / tv;

			if (fclk / ft < 1.5) return renderError('Tần số quá cao. Với clock ' + esc(fmtHz(fclk)) + ', PWM tối đa là ' + esc(fmtHz(fclk / 2)) + ' (ARR = 1).');
			var res = solve(fclk, ft, maxArr, state.prefer);
			if (!res.list.length) {
				return renderError('Tần số quá thấp. Với timer ' + state.width + '-bit, PWM thấp nhất là ' + esc(fmtHz(fclk / (65536 * (maxArr + 1)))) +
					(state.width === 16 ? '. Hãy dùng timer 32-bit hoặc đếm thêm trong ngắt update.' : '.'));
			}
			if (!keepSel) state.sel = 0;
			var best = res.list[state.sel] || res.list[0];
			best.ccr = ccrFor(duty, best.arr);
			best.fclk = fclk;
			renderResult(best, warnings(best));

			out('table').innerHTML = '<table class="kn-tpwm__table"><thead><tr><th>PSC</th><th>ARR</th><th>Tick</th><th>Tần số thực</th><th>Sai số</th><th>Mức duty</th></tr></thead><tbody>' +
				res.list.map(function (c, i) {
					return '<tr data-i="' + i + '"' + (i === state.sel ? ' class="is-active"' : '') + '><td>' + c.psc + '</td><td>' + c.arr + '</td><td>' + esc(fmtHz(c.tick)) +
						'</td><td>' + esc(fmtHz(c.f)) + '</td><td>' + fmtErr(c.err) + '</td><td>' + (c.arr + 1) + '</td></tr>';
				}).join('') + '</tbody></table>';
		}

		/* Sự kiện */
		root.addEventListener('input', function (e) {
			var k = e.target.getAttribute('data-k');
			if (k === 'clk') {
				var v = parse(q('clk'));
				var match = PRESETS.filter(function (p) { return p.clk === v && p.id === q('preset').value; })[0];
				if (!match) q('preset').value = 'custom';
			}
			if (k === 'timer' || k === 'channel') {
				if (state.codeOpts) {
					state.codeOpts.timer = q('timer').value;
					state.codeOpts.channel = q('channel').value;
					out('code').innerHTML = codeFor(state.code, state.codeOpts);
				}
				return;
			}
			compute(k === 'duty');
		});

		root.addEventListener('change', function (e) {
			var k = e.target.getAttribute('data-k');
			if (k === 'preset') {
				var p = PRESETS.filter(function (x) { return x.id === e.target.value; })[0];
				if (p && p.clk) { q('clk').value = p.clk; setSeg('width', p.width); }
				compute(false);
			} else if (k === 'unit') {
				compute(false);
			}
		});

		root.addEventListener('click', function (e) {
			var tab = e.target.closest('.kn-tpwm__tab');
			if (tab) { setMode(tab.getAttribute('data-mode')); compute(false); return; }

			var segBtn = e.target.closest('.kn-tpwm__seg button');
			if (segBtn) {
				var k = segBtn.parentNode.getAttribute('data-k');
				setSeg(k, segBtn.getAttribute('data-v'));
				if (k === 'code') { if (state.codeOpts) out('code').innerHTML = codeFor(state.code, state.codeOpts); }
				else compute(false);
				return;
			}

			var row = e.target.closest('.kn-tpwm__table tbody tr');
			if (row) { state.sel = Number(row.getAttribute('data-i')); compute(true); return; }

			var copy = e.target.closest('[data-act="copy"]');
			if (copy) {
				var pre = out('code');
				var text = pre.textContent;
				var done = function () { copy.textContent = 'Đã chép'; setTimeout(function () { copy.textContent = 'Sao chép'; }, 1500); };
				var fallback = function () {
					var range = document.createRange();
					range.selectNodeContents(pre);
					var s = window.getSelection(); s.removeAllRanges(); s.addRange(range);
					copy.textContent = 'Nhấn Ctrl+C';
				};
				if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
				else fallback();
			}
		});

		/* Ví dụ mặc định: Blue Pill 72 MHz, PWM 1 kHz, duty 25 % */
		q('unit').value = 'kHz';
		compute(false);
	}

	function init() {
		Array.prototype.forEach.call(document.querySelectorAll('[data-tool="' + SLUG + '"]'), function (el) {
			if (!el.getAttribute('data-ready')) { el.setAttribute('data-ready', '1'); build(el); }
		});
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
	else init();
})();
