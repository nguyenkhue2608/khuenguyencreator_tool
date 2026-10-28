/**
 * Float ↔ IEEE 754 (float32, float64): tách dấu / mũ / định trị, thứ tự byte (cả kiểu Modbus), và fixed-point Q.
 */
(function (E) {
	'use strict';

	var FMT = {
		32: { e: 8, m: 23, bias: 127, bytes: 4, c: 'float', suf: 'f' },
		64: { e: 11, m: 52, bias: 1023, bytes: 8, c: 'double', suf: '' }
	};

	function toBytes(v, w) {
		var dv = new DataView(new ArrayBuffer(w / 8));
		if (w === 32) dv.setFloat32(0, v); else dv.setFloat64(0, v);
		var out = [];
		for (var i = 0; i < w / 8; i++) out.push(dv.getUint8(i));
		return out; /* big-endian */
	}
	function fromBytes(b, w) {
		var dv = new DataView(new ArrayBuffer(w / 8));
		b.forEach(function (x, i) { dv.setUint8(i, x); });
		return w === 32 ? dv.getFloat32(0) : dv.getFloat64(0);
	}
	function hx(b) { return b.toString(16).toUpperCase().padStart(2, '0'); }
	function bitsOf(bytes) { return bytes.map(function (b) { return b.toString(2).padStart(8, '0'); }).join(''); }

	function parseNum(s) {
		var t = String(s).trim().toLowerCase().replace(',', '.');
		if (/^[+]?inf(inity)?$/.test(t)) return Infinity;
		if (/^-inf(inity)?$/.test(t)) return -Infinity;
		if (t === 'nan') return NaN;
		if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(t)) return null;
		return parseFloat(t);
	}
	function parseHex(s, w) {
		var t = String(s).trim().replace(/^0x/i, '').replace(/[\s_]/g, '');
		if (!/^[0-9a-f]+$/i.test(t) || t.length > w / 4) return null;
		t = t.padStart(w / 4, '0');
		var out = [];
		for (var i = 0; i < t.length; i += 2) out.push(parseInt(t.substr(i, 2), 16));
		return out;
	}

	E.mount('float-ieee754', function (root) {
		var uid = root.id || 'kn-flt';
		root.innerHTML =
			'<div class="kn-calc__tabs" role="tablist">' +
				'<button type="button" class="kn-calc__tab" role="tab" data-mode="float" aria-selected="true">Float ↔ Hex (IEEE 754)</button>' +
				'<button type="button" class="kn-calc__tab" role="tab" data-mode="q" aria-selected="false">Fixed-point (Q)</button>' +
			'</div>' +
			/* ---- Tab float ---- */
			'<div data-show="float">' +
				'<div class="kn-calc__body">' +
					'<div class="kn-calc__inputs">' +
						'<div class="kn-calc__field"><span class="kn-calc__label">Kiểu</span><div class="kn-calc__seg" data-x="w">' +
							'<button type="button" data-v="32" aria-pressed="true">float (32-bit)</button><button type="button" data-v="64" aria-pressed="false">double (64-bit)</button></div></div>' +
						'<div class="kn-calc__field"><label for="' + uid + '-d">Số thực</label><input type="text" id="' + uid + '-d" data-x="dec" value="3.14159" spellcheck="false" inputmode="decimal"></div>' +
						'<div class="kn-calc__field"><label for="' + uid + '-h">Hex (big-endian)</label><input type="text" id="' + uid + '-h" data-x="hex" spellcheck="false" class="kn-flt__mono"></div>' +
						'<p class="kn-calc__hint">Nhận cả inf, -inf, nan. Bấm vào bit để bật / tắt.</p>' +
						'<p class="kn-calc__msg is-error" data-x="err" hidden></p>' +
					'</div>' +
					'<div class="kn-calc__results">' +
						'<div class="kn-flt__bits" data-x="bits"></div>' +
						'<dl class="kn-calc__stats" data-x="stats"></dl>' +
					'</div>' +
				'</div>' +
				'<div class="kn-calc__more">' +
					'<div><h3 class="kn-calc__h">Thứ tự byte khi truyền / lưu</h3><div class="kn-calc__table-wrap" data-x="order"></div></div>' +
					'<div><h3 class="kn-calc__h">Code C</h3><pre class="kn-flt__code" data-x="code"></pre></div>' +
				'</div>' +
			'</div>' +
			/* ---- Tab Q ---- */
			'<div data-show="q" hidden>' +
				'<div class="kn-calc__body">' +
					'<div class="kn-calc__inputs">' +
						'<div class="kn-calc__field"><span class="kn-calc__label">Định dạng hay dùng</span><div class="kn-flt__presets" data-x="qp">' +
							[['Q7', 8, 7, 1], ['Q15', 16, 15, 1], ['Q31', 32, 31, 1], ['Q8.8', 16, 8, 1], ['Q16.16', 32, 16, 1], ['UQ0.16', 16, 16, 0]].map(function (p, i) {
								return '<button type="button" data-q="' + p.slice(1).join(',') + '" aria-pressed="' + (i === 1) + '">' + p[0] + '</button>';
							}).join('') + '</div></div>' +
						'<div class="kn-calc__row2">' +
							'<div class="kn-calc__field"><label for="' + uid + '-qw">Tổng số bit</label><select id="' + uid + '-qw" data-q-in="w"><option>8</option><option selected>16</option><option>32</option></select></div>' +
							'<div class="kn-calc__field"><label for="' + uid + '-qn">Số bit phần lẻ (n)</label><input type="number" id="' + uid + '-qn" data-q-in="n" value="15" min="0" max="32"></div>' +
						'</div>' +
						'<label class="kn-flt__check"><input type="checkbox" data-q-in="s" checked> Có dấu (signed, bù 2)</label>' +
						'<div class="kn-calc__field"><label for="' + uid + '-qv">Số thực</label><input type="text" id="' + uid + '-qv" data-q-in="v" value="0.5" inputmode="decimal"></div>' +
						'<div class="kn-calc__field"><label for="' + uid + '-qh">Hoặc nhập số nguyên dạng hex</label><input type="text" id="' + uid + '-qh" data-q-in="h" class="kn-flt__mono" placeholder="VD: 0x4000"></div>' +
					'</div>' +
					'<div class="kn-calc__results" data-x="qout"></div>' +
				'</div>' +
			'</div>';

		var x = function (k) { return root.querySelector('[data-x="' + k + '"]'); };
		var q = function (k) { return root.querySelector('[data-q-in="' + k + '"]'); };
		var st = { w: 32, bytes: toBytes(3.14159, 32), input: 3.14159 };

		function setMode(m) {
			Array.prototype.forEach.call(root.querySelectorAll('.kn-calc__tab'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-mode') === m)); });
			Array.prototype.forEach.call(root.querySelectorAll('[data-show]'), function (el) { el.hidden = el.getAttribute('data-show') !== m; });
		}
		function err(msg) { x('err').hidden = !msg; x('err').textContent = msg || ''; }

		function renderFloat(skip) {
			var f = FMT[st.w], b = st.bytes, bits = bitsOf(b), v = fromBytes(b, st.w);
			var sign = Number(bits[0]), expRaw = parseInt(bits.substr(1, f.e), 2), man = bits.substr(1 + f.e);
			var maxE = Math.pow(2, f.e) - 1;
			var kind = expRaw === maxE ? (/1/.test(man) ? 'NaN' : 'Vô cực') : expRaw === 0 ? (/1/.test(man) ? 'Subnormal (số rất nhỏ)' : 'Số 0') : 'Normal';
			if (skip !== 'dec') x('dec').value = isNaN(v) ? 'nan' : String(st.w === 32 ? parseFloat(v.toPrecision(9)) : v);
			if (skip !== 'hex') x('hex').value = '0x' + b.map(hx).join('');

			var cells = '';
			for (var i = 0; i < bits.length; i++) {
				var part = i === 0 ? 's' : i <= f.e ? 'e' : 'm';
				cells += '<button type="button" class="kn-flt__bit is-' + part + (bits[i] === '1' ? ' is-on' : '') + '" data-i="' + i + '" aria-pressed="' + (bits[i] === '1') + '" aria-label="Bit ' + (bits.length - 1 - i) + '">' + bits[i] + '</button>';
			}
			x('bits').innerHTML =
				'<div class="kn-flt__legend"><span class="is-s">Dấu 1 bit</span><span class="is-e">Mũ ' + f.e + ' bit</span><span class="is-m">Định trị ' + f.m + ' bit</span></div>' +
				'<div class="kn-flt__grid' + (st.w === 64 ? ' is-64' : '') + '">' + cells + '</div>';

			var expTxt = kind === 'Normal' ? expRaw + ' − ' + f.bias + ' = ' + (expRaw - f.bias) : kind.indexOf('Subnormal') === 0 ? '0 (dùng 1 − ' + f.bias + ' = ' + (1 - f.bias) + ')' : String(expRaw);
			var frac = parseInt(man.substr(0, 30), 2) / Math.pow(2, Math.min(30, man.length));
			var formula = kind === 'Normal' ? '(−1)^' + sign + ' × ' + E.trim(1 + frac, 10) + ' × 2^' + (expRaw - f.bias) : kind;
			var errAbs = isFinite(st.input) && isFinite(v) ? v - st.input : null;
			x('stats').innerHTML =
				'<div><dt>Loại</dt><dd>' + kind + '</dd></div>' +
				'<div><dt>Dấu</dt><dd>' + sign + (sign ? ' (âm)' : ' (dương)') + '</dd></div>' +
				'<div><dt>Mũ</dt><dd>' + expTxt + '</dd></div>' +
				'<div><dt>Định trị</dt><dd>0x' + parseInt(man, 2).toString(16).toUpperCase() + '</dd></div>' +
				'<div><dt>Công thức</dt><dd>' + formula + '</dd></div>' +
				'<div><dt>Giá trị thật được lưu</dt><dd class="kn-flt__wrap">' + (isFinite(v) ? v.toPrecision(st.w === 32 ? 9 : 17) : String(v)) + '</dd></div>' +
				(errAbs !== null && errAbs !== 0 ? '<div><dt>Sai số làm tròn</dt><dd>' + errAbs.toExponential(3) + '</dd></div>' : '');

			var be = b.map(hx), le = be.slice().reverse();
			var rows = [['Big-endian (ABCD)', be, 'Thứ tự "đọc tự nhiên", mạng (network order)'], ['Little-endian (DCBA)', le, 'Cách STM32, ESP32, AVR lưu trong RAM']];
			if (st.w === 32) {
				rows.push(['Đảo word (CDAB)', [be[2], be[3], be[0], be[1]], 'Hay gặp ở thiết bị Modbus: 2 thanh ghi, word thấp trước']);
				rows.push(['Đảo byte (BADC)', [be[1], be[0], be[3], be[2]], 'Một số thiết bị Modbus khác']);
			}
			x('order').innerHTML = '<table class="kn-calc__table"><thead><tr><th>Thứ tự</th><th>Các byte</th><th>Gặp ở đâu</th></tr></thead><tbody>' +
				rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1].join(' ') + '</td><td class="kn-flt__use">' + r[2] + '</td></tr>'; }).join('') + '</tbody></table>';
			x('code').textContent =
				'#include <string.h>\n#include <stdint.h>\n\n' +
				f.c + ' val = ' + (isFinite(v) ? v.toPrecision(st.w === 32 ? 9 : 17).replace(/\.?0+$/, '').replace(/^(-?\d+)$/, '$1.0') + f.suf : 'NAN') + ';   /* 0x' + be.join('') + ' */\n\n' +
				'/* Float -> byte (MCU little-endian): ' + le.map(function (s) { return '0x' + s; }).join(', ') + ' */\n' +
				'uint8_t buf[' + f.bytes + '];\nmemcpy(buf, &val, sizeof(val));\n\n' +
				'/* Byte -> float: nên dùng memcpy thay vì ép kiểu con trỏ (tránh lỗi căn lề) */\n' +
				f.c + ' out;\nmemcpy(&out, buf, sizeof(out));';
		}

		/* ---- Fixed-point Q ---- */
		function renderQ(from) {
			var w = Number(q('w').value), n = Math.max(0, Math.min(w, Math.floor(Number(q('n').value) || 0))), s = q('s').checked;
			var min = s ? -Math.pow(2, w - 1) : 0, max = s ? Math.pow(2, w - 1) - 1 : Math.pow(2, w) - 1, scale = Math.pow(2, n);
			var raw, msgs = [];
			if (from === 'h') {
				var t = q('h').value.trim().replace(/^0x/i, '');
				if (!/^[0-9a-f]+$/i.test(t)) { x('qout').innerHTML = '<p class="kn-calc__msg is-error">Nhập số hex hợp lệ, ví dụ 0x4000.</p>'; return; }
				raw = parseInt(t, 16);
				if (raw > Math.pow(2, w) - 1) { x('qout').innerHTML = '<p class="kn-calc__msg is-error">Vượt quá ' + w + ' bit.</p>'; return; }
				if (s && raw >= Math.pow(2, w - 1)) raw -= Math.pow(2, w);
				q('v').value = String(raw / scale);
			} else {
				var v = parseNum(q('v').value);
				if (v === null || !isFinite(v)) { x('qout').innerHTML = '<p class="kn-calc__msg is-error">Nhập số thực hợp lệ, ví dụ 0.5 hoặc -1.25.</p>'; return; }
				raw = Math.round(v * scale);
				if (raw > max || raw < min) { msgs.push('Giá trị nằm ngoài khoảng biểu diễn được nên bị cắt (saturate).'); raw = Math.max(min, Math.min(max, raw)); }
				var u = raw < 0 ? raw + Math.pow(2, w) : raw;
				q('h').value = '0x' + u.toString(16).toUpperCase().padStart(w / 4, '0');
			}
			var real = raw / scale, input = parseNum(q('v').value);
			/* Cách gọi thông dụng: Q15, Q31 khi chỉ có bit dấu + phần lẻ; còn lại Qm.n với m gồm cả bit dấu (Q8.8, Q16.16) */
			var name = s && n === w - 1 ? 'Q' + n : (s ? 'Q' : 'UQ') + (w - n) + '.' + n;
			x('qout').innerHTML =
				'<div class="kn-calc__big"><span class="kn-calc__big-label">Số nguyên lưu trong bộ nhớ (' + name + ')</span><span class="kn-calc__big-val">' + q('h').value + '</span>' +
					'<span class="kn-calc__big-sub">= ' + raw + ' (thập phân)</span></div>' +
				'<dl class="kn-calc__stats">' +
					'<div><dt>Giá trị biểu diễn</dt><dd>' + E.trim(real, 12) + '</dd></div>' +
					(input !== null && isFinite(input) && real !== input ? '<div><dt>Sai số làm tròn</dt><dd>' + (real - input).toExponential(3) + '</dd></div>' : '') +
					'<div><dt>Bước nhỏ nhất (độ phân giải)</dt><dd>2^-' + n + ' = ' + E.trim(1 / scale, 6) + '</dd></div>' +
					'<div><dt>Khoảng biểu diễn</dt><dd>' + E.trim(min / scale, 8) + ' … ' + E.trim(max / scale, 8) + '</dd></div>' +
					'<div><dt>Chuyển đổi trong C</dt><dd>raw = (int' + w + '_t)(x * ' + scale + ')</dd></div>' +
				'</dl>' +
				msgs.map(function (m) { return '<p class="kn-calc__msg is-warn">' + m + '</p>'; }).join('');
		}

		root.addEventListener('click', function (e) {
			var tab = e.target.closest('.kn-calc__tab');
			if (tab) { setMode(tab.getAttribute('data-mode')); return; }
			var bit = e.target.closest('.kn-flt__bit');
			if (bit) {
				var i = Number(bit.getAttribute('data-i'));
				st.bytes[i >> 3] ^= 1 << (7 - (i & 7));
				st.input = fromBytes(st.bytes, st.w);
				err(null);
				renderFloat();
				return;
			}
			var wb = e.target.closest('[data-x="w"] button');
			if (wb) {
				Array.prototype.forEach.call(x('w').querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(b === wb)); });
				st.w = Number(wb.getAttribute('data-v'));
				st.bytes = toBytes(st.input, st.w);
				renderFloat('dec');
				return;
			}
			var qp = e.target.closest('[data-q]');
			if (qp) {
				var p = qp.getAttribute('data-q').split(',');
				q('w').value = p[0]; q('n').value = p[1]; q('s').checked = p[2] === '1';
				Array.prototype.forEach.call(x('qp').querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(b === qp)); });
				renderQ('v');
			}
		});
		root.addEventListener('input', function (e) {
			var t = e.target;
			if (t === x('dec')) {
				var v = parseNum(t.value);
				if (v === null) { err('Nhập số thực hợp lệ, ví dụ 3.14, -0.5, 1e-3.'); return; }
				err(null); st.input = v; st.bytes = toBytes(v, st.w); renderFloat('dec');
			} else if (t === x('hex')) {
				var b = parseHex(t.value, st.w);
				if (!b) { err('Nhập tối đa ' + st.w / 4 + ' ký tự hex, ví dụ 0x40490FD0.'); return; }
				err(null); st.bytes = b; st.input = fromBytes(b, st.w); renderFloat('hex');
			} else if (t.hasAttribute('data-q-in')) {
				if (t !== q('h')) Array.prototype.forEach.call(x('qp').querySelectorAll('button'), function (b) {
					var p = b.getAttribute('data-q').split(',');
					b.setAttribute('aria-pressed', String(p[0] === q('w').value && p[1] === q('n').value && (p[2] === '1') === q('s').checked));
				});
				renderQ(t === q('h') ? 'h' : 'v');
			}
		});
		root.addEventListener('change', function (e) { if (e.target.hasAttribute('data-q-in')) renderQ('v'); });

		renderFloat('dec');
		renderQ('v');
	});
})(window.KNElec);
