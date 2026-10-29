# KN Tools

Bộ công cụ lập trình nhúng chạy trên trình duyệt cho **khuenguyencreator.com** (WordPress + theme Flatsome), đóng gói dưới dạng một plugin WordPress.

- Mỗi tool là một Page WordPress tại `/tools/<slug>/`, nhúng bằng shortcode `[kn_tool slug="<slug>"]`.
- Trang Hub `/tools/` dùng `[kn_tools_hub]`: ô tìm kiếm (không dấu cũng được), lọc theo nhóm, thẻ tool lấy tên, mô tả, tag, icon từ `includes/registry.php`. Nội dung đặt dưới Hub nằm ở `content/tools-hub.html`.
- Tool chạy hoàn toàn bằng JS phía client: không cần server, AdSense và SEO dùng chung theme.

## Cấu trúc repo

```
kn-tools/
├── kn-tools.php              # plugin header, nạp includes
├── includes/
│   ├── registry.php          # danh sách tool + nhóm (thêm tool ở đây)
│   └── shortcodes.php        # [kn_tool], [kn_tools_hub], chỉ enqueue asset khi trang có tool
├── assets/
│   ├── common/kn-tools.css   # style chung, scope dưới .kn-tool
│   └── tools/<slug>/         # tool.js (+ tool.css) của từng tool
├── data/pinout/              # dữ liệu board cho Pinout viewer
├── content/<slug>.html       # bài giải thích đặt dưới tool trên Page WordPress
├── preview/                  # trang xem trước độc lập (mô phỏng Flatsome)
└── build.sh                  # đóng gói dist/kn-tools.zip
```

## Danh sách tool

```
/tools/
├── 1. Tính toán phần cứng / mạch
│   ├── Mã màu điện trở                   ma-mau-dien-tro
│   ├── Cầu chia áp                       cau-chia-ap
│   ├── Điện trở hạn dòng LED             dien-tro-led
│   ├── Điện trở pull-up I2C              pull-up-i2c
│   ├── Mạch lọc RC                       mach-loc-rc
│   ├── Tản nhiệt LDO                     tan-nhiet-ldo
│   ├── Thời lượng pin                    thoi-luong-pin
│   ├── Bề rộng đường mạch (IPC-2221)     be-rong-duong-mach-pcb
│   ├── Trở kháng microstrip              tro-khang-microstrip
│   └── Hệ số khuếch đại Op-amp           opamp-gain
├── 2. Cấu hình MCU
│   ├── STM32: thời gian ngắt Timer       stm32-timer-interrupt
│   ├── STM32: tần số và duty PWM         stm32-pwm
│   └── Pinout viewer                     pinout   (board: data/pinout/boards.json, mỗi board một file JSON)
├── 3. Xử lý dữ liệu / giao thức
│   ├── CRC & Checksum                    crc
│   ├── Hex ↔ Dec ↔ Bin + Bitfield        hex-dec-bin
│   └── Float ↔ IEEE754                   float-ieee754
├── 4. Đồ họa / dữ liệu nhúng
│   ├── Image → C array                   image-to-c-array
│   ├── Font generator                    font-generator
│   ├── Bảng tra LUT (sin, NTC)           lut-generator
│   └── Thiết kế bộ lọc FIR / IIR         fir-iir-filter
└── 5. Giao tiếp phần cứng qua trình duyệt
    ├── Web Serial Monitor (+ plotter)    web-serial-monitor
    └── Web Bluetooth BLE tester          ble-tester
```

## Lộ trình

| Đợt | Tool | Lý do |
|---|---|---|
| 0 | Plugin khung + trang Hub `/tools/` | Nền cho mọi tool |
| 1 | STM32 ngắt Timer, STM32 PWM | Giá trị cao nhất, gắn với ~47 bài STM32. Dùng chung `assets/common/stm32-clock.*` (dữ liệu chip, clock tree) |
| 1 | Mã màu điện trở, Cầu chia áp, Điện trở LED (đã xong) | Dùng chung `assets/common/kn-elec.js` (đọc giá trị 4k7, dãy E, bảng màu) và `kn-calc.css` |
| 2 | Hex/Dec/Bin + Bitfield, CRC, Float↔IEEE754 (đã xong) | Dễ, dùng hằng ngày, gắn series C/C++ |
| 2 | Web Serial Monitor | Tool "giữ chân" người dùng quay lại, gắn series ESP32 |
| 3 | Image → C array, Pinout viewer (board priority 1) | Cần dữ liệu và xử lý ảnh |
| 3 | RC, Op-amp (đã xong); LDO, Pull-up I2C, Thời lượng pin | Bổ sung nhóm phần cứng |
| 4 | Pinout (priority 2–3), LUT, Font, PCB (đã xong); BLE | |
| 5 | FIR/IIR | Khó nhất, làm sau cùng |

## Ghi chú cho Flatsome

- **Template trang:** tool thường chọn `Page - Default`; tool cần rộng (Web Serial, Image → C, Pinout) chọn `Page - Full Width`.
- **UX Builder:** chèn shortcode bằng element *Text* hoặc *HTML*. Đặt tool ở trên, nội dung giải thích (300–800 từ) ở dưới.
- **CSS:** mọi style đều scope dưới `.kn-tool` để không bị CSS của Flatsome đè. Biến `--kn-accent` đặt theo màu primary trong *Theme Options > Style > Colors*.
- **Performance / cache:** nếu bật defer/combine JS (Flatsome *Advanced > Performance* hoặc plugin cache), loại trừ `kn-tools/assets/` nếu tool lỗi.
- **AdSense:** không đặt quảng cáo sát nút bấm (Tính, Connect, Send). Vị trí an toàn: dưới khối kết quả, giữa phần giải thích.

## Thêm một tool mới

1. Đổi `status` của tool trong `includes/registry.php` thành `live` (hoặc thêm dòng mới).
2. Tạo `assets/tools/<slug>/tool.js`: tìm `#kn-tool-<slug>` rồi render giao diện vào đó.
3. Tạo Page con của `/tools/` với slug `<slug>`, nội dung `[kn_tool slug="<slug>"]` + bài giải thích.
4. `./build.sh` → upload `dist/kn-tools.zip`.

## Xem trước giao diện

Trang Hub xem trước bằng `python3 preview/build.py tools-hub` (cần `php`; `preview/render_hub.php` giả lập hàm WordPress, thẻ tool trỏ tới link trong `preview/links.json`).

`python3 preview/build.py <slug>` tạo `dist/preview/<slug>.html`, một file HTML đã inline CSS/JS, mở thẳng bằng trình duyệt để xem tool cùng bài giải thích mà không cần WordPress. Thông tin tiêu đề trang nằm trong `preview/pages.json`.

## Pinout viewer

- Mỗi board là một file `data/pinout/<id>.json` (định dạng ghi ở đầu `assets/tools/pinout/tool.js`). Thêm board: tạo file JSON rồi đặt `"ready": true` cho board đó trong `data/pinout/boards.json`.
- Trang chung: `[kn_tool slug="pinout"]`. Trang riêng cho từng board (tốt cho SEO): `[kn_tool slug="pinout" board="esp32-devkit-v1"]`.
- Đã có 19 board (xem `data/pinout/boards.json`). Board phức tạp sinh từ script `data/pinout/_gen_*.py`; sửa script rồi chạy lại thay vì sửa JSON tay.
- Board có header đôi hoặc header nằm ngang dùng `groups` thay cho `left`/`right` (xem chú thích trong `tool.js`).
- Chưa làm: kit NuTiny N76E885 (chưa có tài liệu header chính hãng).
