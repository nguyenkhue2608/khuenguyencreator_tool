/**
 * Mã màu điện trở 4, 5, 6 vạch: chọn màu -> giá trị, hoặc nhập giá trị -> màu.
 */
(function (E) {
	'use strict';

	var DIGITS = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'];
	var MULTS = DIGITS.concat(['gold', 'silver']);
	var TOLS = ['brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'gold', 'silver'];
	var TCS = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey'];

	function roles(n) {
		var nd = n === 4 ? 2 : 3, r = [];
		for (var i = 0; i < nd; i++) r.push('digit');
		r.push('mult', 'tol');
		if (n === 6) r.push('tc');
		return r;
	}
	var ROLE_NAME = { digit: 'chữ số', mult: 'hệ số nhân', tol: 'sai số', tc: 'hệ số nhiệt' };

	function allowed(role, idx, n) {
		if (role === 'digit') return idx === 0 ? DIGITS.slice(1) : DIGITS;
		if (role === 'mult') return MULTS;
		if (role === 'tol') return n === 4 ? TOLS.concat(['none']) : TOLS;
		return TCS;
	}

	function decode(bands) {
		var r = roles(bands.length), digits = '', mult = 1, tol = 20, tc = null;
		bands.forEach(function (id, i) {
			var c = E.COLOR[id];
			if (r[i] === 'digit') digits += c.digit;
			else if (r[i] === 'mult') mult = c.mult;
			else if (r[i] === 'tol') tol = c.tol;
			else tc = c.tc;
		});
		return { value: parseInt(digits, 10) * mult, tol: tol, tc: tc };
	}

	/* Giá trị -> các vạch chữ số + hệ số. Trả { colors, exact } hoặc null nếu ngoài khả năng biểu diễn. */
	function encode(v, nd) {
		if (!(v > 0)) return null;
		var e = Math.floor(Math.log10(v) + 1e-9) - (nd - 1);
		var digits = Math.round(v / Math.pow(10, e));
		if (digits >= Math.pow(10, nd)) { digits = Math.round(digits / 10); e += 1; }
		if (e < -2 || e > 9) return null;
		var s = String(digits), colors = [];
		for (var i = 0; i < nd; i++) colors.push(DIGITS[Number(s[i])]);
		colors.push(e === -1 ? 'gold' : e === -2 ? 'silver' : DIGITS[e]);
		var real = digits * Math.pow(10, e);
		return { colors: colors, exact: Math.abs(real - v) / v < 1e-9, real: real };
	}

	function multText(m) {
		return '×' + (m < 1 ? String(m) : E.fmt(m, '', 3).replace(' ', ''));
	}

	function seriesOf(v) {
		var list = ['E6', 'E12', 'E24', 'E96'];
		for (var i = 0; i < list.length; i++) if (E.inSeries(v, list[i])) return list[i];
		return null;
	}

	/* ---------- Hình điện trở ---------- */

	function resistorSVG(bands) {
		var n = bands.length, metal = n > 4;
		var body = metal ? '#8fbcd9' : '#e3c99a', bodyEdge = metal ? '#5d8fb0' : '#b89a63';
		var xs = n === 4 ? [168, 204, 240, 352] : n === 5 ? [160, 192, 224, 256, 352] : [156, 186, 216, 246, 330, 364];
		var r = roles(n);
		var s = '<svg viewBox="0 0 520 150" role="img" aria-label="Hình điện trở ' + n + ' vạch màu">' +
			'<line x1="8" y1="62" x2="512" y2="62" style="stroke:#9aa1a8;stroke-width:5;stroke-linecap:round"/>' +
			'<path d="M118 34 q0 -14 22 -14 h26 q12 0 18 8 h152 q6 -8 18 -8 h26 q22 0 22 14 v56 q0 14 -22 14 h-26 q-12 0 -18 -8 h-152 q-6 8 -18 8 h-26 q-22 0 -22 -14 Z" style="fill:' + body + ';stroke:' + bodyEdge + ';stroke-width:1.5"/>';
		bands.forEach(function (id, i) {
			var c = E.COLOR[id], x = xs[i];
			var h = (x < 170 || x > 350) ? 84 : 68, y = 62 - h / 2;
			if (id === 'none') {
				s += '<rect x="' + (x - 9) + '" y="' + y + '" width="18" height="' + h + '" style="fill:none;stroke:' + bodyEdge + ';stroke-dasharray:3 3"/>';
			} else {
				s += '<rect class="kn-res__band" data-band="' + i + '" x="' + (x - 9) + '" y="' + y + '" width="18" height="' + h + '" style="fill:' + c.hex + ';stroke:rgba(0,0,0,.25);stroke-width:1;cursor:pointer"/>';
			}
			var cap = r[i] === 'digit' ? String(c.digit) : r[i] === 'mult' ? multText(c.mult) : r[i] === 'tol' ? '±' + c.tol + '%' : c.tc + 'ppm';
			s += '<text x="' + x + '" y="134" text-anchor="middle" style="font-family:var(--kn-mono);font-size:12px;font-weight:700;fill:var(--kn-ink)">' + E.esc(cap) + '</text>';
		});
		return s + '</svg>';
	}

	E.mount('ma-mau-dien-tro', function (root) {
		var uid = root.id || 'kn-res';
		root.innerHTML =
			'<div class="kn-calc__body">' +
				'<div class="kn-calc__inputs">' +
					'<div class="kn-calc__field"><span class="kn-calc__label">Số vạch màu</span>' +
						'<div class="kn-calc__seg" data-x="n"><button type="button" data-v="4" aria-pressed="true">4 vạch</button><button type="button" data-v="5" aria-pressed="false">5 vạch</button><button type="button" data-v="6" aria-pressed="false">6 vạch</button></div></div>' +
					'<div class="kn-calc__field"><label for="' + uid + '-v">Nhập giá trị để ra màu</label>' +
						'<div class="kn-calc__unit"><input type="text" id="' + uid + '-v" data-x="v" placeholder="VD: 4.7k, 4k7, 220, 1M" autocomplete="off"><span>Ω</span></div></div>' +
					'<div class="kn-res__bands" data-x="bands"></div>' +
				'</div>' +
				'<div class="kn-calc__results">' +
					'<div class="kn-calc__figure kn-res__fig" data-x="fig"></div>' +
					'<div aria-live="polite" data-x="out"></div>' +
				'</div>' +
			'</div>' +
			'<div class="kn-calc__more"><div><h3 class="kn-calc__h">Bảng mã màu điện trở</h3><div class="kn-calc__table-wrap" data-x="table"></div></div></div>';

		var x = function (k) { return root.querySelector('[data-x="' + k + '"]'); };
		var state = { bands: ['yellow', 'violet', 'red', 'gold'], note: null };

		function renderBands() {
			var n = state.bands.length, r = roles(n);
			x('bands').innerHTML = state.bands.map(function (id, i) {
				var opts = allowed(r[i], i, n).map(function (cid) {
					var c = E.COLOR[cid];
					return '<button type="button" class="kn-res__sw' + (cid === 'none' ? ' is-none' : '') + '" data-band="' + i + '" data-c="' + cid + '" aria-pressed="' + (cid === id) + '"' +
						' title="' + E.esc(c.name) + '" aria-label="' + E.esc(c.name) + '" style="background:' + c.hex + '"></button>';
				}).join('');
				return '<div class="kn-res__row" data-row="' + i + '"><div class="kn-res__row-h"><span>Vạch ' + (i + 1) + ' · ' + ROLE_NAME[r[i]] + '</span><b>' + E.esc(E.COLOR[id].name) + '</b></div>' +
					'<div class="kn-res__sws">' + opts + '</div></div>';
			}).join('');
		}

		function render() {
			var d = decode(state.bands), n = state.bands.length;
			var lo = d.value * (1 - d.tol / 100), hi = d.value * (1 + d.tol / 100);
			var ser = seriesOf(d.value);
			x('fig').innerHTML = resistorSVG(state.bands);
			var msgs = [];
			if (state.note) msgs.push(['warn', state.note]);
			if (!ser) msgs.push(['warn', 'Giá trị này không thuộc dãy chuẩn E6–E96. Có thể bạn đang đọc ngược chiều: vạch sai số (thường là nhũ vàng hoặc nâu) nằm bên phải và cách xa các vạch còn lại.']);
			x('out').innerHTML =
				'<div class="kn-calc__big"><span class="kn-calc__big-label">Giá trị điện trở</span>' +
					'<span class="kn-calc__big-val">' + E.fmt(d.value, 'Ω') + ' ±' + d.tol + '%</span>' +
					'<span class="kn-calc__big-sub">' + state.bands.filter(function (b) { return b !== 'none'; }).map(function (b) { return E.COLOR[b].name; }).join(' · ') + '</span></div>' +
				'<dl class="kn-calc__stats">' +
					'<div><dt>Giá trị thực nằm trong</dt><dd>' + E.fmt(lo, 'Ω') + ' – ' + E.fmt(hi, 'Ω') + '</dd></div>' +
					'<div><dt>Thuộc dãy chuẩn</dt><dd>' + (ser || 'Không') + '</dd></div>' +
					(d.tc !== null ? '<div><dt>Hệ số nhiệt</dt><dd>' + d.tc + ' ppm/°C</dd></div>' : '') +
					'<div><dt>Loại thường gặp</dt><dd>' + (n === 4 ? 'Than (carbon film)' : 'Màng kim loại (metal film)') + '</dd></div>' +
				'</dl>' +
				msgs.map(function (m) { return '<p class="kn-calc__msg is-' + m[0] + '">' + m[1] + '</p>'; }).join('');
		}

		function setCount(n) {
			var cur = decode(state.bands), tolColor = state.bands[roles(state.bands.length).indexOf('tol')];
			var enc = encode(cur.value, n === 4 ? 2 : 3);
			/* Điện trở 5, 6 vạch là loại màng kim loại chính xác: mặc định ±1% (nâu) */
			if (n > 4 && ['none', 'gold', 'silver'].indexOf(tolColor) >= 0) tolColor = 'brown';
			state.bands = (enc ? enc.colors : (n === 4 ? ['brown', 'black', 'red'] : ['brown', 'black', 'black', 'brown'])).concat([tolColor]);
			if (n === 6) state.bands.push('brown');
			state.note = enc && !enc.exact ? 'Giá trị được làm tròn còn ' + (n === 4 ? 2 : 3) + ' chữ số có nghĩa.' : null;
			Array.prototype.forEach.call(x('n').querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(Number(b.getAttribute('data-v')) === n)); });
			renderBands();
			render();
		}

		x('n').addEventListener('click', function (e) {
			var b = e.target.closest('button[data-v]');
			if (b) setCount(Number(b.getAttribute('data-v')));
		});
		x('bands').addEventListener('click', function (e) {
			var b = e.target.closest('.kn-res__sw');
			if (!b) return;
			state.bands[Number(b.getAttribute('data-band'))] = b.getAttribute('data-c');
			state.note = null;
			x('v').value = '';
			renderBands();
			render();
		});
		x('fig').addEventListener('click', function (e) {
			var band = e.target.closest('.kn-res__band');
			if (!band) return;
			var row = x('bands').querySelector('[data-row="' + band.getAttribute('data-band') + '"]');
			if (row) { row.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); row.querySelector('[aria-pressed="true"]').focus(); }
		});
		x('v').addEventListener('input', function () {
			var raw = x('v').value.trim();
			if (!raw) return;
			var v = E.parse(raw), n = state.bands.length;
			var enc = encode(v, n === 4 ? 2 : 3);
			if (!enc) {
				state.note = null;
				x('out').innerHTML = '<p class="kn-calc__msg is-error">Không đọc được "' + E.esc(raw) + '". Nhập số kèm đơn vị như 220, 4.7k, 4k7, 1M; mã màu biểu diễn được từ 0.1 Ω tới hàng trăm GΩ.</p>';
				return;
			}
			var r = roles(n);
			state.bands = enc.colors.concat(state.bands.slice(r.indexOf('tol')));
			state.note = enc.exact ? null : 'Giá trị được làm tròn còn ' + (n === 4 ? 2 : 3) + ' chữ số có nghĩa: ' + E.fmt(enc.real, 'Ω') + '.';
			renderBands();
			render();
		});

		/* Bảng tra màu */
		x('table').innerHTML = '<table class="kn-calc__table"><thead><tr><th>Màu</th><th>Chữ số</th><th>Hệ số nhân</th><th>Sai số</th><th>Hệ số nhiệt</th></tr></thead><tbody>' +
			E.COLORS.filter(function (c) { return c.id !== 'none'; }).map(function (c) {
				return '<tr><td><span class="kn-res__dot" style="background:' + c.hex + '"></span>' + E.esc(c.name) + '</td><td>' + (c.digit != null ? c.digit : '') + '</td>' +
					'<td>' + multText(c.mult) + '</td><td>' + (c.tol ? '±' + c.tol + '%' : '') + '</td><td>' + (c.tc ? c.tc + ' ppm/°C' : '') + '</td></tr>';
			}).join('') + '<tr><td><span class="kn-res__dot is-none"></span>Không có vạch</td><td></td><td></td><td>±20%</td><td></td></tr></tbody></table>';

		renderBands();
		render();
	});
})(window.KNElec);
