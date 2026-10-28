/**
 * Trở kháng microstrip (đường tín hiệu lớp ngoài trên mặt phẳng GND).
 * Công thức Hammerstad–Jensen, hiệu chỉnh bề dày đồng theo Bahl; sai số thường dưới vài %.
 */
(function (E) {
	'use strict';

	var OZ_MM = 0.03479;
	var MATS = [
		{ id: 'fr4', name: 'FR4 thường (εr 4.3)', er: 4.3 },
		{ id: 'jlc', name: 'FR4 JLCPCB 7628 (εr 4.4)', er: 4.4 },
		{ id: 'jlc2116', name: 'FR4 prepreg 2116 (εr 4.16)', er: 4.16 },
		{ id: 'ro4350', name: 'Rogers RO4350B (εr 3.66)', er: 3.66 },
		{ id: 'ro4003', name: 'Rogers RO4003C (εr 3.55)', er: 3.55 },
		{ id: 'custom', name: 'Tự nhập εr', er: null }
	];

	/* Trả { z0, eeff } cho bề rộng w, chiều cao điện môi h, bề dày đồng t (cùng đơn vị), hằng số điện môi er */
	function microstrip(w, h, t, er) {
		var we = w;
		if (t > 0) {
			we = w / h >= 1 / (2 * Math.PI) ?
				w + (t / Math.PI) * (1 + Math.log(2 * h / t)) :
				w + (t / Math.PI) * (1 + Math.log(4 * Math.PI * w / t));
		}
		var u = we / h;
		var eeff = (er + 1) / 2 + (er - 1) / 2 * (1 / Math.sqrt(1 + 12 / u) + (u < 1 ? 0.04 * Math.pow(1 - u, 2) : 0));
		var z0 = u <= 1 ?
			60 / Math.sqrt(eeff) * Math.log(8 / u + u / 4) :
			120 * Math.PI / (Math.sqrt(eeff) * (u + 1.393 + 0.667 * Math.log(u + 1.444)));
		return { z0: z0, eeff: eeff };
	}

	/* Tìm w cho Z0 mục tiêu bằng chia đôi (Z0 giảm khi w tăng) */
	function solveW(z, h, t, er) {
		var lo = h * 0.01, hi = h * 20;
		if (microstrip(lo, h, t, er).z0 < z || microstrip(hi, h, t, er).z0 > z) return null;
		for (var i = 0; i < 80; i++) {
			var mid = Math.sqrt(lo * hi);
			if (microstrip(mid, h, t, er).z0 > z) lo = mid; else hi = mid;
		}
		return Math.sqrt(lo * hi);
	}

	function stackSVG(w, h, t, z) {
		var m = 'font-family:var(--kn-mono);font-size:12px;fill:var(--kn-ink)';
		return '<svg viewBox="0 0 360 170" role="img" aria-label="Mặt cắt microstrip">' +
			'<rect x="20" y="62" width="320" height="56" style="fill:#2f6b3e"/>' +
			'<rect x="20" y="118" width="320" height="12" style="fill:#c98a2b"/>' +
			'<text x="28" y="142" style="font-family:var(--kn-mono);font-size:11px;fill:var(--kn-muted)">GND (lớp liền kề)</text>' +
			'<rect x="130" y="50" width="100" height="12" style="fill:#c98a2b;stroke:#8a5a14"/>' +
			'<path d="M130 38 H230 M130 32 v12 M230 32 v12" style="stroke:var(--kn-accent);stroke-width:1.6;fill:none"/>' +
			'<text x="180" y="27" text-anchor="middle" style="' + m + ';font-weight:700;fill:var(--kn-accent-ink)">W = ' + E.esc(E.trim(w, 3)) + ' mm</text>' +
			'<path d="M300 62 V118 M294 62 h12 M294 118 h12" style="stroke:#d9efe0;stroke-width:1.4;fill:none"/>' +
			'<text x="292" y="95" text-anchor="end" style="font-family:var(--kn-mono);font-size:12px;fill:#d9efe0">H = ' + E.esc(E.trim(h, 3)) + ' mm</text>' +
			'<text x="240" y="60" style="' + m + '">t = ' + E.esc(E.trim(t * 1000, 3)) + ' µm</text>' +
			'<text x="180" y="160" text-anchor="middle" style="' + m + ';font-weight:700">Z0 ≈ ' + E.esc(E.trim(z, 3)) + ' Ω</text>' +
			'</svg>';
	}

	E.mount('tro-khang-microstrip', function (root) {
		var uid = root.id || 'kn-ms';
		root.innerHTML =
			'<div class="kn-calc__tabs" role="tablist">' +
				'<button type="button" class="kn-calc__tab" role="tab" data-mode="find" aria-selected="true">Tìm bề rộng cho Z0</button>' +
				'<button type="button" class="kn-calc__tab" role="tab" data-mode="calc" aria-selected="false">Tính Z0 từ bề rộng</button>' +
			'</div>' +
			'<div class="kn-calc__body">' +
				'<div class="kn-calc__inputs">' +
					'<div class="kn-calc__field" data-show="find"><label for="' + uid + '-z">Trở kháng mong muốn</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-z" data-x="z" value="50" inputmode="decimal"><span>Ω</span></div></div>' +
					'<div class="kn-calc__field" data-show="calc" hidden><label for="' + uid + '-w">Bề rộng đường mạch W</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-w" data-x="w" value="0.35" inputmode="decimal"><span>mm</span></div></div>' +
					'<div class="kn-calc__field"><label for="' + uid + '-h">Chiều dày điện môi H (tới lớp GND gần nhất)</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-h" data-x="h" value="0.2" inputmode="decimal"><span>mm</span></div></div>' +
					'<div class="kn-calc__row2">' +
						'<div class="kn-calc__field"><label for="' + uid + '-m">Vật liệu</label><select id="' + uid + '-m" data-x="m">' +
							MATS.map(function (m) { return '<option value="' + m.id + '"' + (m.id === 'jlc2116' ? ' selected' : '') + '>' + E.esc(m.name) + '</option>'; }).join('') + '</select></div>' +
						'<div class="kn-calc__field"><label for="' + uid + '-er">εr</label><input type="text" id="' + uid + '-er" data-x="er" value="4.16" inputmode="decimal"></div>' +
					'</div>' +
					'<div class="kn-calc__field"><span class="kn-calc__label">Độ dày đồng lớp ngoài</span><div class="kn-calc__seg" data-x="oz">' +
						[0.5, 1, 2].map(function (o) { return '<button type="button" data-v="' + o + '" aria-pressed="' + (o === 1) + '">' + o + ' oz</button>'; }).join('') + '</div></div>' +
					'<p class="kn-calc__hint">Mạch 2 lớp dày 1.6 mm thì H = 1.6 mm (đường 50 Ω rộng gần 3 mm). Mạch 4 lớp thì H là lớp prepreg giữa lớp ngoài và lớp GND, thường 0.1–0.2 mm; xem stackup của nhà mạch.</p>' +
				'</div>' +
				'<div class="kn-calc__results">' +
					'<div aria-live="polite" data-x="out"></div>' +
					'<div class="kn-calc__figure" data-x="fig"></div>' +
				'</div>' +
			'</div>';

		var x = function (k) { return root.querySelector('[data-x="' + k + '"]'); };
		var st = { mode: 'find', oz: 1 };

		function compute() {
			var h = E.parse(x('h').value), er = E.parse(x('er').value), t = st.oz * OZ_MM;
			if (!(h > 0) || !(er >= 1)) {
				x('out').innerHTML = '<p class="kn-calc__msg is-error">Nhập chiều dày điện môi lớn hơn 0 và εr từ 1 trở lên.</p>';
				x('fig').innerHTML = '';
				return;
			}
			var w, r, head;
			if (st.mode === 'find') {
				var z = E.parse(x('z').value);
				if (!(z > 0)) { x('out').innerHTML = '<p class="kn-calc__msg is-error">Nhập trở kháng mong muốn, ví dụ 50 hoặc 90.</p>'; return; }
				w = solveW(z, h, t, er);
				if (!w) { x('out').innerHTML = '<p class="kn-calc__msg is-error">Không tìm được bề rộng hợp lý cho ' + E.trim(z, 4) + ' Ω với điện môi này. Thử đổi chiều dày H.</p>'; x('fig').innerHTML = ''; return; }
				r = microstrip(w, h, t, er);
				head = '<div class="kn-calc__big"><span class="kn-calc__big-label">Bề rộng đường mạch cho ' + E.trim(z, 4) + ' Ω</span><span class="kn-calc__big-val">' + E.trim(w, 3) + ' mm</span>' +
					'<span class="kn-calc__big-sub">' + E.trim(w / 0.0254, 3) + ' mil</span></div>';
			} else {
				w = E.parse(x('w').value);
				if (!(w > 0)) { x('out').innerHTML = '<p class="kn-calc__msg is-error">Nhập bề rộng đường mạch lớn hơn 0.</p>'; return; }
				r = microstrip(w, h, t, er);
				head = '<div class="kn-calc__big"><span class="kn-calc__big-label">Trở kháng đặc tính Z0</span><span class="kn-calc__big-val">' + E.trim(r.z0, 3) + ' Ω</span>' +
					'<span class="kn-calc__big-sub">W/H = ' + E.trim(w / h, 3) + '</span></div>';
			}
			var delay = 3.3356 * Math.sqrt(r.eeff); /* ps/mm */
			var msgs = [];
			if (w / h < 0.1 || w / h > 10) msgs.push(['warn', 'Tỉ lệ W/H nằm ngoài khoảng 0.1–10 nên công thức kém chính xác hơn.']);
			if (w < 0.1) msgs.push(['warn', 'Bề rộng dưới 0.1 mm: vượt khả năng của hầu hết nhà mạch giá rẻ. Hãy chọn stackup có lớp điện môi mỏng hơn hoặc dày hơn cho phù hợp.']);
			x('out').innerHTML = head +
				'<dl class="kn-calc__stats">' +
					'<div><dt>Hằng số điện môi hiệu dụng εeff</dt><dd>' + E.trim(r.eeff, 4) + '</dd></div>' +
					'<div><dt>Thời gian truyền</dt><dd>' + E.trim(delay, 3) + ' ps/mm</dd></div>' +
					'<div><dt>Vận tốc truyền</dt><dd>' + E.trim(1 / Math.sqrt(r.eeff) * 100, 3) + ' % tốc độ ánh sáng</dd></div>' +
					'<div><dt>Bề dày đồng</dt><dd>' + E.trim(t * 1000, 3) + ' µm</dd></div>' +
				'</dl>' +
				msgs.map(function (m) { return '<p class="kn-calc__msg is-' + m[0] + '">' + m[1] + '</p>'; }).join('') +
				'<p class="kn-calc__msg is-ok">Công thức gần đúng (sai số vài %). Với mạch cần kiểm soát trở kháng, hãy đặt hàng kèm yêu cầu impedance control và dùng bề rộng theo bảng của nhà mạch.</p>';
			x('fig').innerHTML = stackSVG(w, h, t, r.z0);
		}

		root.addEventListener('click', function (e) {
			var tab = e.target.closest('.kn-calc__tab');
			if (tab) {
				st.mode = tab.getAttribute('data-mode');
				Array.prototype.forEach.call(root.querySelectorAll('.kn-calc__tab'), function (b) { b.setAttribute('aria-selected', String(b === tab)); });
				Array.prototype.forEach.call(root.querySelectorAll('[data-show]'), function (el) { el.hidden = el.getAttribute('data-show') !== st.mode; });
				compute();
				return;
			}
			var b = e.target.closest('[data-x="oz"] button');
			if (b) {
				st.oz = Number(b.getAttribute('data-v'));
				Array.prototype.forEach.call(x('oz').querySelectorAll('button'), function (btn) { btn.setAttribute('aria-pressed', String(btn === b)); });
				compute();
			}
		});
		x('m').addEventListener('change', function () {
			var m = MATS.filter(function (q) { return q.id === x('m').value; })[0];
			if (m.er) x('er').value = m.er; else x('er').focus();
			compute();
		});
		x('er').addEventListener('input', function () {
			var m = MATS.filter(function (q) { return q.id === x('m').value; })[0];
			if (m.er && E.parse(x('er').value) !== m.er) x('m').value = 'custom';
		});
		root.addEventListener('input', compute);
		compute();
	});
})(window.KNElec);
