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

function kn_tools_render_hub() {
	kn_tools_enqueue_common();

	$by_group = array();
	foreach ( kn_tools_registry() as $slug => $tool ) {
		$by_group[ $tool['group'] ][ $slug ] = $tool;
	}

	$html = '<div class="kn-tools-hub">';
	foreach ( kn_tools_groups() as $group => $label ) {
		if ( empty( $by_group[ $group ] ) ) {
			continue;
		}
		$html .= '<h2>' . esc_html( $label ) . '</h2><ul class="kn-tools-hub__list">';
		foreach ( $by_group[ $group ] as $slug => $tool ) {
			if ( 'live' === $tool['status'] ) {
				$html .= '<li><a href="' . esc_url( home_url( '/tools/' . $slug . '/' ) ) . '">' . esc_html( $tool['title'] ) . '</a></li>';
			} else {
				$html .= '<li class="is-planned">' . esc_html( $tool['title'] ) . ' <span>Sắp ra mắt</span></li>';
			}
		}
		$html .= '</ul>';
	}
	return $html . '</div>';
}
