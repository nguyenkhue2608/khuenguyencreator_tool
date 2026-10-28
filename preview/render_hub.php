<?php
/**
 * Sinh HTML trang Hub ngoài WordPress để làm preview: giả lập các hàm WP mà includes/ dùng.
 * Link thẻ tool trỏ tới bản preview trong preview/links.json (nếu có), không thì "#".
 */
define( 'ABSPATH', __DIR__ );
define( 'KN_TOOLS_DIR', dirname( __DIR__ ) . '/' );
define( 'KN_TOOLS_URL', '' );
define( 'KN_TOOLS_VERSION', 'preview' );

function add_action() {}
function add_shortcode() {}
function wp_enqueue_style() {}
function wp_enqueue_script() {}
function esc_html( $s ) { return htmlspecialchars( $s, ENT_QUOTES, 'UTF-8' ); }
function esc_attr( $s ) { return htmlspecialchars( $s, ENT_QUOTES, 'UTF-8' ); }
function esc_url( $s ) { return htmlspecialchars( $s, ENT_QUOTES, 'UTF-8' ); }
function home_url( $path = '' ) {
	static $links = null;
	if ( null === $links ) {
		$f     = __DIR__ . '/links.json';
		$links = file_exists( $f ) ? json_decode( file_get_contents( $f ), true ) : array();
	}
	$slug = trim( str_replace( '/tools/', '', $path ), '/' );
	return isset( $links[ $slug ] ) ? $links[ $slug ] : '#';
}

require KN_TOOLS_DIR . 'includes/registry.php';
require KN_TOOLS_DIR . 'includes/shortcodes.php';
echo kn_tools_render_hub();
