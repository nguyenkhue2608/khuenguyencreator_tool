/**
 * Trang Hub: tìm kiếm và lọc theo nhóm. Không có JS thì trang vẫn hiện đủ mọi thẻ.
 */
(function () {
	'use strict';

	function norm(s) {
		return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
	}

	function init(hub) {
		var input = hub.querySelector('[data-hub-q]');
		var chips = hub.querySelectorAll('[data-hub-group]');
		var empty = hub.querySelector('[data-hub-empty]');
		var group = '';

		function apply() {
			var words = norm(input.value).split(/\s+/).filter(Boolean), any = false;
			Array.prototype.forEach.call(hub.querySelectorAll('[data-hub-section]'), function (sec) {
				var inGroup = !group || sec.getAttribute('data-hub-section') === group, visible = 0;
				Array.prototype.forEach.call(sec.querySelectorAll('[data-hub-item]'), function (item) {
					var hay = norm(item.getAttribute('data-search'));
					var ok = inGroup && words.every(function (w) { return hay.indexOf(w) >= 0; });
					item.hidden = !ok;
					if (ok) visible++;
				});
				var soon = sec.querySelector('.kn-hub__soon');
				if (soon) soon.hidden = !soon.querySelector('[data-hub-item]:not([hidden])');
				sec.hidden = !visible;
				any = any || visible > 0;
			});
			empty.hidden = any;
		}

		input.addEventListener('input', apply);
		Array.prototype.forEach.call(chips, function (chip) {
			chip.addEventListener('click', function () {
				group = chip.getAttribute('data-hub-group');
				Array.prototype.forEach.call(chips, function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
				apply();
			});
		});
	}

	function boot() {
		Array.prototype.forEach.call(document.querySelectorAll('[data-hub]'), init);
	}
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
	else boot();
})();
