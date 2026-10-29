/**
 * Mạch lọc RC bậc 1: fc = 1 / (2π·R·C), τ = R·C. Tính fc từ R, C, hoặc tìm cặp R, C chuẩn cho fc mong muốn.
 * Đáp ứng: thông thấp |H| = 1/√(1+(f/fc)²), pha −atan(f/fc); thông cao |H| = (f/fc)/√(1+(f/fc)²), pha 90° − atan(f/fc).
 */
(function (E) {
	'use strict';

	var TAU = 2 * Math.PI;
	/* Tụ dãy E6 từ 100 pF tới 68 µF (E.values làm tròn tới 1e-6 nên không dùng được cho tụ) */
	var CAPS = [];
	for (var d = -10; d <= -5; d++) E.E.E6.forEach(function (b) { CAPS.push(Number((b / 10 * Math.pow(10, d)).toPrecision(2))); });

	function resp(type, f, fc) {
		var r = f / fc, mag = type === 'lp' ? 1 / Math.sqrt(1 + r * r) : r / Math.sqrt(1 + r * r);
		var ph = (type === 'lp' ? 0 : 90) - Math.atan(r) * 180 / Math.PI;
		var db = 20 * Math.log10(mag);
		return { mag: mag, db: Math.abs(db) < 0.05 ? 0 : db, ph: Math.abs(ph) < 0.05 ? 0 : ph };
	}

	function circuitSVG(type, r, c) {
		var t = 'font-family:var(--kn-mono);font-size:13px;font-weight:700;fill:var(--kn-ink)';
		var m = 'font-family:var(--kn-mono);font-size:12px;fill:var(--kn-muted)';
		var w = 'stroke:var(--kn-ink);stroke-width:2;fill:none';
		var res = function (x, y, vert) {
			return vert ? '<rect x="' + (x - 10) + '" y="' + y + '" width="20" height="48" rx="2" style="fill:var(--kn-paper);stroke:var(--kn-ink);stroke-width:2"/>'
				: '<rect x="' + x + '" y="' + (y - 10) + '" width="56" height="20" rx="2" style="fill:var(--kn-paper);stroke:var(--kn-ink);stroke-width:2"/>';
		};
		var cap = function (x, y, vert) {
			return vert ? '<path d="M' + (x - 16) + ' ' + y + ' h32 M' + (x - 16) + ' ' + (y + 9) + ' h32" style="stroke:var(--kn-ink);stroke-width:3"/>'
				: '<path d="M' + x + ' ' + (y - 16) + ' v32 M' + (x + 9) + ' ' + (y - 16) + ' v32" style="stroke:var(--kn-ink);stroke-width:3"/>';
		};
		var gnd = '<path d="M200 196 v14 M186 210 h28 M191 217 h18 M196 224 h8" style="' + w + '"/>';
		var series, shunt, sLabel, pLabel;
		if (type === 'lp') {
			series = '<path d="M40 70 H92 M148 70 H300" style="' + w + '"/>' + res(92, 70);
			shunt = '<path d="M200 70 V124 M200 133 V196" style="' + w + '"/>' + cap(200, 124, true);
			sLabel = ['R', E.fmt(r, 'Ω')];
			pLabel = ['C', E.fmt(c, 'F')];
		} else {
			series = '<path d="M40 70 H116 M125 70 H300" style="' + w + '"/>' + cap(116, 70);
			shunt = '<path d="M200 70 V106 M200 154 V196" style="' + w + '"/>' + res(200, 106, true);
			sLabel = ['C', E.fmt(c, 'F')];
			pLabel = ['R', E.fmt(r, 'Ω')];
		}
		return '<svg viewBox="0 0 340 236" role="img" aria-label="Sơ đồ mạch lọc RC ' + (type === 'lp' ? 'thông thấp' : 'thông cao') + '">' +
			series + shunt + gnd +
			'<circle cx="40" cy="70" r="5" style="fill:var(--kn-ink)"/><circle cx="200" cy="70" r="4" style="fill:var(--kn-ink)"/><circle cx="300" cy="70" r="5" style="fill:var(--kn-accent)"/>' +
			'<text x="30" y="52" style="' + t + '">Vin</text><text x="284" y="52" style="' + t + ';fill:var(--kn-accent-ink)">Vout</text>' +
			'<text x="120" y="38" text-anchor="middle" style="' + t + '">' + sLabel[0] + '</text><text x="120" y="104" text-anchor="middle" style="' + m + '">' + E.esc(sLabel[1]) + '</text>' +
			'<text x="226" y="128" style="' + t + '">' + pLabel[0] + '</text><text x="226" y="146" style="' + m + '">' + E.esc(pLabel[1]) + '</text>' +
			'</svg>';
	}

	/* Biểu đồ biên độ (dB) theo tần số, trục log 4 decade quanh fc; đánh dấu fc và tần số tín hiệu f. */
	function bodeSVG(type, fc, f) {
		var W = 560, H = 230, L = 46, R = 34, T = 14, B = 34, pw = W - L - R, ph = H - T - B;
		var d0 = Math.floor(Math.log10(fc)) - 2, d1 = d0 + 5, dbMin = -60;
		var X = function (v) { return L + (Math.log10(v) - d0) / (d1 - d0) * pw; };
		var Y = function (db) { return T + Math.min(1, Math.max(0, db / dbMin)) * ph; };
		var grid = '', lbl = 'font-family:var(--kn-mono);font-size:11px;fill:var(--kn-muted)';
		for (var d = d0; d <= d1; d++) {
			grid += '<path d="M' + X(Math.pow(10, d)).toFixed(1) + ' ' + T + ' V' + (T + ph) + '" style="stroke:var(--kn-line)"/>' +
				'<text x="' + X(Math.pow(10, d)).toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle" style="' + lbl + '">' + E.fmt(Math.pow(10, d), 'Hz', 3).replace(' ', '') + '</text>';
		}
		for (var db = 0; db >= dbMin; db -= 20) {
			grid += '<path d="M' + L + ' ' + Y(db).toFixed(1) + ' H' + (L + pw) + '" style="stroke:var(--kn-line)"/>' +
				'<text x="' + (L - 6) + '" y="' + (Y(db) + 4).toFixed(1) + '" text-anchor="end" style="' + lbl + '">' + db + '</text>';
		}
		var pts = [];
		for (var i = 0; i <= 200; i++) {
			var fr = Math.pow(10, d0 + (d1 - d0) * i / 200);
			pts.push(X(fr).toFixed(1) + ',' + Y(resp(type, fr, fc).db).toFixed(1));
		}
		var mark = function (fr, color, text, anchor, below) {
			if (!(fr > 0) || fr < Math.pow(10, d0) || fr > Math.pow(10, d1)) return '';
			var db = resp(type, fr, fc).db, cx = X(fr).toFixed(1), cy = Y(db).toFixed(1);
			return '<path d="M' + cx + ' ' + T + ' V' + (T + ph) + '" style="stroke:' + color + ';stroke-dasharray:4 4"/>' +
				'<circle cx="' + cx + '" cy="' + cy + '" r="5" style="fill:' + color + '"/>' +
				'<text x="' + (Number(cx) + (anchor === 'end' ? -8 : 8)) + '" y="' + (Number(cy) + (below || db >= -40 ? 18 : -10)) + '" text-anchor="' + anchor + '" style="font-family:var(--kn-mono);font-size:12px;font-weight:700;fill:' + color + '">' + text + '</text>';
		};
		/* Nhãn fc đặt phía dưới, về phía đoạn phẳng của đường cong để không đè lên đường */
		var fcLeft = type === 'lp';
		return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Đáp ứng biên độ theo tần số">' + grid +
			'<text x="' + L + '" y="10" style="' + lbl + '">dB</text>' +
			'<polyline points="' + pts.join(' ') + '" style="fill:none;stroke:var(--kn-accent);stroke-width:2.5"/>' +
			mark(fc, 'var(--kn-accent-ink)', 'fc −3 dB', fcLeft ? 'end' : 'start', true) +
			(f && Math.abs(Math.log10(f / fc)) > 0.05 ? mark(f, 'var(--kn-warn)', 'f ' + resp(type, f, fc).db.toFixed(1) + ' dB', fcLeft ? 'end' : 'start') : '') +
			'</svg>';
	}

	E.mount('mach-loc-rc', function (root) {
		var uid = root.id || 'kn-rc';
		var unit = function (k, label, val, u, hidden) {
			return '<div class="kn-calc__field"' + (hidden ? ' data-show="' + hidden + '"' + (hidden === 'find' ? ' hidden' : '') : '') + '><label for="' + uid + '-' + k + '">' + label + '</label>' +
				'<div class="kn-calc__unit"><input type="text" id="' + uid + '-' + k + '" data-x="' + k + '" value="' + val + '" inputmode="decimal"><span>' + u + '</span></div></div>';
		};
		root.innerHTML =
			'<div class="kn-calc__tabs" role="tablist">' +
				'<button type="button" class="kn-calc__tab" role="tab" data-mode="calc" aria-selected="true">Tính tần số cắt</button>' +
				'<button type="button" class="kn-calc__tab" role="tab" data-mode="find" aria-selected="false">Tìm R, C</button>' +
			'</div>' +
			'<div class="kn-calc__body">' +
				'<div class="kn-calc__inputs">' +
					'<div class="kn-calc__field"><span class="kn-calc__label">Loại mạch lọc</span><div class="kn-calc__seg" data-x="type">' +
						'<button type="button" data-v="lp" aria-pressed="true">Thông thấp</button><button type="button" data-v="hp" aria-pressed="false">Thông cao</button></div></div>' +
					'<div class="kn-calc__row2" data-show="calc">' + unit('r', 'Điện trở R', '10k', 'Ω') + unit('c', 'Tụ C', '100n', 'F') + '</div>' +
					unit('fc', 'Tần số cắt mong muốn fc', '1k', 'Hz', 'find') +
					unit('f', 'Tần số tín hiệu hoặc nhiễu cần xét (tuỳ chọn)', '10k', 'Hz') +
					'<p class="kn-calc__hint">Nhập dạng 10k, 4k7, 100n, 2.2u, 1M. Ví dụ mặc định: lọc thông thấp 10 kΩ, 100 nF, xem nhiễu 10 kHz bị giảm bao nhiêu.</p>' +
					'<div class="kn-calc__figure" data-x="fig"></div>' +
				'</div>' +
				'<div class="kn-calc__results" aria-live="polite" data-x="out"></div>' +
			'</div>' +
			'<div class="kn-calc__more">' +
				'<div><h3 class="kn-calc__h">Đáp ứng tần số</h3><p class="kn-calc__hint">Đường xanh là biên độ ra so với vào (dB). Tại fc tín hiệu giảm 3 dB, tức còn 70.7%; xa hơn mỗi 10 lần tần số giảm thêm 20 dB.</p><div class="kn-calc__figure" data-x="bode"></div></div>' +
				'<div data-show="find" hidden><h3 class="kn-calc__h">Các cặp R, C chuẩn gần nhất</h3><p class="kn-calc__hint">Tụ theo dãy E6 (dễ mua nhất), điện trở theo dãy E24. Bấm vào một dòng để xem chi tiết.</p><div class="kn-calc__table-wrap" data-x="table"></div></div>' +
			'</div>';

		var x = function (k) { return root.querySelector('[data-x="' + k + '"]'); };
		var state = { mode: 'calc', type: 'lp', pairs: [], sel: 0 };

		function setMode(m) {
			state.mode = m;
			Array.prototype.forEach.call(root.querySelectorAll('.kn-calc__tab'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-mode') === m)); });
			Array.prototype.forEach.call(root.querySelectorAll('[data-show]'), function (el) { el.hidden = el.getAttribute('data-show') !== m; });
			state.sel = 0;
			compute();
		}

		function fail(msg) {
			x('out').innerHTML = '<p class="kn-calc__msg is-error">' + msg + '</p>';
			x('fig').innerHTML = '';
			x('bode').innerHTML = '';
			x('table').innerHTML = '';
		}

		function show(r, c, target) {
			var type = state.type, tau = r * c, fc = 1 / (TAU * tau);
			var f = E.parse(x('f').value), sig = f > 0 ? resp(type, f, fc) : null;
			var err = target ? (fc - target) / target : null;
			var msgs = [];
			if (r < 100) msgs.push(['warn', 'R nhỏ hơn 100 Ω: nguồn tín hiệu phía trước phải cấp dòng lớn khi nạp tụ. Nên chọn R từ 1 kΩ trở lên.']);
			if (r > 1e6) msgs.push(['warn', 'R lớn hơn 1 MΩ: dòng rò của tụ và trở kháng vào của tải phía sau (chân ADC, op-amp) sẽ làm lệch fc. Nên tăng C, giảm R.']);
			if (c >= 1e-6) msgs.push(['warn', 'Tụ từ 1 µF trở lên thường là tụ hoá hoặc tụ gốm X5R/X7R, sai số ±10–20% và giảm điện dung khi có điện áp, nên fc thật có thể lệch nhiều.']);
			x('out').innerHTML =
				'<div class="kn-calc__big"><span class="kn-calc__big-label">Tần số cắt fc (−3 dB)</span><span class="kn-calc__big-val">' + E.fmt(fc, 'Hz') + '</span>' +
					(err !== null ? '<span class="kn-calc__big-sub">Sai lệch so với ' + E.fmt(target, 'Hz') + ': ' + (err >= 0 ? '+' : '') + (err * 100).toFixed(2) + '%</span>' : '') + '</div>' +
				'<dl class="kn-calc__stats">' +
					'<div><dt>Hằng số thời gian τ = R·C</dt><dd>' + E.fmt(tau, 's') + '</dd></div>' +
					'<div><dt>' + (type === 'lp' ? 'Thời gian lên 10% → 90%' : 'Thời gian xả 90% → 10%') + '</dt><dd>' + E.fmt(2.197 * tau, 's') + '</dd></div>' +
					'<div><dt>Gần ổn định (5τ, 99.3%)</dt><dd>' + E.fmt(5 * tau, 's') + '</dd></div>' +
					(sig ? '<div><dt>Tại f = ' + E.fmt(f, 'Hz') + ': biên độ ra</dt><dd>' + (sig.mag * 100).toPrecision(3) + '% (' + sig.db.toFixed(1) + ' dB)</dd></div>' +
						'<div><dt>Lệch pha tại f</dt><dd>' + (sig.ph >= 0 ? '+' : '') + sig.ph.toFixed(1) + '°</dd></div>' : '') +
				'</dl>' +
				msgs.map(function (m) { return '<p class="kn-calc__msg is-' + m[0] + '">' + m[1] + '</p>'; }).join('');
			x('fig').innerHTML = circuitSVG(type, r, c);
			x('bode').innerHTML = bodeSVG(type, fc, f > 0 ? f : null);
		}

		function compute() {
			if (state.mode === 'calc') {
				var r = E.parse(x('r').value), c = E.parse(x('c').value);
				if (!(r > 0)) return fail('Nhập điện trở R lớn hơn 0, ví dụ 10k hoặc 4k7.');
				if (!(c > 0)) return fail('Nhập điện dung C lớn hơn 0, ví dụ 100n, 1u hoặc 22p.');
				return show(r, c, null);
			}
			var fc = E.parse(x('fc').value);
			if (!(fc > 0)) return fail('Nhập tần số cắt mong muốn lớn hơn 0, ví dụ 1k hoặc 50.');
			var pairs = [];
			CAPS.forEach(function (c) {
				var r = E.nearest(1 / (TAU * fc * c), 'E24');
				if (!r || r < 100 || r > 1e6) return;
				var f = 1 / (TAU * r * c);
				pairs.push({ r: r, c: c, f: f, err: (f - fc) / fc });
			});
			/* Ưu tiên sai lệch nhỏ, rồi R trong khoảng dễ dùng 1 kΩ – 100 kΩ */
			var pen = function (p) { return Math.abs(p.err) + (p.r < 1e3 || p.r > 1e5 ? 0.02 : 0); };
			pairs.sort(function (p, q) { return pen(p) - pen(q); });
			state.pairs = pairs.slice(0, 8);
			if (!state.pairs.length) return fail('Không tìm được cặp R (100 Ω – 1 MΩ) và C (100 pF – 100 µF) nào cho tần số này.');
			state.sel = Math.min(state.sel, state.pairs.length - 1);
			var p = state.pairs[state.sel];
			show(p.r, p.c, fc);
			x('table').innerHTML = '<table class="kn-calc__table"><thead><tr><th>R</th><th>C</th><th>fc thực tế</th><th>Sai lệch</th></tr></thead><tbody>' +
				state.pairs.map(function (q, i) {
					return '<tr class="is-click' + (i === state.sel ? ' is-active' : '') + '" data-i="' + i + '"><td>' + E.fmt(q.r, 'Ω') + '</td><td>' + E.fmt(q.c, 'F') + '</td><td>' + E.fmt(q.f, 'Hz') +
						'</td><td>' + (q.err >= 0 ? '+' : '') + (q.err * 100).toFixed(2) + '%</td></tr>';
				}).join('') + '</tbody></table>';
		}

		root.addEventListener('click', function (e) {
			var tab = e.target.closest('.kn-calc__tab');
			if (tab) { setMode(tab.getAttribute('data-mode')); return; }
			var b = e.target.closest('[data-x="type"] button');
			if (b) {
				state.type = b.getAttribute('data-v');
				Array.prototype.forEach.call(x('type').querySelectorAll('button'), function (o) { o.setAttribute('aria-pressed', String(o === b)); });
				compute();
				return;
			}
			var tr = e.target.closest('tr[data-i]');
			if (tr) { state.sel = Number(tr.getAttribute('data-i')); compute(); }
		});
		root.addEventListener('input', function (e) {
			if (e.target === x('fc')) state.sel = 0;
			compute();
		});
		compute();
	});
})(window.KNElec);
