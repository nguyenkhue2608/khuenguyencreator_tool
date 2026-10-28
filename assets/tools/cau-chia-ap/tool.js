/**
 * Cầu chia áp: Vout = Vin × R2 / (R1 + R2). Tính Vout, hoặc tìm cặp R1, R2 chuẩn cho Vout mong muốn.
 */
(function (E) {
	'use strict';

	var RANGES = { low: [1e3, 1e4, '1 kΩ – 10 kΩ'], mid: [1e4, 1e5, '10 kΩ – 100 kΩ'], high: [1e5, 1e6, '100 kΩ – 1 MΩ'] };

	function dividerSVG(vin, r1, r2, vout) {
		var t = 'font-family:var(--kn-mono);font-size:13px;font-weight:700;fill:var(--kn-ink)';
		var m = 'font-family:var(--kn-mono);font-size:12px;fill:var(--kn-muted)';
		var w = 'stroke:var(--kn-ink);stroke-width:2;fill:none';
		function res(y) {
			return '<rect x="88" y="' + y + '" width="24" height="56" rx="2" style="fill:var(--kn-paper);stroke:var(--kn-ink);stroke-width:2"/>';
		}
		return '<svg viewBox="0 0 360 300" role="img" aria-label="Sơ đồ cầu chia áp">' +
			'<circle cx="100" cy="20" r="5" style="fill:var(--kn-ink)"/>' +
			'<text x="114" y="25" style="' + t + '">Vin = ' + E.esc(E.fmt(vin, 'V')) + '</text>' +
			'<path d="M100 25 V54" style="' + w + '"/>' + res(54) +
			'<text x="124" y="80" style="' + t + '">R1</text><text x="124" y="97" style="' + m + '">' + E.esc(E.fmt(r1, 'Ω')) + '</text>' +
			'<path d="M100 110 V150 M100 150 H240" style="' + w + '"/>' +
			'<circle cx="100" cy="150" r="4" style="fill:var(--kn-ink)"/><circle cx="240" cy="150" r="5" style="fill:var(--kn-accent)"/>' +
			'<text x="250" y="146" style="' + t + ';fill:var(--kn-accent-ink)">Vout</text>' +
			'<text x="250" y="164" style="' + t + ';fill:var(--kn-accent-ink)">' + E.esc(E.fmt(vout, 'V')) + '</text>' +
			'<path d="M100 150 V190" style="' + w + '"/>' + res(190) +
			'<text x="124" y="216" style="' + t + '">R2</text><text x="124" y="233" style="' + m + '">' + E.esc(E.fmt(r2, 'Ω')) + '</text>' +
			'<path d="M100 246 V272 M82 272 H118 M88 280 H112 M95 288 H105" style="' + w + '"/>' +
			'<text x="124" y="286" style="' + m + '">GND</text>' +
			'</svg>';
	}

	E.mount('cau-chia-ap', function (root) {
		var uid = root.id || 'kn-div';
		root.innerHTML =
			'<div class="kn-calc__tabs" role="tablist">' +
				'<button type="button" class="kn-calc__tab" role="tab" data-mode="calc" aria-selected="true">Tính Vout</button>' +
				'<button type="button" class="kn-calc__tab" role="tab" data-mode="find" aria-selected="false">Tìm R1, R2</button>' +
			'</div>' +
			'<div class="kn-calc__body">' +
				'<div class="kn-calc__inputs">' +
					'<div class="kn-calc__field"><label for="' + uid + '-vin">Điện áp vào Vin</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-vin" data-x="vin" value="12" inputmode="decimal"><span>V</span></div></div>' +
					'<div class="kn-calc__row2" data-show="calc">' +
						'<div class="kn-calc__field"><label for="' + uid + '-r1">R1 (trên)</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-r1" data-x="r1" value="27k"><span>Ω</span></div></div>' +
						'<div class="kn-calc__field"><label for="' + uid + '-r2">R2 (dưới)</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-r2" data-x="r2" value="10k"><span>Ω</span></div></div>' +
					'</div>' +
					'<div class="kn-calc__field" data-show="find" hidden><label for="' + uid + '-vt">Vout mong muốn</label><div class="kn-calc__unit"><input type="text" id="' + uid + '-vt" data-x="vt" value="3.3" inputmode="decimal"><span>V</span></div></div>' +
					'<div class="kn-calc__row2" data-show="find" hidden>' +
						'<div class="kn-calc__field"><label for="' + uid + '-ser">Dãy điện trở</label><select id="' + uid + '-ser" data-x="ser"><option value="E12">E12 (±10%, dễ mua)</option><option value="E24" selected>E24 (±5%)</option><option value="E96">E96 (±1%)</option></select></div>' +
						'<div class="kn-calc__field"><label for="' + uid + '-rg">Tổng R1 + R2</label><select id="' + uid + '-rg" data-x="rg"><option value="low">' + RANGES.low[2] + '</option><option value="mid" selected>' + RANGES.mid[2] + '</option><option value="high">' + RANGES.high[2] + '</option></select></div>' +
					'</div>' +
					'<p class="kn-calc__hint">Nhập điện trở dạng 10k, 4k7, 2.2M. Ví dụ mặc định: đo điện áp 12V bằng chân ADC 3.3V.</p>' +
					'<div class="kn-calc__figure" data-x="fig"></div>' +
				'</div>' +
				'<div class="kn-calc__results" aria-live="polite" data-x="out"></div>' +
			'</div>' +
			'<div class="kn-calc__more" data-show="find" hidden><div><h3 class="kn-calc__h">Các cặp điện trở chuẩn gần nhất</h3><p class="kn-calc__hint">Bấm vào một dòng để xem chi tiết.</p><div class="kn-calc__table-wrap" data-x="table"></div></div></div>';

		var x = function (k) { return root.querySelector('[data-x="' + k + '"]'); };
		var state = { mode: 'calc', pairs: [], sel: 0 };

		function setMode(m) {
			state.mode = m;
			Array.prototype.forEach.call(root.querySelectorAll('.kn-calc__tab'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-mode') === m)); });
			Array.prototype.forEach.call(root.querySelectorAll('[data-show]'), function (el) { el.hidden = el.getAttribute('data-show') !== m; });
			compute();
		}

		function fail(msg) {
			x('out').innerHTML = '<p class="kn-calc__msg is-error">' + msg + '</p>';
			x('fig').innerHTML = '';
			x('table').innerHTML = '';
		}

		function show(vin, r1, r2, target) {
			var vout = vin * r2 / (r1 + r2), i = vin / (r1 + r2);
			var err = target ? (vout - target) / target : null;
			var msgs = [];
			if (r1 + r2 < 1000) msgs.push(['warn', 'Tổng trở nhỏ nên cầu chia tiêu tốn nhiều dòng (' + E.fmt(i, 'A') + '). Với mạch đo, tổng 10 kΩ – 100 kΩ là hợp lý.']);
			if (r1 + r2 > 2e5) msgs.push(['warn', 'Tổng trở lớn: tải phía sau (ví dụ chân ADC) dễ kéo lệch Vout. Nên thêm tụ 100 nF song song với R2 khi nối vào ADC.']);
			x('out').innerHTML =
				'<div class="kn-calc__big"><span class="kn-calc__big-label">Điện áp ra Vout</span><span class="kn-calc__big-val">' + E.fmt(vout, 'V') + '</span>' +
					(err !== null ? '<span class="kn-calc__big-sub">Sai lệch so với ' + E.fmt(target, 'V') + ': ' + (err >= 0 ? '+' : '') + (err * 100).toFixed(2) + '%</span>' : '') + '</div>' +
				'<dl class="kn-calc__stats">' +
					'<div><dt>Tỉ lệ chia R2 / (R1 + R2)</dt><dd>' + E.trim(r2 / (r1 + r2), 5) + '</dd></div>' +
					'<div><dt>Dòng qua cầu</dt><dd>' + E.fmt(i, 'A') + '</dd></div>' +
					'<div><dt>Công suất trên R1</dt><dd>' + E.fmt(i * i * r1, 'W') + '</dd></div>' +
					'<div><dt>Công suất trên R2</dt><dd>' + E.fmt(i * i * r2, 'W') + '</dd></div>' +
					'<div><dt>Trở kháng ra (R1 // R2)</dt><dd>' + E.fmt(r1 * r2 / (r1 + r2), 'Ω') + '</dd></div>' +
				'</dl>' +
				msgs.map(function (m) { return '<p class="kn-calc__msg is-' + m[0] + '">' + m[1] + '</p>'; }).join('');
			x('fig').innerHTML = dividerSVG(vin, r1, r2, vout);
		}

		function compute() {
			var vin = E.parse(x('vin').value);
			if (!(vin > 0)) return fail('Nhập điện áp vào Vin lớn hơn 0, ví dụ 12 hoặc 5.');
			if (state.mode === 'calc') {
				var r1 = E.parse(x('r1').value), r2 = E.parse(x('r2').value);
				if (!(r1 >= 0) || !(r2 > 0)) return fail('Nhập R1, R2 hợp lệ, ví dụ 10k hoặc 4k7.');
				return show(vin, r1, r2, null);
			}
			var vt = E.parse(x('vt').value);
			if (!(vt > 0 && vt < vin)) return fail('Vout mong muốn phải lớn hơn 0 và nhỏ hơn Vin.');
			var rg = RANGES[x('rg').value], list = E.values(x('ser').value, rg[0] / 100, rg[1]);
			var pairs = [];
			list.forEach(function (a) {
				list.forEach(function (b) {
					var sum = a + b;
					if (sum < rg[0] || sum > rg[1]) return;
					var v = vin * b / sum;
					pairs.push({ r1: a, r2: b, v: v, err: (v - vt) / vt });
				});
			});
			pairs.sort(function (p, q) { return Math.abs(p.err) - Math.abs(q.err) || (p.r1 + p.r2) - (q.r1 + q.r2); });
			state.pairs = pairs.slice(0, 8);
			state.sel = Math.min(state.sel, state.pairs.length - 1);
			if (!state.pairs.length) return fail('Không tìm được cặp nào trong khoảng tổng trở đã chọn.');
			var p = state.pairs[state.sel];
			show(vin, p.r1, p.r2, vt);
			x('table').innerHTML = '<table class="kn-calc__table"><thead><tr><th>R1</th><th>R2</th><th>Vout</th><th>Sai lệch</th><th>Dòng</th></tr></thead><tbody>' +
				state.pairs.map(function (q, i) {
					return '<tr class="is-click' + (i === state.sel ? ' is-active' : '') + '" data-i="' + i + '"><td>' + E.fmt(q.r1, 'Ω') + '</td><td>' + E.fmt(q.r2, 'Ω') + '</td><td>' + E.fmt(q.v, 'V', 5) +
						'</td><td>' + (q.err >= 0 ? '+' : '') + (q.err * 100).toFixed(2) + '%</td><td>' + E.fmt(vin / (q.r1 + q.r2), 'A') + '</td></tr>';
				}).join('') + '</tbody></table>';
		}

		root.addEventListener('click', function (e) {
			var tab = e.target.closest('.kn-calc__tab');
			if (tab) { setMode(tab.getAttribute('data-mode')); return; }
			var tr = e.target.closest('tr[data-i]');
			if (tr) { state.sel = Number(tr.getAttribute('data-i')); compute(); }
		});
		root.addEventListener('input', function (e) {
			if (e.target.matches('input')) { state.sel = 0; compute(); }
		});
		root.addEventListener('change', function (e) {
			if (e.target.matches('select')) { state.sel = 0; compute(); }
		});
		compute();
	});
})(window.KNElec);
