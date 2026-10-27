/**
 * Pinout viewer: vẽ sơ đồ chân board từ data/pinout/<id>.json, lọc theo chức năng, tìm chân, xem chi tiết.
 * Định dạng chân: { n: số chân, l: nhãn in trên board, name: tên chân chip, k: power|gnd|sys|nc (mặc định io),
 *                   f: ["cat:Tên chức năng", ...], t: ["5v"|"in"|"warn"], note: "..." }  hoặc { gap: true }.
 */
(function () {
	'use strict';

	var SLUG = 'pinout';
	var DEFAULT_BOARD = 'esp32-devkit-v1';

	var CATS = {
		adc: { label: 'ADC', color: '#7c3aed' },
		dac: { label: 'DAC', color: '#a21caf' },
		pwm: { label: 'PWM / Timer', color: '#c2410c' },
		uart: { label: 'UART', color: '#1d4ed8' },
		i2c: { label: 'I2C', color: '#0f766e' },
		spi: { label: 'SPI', color: '#15803d' },
		int: { label: 'Ngắt', color: '#be185d' },
		touch: { label: 'Touch', color: '#a16207' },
		usb: { label: 'USB / CAN', color: '#0e7490' },
		other: { label: 'Khác', color: '#57534e' }
	};
	var KINDS = {
		io: { label: 'I/O', fill: '#ffffff', ink: '#1c2a27', stroke: '#9aa8a4' },
		power: { label: 'Nguồn', fill: '#c62828', ink: '#ffffff', stroke: '#c62828' },
		gnd: { label: 'GND', fill: '#1f2937', ink: '#ffffff', stroke: '#1f2937' },
		sys: { label: 'Hệ thống', fill: '#4b5563', ink: '#ffffff', stroke: '#4b5563' },
		nc: { label: 'Không nối', fill: '#eef0f2', ink: '#6b7280', stroke: '#cfd5da' }
	};
	var TAGS = { '5v': 'Chịu 5V', 'in': 'Chỉ ngõ vào', 'warn': 'Cần lưu ý khi khởi động / nối dây' };
	var STYLES = {
		arduino: { fill: '#0e7a87', ink: '#e6f6f8' },
		esp: { fill: '#1d262e', ink: '#e8eef2' },
		stm32: { fill: '#1f4fa0', ink: '#e8efff' },
		dip: { fill: '#23272b', ink: '#d9dde1' }
	};

	var ROW = 26, FS = 11, MAX_CHIPS = 2;

	/* ---------- Tiện ích ---------- */

	function esc(s) {
		return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
		});
	}
	function splitFn(s) {
		var i = s.indexOf(':');
		var cat = i > 0 ? s.slice(0, i) : 'other';
		return { cat: CATS[cat] ? cat : 'other', text: i > 0 ? s.slice(i + 1) : s };
	}
	function kindOf(p) { return KINDS[p.k] ? p.k : 'io'; }
	function fns(p) { return (p.f || []).map(splitFn); }

	function loadJSON(file) {
		var pre = window.KN_PINOUT_DATA;
		if (pre && pre[file]) return Promise.resolve(pre[file]);
		var base = (window.KN_TOOLS && window.KN_TOOLS.dataUrl) || '';
		return fetch(base + 'pinout/' + file).then(function (r) {
			if (!r.ok) throw new Error(r.status);
			return r.json();
		});
	}

	function chipW(t) { return Math.round(t.length * FS * 0.6 + 12); }
	function lblW(t) { return Math.round(t.length * 12 * 0.62 + 14); }

	/* Chức năng hiện trên sơ đồ: ưu tiên nhóm đang lọc, tối đa MAX_CHIPS, còn lại gộp "+n". */
	function shownFns(p, cat) {
		var all = fns(p);
		if (cat) all = all.filter(function (f) { return f.cat === cat; }).concat(all.filter(function (f) { return f.cat !== cat; }));
		return { list: all.slice(0, MAX_CHIPS), extra: Math.max(0, all.length - MAX_CHIPS) };
	}

	/* ---------- Sơ đồ SVG ---------- */

	function boardSVG(board, cat) {
		var style = STYLES[board.style] || STYLES.esp;
		var pins = [];
		var maxLbl = 44;
		['left', 'right'].forEach(function (side) {
			board[side].forEach(function (p) {
				if (!p.gap) maxLbl = Math.max(maxLbl, lblW(p.l));
			});
		});

		function sideWidth(side) {
			var w = 0;
			board[side].forEach(function (p) {
				if (p.gap) return;
				var s = shownFns(p, cat), cw = 0;
				s.list.forEach(function (f) { cw += chipW(f.text) + 4; });
				if (s.extra) cw += chipW('+' + s.extra) + 4;
				w = Math.max(w, maxLbl + (cw ? 8 + cw : 0));
			});
			return w;
		}

		var M = 8, GAP = 14, BW = board.style === 'dip' ? 116 : 150, TOP = 58;
		var leftW = sideWidth('left'), rightW = sideWidth('right');
		var x0 = M + leftW + GAP, x1 = x0 + BW;
		var W = x1 + GAP + rightW + M;

		function rows(side) {
			var y = TOP, out = [];
			board[side].forEach(function (p) {
				if (p.gap) { y += ROW * 0.6; return; }
				out.push({ p: p, y: y + ROW / 2 });
				y += ROW;
			});
			return { list: out, end: y };
		}
		var L = rows('left'), R = rows('right');
		var H = Math.max(L.end, R.end) + 44;

		var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="max-width:' + W + 'px;min-width:' + Math.min(W, 600) + 'px" role="img" aria-label="Sơ đồ chân ' + esc(board.name) + '">';

		/* Thân board */
		s += '<rect x="' + x0 + '" y="18" width="' + BW + '" height="' + (H - 36) + '" rx="' + (board.style === 'dip' ? 4 : 8) + '" style="fill:' + style.fill + '"/>';
		var cx = x0 + BW / 2;
		if (board.connector === 'usb-top') s += usb(cx, 4);
		if (board.connector === 'usb-bottom' || board.connector === 'antenna-top') s += usb(cx, H - 32);
		if (board.connector === 'antenna-top') {
			s += '<rect x="' + (x0 + 14) + '" y="26" width="' + (BW - 28) + '" height="22" rx="2" style="fill:none;stroke:' + style.ink + ';stroke-opacity:.35"/>';
			s += '<path d="M' + (x0 + 22) + ' 42 h10 v-10 h10 v10 h10 v-10 h10 v10 h10 v-10 h10 v10 h10 v-10 h10 v10 h' + (BW - 104) + '" style="fill:none;stroke:' + style.ink + ';stroke-opacity:.55;stroke-width:1.5"/>';
		}
		if (board.connector === 'notch-top') {
			s += '<path d="M' + (cx - 11) + ' 18 a11 11 0 0 0 22 0 Z" style="fill:var(--kn-paper)"/>';
		}
		if (board.style === 'stm32') {
			['3.3', 'DIO', 'CLK', 'GND'].forEach(function (t, i) {
				var px = cx - 39 + i * 26;
				s += '<rect x="' + (px - 5) + '" y="26" width="10" height="10" style="fill:#d4a017"/>' +
					'<text x="' + px + '" y="48" text-anchor="middle" style="font-family:var(--kn-mono);font-size:8.5px;fill:' + style.ink + '">' + t + '</text>';
			});
		}

		var midBoard = (TOP + Math.max(L.end, R.end)) / 2;
		if (board.style === 'dip') {
			/* Chip DIP hẹp: in tên chip dọc giữa thân, giống chữ in trên IC thật */
			s += '<text x="' + cx + '" y="' + midBoard + '" text-anchor="middle" transform="rotate(-90 ' + cx + ' ' + midBoard + ')" style="font-family:var(--kn-mono);font-size:15px;font-weight:700;letter-spacing:.12em;fill:' + style.ink + '">' + esc(board.mcu) + '</text>';
		} else {
			var nameLines = wrap(board.name, Math.floor((BW - 20) / 7.4));
			var midY = midBoard - (nameLines.length * 16) / 2;
			nameLines.forEach(function (ln, i) {
				s += '<text x="' + cx + '" y="' + (midY + i * 16) + '" text-anchor="middle" style="font-size:13px;font-weight:800;fill:' + style.ink + '">' + esc(ln) + '</text>';
			});
			s += '<text x="' + cx + '" y="' + (midY + nameLines.length * 16 + 4) + '" text-anchor="middle" style="font-family:var(--kn-mono);font-size:10px;fill:' + style.ink + ';opacity:.75">' + esc(board.mcu) + '</text>';
		}

		/* Chân */
		var idx = 0;
		[['left', L.list], ['right', R.list]].forEach(function (pair) {
			var left = pair[0] === 'left';
			pair[1].forEach(function (r) {
				var p = r.p, y = r.y, k = KINDS[kindOf(p)];
				var pad = left ? x0 + 15 : x1 - 15;
				var lx = left ? x0 - GAP - maxLbl : x1 + GAP;
				var sh = shownFns(p, cat);

				var chips = '', cursor = left ? lx - 8 : lx + maxLbl + 8, far = cursor;
				sh.list.concat(sh.extra ? [{ cat: 'more', text: '+' + sh.extra }] : []).forEach(function (f) {
					var w = chipW(f.text), x = left ? cursor - w : cursor;
					var color = f.cat === 'more' ? '#9aa3ab' : CATS[f.cat].color;
					chips += '<rect x="' + x + '" y="' + (y - 8.5) + '" width="' + w + '" height="17" rx="3" style="fill:' + color + '"/>' +
						'<text x="' + (x + w / 2) + '" y="' + (y + 3.8) + '" text-anchor="middle" style="font-family:var(--kn-mono);font-size:' + FS + 'px;fill:#fff">' + esc(f.text) + '</text>';
					cursor = left ? x - 4 : x + w + 4;
					far = cursor;
				});

				var hx = left ? Math.min(far, lx) - 4 : lx - GAP - 20;
				var hw = left ? (pad + 10) - hx : (Math.max(far, lx + maxLbl) + 4) - hx;
				s += '<g class="kn-pin__p" data-i="' + idx + '" tabindex="0" role="button" aria-label="' + esc(p.l + (p.name ? ' ' + p.name : '')) + '">' +
					'<rect class="kn-pin__hl" x="' + hx + '" y="' + (y - ROW / 2 + 1) + '" width="' + hw + '" height="' + (ROW - 2) + '" rx="4"/>' +
					'<line x1="' + (left ? lx + maxLbl : lx) + '" y1="' + y + '" x2="' + pad + '" y2="' + y + '" style="stroke:#b8a14a;stroke-width:2"/>' +
					'<circle cx="' + pad + '" cy="' + y + '" r="5.5" style="fill:#d4a017;stroke:#7a5f08;stroke-width:1"/>' +
					'<circle cx="' + pad + '" cy="' + y + '" r="2" style="fill:#5c4706"/>' +
					(p.n ? '<text x="' + (left ? pad + 11 : pad - 11) + '" y="' + (y + 3.5) + '"' + (left ? '' : ' text-anchor="end"') + ' style="font-family:var(--kn-mono);font-size:9.5px;fill:' + style.ink + ';opacity:.7">' + p.n + '</text>' : '') +
					'<rect class="kn-pin__lbl" x="' + lx + '" y="' + (y - 9.5) + '" width="' + maxLbl + '" height="19" rx="3" style="fill:' + k.fill + ';stroke:' + k.stroke + '"/>' +
					'<text x="' + (lx + maxLbl / 2) + '" y="' + (y + 4.2) + '" text-anchor="middle" style="font-family:var(--kn-mono);font-size:12px;font-weight:700;fill:' + k.ink + '">' + esc(p.l) + '</text>' +
					((p.t || []).indexOf('warn') >= 0 ? '<circle cx="' + (left ? lx + 2 : lx + maxLbl - 2) + '" cy="' + (y - 9) + '" r="4" style="fill:#f59e0b;stroke:#fff;stroke-width:1"/>' : '') +
					chips + '</g>';
				idx++;
			});
		});
		return s + '</svg>';
	}

	function usb(cx, y) {
		return '<rect x="' + (cx - 22) + '" y="' + y + '" width="44" height="28" rx="3" style="fill:#c9ced4;stroke:#8a9199"/>' +
			'<text x="' + cx + '" y="' + (y + 18) + '" text-anchor="middle" style="font-family:var(--kn-mono);font-size:10px;font-weight:700;fill:#4b5258">USB</text>';
	}

	function wrap(text, max) {
		var words = text.split(' '), lines = [], cur = '';
		words.forEach(function (w) {
			if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; }
			else cur = (cur + ' ' + w).trim();
		});
		if (cur) lines.push(cur);
		return lines;
	}

	/* ---------- Giao diện ---------- */

	function build(root) {
		var uid = root.id || 'kn-pinout';
		root.innerHTML =
			'<div class="kn-pin__bar">' +
				'<div class="kn-pin__field"><label for="' + uid + '-board">Board</label><select id="' + uid + '-board" data-x="board"></select></div>' +
				'<div class="kn-pin__field"><label for="' + uid + '-q">Tìm chân</label><input type="text" id="' + uid + '-q" data-x="q" placeholder="VD: PA9, TX, ADC1, GPIO2" autocomplete="off"></div>' +
			'</div>' +
			'<div class="kn-pin__filters" data-x="filters" role="group" aria-label="Lọc theo chức năng"></div>' +
			'<div class="kn-pin__main">' +
				'<div class="kn-pin__diagram" data-x="svg"><p class="kn-pin__hint">Đang tải sơ đồ…</p></div>' +
				'<aside class="kn-pin__detail" data-x="detail" aria-live="polite"></aside>' +
			'</div>' +
			'<div class="kn-pin__more">' +
				'<div data-x="notes"></div>' +
				'<div><h3 class="kn-pin__h">Bảng chân</h3><div class="kn-pin__table-wrap" data-x="table"></div></div>' +
			'</div>';

		var x = function (k) { return root.querySelector('[data-x="' + k + '"]'); };
		var state = { list: [], board: null, pins: [], cat: null, q: '', sel: null };

		function setHash(id) {
			try { if (window.history && history.replaceState) history.replaceState(null, '', '#' + id); } catch (e) { /* bỏ qua */ }
		}

		function loadBoard(id) {
			x('svg').innerHTML = '<p class="kn-pin__hint">Đang tải sơ đồ…</p>';
			return loadJSON(id + '.json').then(function (b) {
				state.board = b;
				state.pins = b.left.concat(b.right).filter(function (p) { return !p.gap; });
				state.cat = null;
				state.sel = null;
				renderFilters();
				renderSVG();
				renderNotes();
				renderTable();
				renderDetail();
				highlight();
			}).catch(function () {
				x('svg').innerHTML = '<p class="kn-pin__msg">Không tải được dữ liệu board. Hãy tải lại trang.</p>';
			});
		}

		function matches(p) {
			var okCat = !state.cat || fns(p).some(function (f) { return f.cat === state.cat; });
			if (!okCat) return false;
			if (!state.q) return true;
			var q = state.q.toLowerCase();
			var hay = [p.l, p.name || ''].concat((p.f || []).map(function (f) { return splitFn(f).text; })).join(' ').toLowerCase();
			return hay.indexOf(q) >= 0;
		}

		function renderFilters() {
			var present = {};
			state.pins.forEach(function (p) { fns(p).forEach(function (f) { present[f.cat] = true; }); });
			var html = '<button type="button" data-cat="" aria-pressed="' + (!state.cat) + '">Tất cả</button>';
			Object.keys(CATS).forEach(function (c) {
				if (!present[c]) return;
				html += '<button type="button" data-cat="' + c + '" aria-pressed="' + (state.cat === c) + '"><span class="kn-pin__dot" style="background:' + CATS[c].color + '"></span>' + CATS[c].label + '</button>';
			});
			x('filters').innerHTML = html + '<span class="kn-pin__count" data-x="count"></span>';
		}

		function renderSVG() {
			x('svg').innerHTML = boardSVG(state.board, state.cat);
		}

		function renderNotes() {
			var b = state.board;
			x('notes').innerHTML = '<h3 class="kn-pin__h">Lưu ý khi dùng ' + esc(b.name) + '</h3><ul class="kn-pin__notes">' +
				(b.notes || []).map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>';
		}

		function chipsHTML(p) {
			return fns(p).map(function (f) {
				return '<span class="kn-pin__chip" style="background:' + CATS[f.cat].color + '">' + esc(f.text) + '</span>';
			}).join(' ');
		}

		function lblHTML(p) {
			var k = KINDS[kindOf(p)];
			return '<span class="kn-pin__lbl-h" style="background:' + k.fill + ';color:' + k.ink + ';border-color:' + k.stroke + '">' + esc(p.l) + '</span>';
		}

		function renderTable() {
			var hasN = state.pins.some(function (p) { return p.n; });
			x('table').innerHTML = '<table class="kn-pin__table"><thead><tr>' + (hasN ? '<th>Số</th>' : '') +
				'<th>Nhãn</th><th>Chân chip</th><th>Chức năng</th><th>Ghi chú</th></tr></thead><tbody>' +
				state.pins.map(function (p, i) {
					var tags = (p.t || []).map(function (t) { return '<span class="kn-pin__tag is-' + t + '">' + TAGS[t] + '</span>'; }).join(' ');
					return '<tr data-i="' + i + '">' + (hasN ? '<td class="kn-mono">' + (p.n || '') + '</td>' : '') +
						'<td>' + lblHTML(p) + '</td><td class="kn-mono">' + esc(p.name || (p.k ? KINDS[kindOf(p)].label : '')) + '</td>' +
						'<td>' + chipsHTML(p) + '</td><td>' + tags + (tags && p.note ? ' ' : '') + esc(p.note || '') + '</td></tr>';
				}).join('') + '</tbody></table>';
		}

		function renderDetail() {
			var b = state.board, d = x('detail');
			if (state.sel === null) {
				var io = state.pins.filter(function (p) { return kindOf(p) === 'io'; }).length;
				d.innerHTML = '<h3 class="kn-pin__h">' + esc(b.name) + '</h3>' +
					'<dl class="kn-pin__dl">' +
						'<div><dt>Vi điều khiển</dt><dd>' + esc(b.mcu) + '</dd></div>' +
						'<div><dt>Mức logic</dt><dd>' + esc(b.logic) + '</dd></div>' +
						'<div><dt>Chân I/O trên header</dt><dd>' + io + '</dd></div>' +
					'</dl>' +
					'<p class="kn-pin__hint">' + esc(b.orientation) + '.</p>' +
					'<p class="kn-pin__hint">Bấm vào một chân trên sơ đồ hoặc trong bảng để xem đầy đủ chức năng.</p>' +
					'<div class="kn-pin__legend">' + Object.keys(KINDS).map(function (k) {
						return '<span><i style="background:' + KINDS[k].fill + ';border-color:' + KINDS[k].stroke + '"></i>' + KINDS[k].label + '</span>';
					}).join('') + '<span><i class="is-warn"></i>Cần lưu ý</span></div>';
				return;
			}
			var p = state.pins[state.sel];
			var groups = {};
			fns(p).forEach(function (f) { (groups[f.cat] = groups[f.cat] || []).push(f.text); });
			var warn = (p.t || []).indexOf('warn') >= 0;
			d.innerHTML =
				'<div class="kn-pin__d-head">' + lblHTML(p) +
					'<span class="kn-mono">' + esc(p.name || KINDS[kindOf(p)].label) + '</span>' +
					(p.n ? '<span class="kn-pin__hint">Chân số ' + p.n + '</span>' : '') + '</div>' +
				((p.t || []).length ? '<div class="kn-pin__tags">' + p.t.map(function (t) { return '<span class="kn-pin__tag is-' + t + '">' + TAGS[t] + '</span>'; }).join('') + '</div>' : '') +
				(Object.keys(groups).length ?
					'<dl class="kn-pin__dl">' + Object.keys(CATS).filter(function (c) { return groups[c]; }).map(function (c) {
						return '<div><dt><span class="kn-pin__dot" style="background:' + CATS[c].color + '"></span>' + CATS[c].label + '</dt><dd>' + groups[c].map(esc).join(', ') + '</dd></div>';
					}).join('') + '</dl>' :
					'<p class="kn-pin__hint">' + (kindOf(p) === 'io' ? 'Chân I/O thường.' : KINDS[kindOf(p)].label + '.') + '</p>') +
				(p.note ? '<p class="kn-pin__msg' + (warn ? ' is-warn' : '') + '">' + esc(p.note) + '</p>' : '') +
				'<button type="button" class="kn-pin__link" data-x="clear">← Xem thông tin board</button>';
		}

		function highlight() {
			var active = !!(state.cat || state.q), n = 0;
			state.pins.forEach(function (p, i) {
				var lit = matches(p);
				if (lit && active) n++;
				[root.querySelector('.kn-pin__p[data-i="' + i + '"]'), root.querySelector('.kn-pin__table tr[data-i="' + i + '"]')].forEach(function (el) {
					if (!el) return;
					el.classList.toggle('is-dim', active && !lit);
					el.classList.toggle('is-sel', state.sel === i);
				});
			});
			var c = x('count');
			if (c) c.textContent = active ? n + ' chân phù hợp' : '';
		}

		function select(i) {
			state.sel = state.sel === i ? null : i;
			renderDetail();
			highlight();
		}

		/* Sự kiện */
		x('board').addEventListener('change', function (e) {
			setHash(e.target.value);
			state.q = '';
			x('q').value = '';
			loadBoard(e.target.value);
		});
		x('q').addEventListener('input', function (e) {
			state.q = e.target.value.trim();
			highlight();
		});
		x('filters').addEventListener('click', function (e) {
			var b = e.target.closest('button[data-cat]');
			if (!b) return;
			var c = b.getAttribute('data-cat') || null;
			state.cat = state.cat === c ? null : c;
			Array.prototype.forEach.call(x('filters').querySelectorAll('button'), function (btn) {
				btn.setAttribute('aria-pressed', String((btn.getAttribute('data-cat') || null) === state.cat));
			});
			renderSVG();
			highlight();
		});
		x('svg').addEventListener('click', function (e) {
			var g = e.target.closest('.kn-pin__p');
			if (g) select(Number(g.getAttribute('data-i')));
		});
		x('svg').addEventListener('keydown', function (e) {
			var g = e.target.closest('.kn-pin__p');
			if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(Number(g.getAttribute('data-i'))); }
		});
		x('table').addEventListener('click', function (e) {
			var tr = e.target.closest('tbody tr');
			if (!tr) return;
			select(Number(tr.getAttribute('data-i')));
			if (state.sel !== null && window.innerWidth < 850) x('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		});
		x('detail').addEventListener('click', function (e) {
			if (e.target.closest('[data-x="clear"]')) select(state.sel);
		});

		/* Khởi động: board từ shortcode (data-board), hoặc từ #hash, hoặc mặc định */
		loadJSON('boards.json').then(function (data) {
			state.list = data.boards;
			var families = [];
			data.boards.forEach(function (b) { if (families.indexOf(b.family) < 0) families.push(b.family); });
			x('board').innerHTML = families.map(function (fam) {
				return '<optgroup label="' + esc(fam) + '">' + data.boards.filter(function (b) { return b.family === fam; }).map(function (b) {
					return '<option value="' + b.id + '"' + (b.ready ? '' : ' disabled') + '>' + esc(b.name) + (b.ready ? '' : ' (sắp có)') + '</option>';
				}).join('') + '</optgroup>';
			}).join('');
			var ready = data.boards.filter(function (b) { return b.ready; }).map(function (b) { return b.id; });
			var hash = (location.hash || '').slice(1);
			var start = ready.indexOf(hash) >= 0 ? hash : (ready.indexOf(root.getAttribute('data-board')) >= 0 ? root.getAttribute('data-board') : DEFAULT_BOARD);
			x('board').value = start;
			loadBoard(start);
		}).catch(function () {
			x('svg').innerHTML = '<p class="kn-pin__msg">Không tải được danh sách board. Hãy tải lại trang.</p>';
		});
	}

	function init() {
		Array.prototype.forEach.call(document.querySelectorAll('[data-tool="' + SLUG + '"]'), function (el) {
			if (!el.getAttribute('data-ready')) { el.setAttribute('data-ready', '1'); build(el); }
		});
	}
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
	else init();
})();
