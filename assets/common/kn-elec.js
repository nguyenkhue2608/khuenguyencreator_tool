/**
 * Hàm dùng chung cho các tool điện tử: đọc/ghi giá trị có tiền tố SI, dãy điện trở chuẩn E, bảng mã màu.
 */
window.KNElec = (function () {
	'use strict';

	var SI = { p: 1e-12, n: 1e-9, u: 1e-6, 'µ': 1e-6, m: 1e-3, k: 1e3, K: 1e3, M: 1e6, G: 1e9 };

	/* "4.7k", "4k7", "4,7 kΩ", "2M2", "0R47", "470" -> số. Trả NaN nếu không đọc được. */
	function parse(str) {
		var s = String(str == null ? '' : str).trim().replace(/\s+/g, '').replace(/Ω|ohm|ohms/gi, '').replace(/[VAW]$/i, '').replace(',', '.');
		if (!s) return NaN;
		var m = s.match(/^(\d*)([pnuµmkKMGR])(\d+)$/); /* kiểu 4k7, 0R47 */
		if (m) return parseFloat((m[1] || '0') + '.' + m[3]) * (m[2] === 'R' ? 1 : SI[m[2]]);
		m = s.match(/^([+-]?\d*\.?\d+(?:e[+-]?\d+)?)([pnuµmkKMGR]?)$/i);
		if (!m) return NaN;
		var unit = m[2];
		if (unit === 'R' || unit === 'r' || unit === '') return parseFloat(m[1]);
		if (unit === 'K') unit = 'k';
		return parseFloat(m[1]) * (SI[unit] || NaN);
	}

	function trim(v, digits) {
		return String(parseFloat(v.toPrecision(digits || 4)));
	}

	/* 4700, 'Ω' -> "4.7 kΩ" */
	function fmt(v, unit, digits) {
		if (!isFinite(v)) return '–';
		if (v === 0) return '0 ' + unit;
		var a = Math.abs(v), steps = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
		for (var i = 0; i < steps.length; i++) {
			if (a >= steps[i][0] * 0.9995) return trim(v / steps[i][0], digits) + ' ' + steps[i][1] + unit;
		}
		return trim(v / 1e-12, digits) + ' p' + unit;
	}

	var E = {
		E6: [10, 15, 22, 33, 47, 68],
		E12: [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82],
		E24: [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91],
		E96: [100, 102, 105, 107, 110, 113, 115, 118, 121, 124, 127, 130, 133, 137, 140, 143, 147, 150, 154, 158, 162, 165, 169, 174, 178,
			182, 187, 191, 196, 200, 205, 210, 215, 221, 226, 232, 237, 243, 249, 255, 261, 267, 274, 280, 287, 294, 301, 309, 316, 324, 332,
			340, 348, 357, 365, 374, 383, 392, 402, 412, 422, 432, 442, 453, 464, 475, 487, 499, 511, 523, 536, 549, 562, 576, 590, 604, 619,
			634, 649, 665, 681, 698, 715, 732, 750, 768, 787, 806, 825, 845, 866, 887, 909, 931, 953, 976]
	};

	/* Mọi giá trị của một dãy E trong khoảng [lo, hi] */
	function values(series, lo, hi) {
		var base = E[series], div = base[0], out = [];
		for (var d = Math.floor(Math.log10(lo)) - 1; d <= Math.ceil(Math.log10(hi)); d++) {
			base.forEach(function (b) {
				var v = Math.round(b / div * Math.pow(10, d) * 1e6) / 1e6;
				if (v >= lo * 0.999999 && v <= hi * 1.000001) out.push(v);
			});
		}
		return out;
	}

	/* Giá trị chuẩn gần nhất; mode 'up' = nhỏ nhất mà >= v, 'down' = lớn nhất mà <= v */
	function nearest(v, series, mode) {
		var list = values(series, v / 12, v * 12), best = null;
		list.forEach(function (x) {
			if (mode === 'up' && x < v * 0.999999) return;
			if (mode === 'down' && x > v * 1.000001) return;
			if (!best || Math.abs(Math.log(x / v)) < Math.abs(Math.log(best / v))) best = x;
		});
		return best;
	}

	function inSeries(v, series) {
		var n = nearest(v, series);
		return n !== null && Math.abs(n - v) / v < 1e-6;
	}

	/* Bảng màu theo IEC 60062 */
	var COLORS = [
		{ id: 'black', name: 'Đen', hex: '#1b1b1b', ink: '#fff', digit: 0, mult: 1, tc: 250 },
		{ id: 'brown', name: 'Nâu', hex: '#7b4a26', ink: '#fff', digit: 1, mult: 10, tol: 1, tc: 100 },
		{ id: 'red', name: 'Đỏ', hex: '#d32f2f', ink: '#fff', digit: 2, mult: 100, tol: 2, tc: 50 },
		{ id: 'orange', name: 'Cam', hex: '#f57c00', ink: '#fff', digit: 3, mult: 1e3, tol: 0.05, tc: 15 },
		{ id: 'yellow', name: 'Vàng', hex: '#fdd835', ink: '#222', digit: 4, mult: 1e4, tol: 0.02, tc: 25 },
		{ id: 'green', name: 'Lục', hex: '#2e7d32', ink: '#fff', digit: 5, mult: 1e5, tol: 0.5, tc: 20 },
		{ id: 'blue', name: 'Lam', hex: '#1e5bd8', ink: '#fff', digit: 6, mult: 1e6, tol: 0.25, tc: 10 },
		{ id: 'violet', name: 'Tím', hex: '#7b1fa2', ink: '#fff', digit: 7, mult: 1e7, tol: 0.1, tc: 5 },
		{ id: 'grey', name: 'Xám', hex: '#8a8f94', ink: '#fff', digit: 8, mult: 1e8, tol: 0.05, tc: 1 },
		{ id: 'white', name: 'Trắng', hex: '#f5f5f5', ink: '#222', digit: 9, mult: 1e9 },
		{ id: 'gold', name: 'Nhũ vàng', hex: '#c9a227', ink: '#222', mult: 0.1, tol: 5 },
		{ id: 'silver', name: 'Nhũ bạc', hex: '#b8bec4', ink: '#222', mult: 0.01, tol: 10 },
		{ id: 'none', name: 'Không có', hex: 'transparent', ink: '#222', tol: 20 }
	];
	var COLOR = {};
	COLORS.forEach(function (c) { COLOR[c.id] = c; });

	function esc(s) {
		return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
		});
	}
	function copyText(btn, getText) {
		btn.addEventListener('click', function () {
			var label = btn.textContent;
			var done = function () { btn.textContent = 'Đã chép'; setTimeout(function () { btn.textContent = label; }, 1500); };
			if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(getText()).then(done, function () { btn.textContent = 'Không chép được'; });
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

	return { parse: parse, fmt: fmt, trim: trim, E: E, values: values, nearest: nearest, inSeries: inSeries,
		COLORS: COLORS, COLOR: COLOR, esc: esc, copyText: copyText, mount: mount };
})();
