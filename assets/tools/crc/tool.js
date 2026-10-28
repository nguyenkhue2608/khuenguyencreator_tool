/**
 * CRC & checksum: tính cùng lúc các thuật toán phổ biến theo mô hình Rocksoft (width, poly, init, refin, refout, xorout)
 * và sinh hàm C cho thuật toán đang chọn.
 */
(function (E) {
	'use strict';

	var ALGOS = [
		{ id: 'crc16-modbus', name: 'CRC-16/MODBUS', w: 16, poly: 0x8005, init: 0xFFFF, refin: true, refout: true, xorout: 0, check: 0x4B37, le: true, use: 'Modbus RTU (gửi byte thấp trước)' },
		{ id: 'crc16-ccitt-false', name: 'CRC-16/CCITT-FALSE', w: 16, poly: 0x1021, init: 0xFFFF, refin: false, refout: false, xorout: 0, check: 0x29B1, use: 'Giao thức tự định nghĩa, nhiều thư viện nhúng' },
		{ id: 'crc16-xmodem', name: 'CRC-16/XMODEM', w: 16, poly: 0x1021, init: 0, refin: false, refout: false, xorout: 0, check: 0x31C3, use: 'XMODEM, YMODEM, bootloader' },
		{ id: 'crc16-kermit', name: 'CRC-16/KERMIT', w: 16, poly: 0x1021, init: 0, refin: true, refout: true, xorout: 0, check: 0x2189, le: true, use: 'Kermit, CCITT bản đảo bit' },
		{ id: 'crc16-x25', name: 'CRC-16/X-25', w: 16, poly: 0x1021, init: 0xFFFF, refin: true, refout: true, xorout: 0xFFFF, check: 0x906E, le: true, use: 'HDLC, X.25, IrDA' },
		{ id: 'crc16-arc', name: 'CRC-16/ARC', w: 16, poly: 0x8005, init: 0, refin: true, refout: true, xorout: 0, check: 0xBB3D, le: true, use: 'CRC-16 "IBM", file ARC, LHA' },
		{ id: 'crc8', name: 'CRC-8 (SMBus)', w: 8, poly: 0x07, init: 0, refin: false, refout: false, xorout: 0, check: 0xF4, use: 'SMBus PEC, nhiều cảm biến' },
		{ id: 'crc8-maxim', name: 'CRC-8/MAXIM', w: 8, poly: 0x31, init: 0, refin: true, refout: true, xorout: 0, check: 0xA1, use: '1-Wire: DS18B20, ROM ID' },
		{ id: 'crc32', name: 'CRC-32', w: 32, poly: 0x04C11DB7, init: 0xFFFFFFFF, refin: true, refout: true, xorout: 0xFFFFFFFF, check: 0xCBF43926, le: true, use: 'Ethernet, ZIP, PNG' },
		{ id: 'crc32-mpeg2', name: 'CRC-32/MPEG-2', w: 32, poly: 0x04C11DB7, init: 0xFFFFFFFF, refin: false, refout: false, xorout: 0, check: 0x0376E6E7, use: 'Khối CRC phần cứng STM32 (cấu hình mặc định)' },
		{ id: 'crc32c', name: 'CRC-32C', w: 32, poly: 0x1EDC6F41, init: 0xFFFFFFFF, refin: true, refout: true, xorout: 0xFFFFFFFF, check: 0xE3069283, le: true, use: 'iSCSI, ext4, SCTP' },
		{ id: 'sum8', name: 'Checksum SUM8', w: 8, kind: 'sum', use: 'Cộng dồn các byte, lấy 8 bit thấp' },
		{ id: 'lrc', name: 'LRC (bù 2)', w: 8, kind: 'lrc', use: 'Intel HEX, Modbus ASCII' },
		{ id: 'xor8', name: 'Checksum XOR8', w: 8, kind: 'xor', use: 'NMEA (GPS): XOR các ký tự giữa $ và *' }
	];

	function reflect(v, w) {
		var r = 0;
		for (var i = 0; i < w; i++) { r = (r << 1) | (v & 1); v >>>= 1; }
		return r >>> 0;
	}

	function crc(bytes, a) {
		var w = a.w, u = function (x) { return w === 32 ? x >>> 0 : x & ((1 << w) - 1); };
		if (a.kind === 'sum' || a.kind === 'lrc' || a.kind === 'xor') {
			var acc = 0;
			bytes.forEach(function (b) { acc = a.kind === 'xor' ? acc ^ b : acc + b; });
			return a.kind === 'lrc' ? (-acc) & 0xFF : acc & 0xFF;
		}
		var c, i, k;
		if (a.refin) {
			var pr = reflect(a.poly, w);
			c = reflect(a.init, w);
			for (i = 0; i < bytes.length; i++) {
				c = u(c ^ bytes[i]);
				for (k = 0; k < 8; k++) c = (c & 1) ? u((c >>> 1) ^ pr) : c >>> 1;
			}
			if (!a.refout) c = reflect(c, w);
		} else {
			var top = w === 32 ? 0x80000000 : 1 << (w - 1);
			c = a.init;
			for (i = 0; i < bytes.length; i++) {
				c = u(c ^ (bytes[i] << (w - 8)));
				for (k = 0; k < 8; k++) c = (c & top) ? u((c << 1) ^ a.poly) : u(c << 1);
			}
			if (a.refout) c = reflect(c, w);
		}
		return u(c ^ a.xorout);
	}

	function hex(v, w) {
		var s = (v >>> 0).toString(16).toUpperCase();
		while (s.length < w / 4) s = '0' + s;
		return '0x' + s;
	}
	function byteList(v, w, le) {
		var out = [];
		for (var i = w / 8 - 1; i >= 0; i--) out.push(((v >>> (i * 8)) & 0xFF).toString(16).toUpperCase().padStart(2, '0'));
		return (le ? out.reverse() : out).join(' ');
	}

	function parseHexBytes(s) {
		var t = s.replace(/0x/gi, '').replace(/[\s,;:\-]/g, '');
		if (!t) return [];
		if (!/^[0-9a-f]*$/i.test(t)) return 'Chỉ nhập các ký tự 0–9, A–F (có thể cách nhau bằng dấu cách hoặc dấu phẩy).';
		if (t.length % 2) return 'Số ký tự hex phải chẵn (mỗi byte 2 ký tự).';
		var out = [];
		for (var i = 0; i < t.length; i += 2) out.push(parseInt(t.substr(i, 2), 16));
		return out;
	}

	function cFunc(a) {
		var T = a.w === 8 ? 'uint8_t' : a.w === 16 ? 'uint16_t' : 'uint32_t';
		var fn = a.id.replace(/[^a-z0-9]+/g, '_');
		var head = T + ' ' + fn + '(const uint8_t *data, size_t len)\n{\n';
		if (a.kind) {
			var body = a.kind === 'xor' ? '    uint8_t x = 0;\n    for (size_t i = 0; i < len; i++) x ^= data[i];\n    return x;\n'
				: '    uint8_t sum = 0;\n    for (size_t i = 0; i < len; i++) sum += data[i];\n    return ' + (a.kind === 'lrc' ? '(uint8_t)(-sum);   /* bù 2 của tổng */' : 'sum;') + '\n';
			return head + body + '}';
		}
		var s = head + '    ' + T + ' crc = ' + hex(a.refin ? reflect(a.init, a.w) : a.init, a.w) + ';\n\n    for (size_t i = 0; i < len; i++) {\n';
		if (a.refin) {
			s += '        crc ^= data[i];\n        for (int b = 0; b < 8; b++)\n            crc = (crc & 1) ? (crc >> 1) ^ ' + hex(reflect(a.poly, a.w), a.w) + ' : crc >> 1;   /* poly đảo bit */\n    }\n';
		} else {
			s += '        crc ^= ' + (a.w === 8 ? 'data[i]' : '(' + T + ')data[i] << ' + (a.w - 8)) + ';\n        for (int b = 0; b < 8; b++)\n            crc = (crc & ' + hex(a.w === 32 ? 0x80000000 : 1 << (a.w - 1), a.w) + ') ? (' + T + ')((crc << 1) ^ ' + hex(a.poly, a.w) + ') : (' + T + ')(crc << 1);\n    }\n';
		}
		if (a.refin !== a.refout) {
			s += '\n    /* refin khác refout: đảo thứ tự bit của kết quả */\n    ' + T + ' r = 0;\n    for (int b = 0; b < ' + a.w + '; b++) { r = (r << 1) | (crc & 1); crc >>= 1; }\n    crc = r;\n';
		}
		s += '    return crc' + (a.xorout ? ' ^ ' + hex(a.xorout, a.w) : '') + ';' + (a.le ? '   /* gửi đi: byte thấp trước */' : '') + '\n}';
		return s;
	}

	E.mount('crc', function (root) {
		var uid = root.id || 'kn-crc';
		root.innerHTML =
			'<div class="kn-calc__body kn-crc__body">' +
				'<div class="kn-calc__inputs">' +
					'<div class="kn-calc__field"><span class="kn-calc__label">Dữ liệu nhập vào là</span><div class="kn-calc__seg" data-x="mode">' +
						'<button type="button" data-v="hex" aria-pressed="true">Byte hex</button><button type="button" data-v="text" aria-pressed="false">Chuỗi ký tự</button></div></div>' +
					'<div class="kn-calc__field"><label for="' + uid + '-d">Dữ liệu</label><textarea id="' + uid + '-d" data-x="data" rows="4" spellcheck="false">01 03 00 00 00 0A</textarea></div>' +
					'<p class="kn-calc__hint" data-x="info"></p>' +
					'<details class="kn-crc__custom"><summary>Tự cấu hình CRC</summary>' +
						'<div class="kn-crc__cgrid">' +
							'<div class="kn-calc__field"><label for="' + uid + '-cw">Độ rộng</label><select id="' + uid + '-cw" data-c="w"><option>8</option><option selected>16</option><option>32</option></select></div>' +
							'<div class="kn-calc__field"><label for="' + uid + '-cp">Poly</label><input type="text" id="' + uid + '-cp" data-c="poly" value="0x1021"></div>' +
							'<div class="kn-calc__field"><label for="' + uid + '-ci">Init</label><input type="text" id="' + uid + '-ci" data-c="init" value="0xFFFF"></div>' +
							'<div class="kn-calc__field"><label for="' + uid + '-cx">XorOut</label><input type="text" id="' + uid + '-cx" data-c="xorout" value="0x0000"></div>' +
						'</div>' +
						'<div class="kn-crc__checks"><label><input type="checkbox" data-c="refin"> RefIn (đảo bit byte vào)</label><label><input type="checkbox" data-c="refout"> RefOut (đảo bit kết quả)</label></div>' +
					'</details>' +
				'</div>' +
				'<div class="kn-calc__results">' +
					'<div class="kn-calc__big" aria-live="polite" data-x="big"></div>' +
					'<dl class="kn-calc__stats" data-x="stats"></dl>' +
				'</div>' +
			'</div>' +
			'<div class="kn-calc__more">' +
				'<div><h3 class="kn-calc__h">Kết quả mọi thuật toán</h3><p class="kn-calc__hint">Bấm vào một dòng để xem chi tiết và code C.</p><div class="kn-calc__table-wrap" data-x="table"></div></div>' +
				'<div><div class="kn-crc__head"><h3 class="kn-calc__h">Hàm C</h3><button type="button" class="kn-hex__copy kn-crc__copy" data-x="copy">Sao chép</button></div><pre class="kn-crc__code" data-x="code"></pre></div>' +
			'</div>';

		var x = function (k) { return root.querySelector('[data-x="' + k + '"]'); };
		var c = function (k) { return root.querySelector('[data-c="' + k + '"]'); };
		var st = { mode: 'hex', sel: 'crc16-modbus' };

		function custom() {
			var w = Number(c('w').value), p = function (k) { return parseInt(c(k).value.replace(/^0x/i, ''), 16); };
			var m = w === 32 ? 0xFFFFFFFF : (1 << w) - 1;
			var poly = p('poly'), init = p('init'), xo = p('xorout');
			if ([poly, init, xo].some(function (v) { return !(v >= 0); })) return null;
			return { id: 'custom', name: 'Tùy chỉnh', w: w, poly: (poly & m) >>> 0, init: (init & m) >>> 0, xorout: (xo & m) >>> 0, refin: c('refin').checked, refout: c('refout').checked, use: 'Tham số tự nhập' };
		}

		function compute() {
			var raw = x('data').value, bytes;
			if (st.mode === 'text') {
				bytes = Array.prototype.slice.call(new TextEncoder().encode(raw));
			} else {
				bytes = parseHexBytes(raw);
				if (typeof bytes === 'string') {
					x('big').innerHTML = '<p class="kn-calc__msg is-error">' + bytes + '</p>';
					x('stats').innerHTML = ''; x('table').innerHTML = '';
					return;
				}
			}
			x('info').textContent = bytes.length + ' byte' + (st.mode === 'text' ? ' (mã hóa UTF-8)' : '') + '.';
			var list = ALGOS.slice(), cu = custom();
			if (cu) list.push(cu);
			var a = list.filter(function (q) { return q.id === st.sel; })[0] || list[0];
			var v = crc(bytes, a);

			x('big').innerHTML = '<span class="kn-calc__big-label">' + E.esc(a.name) + '</span><span class="kn-calc__big-val">' + hex(v, a.w) + '</span>' +
				'<span class="kn-calc__big-sub">' + E.esc(a.use) + '</span>';
			x('stats').innerHTML =
				'<div><dt>Thập phân</dt><dd>' + (v >>> 0) + '</dd></div>' +
				(a.w > 8 ? '<div><dt>Byte gửi đi' + (a.le ? ' (byte thấp trước)' : ' (byte cao trước)') + '</dt><dd>' + byteList(v, a.w, !!a.le) + '</dd></div>' : '') +
				(st.mode === 'hex' && a.w > 8 ? '<div><dt>Khung hoàn chỉnh</dt><dd class="kn-crc__wrap">' + bytes.map(function (b) { return b.toString(16).toUpperCase().padStart(2, '0'); }).join(' ') + ' ' + byteList(v, a.w, !!a.le) + '</dd></div>' : '') +
				(a.kind ? '' : '<div><dt>Tham số</dt><dd class="kn-crc__wrap">poly ' + hex(a.poly, a.w) + ', init ' + hex(a.init, a.w) + ', refin ' + a.refin + ', refout ' + a.refout + ', xorout ' + hex(a.xorout, a.w) + '</dd></div>') +
				(a.check != null ? '<div><dt>Giá trị kiểm tra ("123456789")</dt><dd>' + hex(a.check, a.w) + '</dd></div>' : '');

			x('table').innerHTML = '<table class="kn-calc__table"><thead><tr><th>Thuật toán</th><th>Kết quả</th><th>Dùng ở đâu</th></tr></thead><tbody>' +
				list.map(function (q) {
					return '<tr class="is-click' + (q.id === a.id ? ' is-active' : '') + '" data-id="' + q.id + '"><td>' + E.esc(q.name) + '</td><td>' + hex(crc(bytes, q), q.w) + '</td><td class="kn-crc__use">' + E.esc(q.use) + '</td></tr>';
				}).join('') + '</tbody></table>';
			x('code').textContent = '#include <stdint.h>\n#include <stddef.h>\n\n/* ' + a.name + ' */\n' + cFunc(a);
		}

		/* Tự kiểm tra thuật toán với chuỗi chuẩn "123456789" */
		var probe = Array.prototype.slice.call(new TextEncoder().encode('123456789'));
		ALGOS.forEach(function (a) {
			if (a.check != null && crc(probe, a) !== a.check && window.console) console.error('CRC self-test failed: ' + a.name);
		});

		root.addEventListener('input', compute);
		root.addEventListener('change', compute);
		root.addEventListener('click', function (e) {
			var tr = e.target.closest('tr[data-id]');
			if (tr) { st.sel = tr.getAttribute('data-id'); compute(); return; }
			var seg = e.target.closest('[data-x="mode"] button');
			if (seg) {
				st.mode = seg.getAttribute('data-v');
				Array.prototype.forEach.call(x('mode').querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(b === seg)); });
				x('data').value = st.mode === 'text' ? '123456789' : '01 03 00 00 00 0A';
				compute();
			}
		});
		E.copyText(x('copy'), function () { return x('code').textContent; });
		compute();
	});
})(window.KNElec);
