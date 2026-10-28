/**
 * Op-amp: khuếch đại không đảo, đảo, vi sai. Hệ số, Vout lý tưởng và thực tế (bị kẹp theo loại op-amp),
 * băng thông ước lượng từ GBW, và tìm cặp điện trở chuẩn cho hệ số mong muốn.
 */
(function (E) {
	'use strict';

	/* hi/lo: điện áp ra cách đường nguồn trên/dưới tối thiểu (V); gbw: Hz */
	var AMPS = [
		{ id: 'rr', name: 'Rail-to-rail (MCP6002, LMV358…)', hi: 0.05, lo: 0.05, gbw: 1e6 },
		{ id: 'lm358', name: 'LM358 / LM324', hi: 1.5, lo: 0.02, gbw: 1e6 },
		{ id: 'tl072', name: 'TL072 / TL082', hi: 1.5, lo: 1.5, gbw: 3e6 },
		{ id: 'ideal', name: 'Lý tưởng (không giới hạn)', hi: 0, lo: 0, gbw: Infinity }
	];
	var MODES = {
		non: { name: 'Không đảo', ra: 'Rf', rb: 'Rg' },
		inv: { name: 'Đảo', ra: 'Rf', rb: 'Rin' },
		diff: { name: 'Vi sai', ra: 'Rf', rb: 'Rin' }
	};

	function ampSVG(mode, rf, rb) {
		var t = 'font-family:var(--kn-mono);font-size:12px;fill:var(--kn-ink)';
		var mu = 'font-family:var(--kn-mono);font-size:11px;fill:var(--kn-muted)';
		var w = 'stroke:var(--kn-ink);stroke-width:2;fill:none';
		function R(x, y, label, val) {
			return '<rect x="' + x + '" y="' + (y - 9) + '" width="50" height="18" rx="2" style="fill:var(--kn-paper);stroke:var(--kn-ink);stroke-width:2"/>' +
				'<text x="' + (x + 25) + '" y="' + (y - 14) + '" text-anchor="middle" style="' + t + ';font-weight:700">' + label + '</text>' +
				'<text x="' + (x + 25) + '" y="' + (y + 24) + '" text-anchor="middle" style="' + mu + '">' + E.esc(E.fmt(val, 'Ω')) + '</text>';
		}
		var tri = '<path d="M180 70 V150 L250 110 Z" style="fill:var(--kn-paper);stroke:var(--kn-ink);stroke-width:2"/>' +
			'<text x="186" y="94" style="' + t + '">−</text><text x="186" y="136" style="' + t + '">+</text>' +
			'<path d="M250 110 H320" style="' + w + '"/><circle cx="320" cy="110" r="4" style="fill:var(--kn-accent)"/>' +
			'<text x="326" y="114" style="' + t + ';font-weight:700;fill:var(--kn-accent-ink)">Vout</text>';
		var gnd = function (x, y) { return '<path d="M' + x + ' ' + y + ' v10 M' + (x - 10) + ' ' + (y + 10) + ' h20 M' + (x - 6) + ' ' + (y + 15) + ' h12 M' + (x - 2) + ' ' + (y + 20) + ' h4" style="' + w + '"/>'; };
		var s = '<svg viewBox="0 0 380 200" role="img" aria-label="Sơ đồ mạch khuếch đại ' + MODES[mode].name + '">' + tri +
			'<path d="M165 90 H180 M165 90 V40 H230 M280 40 H290 V110" style="' + w + '"/>' + R(230, 40, 'Rf', rf);
		if (mode === 'non') {
			s += '<path d="M180 130 H40" style="' + w + '"/><text x="36" y="134" text-anchor="end" style="' + t + '">Vin</text>' +
				'<path d="M165 90 H140 V110 M140 160 V170" style="' + w + '"/>' +
				'<rect x="131" y="110" width="18" height="50" rx="2" style="fill:var(--kn-paper);stroke:var(--kn-ink);stroke-width:2"/>' +
				'<text x="122" y="140" text-anchor="end" style="' + t + ';font-weight:700">Rg</text><text x="122" y="155" text-anchor="end" style="' + mu + '">' + E.esc(E.fmt(rb, 'Ω')) + '</text>' + gnd(140, 170);
		} else if (mode === 'inv') {
			s += '<path d="M40 90 H90 M140 90 H165" style="' + w + '"/>' + R(90, 90, 'Rin', rb) +
				'<text x="36" y="94" text-anchor="end" style="' + t + '">Vin</text>' +
				'<path d="M180 130 H165 V150" style="' + w + '"/>' + gnd(165, 150);
		} else {
			s += '<path d="M40 90 H90 M140 90 H165" style="' + w + '"/>' + R(90, 90, 'Rin', rb) + '<text x="36" y="94" text-anchor="end" style="' + t + '">V1</text>' +
				'<path d="M40 130 H90 M140 130 H180 M160 130 V150" style="' + w + '"/>' + R(90, 130, 'Rin', rb) + '<text x="36" y="134" text-anchor="end" style="' + t + '">V2</text>' +
				'<rect x="151" y="150" width="18" height="30" rx="2" style="fill:var(--kn-paper);stroke:var(--kn-ink);stroke-width:2"/>' +
				'<text x="176" y="170" style="' + mu + '">Rf</text>' + gnd(160, 180).replace('v10', 'v0');
		}
		return s + '</svg>';
	}

	E.mount('opamp-gain', function (root) {
		var uid = root.id || 'kn-oa';
		root.innerHTML =
			'<div class="kn-calc__body">' +
				'<div class="kn-calc__inputs">' +
					'<div class="kn-calc__field"><span class="kn-calc__label">Kiểu mạch</span><div class="kn-calc__seg" data-x="mode">' +
						Object.keys(MODES).map(function (k, i) { return '<button type="button" data-v="' + k + '" aria-pressed="' + (i === 0) + '">' + MODES[k].name + '</button>'; }).join('') + '</div></div>' +
					'<div class="kn-calc__row2">' +
						'<div class="kn-calc__field"><label for="' + uid + '-rf">Rf (hồi tiếp)</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-rf" data-x="rf" value="10k"><span>Ω</span></div></div>' +
						'<div class="kn-calc__field"><label for="' + uid + '-rb" data-x="rbl">Rg (xuống GND)</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-rb" data-x="rb" value="1k"><span>Ω</span></div></div>' +
					'</div>' +
					'<div class="kn-calc__row2">' +
						'<div class="kn-calc__field"><label for="' + uid + '-v1" data-x="v1l">Vin</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-v1" data-x="v1" value="0.25" inputmode="decimal"><span>V</span></div></div>' +
						'<div class="kn-calc__field" data-show="diff" hidden><label for="' + uid + '-v2">V2</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-v2" data-x="v2" value="0.30" inputmode="decimal"><span>V</span></div></div>' +
					'</div>' +
					'<div class="kn-calc__row2">' +
						'<div class="kn-calc__field"><label for="' + uid + '-vp">Nguồn dương V+</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-vp" data-x="vp" value="5" inputmode="decimal"><span>V</span></div></div>' +
						'<div class="kn-calc__field"><label for="' + uid + '-vn">Nguồn âm V−</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-vn" data-x="vn" value="0" inputmode="decimal"><span>V</span></div></div>' +
					'</div>' +
					'<div class="kn-calc__field"><label for="' + uid + '-a">Loại op-amp</label><select id="' + uid + '-a" data-x="a">' +
						AMPS.map(function (a) { return '<option value="' + a.id + '">' + E.esc(a.name) + '</option>'; }).join('') + '</select></div>' +
				'</div>' +
				'<div class="kn-calc__results">' +
					'<div aria-live="polite" data-x="out"></div>' +
					'<div class="kn-calc__figure" data-x="fig"></div>' +
				'</div>' +
			'</div>' +
			'<div class="kn-calc__more"><div><h3 class="kn-calc__h">Tìm cặp điện trở cho hệ số mong muốn</h3>' +
				'<div class="kn-oa__find"><div class="kn-calc__field"><label for="' + uid + '-g">Hệ số |G| mong muốn</label><input type="text" id="' + uid + '-g" data-x="g" value="11" inputmode="decimal"></div>' +
				'<div class="kn-calc__field"><label for="' + uid + '-s">Dãy</label><select id="' + uid + '-s" data-x="s"><option>E12</option><option selected>E24</option><option>E96</option></select></div></div>' +
				'<p class="kn-calc__hint">Bấm vào một dòng để dùng cặp điện trở đó. Rf nằm trong 1 kΩ – 1 MΩ.</p>' +
				'<div class="kn-calc__table-wrap" data-x="table"></div></div></div>';

		var x = function (k) { return root.querySelector('[data-x="' + k + '"]'); };
		var st = { mode: 'non', pairs: [] };

		function gainOf(rf, rb) { return st.mode === 'non' ? 1 + rf / rb : rf / rb; }

		function compute() {
			var rf = E.parse(x('rf').value), rb = E.parse(x('rb').value), v1 = E.parse(x('v1').value), v2 = E.parse(x('v2').value);
			var vp = E.parse(x('vp').value), vn = E.parse(x('vn').value);
			var amp = AMPS.filter(function (a) { return a.id === x('a').value; })[0];
			if (!(rf >= 0) || !(rb > 0) || !isFinite(v1) || (st.mode === 'diff' && !isFinite(v2)) || !(vp > vn)) {
				x('out').innerHTML = '<p class="kn-calc__msg is-error">Nhập Rf, ' + MODES[st.mode].rb + ', điện áp vào và nguồn hợp lệ (V+ lớn hơn V−).</p>';
				x('fig').innerHTML = '';
				return;
			}
			var g = gainOf(rf, rb), sign = st.mode === 'non' ? 1 : -1;
			var vin = st.mode === 'diff' ? v2 - v1 : v1;
			var ideal = st.mode === 'diff' ? g * vin : sign * g * vin;
			var top = vp - amp.hi, bot = vn + amp.lo;
			var real = Math.max(bot, Math.min(top, ideal));
			var noiseGain = 1 + rf / rb, bw = amp.gbw / noiseGain;
			var msgs = [];
			if (Math.abs(real - ideal) > 1e-9) {
				msgs.push(['warn', 'Ngõ ra bị kẹp (bão hòa): mạch muốn ra ' + E.fmt(ideal, 'V') + ' nhưng ' + amp.name.split(' (')[0] + ' chỉ ra được trong khoảng ' + E.fmt(bot, 'V') + ' … ' + E.fmt(top, 'V') + '.' +
					(st.mode === 'inv' && vn >= 0 && ideal < 0 ? ' Mạch đảo cần nguồn âm, hoặc nâng chân + lên điện áp giữa (ví dụ V+/2) nếu chỉ có nguồn đơn.' : '')]);
			}
			if (st.mode === 'diff') msgs.push(['ok', 'Mạch vi sai chính xác khi hai điện trở Rin và hai điện trở Rf bằng nhau từng cặp; dùng điện trở 1% để triệt nhiễu chung tốt.']);
			if (rf < 1000 || rb < 100) msgs.push(['warn', 'Điện trở nhỏ khiến op-amp phải cấp dòng lớn cho mạch hồi tiếp. Nên dùng 1 kΩ – 1 MΩ.']);
			x('out').innerHTML =
				'<div class="kn-calc__big"><span class="kn-calc__big-label">Hệ số khuếch đại</span>' +
					'<span class="kn-calc__big-val">' + (st.mode === 'inv' ? '−' : '') + E.trim(g, 5) + ' V/V</span>' +
					'<span class="kn-calc__big-sub">' + E.trim(20 * Math.log10(g), 4) + ' dB · ' +
						(st.mode === 'non' ? 'G = 1 + Rf / Rg' : st.mode === 'inv' ? 'G = −Rf / Rin' : 'Vout = Rf / Rin × (V2 − V1)') + '</span></div>' +
				'<dl class="kn-calc__stats">' +
					'<div><dt>Vout lý tưởng</dt><dd>' + E.fmt(ideal, 'V') + '</dd></div>' +
					'<div><dt>Vout thực tế</dt><dd>' + E.fmt(real, 'V') + '</dd></div>' +
					'<div><dt>Trở kháng vào</dt><dd>' + (st.mode === 'non' ? 'Rất lớn (cỡ MΩ – GΩ)' : E.fmt(rb, 'Ω') + (st.mode === 'diff' ? ' (V1)' : '')) + '</dd></div>' +
					'<div><dt>Băng thông ước lượng</dt><dd>' + (isFinite(bw) ? E.fmt(bw, 'Hz') : '–') + '</dd></div>' +
				'</dl>' +
				msgs.map(function (m) { return '<p class="kn-calc__msg is-' + m[0] + '">' + m[1] + '</p>'; }).join('');
			x('fig').innerHTML = ampSVG(st.mode, rf, rb);
			findPairs();
		}

		function findPairs() {
			var target = E.parse(x('g').value);
			if (!(target > 0) || (st.mode === 'non' && target < 1)) {
				x('table').innerHTML = '<p class="kn-calc__msg is-error">' + (st.mode === 'non' ? 'Mạch không đảo có hệ số từ 1 trở lên.' : 'Nhập hệ số lớn hơn 0.') + '</p>';
				return;
			}
			var list = E.values(x('s').value, 100, 1e6), pairs = [];
			list.forEach(function (rf) {
				if (rf < 1000) return;
				list.forEach(function (rb) {
					var g = gainOf(rf, rb);
					pairs.push({ rf: rf, rb: rb, g: g, err: (g - target) / target });
				});
			});
			pairs.sort(function (a, b) { return Math.abs(a.err) - Math.abs(b.err) || Math.abs(Math.log10(a.rf) - 4) - Math.abs(Math.log10(b.rf) - 4); });
			/* Mỗi bậc độ lớn của Rf chỉ lấy một cặp, để có lựa chọn ở các mức trở khác nhau (1k, 10k, 100k…) */
			var seen = {}, out = [];
			pairs.forEach(function (p) {
				var key = Math.floor(Math.log10(p.rf) * 3) + ':' + E.trim(p.rf / p.rb, 6);
				if (out.length < 8 && !seen[key]) { seen[key] = 1; out.push(p); }
			});
			st.pairs = out;
			x('table').innerHTML = '<table class="kn-calc__table"><thead><tr><th>Rf</th><th>' + MODES[st.mode].rb + '</th><th>Hệ số</th><th>Sai lệch</th></tr></thead><tbody>' +
				out.map(function (p, i) {
					return '<tr class="is-click" data-i="' + i + '"><td>' + E.fmt(p.rf, 'Ω') + '</td><td>' + E.fmt(p.rb, 'Ω') + '</td><td>' + E.trim(p.g, 5) + '</td><td>' + (p.err >= 0 ? '+' : '') + (p.err * 100).toFixed(2) + '%</td></tr>';
				}).join('') + '</tbody></table>';
		}

		function setMode(m) {
			st.mode = m;
			Array.prototype.forEach.call(x('mode').querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === m)); });
			Array.prototype.forEach.call(root.querySelectorAll('[data-show]'), function (el) { el.hidden = el.getAttribute('data-show') !== m; });
			x('rbl').textContent = m === 'non' ? 'Rg (xuống GND)' : 'Rin (nối tín hiệu vào)';
			x('v1l').textContent = m === 'diff' ? 'V1' : 'Vin';
			if (m === 'non' && E.parse(x('g').value) < 1) x('g').value = '11';
			compute();
		}

		root.addEventListener('click', function (e) {
			var b = e.target.closest('[data-x="mode"] button');
			if (b) { setMode(b.getAttribute('data-v')); return; }
			var tr = e.target.closest('tr[data-i]');
			if (tr) {
				var p = st.pairs[Number(tr.getAttribute('data-i'))];
				x('rf').value = E.fmt(p.rf, '').replace(' ', '');
				x('rb').value = E.fmt(p.rb, '').replace(' ', '');
				compute();
			}
		});
		root.addEventListener('input', function (e) { if (e.target === x('g')) findPairs(); else compute(); });
		root.addEventListener('change', function (e) { if (e.target === x('s')) findPairs(); else if (e.target === x('a')) compute(); });
		compute();
	});
})(window.KNElec);
