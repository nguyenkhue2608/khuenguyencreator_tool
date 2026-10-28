<?php
/**
 * [kn_tool slug="stm32-pwm"]        -> render một tool, chỉ load JS/CSS của tool đó.
 * [kn_tool slug="pinout" board="esp32-devkit-v1"] -> Pinout viewer mở sẵn một board (trang riêng cho từng board).
 * [kn_tools_hub]                    -> danh sách tool theo nhóm (trang /tools/).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'init', function () {
	add_shortcode( 'kn_tool', 'kn_tools_render_tool' );
	add_shortcode( 'kn_tools_hub', 'kn_tools_render_hub' );
} );

function kn_tools_enqueue_common() {
	wp_enqueue_style( 'kn-tools-common', KN_TOOLS_URL . 'assets/common/kn-tools.css', array(), KN_TOOLS_VERSION );
	wp_enqueue_script( 'kn-select', KN_TOOLS_URL . 'assets/common/kn-select.js', array(), KN_TOOLS_VERSION, true );
}

function kn_tools_render_tool( $atts ) {
	$atts  = shortcode_atts( array( 'slug' => '', 'board' => '' ), $atts, 'kn_tool' );
	$slug  = sanitize_key( $atts['slug'] );
	$tools = kn_tools_registry();

	if ( ! isset( $tools[ $slug ] ) ) {
		return current_user_can( 'edit_posts' ) ? '<p><strong>KN Tools:</strong> không có tool "' . esc_html( $slug ) . '".</p>' : '';
	}

	kn_tools_enqueue_common();

	$js_deps = array();
	$tool    = $tools[ $slug ];
	foreach ( isset( $tool['deps'] ) ? $tool['deps'] : array() as $dep ) {
		$path = 'assets/common/' . $dep;
		if ( file_exists( KN_TOOLS_DIR . $path . '.css' ) ) {
			wp_enqueue_style( 'kn-' . $dep, KN_TOOLS_URL . $path . '.css', array( 'kn-tools-common' ), KN_TOOLS_VERSION );
		}
		if ( file_exists( KN_TOOLS_DIR . $path . '.js' ) ) {
			wp_enqueue_script( 'kn-' . $dep, KN_TOOLS_URL . $path . '.js', array(), KN_TOOLS_VERSION, true );
			$js_deps[] = 'kn-' . $dep;
		}
	}

	$base = 'assets/tools/' . $slug . '/';
	if ( file_exists( KN_TOOLS_DIR . $base . 'tool.css' ) ) {
		wp_enqueue_style( 'kn-tool-' . $slug, KN_TOOLS_URL . $base . 'tool.css', array( 'kn-tools-common' ), KN_TOOLS_VERSION );
	}
	if ( file_exists( KN_TOOLS_DIR . $base . 'tool.js' ) ) {
		wp_enqueue_script( 'kn-tool-' . $slug, KN_TOOLS_URL . $base . 'tool.js', $js_deps, KN_TOOLS_VERSION, true );
		wp_localize_script( 'kn-tool-' . $slug, 'KN_TOOLS', array( 'dataUrl' => KN_TOOLS_URL . 'data/' ) );
	}

	$extra = $atts['board'] ? ' data-board="' . esc_attr( sanitize_key( $atts['board'] ) ) . '"' : '';

	return '<div class="kn-tool" id="kn-tool-' . esc_attr( $slug ) . '" data-tool="' . esc_attr( $slug ) . '"' . $extra . '>'
		. '<noscript>Công cụ này cần bật JavaScript.</noscript></div>';
}

/**
 * Trang Hub: ô tìm kiếm + lọc nhóm (JS), lưới thẻ tool theo nhóm. Chỉ hiện tool 'live'; nhóm chưa có tool nào thì ẩn.
 * HTML đầy đủ và đọc được khi tắt JS; kn-hub.js chỉ thêm tìm kiếm / lọc.
 */
function kn_tools_render_hub() {
	kn_tools_enqueue_common();
	wp_enqueue_style( 'kn-hub', KN_TOOLS_URL . 'assets/common/kn-hub.css', array( 'kn-tools-common' ), KN_TOOLS_VERSION );
	wp_enqueue_script( 'kn-hub', KN_TOOLS_URL . 'assets/common/kn-hub.js', array(), KN_TOOLS_VERSION, true );

	$groups   = kn_tools_groups();
	$by_group = array();
	$live     = 0;
	foreach ( kn_tools_registry() as $slug => $tool ) {
		if ( 'live' !== $tool['status'] ) {
			continue;
		}
		$by_group[ $tool['group'] ][ $slug ] = $tool;
		$live++;
	}

	$html  = '<div class="kn-hub" data-hub>';
	$html .= '<div class="kn-hub__bar">'
		. '<div class="kn-hub__search"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
		. '<input type="search" data-hub-q placeholder="Tìm công cụ: PWM, CRC, ESP32, điện trở…" aria-label="Tìm công cụ"></div>'
		. '<p class="kn-hub__meta"><strong>' . (int) $live . ' công cụ</strong> miễn phí, chạy ngay trên trình duyệt, không cần cài đặt.</p>'
		. '<div class="kn-hub__chips" role="group" aria-label="Lọc theo nhóm"><button type="button" data-hub-group="" aria-pressed="true">Tất cả</button>';
	foreach ( $groups as $key => $g ) {
		if ( empty( $by_group[ $key ] ) ) {
			continue;
		}
		$html .= '<button type="button" data-hub-group="' . esc_attr( $key ) . '" aria-pressed="false">' . esc_html( $g['label'] ) . ' <span>' . count( $by_group[ $key ] ) . '</span></button>';
	}
	$html .= '</div></div>';

	foreach ( $groups as $key => $g ) {
		if ( empty( $by_group[ $key ] ) ) {
			continue;
		}
		$cards = '';
		foreach ( $by_group[ $key ] as $slug => $tool ) {
			$tags   = isset( $tool['tags'] ) ? $tool['tags'] : array();
			$search = strtolower( $tool['title'] . ' ' . ( isset( $tool['desc'] ) ? $tool['desc'] : '' ) . ' ' . implode( ' ', $tags ) );
			$cards .= '<a class="kn-hub__card" target="_blank" rel="noopener" href="' . esc_url( home_url( '/tools/' . $slug . '/' ) ) . '" data-hub-item data-search="' . esc_attr( $search ) . '">'
				. '<span class="kn-hub__icon">' . kn_tools_icon( isset( $tool['icon'] ) ? $tool['icon'] : 'chip' ) . '</span>'
				. '<span class="kn-hub__title">' . esc_html( $tool['title'] ) . '</span>'
				. ( isset( $tool['desc'] ) ? '<span class="kn-hub__desc">' . esc_html( $tool['desc'] ) . '</span>' : '' )
				. '<span class="kn-hub__foot"><span class="kn-hub__tags">'
				. implode( '', array_map( function ( $t ) { return '<span>' . esc_html( $t ) . '</span>'; }, $tags ) )
				. '</span><span class="kn-hub__go" aria-hidden="true">→</span></span></a>';
		}
		$html .= '<section class="kn-hub__group" data-hub-section="' . esc_attr( $key ) . '">'
			. '<div class="kn-hub__ghead"><h2>' . esc_html( $g['label'] ) . '</h2><p>' . esc_html( $g['desc'] ) . '</p></div>'
			. '<div class="kn-hub__grid">' . $cards . '</div>'
			. '</section>';
	}

	$html .= '<p class="kn-hub__empty" data-hub-empty hidden>Chưa có công cụ phù hợp. Thử từ khóa khác, hoặc góp ý công cụ bạn cần trong group <a href="https://www.facebook.com/groups/nghienlaptrinh26">Nghiện Lập Trình</a>.</p>';
	return $html . '</div>';
}
