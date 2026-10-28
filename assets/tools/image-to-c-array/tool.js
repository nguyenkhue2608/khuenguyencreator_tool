/**
 * Ảnh -> mảng C cho màn hình nhúng: đơn sắc 1-bit (OLED), RGB565 (TFT), RGB888, grayscale.
 * Ảnh chỉ xử lý trên trình duyệt bằng canvas, không gửi đi đâu.
 */
(function (E) {
	'use strict';

	var PRESETS = [[128, 64, 'SSD1306 128×64'], [128, 32, 'SSD1306 128×32'], [160, 128, 'ST7735 160×128'], [240, 240, 'ST7789 240×240'], [320, 240, 'ILI9341 320×240'], [64, 64, 'Icon 64×64'], [32, 32, 'Icon 32×32']];
	var FORMATS = {
		mono: 'Đơn sắc 1-bit (OLED)',
		rgb565: 'RGB565 16-bit (TFT)',
		rgb888: 'RGB888 24-bit',
		gray: 'Grayscale 8-bit'
	};
	var ORDERS = {
		hmsb: 'Ngang, bit cao trước (Adafruit GFX drawBitmap)',
		hlsb: 'Ngang, bit thấp trước (XBM, U8g2 drawXBMP)',
		page: 'Dọc theo page 8 pixel (buffer SSD1306)'
	};

	function sampleImage() {
		var c = document.createElement('canvas');
		c.width = 256; c.height = 128;
		var g = c.getContext('2d');
		g.fillStyle = '#000'; g.fillRect(0, 0, 256, 128);
		g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(6, 6, 244, 116);
		g.fillStyle = '#fff'; g.textAlign = 'center';
		g.font = 'bold 46px sans-serif'; g.fillText('Xin chào!', 128, 64);
		g.font = '22px sans-serif'; g.fillText('ESP32 + OLED', 128, 102);
		return c;
	}

	function hex2(v) { return '0x' + v.toString(16).toUpperCase().padStart(2, '0'); }
	function hex4(v) { return '0x' + v.toString(16).toUpperCase().padStart(4, '0'); }
	function ident(s) { var t = String(s || '').trim().replace(/[^A-Za-z0-9_]/g, '_'); return /^[A-Za-z_]/.test(t) ? t : 'img_' + t; }

	E.mount('image-to-c-array', function (root) {
		var uid = root.id || 'kn-img';
		root.innerHTML =
			'<div class="kn-calc__body kn-img__body">' +
				'<div class="kn-calc__inputs">' +
					'<label class="kn-img__drop" data-x="drop" for="' + uid + '-f">' +
						'<input type="file" id="' + uid + '-f" data-x="file" accept="image/*">' +
						'<strong>Chọn ảnh</strong> hoặc kéo thả vào đây<br><span>Có thể dán ảnh bằng Ctrl + V. PNG, JPG, GIF, BMP, SVG.</span>' +
					'</label>' +
					'<p class="kn-calc__hint" data-x="src">Đang dùng ảnh mẫu.</p>' +
					'<div class="kn-calc__field"><label for="' + uid + '-p">Kích thước màn hình</label><select id="' + uid + '-p" data-x="preset">' +
						PRESETS.map(function (p, i) { return '<option value="' + i + '">' + p[2] + '</option>'; }).join('') + '<option value="custom">Tự nhập…</option></select></div>' +
					'<div class="kn-calc__row2">' +
						'<div class="kn-calc__field"><label for="' + uid + '-w">Rộng (px)</label><input type="number" id="' + uid + '-w" data-x="w" value="128" min="1" max="800"></div>' +
						'<div class="kn-calc__field"><label for="' + uid + '-h">Cao (px)</label><input type="number" id="' + uid + '-h" data-x="h" value="64" min="1" max="800"></div>' +
					'</div>' +
					'<div class="kn-calc__field"><span class="kn-calc__label">Cách đưa ảnh vào khung</span><div class="kn-calc__seg" data-x="fit">' +
						'<button type="button" data-v="contain" aria-pressed="true">Vừa khung</button><button type="button" data-v="cover" aria-pressed="false">Phủ kín</button><button type="button" data-v="stretch" aria-pressed="false">Kéo giãn</button></div></div>' +
					'<div class="kn-calc__field"><label for="' + uid + '-fmt">Định dạng màu</label><select id="' + uid + '-fmt" data-x="fmt">' +
						Object.keys(FORMATS).map(function (k) { return '<option value="' + k + '">' + FORMATS[k] + '</option>'; }).join('') + '</select></div>' +
					'<div class="kn-img__opts" data-show="mono">' +
						'<div class="kn-calc__field"><label for="' + uid + '-o">Thứ tự byte</label><select id="' + uid + '-o" data-x="order">' +
							Object.keys(ORDERS).map(function (k) { return '<option value="' + k + '">' + ORDERS[k] + '</option>'; }).join('') + '</select></div>' +
						'<div class="kn-calc__field"><label for="' + uid + '-t">Ngưỡng sáng: <b data-x="tv">128</b></label><input type="range" id="' + uid + '-t" data-x="th" min="1" max="254" value="128"></div>' +
						'<div class="kn-img__checks"><label><input type="checkbox" data-x="dither"> Dither (giữ chi tiết ảnh chụp)</label><label><input type="checkbox" data-x="inv"> Đảo màu</label></div>' +
					'</div>' +
					'<div class="kn-img__opts" data-show="rgb565" hidden>' +
						'<div class="kn-calc__field"><label for="' + uid + '-a">Kiểu mảng</label><select id="' + uid + '-a" data-x="arr">' +
							'<option value="u16">uint16_t (TFT_eSPI pushImage, Adafruit drawRGBBitmap)</option><option value="u8be">uint8_t, byte cao trước (gửi thẳng qua SPI)</option><option value="u8le">uint8_t, byte thấp trước (LVGL, bộ nhớ little-endian)</option></select></div>' +
					'</div>' +
					'<div class="kn-calc__row2">' +
						'<div class="kn-calc__field"><label for="' + uid + '-n">Tên biến</label><input type="text" id="' + uid + '-n" data-x="name" value="my_image" spellcheck="false"></div>' +
						'<div class="kn-calc__field"><span class="kn-calc__label">Lưu ở Flash</span><label class="kn-img__check"><input type="checkbox" data-x="progmem" checked> Thêm PROGMEM (Arduino AVR, ESP8266)</label></div>' +
					'</div>' +
				'</div>' +
				'<div class="kn-calc__results">' +
					'<div class="kn-img__screen" data-x="screen"><canvas data-x="cv"></canvas></div>' +
					'<dl class="kn-calc__stats" data-x="stats"></dl>' +
				'</div>' +
			'</div>' +
			'<div class="kn-calc__more"><div>' +
				'<div class="kn-img__head"><h3 class="kn-calc__h">Mảng C</h3><span><button type="button" class="kn-img__btn" data-x="copy">Sao chép</button> <a class="kn-img__btn" data-x="dl" download="my_image.h" href="#">Tải file .h</a></span></div>' +
				'<pre class="kn-img__code" data-x="code"></pre></div></div>';

		var x = function (k) { return root.querySelector('[data-x="' + k + '"]'); };
		var st = { src: sampleImage(), fit: 'contain', code: '', url: null };

		function fitDraw(g, img, w, h) {
			var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
			g.clearRect(0, 0, w, h);
			if (st.fit === 'stretch') { g.drawImage(img, 0, 0, w, h); return; }
			var s = st.fit === 'cover' ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
			var dw = iw * s, dh = ih * s;
			g.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
		}

		function render() {
			var w = Math.max(1, Math.min(800, Math.floor(Number(x('w').value) || 1)));
			var h = Math.max(1, Math.min(800, Math.floor(Number(x('h').value) || 1)));
			var fmt = x('fmt').value, name = ident(x('name').value);
			var work = document.createElement('canvas');
			work.width = w; work.height = h;
			var g = work.getContext('2d', { willReadFrequently: true });
			fitDraw(g, st.src, w, h);
			var px = g.getImageData(0, 0, w, h).data;

			var cv = x('cv'), out = cv.getContext('2d');
			cv.width = w; cv.height = h;
			var view = out.createImageData(w, h), vd = view.data;
			var lines = [], count = 0, type = 'uint8_t', usage = '', desc = '';

			if (fmt === 'mono') {
				var th = Number(x('th').value), inv = x('inv').checked, order = x('order').value;
				var lum = new Float32Array(w * h), on = new Uint8Array(w * h);
				for (var i = 0; i < w * h; i++) {
					var a = px[i * 4 + 3] / 255;
					lum[i] = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) * a;
				}
				for (var yy = 0; yy < h; yy++) {
					for (var xx = 0; xx < w; xx++) {
						var k = yy * w + xx, old = lum[k], bit = old >= th ? 1 : 0;
						on[k] = inv ? 1 - bit : bit;
						if (x('dither').checked) { /* Floyd–Steinberg */
							var err = old - (bit ? 255 : 0);
							if (xx + 1 < w) lum[k + 1] += err * 7 / 16;
							if (yy + 1 < h) {
								if (xx > 0) lum[k + w - 1] += err * 3 / 16;
								lum[k + w] += err * 5 / 16;
								if (xx + 1 < w) lum[k + w + 1] += err / 16;
							}
						}
					}
				}
				for (var p = 0; p < w * h; p++) {
					var lit = on[p];
					vd[p * 4] = lit ? 140 : 8; vd[p * 4 + 1] = lit ? 220 : 14; vd[p * 4 + 2] = lit ? 255 : 26; vd[p * 4 + 3] = 255;
				}
				var bytes = [];
				if (order === 'page') {
					for (var pg = 0; pg < Math.ceil(h / 8); pg++) {
						for (var cx = 0; cx < w; cx++) {
							var b = 0;
							for (var bt = 0; bt < 8; bt++) { var ry = pg * 8 + bt; if (ry < h && on[ry * w + cx]) b |= 1 << bt; }
							bytes.push(b);
						}
					}
				} else {
					var bpr = Math.ceil(w / 8);
					for (var ry2 = 0; ry2 < h; ry2++) {
						for (var bx = 0; bx < bpr; bx++) {
							var v = 0;
							for (var bi = 0; bi < 8; bi++) {
								var c2 = bx * 8 + bi;
								if (c2 < w && on[ry2 * w + c2]) v |= order === 'hmsb' ? 0x80 >> bi : 1 << bi;
							}
							bytes.push(v);
						}
					}
				}
				count = bytes.length;
				for (var l = 0; l < bytes.length; l += 16) lines.push(bytes.slice(l, l + 16).map(hex2).join(', '));
				desc = 'đơn sắc 1-bit, ' + ORDERS[order].charAt(0).toLowerCase() + ORDERS[order].slice(1) + ', bit 1 = điểm sáng';
				usage = order === 'hmsb' ? 'display.drawBitmap(0, 0, ' + name + ', ' + w + ', ' + h + ', SSD1306_WHITE);   /* Adafruit_SSD1306 / Adafruit GFX */'
					: order === 'hlsb' ? 'u8g2.drawXBMP(0, 0, ' + w + ', ' + h + ', ' + name + ');'
					: 'memcpy(oled_buffer, ' + name + ', sizeof(' + name + '));   /* ghi thẳng vào buffer ' + w + '×' + h + ' rồi gửi lên SSD1306 */';
			} else {
				var vals = [];
				for (var q = 0; q < w * h; q++) {
					var al = px[q * 4 + 3] / 255;
					var r = Math.round(px[q * 4] * al), gg = Math.round(px[q * 4 + 1] * al), bb = Math.round(px[q * 4 + 2] * al);
					if (fmt === 'rgb565') {
						var v565 = ((r >> 3) << 11) | ((gg >> 2) << 5) | (bb >> 3);
						vals.push(v565);
						vd[q * 4] = ((v565 >> 11) & 31) * 255 / 31; vd[q * 4 + 1] = ((v565 >> 5) & 63) * 255 / 63; vd[q * 4 + 2] = (v565 & 31) * 255 / 31;
					} else if (fmt === 'rgb888') {
						vals.push(r, gg, bb);
						vd[q * 4] = r; vd[q * 4 + 1] = gg; vd[q * 4 + 2] = bb;
					} else {
						var y8 = Math.round(0.299 * r + 0.587 * gg + 0.114 * bb);
						vals.push(y8);
						vd[q * 4] = vd[q * 4 + 1] = vd[q * 4 + 2] = y8;
					}
					vd[q * 4 + 3] = 255;
				}
				if (fmt === 'rgb565') {
					var arr = x('arr').value;
					if (arr === 'u16') {
						type = 'uint16_t'; count = vals.length;
						for (var l2 = 0; l2 < vals.length; l2 += 12) lines.push(vals.slice(l2, l2 + 12).map(hex4).join(', '));
						usage = 'tft.pushImage(0, 0, ' + w + ', ' + h + ', ' + name + ');   /* TFT_eSPI; Adafruit GFX: tft.drawRGBBitmap(...) */';
					} else {
						var bs = [];
						vals.forEach(function (v) { if (arr === 'u8be') bs.push(v >> 8, v & 0xFF); else bs.push(v & 0xFF, v >> 8); });
						count = bs.length;
						for (var l3 = 0; l3 < bs.length; l3 += 16) lines.push(bs.slice(l3, l3 + 16).map(hex2).join(', '));
						usage = arr === 'u8be' ? '/* Gửi lần lượt từng byte qua SPI sau lệnh ghi vùng nhớ (0x2C) của ST7735 / ILI9341 */' : '/* LVGL: dùng làm data của lv_image_dsc_t với cf = LV_COLOR_FORMAT_RGB565 */';
					}
					desc = 'RGB565, ' + x('arr').selectedOptions[0].textContent;
				} else {
					count = vals.length;
					for (var l4 = 0; l4 < vals.length; l4 += 16) lines.push(vals.slice(l4, l4 + 16).map(hex2).join(', '));
					desc = fmt === 'rgb888' ? 'RGB888, mỗi điểm 3 byte R, G, B' : 'grayscale 8-bit, 0 = đen, 255 = trắng';
					usage = '/* Mỗi điểm ' + (fmt === 'rgb888' ? '3 byte' : '1 byte') + ', quét từ trái sang phải, trên xuống dưới */';
				}
			}
			out.putImageData(view, 0, 0);
			var scale = Math.max(1, Math.floor(Math.min(520 / w, 300 / h)));
			cv.style.width = (w * scale) + 'px';
			cv.style.height = (h * scale) + 'px';
			x('screen').classList.toggle('is-oled', fmt === 'mono');

			var pm = x('progmem').checked ? ' PROGMEM' : '';
			var sizeBytes = count * (type === 'uint16_t' ? 2 : 1);
			st.code = '/* ' + name + ': ' + w + '×' + h + ' px, ' + desc + ' */\n' +
				'/* Tạo bởi khuenguyencreator.com/tools/image-to-c-array */\n' +
				'#include <stdint.h>\n' + (pm ? '#include <Arduino.h>   /* có sẵn PROGMEM; bỏ PROGMEM và dòng này nếu không dùng Arduino */\n' : '') + '\n' +
				'#define ' + name.toUpperCase() + '_WIDTH  ' + w + '\n#define ' + name.toUpperCase() + '_HEIGHT ' + h + '\n\n' +
				'const ' + type + ' ' + name + '[' + count + ']' + pm + ' = {\n  ' + lines.join(',\n  ') + '\n};\n\n' +
				'/* Cách dùng: ' + usage.replace(/\/\*|\*\//g, '').trim() + ' */\n';
			var shown = st.code.length > 400000 ? st.code.slice(0, 400000) + '\n… (đã rút gọn khi hiển thị, nút Sao chép và Tải file vẫn lấy đủ)' : st.code;
			x('code').textContent = shown;

			if (st.url) URL.revokeObjectURL(st.url);
			st.url = URL.createObjectURL(new Blob([st.code], { type: 'text/plain' }));
			x('dl').href = st.url;
			x('dl').setAttribute('download', name + '.h');

			x('stats').innerHTML =
				'<div><dt>Kích thước</dt><dd>' + w + ' × ' + h + ' px</dd></div>' +
				'<div><dt>Dung lượng mảng</dt><dd>' + sizeBytes.toLocaleString('vi-VN') + ' byte (' + E.trim(sizeBytes / 1024, 3) + ' KB)</dd></div>' +
				'<div><dt>Số phần tử</dt><dd>' + count.toLocaleString('vi-VN') + ' × ' + type + '</dd></div>' +
				(sizeBytes > 32768 ? '<div><dt>Lưu ý</dt><dd class="kn-img__warn">Lớn hơn 32 KB: không vừa Flash của Arduino Uno</dd></div>' : '');
		}

		function loadFile(file) {
			if (!file || !/^image\//.test(file.type)) { x('src').textContent = 'File không phải ảnh. Hãy chọn PNG, JPG, GIF, BMP hoặc SVG.'; return; }
			var reader = new FileReader();
			reader.onload = function () {
				var img = new Image();
				img.onload = function () {
					st.src = img;
					x('src').textContent = 'Ảnh: ' + file.name + ' (' + img.naturalWidth + ' × ' + img.naturalHeight + ' px)';
					var base = file.name.replace(/\.[^.]+$/, '');
					if (x('name').value === 'my_image') x('name').value = ident(base).toLowerCase();
					render();
				};
				img.onerror = function () { x('src').textContent = 'Không đọc được ảnh này.'; };
				img.src = reader.result;
			};
			reader.readAsDataURL(file);
		}

		x('file').addEventListener('change', function () { loadFile(x('file').files[0]); });
		['dragenter', 'dragover'].forEach(function (ev) { x('drop').addEventListener(ev, function (e) { e.preventDefault(); x('drop').classList.add('is-over'); }); });
		['dragleave', 'drop'].forEach(function (ev) { x('drop').addEventListener(ev, function (e) { e.preventDefault(); x('drop').classList.remove('is-over'); }); });
		x('drop').addEventListener('drop', function (e) { loadFile(e.dataTransfer.files[0]); });
		document.addEventListener('paste', function (e) {
			var item = Array.prototype.filter.call((e.clipboardData || {}).items || [], function (i) { return /^image\//.test(i.type); })[0];
			if (item) loadFile(item.getAsFile());
		});

		x('preset').addEventListener('change', function () {
			var p = PRESETS[Number(x('preset').value)];
			if (p) { x('w').value = p[0]; x('h').value = p[1]; x('fmt').value = p[0] >= 160 ? 'rgb565' : 'mono'; showOpts(); }
			render();
		});
		function showOpts() {
			var f = x('fmt').value;
			Array.prototype.forEach.call(root.querySelectorAll('[data-show]'), function (el) { el.hidden = el.getAttribute('data-show') !== f; });
		}
		x('fmt').addEventListener('change', function () { showOpts(); render(); });
		x('th').addEventListener('input', function () { x('tv').textContent = x('th').value; });
		root.addEventListener('input', function (e) {
			if (e.target === x('w') || e.target === x('h')) x('preset').value = 'custom';
			if (e.target !== x('file')) render();
		});
		root.addEventListener('change', function (e) { if (e.target.type === 'checkbox' || e.target === x('order') || e.target === x('arr')) render(); });
		x('fit').addEventListener('click', function (e) {
			var b = e.target.closest('button[data-v]');
			if (!b) return;
			st.fit = b.getAttribute('data-v');
			Array.prototype.forEach.call(x('fit').querySelectorAll('button'), function (btn) { btn.setAttribute('aria-pressed', String(btn === b)); });
			render();
		});
		E.copyText(x('copy'), function () { return st.code; });
		render();
	});
})(window.KNElec);
