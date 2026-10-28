/**
 * Chuyển đổi Dec / Hex / Bin / Oct theo độ rộng 8–64 bit, lưới bit bấm được, phép toán bit và mặt nạ C.
 * Dùng BigInt để đúng cả với số 64-bit.
 */
(function (E) {
	'use strict';

	function clean(s) { return String(s).trim().replace(/[\s_']/g, ''); }

	function fmtHex(v, w) {
		var s = v.toString(16).toUpperCase();
		while (s.length < w / 4) s = '0' + s;
		return '0x' + s;
	}
	function fmtBin(v, w) {
		var s = v.toString(2);
		while (s.length < w) s = '0' + s;
		return s.replace(/(.{4})(?=.)/g, '$1 ');
	}
	function toSigned(v, w) {
		return v >= (1n << BigInt(w - 1)) ? v - (1n << BigInt(w)) : v;
	}

	E.mount('hex-dec-bin', function (root) {
		var uid = root.id || 'kn-hex';
		var field = function (k, label, ph) {
			return '<div class="kn-calc__field"><label for="' + uid + '-' + k + '">' + label + '</label>' +
				'<div class="kn-hex__in"><input type="text" id="' + uid + '-' + k + '" data-f="' + k + '" placeholder="' + ph + '" autocomplete="off" spellcheck="false">' +
				'<button type="button" class="kn-hex__copy" data-copy="' + k + '" aria-label="Sao chép ' + label + '">Chép</button></div></div>';
		};
		root.innerHTML =
			'<div class="kn-calc__body kn-hex__body">' +
				'<div class="kn-calc__inputs">' +
					'<div class="kn-calc__row2">' +
						'<div class="kn-calc__field"><span class="kn-calc__label">Độ rộng</span><div class="kn-calc__seg" data-x="w">' +
							[8, 16, 32, 64].map(function (w) { return '<button type="button" data-v="' + w + '" aria-pressed="' + (w === 32) + '">' + w + '</button>'; }).join('') + '</div></div>' +
						'<div class="kn-calc__field"><span class="kn-calc__label">Kiểu số</span><div class="kn-calc__seg" data-x="sg">' +
							'<button type="button" data-v="u" aria-pressed="true">unsigned</button><button type="button" data-v="s" aria-pressed="false">signed</button></div></div>' +
					'</div>' +
					field('dec', 'Thập phân (Dec)', 'VD: 255, -1') +
					field('hex', 'Thập lục phân (Hex)', 'VD: 0xFF, FF') +
					field('bin', 'Nhị phân (Bin)', 'VD: 0b1010 1111') +
					field('oct', 'Bát phân (Oct)', 'VD: 0o377') +
					'<p class="kn-calc__msg is-error" data-x="err" hidden></p>' +
				'</div>' +
				'<div class="kn-calc__results">' +
					'<div><div class="kn-hex__head"><span class="kn-calc__label">Bấm vào từng bit để bật / tắt</span><span class="kn-calc__hint" data-x="cnt"></span></div>' +
						'<div class="kn-hex__grid" data-x="grid"></div></div>' +
					'<dl class="kn-calc__stats" data-x="stats"></dl>' +
				'</div>' +
			'</div>' +
			'<div class="kn-calc__more">' +
				'<div><div class="kn-hex__head"><h3 class="kn-calc__h">Code C với mặt nạ hiện tại</h3><button type="button" class="kn-hex__copy" data-x="copyc">Sao chép</button></div><pre class="kn-hex__code" data-x="code"></pre></div>' +
				'<div><h3 class="kn-calc__h">Phép toán bit</h3>' +
					'<div class="kn-hex__ops">' +
						'<input type="text" data-x="a" aria-label="Toán hạng A" spellcheck="false">' +
						'<select data-x="op" aria-label="Phép toán"><option value="and">AND (&amp;)</option><option value="or">OR (|)</option><option value="xor">XOR (^)</option><option value="not">NOT A (~)</option><option value="shl">A &lt;&lt; B</option><option value="shr">A &gt;&gt; B</option></select>' +
						'<input type="text" data-x="b" value="0x0F" aria-label="Toán hạng B" spellcheck="false">' +
						'<button type="button" class="kn-hex__copy" data-x="use">Dùng kết quả</button>' +
					'</div>' +
					'<dl class="kn-calc__stats" data-x="opout"></dl></div>' +
			'</div>';

		var x = function (k) { return root.querySelector('[data-x="' + k + '"]'); };
		var f = function (k) { return root.querySelector('[data-f="' + k + '"]'); };
		var st = { w: 32, signed: false, v: 0xDEADBEEFn };
		var mask = function () { return (1n << BigInt(st.w)) - 1n; };

		/* Đọc chuỗi theo cơ số; trả BigInt (dạng không dấu trong độ rộng hiện tại) hoặc chuỗi lỗi */
		function parse(kind, raw) {
			var s = clean(raw), neg = false;
			if (!s) return null;
			if (s[0] === '-') { neg = true; s = s.slice(1); }
			var v;
			try {
				if (kind === 'dec') { if (!/^\d+$/.test(s)) throw 0; v = BigInt(s); }
				if (kind === 'hex') { s = s.replace(/^0x/i, '').replace(/[uUlL]+$/, ''); if (!/^[0-9a-f]+$/i.test(s)) throw 0; v = BigInt('0x' + s); }
				if (kind === 'bin') { s = s.replace(/^0b/i, ''); if (!/^[01]+$/.test(s)) throw 0; v = BigInt('0b' + s); }
				if (kind === 'oct') { s = s.replace(/^0o/i, ''); if (!/^[0-7]+$/.test(s)) throw 0; v = BigInt('0o' + s); }
			} catch (e) { return 'Ký tự không hợp lệ cho cơ số này.'; }
			if (neg) {
				if (!st.signed && kind === 'dec') return 'Số âm cần chọn kiểu signed.';
				if (v > (1n << BigInt(st.w - 1))) return 'Số âm nhỏ hơn giới hạn của ' + st.w + '-bit signed (' + (-(1n << BigInt(st.w - 1))) + ').';
				return (-v) & mask();
			}
			if (kind === 'dec' && st.signed && v >= (1n << BigInt(st.w - 1))) return 'Vượt giới hạn ' + st.w + '-bit signed (tối đa ' + ((1n << BigInt(st.w - 1)) - 1n) + ').';
			if (v > mask()) return 'Vượt quá ' + st.w + ' bit (tối đa ' + fmtHex(mask(), st.w) + ').';
			return v;
		}

		function setFields(except) {
			var v = st.v, w = st.w;
			var vals = {
				dec: (st.signed ? toSigned(v, w) : v).toString(),
				hex: fmtHex(v, w),
				bin: fmtBin(v, w),
				oct: '0o' + v.toString(8)
			};
			Object.keys(vals).forEach(function (k) { if (k !== except) f(k).value = vals[k]; });
		}

		function bytesOf(v, w) {
			var out = [];
			for (var i = w / 8 - 1; i >= 0; i--) out.push(Number((v >> BigInt(i * 8)) & 0xFFn));
			return out; /* big-endian */
		}

		function render() {
			var v = st.v, w = st.w, bits = [];
			for (var i = w - 1; i >= 0; i--) bits.push(Number((v >> BigInt(i)) & 1n));
			var per = w > 16 ? 16 : w, rows = '';
			for (var r = 0; r < w / per; r++) {
				var cells = '', nib = '';
				for (var c = 0; c < per; c++) {
					var idx = w - 1 - (r * per + c), on = bits[r * per + c];
					cells += '<button type="button" class="kn-hex__bit' + (on ? ' is-on' : '') + (c % 4 === 0 && c ? ' is-nib' : '') + (c % 8 === 0 && c ? ' is-byte' : '') + '" data-bit="' + idx + '" aria-pressed="' + !!on + '" aria-label="Bit ' + idx + '">' +
						'<b>' + on + '</b><i>' + idx + '</i></button>';
					if (c % 4 === 3) {
						var nv = Number((v >> BigInt(idx)) & 0xFn);
						nib += '<span>' + nv.toString(16).toUpperCase() + '</span>';
					}
				}
				rows += '<div class="kn-hex__row" style="--cols:' + per + '">' + cells + '</div><div class="kn-hex__nibs" style="--cols:' + per / 4 + '">' + nib + '</div>';
			}
			x('grid').innerHTML = rows;
			var ones = bits.filter(function (b) { return b; }).length;
			x('cnt').textContent = ones + ' bit đang bật';

			var be = bytesOf(v, w), hx = function (b) { return '0x' + (b < 16 ? '0' : '') + b.toString(16).toUpperCase(); };
			var ascii = be.map(function (b) { return b >= 32 && b < 127 ? String.fromCharCode(b) : '·'; }).join('');
			x('stats').innerHTML =
				'<div><dt>Unsigned</dt><dd>' + v.toString() + '</dd></div>' +
				'<div><dt>Signed (bù 2)</dt><dd>' + toSigned(v, w).toString() + '</dd></div>' +
				(w > 8 ? '<div><dt>Byte big-endian</dt><dd>' + be.map(hx).join(' ') + '</dd></div>' +
					'<div><dt>Byte little-endian (STM32, ESP32)</dt><dd>' + be.slice().reverse().map(hx).join(' ') + '</dd></div>' : '') +
				'<div><dt>Ký tự ASCII</dt><dd>' + E.esc(ascii) + '</dd></div>';

			/* Code C */
			var set = [];
			for (var b = w - 1; b >= 0; b--) if (bits[w - 1 - b]) set.push(b);
			var suf = w > 32 ? 'ULL' : 'U', h = fmtHex(v, w) + suf;
			var expr = set.length ? set.slice(0, 8).map(function (b) { return '(1' + suf + ' << ' + b + ')'; }).join(' | ') + (set.length > 8 ? ' | …' : '') : '0' + suf;
			x('code').textContent =
				'#define MY_MASK  ' + h + '   /* ' + expr + ' */\n\n' +
				'REG |=  MY_MASK;      /* bật các bit: ' + (set.join(', ') || 'không có') + ' */\n' +
				'REG &= ~MY_MASK;      /* tắt các bit đó */\n' +
				'REG ^=  MY_MASK;      /* đảo các bit đó */\n' +
				'if ((REG & MY_MASK) == MY_MASK) { /* tất cả các bit đều đang bật */ }\n\n' +
				'uint8_t buf[' + w / 8 + '] = { ' + be.slice().reverse().map(hx).join(', ') + ' };  /* little-endian */';
			if (!x('a').value || x('a').getAttribute('data-auto') === '1') { x('a').value = fmtHex(v, w); x('a').setAttribute('data-auto', '1'); }
			ops();
		}

		function ops() {
			var a = parse('hex', x('a').value), op = x('op').value;
			var bRaw = x('b').value, b = /^\s*\d+\s*$/.test(bRaw) && op.indexOf('sh') === 0 ? BigInt(bRaw.trim()) : parse('hex', bRaw);
			if (typeof a !== 'bigint' || (op !== 'not' && typeof b !== 'bigint')) {
				x('opout').innerHTML = '<div><dt>Kết quả</dt><dd>Nhập A, B dạng hex (0x…)' + (op.indexOf('sh') === 0 ? ', B là số bit cần dịch' : '') + '</dd></div>';
				return;
			}
			var m = mask(), r;
			if (op === 'and') r = a & b;
			if (op === 'or') r = a | b;
			if (op === 'xor') r = a ^ b;
			if (op === 'not') r = ~a & m;
			if (op === 'shl') r = (a << b) & m;
			if (op === 'shr') r = st.signed ? (BigInt.asIntN(st.w, a) >> b) & m : a >> b;
			x('opout').setAttribute('data-r', r.toString());
			x('opout').innerHTML = '<div><dt>Hex</dt><dd>' + fmtHex(r, st.w) + '</dd></div><div><dt>Dec</dt><dd>' + (st.signed ? toSigned(r, st.w) : r).toString() + '</dd></div>' +
				'<div><dt>Bin</dt><dd class="kn-hex__wrap">' + fmtBin(r, st.w) + '</dd></div>';
		}

		function showErr(msg) { x('err').hidden = !msg; x('err').textContent = msg || ''; }

		root.addEventListener('input', function (e) {
			var k = e.target.getAttribute('data-f');
			if (k) {
				var r = parse(k, e.target.value);
				if (r === null) return;
				if (typeof r === 'string') { showErr(r); return; }
				showErr(null);
				st.v = r;
				x('a').setAttribute('data-auto', '1');
				setFields(k);
				render();
				return;
			}
			if (e.target === x('a')) x('a').setAttribute('data-auto', '0');
			if (e.target === x('a') || e.target === x('b')) ops();
		});
		root.addEventListener('change', function (e) { if (e.target === x('op')) ops(); });
		root.addEventListener('click', function (e) {
			var bit = e.target.closest('.kn-hex__bit');
			if (bit) {
				st.v ^= 1n << BigInt(bit.getAttribute('data-bit'));
				showErr(null);
				setFields(null);
				render();
				return;
			}
			var seg = e.target.closest('.kn-calc__seg button');
			if (seg) {
				var key = seg.parentNode.getAttribute('data-x');
				Array.prototype.forEach.call(seg.parentNode.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(b === seg)); });
				if (key === 'w') { st.w = Number(seg.getAttribute('data-v')); st.v &= mask(); }
				else st.signed = seg.getAttribute('data-v') === 's';
				showErr(null);
				x('a').setAttribute('data-auto', '1');
				setFields(null);
				render();
				return;
			}
			var cp = e.target.closest('[data-copy]');
			if (cp && navigator.clipboard) {
				navigator.clipboard.writeText(f(cp.getAttribute('data-copy')).value.replace(/\s/g, '')).then(function () {
					cp.textContent = 'Đã chép'; setTimeout(function () { cp.textContent = 'Chép'; }, 1200);
				}, function () {});
			}
			if (e.target === x('use') && x('opout').getAttribute('data-r')) {
				st.v = BigInt(x('opout').getAttribute('data-r'));
				x('a').setAttribute('data-auto', '1');
				setFields(null);
				render();
			}
		});
		E.copyText(x('copyc'), function () { return x('code').textContent; });

		setFields(null);
		render();
	});
})(window.KNElec);
