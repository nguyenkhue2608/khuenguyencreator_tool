/**
 * Tạo font bitmap cho LCD / OLED: vẽ từng ký tự bằng canvas, xuất GFXfont (Adafruit GFX) hoặc mảng ô cố định.
 */
(function (E) {
	'use strict';

	var FONTS = [
		{ v: 'sans-serif', n: 'Sans-serif (font hệ thống)' },
		{ v: 'serif', n: 'Serif (font hệ thống)' },
		{ v: 'monospace', n: 'Monospace (font hệ thống)' },
		{ v: 'Roboto', n: 'Roboto', g: 'Roboto:wght@400;700' },
		{ v: 'Roboto Mono', n: 'Roboto Mono', g: 'Roboto+Mono:wght@400;700' },
		{ v: 'Open Sans', n: 'Open Sans', g: 'Open+Sans:wght@400;700' },
		{ v: 'Orbitron', n: 'Orbitron (kiểu đồng hồ số)', g: 'Orbitron:wght@400;700' },
		{ v: 'Press Start 2P', n: 'Press Start 2P (pixel 8-bit)', g: 'Press+Start+2P' },
		{ v: 'VT323', n: 'VT323 (pixel terminal)', g: 'VT323' }
	];
	var SETS = {
		ascii: { n: 'ASCII in được (khoảng trắng tới ~)', s: rangeStr(32, 126) },
		digits: { n: 'Số và dấu cho đồng hồ, cảm biến', s: ' 0123456789.,:-+%°CV' },
		upper: { n: 'Chữ hoa, số và dấu', s: ' ' + rangeStr(48, 57) + rangeStr(65, 90) + '.,:-!?' },
		custom: { n: 'Tự nhập ký tự', s: null }
	};
	function rangeStr(a, b) { var s = ''; for (var i = a; i <= b; i++) s += String.fromCharCode(i); return s; }
	function ident(s) { var t = String(s || '').trim().replace(/[^A-Za-z0-9_]/g, '_'); return /^[A-Za-z_]/.test(t) ? t : 'Font_' + t; }
	function hex2(v) { return '0x' + v.toString(16).toUpperCase().padStart(2, '0'); }
	function uniq(str) { var seen = {}, out = []; Array.from(str).forEach(function (c) { if (!seen[c]) { seen[c] = 1; out.push(c); } }); return out; }

	function ensureGoogle(f) {
		if (!f.g || document.querySelector('link[data-kn-font="' + f.v + '"]')) return;
		var l = document.createElement('link');
		l.rel = 'stylesheet';
		l.href = 'https://fonts.googleapis.com/css2?family=' + f.g + '&display=swap';
		l.setAttribute('data-kn-font', f.v);
		document.head.appendChild(l);
	}

	/* Font đã tải chưa: so độ rộng chữ khi kèm font dự phòng với khi chỉ dùng font dự phòng.
	   (document.fonts.check trả true cả khi stylesheet chưa tải, nên không dùng được.) */
	function fontLoaded(css, prefix) {
		var g = document.createElement('canvas').getContext('2d'), probe = 'mmmWWWiii0123456789';
		return ['serif', 'monospace'].some(function (fb) {
			g.font = css + ', ' + fb; var a = g.measureText(probe).width;
			g.font = prefix + fb; return Math.abs(a - g.measureText(probe).width) > 0.5;
		});
	}

	/* Vẽ một ký tự, trả về bbox và bitmap theo ngưỡng alpha. Gốc toạ độ: điểm baseline của con trỏ. */
	function rasterize(ch, font, size, th) {
		var pad = size, c = document.createElement('canvas');
		c.width = size * 4; c.height = size * 3;
		var g = c.getContext('2d', { willReadFrequently: true });
		g.font = font;
		g.textBaseline = 'alphabetic';
		g.fillStyle = '#000';
		var base = size * 2;
		g.fillText(ch, pad, base);
		var adv = Math.round(g.measureText(ch).width);
		var d = g.getImageData(0, 0, c.width, c.height).data;
		var x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
		for (var y = 0; y < c.height; y++) for (var x = 0; x < c.width; x++) {
			if (d[(y * c.width + x) * 4 + 3] >= th) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
		}
		if (x1 < 0) return { ch: ch, w: 0, h: 0, adv: adv, xo: 0, yo: 0, bits: [] };
		var w = x1 - x0 + 1, h = y1 - y0 + 1, bits = [];
		for (var yy = y0; yy <= y1; yy++) for (var xx = x0; xx <= x1; xx++) bits.push(d[(yy * c.width + xx) * 4 + 3] >= th ? 1 : 0);
		return { ch: ch, w: w, h: h, adv: adv, xo: x0 - pad, yo: y0 - base, bits: bits };
	}

	E.mount('font-generator', function (root) {
		var uid = root.id || 'kn-font';
		root.innerHTML =
			'<div class="kn-calc__body kn-font__body">' +
				'<div class="kn-calc__inputs">' +
					'<label class="kn-font__drop" data-x="drop" for="' + uid + '-up">' +
						'<input type="file" id="' + uid + '-up" data-x="up" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2">' +
						'<strong>Tải font của bạn lên</strong> hoặc kéo thả file vào đây<br><span>.ttf, .otf, .woff, .woff2. Font chỉ được đọc trên trình duyệt, không gửi đi đâu.</span>' +
					'</label>' +
					'<p class="kn-calc__msg is-error" data-x="uperr" hidden></p>' +
					'<div class="kn-calc__field"><label for="' + uid + '-f">Font chữ</label><select id="' + uid + '-f" data-x="font">' +
						FONTS.map(function (f) { return '<option value="' + E.esc(f.v) + '">' + E.esc(f.n) + '</option>'; }).join('') + '</select></div>' +
					'<div class="kn-calc__row2">' +
						'<div class="kn-calc__field"><label for="' + uid + '-s">Cỡ chữ (px)</label><input type="number" id="' + uid + '-s" data-x="size" value="16" min="6" max="64"></div>' +
						'<div class="kn-calc__field"><span class="kn-calc__label">Kiểu</span><label class="kn-font__check"><input type="checkbox" data-x="bold"> Chữ đậm</label></div>' +
					'</div>' +
					'<div class="kn-calc__field"><label for="' + uid + '-set">Tập ký tự</label><select id="' + uid + '-set" data-x="set">' +
						Object.keys(SETS).map(function (k) { return '<option value="' + k + '">' + SETS[k].n + '</option>'; }).join('') + '</select></div>' +
					'<div class="kn-calc__field" data-x="customw" hidden><label for="' + uid + '-c">Các ký tự cần dùng</label><input type="text" id="' + uid + '-c" data-x="custom" value="0123456789:°C"></div>' +
					'<div class="kn-calc__field"><label for="' + uid + '-t">Ngưỡng nét: <b data-x="tv">110</b></label><input type="range" id="' + uid + '-t" data-x="th" min="20" max="240" value="110"></div>' +
					'<div class="kn-calc__field"><label for="' + uid + '-o">Định dạng xuất</label><select id="' + uid + '-o" data-x="out">' +
						'<option value="gfx">Adafruit GFX (GFXfont, dùng với setFont)</option><option value="fixed">Mảng ô cố định (tự viết hàm vẽ)</option></select></div>' +
					'<div class="kn-calc__row2">' +
						'<div class="kn-calc__field"><label for="' + uid + '-n">Tên font</label><input type="text" id="' + uid + '-n" data-x="name" value="MyFont16" spellcheck="false"></div>' +
						'<div class="kn-calc__field"><label for="' + uid + '-p">Chữ xem thử</label><input type="text" id="' + uid + '-p" data-x="sample" value="Hello 123!"></div>' +
					'</div>' +
					'<p class="kn-calc__hint">Font Google (Roboto, Press Start 2P…) có giấy phép mở, dùng được trong sản phẩm. Với font hệ thống hoặc font bạn tải lên, kiểm tra giấy phép có cho phép nhúng vào thiết bị trước khi dùng cho sản phẩm thương mại.</p>' +
				'</div>' +
				'<div class="kn-calc__results">' +
					'<div class="kn-font__screen"><canvas data-x="cv"></canvas></div>' +
					'<dl class="kn-calc__stats" data-x="stats"></dl>' +
					'<div class="kn-font__glyphs" data-x="glyphs"></div>' +
				'</div>' +
			'</div>' +
			'<div class="kn-calc__more"><div>' +
				'<div class="kn-img__head"><h3 class="kn-calc__h">Code font</h3><span><button type="button" class="kn-img__btn" data-x="copy">Sao chép</button> <a class="kn-img__btn" data-x="dl" href="#" download="font.h">Tải file .h</a></span></div>' +
				'<pre class="kn-img__code" data-x="code"></pre></div></div>';

		var x = function (k) { return root.querySelector('[data-x="' + k + '"]'); };
		var st = { code: '', url: null, job: 0, uploads: 0 };

		/* Nạp font người dùng tải lên bằng FontFace API rồi thêm vào danh sách chọn */
		function loadFontFile(file) {
			var err = x('uperr');
			err.hidden = true;
			if (!file) return;
			if (!/\.(ttf|otf|woff2?)$/i.test(file.name)) { err.textContent = 'Chỉ nhận file font .ttf, .otf, .woff, .woff2.'; err.hidden = false; return; }
			if (!window.FontFace) { err.textContent = 'Trình duyệt không hỗ trợ nạp font từ file. Hãy dùng Chrome, Edge hoặc Firefox bản mới.'; err.hidden = false; return; }
			var reader = new FileReader();
			reader.onload = function () {
				var family = 'KN Upload ' + (++st.uploads);
				var face = new FontFace(family, reader.result);
				face.load().then(function (loaded) {
					document.fonts.add(loaded);
					var base = file.name.replace(/\.[^.]+$/, '');
					FONTS.push({ v: family, n: 'Font tải lên: ' + base, up: true });
					var opt = document.createElement('option');
					opt.value = family;
					opt.textContent = 'Font tải lên: ' + base;
					x('font').appendChild(opt);
					x('font').value = family;
					x('name').value = ident(base.replace(/[-\s]+/g, '_')) + (x('size').value || '');
					build();
				}, function () {
					err.textContent = 'Không đọc được "' + file.name + '". File có thể bị hỏng hoặc không phải font.';
					err.hidden = false;
				});
			};
			reader.readAsArrayBuffer(file);
		}

		function chars() {
			var key = x('set').value;
			var s = key === 'custom' ? x('custom').value : SETS[key].s;
			return uniq(s).sort(function (a, b) { return a.codePointAt(0) - b.codePointAt(0); });
		}

		function build() {
			var f = FONTS.filter(function (q) { return q.v === x('font').value; })[0];
			var size = Math.max(6, Math.min(64, Math.floor(Number(x('size').value) || 16)));
			var weight = x('bold').checked ? 'bold ' : '';
			var family = /\s/.test(f.v) || f.g || f.up ? '"' + f.v + '"' : f.v;
			var css = weight + size + 'px ' + family;
			st.label = weight + size + 'px ' + (f.up ? f.n.replace('Font tải lên: ', '') : f.v);
			var list = chars();
			ensureGoogle(f);
			var job = ++st.job;
			var ready = document.fonts && f.g ? document.fonts.load(css, list.join('') || 'A') : Promise.resolve();
			var done = function () {
				if (job !== st.job) return;
				var ok = !f.g || fontLoaded(css, weight + size + 'px ');
				generate(css, size, list, ok ? null : f.n);
			};
			ready.then(done, done);
		}

		function generate(css, size, list, failedFont) {
			var th = Number(x('th').value), name = ident(x('name').value), fmt = x('out').value;
			if (!list.length) { x('code').textContent = '/* Chưa có ký tự nào */'; return; }
			var glyphs = list.map(function (ch) { return rasterize(ch, css, size, th); });
			var map = {};
			glyphs.forEach(function (g) { map[g.ch] = g; });
			var top = 0, bot = 0;
			glyphs.forEach(function (g) { if (g.h) { top = Math.min(top, g.yo); bot = Math.max(bot, g.yo + g.h); } });
			var yAdv = Math.max(Math.round(size * 1.25), bot - top + 1);
			var code = '', bytesTotal = 0;
			var first = list[0].codePointAt(0), last = list[list.length - 1].codePointAt(0);

			if (fmt === 'gfx') {
				var bitmap = [], rows = [];
				var space = map[' '] ? map[' '].adv : Math.round(size / 3);
				for (var cp = first; cp <= last; cp++) {
					var g = map[String.fromCodePoint(cp)];
					var off = bitmap.length;
					if (g && g.h) {
						var acc = 0, n = 0;
						g.bits.forEach(function (b) { acc = (acc << 1) | b; if (++n === 8) { bitmap.push(acc); acc = 0; n = 0; } });
						if (n) bitmap.push(acc << (8 - n));
					}
					var ch = String.fromCodePoint(cp);
					rows.push('  { ' + [off, g ? g.w : 0, g ? g.h : 0, g ? g.adv : space, g ? g.xo : 0, g ? g.yo : 0].map(function (v) { return String(v).padStart(5); }).join(',') +
						' }' + (cp < last ? ',' : ' ') + '   /* 0x' + cp.toString(16).toUpperCase() + (g ? " '" + (ch === '\\' ? 'backslash' : ch === '*' ? '*' : ch) + "'" : ' (không dùng)') + ' */');
				}
				var lines = [];
				for (var i = 0; i < bitmap.length; i += 16) lines.push(bitmap.slice(i, i + 16).map(hex2).join(', '));
				bytesTotal = bitmap.length + rows.length * 7 + 9;
				code = '/* ' + name + ': ' + st.label + ', ' + list.length + ' ký tự, tạo bởi khuenguyencreator.com/tools/font-generator */\n' +
					'#include <Adafruit_GFX.h>\n\n' +
					'const uint8_t ' + name + 'Bitmaps[] PROGMEM = {\n  ' + (lines.join(',\n  ') || '0x00') + '\n};\n\n' +
					'const GFXglyph ' + name + 'Glyphs[] PROGMEM = {\n  /* bitmapOffset, width, height, xAdvance, xOffset, yOffset */\n' + rows.join('\n') + '\n};\n\n' +
					'const GFXfont ' + name + ' PROGMEM = {\n  (uint8_t *)' + name + 'Bitmaps, (GFXglyph *)' + name + 'Glyphs, 0x' + first.toString(16).toUpperCase() + ', 0x' + last.toString(16).toUpperCase() + ', ' + yAdv + '\n};\n\n' +
					'/* Cách dùng:\n   display.setFont(&' + name + ');\n   display.setCursor(0, ' + (-top) + ');   // toạ độ y là đường chân chữ (baseline)\n   display.print("Hello");\n*/\n';
			} else {
				var cw = 0;
				glyphs.forEach(function (g) { cw = Math.max(cw, g.adv, g.w + Math.max(0, g.xo)); });
				var ch2 = bot - top, bpr = Math.ceil(cw / 8), per = ch2 * bpr, arr = [];
				glyphs.forEach(function (g) {
					var cell = new Array(per).fill(0);
					for (var yy = 0; yy < g.h; yy++) for (var xx = 0; xx < g.w; xx++) {
						if (!g.bits[yy * g.w + xx]) continue;
						var cx = xx + Math.max(0, g.xo), cy = yy + g.yo - top;
						if (cx < cw && cy >= 0 && cy < ch2) cell[cy * bpr + (cx >> 3)] |= 0x80 >> (cx & 7);
					}
					arr.push('  { ' + cell.map(hex2).join(', ') + ' }');
				});
				bytesTotal = arr.length * per;
				var idx = list.join('').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
				code = '/* ' + name + ': ' + st.label + ', ô ' + cw + '×' + ch2 + ' px, mỗi hàng ' + bpr + ' byte, bit cao = điểm bên trái */\n' +
					'#include <stdint.h>\n\n' +
					'#define ' + name.toUpperCase() + '_W ' + cw + '\n#define ' + name.toUpperCase() + '_H ' + ch2 + '\n\n' +
					'/* Thứ tự ký tự trong mảng (UTF-8): */\nconst char ' + name + '_chars[] = "' + idx + '";\n\n' +
					'const uint8_t ' + name + '[' + list.length + '][' + per + '] = {\n' + arr.join(',\n') + '\n};\n';
			}
			st.code = code;
			x('code').textContent = code;
			if (st.url) URL.revokeObjectURL(st.url);
			st.url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
			x('dl').href = st.url;
			x('dl').setAttribute('download', name + '.h');

			/* Xem thử bằng chính bitmap vừa tạo */
			var text = Array.from(x('sample').value || 'Hello'), W = 4, missing = [];
			text.forEach(function (c) { var g = map[c]; W += g ? g.adv : Math.round(size / 2); if (!g) missing.push(c); });
			var H = bot - top + 8, cv = x('cv'), ctx = cv.getContext('2d');
			cv.width = Math.max(8, W); cv.height = Math.max(8, H);
			ctx.fillStyle = '#10161d'; ctx.fillRect(0, 0, cv.width, cv.height);
			ctx.fillStyle = '#8cdcff';
			var cur = 2, baseY = 4 - top;
			text.forEach(function (c) {
				var g = map[c];
				if (!g) { ctx.fillStyle = '#5a3030'; ctx.fillRect(cur, baseY - size * 0.7, Math.round(size / 2) - 1, size * 0.7); ctx.fillStyle = '#8cdcff'; cur += Math.round(size / 2); return; }
				for (var yy = 0; yy < g.h; yy++) for (var xx = 0; xx < g.w; xx++) if (g.bits[yy * g.w + xx]) ctx.fillRect(cur + g.xo + xx, baseY + g.yo + yy, 1, 1);
				cur += g.adv;
			});
			var scale = Math.max(1, Math.floor(Math.min(500 / cv.width, 200 / cv.height)));
			cv.style.width = cv.width * scale + 'px'; cv.style.height = cv.height * scale + 'px';

			x('glyphs').textContent = list.join(' ');
			x('stats').innerHTML =
				'<div><dt>Số ký tự</dt><dd>' + list.length + '</dd></div>' +
				'<div><dt>Chiều cao dòng</dt><dd>' + (fmt === 'gfx' ? yAdv : bot - top) + ' px</dd></div>' +
				'<div><dt>Dung lượng Flash</dt><dd>~' + bytesTotal.toLocaleString('vi-VN') + ' byte</dd></div>' +
				(fmt === 'gfx' && last - first + 1 > 256 ? '<div><dt>Lưu ý</dt><dd class="kn-img__warn">GFXfont cần dải mã liên tục (' + (last - first + 1) + ' mục): ký tự tiếng Việt làm bảng rất lớn, nên dùng mảng ô cố định</dd></div>' : '') +
				(failedFont ? '<div><dt>Lưu ý</dt><dd class="kn-img__warn">Chưa tải được font ' + E.esc(failedFont) + ' (mạng chặn Google Fonts?), đang dùng font thay thế</dd></div>' : '') +
				(missing.length ? '<div><dt>Thiếu trong font</dt><dd class="kn-img__warn">' + E.esc(uniq(missing.join('')).join(' ')) + '</dd></div>' : '');
		}

		x('set').addEventListener('change', function () { x('customw').hidden = x('set').value !== 'custom'; build(); });
		x('up').addEventListener('change', function (e) { e.stopPropagation(); loadFontFile(x('up').files[0]); x('up').value = ''; });
		['dragenter', 'dragover'].forEach(function (ev) { x('drop').addEventListener(ev, function (e) { e.preventDefault(); x('drop').classList.add('is-over'); }); });
		['dragleave', 'drop'].forEach(function (ev) { x('drop').addEventListener(ev, function (e) { e.preventDefault(); x('drop').classList.remove('is-over'); }); });
		x('drop').addEventListener('drop', function (e) { loadFontFile(e.dataTransfer.files[0]); });
		x('th').addEventListener('input', function () { x('tv').textContent = x('th').value; });
		x('size').addEventListener('input', function () {
			var nm = x('name').value.replace(/\d+$/, '');
			if (nm && /^[A-Za-z_][A-Za-z0-9_]*$/.test(nm)) x('name').value = nm + (x('size').value || '');
		});
		root.addEventListener('input', function (e) { if (e.target !== x('up')) build(); });
		root.addEventListener('change', function (e) { if (e.target !== x('up')) build(); });
		E.copyText(x('copy'), function () { return st.code; });
		build();
	});
})(window.KNElec);
