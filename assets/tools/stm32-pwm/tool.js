/**
 * STM32: tính PSC/ARR/CCR cho PWM theo tần số và duty.
 * f_PWM = f_TIM / ((PSC + 1) × (ARR + 1)),  duty = CCR / (ARR + 1)   (PWM mode 1, đếm lên)
 */
(function (S) {
	'use strict';

	var UNITS = { Hz: 1, kHz: 1e3 };
	var MIN_STEPS = 1000; /* cố giữ ít nhất 1000 mức duty nếu tần số cho phép */

	function waveSVG(arr, ccr, periodS) {
		var W = 640, H = 178, x0 = 44, xEnd = W - 46, periods = 2.5;
		var P = (xEnd - x0) / periods;
		var yTop = 18, yBot = 92, oHigh = 116, oLow = 146;
		var frac = Math.min(1, ccr / (arr + 1));
		var yCcr = yBot - frac * (yBot - yTop);

		var saw = 'M' + x0 + ' ' + yBot;
		var pwm = 'M' + x0 + ' ' + (frac > 0 ? oHigh : oLow);
		for (var k = 0; k < Math.ceil(periods); k++) {
			var xs = x0 + k * P, xe = Math.min(xEnd, xs + P), span = (xe - xs) / P;
			saw += ' L' + xe.toFixed(1) + ' ' + (yBot - span * (yBot - yTop)).toFixed(1);
			if (xe < xEnd) saw += ' L' + xe.toFixed(1) + ' ' + yBot;
			var xh = xs + frac * P;
			if (frac > 0 && frac < 1) {
				if (xh <= xEnd) pwm += ' L' + xh.toFixed(1) + ' ' + oHigh + ' L' + xh.toFixed(1) + ' ' + oLow;
				else pwm += ' L' + xEnd + ' ' + oHigh;
				if (xe < xEnd) pwm += ' L' + xe.toFixed(1) + ' ' + oLow + ' L' + xe.toFixed(1) + ' ' + oHigh;
				else if (xh <= xEnd) pwm += ' L' + xEnd + ' ' + oLow;
			} else {
				pwm += ' L' + xe.toFixed(1) + ' ' + (frac > 0 ? oHigh : oLow);
			}
		}

		var t = 'font-family:var(--kn-mono);font-size:11px;fill:var(--kn-muted)';
		var g = 'stroke:var(--kn-line);stroke-width:1';
		var m = 'stroke:var(--kn-muted);stroke-width:1';
		var by = H - 14, bxe = x0 + P;
		return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Dạng sóng bộ đếm và tín hiệu PWM">' +
			'<line x1="' + x0 + '" y1="' + yTop + '" x2="' + xEnd + '" y2="' + yTop + '" style="' + g + ';stroke-dasharray:3 3"/>' +
			'<line x1="' + x0 + '" y1="' + yBot + '" x2="' + xEnd + '" y2="' + yBot + '" style="' + g + '"/>' +
			'<line x1="' + x0 + '" y1="' + yCcr.toFixed(1) + '" x2="' + xEnd + '" y2="' + yCcr.toFixed(1) + '" style="stroke:var(--kn-warn);stroke-width:1.2;stroke-dasharray:5 4"/>' +
			'<path d="' + saw + '" style="fill:none;stroke:var(--kn-ink);stroke-width:1.6"/>' +
			'<line x1="' + x0 + '" y1="' + oLow + '" x2="' + xEnd + '" y2="' + oLow + '" style="' + g + '"/>' +
			'<path d="' + pwm + '" style="fill:none;stroke:var(--kn-accent);stroke-width:2.2;stroke-linejoin:round"/>' +
			'<text x="4" y="' + (yTop + (yBot - yTop) / 2 + 4) + '" style="' + t + ';font-weight:700">CNT</text>' +
			'<text x="4" y="' + (oHigh + 18) + '" style="' + t + ';font-weight:700">PWM</text>' +
			'<text x="' + (xEnd + 6) + '" y="' + (yTop + 4) + '" style="' + t + '">ARR</text>' +
			'<text x="' + (xEnd + 6) + '" y="' + (yCcr + 4).toFixed(1) + '" style="' + t + ';fill:var(--kn-warn)">CCR</text>' +
			'<text x="' + (xEnd + 6) + '" y="' + (yBot + 4) + '" style="' + t + '">0</text>' +
			'<line x1="' + x0 + '" y1="' + (by - 4) + '" x2="' + x0 + '" y2="' + (by + 4) + '" style="' + m + '"/>' +
			'<line x1="' + bxe.toFixed(1) + '" y1="' + (by - 4) + '" x2="' + bxe.toFixed(1) + '" y2="' + (by + 4) + '" style="' + m + '"/>' +
			'<line x1="' + x0 + '" y1="' + by + '" x2="' + bxe.toFixed(1) + '" y2="' + by + '" style="' + m + '"/>' +
			'<text x="' + (x0 + P / 2).toFixed(1) + '" y="' + (by + 12) + '" text-anchor="middle" style="' + t + ';fill:var(--kn-ink)">T = ' + S.esc(S.fmtTime(periodS)) + '</text>' +
			'</svg>';
	}

	S.mount('stm32-pwm', function (root) {
		var uid = root.id || 'kn-pwm';
		root.innerHTML =
			'<div class="kn-stm__body">' +
				'<div class="kn-stm__inputs">' +
					'<div data-x="clock"></div>' +
					'<div class="kn-stm__row2">' +
						'<div class="kn-stm__field"><label for="' + uid + '-f">Tần số PWM</label>' +
							'<div class="kn-stm__pair"><input type="number" id="' + uid + '-f" data-x="f" min="0" step="any" value="1" inputmode="decimal">' +
							'<select data-x="unit" aria-label="Đơn vị"><option>Hz</option><option selected>kHz</option></select></div></div>' +
						'<div class="kn-stm__field"><label for="' + uid + '-d">Duty (%)</label>' +
							'<input type="number" id="' + uid + '-d" data-x="duty" min="0" max="100" step="any" value="25" inputmode="decimal"></div>' +
					'</div>' +
					'<div class="kn-stm__field"><label for="' + uid + '-ch">Kênh</label>' +
						'<select id="' + uid + '-ch" data-x="ch"><option value="1">CH1</option><option value="2">CH2</option><option value="3">CH3</option><option value="4">CH4</option></select></div>' +
				'</div>' +
				'<div class="kn-stm__results" aria-live="polite" data-x="results"></div>' +
			'</div>' +
			'<div class="kn-stm__more">' +
				'<div><div class="kn-stm__head"><h3>Clock tree</h3><p class="kn-stm__hint">Đối chiếu với tab Clock Configuration trong STM32CubeMX</p></div>' +
					'<div class="kn-stm__figure" data-x="tree"></div></div>' +
				'<div><div class="kn-stm__head"><h3>Bên trong timer</h3></div><div class="kn-stm__figure" data-x="chain"></div></div>' +
				'<div><div class="kn-stm__head"><h3>Code HAL</h3><button type="button" class="kn-stm__btn" data-x="copy">Sao chép</button></div>' +
					'<pre class="kn-stm__code" data-x="code"></pre></div>' +
			'</div>';

		var x = function (k) { return root.querySelector('[data-x="' + k + '"]'); };
		var form = S.clockForm(x('clock'), uid, { pwmOnly: true }, compute);
		S.copyButton(x('copy'), x('code'));

		function fail(msg) {
			x('results').innerHTML = '<div class="kn-stm__msg is-error">' + msg + '</div>';
			x('chain').innerHTML = '';
			x('code').innerHTML = '<span class="c">/* Nhập thông số hợp lệ để sinh code */</span>';
		}

		function compute() {
			var c = form.get();
			x('tree').innerHTML = S.clockTreeSVG(c.cfg, c.chip, c.timerName);
			if (!c.ok) return fail('Nhập SYSCLK lớn hơn 0.');

			var f = S.parse(x('f')) * UNITS[x('unit').value];
			var duty = S.parse(x('duty'));
			if (!(f > 0)) return fail('Nhập tần số PWM lớn hơn 0.');
			if (!(duty >= 0 && duty <= 100)) return fail('Duty phải nằm trong khoảng 0 – 100 %.');

			var r = S.solve(c.timclk, f, c.timer.bits, MIN_STEPS);
			if (r.error === 'high') return fail('Tần số quá cao. Với clock timer ' + S.fmtHz(c.timclk) + ', PWM tối đa là ' + S.fmtHz(c.timclk / 2) + '.');
			if (r.error === 'low') return fail('Tần số quá thấp. ' + c.timerName + ' (' + c.timer.bits + '-bit) chỉ tạo PWM thấp nhất ' + S.fmtHz(r.minF) + '.');

			var b = r.best, steps = b.arr + 1;
			var ccr = Math.min(steps, Math.max(0, Math.round(duty / 100 * steps)));
			var dutyReal = ccr / steps * 100;
			var msgs = [];
			if (b.err !== 0) msgs.push('Không có cặp PSC/ARR cho đúng ' + S.fmtHz(f) + ' với clock này. Đây là giá trị gần nhất (' + S.fmtErr(b.err) + ').');
			if (steps < 100) msgs.push('Chỉ có ' + steps + ' mức duty. Muốn chỉnh duty mịn hơn, hãy hạ tần số PWM hoặc tăng clock timer.');

			x('results').innerHTML =
				'<div class="kn-stm__regs">' + S.reg('Prescaler (PSC)', b.psc) + S.reg('Counter Period (ARR)', b.arr) + S.reg('Pulse (CCR)', ccr) + '</div>' +
				'<dl class="kn-stm__stats">' +
					S.stat('Tần số thực', S.fmtHz(b.f) + (b.err === 0 ? '' : ' (' + S.fmtErr(b.err) + ')')) +
					S.stat('Duty thực', S.num(dutyReal) + ' %') +
					S.stat('Độ rộng xung', S.fmtTime(ccr / steps / b.f)) +
					S.stat('Số mức duty', steps + ' mức (0 – ' + steps + ')') +
				'</dl>' +
				msgs.map(function (m) { return '<div class="kn-stm__msg is-warn">' + m + '</div>'; }).join('') +
				'<div class="kn-stm__wave">' + waveSVG(b.arr, ccr, 1 / b.f) + '</div>';

			x('chain').innerHTML = S.chainSVG({
				timerName: c.timerName, timclk: c.timclk, psc: b.psc, arr: b.arr,
				resultLabel: 'PWM ' + 'CH' + x('ch').value, resultValue: S.fmtHz(b.f), resultNote: 'duty ' + S.num(dutyReal) + ' % · CCR = ' + ccr
			});

			var h = 'h' + c.timerName.toLowerCase(), ch = 'TIM_CHANNEL_' + x('ch').value;
			x('code').innerHTML =
				'<span class="c">/* CubeMX &gt; ' + c.timerName + ' &gt; Channel' + x('ch').value + ': PWM Generation CH' + x('ch').value + '\n' +
				'   Prescaler = ' + b.psc + ', Counter Period = ' + b.arr + ', Pulse = ' + ccr + ' */</span>\n\n' +
				'<span class="c">// Trong main(), sau MX_' + c.timerName + '_Init():</span>\n' +
				'HAL_TIM_PWM_Start(&amp;' + h + ', ' + ch + ');\n\n' +
				'<span class="c">// Đổi duty khi đang chạy: CCR = duty × ' + steps + ' / 100</span>\n' +
				'__HAL_TIM_SET_COMPARE(&amp;' + h + ', ' + ch + ', ' + ccr + ');';
		}

		['f', 'duty'].forEach(function (k) { x(k).addEventListener('input', compute); });
		['unit', 'ch'].forEach(function (k) { x(k).addEventListener('change', compute); });
		compute();
	});
})(window.KNStm32);
