<?php
/**
 * Danh sách tool. Thêm tool mới: thêm một dòng ở đây và tạo assets/tools/<slug>/tool.js (+ tool.css nếu cần).
 * status: 'live' = đã xong, hiện trên Hub; 'planned' = chưa làm, không hiện ở đâu (chỉ để theo dõi lộ trình).
 * deps:   phần dùng chung trong assets/common/<dep>.js|.css, nạp trước tool.js.
 * desc:   một câu mô tả cho thẻ trên Hub. tags: từ khóa hiện trên thẻ và dùng cho ô tìm kiếm.
 * icon:   tên icon trong kn_tools_icon().
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function kn_tools_groups() {
	return array(
		'mcu'       => array( 'label' => 'Vi điều khiển', 'desc' => 'Cấu hình Timer, PWM và tra sơ đồ chân các board phổ biến.' ),
		'phan-cung' => array( 'label' => 'Phần cứng & mạch', 'desc' => 'Chọn linh kiện và tính toán mạch điện thường gặp.' ),
		'du-lieu'   => array( 'label' => 'Dữ liệu & giao thức', 'desc' => 'Đổi cơ số, kiểm tra CRC, đọc số thực khi truyền qua UART, Modbus.' ),
		'do-hoa'    => array( 'label' => 'Đồ họa & bảng tra', 'desc' => 'Chuyển ảnh, font, bảng tra thành mảng C cho màn hình và DSP.' ),
		'web-hw'    => array( 'label' => 'Kết nối phần cứng', 'desc' => 'Nói chuyện trực tiếp với board qua trình duyệt Chrome, Edge.' ),
	);
}

function kn_tools_registry() {
	$calc = array( 'kn-calc', 'kn-elec' );
	return array(
		// Vi điều khiển
		'pinout'                 => array( 'group' => 'mcu', 'title' => 'Pinout viewer', 'status' => 'live', 'icon' => 'chip',
			'desc' => 'Sơ đồ chân 19 board vẽ theo hình dạng thật, lọc theo ADC, PWM, UART, I2C, SPI.',
			'tags' => array( 'ESP32', 'STM32', 'Arduino', 'Raspberry Pi', '8051' ) ),
		'stm32-timer-interrupt'  => array( 'group' => 'mcu', 'title' => 'Tính thời gian ngắt Timer STM32', 'status' => 'live', 'deps' => array( 'stm32-clock' ), 'icon' => 'timer',
			'desc' => 'Ra Prescaler, Counter Period cho ngắt mỗi 1 ms, 10 ms… kèm clock tree như CubeMX.',
			'tags' => array( 'STM32', 'Timer', 'CubeMX' ) ),
		'stm32-pwm'              => array( 'group' => 'mcu', 'title' => 'Tính tần số và duty PWM STM32', 'status' => 'live', 'deps' => array( 'stm32-clock' ), 'icon' => 'pwm',
			'desc' => 'Ra PSC, ARR, CCR cho tần số và duty mong muốn, xem dạng sóng và code HAL.',
			'tags' => array( 'STM32', 'PWM', 'HAL' ) ),

		// Phần cứng & mạch
		'ma-mau-dien-tro'        => array( 'group' => 'phan-cung', 'title' => 'Mã màu điện trở', 'status' => 'live', 'deps' => $calc, 'icon' => 'resistor',
			'desc' => 'Đọc điện trở 4, 5, 6 vạch, hoặc nhập giá trị để biết các vạch màu.',
			'tags' => array( 'Điện trở', 'E12', 'E24' ) ),
		'cau-chia-ap'            => array( 'group' => 'phan-cung', 'title' => 'Cầu chia áp', 'status' => 'live', 'deps' => $calc, 'icon' => 'divider',
			'desc' => 'Tính Vout, hoặc tìm cặp R1, R2 chuẩn để đo điện áp bằng chân ADC.',
			'tags' => array( 'ADC', 'Điện trở' ) ),
		'dien-tro-led'           => array( 'group' => 'phan-cung', 'title' => 'Điện trở hạn dòng LED', 'status' => 'live', 'deps' => $calc, 'icon' => 'led',
			'desc' => 'Chọn điện trở và công suất cho LED theo nguồn, màu LED và dòng.',
			'tags' => array( 'LED', 'GPIO' ) ),
		'pull-up-i2c'            => array( 'group' => 'phan-cung', 'title' => 'Điện trở pull-up I2C', 'status' => 'planned', 'icon' => 'resistor' ),
		'rc-calculator'          => array( 'group' => 'phan-cung', 'title' => 'Mạch lọc RC', 'status' => 'planned', 'icon' => 'divider' ),
		'tan-nhiet-ldo'          => array( 'group' => 'phan-cung', 'title' => 'Tản nhiệt LDO', 'status' => 'planned', 'icon' => 'chip' ),
		'thoi-luong-pin'         => array( 'group' => 'phan-cung', 'title' => 'Thời lượng pin', 'status' => 'planned', 'icon' => 'battery' ),
		'be-rong-duong-mach-pcb' => array( 'group' => 'phan-cung', 'title' => 'Bề rộng đường mạch PCB', 'status' => 'live', 'deps' => $calc, 'icon' => 'pcb',
			'desc' => 'Bề rộng đường mạch theo dòng điện và độ tăng nhiệt (IPC-2221), kèm sụt áp và tỏa nhiệt.',
			'tags' => array( 'PCB', 'IPC-2221', 'Altium' ) ),
		'tro-khang-microstrip'   => array( 'group' => 'phan-cung', 'title' => 'Trở kháng microstrip', 'status' => 'live', 'deps' => $calc, 'icon' => 'pcb',
			'desc' => 'Tìm bề rộng đường mạch cho 50 Ω, 90 Ω theo stackup, hoặc tính Z0 từ bề rộng.',
			'tags' => array( 'PCB', 'RF', '50 Ω' ) ),
		'opamp-gain'             => array( 'group' => 'phan-cung', 'title' => 'Hệ số khuếch đại Op-amp', 'status' => 'live', 'deps' => $calc, 'icon' => 'opamp',
			'desc' => 'Hệ số khuếch đại mạch đảo, không đảo, vi sai; mức ra bị kẹp và cặp điện trở chuẩn.',
			'tags' => array( 'Op-amp', 'Analog', 'ADC' ) ),

		// Dữ liệu & giao thức
		'hex-dec-bin'            => array( 'group' => 'du-lieu', 'title' => 'Hex ↔ Dec ↔ Bin', 'status' => 'live', 'deps' => $calc, 'icon' => 'binary',
			'desc' => 'Đổi cơ số 8–64 bit, bấm từng bit để tạo mặt nạ thanh ghi và code C.',
			'tags' => array( 'Bitwise', 'Thanh ghi' ) ),
		'crc'                    => array( 'group' => 'du-lieu', 'title' => 'CRC & Checksum', 'status' => 'live', 'deps' => $calc, 'icon' => 'crc',
			'desc' => 'Tính cùng lúc CRC-8, CRC-16 Modbus, CCITT, CRC-32 và checksum, kèm hàm C.',
			'tags' => array( 'Modbus', 'CRC-32', 'UART' ) ),
		'float-ieee754'          => array( 'group' => 'du-lieu', 'title' => 'Float ↔ IEEE 754', 'status' => 'live', 'deps' => $calc, 'icon' => 'float',
			'desc' => 'Đổi float, double sang hex, xem thứ tự byte Modbus và fixed-point Q15.',
			'tags' => array( 'Float', 'Modbus', 'Q15' ) ),

		// Đồ họa & bảng tra
		'image-to-c-array'       => array( 'group' => 'do-hoa', 'title' => 'Ảnh sang mảng C', 'status' => 'live', 'deps' => $calc, 'icon' => 'image',
			'desc' => 'Chuyển ảnh thành mảng C cho OLED SSD1306, TFT ST7735, ILI9341: 1-bit, RGB565.',
			'tags' => array( 'OLED', 'TFT', 'RGB565' ) ),
		'font-generator'         => array( 'group' => 'do-hoa', 'title' => 'Tạo font cho LCD', 'status' => 'live', 'deps' => $calc, 'icon' => 'font',
			'desc' => 'Tạo font bitmap từ font máy tính hoặc Google Fonts, xuất GFXfont cho Adafruit GFX.',
			'tags' => array( 'OLED', 'Adafruit GFX', 'Font' ) ),
		'lut-generator'          => array( 'group' => 'do-hoa', 'title' => 'Bảng tra LUT (sin, NTC)', 'status' => 'planned', 'icon' => 'wave' ),
		'fir-iir-filter'         => array( 'group' => 'do-hoa', 'title' => 'Thiết kế bộ lọc FIR / IIR', 'status' => 'planned', 'icon' => 'wave' ),

		// Kết nối phần cứng
		'web-serial-monitor'     => array( 'group' => 'web-hw', 'title' => 'Web Serial Monitor', 'status' => 'planned', 'icon' => 'serial' ),
		'ble-tester'             => array( 'group' => 'web-hw', 'title' => 'Web Bluetooth BLE tester', 'status' => 'planned', 'icon' => 'ble' ),
	);
}

/* Icon nét (stroke) 24×24, tô màu bằng currentColor. */
function kn_tools_icon( $name ) {
	$paths = array(
		'chip'     => '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M9 3v4M12 3v4M15 3v4M9 17v4M12 17v4M15 17v4M3 9h4M3 12h4M3 15h4M17 9h4M17 12h4M17 15h4"/>',
		'timer'    => '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
		'pwm'      => '<path d="M2 17h3V7h4v10h3V7h2v10h3V7h5"/>',
		'resistor' => '<path d="M2 12h4l1.5-4 3 8 3-8 3 8 1.5-4h4"/>',
		'divider'  => '<path d="M12 2v3M12 19v3M12 12h7"/><rect x="9.5" y="5" width="5" height="5.5" rx="1"/><rect x="9.5" y="13.5" width="5" height="5.5" rx="1"/><circle cx="19.5" cy="12" r="1.2"/>',
		'led'      => '<path d="M6 7h12l-6 9z M6 16h12M12 2v5M12 16v6"/><path d="M18 4l2.5-2.5M20 7l2.5-1.5"/>',
		'binary'   => '<path d="M5 4v6M3.5 4.5 5 4M10 4h3v6h-3zM5 14h3v6H5zM15 14v6M13.5 14.5 15 14M18 4v6M16.5 4.5 18 4"/><path d="M19 14h2v6h-2z"/>',
		'crc'      => '<path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
		'float'    => '<path d="M4 20 10 4M14 9h6M14 15h6M17 12v0"/><circle cx="17" cy="6" r=".6"/><circle cx="17" cy="18" r=".6"/>',
		'battery'  => '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10.5v3M7 10v4M10 10v4"/>',
		'pcb'      => '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h4v4h6M7 17h3l3-3h4"/><circle cx="7" cy="7" r="1"/><circle cx="17" cy="11" r="1"/><circle cx="7" cy="17" r="1"/><circle cx="17" cy="14" r="1"/>',
		'opamp'    => '<path d="M6 4v16l13-8z M2 9h4M2 15h4M19 12h3"/>',
		'image'    => '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9.5" r="1.8"/><path d="M3 17l5-5 4 4 3-3 6 6"/>',
		'font'     => '<path d="M4 20 10 4l6 16M6.5 14h7M17 20v-7a2.5 2.5 0 0 1 5 0v7M17 16h5"/>',
		'wave'     => '<path d="M2 12c2.5-6 5-6 7.5 0s5 6 7.5 0 3.5-4 5-3"/><path d="M2 20h20"/>',
		'serial'   => '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 10l3 2-3 2M11 15h6"/>',
		'ble'      => '<path d="M7 7l10 10-5 4V3l5 4L7 17"/>',
	);
	$p = isset( $paths[ $name ] ) ? $paths[ $name ] : $paths['chip'];
	return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . $p . '</svg>';
}
