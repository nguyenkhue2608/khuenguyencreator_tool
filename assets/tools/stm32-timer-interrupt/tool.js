/**
 * STM32: tính PSC/ARR cho ngắt Timer theo chu kỳ mong muốn.
 * T_ngắt = (PSC + 1) × (ARR + 1) / f_TIM
 */
(function (S) {
	'use strict';

	var UNITS = { 'µs': 1e-6, ms: 1e-3, s: 1 };

	S.mount('stm32-timer-interrupt', function (root) {
		var uid = root.id || 'kn-tim-it';
		root.innerHTML =
			'<div class="kn-stm__body">' +
				'<div class="kn-stm__inputs">' +
					'<div data-x="clock"></div>' +
					'<div class="kn-stm__field"><label for="' + uid + '-t">Muốn ngắt sau mỗi</label>' +
						'<div class="kn-stm__pair"><input type="number" id="' + uid + '-t" data-x="t" min="0" step="any" value="1" inputmode="decimal">' +
						'<select data-x="unit" aria-label="Đơn vị"><option>µs</option><option selected>ms</option><option>s</option></select></div></div>' +
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
		var form = S.clockForm(x('clock'), uid, { pwmOnly: false }, compute);
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

			var T = S.parse(x('t')) * UNITS[x('unit').value];
			if (!(T > 0)) return fail('Nhập thời gian ngắt lớn hơn 0.');

			var r = S.solve(c.timclk, 1 / T, c.timer.bits, 0);
			if (r.error === 'high') return fail('Thời gian quá ngắn. Với clock timer ' + S.fmtHz(c.timclk) + ', ngắt nhanh nhất là mỗi ' + S.fmtTime(2 / c.timclk) + '.');
			if (r.error === 'low') return fail('Thời gian quá dài. ' + c.timerName + ' (' + c.timer.bits + '-bit) chỉ ngắt chậm nhất mỗi ' + S.fmtTime(1 / r.minF) + '. Hãy chọn timer 32-bit hoặc đếm thêm số lần ngắt trong code.');

			var b = r.best, Treal = 1 / b.f;
			x('results').innerHTML =
				'<div class="kn-stm__regs">' + S.reg('Prescaler (PSC)', b.psc) + S.reg('Counter Period (ARR)', b.arr) + '</div>' +
				'<dl class="kn-stm__stats">' +
					S.stat('Ngắt thực tế mỗi', S.fmtTime(Treal)) +
					S.stat('Tần số ngắt', S.fmtHz(b.f)) +
					S.stat('Sai số', b.err === 0 ? 'Chính xác' : S.fmtErr(b.err)) +
					S.stat('Clock ' + c.timerName, S.fmtHz(c.timclk)) +
				'</dl>' +
				(b.err !== 0 ? '<div class="kn-stm__msg is-warn">Không có cặp PSC/ARR cho đúng ' + S.fmtTime(T) + ' với clock này. Đây là giá trị gần nhất.</div>' : '');

			x('chain').innerHTML = S.chainSVG({
				timerName: c.timerName, timclk: c.timclk, psc: b.psc, arr: b.arr,
				resultLabel: 'Ngắt update', resultValue: 'mỗi ' + S.fmtTime(Treal), resultNote: S.fmtHz(b.f)
			});

			var h = 'h' + c.timerName.toLowerCase();
			x('code').innerHTML =
				'<span class="c">/* CubeMX &gt; ' + c.timerName + ' &gt; Parameter Settings:\n' +
				'   Prescaler = ' + b.psc + ', Counter Period = ' + b.arr + '\n' +
				'   NVIC Settings: bật ' + c.timerName + ' global interrupt */</span>\n\n' +
				'<span class="c">// Trong main(), sau MX_' + c.timerName + '_Init():</span>\n' +
				'HAL_TIM_Base_Start_IT(&amp;' + h + ');\n\n' +
				'void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim)\n' +
				'{\n' +
				'    if (htim-&gt;Instance == ' + c.timerName + ') {\n' +
				'        <span class="c">/* Chạy mỗi ' + S.esc(S.fmtTime(Treal)) + ' */</span>\n' +
				'    }\n' +
				'}';
		}

		x('t').addEventListener('input', compute);
		x('unit').addEventListener('change', compute);
		compute();
	});
})(window.KNStm32);
