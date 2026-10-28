/**
 * Bề rộng đường mạch PCB theo IPC-2221: I = k × ΔT^0.44 × A^0.725 (A: mil², k = 0.048 lớp ngoài, 0.024 lớp trong).
 * Kèm điện trở, sụt áp, công suất theo chiều dài đường mạch.
 */
(function (E) {
	'use strict';

	var OZ_UM = 34.79;            /* 1 oz/ft² đồng = 34.79 µm */
	var MIL_MM = 0.0254;
	var RHO = 1.724e-8;           /* điện trở suất đồng ở 20 °C, Ω·m */
	var ALPHA = 0.00393;          /* hệ số nhiệt điện trở của đồng */
	var K = { ext: 0.048, int: 0.024 };

	function widthMil(I, dT, oz, layer) {
		var area = Math.pow(I / (K[layer] * Math.pow(dT, 0.44)), 1 / 0.725); /* mil² */
		return area / (oz * OZ_UM / 25.4);                                     /* chia bề dày (mil) */
	}

	function traceSVG(wMm, tUm) {
		var t = 'font-family:var(--kn-mono);font-size:12px;fill:var(--kn-ink)';
		return '<svg viewBox="0 0 360 150" role="img" aria-label="Mặt cắt đường mạch">' +
			'<rect x="20" y="70" width="320" height="50" rx="2" style="fill:#2f6b3e"/>' +
			'<text x="30" y="108" style="font-family:var(--kn-mono);font-size:11px;fill:#d9efe0">FR4</text>' +
			'<rect x="110" y="50" width="140" height="20" style="fill:#c98a2b;stroke:#8a5a14"/>' +
			'<path d="M110 36 H250 M110 30 v12 M250 30 v12" style="stroke:var(--kn-accent);stroke-width:1.6;fill:none"/>' +
			'<text x="180" y="26" text-anchor="middle" style="' + t + ';font-weight:700;fill:var(--kn-accent-ink)">W = ' + E.esc(E.trim(wMm, 3)) + ' mm</text>' +
			'<path d="M262 50 V70 M256 50 h12 M256 70 h12" style="stroke:var(--kn-ink);stroke-width:1.4;fill:none"/>' +
			'<text x="274" y="64" style="' + t + '">t = ' + E.esc(E.trim(tUm, 3)) + ' µm</text>' +
			'<text x="180" y="142" text-anchor="middle" style="font-family:var(--kn-mono);font-size:11px;fill:var(--kn-muted)">Mặt cắt ngang (không theo tỉ lệ)</text>' +
			'</svg>';
	}

	E.mount('be-rong-duong-mach-pcb', function (root) {
		var uid = root.id || 'kn-pcbw';
		root.innerHTML =
			'<div class="kn-calc__body">' +
				'<div class="kn-calc__inputs">' +
					'<div class="kn-calc__row2">' +
						'<div class="kn-calc__field"><label for="' + uid + '-i">Dòng điện</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-i" data-x="i" value="2" inputmode="decimal"><span>A</span></div></div>' +
						'<div class="kn-calc__field"><label for="' + uid + '-dt">Độ tăng nhiệt cho phép</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-dt" data-x="dt" value="10" inputmode="decimal"><span>°C</span></div></div>' +
					'</div>' +
					'<div class="kn-calc__field"><span class="kn-calc__label">Độ dày đồng</span><div class="kn-calc__seg" data-x="oz">' +
						[0.5, 1, 2, 3].map(function (o) { return '<button type="button" data-v="' + o + '" aria-pressed="' + (o === 1) + '">' + o + ' oz</button>'; }).join('') + '</div></div>' +
					'<div class="kn-calc__row2">' +
						'<div class="kn-calc__field"><label for="' + uid + '-l">Chiều dài đường mạch</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-l" data-x="l" value="50" inputmode="decimal"><span>mm</span></div></div>' +
						'<div class="kn-calc__field"><label for="' + uid + '-ta">Nhiệt độ môi trường</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-ta" data-x="ta" value="25" inputmode="decimal"><span>°C</span></div></div>' +
					'</div>' +
					'<p class="kn-calc__hint">1 oz = 35 µm, là độ dày mặc định của hầu hết nhà mạch (JLCPCB, PCBWay). Độ tăng nhiệt 10 °C là mức an toàn hay dùng.</p>' +
					'<div class="kn-calc__figure" data-x="fig"></div>' +
				'</div>' +
				'<div class="kn-calc__results" aria-live="polite" data-x="out"></div>' +
			'</div>' +
			'<div class="kn-calc__more"><div><h3 class="kn-calc__h" data-x="th"></h3><div class="kn-calc__table-wrap" data-x="table"></div></div></div>';

		var x = function (k) { return root.querySelector('[data-x="' + k + '"]'); };
		var st = { oz: 1 };

		function block(label, wMil, I, L, Ta, dT) {
			var wMm = wMil * MIL_MM, tM = st.oz * OZ_UM * 1e-6;
			var rho = RHO * (1 + ALPHA * (Ta + dT - 20));
			var R = rho * (L / 1000) / (wMm / 1000 * tM);
			return { label: label, wMil: wMil, wMm: wMm, R: R, V: R * I, P: R * I * I };
		}

		function compute() {
			var I = E.parse(x('i').value), dT = E.parse(x('dt').value), L = E.parse(x('l').value), Ta = E.parse(x('ta').value);
			if (!(I > 0) || !(dT > 0)) {
				x('out').innerHTML = '<p class="kn-calc__msg is-error">Nhập dòng điện và độ tăng nhiệt lớn hơn 0.</p>';
				return;
			}
			if (!(L >= 0)) L = 0;
			if (!isFinite(Ta)) Ta = 25;
			var ext = block('Lớp ngoài (top, bottom)', widthMil(I, dT, st.oz, 'ext'), I, L, Ta, dT);
			var inn = block('Lớp trong (mạch 4 lớp trở lên)', widthMil(I, dT, st.oz, 'int'), I, L, Ta, dT);
			var msgs = [];
			if (I > 35 || dT > 100 || dT < 10) msgs.push(['warn', 'Ngoài phạm vi dữ liệu gốc của IPC-2221 (dòng tới 35 A, độ tăng nhiệt 10–100 °C). Kết quả chỉ mang tính tham khảo.']);
			if (ext.wMil > 400) msgs.push(['warn', 'Đường mạch rộng hơn 10 mm: cân nhắc dùng đồng dày hơn, đổ polygon, hoặc chia dòng ra nhiều lớp nối bằng via.']);
			if (ext.wMm < 0.15) msgs.push(['ok', 'Bề rộng tính ra nhỏ hơn 0.15 mm, mức tối thiểu phổ biến của nhà mạch giá rẻ. Hãy vẽ tối thiểu 0.2–0.25 mm cho dễ sản xuất.']);
			function card(b) {
				return '<div class="kn-calc__big"><span class="kn-calc__big-label">' + b.label + '</span>' +
					'<span class="kn-calc__big-val">' + E.trim(b.wMm, 3) + ' mm</span>' +
					'<span class="kn-calc__big-sub">' + E.trim(b.wMil, 4) + ' mil' + (L > 0 ? ' · ' + E.fmt(b.R, 'Ω') + ' · sụt áp ' + E.fmt(b.V, 'V') + ' · tỏa nhiệt ' + E.fmt(b.P, 'W') : '') + '</span></div>';
			}
			x('out').innerHTML = card(ext) + card(inn) +
				'<dl class="kn-calc__stats">' +
					'<div><dt>Độ dày đồng</dt><dd>' + E.trim(st.oz * OZ_UM, 3) + ' µm</dd></div>' +
					'<div><dt>Tiết diện cần (lớp ngoài)</dt><dd>' + E.trim(ext.wMil * st.oz * OZ_UM / 25.4, 4) + ' mil²</dd></div>' +
					'<div><dt>Nhiệt độ đường mạch</dt><dd>' + E.trim(Ta + dT, 4) + ' °C</dd></div>' +
				'</dl>' +
				msgs.map(function (m) { return '<p class="kn-calc__msg is-' + m[0] + '">' + m[1] + '</p>'; }).join('');
			x('fig').innerHTML = traceSVG(ext.wMm, st.oz * OZ_UM);

			x('th').textContent = 'Bảng tra nhanh (đồng ' + st.oz + ' oz, tăng ' + E.trim(dT, 3) + ' °C)';
			var currents = [0.5, 1, 2, 3, 5, 7, 10, 15, 20];
			x('table').innerHTML = '<table class="kn-calc__table"><thead><tr><th>Dòng</th><th>Lớp ngoài</th><th>Lớp trong</th></tr></thead><tbody>' +
				currents.map(function (c) {
					return '<tr><td>' + c + ' A</td><td>' + E.trim(widthMil(c, dT, st.oz, 'ext') * MIL_MM, 3) + ' mm</td><td>' + E.trim(widthMil(c, dT, st.oz, 'int') * MIL_MM, 3) + ' mm</td></tr>';
				}).join('') + '</tbody></table>';
		}

		x('oz').addEventListener('click', function (e) {
			var b = e.target.closest('button[data-v]');
			if (!b) return;
			st.oz = Number(b.getAttribute('data-v'));
			Array.prototype.forEach.call(x('oz').querySelectorAll('button'), function (btn) { btn.setAttribute('aria-pressed', String(btn === b)); });
			compute();
		});
		root.addEventListener('input', compute);
		compute();
	});
})(window.KNElec);
