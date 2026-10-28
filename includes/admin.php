<?php
/**
 * Trang quản trị Công cụ > KN Tools: xem trạng thái các trang /tools/, tạo trang còn thiếu, công khai trang.
 * Trang mới tạo ở chế độ Riêng tư; nội dung lấy từ data/pages.json (tiêu đề, mô tả) và content/<slug>.html (bài giải thích).
 * Không bao giờ ghi đè trang đã có, để giữ chỉnh sửa của bạn.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'KN_TOOLS_HUB_SLUG', 'tools' );

add_action( 'admin_menu', function () {
	add_management_page( 'KN Tools', 'KN Tools', 'manage_options', 'kn-tools', 'kn_tools_admin_page' );
} );

add_filter( 'plugin_action_links_' . plugin_basename( KN_TOOLS_DIR . 'kn-tools.php' ), function ( $links ) {
	array_unshift( $links, '<a href="' . esc_url( admin_url( 'tools.php?page=kn-tools' ) ) . '">Tạo trang công cụ</a>' );
	return $links;
} );

function kn_tools_pages_meta() {
	$file = KN_TOOLS_DIR . 'data/pages.json';
	$meta = file_exists( $file ) ? json_decode( file_get_contents( $file ), true ) : array();
	return is_array( $meta ) ? $meta : array();
}

function kn_tools_page_body( $slug, $is_hub ) {
	$meta  = kn_tools_pages_meta();
	$intro = isset( $meta[ $slug ]['intro'] ) ? '<p>' . esc_html( $meta[ $slug ]['intro'] ) . '</p>' . "\n\n" : '';
	$file  = KN_TOOLS_DIR . 'content/' . $slug . '.html';
	$body  = file_exists( $file ) ? preg_replace( '/^<!--.*?-->\s*/s', '', file_get_contents( $file ) ) : '';
	$code  = $is_hub ? '[kn_tools_hub]' : '[kn_tool slug="' . $slug . '"]';
	return $intro . $code . "\n\n" . $body;
}

/* Danh sách trang cần có: Hub + mọi tool 'live'. Mỗi mục: slug, tiêu đề, page hiện có (hoặc null). */
function kn_tools_page_plan() {
	$meta = kn_tools_pages_meta();
	$hub  = get_page_by_path( KN_TOOLS_HUB_SLUG );
	$plan = array(
		array(
			'slug'  => 'tools-hub',
			'path'  => KN_TOOLS_HUB_SLUG,
			'title' => isset( $meta['tools-hub']['h1'] ) ? $meta['tools-hub']['h1'] : 'Công cụ lập trình nhúng',
			'hub'   => true,
			'page'  => $hub,
		),
	);
	foreach ( kn_tools_registry() as $slug => $tool ) {
		if ( 'live' !== $tool['status'] ) {
			continue;
		}
		$plan[] = array(
			'slug'  => $slug,
			'path'  => KN_TOOLS_HUB_SLUG . '/' . $slug,
			'title' => isset( $meta[ $slug ]['h1'] ) ? $meta[ $slug ]['h1'] : $tool['title'],
			'hub'   => false,
			'page'  => get_page_by_path( KN_TOOLS_HUB_SLUG . '/' . $slug ),
		);
	}
	return $plan;
}

function kn_tools_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$plan    = kn_tools_page_plan();
	$missing = count( array_filter( $plan, function ( $p ) { return ! $p['page']; } ) );
	$private = count( array_filter( $plan, function ( $p ) { return $p['page'] && 'publish' !== $p['page']->post_status; } ) );
	$labels  = array( 'publish' => 'Công khai', 'private' => 'Riêng tư', 'draft' => 'Bản nháp', 'pending' => 'Chờ duyệt', 'trash' => 'Thùng rác' );

	echo '<div class="wrap"><h1>KN Tools</h1>';
	if ( isset( $_GET['kn_done'] ) ) {
		echo '<div class="notice notice-success is-dismissible"><p>' . esc_html( sanitize_text_field( wp_unslash( $_GET['kn_done'] ) ) ) . '</p></div>';
	}
	echo '<p>Plugin cần một trang Hub tại <code>/' . KN_TOOLS_HUB_SLUG . '/</code> và một trang con cho mỗi công cụ. '
		. 'Trang mới được tạo ở chế độ <strong>Riêng tư</strong>: chỉ quản trị viên xem được, để bạn kiểm tra giao diện trong theme trước khi công khai. '
		. 'Trang đã có sẽ không bị ghi đè.</p>';

	echo '<table class="widefat striped" style="max-width:960px"><thead><tr><th>Trang</th><th>Đường dẫn</th><th>Trạng thái</th><th></th></tr></thead><tbody>';
	foreach ( $plan as $p ) {
		$status = $p['page'] ? ( isset( $labels[ $p['page']->post_status ] ) ? $labels[ $p['page']->post_status ] : $p['page']->post_status ) : '<em>Chưa có</em>';
		$links  = $p['page'] ? '<a href="' . esc_url( get_permalink( $p['page'] ) ) . '" target="_blank">Xem</a> · <a href="' . esc_url( get_edit_post_link( $p['page']->ID ) ) . '">Sửa</a>' : '';
		echo '<tr><td>' . ( $p['hub'] ? '<strong>' . esc_html( $p['title'] ) . '</strong>' : '&nbsp;&nbsp;— ' . esc_html( $p['title'] ) ) . '</td>'
			. '<td><code>/' . esc_html( $p['path'] ) . '/</code></td><td>' . $status . '</td><td>' . $links . '</td></tr>';
	}
	echo '</tbody></table>';

	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">';
	wp_nonce_field( 'kn_tools_pages' );
	echo '<input type="hidden" name="action" value="kn_tools_pages">';
	echo '<button class="button button-primary" name="kn_op" value="create"' . ( $missing ? '' : ' disabled' ) . '>Tạo ' . (int) $missing . ' trang còn thiếu (Riêng tư)</button>';
	echo '<button class="button" name="kn_op" value="publish"' . ( $private ? '' : ' disabled' ) . ' onclick="return confirm(\'Công khai ' . (int) $private . ' trang cho mọi người xem?\')">Công khai ' . (int) $private . ' trang chưa công khai</button>';
	echo '</form>';

	echo '<h2>Sau khi tạo trang</h2><ol>'
		. '<li>Mở từng trang ở chế độ Riêng tư để kiểm tra giao diện trong theme.</li>'
		. '<li>Nếu dùng plugin cache hoặc tối ưu JS (WP Rocket, LiteSpeed Cache, Autoptimize…) mà công cụ không chạy, loại trừ đường dẫn <code>/wp-content/plugins/kn-tools/</code> khỏi gộp và trì hoãn JS.</li>'
		. '<li>Thêm trang <code>/' . KN_TOOLS_HUB_SLUG . '/</code> vào menu của theme (Giao diện → Menu).</li>'
		. '</ol></div>';
}

add_action( 'admin_post_kn_tools_pages', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Không có quyền.' );
	}
	check_admin_referer( 'kn_tools_pages' );
	$op   = isset( $_POST['kn_op'] ) ? sanitize_key( $_POST['kn_op'] ) : '';
	$meta = kn_tools_pages_meta();
	$n    = 0;

	if ( 'create' === $op ) {
		$hub_id = 0;
		foreach ( kn_tools_page_plan() as $p ) {
			if ( $p['hub'] && $p['page'] ) {
				$hub_id = $p['page']->ID;
			}
			if ( $p['page'] ) {
				continue;
			}
			$id = wp_insert_post( array(
				'post_type'    => 'page',
				'post_status'  => 'private',
				'post_title'   => $p['title'],
				'post_name'    => $p['hub'] ? KN_TOOLS_HUB_SLUG : $p['slug'],
				'post_parent'  => $p['hub'] ? 0 : $hub_id,
				'post_content' => kn_tools_page_body( $p['slug'], $p['hub'] ),
			), true );
			if ( is_wp_error( $id ) ) {
				continue;
			}
			if ( $p['hub'] ) {
				$hub_id = $id;
			}
			if ( isset( $meta[ $p['slug'] ]['intro'] ) ) {
				update_post_meta( $id, 'rank_math_description', $meta[ $p['slug'] ]['intro'] );
			}
			$n++;
		}
		$msg = 'Đã tạo ' . $n . ' trang ở chế độ Riêng tư.';
	} elseif ( 'publish' === $op ) {
		foreach ( kn_tools_page_plan() as $p ) {
			if ( $p['page'] && 'publish' !== $p['page']->post_status ) {
				wp_update_post( array( 'ID' => $p['page']->ID, 'post_status' => 'publish' ) );
				$n++;
			}
		}
		$msg = 'Đã công khai ' . $n . ' trang.';
	} else {
		$msg = 'Không có thao tác nào.';
	}
	wp_safe_redirect( add_query_arg( 'kn_done', rawurlencode( $msg ), admin_url( 'tools.php?page=kn-tools' ) ) );
	exit;
} );
