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
		dip: { fill: '#23272b', ink: '#d9dde1' },
		black: { fill: '#1b1c1f', ink: '#e2e5e8' },
		pico: { fill: '#1f8a4c', ink: '#e9f7ee' },
		nucleo: { fill: '#eef0ec', ink: '#3a4045' },
		discovery: { fill: '#2c3036', ink: '#e6e9ec' },
		header: { fill: '#1b1d20', ink: '#cfd3d8' }
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

	/* ---------- Sơ đồ SVG ----------
	 * Board vẽ theo kích thước thật trong board.shape (đơn vị mm, gốc ở góc trên trái của mạch):
	 *   w, h: kích thước mạch; rowGap: khoảng cách hai hàng chân; start | startLeft/startRight: tâm chân đầu tiên;
	 *   poly: đường viền (nếu không phải hình chữ nhật); legs: true nếu là IC DIP (chân thò ra ngoài thân);
	 *   parts: linh kiện trang trí (module, shield, antenna, chip, usb, usbb, jack, button, led, crystal,
	 *          header, reg, cap, hole, smd, notch, dot, text, dipchip).
	 * Khoảng cách chân 2.54 mm = ROW px nên nhãn mỗi chân luôn thẳng hàng với chân thật.
	 */

	var PITCH = 2.54, K = ROW / PITCH;

	function defaultShape(board) {
		var n = Math.max(board.left.length, board.right.length);
		return { w: 18, h: n * PITCH + 6, rowGap: 15.24, start: 3, r: 1, parts: [] };
	}

	function partSVG(t, X, Y, S, style) {
		var x = X(t.x || 0), y = Y(t.y || 0), w = S(t.w || 0), h = S(t.h || 0), o = '';
		var mono = 'font-family:var(--kn-mono);';
		function label(text, cx, cy, fs, color, extra) {
			if (!text) return '';
			var lines = String(text).split('\n'), lh = fs * 1.15, y0 = cy - (lines.length - 1) * lh / 2 + fs * 0.35;
			return lines.map(function (ln, i) {
				return '<text x="' + cx.toFixed(1) + '" y="' + (y0 + i * lh).toFixed(1) + '" text-anchor="middle" style="' + mono + 'font-size:' + fs + 'px;fill:' + color + ';' + (extra || '') + '">' + esc(ln) + '</text>';
			}).join('');
		}
		switch (t.type) {
			case 'module':
				return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + S(0.4) + '" style="fill:' + (t.fill || '#161a1e') + '"/>';
			case 'antenna':
				var step = w / 9, d = 'M' + x.toFixed(1) + ' ' + (y + h).toFixed(1);
				for (var i = 0; i < 9; i++) {
					var xx = x + i * step;
					d += ' V' + (i % 2 ? y + h : y).toFixed(1) + ' H' + (xx + step).toFixed(1);
				}
				return '<path d="' + d + '" style="fill:none;stroke:#c9a227;stroke-width:1.6"/>';
			case 'shield':
				return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + S(0.5) + '" style="fill:#c9ced3;stroke:#8d959c;stroke-width:1"/>' +
					label(t.label, x + w / 2, y + h / 2, t.fs || 10, '#3b4248', 'font-weight:700');
			case 'chip':
				var cx = x + w / 2, cy = y + h / 2, n = t.pins || 0, ticks = '';
				for (var j = 0; j < n; j++) {
					var off = (j + 0.5) * w / n;
					ticks += '<rect x="' + (x + off - 1).toFixed(1) + '" y="' + (y - 4) + '" width="2" height="4" style="fill:#a8afb6"/>' +
						'<rect x="' + (x + off - 1).toFixed(1) + '" y="' + (y + h) + '" width="2" height="4" style="fill:#a8afb6"/>' +
						'<rect x="' + (x - 4) + '" y="' + (y + off - 1).toFixed(1) + '" width="4" height="2" style="fill:#a8afb6"/>' +
						'<rect x="' + (x + w) + '" y="' + (y + off - 1).toFixed(1) + '" width="4" height="2" style="fill:#a8afb6"/>';
				}
				return '<g' + (t.rot ? ' transform="rotate(' + t.rot + ' ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')"' : '') + '>' + ticks +
					'<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" style="fill:#1b1c1f"/>' +
					'<circle cx="' + (x + 6) + '" cy="' + (y + 6) + '" r="2" style="fill:#3a3c40"/></g>' +
					label(t.label, cx, cy, t.fs || 8, '#c8cdd2');
			case 'dipchip':
				var legs = t.legs || 14, legW = 5, out = '';
				for (var m = 0; m < legs; m++) {
					var ly = y + S(PITCH / 2) + m * S(PITCH) - 2;
					out += '<rect x="' + (x - legW) + '" y="' + ly.toFixed(1) + '" width="' + legW + '" height="4" style="fill:#b5bcc3"/>' +
						'<rect x="' + (x + w) + '" y="' + ly.toFixed(1) + '" width="' + legW + '" height="4" style="fill:#b5bcc3"/>';
				}
				return out + '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" style="fill:#1b1c1f"/>' +
					'<path d="M' + (x + w / 2 - 6) + ' ' + y + ' a6 6 0 0 0 12 0 Z" style="fill:' + style.fill + '"/>' +
					'<text x="' + (x + w / 2) + '" y="' + (y + h / 2) + '" text-anchor="middle" transform="rotate(-90 ' + (x + w / 2) + ' ' + (y + h / 2) + ')" style="' + mono + 'font-size:10px;letter-spacing:.1em;fill:#c8cdd2" dy="3.5">' + esc(t.label || '') + '</text>';
			case 'usb':
				return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" style="fill:#c7ccd1;stroke:#7d858c;stroke-width:1"/>' +
					'<rect x="' + (x + w * 0.18).toFixed(1) + '" y="' + (y + h * 0.3).toFixed(1) + '" width="' + (w * 0.64).toFixed(1) + '" height="' + (h * 0.32).toFixed(1) + '" rx="2" style="fill:#4b5258"/>';
			case 'usbb':
				return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" style="fill:#c7ccd1;stroke:#7d858c;stroke-width:1"/>' +
					'<rect x="' + (x + w * 0.22).toFixed(1) + '" y="' + (y + h * 0.12).toFixed(1) + '" width="' + (w * 0.56).toFixed(1) + '" height="' + (h * 0.5).toFixed(1) + '" rx="3" style="fill:#4b5258"/>' +
					label('USB', x + w / 2, y + h * 0.8, 9, '#4b5258', 'font-weight:700');
			case 'jack':
				return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" style="fill:#202326"/>' +
					'<circle cx="' + (x + w / 2) + '" cy="' + (y + h * 0.35) + '" r="' + (w * 0.3) + '" style="fill:#3c4146"/>' +
					'<circle cx="' + (x + w / 2) + '" cy="' + (y + h * 0.35) + '" r="' + (w * 0.1) + '" style="fill:#b5bcc3"/>';
			case 'button':
				return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" style="fill:#d6d9dc;stroke:#8d959c;stroke-width:1"/>' +
					'<circle cx="' + (x + w / 2) + '" cy="' + (y + h / 2) + '" r="' + (Math.min(w, h) * 0.3) + '" style="fill:#2b2f33"/>' +
					label(t.label, x + w / 2, y + h + 9, 8, style.ink);
			case 'led':
				return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1" style="fill:' + (t.color || '#e53935') + ';stroke:#f4f4f4;stroke-width:.6"/>';
			case 'crystal':
				return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (h / 2) + '" style="fill:#c7ccd1;stroke:#7d858c;stroke-width:1"/>' +
					label(t.label, x + w / 2, y + h / 2, 8, '#3b4248', 'font-weight:700');
			case 'reg':
				return '<rect x="' + (x + w * 0.15) + '" y="' + y + '" width="' + (w * 0.7) + '" height="' + (h * 0.3) + '" style="fill:#b5bcc3"/>' +
					'<rect x="' + x + '" y="' + (y + h * 0.3) + '" width="' + w + '" height="' + (h * 0.7) + '" rx="1.5" style="fill:#1b1c1f"/>' +
					label(t.label, x + w / 2, y + h * 0.65, 7, '#c8cdd2');
			case 'smd':
				return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1" style="fill:' + (t.fill || '#2b2f33') + '"/>';
			case 'cap':
				return '<circle cx="' + X(t.x) + '" cy="' + Y(t.y) + '" r="' + S(t.r) + '" style="fill:#2c3a4a;stroke:#9aa5b1;stroke-width:1.5"/>' +
					'<path d="M' + (X(t.x) - S(t.r) * 0.7) + ' ' + Y(t.y) + ' h' + (S(t.r) * 1.4) + '" style="stroke:#9aa5b1;stroke-width:1.5"/>';
			case 'hole':
				return '<circle cx="' + X(t.x) + '" cy="' + Y(t.y) + '" r="' + S(t.r) + '" style="fill:var(--kn-paper);stroke:#c9a227;stroke-width:3"/>';
			case 'notch':
				return '<path d="M' + (X(t.x) - S(t.r)) + ' ' + Y(t.y) + ' a' + S(t.r) + ' ' + S(t.r) + ' 0 0 0 ' + S(t.r * 2) + ' 0 Z" style="fill:var(--kn-paper)"/>';
			case 'dot':
				return '<circle cx="' + X(t.x) + '" cy="' + Y(t.y) + '" r="' + S(t.r) + '" style="fill:#3a3e43"/>';
			case 'header':
				var cols = t.cols || 1, rows = t.rows || 1, hdr = '';
				(t.caps || []).forEach(function (c) {
					hdr += '<rect x="' + (X(t.x + c[0] * PITCH) - 10) + '" y="' + (Y(t.y + c[1] * PITCH) - 9) + '" width="' + (S((c[2] - 1) * PITCH) + 20) + '" height="18" rx="2" style="fill:#16181b"/>';
				});
				for (var r = 0; r < rows; r++) {
					for (var c2 = 0; c2 < cols; c2++) {
						hdr += '<circle cx="' + X(t.x + c2 * PITCH).toFixed(1) + '" cy="' + Y(t.y + r * PITCH).toFixed(1) + '" r="4.5" style="fill:#d4a017;stroke:#7a5f08;stroke-width:1"/>';
					}
				}
				return hdr;
			case 'text':
				var anchor = t.anchor || 'middle';
				return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + anchor + '"' +
					(t.rot ? ' transform="rotate(' + t.rot + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"' : '') +
					' style="' + mono + 'font-size:' + (t.fs || 9) + 'px;font-weight:' + (t.weight || 400) + ';fill:' + (t.color || style.ink) + '">' + esc(t.label) + '</text>';
		}
		return o;
	}

	/* Nhóm chân. Board đơn giản chỉ cần left/right (hai cột dọc theo shape.rowGap).
	 * Board phức tạp khai báo groups: [{ x, y: tâm chân đầu (mm), dir: down|up|right|left,
	 *   labels: left|right|top|bottom (hướng đặt nhãn), align: edge (nhãn ra ngoài mép board, mặc định) | pad (nhãn ngay cạnh chân,
	 *   dùng cho hàng trong của header đôi), hidden: true (chỉ có trong bảng), pins: [...] }]. */
	function groupsOf(board) {
		if (board.groups) return board.groups;
		var sh = board.shape || defaultShape(board), inset = (sh.w - sh.rowGap) / 2;
		return [
			{ x: inset, y: sh.startLeft != null ? sh.startLeft : sh.start, dir: 'down', labels: 'left', pins: board.left },
			{ x: inset + sh.rowGap, y: sh.startRight != null ? sh.startRight : sh.start, dir: 'down', labels: 'right', pins: board.right }
		];
	}
	function pinsOf(board) {
		var out = [];
		groupsOf(board).forEach(function (g) { g.pins.forEach(function (p) { if (!p.gap) out.push(p); }); });
		return out;
	}

	function partBox(t) {
		if (t.type === 'text') return null;
		if (t.r && !t.w) return [t.x - t.r, t.y - t.r, t.x + t.r, t.y + t.r];
		if (t.type === 'header') return [t.x - 1.3, t.y - 1.3, t.x + (t.cols - 1) * PITCH + 1.3, t.y + (t.rows - 1) * PITCH + 1.3];
		var pad = t.type === 'chip' ? 0.5 : 0;
		return [t.x - pad, t.y - pad, t.x + t.w + pad, t.y + t.h + pad + (t.type === 'button' ? 1.4 : 0)];
	}

	function boardSVG(board, cat) {
		var style = STYLES[board.style] || STYLES.esp;
		var sh = board.shape || defaultShape(board);
		var groups = groupsOf(board);
		var maxLbl = 44, GAP = 16, M = 10;
		groups.forEach(function (g) { g.pins.forEach(function (p) { if (!p.gap) maxLbl = Math.max(maxLbl, lblW(p.l)); }); });

		/* Khung bao: bắt đầu từ thân mạch và linh kiện */
		var bb = [0, 0, sh.w * K, sh.h * K];
		function grow(x0, y0, x1, y1) {
			bb[0] = Math.min(bb[0], x0, x1); bb[1] = Math.min(bb[1], y0, y1);
			bb[2] = Math.max(bb[2], x0, x1); bb[3] = Math.max(bb[3], y0, y1);
		}
		(sh.parts || []).forEach(function (t) { var b = partBox(t); if (b) grow(b[0] * K, b[1] * K, b[2] * K, b[3] * K); });

		var body = sh.poly ?
			'<polygon points="' + sh.poly.map(function (pt) { return (pt[0] * K).toFixed(1) + ',' + (pt[1] * K).toFixed(1); }).join(' ') + '" style="fill:' + style.fill + '"/>' :
			'<rect x="0" y="0" width="' + (sh.w * K).toFixed(1) + '" height="' + (sh.h * K).toFixed(1) + '" rx="' + ((sh.r || 0.8) * K).toFixed(1) + '" style="fill:' + style.fill + '"/>';
		var I = function (v) { return v; };
		var S = function (v) { return v * K; };
		var partsSVG = (sh.parts || []).map(function (t) { return partSVG(t, S, S, S, style); }).join('');

		/* Chân */
		var pinsSVG = '', idx = 0;
		groups.forEach(function (g) {
			var dx = g.dir === 'right' ? PITCH : g.dir === 'left' ? -PITCH : 0;
			var dy = g.dir === 'down' ? PITCH : g.dir === 'up' ? -PITCH : 0;
			var mx = g.x, my = g.y;
			var sign = g.labels === 'right' || g.labels === 'bottom' ? 1 : -1;
			var rot = g.labels === 'top' || g.labels === 'bottom';
			g.pins.forEach(function (p) {
				if (p.gap) { var e = p.gap === true ? PITCH : p.gap; mx += dx / PITCH * e; my += dy / PITCH * e; return; }
				if (g.hidden) { idx++; mx += dx; my += dy; return; }
				var px = mx * K, py = my * K;
				mx += dx; my += dy;

				/* Khoảng từ chân tới mép board theo hướng đặt nhãn (để các nhãn thẳng hàng ngoài mép) */
				var outward = g.labels === 'left' ? px : g.labels === 'right' ? sh.w * K - px : g.labels === 'top' ? py : sh.h * K - py;
				var off = g.align === 'pad' ? 12 : Math.max(0, outward) + GAP;
				var inward = Math.max(0, -outward); /* chân nằm ngoài thân (IC DIP): độ dài chân kim loại */

				var k = KINDS[kindOf(p)], sv = shownFns(p, cat);
				var lx = sign > 0 ? off : -(off + maxLbl);
				var chips = '', cursor = sign > 0 ? off + maxLbl + 8 : -(off + maxLbl + 8), far = cursor;
				sv.list.concat(sv.extra ? [{ cat: 'more', text: '+' + sv.extra }] : []).forEach(function (f) {
					var w = chipW(f.text), x = sign > 0 ? cursor : cursor - w;
					var color = f.cat === 'more' ? '#9aa3ab' : CATS[f.cat].color;
					chips += '<rect x="' + x.toFixed(1) + '" y="-8.5" width="' + w + '" height="17" rx="3" style="fill:' + color + '"/>' +
						'<text x="' + (x + w / 2).toFixed(1) + '" y="3.8" text-anchor="middle" style="font-family:var(--kn-mono);font-size:' + FS + 'px;fill:#fff">' + esc(f.text) + '</text>';
					cursor = sign > 0 ? x + w + 4 : x - 4;
					far = cursor;
				});
				var a = sign > 0 ? -10 : far - 4, b = sign > 0 ? far + 4 : 10;

				var padSVG = sh.legs ?
					'<rect x="' + (sign > 0 ? -inward - 1 : -5) + '" y="-3" width="' + (inward + 6) + '" height="6" rx="1" style="fill:#b5bcc3;stroke:#7d858c;stroke-width:.8"/>' :
					'<circle r="5.5" style="fill:#d4a017;stroke:#7a5f08;stroke-width:1"/><circle r="2" style="fill:#5c4706"/>';
				var num = p.n && sh.numbers !== false ? '<text x="' + (sign > 0 ? -(inward + 9) : inward + 9) + '" y="3.5"' + (sign > 0 ? ' text-anchor="end"' : '') +
					' style="font-family:var(--kn-mono);font-size:9.5px;fill:' + style.ink + ';opacity:.8">' + p.n + '</text>' : '';

				pinsSVG += '<g class="kn-pin__p" data-i="' + idx + '" tabindex="0" role="button" aria-label="' + esc(p.l + (p.name ? ' ' + p.name : '')) + '"' +
					' transform="translate(' + px.toFixed(1) + ' ' + py.toFixed(1) + ')' + (rot ? ' rotate(90)' : '') + '">' +
					'<rect class="kn-pin__hl" x="' + a.toFixed(1) + '" y="' + (-ROW / 2 + 1) + '" width="' + (b - a).toFixed(1) + '" height="' + (ROW - 2) + '" rx="4"/>' +
					'<line x1="0" y1="0" x2="' + (sign * off) + '" y2="0" style="stroke:#b8a14a;stroke-width:1.5"/>' +
					padSVG + num +
					'<rect class="kn-pin__lbl" x="' + lx.toFixed(1) + '" y="-9.5" width="' + maxLbl + '" height="19" rx="3" style="fill:' + k.fill + ';stroke:' + k.stroke + '"/>' +
					'<text x="' + (lx + maxLbl / 2).toFixed(1) + '" y="4.2" text-anchor="middle" style="font-family:var(--kn-mono);font-size:12px;font-weight:700;fill:' + k.ink + '">' + esc(p.l) + '</text>' +
					((p.t || []).indexOf('warn') >= 0 ? '<circle cx="' + (sign > 0 ? lx + maxLbl - 2 : lx + 2).toFixed(1) + '" cy="-9" r="4" style="fill:#f59e0b;stroke:#fff;stroke-width:1"/>' : '') +
					chips + '</g>';

				if (rot) grow(px - 13, py + a, px + 13, py + b);
				else grow(px + a, py - 13, px + b, py + 13);
				idx++;
			});
		});

		var vx = Math.floor(bb[0] - M), vy = Math.floor(bb[1] - M);
		var W = Math.ceil(bb[2] - bb[0] + 2 * M), H = Math.ceil(bb[3] - bb[1] + 2 * M);
		return '<svg viewBox="' + vx + ' ' + vy + ' ' + W + ' ' + H + '" data-w="' + W + '" style="max-width:' + W + 'px;min-width:' + Math.min(W, 600) + 'px" role="img" aria-label="Sơ đồ chân ' + esc(board.name) + '">' +
			body + partsSVG + pinsSVG + '</svg>';
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
				state.pins = pinsOf(b);
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
			/* Board rộng (Uno) cần cả chiều ngang: đưa khung chi tiết xuống dưới sơ đồ */
			var svg = x('svg').querySelector('svg');
			root.querySelector('.kn-pin__main').classList.toggle('is-wide', !!svg && Number(svg.getAttribute('data-w')) > 780);
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
