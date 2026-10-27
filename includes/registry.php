<?php
/**
 * Danh sách tool. Thêm tool mới: thêm một dòng ở đây và tạo assets/tools/<slug>/tool.js (+ tool.css nếu cần).
 * status: 'live' = đã xong, hiện trên Hub; 'planned' = chưa làm, Hub hiện "Sắp ra mắt".
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function kn_tools_groups() {
	return array(
		'phan-cung' => 'Tính toán phần cứng / mạch',
		'mcu'       => 'Cấu hình MCU',
		'du-lieu'   => 'Xử lý dữ liệu / giao thức',
		'do-hoa'    => 'Đồ họa / dữ liệu nhúng',
		'web-hw'    => 'Giao tiếp phần cứng qua trình duyệt',
	);
}

function kn_tools_registry() {
	return array(
		// 1. Phần cứng / mạch
		'ma-mau-dien-tro'        => array( 'group' => 'phan-cung', 'title' => 'Mã màu điện trở', 'status' => 'planned' ),
		'cau-chia-ap'            => array( 'group' => 'phan-cung', 'title' => 'Cầu chia áp', 'status' => 'planned' ),
		'dien-tro-led'           => array( 'group' => 'phan-cung', 'title' => 'Điện trở hạn dòng LED', 'status' => 'planned' ),
		'pull-up-i2c'            => array( 'group' => 'phan-cung', 'title' => 'Điện trở pull-up I2C', 'status' => 'planned' ),
		'rc-calculator'          => array( 'group' => 'phan-cung', 'title' => 'RC calculator', 'status' => 'planned' ),
		'tan-nhiet-ldo'          => array( 'group' => 'phan-cung', 'title' => 'Tản nhiệt LDO', 'status' => 'planned' ),
		'thoi-luong-pin'         => array( 'group' => 'phan-cung', 'title' => 'Thời lượng pin', 'status' => 'planned' ),
		'be-rong-duong-mach-pcb' => array( 'group' => 'phan-cung', 'title' => 'Bề rộng đường mạch PCB (IPC-2221)', 'status' => 'planned' ),
		'tro-khang-microstrip'   => array( 'group' => 'phan-cung', 'title' => 'Trở kháng microstrip', 'status' => 'planned' ),
		'opamp-gain'             => array( 'group' => 'phan-cung', 'title' => 'Hệ số khuếch đại Op-amp', 'status' => 'planned' ),

		// 2. MCU
		'stm32-timer-pwm'        => array( 'group' => 'mcu', 'title' => 'STM32 Timer / PWM calculator', 'status' => 'live' ),
		'pinout'                 => array( 'group' => 'mcu', 'title' => 'Pinout viewer', 'status' => 'planned' ),

		// 3. Dữ liệu / giao thức
		'crc'                    => array( 'group' => 'du-lieu', 'title' => 'CRC & Checksum', 'status' => 'planned' ),
		'hex-dec-bin'            => array( 'group' => 'du-lieu', 'title' => 'Hex ↔ Dec ↔ Bin + Bitfield', 'status' => 'planned' ),
		'float-ieee754'          => array( 'group' => 'du-lieu', 'title' => 'Float ↔ IEEE754', 'status' => 'planned' ),

		// 4. Đồ họa / dữ liệu nhúng
		'image-to-c-array'       => array( 'group' => 'do-hoa', 'title' => 'Image → C array', 'status' => 'planned' ),
		'font-generator'         => array( 'group' => 'do-hoa', 'title' => 'Font generator', 'status' => 'planned' ),
		'lut-generator'          => array( 'group' => 'do-hoa', 'title' => 'LUT generator', 'status' => 'planned' ),
		'fir-iir-filter'         => array( 'group' => 'do-hoa', 'title' => 'Thiết kế bộ lọc FIR / IIR', 'status' => 'planned' ),

		// 5. Web hardware
		'web-serial-monitor'     => array( 'group' => 'web-hw', 'title' => 'Web Serial Monitor', 'status' => 'planned' ),
		'ble-tester'             => array( 'group' => 'web-hw', 'title' => 'Web Bluetooth BLE tester', 'status' => 'planned' ),
	);
}
