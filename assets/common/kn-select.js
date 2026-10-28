/**
 * Danh sách chọn tự vẽ cho mọi <select> trong .kn-tool khi dùng chuột.
 * Popup gốc của trình duyệt trên một số site (theme, khung trang) mở rồi chọn luôn khi nhả chuột;
 * ở đây chặn popup gốc, tự hiện danh sách: bấm để mở, bấm lần nữa để chọn.
 * <select> gốc vẫn giữ nguyên giá trị, bàn phím và sự kiện change; cảm ứng vẫn dùng bảng chọn của máy.
 */
(function () {
	'use strict';

	if (window.KNSelect) return;

	var pop = null;    // div.kn-sel đang mở
	var sel = null;    // <select> đang mở
	var items = [];    // các <option> tương ứng từng dòng
	var active = -1;   // dòng đang được tô
	var lastPointer = 'mouse';

	function isTool(el) {
		return el && el.tagName === 'SELECT' && !el.disabled && !el.multiple && el.closest && el.closest('.kn-tool');
	}

	function esc(s) {
		return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
	}

	function setActive(i, scroll) {
		var rows = pop.querySelectorAll('.kn-sel__opt');
		if (active >= 0 && rows[active]) rows[active].classList.remove('is-active');
		active = i;
		if (i < 0 || !rows[i]) return;
		rows[i].classList.add('is-active');
		if (scroll) {
			var r = rows[i], top = r.offsetTop, bottom = top + r.offsetHeight;
			if (top < pop.scrollTop) pop.scrollTop = top;
			else if (bottom > pop.scrollTop + pop.clientHeight) pop.scrollTop = bottom - pop.clientHeight;
		}
	}

	function step(dir) {
		var i = active;
		for (var n = 0; n < items.length; n++) {
			i += dir;
			if (i < 0 || i >= items.length) return;
			if (!items[i].disabled) { setActive(i, true); return; }
		}
	}

	function place() {
		var r = sel.getBoundingClientRect();
		var vh = window.innerHeight;
		var below = vh - r.bottom - 8, above = r.top - 8;
		var up = below < 200 && above > below;
		pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - pop.offsetWidth - 8)) + 'px';
		pop.style.minWidth = r.width + 'px';
		pop.style.maxHeight = Math.max(120, Math.min(320, up ? above : below)) + 'px';
		pop.style.top = (up ? r.top - pop.offsetHeight - 4 : r.bottom + 4) + 'px';
	}

	function open(s) {
		close();
		sel = s;
		items = [];
		var html = '';
		Array.prototype.forEach.call(s.children, function (c) {
			if (c.tagName === 'OPTGROUP') {
				html += '<div class="kn-sel__group">' + esc(c.label) + '</div>';
				Array.prototype.forEach.call(c.children, row);
			} else if (c.tagName === 'OPTION') {
				row(c);
			}
		});
		function row(o) {
			html += '<div class="kn-sel__opt' + (o.disabled ? ' is-disabled' : '') + (o.selected ? ' is-selected' : '') +
				'" role="option" data-i="' + items.length + '" aria-selected="' + o.selected + '">' + esc(o.textContent) + '</div>';
			items.push(o);
		}
		pop = document.createElement('div');
		pop.className = 'kn-sel';
		pop.setAttribute('role', 'listbox');
		pop.innerHTML = html;
		document.body.appendChild(pop);
		s.setAttribute('aria-expanded', 'true');
		place();
		setActive(s.selectedIndex >= 0 ? items.indexOf(s.options[s.selectedIndex]) : -1, true);
	}

	function close() {
		if (!pop) return;
		pop.parentNode.removeChild(pop);
		sel.setAttribute('aria-expanded', 'false');
		pop = null;
		sel = null;
		items = [];
		active = -1;
	}

	function choose(i) {
		var o = items[i], s = sel;
		if (!o || o.disabled) return;
		close();
		s.focus();
		if (o.selected) return;
		o.selected = true;
		s.dispatchEvent(new Event('input', { bubbles: true }));
		s.dispatchEvent(new Event('change', { bubbles: true }));
	}

	document.addEventListener('pointerdown', function (e) { lastPointer = e.pointerType || 'mouse'; }, true);

	document.addEventListener('mousedown', function (e) {
		if (pop && pop.contains(e.target)) {
			e.preventDefault(); // giữ focus ở <select>
			return;
		}
		var s = e.target;
		if (e.button !== 0 || lastPointer === 'touch' || !isTool(s)) {
			close();
			return;
		}
		e.preventDefault(); // không cho popup gốc mở
		s.focus();
		if (sel === s) close();
		else open(s);
	}, true);

	document.addEventListener('click', function (e) {
		var opt = pop && e.target.closest && e.target.closest('.kn-sel__opt');
		if (opt) choose(+opt.getAttribute('data-i'));
	});

	document.addEventListener('mousemove', function (e) {
		var opt = pop && e.target.closest && e.target.closest('.kn-sel__opt');
		if (opt && !opt.classList.contains('is-disabled')) setActive(+opt.getAttribute('data-i'), false);
	});

	document.addEventListener('keydown', function (e) {
		if (!pop || e.target !== sel) return;
		var k = e.key;
		if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); step(k === 'ArrowDown' ? 1 : -1); }
		else if (k === 'Enter' || k === ' ') { e.preventDefault(); choose(active); }
		else if (k === 'Escape') { e.preventDefault(); close(); }
		else if (k === 'Tab') close();
	}, true);

	document.addEventListener('focusout', function (e) { if (pop && e.target === sel) close(); });
	window.addEventListener('resize', close);
	window.addEventListener('scroll', function (e) { if (pop && e.target !== pop) close(); }, true);

	window.KNSelect = { close: close };
})();
