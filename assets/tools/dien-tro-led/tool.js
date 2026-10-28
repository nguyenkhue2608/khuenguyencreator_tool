/**
 * Điện trở hạn dòng LED: R = (Vs − n × Vf) / I, chọn giá trị chuẩn lớn hơn gần nhất và công suất điện trở.
 */
(function (E) {
	'use strict';

	var LEDS = [
		{ id: 'red', name: 'Đỏ', vf: 2.0, color: '#e53935' },
		{ id: 'yellow', name: 'Vàng', vf: 2.1, color: '#fbc02d' },
		{ id: 'orange', name: 'Cam', vf: 2.1, color: '#fb8c00' },
		{ id: 'green', name: 'Xanh lá (loại thường)', vf: 2.2, color: '#43a047' },
		{ id: 'green-hb', name: 'Xanh lá sáng (InGaN)', vf: 3.0, color: '#00c853' },
		{ id: 'blue', name: 'Xanh dương', vf: 3.0, color: '#1e88e5' },
		{ id: 'white', name: 'Trắng', vf: 3.0, color: '#e0e0e0' },
		{ id: 'uv', name: 'Tím / UV', vf: 3.3, color: '#8e24aa' },
		{ id: 'ir', name: 'Hồng ngoại (IR)', vf: 1.2, color: '#6d4c41' },
		{ id: 'custom', name: 'Tự nhập Vf', vf: null, color: '#9e9e9e' }
	];
	var WATTS = [0.125, 0.25, 0.5, 1, 2, 3, 5];
	var WNAME = { 0.125: '1/8 W', 0.25: '1/4 W', 0.5: '1/2 W', 1: '1 W', 2: '2 W', 3: '3 W', 5: '5 W' };

	function ledSVG(vs, r, n, led, i) {
		var t = 'font-family:var(--kn-mono);font-size:13px;font-weight:700;fill:var(--kn-ink)';
		var m = 'font-family:var(--kn-mono);font-size:12px;fill:var(--kn-muted)';
		var w = 'stroke:var(--kn-ink);stroke-width:2;fill:none';
		var show = Math.min(n, 3), y = 150, s = '';
		for (var k = 0; k < show; k++) {
			s += '<path d="M100 ' + y + ' V' + (y + 6) + '" style="' + w + '"/>' +
				'<path d="M86 ' + (y + 6) + ' H114 L100 ' + (y + 30) + ' Z" style="fill:' + led.color + ';stroke:var(--kn-ink);stroke-width:2"/>' +
				'<path d="M86 ' + (y + 30) + ' H114" style="' + w + '"/>' +
				'<path d="M118 ' + (y + 10) + ' l12 -10 m-6 0 h6 v6 M122 ' + (y + 20) + ' l12 -10 m-6 0 h6 v6" style="stroke:' + led.color + ';stroke-width:1.6;fill:none"/>';
			y += 36;
		}
		if (n > show) { s += '<text x="120" y="' + (y - 8) + '" style="' + m + '">… ' + n + ' LED nối tiếp</text>'; }
		return '<svg viewBox="0 0 320 ' + (y + 44) + '" role="img" aria-label="Sơ đồ nối điện trở với LED">' +
			'<circle cx="100" cy="20" r="5" style="fill:var(--kn-ink)"/><text x="114" y="25" style="' + t + '">' + E.esc(E.fmt(vs, 'V')) + '</text>' +
			'<path d="M100 25 V54" style="' + w + '"/>' +
			'<rect x="88" y="54" width="24" height="56" rx="2" style="fill:var(--kn-paper);stroke:var(--kn-ink);stroke-width:2"/>' +
			'<text x="124" y="80" style="' + t + '">R</text><text x="124" y="97" style="' + m + '">' + E.esc(E.fmt(r, 'Ω')) + '</text>' +
			'<path d="M100 110 V150" style="' + w + '"/>' +
			'<path d="M74 118 v20 m-5 -6 l5 6 l5 -6" style="stroke:var(--kn-accent);stroke-width:2;fill:none"/>' +
			'<text x="66" y="134" text-anchor="end" style="' + t + ';fill:var(--kn-accent-ink)">' + E.esc(E.fmt(i, 'A')) + '</text>' +
			s +
			'<path d="M100 ' + y + ' V' + (y + 16) + ' M82 ' + (y + 16) + ' H118 M88 ' + (y + 24) + ' H112 M95 ' + (y + 32) + ' H105" style="' + w + '"/>' +
			'</svg>';
	}

	E.mount('dien-tro-led', function (root) {
		var uid = root.id || 'kn-led';
		root.innerHTML =
			'<div class="kn-calc__body">' +
				'<div class="kn-calc__inputs">' +
					'<div class="kn-calc__row2">' +
						'<div class="kn-calc__field"><label for="' + uid + '-vs">Điện áp nguồn</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-vs" data-x="vs" value="5" inputmode="decimal"><span>V</span></div></div>' +
						'<div class="kn-calc__field"><label for="' + uid + '-i">Dòng qua LED</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-i" data-x="i" value="10" inputmode="decimal"><span>mA</span></div></div>' +
					'</div>' +
					'<div class="kn-calc__field"><label for="' + uid + '-c">Màu LED</label><select id="' + uid + '-c" data-x="c">' +
						LEDS.map(function (l) { return '<option value="' + l.id + '">' + E.esc(l.name) + (l.vf ? ' – ' + l.vf + 'V' : '') + '</option>'; }).join('') + '</select></div>' +
					'<div class="kn-calc__row2">' +
						'<div class="kn-calc__field"><label for="' + uid + '-vf">Điện áp LED Vf</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-vf" data-x="vf" value="2" inputmode="decimal"><span>V</span></div></div>' +
						'<div class="kn-calc__field"><label for="' + uid + '-n">Số LED nối tiếp</label><input type="number" id="' + uid + '-n" data-x="n" value="1" min="1" max="20" step="1"></div>' +
					'</div>' +
					'<div class="kn-calc__field"><span class="kn-calc__label">Chọn điện trở theo dãy</span><div class="kn-calc__seg" data-x="ser"><button type="button" data-v="E12" aria-pressed="true">E12 (dễ mua)</button><button type="button" data-v="E24" aria-pressed="false">E24</button></div></div>' +
					'<p class="kn-calc__hint">Vf lấy theo giá trị điển hình; xem datasheet LED để có số chính xác. LED 5 mm thông thường chạy tốt ở 5–20 mA.</p>' +
				'</div>' +
				'<div class="kn-calc__results">' +
					'<div aria-live="polite" data-x="out"></div>' +
					'<div class="kn-calc__figure" data-x="fig"></div>' +
				'</div>' +
			'</div>' +
			'<div class="kn-calc__more"><div><h3 class="kn-calc__h">Bảng tra nhanh (10 mA, dãy E12)</h3><div class="kn-calc__table-wrap" data-x="table"></div></div></div>';

		var x = function (k) { return root.querySelector('[data-x="' + k + '"]'); };
		var state = { ser: 'E12' };
		var ledOf = function () { var id = x('c').value; return LEDS.filter(function (l) { return l.id === id; })[0]; };

		function compute() {
			var vs = E.parse(x('vs').value), i = E.parse(x('i').value) / 1000, vf = E.parse(x('vf').value), n = Math.max(1, Math.floor(Number(x('n').value) || 1));
			var led = ledOf();
			if (!(vs > 0) || !(i > 0) || !(vf > 0)) {
				x('out').innerHTML = '<p class="kn-calc__msg is-error">Nhập điện áp nguồn, dòng LED và Vf lớn hơn 0.</p>';
				x('fig').innerHTML = '';
				return;
			}
			var drop = vs - n * vf;
			if (drop <= 0) {
				x('out').innerHTML = '<p class="kn-calc__msg is-error">Nguồn ' + E.fmt(vs, 'V') + ' không đủ cho ' + n + ' LED (cần hơn ' + E.fmt(n * vf, 'V') + '). Giảm số LED nối tiếp hoặc tăng điện áp nguồn.</p>';
				x('fig').innerHTML = '';
				return;
			}
			var rExact = drop / i, r = E.nearest(rExact, state.ser, 'up');
			var iReal = drop / r, pR = iReal * iReal * r, pLed = iReal * vf;
			var watt = WATTS.filter(function (w) { return w >= pR * 2; })[0];
			var msgs = [];
			if (drop < 0.5) msgs.push(['warn', 'Điện áp còn lại cho điện trở rất nhỏ (' + E.fmt(drop, 'V') + '): độ sáng sẽ thay đổi nhiều theo nguồn và theo từng LED. Nên để dư ít nhất 1V.']);
			if (iReal > 0.02) msgs.push(['warn', 'Dòng trên 20 mA: không nên cấp trực tiếp từ chân GPIO của vi điều khiển. Dùng transistor hoặc MOSFET để đóng cắt LED.']);
			if (iReal > 0.03 && n === 1) msgs.push(['warn', 'LED 3 mm, 5 mm thông thường chỉ chịu khoảng 20–30 mA liên tục. Kiểm tra datasheet nếu dùng dòng lớn.']);
			if (pR > 0.25) msgs.push(['warn', 'Điện trở tỏa nhiệt ' + E.fmt(pR, 'W') + ', cần loại ' + (watt ? WNAME[watt] : 'công suất lớn') + '. Với dải LED dài, cân nhắc dùng mạch dòng hằng.']);
			x('out').innerHTML =
				'<div class="kn-calc__big"><span class="kn-calc__big-label">Điện trở nên dùng (' + state.ser + ')</span>' +
					'<span class="kn-calc__big-val">' + E.fmt(r, 'Ω') + (watt ? ' · ' + WNAME[watt] : '') + '</span>' +
					'<span class="kn-calc__big-sub">Giá trị tính được ' + E.fmt(rExact, 'Ω', 4) + ', chọn giá trị chuẩn lớn hơn gần nhất để dòng không vượt mức đặt.</span></div>' +
				'<dl class="kn-calc__stats">' +
					'<div><dt>Dòng thực tế</dt><dd>' + E.fmt(iReal, 'A') + '</dd></div>' +
					'<div><dt>Điện áp trên điện trở</dt><dd>' + E.fmt(drop, 'V') + '</dd></div>' +
					'<div><dt>Công suất trên điện trở</dt><dd>' + E.fmt(pR, 'W') + '</dd></div>' +
					'<div><dt>Công suất mỗi LED</dt><dd>' + E.fmt(pLed, 'W') + '</dd></div>' +
				'</dl>' +
				msgs.map(function (m) { return '<p class="kn-calc__msg is-' + m[0] + '">' + m[1] + '</p>'; }).join('');
			x('fig').innerHTML = ledSVG(vs, r, n, led, iReal);
		}

		x('c').addEventListener('change', function () {
			var led = ledOf();
			if (led.vf) x('vf').value = led.vf;
			else x('vf').focus();
			compute();
		});
		x('vf').addEventListener('input', function () {
			var v = E.parse(x('vf').value), cur = ledOf();
			if (cur.vf && v !== cur.vf) x('c').value = 'custom';
		});
		x('ser').addEventListener('click', function (e) {
			var b = e.target.closest('button[data-v]');
			if (!b) return;
			state.ser = b.getAttribute('data-v');
			Array.prototype.forEach.call(x('ser').querySelectorAll('button'), function (btn) { btn.setAttribute('aria-pressed', String(btn === b)); });
			compute();
		});
		root.addEventListener('input', compute);

		/* Bảng tra nhanh */
		var supplies = [3.3, 5, 9, 12];
		x('table').innerHTML = '<table class="kn-calc__table"><thead><tr><th>Màu LED (Vf)</th>' + supplies.map(function (v) { return '<th>Nguồn ' + v + 'V</th>'; }).join('') + '</tr></thead><tbody>' +
			LEDS.filter(function (l) { return l.vf && l.id !== 'orange' && l.id !== 'green-hb'; }).map(function (l) {
				return '<tr><td>' + E.esc(l.name) + ' (' + l.vf + 'V)</td>' + supplies.map(function (v) {
					var d = v - l.vf;
					return '<td>' + (d > 0.3 ? E.fmt(E.nearest(d / 0.01, 'E12', 'up'), 'Ω') : '–') + '</td>';
				}).join('') + '</tr>';
			}).join('') + '</tbody></table>';

		compute();
	});
})(window.KNElec);
