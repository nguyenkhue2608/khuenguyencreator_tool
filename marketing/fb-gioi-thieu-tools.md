# Post fanpage: giới thiệu bộ công cụ /tools/

Ảnh: `fb-gioi-thieu-tools.png` (1080×1350)

## Caption

Cấu hình Timer STM32 xong mới phát hiện ngắt chạy sai vì nhầm xung APB1 với AHB? Hay ngồi tra bảng mã màu điện trở mãi không ra?

Mình gom mấy phép tính dân nhúng hay phải làm thành 14 công cụ chạy ngay trên trình duyệt. Miễn phí, không cần cài đặt, không cần đăng nhập:

🔹 Vi điều khiển: sơ đồ chân 19 board (ESP32, STM32, Arduino, Raspberry Pi, 8051), tính ngắt Timer và PWM STM32 kèm clock tree giống CubeMX
🔹 Phần cứng: mã màu điện trở, cầu chia áp, điện trở cho LED, bề rộng đường mạch PCB, trở kháng microstrip, khuếch đại Op-amp
🔹 Dữ liệu: đổi Hex/Dec/Bin, tính CRC (Modbus, CCITT, CRC-32), Float sang IEEE 754
🔹 Đồ họa: ảnh sang mảng C cho OLED/TFT, tạo font bitmap cho LCD (tải được font riêng của bạn lên)

Mỗi công cụ đều có bài giải thích công thức bên dưới, dùng xong là hiểu luôn tại sao ra con số đó.

Link ở comment đầu nhé. Bạn còn hay phải tính gì bằng tay nữa? Comment để mình làm thêm công cụ tiếp theo 👇

## Comment đầu

Bộ công cụ cho dân lập trình nhúng: https://khuenguyencreator.com/tools/?utm_source=facebook&utm_medium=page&utm_campaign=kn-tools
