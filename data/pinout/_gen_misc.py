#!/usr/bin/env python3
"""Sinh dữ liệu pinout cho Arduino Mega 2560, Arduino Pro Mini, Raspberry Pi Pico, Raspberry Pi GPIO 40 chân.
Chạy lại khi sửa: python3 data/pinout/_gen_misc.py"""
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent


def P(l, name=None, f=None, k=None, n=None, t=None, note=None):
    d = {"l": l}
    if n is not None: d["n"] = n
    if name: d["name"] = name
    if k: d["k"] = k
    if f: d["f"] = list(f)
    if t: d["t"] = list(t)
    if note: d["note"] = note
    return d


def save(board):
    (OUT / (board["id"] + ".json")).write_text(json.dumps(board, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


GAP = {"gap": True}

# ---------------- Arduino Mega 2560 ----------------
MEGA_PORT = {0: "PE0", 1: "PE1", 2: "PE4", 3: "PE5", 4: "PG5", 5: "PE3", 6: "PH3", 7: "PH4", 8: "PH5", 9: "PH6", 10: "PB4", 11: "PB5",
             12: "PB6", 13: "PB7", 14: "PJ1", 15: "PJ0", 16: "PH1", 17: "PH0", 18: "PD3", 19: "PD2", 20: "PD1", 21: "PD0",
             22: "PA0", 23: "PA1", 24: "PA2", 25: "PA3", 26: "PA4", 27: "PA5", 28: "PA6", 29: "PA7", 30: "PC7", 31: "PC6",
             32: "PC5", 33: "PC4", 34: "PC3", 35: "PC2", 36: "PC1", 37: "PC0", 38: "PD7", 39: "PG2", 40: "PG1", 41: "PG0",
             42: "PL7", 43: "PL6", 44: "PL5", 45: "PL4", 46: "PL3", 47: "PL2", 48: "PL1", 49: "PL0", 50: "PB3", 51: "PB2",
             52: "PB1", 53: "PB0"}
MEGA_F = {0: ["uart:RX0"], 1: ["uart:TX0"], 2: ["pwm:PWM (OC3B)", "int:INT4"], 3: ["pwm:PWM (OC3C)", "int:INT5"], 4: ["pwm:PWM (OC0B)"],
          5: ["pwm:PWM (OC3A)"], 6: ["pwm:PWM (OC4A)"], 7: ["pwm:PWM (OC4B)"], 8: ["pwm:PWM (OC4C)"], 9: ["pwm:PWM (OC2B)"],
          10: ["pwm:PWM (OC2A)", "int:PCINT4"], 11: ["pwm:PWM (OC1A)", "int:PCINT5"], 12: ["pwm:PWM (OC1B)", "int:PCINT6"],
          13: ["pwm:PWM (OC0A)", "other:LED_BUILTIN", "int:PCINT7"], 14: ["uart:TX3", "int:PCINT10"], 15: ["uart:RX3", "int:PCINT9"],
          16: ["uart:TX2"], 17: ["uart:RX2"], 18: ["uart:TX1", "int:INT3"], 19: ["uart:RX1", "int:INT2"], 20: ["i2c:SDA", "int:INT1"],
          21: ["i2c:SCL", "int:INT0"], 44: ["pwm:PWM (OC5C)"], 45: ["pwm:PWM (OC5B)"], 46: ["pwm:PWM (OC5A)"],
          50: ["spi:MISO", "int:PCINT3"], 51: ["spi:MOSI", "int:PCINT2"], 52: ["spi:SCK", "int:PCINT1"], 53: ["spi:SS", "int:PCINT0"]}
MEGA_NOTE = {0: "Nối chip USB-Serial (16U2). Tránh dùng khi đang nạp code hoặc mở Serial Monitor",
             1: "Nối chip USB-Serial (16U2). Tránh dùng khi đang nạp code hoặc mở Serial Monitor",
             13: "Nối LED L trên board", 20: "Có điện trở kéo lên 10 kΩ trên board", 21: "Có điện trở kéo lên 10 kΩ trên board",
             53: "Phải để OUTPUT khi Mega làm SPI master, kể cả khi không dùng làm chân SS"}


def D(n):
    return P(f"D{n}", MEGA_PORT[n], MEGA_F.get(n, []), note=MEGA_NOTE.get(n))


def A(n):
    port = f"PF{n}" if n < 8 else f"PK{n - 8}"
    f = [f"adc:ADC{n}"] + ([f"int:PCINT{16 + n - 8}"] if n >= 8 else [])
    return P(f"A{n}", port, f)


inner = [P("5V", k="power")] + [D(n) for n in range(22, 53, 2)] + [P("GND", k="gnd")]
outer = [P("5V", k="power")] + [D(n) for n in range(23, 54, 2)] + [P("GND", k="gnd")]
save({
    "id": "arduino-mega-2560", "name": "Arduino Mega 2560", "mcu": "ATmega2560", "family": "Arduino", "style": "arduino", "logic": "5V",
    "orientation": "Nhìn từ mặt trên, cổng USB và jack nguồn ở phía trên, header đôi D22–D53 ở cạnh dưới",
    "shape": {"w": 53.34, "h": 101.6, "rowGap": 0, "r": 1, "numbers": False, "parts": [
        {"type": "hole", "x": 2.5, "y": 14, "r": 1.6}, {"type": "hole", "x": 50.7, "y": 15.3, "r": 1.6},
        {"type": "hole", "x": 7.6, "y": 66.1, "r": 1.6}, {"type": "hole", "x": 35.5, "y": 66.1, "r": 1.6},
        {"type": "hole", "x": 50.7, "y": 90.2, "r": 1.6},
        {"type": "jack", "x": 3.3, "y": -1.8, "w": 9, "h": 13.7},
        {"type": "usbb", "x": 34.5, "y": -6.3, "w": 12, "h": 16},
        {"type": "cap", "x": 17.5, "y": 6.5, "r": 3}, {"type": "cap", "x": 25, "y": 6.5, "r": 3},
        {"type": "reg", "x": 5, "y": 15.5, "w": 6.5, "h": 7, "label": "REG"},
        {"type": "button", "x": 44.3, "y": 11, "w": 5.5, "h": 5.5, "label": "RESET"},
        {"type": "chip", "x": 29, "y": 13.5, "w": 5, "h": 5, "pins": 8, "label": "16U2", "fs": 7},
        {"type": "led", "x": 41.5, "y": 23, "w": 1.8, "h": 1, "color": "#ffb300"},
        {"type": "led", "x": 41.5, "y": 25.5, "w": 1.8, "h": 1, "color": "#ffb300"},
        {"type": "led", "x": 41.5, "y": 28, "w": 1.8, "h": 1, "color": "#ffb300"},
        {"type": "led", "x": 41.5, "y": 33, "w": 1.8, "h": 1, "color": "#3ddc84"},
        {"type": "text", "x": 38.7, "y": 24, "fs": 6.5, "label": "L"}, {"type": "text", "x": 38.7, "y": 26.5, "fs": 6.5, "label": "TX"},
        {"type": "text", "x": 38.7, "y": 29, "fs": 6.5, "label": "RX"}, {"type": "text", "x": 38.7, "y": 34, "fs": 6.5, "label": "ON"},
        {"type": "text", "x": 27, "y": 37, "fs": 16, "label": "MEGA 2560", "weight": 800},
        {"type": "chip", "x": 19.5, "y": 45, "w": 14, "h": 14, "pins": 14, "rot": 45, "label": "ATMEGA\n2560", "fs": 9},
        {"type": "header", "x": 39.4, "y": 62, "cols": 2, "rows": 3},
        {"type": "text", "x": 40.7, "y": 60.3, "fs": 6.5, "label": "ICSP"}]},
    "groups": [
        {"x": 2.54, "y": 27.94, "dir": "down", "labels": "left", "pins":
            [P("NC", k="nc"), P("IOREF", k="power", note="Báo mức logic của board (5V) cho shield"),
             P("RESET", k="sys", f=["other:RESET"], note="Kéo LOW để reset"), P("3.3V", k="power", note="Ngõ ra 3.3V, tối đa 50 mA"),
             P("5V", k="power"), P("GND", k="gnd"), P("GND", k="gnd"), P("VIN", k="power", note="Nguồn vào 7–12V, nối chung với jack DC"), GAP]
            + [A(n) for n in range(8)] + [GAP] + [A(n) for n in range(8, 16)]},
        {"x": 50.8, "y": 18.8, "dir": "down", "labels": "right", "pins":
            [P("SCL", "PD0", ["i2c:SCL"], note="Nối chung với D21"), P("SDA", "PD1", ["i2c:SDA"], note="Nối chung với D20"),
             P("AREF", k="sys", f=["adc:AREF"], note="Điện áp tham chiếu ngoài cho ADC"), P("GND", k="gnd")]
            + [D(n) for n in range(13, 7, -1)] + [{"gap": 1.524}] + [D(n) for n in range(7, -1, -1)] + [GAP] + [D(n) for n in range(14, 22)]},
        {"x": 47.0, "y": 96.52, "dir": "left", "labels": "top", "align": "pad", "pins": inner},
        {"x": 47.0, "y": 99.06, "dir": "left", "labels": "bottom", "pins": outer}],
    "notes": [
        "Mức logic 5V. Dòng mỗi chân nên giữ dưới 20 mA.",
        "PWM (analogWrite) có ở D2–D13 và D44–D46. Ngắt ngoài attachInterrupt() ở D2, D3, D18, D19, D20, D21.",
        "4 cổng UART phần cứng: Serial (D0, D1), Serial1 (D18, D19), Serial2 (D16, D17), Serial3 (D14, D15).",
        "SPI ở D50–D53 và header ICSP, không phải D10–D13 như Uno. I2C ở D20, D21 (cũng đưa ra chân SDA, SCL).",
        "ADC 10-bit, 16 kênh A0–A15."
    ]
})

# ---------------- Arduino Pro Mini ----------------
UNO_F = {0: ["uart:RX", "int:PCINT16"], 1: ["uart:TX", "int:PCINT17"], 2: ["int:INT0", "int:PCINT18"], 3: ["pwm:PWM (OC2B)", "int:INT1"],
         4: ["pwm:T0", "int:PCINT20"], 5: ["pwm:PWM (OC0B)", "pwm:T1"], 6: ["pwm:PWM (OC0A)", "other:AIN0"], 7: ["other:AIN1", "int:PCINT23"],
         8: ["pwm:ICP1", "int:PCINT0"], 9: ["pwm:PWM (OC1A)", "int:PCINT1"], 10: ["pwm:PWM (OC1B)", "spi:SS"],
         11: ["pwm:PWM (OC2A)", "spi:MOSI"], 12: ["spi:MISO", "int:PCINT4"], 13: ["spi:SCK", "other:LED_BUILTIN"]}
UNO_PORT = {0: "PD0", 1: "PD1", 2: "PD2", 3: "PD3", 4: "PD4", 5: "PD5", 6: "PD6", 7: "PD7", 8: "PB0", 9: "PB1", 10: "PB2", 11: "PB3",
            12: "PB4", 13: "PB5"}


def PD(n, label=None, note=None):
    return P(label or str(n), UNO_PORT[n], UNO_F[n], note=note)


def PA(n, extra=None):
    return P(f"A{n}", f"PC{n}", [f"adc:ADC{n}"] + (extra or []))


save({
    "id": "arduino-pro-mini", "name": "Arduino Pro Mini", "mcu": "ATmega328P", "family": "Arduino", "style": "stm32", "logic": "5V hoặc 3.3V",
    "orientation": "Nhìn từ mặt trên, header FTDI (6 chân) ở phía trên. Các lỗ A4, A5, A6, A7 nằm bên trong board, vị trí khác nhau tùy bản nên chỉ ghi trong bảng",
    "shape": {"w": 18, "h": 33, "rowGap": 15.24, "start": 3.81, "r": 0.6, "parts": [
        {"type": "header", "x": 2.65, "y": 1.27, "cols": 6, "rows": 1},
        {"type": "text", "x": 9, "y": 3.6, "fs": 6, "label": "FTDI"},
        {"type": "chip", "x": 5.5, "y": 10.5, "w": 7, "h": 7, "pins": 8, "rot": 45, "label": "ATMEGA\n328P", "fs": 7},
        {"type": "crystal", "x": 6.5, "y": 21, "w": 5, "h": 2, "label": ""},
        {"type": "button", "x": 6.5, "y": 25.5, "w": 5, "h": 3.4, "label": "RESET"},
        {"type": "led", "x": 5.2, "y": 7, "w": 1.6, "h": 0.9, "color": "#e53935"},
        {"type": "led", "x": 11.2, "y": 7, "w": 1.6, "h": 0.9, "color": "#3ddc84"}]},
    "groups": [
        {"x": 1.38, "y": 3.81, "dir": "down", "labels": "left", "pins":
            [PD(1, "TXO", "D1, nối TX của mạch nạp FTDI"), PD(0, "RXI", "D0, nối RX của mạch nạp FTDI"),
             P("RST", k="sys", f=["other:RESET"]), P("GND", k="gnd")] + [PD(n) for n in range(2, 10)]},
        {"x": 16.62, "y": 3.81, "dir": "down", "labels": "right", "pins":
            [P("RAW", k="power", note="Nguồn vào chưa ổn áp: tối đa 12V (bản 5V) hoặc 6V (bản 3.3V)"), P("GND", k="gnd"),
             P("RST", k="sys", f=["other:RESET"]), P("VCC", k="power", note="Nguồn đã ổn áp 5V hoặc 3.3V tùy bản")]
            + [PA(3), PA(2), PA(1), PA(0)] + [PD(n) for n in (13, 12, 11, 10)]},
        {"hidden": True, "x": 0, "y": 0, "dir": "down", "labels": "left", "pins":
            [PA(4, ["i2c:SDA"]), PA(5, ["i2c:SCL"]),
             P("A6", "ADC6", ["adc:ADC6"], t=["in"], note="Chỉ đọc analog"), P("A7", "ADC7", ["adc:ADC7"], t=["in"], note="Chỉ đọc analog"),
             P("DTR", k="sys", f=["other:Reset tự động khi nạp"], note="Chân GRN/DTR trên header FTDI, nối qua tụ tới RESET")]}],
    "notes": [
        "Có hai bản: 5V / 16 MHz và 3.3V / 8 MHz. Chọn đúng board trong Arduino IDE, nếu không code chạy sai tốc độ.",
        "Không có cổng USB: nạp code qua mạch USB-Serial (FTDI, CP2102, CH340) cắm vào header 6 chân. Thứ tự in trên board, thường là GND, GND, VCC, RXI, TXO, DTR (hoặc BLK … GRN).",
        "A4 (SDA), A5 (SCL), A6, A7 là các lỗ bên trong board, cần hàn thêm header nếu dùng.",
        "PWM ở D3, D5, D6, D9, D10, D11. Ngắt ngoài ở D2, D3."
    ]
})

# ---------------- Raspberry Pi Pico ----------------
def pico_f(n):
    f = []
    uart = {0: "UART0_TX", 1: "UART0_RX", 12: "UART0_TX", 13: "UART0_RX", 16: "UART0_TX", 17: "UART0_RX",
            4: "UART1_TX", 5: "UART1_RX", 8: "UART1_TX", 9: "UART1_RX"}
    if n in uart: f.append("uart:" + uart[n])
    if n <= 21 or n in (26, 27):
        f.append(f"i2c:I2C{(n >> 1) & 1}_{'SDA' if n % 2 == 0 else 'SCL'}")
    if n <= 19:
        bus = 0 if (n < 8 or n >= 16) else 1
        f.append(f"spi:SPI{bus}_{['RX', 'CSn', 'SCK', 'TX'][n % 4]}")
    if n in (26, 27, 28): f.insert(0, f"adc:ADC{n - 26}")
    f.append(f"pwm:PWM{(n >> 1) & 7}{'AB'[n & 1]}")
    return f


def GP(n, num):
    return P(f"GP{n}", f"GPIO{n}", pico_f(n), n=num)


left = []
right = []
L_SEQ = [0, 1, "GND", 2, 3, 4, 5, "GND", 6, 7, 8, 9, "GND", 10, 11, 12, 13, "GND", 14, 15]
for i, v in enumerate(L_SEQ):
    left.append(P("GND", k="gnd", n=i + 1) if v == "GND" else GP(v, i + 1))
R_SEQ = [("VBUS", "power", "5V từ cổng micro USB"), ("VSYS", "power", "Nguồn chính của board, nhận 1.8–5.5V"), ("GND", "gnd", None),
         ("3V3_EN", "sys", "Kéo LOW để tắt nguồn 3.3V"), ("3V3", "power", "Ngõ ra 3.3V, nên dùng dưới 300 mA"),
         ("ADC_VREF", "sys", "Điện áp tham chiếu ADC"), 28, ("AGND", "gnd", "GND riêng cho ADC"), 27, 26,
         ("RUN", "sys", "Kéo LOW để reset RP2040"), 22, ("GND", "gnd", None), 21, 20, 19, 18, ("GND", "gnd", None), 17, 16]
for i, v in enumerate(R_SEQ):
    num = 40 - i
    if isinstance(v, int):
        right.append(GP(v, num))
    else:
        right.append(P(v[0], k=v[1], n=num, note=v[2], f=(["other:RESET"] if v[0] == "RUN" else None)))
save({
    "id": "rpi-pico", "name": "Raspberry Pi Pico / Pico W", "mcu": "RP2040", "family": "Raspberry Pi", "style": "pico", "logic": "3.3V",
    "orientation": "Nhìn từ mặt trên, cổng micro USB ở phía trên. Chân 1 ở góc trên bên trái, đánh số ngược chiều kim đồng hồ",
    "shape": {"w": 21, "h": 51, "rowGap": 17.78, "start": 1.37, "r": 0.8, "parts": [
        {"type": "usb", "x": 6.75, "y": -1.3, "w": 7.5, "h": 5.6},
        {"type": "led", "x": 13.6, "y": 6.2, "w": 1.8, "h": 1, "color": "#3ddc84"},
        {"type": "button", "x": 5.2, "y": 7.5, "w": 4.6, "h": 4.6, "label": "BOOTSEL"},
        {"type": "chip", "x": 12, "y": 13.5, "w": 4.6, "h": 4, "pins": 4, "label": "FLASH", "fs": 6},
        {"type": "chip", "x": 7, "y": 22, "w": 7, "h": 7, "pins": 10, "label": "RP2040", "fs": 8},
        {"type": "crystal", "x": 8, "y": 33, "w": 5, "h": 2.2, "label": "12M"},
        {"type": "header", "x": 7.96, "y": 49.6, "cols": 3, "rows": 1},
        {"type": "text", "x": 10.5, "y": 47.6, "fs": 6, "label": "SWCLK GND SWDIO"}]},
    "left": left, "right": right,
    "notes": [
        "Mức logic 3.3V, các chân không chịu được 5V.",
        "Mỗi GPIO có nhiều lựa chọn UART, I2C, SPI; bảng trên liệt kê đủ các lựa chọn. Mọi GPIO đều xuất PWM (8 slice, mỗi slice 2 kênh A/B).",
        "ADC 12-bit ở GP26, GP27, GP28 (ADC0–ADC2). ADC3 đo VSYS/3 bên trong board.",
        "LED trên board: GP25 (Pico) hoặc chân WL_GPIO0 của chip WiFi (Pico W, dùng LED_BUILTIN). Giữ BOOTSEL khi cắm USB để nạp file .uf2."
    ]
})

# ---------------- Raspberry Pi GPIO 40 chân ----------------
PI = {1: ("3V3", "power", None, None), 2: ("5V", "power", None, None), 3: ("GPIO2", None, ["i2c:SDA1"], "Có điện trở kéo lên 1.8 kΩ trên board"),
      4: ("5V", "power", None, None), 5: ("GPIO3", None, ["i2c:SCL1"], "Có điện trở kéo lên 1.8 kΩ trên board"), 6: ("GND", "gnd", None, None),
      7: ("GPIO4", None, ["other:GPCLK0", "other:1-Wire (mặc định)"], None), 8: ("GPIO14", None, ["uart:TXD0"], "UART chính, bật trong raspi-config"),
      9: ("GND", "gnd", None, None), 10: ("GPIO15", None, ["uart:RXD0"], "UART chính, bật trong raspi-config"),
      11: ("GPIO17", None, ["spi:SPI1_CE1"], None), 12: ("GPIO18", None, ["pwm:PWM0", "other:PCM_CLK", "spi:SPI1_CE0"], None),
      13: ("GPIO27", None, [], None), 14: ("GND", "gnd", None, None), 15: ("GPIO22", None, [], None), 16: ("GPIO23", None, [], None),
      17: ("3V3", "power", None, None), 18: ("GPIO24", None, [], None), 19: ("GPIO10", None, ["spi:SPI0_MOSI"], None),
      20: ("GND", "gnd", None, None), 21: ("GPIO9", None, ["spi:SPI0_MISO"], None), 22: ("GPIO25", None, [], None),
      23: ("GPIO11", None, ["spi:SPI0_SCLK"], None), 24: ("GPIO8", None, ["spi:SPI0_CE0"], None), 25: ("GND", "gnd", None, None),
      26: ("GPIO7", None, ["spi:SPI0_CE1"], None),
      27: ("GPIO0", None, ["i2c:ID_SD (EEPROM HAT)"], "Dành cho EEPROM nhận dạng HAT, không nên dùng"),
      28: ("GPIO1", None, ["i2c:ID_SC (EEPROM HAT)"], "Dành cho EEPROM nhận dạng HAT, không nên dùng"),
      29: ("GPIO5", None, ["other:GPCLK1"], None), 30: ("GND", "gnd", None, None), 31: ("GPIO6", None, ["other:GPCLK2"], None),
      32: ("GPIO12", None, ["pwm:PWM0"], None), 33: ("GPIO13", None, ["pwm:PWM1"], None), 34: ("GND", "gnd", None, None),
      35: ("GPIO19", None, ["pwm:PWM1", "spi:SPI1_MISO", "other:PCM_FS"], None), 36: ("GPIO16", None, ["spi:SPI1_CE2"], None),
      37: ("GPIO26", None, [], None), 38: ("GPIO20", None, ["spi:SPI1_MOSI", "other:PCM_DIN"], None), 39: ("GND", "gnd", None, None),
      40: ("GPIO21", None, ["spi:SPI1_SCLK", "other:PCM_DOUT"], None)}


def pi(num):
    l, k, f, note = PI[num]
    t = ["warn"] if num in (27, 28) else None
    if k: return P(l, k=k, n=num, note=note)
    return P(l, "BCM " + l[4:], f, n=num, t=t, note=note)


save({
    "id": "rpi-gpio-40", "name": "Raspberry Pi GPIO 40 chân", "mcu": "BCM2711 / BCM2712 (Pi 4, Pi 5)", "family": "Raspberry Pi", "style": "header",
    "logic": "3.3V",
    "orientation": "Nhìn từ mặt trên, header ở mép board, chân 1 (3V3, đế vuông) ở góc trên bên trái. Cột trái là chân lẻ, cột phải là chân chẵn. Áp dụng cho Pi 2, 3, 4, 5, Zero",
    "shape": {"w": 5.08, "h": 50.8, "rowGap": 2.54, "start": 1.27, "r": 0.3, "numbers": False, "parts": [
        {"type": "smd", "x": 0.3, "y": 0.3, "w": 1.94, "h": 1.94, "fill": "#d4a017"}]},
    "left": [pi(n) for n in range(1, 40, 2)],
    "right": [pi(n) for n in range(2, 41, 2)],
    "notes": [
        "Mức logic 3.3V, các chân KHÔNG chịu được 5V. Cấp 5V vào GPIO có thể làm hỏng Raspberry Pi.",
        "Tên GPIO trong bảng là số BCM (dùng trong gpiozero, RPi.GPIO chế độ BCM, libgpiod). Số chân vật lý ghi ở cột \"Số\".",
        "Raspberry Pi không có ADC: muốn đọc analog cần thêm chip như ADS1115 hoặc MCP3008.",
        "Bật I2C, SPI, UART trong raspi-config. Pi 4 và Pi 5 có thêm UART, I2C, SPI phụ qua dtoverlay."
    ]
})
print("misc ok")
