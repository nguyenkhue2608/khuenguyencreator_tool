/**
 * Bảng tra LUT: tính sẵn giá trị thành mảng C để chip tra thay vì tính lúc chạy.
 * Sóng: sin, tam giác, răng cưa cho DAC/PWM. f_ra = f_cập_nhật / N.
 * NTC (mô hình Beta): R(T) = R25·exp(B·(1/T − 1/298.15)), ADC = max·Rntc/(Rntc + Rpu) khi NTC nối GND.
 */
(function (E) {
	'use strict';

	var T25 = 298.15;

	function ctype(lo, hi) {
		if (lo >= 0) return hi <= 255 ? 'uint8_t' : hi <= 65535 ? 'uint16_t' : 'uint32_t';
		return lo >= -128 && hi <= 127 ? 'int8_t' : lo >= -32768 && hi <= 32767 ? 'int16_t' : 'int32_t';
	}

	/* In mảng số, mỗi dòng `per` phần tử, căn phải theo độ rộng lớn nhất. */
	function cArray(vals, per, hex) {
		var w = 0, s = vals.map(function (v) {
			var t = hex && v >= 0 ? '0x' + v.toString(16).toUpperCase() : String(v);
			w = Math.max(w, t.length);
			return t;
		});
		var lines = [];
		for (var i = 0; i < s.length; i += per) {
			lines.push('    ' + s.slice(i, i + per).map(function (t) { return (new Array(w - t.length + 1)).join(' ') + t; }).join(', ') + (i + per < s.length ? ',' : ''));
		}
		return lines.join('\n');
	}

	function chartSVG(pts, xLabel, yLabel, xFmt, yFmt, dots) {
		var W = 560, H = 230, L = 58, R = 14, T = 14, B = 34, pw = W - L - R, ph = H - T - B;
		var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
		var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
		if (y1 === y0) { y1 += 1; y0 -= 1; }
		if (x1 === x0) x1 += 1;
		var X = function (v) { return L + (v - x0) / (x1 - x0) * pw; }, Y = function (v) { return T + (1 - (v - y0) / (y1 - y0)) * ph; };
		var lbl = 'font-family:var(--kn-mono);font-size:11px;fill:var(--kn-muted)', grid = '';
		for (var i = 0; i <= 4; i++) {
			var yv = y0 + (y1 - y0) * i / 4, xv = x0 + (x1 - x0) * i / 4;
			grid += '<path d="M' + L + ' ' + Y(yv).toFixed(1) + ' H' + (L + pw) + '" style="stroke:var(--kn-line)"/>' +
				'<text x="' + (L - 6) + '" y="' + (Y(yv) + 4).toFixed(1) + '" text-anchor="end" style="' + lbl + '">' + yFmt(yv) + '</text>' +
				'<text x="' + X(xv).toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle" style="' + lbl + '">' + xFmt(xv) + '</text>';
		}
		var line = pts.map(function (p) { return X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); }).join(' ');
		var marks = dots ? pts.map(function (p) { return '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="2.5" style="fill:var(--kn-accent-ink)"/>'; }).join('') : '';
		return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Đồ thị bảng tra">' + grid +
			'<text x="' + L + '" y="10" style="' + lbl + '">' + yLabel + '</text><text x="' + (L + pw) + '" y="' + (H - 1) + '" text-anchor="end" style="' + lbl + '">' + xLabel + '</text>' +
			'<polyline points="' + line + '" style="fill:none;stroke:var(--kn-accent);stroke-width:2"/>' + marks + '</svg>';
	}

	E.mount('lut-generator', function (root) {
		var uid = root.id || 'kn-lut';
		var field = function (k, label, val, u, show) {
			return '<div class="kn-calc__field"' + (show ? ' data-show="' + show + '"' + (show === 'ntc' ? ' hidden' : '') : '') + '><label for="' + uid + '-' + k + '">' + label + '</label>' +
				(u ? '<div class="kn-calc__unit"><input type="text" id="' + uid + '-' + k + '" data-x="' + k + '" value="' + val + '" inputmode="decimal"><span>' + u + '</span></div>'
					: '<input type="text" id="' + uid + '-' + k + '" data-x="' + k + '" value="' + val + '" inputmode="decimal">') + '</div>';
		};
		var select = function (k, label, opts) {
			return '<div class="kn-calc__field"><label for="' + uid + '-' + k + '">' + label + '</label><select id="' + uid + '-' + k + '" data-x="' + k + '">' +
				opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[2] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>';
		};
		root.innerHTML =
			'<div class="kn-calc__tabs" role="tablist">' +
				'<button type="button" class="kn-calc__tab" role="tab" data-mode="wave" aria-selected="true">Sóng sin cho DAC, PWM</button>' +
				'<button type="button" class="kn-calc__tab" role="tab" data-mode="ntc" aria-selected="false">Nhiệt điện trở NTC</button>' +
			'</div>' +
			'<div class="kn-calc__body">' +
				'<div class="kn-calc__inputs">' +
					'<div data-show="wave" class="kn-calc__inputs">' +
						'<div class="kn-calc__row2">' +
							select('shape', 'Dạng sóng', [['sin', 'Sin', 1], ['tri', 'Tam giác'], ['saw', 'Răng cưa']]) +
							select('n', 'Số điểm mỗi chu kỳ', [[16, '16'], [32, '32'], [64, '64'], [100, '100'], [128, '128'], [256, '256', 1], [360, '360'], [512, '512'], [1024, '1024']]) +
						'</div>' +
						'<div class="kn-calc__row2">' +
							select('sign', 'Kiểu giá trị', [['u', 'Không dấu (DAC, PWM)', 1], ['s', 'Có dấu (DSP)']]) +
							field('max', 'Giá trị lớn nhất', '4095') +
						'</div>' +
						'<div class="kn-calc__row2">' +
							field('amp', 'Biên độ', '100', '%') +
							field('fo', 'Tần số sóng ra (tuỳ chọn)', '1k', 'Hz') +
						'</div>' +
						'<p class="kn-calc__hint">DAC 12 bit: max 4095. DAC 8 bit hoặc PWM 8 bit: 255. PWM: max bằng giá trị ARR của Timer.</p>' +
					'</div>' +
					'<div data-show="ntc" class="kn-calc__inputs" hidden>' +
						'<div class="kn-calc__row2">' + field('r25', 'R25 của NTC', '10k', 'Ω') + field('beta', 'Hệ số Beta (B25/85)', '3950', 'K') + '</div>' +
						'<div class="kn-calc__row2">' + field('rpu', 'Điện trở nối tiếp', '10k', 'Ω') +
							select('top', 'Vị trí NTC', [['bot', 'NTC nối GND (dưới)', 1], ['top', 'NTC nối VCC (trên)']]) + '</div>' +
						'<div class="kn-calc__row2">' + select('bits', 'Độ phân giải ADC', [[10, '10 bit (Arduino AVR)'], [12, '12 bit (STM32, ESP32)', 1], [16, '16 bit']]) +
							select('form', 'Kiểu bảng', [['temp', 'Theo nhiệt độ', 1], ['adc', 'Theo giá trị ADC']]) + '</div>' +
						'<div class="kn-calc__row2" data-show2="temp">' + field('tmin', 'Từ', '-20', '°C') + field('tmax', 'Đến', '100', '°C') + '</div>' +
						'<div class="kn-calc__row2">' + field('step', 'Bước nhiệt độ', '5', '°C') +
							select('size', 'Số phần tử (kiểu theo ADC)', [[32, '32'], [64, '64', 1], [128, '128'], [256, '256']]) + '</div>' +
						'<p class="kn-calc__hint">R25 và Beta có trong datasheet NTC, loại phổ biến nhất là 10 kΩ, B = 3950. Điện trở nối tiếp nên bằng R25.</p>' +
					'</div>' +
					'<div class="kn-calc__figure" data-x="fig"></div>' +
				'</div>' +
				'<div class="kn-calc__results" aria-live="polite" data-x="out"></div>' +
			'</div>' +
			'<div class="kn-calc__more"><div>' +
				'<div class="kn-img__head"><h3 class="kn-calc__h">Mảng C</h3><span><button type="button" class="kn-img__btn" data-x="copy">Sao chép</button> <a class="kn-img__btn" data-x="dl" download="lut.h" href="#">Tải file .h</a></span></div>' +
				'<pre class="kn-img__code" data-x="code"></pre></div></div>';

		var x = function (k) { return root.querySelector('[data-x="' + k + '"]'); };
		var st = { mode: 'wave', code: '', url: null };

		function setMode(m) {
			st.mode = m;
			Array.prototype.forEach.call(root.querySelectorAll('.kn-calc__tab'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-mode') === m)); });
			Array.prototype.forEach.call(root.querySelectorAll('[data-show]'), function (el) { el.hidden = el.getAttribute('data-show') !== m; });
			compute();
		}

		function setCode(code, name) {
			st.code = code;
			x('code').textContent = code;
			if (st.url) URL.revokeObjectURL(st.url);
			st.url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
			x('dl').href = st.url;
			x('dl').setAttribute('download', name + '.h');
		}

		function fail(msg) {
			x('out').innerHTML = '<p class="kn-calc__msg is-error">' + msg + '</p>';
			x('fig').innerHTML = '';
			setCode('', 'lut');
		}

		function wave() {
			var shape = x('shape').value, n = Number(x('n').value), signed = x('sign').value === 's';
			var max = Math.round(E.parse(x('max').value)), amp = E.parse(x('amp').value) / 100, fo = E.parse(x('fo').value);
			if (!(max >= 1 && max <= 2147483647)) return fail('Nhập giá trị lớn nhất là số nguyên dương, ví dụ 4095 cho DAC 12 bit hoặc 255 cho 8 bit.');
			if (!(amp > 0 && amp <= 1)) return fail('Biên độ nằm trong khoảng 1% đến 100%.');
			var vals = [];
			for (var i = 0; i < n; i++) {
				var p = i / n, s;
				if (shape === 'sin') s = Math.sin(2 * Math.PI * p);
				else if (shape === 'tri') s = p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4;
				else s = 2 * p - 1;
				vals.push(signed ? Math.round(s * amp * max) : Math.round(max / 2 + s * amp * max / 2));
			}
			var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), type = ctype(signed ? -max : 0, max);
			var name = { sin: 'sine', tri: 'triangle', saw: 'sawtooth' }[shape] + '_lut';
			var shapeName = { sin: 'sin', tri: 'tam giác', saw: 'răng cưa' }[shape];
			var bytes = n * ({ uint8_t: 1, int8_t: 1, uint16_t: 2, int16_t: 2 }[type] || 4);
			x('out').innerHTML =
				'<div class="kn-calc__big"><span class="kn-calc__big-label">Bảng ' + shapeName + ' ' + n + ' điểm</span><span class="kn-calc__big-val">' + type + '</span>' +
					'<span class="kn-calc__big-sub">Chiếm ' + bytes + ' byte Flash khi khai báo const</span></div>' +
				'<dl class="kn-calc__stats">' +
					'<div><dt>Giá trị nhỏ nhất / lớn nhất</dt><dd>' + lo + ' / ' + hi + '</dd></div>' +
					'<div><dt>Giữa thang (điểm 0)</dt><dd>' + (signed ? 0 : Math.round(max / 2)) + '</dd></div>' +
					(fo > 0 ? '<div><dt>Tốc độ xuất mẫu cần cho ' + E.fmt(fo, 'Hz') + '</dt><dd>' + E.fmt(fo * n, 'Hz') + '</dd></div>' +
						'<div><dt>Chu kỳ ngắt Timer mỗi mẫu</dt><dd>' + E.fmt(1 / (fo * n), 's') + '</dd></div>' : '') +
				'</dl>' +
				(fo * n > 1e6 ? '<p class="kn-calc__msg is-warn">Cần xuất hơn 1 triệu mẫu mỗi giây. Ngắt Timer không kịp, hãy dùng DMA, hoặc giảm số điểm.</p>' : '') +
				'<p class="kn-calc__msg is-ok">Tần số sóng ra = tốc độ xuất mẫu / ' + n + '. Đổi tần số bằng cách đổi chu kỳ Timer, không cần tính lại bảng.</p>';
			x('fig').innerHTML = chartSVG(vals.map(function (v, i) { return [i, v]; }), 'chỉ số', 'giá trị', function (v) { return Math.round(v); }, function (v) { return Math.round(v); }, n <= 64);
			setCode('/* Bảng ' + shapeName + ' ' + n + ' điểm, ' + (signed ? 'có dấu ±' + Math.round(amp * max) : 'không dấu ' + lo + '..' + hi) +
				', biên độ ' + Math.round(amp * 100) + '%. Tạo bằng khuenguyencreator.com/tools/lut-generator/ */\n' +
				'#include <stdint.h>\n\n#define ' + name.toUpperCase() + '_SIZE ' + n + '\n\n' +
				'const ' + type + ' ' + name + '[' + name.toUpperCase() + '_SIZE] = {\n' + cArray(vals, n >= 100 ? 10 : 8, false) + '\n};\n', name);
		}

		function ntc() {
			var r25 = E.parse(x('r25').value), beta = E.parse(x('beta').value), rpu = E.parse(x('rpu').value), top = x('top').value === 'top';
			var bits = Number(x('bits').value), max = Math.pow(2, bits) - 1, form = x('form').value;
			var tmin = parseFloat(x('tmin').value), tmax = parseFloat(x('tmax').value), step = parseFloat(x('step').value), size = Number(x('size').value);
			if (!(r25 > 0 && rpu > 0)) return fail('Nhập R25 và điện trở nối tiếp lớn hơn 0, ví dụ 10k.');
			if (!(beta > 500 && beta < 10000)) return fail('Hệ số Beta thường nằm trong khoảng 2000 – 5000 K, ví dụ 3950.');
			var rOf = function (t) { return r25 * Math.exp(beta * (1 / (t + 273.15) - 1 / T25)); };
			var adcOf = function (t) { var r = rOf(t), ratio = top ? rpu / (r + rpu) : r / (r + rpu); return Math.round(ratio * max); };
			var tOf = function (adc) {
				var ratio = Math.min(Math.max(adc, 0.5), max - 0.5) / max;
				var r = top ? rpu * (1 - ratio) / ratio : rpu * ratio / (1 - ratio);
				return 1 / (1 / T25 + Math.log(r / r25) / beta) - 273.15;
			};
			var res25 = Math.abs(1 / (adcOf(25.5) - adcOf(24.5)));
			var head = '/* NTC R25 = ' + E.fmt(r25, 'Ω') + ', B = ' + beta + ' K, điện trở ' + E.fmt(rpu, 'Ω') + ' nối ' + (top ? 'GND, NTC nối VCC' : 'VCC, NTC nối GND') +
				', ADC ' + bits + ' bit.\n   Tạo bằng khuenguyencreator.com/tools/lut-generator/ */\n#include <stdint.h>\n\n';
			var stats = '<div><dt>R của NTC tại 25 °C</dt><dd>' + E.fmt(r25, 'Ω') + '</dd></div>' +
				'<div><dt>ADC tại 25 °C</dt><dd>' + adcOf(25) + ' / ' + max + '</dd></div>' +
				'<div><dt>Độ nhạy quanh 25 °C</dt><dd>' + res25.toFixed(3) + ' °C mỗi bước ADC</dd></div>';
			var vals, code, pts, big;
			if (form === 'temp') {
				if (!(tmax > tmin) || !(step > 0) || (tmax - tmin) / step > 400) return fail('Nhập khoảng nhiệt độ hợp lệ (Từ nhỏ hơn Đến) và bước lớn hơn 0, tối đa 400 mốc.');
				var temps = [];
				for (var t = tmin; t <= tmax + 1e-9; t += step) temps.push(Math.round(t * 100) / 100);
				vals = temps.map(adcOf);
				pts = temps.map(function (t, i) { return [t, vals[i]]; });
				var edge = function (t) { return Math.abs(1 / (adcOf(t + 0.5) - adcOf(t - 0.5))); };
				big = ['Bảng ' + temps.length + ' mốc, ' + tmin + ' → ' + tmax + ' °C', ctype(0, max)];
				stats += '<div><dt>Độ nhạy ở ' + tmin + ' °C / ' + tmax + ' °C</dt><dd>' + edge(tmin).toFixed(2) + ' / ' + edge(tmax).toFixed(2) + ' °C mỗi bước</dd></div>';
				var dec = top ? 'tăng' : 'giảm';
				code = head + '#define NTC_T_MIN    (' + Math.round(tmin * 10) + ')   /* 0.1 °C */\n#define NTC_T_STEP   (' + Math.round(step * 10) + ')\n#define NTC_LUT_SIZE ' + temps.length + '\n\n' +
					'/* Giá trị ADC tại ' + tmin + ', ' + (tmin + step) + ', ... ' + tmax + ' °C (' + dec + ' dần) */\n' +
					'const ' + ctype(0, max) + ' ntc_lut[NTC_LUT_SIZE] = {\n' + cArray(vals, 10, false) + '\n};\n\n' +
					'/* Trả nhiệt độ theo đơn vị 0.1 °C, nội suy tuyến tính giữa 2 mốc */\n' +
					'int16_t ntc_temp_x10(uint16_t adc)\n{\n' +
					'    if (adc ' + (top ? '<=' : '>=') + ' ntc_lut[0]) return NTC_T_MIN;\n' +
					'    for (uint16_t i = 1; i < NTC_LUT_SIZE; i++) {\n' +
					'        if (adc ' + (top ? '<=' : '>=') + ' ntc_lut[i]) {\n' +
					'            int32_t a = ntc_lut[i - 1], b = ntc_lut[i];\n' +
					'            return NTC_T_MIN + (i - 1) * NTC_T_STEP + (int32_t)(adc - a) * NTC_T_STEP / (b - a);\n' +
					'        }\n    }\n    return NTC_T_MIN + (NTC_LUT_SIZE - 1) * NTC_T_STEP;\n}\n';
			} else {
				var shift = bits - Math.round(Math.log2(size)), span = Math.pow(2, shift);
				vals = [];
				for (var k = 0; k <= size; k++) vals.push(Math.round(Math.max(-550, Math.min(3000, tOf(k * span))) * 10));
				pts = vals.map(function (v, k) { return [k * span, v / 10]; });
				big = ['Bảng ' + (size + 1) + ' phần tử, tra theo ADC', 'int16_t'];
				stats += '<div><dt>Mỗi phần tử cách nhau</dt><dd>' + span + ' bước ADC</dd></div>';
				code = head + '#define NTC_SHIFT    ' + shift + '   /* ' + bits + ' bit ADC, ' + size + ' khoảng */\n#define NTC_LUT_SIZE ' + (size + 1) + '\n\n' +
					'/* Nhiệt độ (0.1 °C) tại ADC = 0, ' + span + ', ' + 2 * span + ', ... ' + size * span + '. Hai đầu bảng bị kẹp vì gần như hở mạch hoặc chập mạch. */\n' +
					'const int16_t ntc_lut[NTC_LUT_SIZE] = {\n' + cArray(vals, 10, false) + '\n};\n\n' +
					'/* Trả nhiệt độ theo đơn vị 0.1 °C, nội suy tuyến tính */\n' +
					'int16_t ntc_temp_x10(uint16_t adc)\n{\n' +
					'    uint16_t i = adc >> NTC_SHIFT;\n' +
					'    if (i >= NTC_LUT_SIZE - 1) return ntc_lut[NTC_LUT_SIZE - 1];\n' +
					'    int32_t a = ntc_lut[i], b = ntc_lut[i + 1];\n' +
					'    return a + (b - a) * (int32_t)(adc & ((1u << NTC_SHIFT) - 1)) / (1 << NTC_SHIFT);\n}\n';
			}
			x('out').innerHTML =
				'<div class="kn-calc__big"><span class="kn-calc__big-label">' + big[0] + '</span><span class="kn-calc__big-val">' + big[1] + '</span>' +
					'<span class="kn-calc__big-sub">Hàm ntc_temp_x10() trả nhiệt độ đơn vị 0.1 °C, ví dụ 253 = 25.3 °C</span></div>' +
				'<dl class="kn-calc__stats">' + stats + '</dl>' +
				(Math.abs(rpu / r25 - 1) > 0.5 ? '<p class="kn-calc__msg is-warn">Điện trở nối tiếp lệch xa R25 nên độ nhạy quanh 25 °C bị giảm. Chọn bằng R25 nếu cần đo chính xác ở nhiệt độ phòng.</p>' : '') +
				'<p class="kn-calc__msg is-ok">Đo theo tỉ lệ (ratiometric): cấp cầu chia từ cùng nguồn với Vref của ADC thì kết quả không phụ thuộc điện áp nguồn.</p>';
			x('fig').innerHTML = form === 'temp'
				? chartSVG(pts, '°C', 'ADC', function (v) { return Math.round(v); }, function (v) { return Math.round(v); }, pts.length <= 60)
				: chartSVG(pts, 'ADC', '°C', function (v) { return Math.round(v); }, function (v) { return Math.round(v); }, false);
			setCode(code, 'ntc_lut');
		}

		function compute() {
			if (st.mode === 'wave') return wave();
			Array.prototype.forEach.call(root.querySelectorAll('[data-show2]'), function (el) { el.hidden = x('form').value !== el.getAttribute('data-show2'); });
			x('size').closest('.kn-calc__field').hidden = x('form').value !== 'adc';
			x('step').closest('.kn-calc__field').hidden = x('form').value !== 'temp';
			ntc();
		}

		E.copyText(x('copy'), function () { return st.code; });
		root.addEventListener('click', function (e) {
			var tab = e.target.closest('.kn-calc__tab');
			if (tab) setMode(tab.getAttribute('data-mode'));
		});
		root.addEventListener('input', compute);
		root.addEventListener('change', compute);
		compute();
	});
})(window.KNElec);
