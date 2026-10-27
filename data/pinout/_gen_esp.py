#!/usr/bin/env python3
"""Sinh dữ liệu pinout cho họ ESP (S3 DevKitC-1, C3 SuperMini, ESP32-CAM, Wemos D1 mini).
Chạy lại khi sửa: python3 data/pinout/_gen_esp.py"""
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent


def P(l, name=None, f=None, k=None, n=None, t=None, note=None):
    d = {"l": l}
    if n is not None: d["n"] = n
    if name: d["name"] = name
    if k: d["k"] = k
    if f: d["f"] = f
    if t: d["t"] = t
    if note: d["note"] = note
    return d


def save(board):
    (OUT / (board["id"] + ".json")).write_text(json.dumps(board, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


# ---------------- ESP32-S3-DevKitC-1 ----------------
def s3(n):
    f = []
    first = {8: ["i2c:SDA (Wire)"], 9: ["i2c:SCL (Wire)"], 10: ["spi:FSPI_CS (SS)"], 11: ["spi:FSPI_MOSI"], 12: ["spi:FSPI_SCK"],
             13: ["spi:FSPI_MISO"], 17: ["uart:U1_TXD"], 18: ["uart:U1_RXD"], 19: ["usb:USB_D−"], 20: ["usb:USB_D+"],
             43: ["uart:U0_TXD"], 44: ["uart:U0_RXD"], 0: ["other:BOOT (nút)"]}
    f += first.get(n, [])
    if 1 <= n <= 10: f.append(f"adc:ADC1_CH{n - 1}")
    if 11 <= n <= 20: f.append(f"adc:ADC2_CH{n - 11}")
    if 1 <= n <= 14: f.append(f"touch:TOUCH{n}")
    f += {15: ["other:XTAL_32K_P"], 16: ["other:XTAL_32K_N"], 39: ["other:MTCK (JTAG)"], 40: ["other:MTDO (JTAG)"],
          41: ["other:MTDI (JTAG)"], 42: ["other:MTMS (JTAG)"], 38: ["other:RGB LED (v1.1)"], 48: ["other:RGB LED (v1.0)"]}.get(n, [])
    t, note = None, None
    if n in (0, 3, 45, 46):
        t = ["warn"]
        note = {0: "Chân strapping nối nút BOOT: giữ LOW khi khởi động để vào chế độ nạp",
                3: "Chân strapping (chọn nguồn JTAG). Tránh kéo mức cố định khi khởi động",
                45: "Chân strapping (chọn điện áp flash). Phải LOW khi khởi động",
                46: "Chân strapping (chế độ boot, log ROM). Phải LOW khi khởi động"}[n]
    if n in (35, 36, 37):
        t = ["warn"]
        note = "Module có PSRAM Octal (N8R8, N16R8…) dùng chân này cho PSRAM, không dùng làm GPIO"
    if n in (19, 20):
        note = "USB native của ESP32-S3 (cổng USB thứ hai trên board)"
    if n in (43, 44):
        note = "Nối chip USB-UART (cổng UART trên board), xuất log khi khởi động"
    return P(str(n), f"GPIO{n}", f, t=t, note=note)


save({
    "id": "esp32-s3-devkitc", "name": "ESP32-S3-DevKitC-1", "mcu": "ESP32-S3-WROOM-1", "family": "ESP32", "style": "esp", "logic": "3.3V",
    "orientation": "Nhìn từ mặt trên, anten ở phía trên, hai cổng USB ở phía dưới. Nhãn là số GPIO in trên board",
    "shape": {"w": 25.4, "h": 62.7, "rowGap": 22.86, "start": 5.08, "r": 1.2, "parts": [
        {"type": "module", "x": 3.7, "y": 0, "w": 18, "h": 25.5},
        {"type": "antenna", "x": 4.6, "y": 0.8, "w": 16.2, "h": 5},
        {"type": "shield", "x": 4.7, "y": 7, "w": 16, "h": 17.5, "label": "ESP32-S3\nWROOM-1", "fs": 10},
        {"type": "reg", "x": 4.2, "y": 29, "w": 6.5, "h": 7, "label": "LDO"},
        {"type": "chip", "x": 14.6, "y": 30.5, "w": 5, "h": 5, "pins": 6, "label": "USB-\nUART", "fs": 6.5},
        {"type": "led", "x": 11.2, "y": 39, "w": 3, "h": 3, "color": "#f2f2f2"},
        {"type": "text", "x": 12.7, "y": 44.6, "fs": 7, "label": "RGB"},
        {"type": "button", "x": 3.6, "y": 47.5, "w": 5, "h": 5, "label": "BOOT"},
        {"type": "button", "x": 16.8, "y": 47.5, "w": 5, "h": 5, "label": "RST"},
        {"type": "usb", "x": 3.4, "y": 57.6, "w": 8.6, "h": 5.8},
        {"type": "usb", "x": 13.4, "y": 57.6, "w": 8.6, "h": 5.8}]},
    "left": [P("3V3", k="power"), P("3V3", k="power"), P("RST", k="sys", f=["other:CHIP_PU / RESET"], note="Kéo LOW để reset")]
            + [s3(n) for n in (4, 5, 6, 7, 15, 16, 17, 18, 8, 3, 46, 9, 10, 11, 12, 13, 14)]
            + [P("5V", k="power", note="Nguồn 5V từ cổng USB, hoặc cấp 5V vào"), P("G", k="gnd")],
    "right": [P("G", k="gnd"), P("TX", "GPIO43", s3(43)["f"], note=s3(43)["note"]), P("RX", "GPIO44", s3(44)["f"], note=s3(44)["note"])]
             + [s3(n) for n in (1, 2, 42, 41, 40, 39, 38, 37, 36, 35, 0, 45, 48, 47, 21, 20, 19)]
             + [P("G", k="gnd"), P("G", k="gnd")],
    "notes": [
        "Mức logic 3.3V, các chân không chịu được 5V.",
        "Mọi GPIO đều xuất PWM được (LEDC 8 kênh) và có ngắt. I2C, SPI, UART gán được sang chân bất kỳ qua GPIO matrix; bảng trên là chân mặc định của Arduino core.",
        "ADC1 ở GPIO1–10, ADC2 ở GPIO11–20. ADC2 không ổn định khi đang dùng WiFi.",
        "Chân strapping: GPIO0, GPIO3, GPIO45, GPIO46. GPIO35–37 bị PSRAM Octal chiếm trên module N8R8 / N16R8.",
        "RGB LED (WS2812) nối GPIO48 trên bản v1.0, GPIO38 trên bản v1.1."
    ]
})


# ---------------- ESP32-C3 SuperMini ----------------
C3 = {
    0: ["adc:ADC1_CH0", "other:XTAL_32K_P"], 1: ["adc:ADC1_CH1", "other:XTAL_32K_N"], 2: ["adc:ADC1_CH2"], 3: ["adc:ADC1_CH3"],
    4: ["spi:SCK", "adc:ADC1_CH4", "other:MTMS (JTAG)"], 5: ["spi:MISO", "adc:ADC2_CH0", "other:MTDI (JTAG)"],
    6: ["spi:MOSI", "other:MTCK (JTAG)"], 7: ["spi:SS", "other:MTDO (JTAG)"], 8: ["i2c:SDA", "other:LED onboard"],
    9: ["i2c:SCL", "other:BOOT (nút)"], 10: [], 20: ["uart:U0_RXD"], 21: ["uart:U0_TXD"]}
C3N = {2: ("Chân strapping: phải HIGH hoặc để trống khi khởi động", ["warn"]),
       5: ("ADC2 không đọc được khi đang dùng WiFi", None),
       8: ("Chân strapping, nối LED xanh (sáng khi LOW). Phải HIGH khi nạp code qua UART", ["warn"]),
       9: ("Chân strapping nối nút BOOT: giữ LOW khi khởi động để vào chế độ nạp", ["warn"]),
       20: ("UART0, xuất log khi khởi động", None), 21: ("UART0, xuất log khi khởi động", None)}


def c3(n):
    note, t = C3N.get(n, (None, None))
    return P(str(n), f"GPIO{n}", C3[n], t=t, note=note)


save({
    "id": "esp32-c3-supermini", "name": "ESP32-C3 SuperMini", "mcu": "ESP32-C3FH4", "family": "ESP32", "style": "black", "logic": "3.3V",
    "orientation": "Nhìn từ mặt trên, cổng USB-C ở phía trên. Số GPIO in ở mặt dưới board; một số bản clone sắp xếp khác, hãy đối chiếu chữ in",
    "shape": {"w": 18, "h": 22.6, "rowGap": 15.24, "start": 2.5, "r": 1, "parts": [
        {"type": "usb", "x": 5, "y": -1.4, "w": 8, "h": 6.6},
        {"type": "button", "x": 3.2, "y": 6.4, "w": 2.8, "h": 2.8, "label": "BOOT"},
        {"type": "button", "x": 12, "y": 6.4, "w": 2.8, "h": 2.8, "label": "RST"},
        {"type": "chip", "x": 6.5, "y": 11, "w": 5, "h": 5, "pins": 5, "label": "C3", "fs": 9},
        {"type": "led", "x": 13.6, "y": 13, "w": 1.6, "h": 0.9, "color": "#2f7bff"},
        {"type": "smd", "x": 5.6, "y": 18.6, "w": 6.8, "h": 2.4, "fill": "#d9d2bd"},
        {"type": "text", "x": 9, "y": 22.3, "fs": 6.5, "label": "ANT"}]},
    "left": [P("5V", k="power", note="Nguồn 5V từ USB-C, hoặc cấp 5V vào"), P("G", k="gnd"), P("3.3", k="power", note="Ngõ ra 3.3V từ LDO")]
            + [c3(n) for n in (4, 3, 2, 1, 0)],
    "right": [c3(n) for n in (5, 6, 7, 8, 9, 10, 20, 21)],
    "notes": [
        "Mức logic 3.3V, các chân không chịu được 5V.",
        "Mọi GPIO đều xuất PWM (LEDC 6 kênh) và có ngắt. I2C, SPI gán được sang chân khác; bảng trên là chân mặc định của Arduino core.",
        "Nạp code qua USB-C dùng USB-Serial/JTAG tích hợp (GPIO18, GPIO19, không đưa ra header). Nếu không nhận cổng: giữ BOOT, nhấn RST rồi thả.",
        "Anten gốm nhỏ: tránh đặt kim loại hoặc dây dẫn sát đầu anten để WiFi ổn định."
    ]
})


# ---------------- ESP32-CAM (AI-Thinker) ----------------
save({
    "id": "esp32-cam", "name": "ESP32-CAM (AI-Thinker)", "mcu": "ESP32-S", "family": "ESP32", "style": "black", "logic": "3.3V",
    "orientation": "Nhìn từ mặt có vỏ kim loại module, anten ở phía trên, nút RST ở góc dưới bên trái. Camera và khe thẻ nhớ ở mặt còn lại",
    "shape": {"w": 27, "h": 40.5, "rowGap": 22.86, "start": 17.9, "r": 2.5, "parts": [
        {"type": "module", "x": 4.6, "y": 0.4, "w": 17.8, "h": 25.6},
        {"type": "antenna", "x": 6.2, "y": 1.0, "w": 14.6, "h": 4.4},
        {"type": "shield", "x": 5.1, "y": 6.6, "w": 16.8, "h": 18.8, "label": "Ai-Thinker\nESP32-CAM", "fs": 10},
        {"type": "smd", "x": 5.2, "y": 27.2, "w": 3.2, "h": 2.6, "fill": "#c98a2b"},
        {"type": "led", "x": 9.8, "y": 27.6, "w": 1.8, "h": 1, "color": "#e53935"},
        {"type": "reg", "x": 9.2, "y": 31, "w": 6, "h": 7, "label": "LDO"},
        {"type": "chip", "x": 17, "y": 30.4, "w": 4.6, "h": 5.2, "pins": 4, "label": "PSRAM", "fs": 6},
        {"type": "button", "x": 4.6, "y": 35.2, "w": 3.4, "h": 3.4, "label": "RST"}]},
    "left": [
        P("IO4", "GPIO4", ["other:Đèn flash", "other:HS2_DATA1 (thẻ nhớ)", "adc:ADC2_CH0", "touch:TOUCH0"], note="Nối đèn flash LED trắng công suất lớn. Cũng là chân DATA1 của thẻ nhớ nên đèn có thể nháy khi đọc thẻ"),
        P("IO2", "GPIO2", ["other:HS2_DATA0 (thẻ nhớ)", "adc:ADC2_CH2", "touch:TOUCH2"], t=["warn"], note="Chân strapping và DATA0 của thẻ nhớ. Phải LOW hoặc để trống khi nạp code"),
        P("IO14", "GPIO14", ["other:HS2_CLK (thẻ nhớ)", "adc:ADC2_CH6", "touch:TOUCH6"], note="Dùng cho thẻ nhớ microSD. Rảnh nếu không dùng thẻ"),
        P("IO15", "GPIO15", ["other:HS2_CMD (thẻ nhớ)", "adc:ADC2_CH3", "touch:TOUCH3"], t=["warn"], note="Chân strapping và CMD của thẻ nhớ"),
        P("IO13", "GPIO13", ["other:HS2_DATA3 (thẻ nhớ)", "adc:ADC2_CH4", "touch:TOUCH4"], note="Dùng cho thẻ nhớ microSD. Rảnh nếu dùng thẻ ở chế độ 1-bit"),
        P("IO12", "GPIO12", ["other:HS2_DATA2 (thẻ nhớ)", "adc:ADC2_CH5", "touch:TOUCH5"], t=["warn"], note="Chân strapping: phải LOW khi khởi động. Rảnh nếu dùng thẻ ở chế độ 1-bit"),
        P("GND", k="gnd"),
        P("5V", k="power", note="Nguồn vào 5V, nên dùng nguồn từ 1A trở lên vì camera và WiFi ngốn dòng")],
    "right": [
        P("GND", k="gnd"),
        P("U0T", "GPIO1", ["uart:U0_TXD"], note="Nối RX của mạch nạp USB-Serial"),
        P("U0R", "GPIO3", ["uart:U0_RXD"], note="Nối TX của mạch nạp USB-Serial"),
        P("VCC", k="power", note="Ngõ ra 3.3V (hoặc 5V tùy jumper trên board), không phải chân cấp nguồn vào"),
        P("GND", k="gnd"),
        P("IO0", "GPIO0", ["other:BOOT", "other:CSI_MCLK (camera)"], t=["warn"], note="Nối GND rồi reset để vào chế độ nạp. Khi chạy chương trình để trống vì chân này cấp xung clock cho camera"),
        P("IO16", "GPIO16", ["uart:U2_RXD", "other:PSRAM CS"], t=["warn"], note="Nối chân CS của PSRAM trên nhiều bản ESP32-CAM, không nên dùng làm GPIO"),
        P("3V3", k="power", note="Nguồn 3.3V. Nên cấp 5V vào chân 5V thay vì cấp 3.3V vì board dễ thiếu dòng")],
    "notes": [
        "Board không có cổng USB: nạp code qua mạch USB-Serial (U0T, U0R, GND) hoặc đế ESP32-CAM-MB. Nối IO0 xuống GND rồi nhấn RST để vào chế độ nạp.",
        "Khi dùng thẻ nhớ ở chế độ 4-bit, các chân IO2, IO4, IO12, IO13, IO14, IO15 đều bị chiếm. Ở chế độ 1-bit, IO4, IO12, IO13 rảnh.",
        "LED đỏ trên board nối GPIO33 (sáng khi LOW), không đưa ra header.",
        "ADC2 không đọc được khi đang dùng WiFi, mà ESP32-CAM thường luôn bật WiFi để gửi ảnh."
    ]
})


# ---------------- Wemos D1 mini ----------------
save({
    "id": "wemos-d1-mini", "name": "Wemos D1 mini", "mcu": "ESP-12F (ESP8266)", "family": "ESP32", "style": "esp", "logic": "3.3V",
    "orientation": "Nhìn từ mặt trên, anten ở phía trên, cổng USB ở phía dưới",
    "shape": {"w": 25.6, "h": 34.2, "rowGap": 22.86, "start": 13.6, "r": 1.2, "parts": [
        {"type": "module", "x": 4.8, "y": 0, "w": 16, "h": 24, "fill": "#1c2733"},
        {"type": "antenna", "x": 5.6, "y": 0.8, "w": 14.4, "h": 5.4},
        {"type": "shield", "x": 5.6, "y": 8, "w": 14.4, "h": 15, "label": "ESP-12F"},
        {"type": "chip", "x": 14.5, "y": 25, "w": 4.6, "h": 3.6, "pins": 5, "label": "CH340", "fs": 6},
        {"type": "button", "x": 3.4, "y": 25.2, "w": 4, "h": 4, "label": "RST"},
        {"type": "usb", "x": 9.05, "y": 29.6, "w": 7.5, "h": 5.6}]},
    "left": [
        P("RST", k="sys", f=["other:RESET"], note="Kéo LOW để reset. Nối với D0 để thoát deep sleep"),
        P("A0", "ADC0", ["adc:ADC0 (TOUT)"], t=["in"], note="Đọc 0–3.3V nhờ cầu chia áp trên board. ADC 10-bit"),
        P("D0", "GPIO16", ["other:WAKE"], note="Nối RST để thoát deep sleep. Không có PWM, I2C và ngắt"),
        P("D5", "GPIO14", ["spi:HSPI_CLK"]),
        P("D6", "GPIO12", ["spi:HSPI_MISO"]),
        P("D7", "GPIO13", ["spi:HSPI_MOSI", "uart:RXD2 (Serial.swap)"]),
        P("D8", "GPIO15", ["spi:HSPI_CS", "uart:TXD2 (Serial.swap)"], t=["warn"], note="Phải LOW khi khởi động, có điện trở kéo xuống trên board"),
        P("3V3", k="power", note="Ngõ ra 3.3V, tối đa khoảng 500 mA")],
    "right": [
        P("TX", "GPIO1", ["uart:U0_TXD"], note="Nối chip CH340, xuất log khi khởi động"),
        P("RX", "GPIO3", ["uart:U0_RXD"], note="Nối chip CH340"),
        P("D1", "GPIO5", ["i2c:SCL"], note="SCL mặc định của thư viện Wire"),
        P("D2", "GPIO4", ["i2c:SDA"], note="SDA mặc định của thư viện Wire"),
        P("D3", "GPIO0", ["other:FLASH"], t=["warn"], note="Phải HIGH khi khởi động (LOW = vào chế độ nạp). Có điện trở kéo lên"),
        P("D4", "GPIO2", ["uart:U1_TXD", "other:LED onboard"], t=["warn"], note="Phải HIGH khi khởi động. Nối LED xanh trên module (sáng khi LOW)"),
        P("G", k="gnd"),
        P("5V", k="power", note="Nguồn 5V từ USB, hoặc cấp 5V vào")],
    "notes": [
        "Mức logic 3.3V, các chân không chịu được 5V.",
        "Cùng chip ESP8266 với NodeMCU nên chức năng chân giống nhau: D3, D4 phải HIGH và D8 phải LOW khi khởi động.",
        "PWM (analogWrite) là PWM phần mềm, dùng được trên D1–D8. Ngắt có trên mọi chân trừ D0.",
        "Muốn dùng deep sleep, nối D0 với RST để chip tự thức dậy."
    ]
})
print("esp ok")
