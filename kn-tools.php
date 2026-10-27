<?php
/**
 * Plugin Name: KN Tools
 * Description: Bộ công cụ lập trình nhúng cho khuenguyencreator.com. Mỗi tool là một shortcode [kn_tool slug="..."]; trang Hub dùng [kn_tools_hub].
 * Version:     0.1.0
 * Author:      Khuê Nguyễn Creator
 * Text Domain: kn-tools
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'KN_TOOLS_VERSION', '0.1.0' );
define( 'KN_TOOLS_DIR', plugin_dir_path( __FILE__ ) );
define( 'KN_TOOLS_URL', plugin_dir_url( __FILE__ ) );

require_once KN_TOOLS_DIR . 'includes/registry.php';
require_once KN_TOOLS_DIR . 'includes/shortcodes.php';
