#!/usr/bin/env python3
"""Sinh dữ liệu pinout cho Black Pill F411, STM32F4DISCOVERY, Nucleo-F103RB, Nucleo-F401RE, STM8S103F3.
Chạy lại khi sửa: python3 data/pinout/_gen_stm.py"""
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


# ---------- Chức năng chân STM32F401 / F411 (gói 48 và 64 chân) ----------
F4X1 = {
    "PA0": ["adc:ADC1_IN0", "pwm:TIM2_CH1", "pwm:TIM5_CH1", "uart:USART2_CTS", "other:WKUP"],
    "PA1": ["adc:ADC1_IN1", "pwm:TIM2_CH2", "pwm:TIM5_CH2", "uart:USART2_RTS"],
    "PA2": ["uart:USART2_TX", "adc:ADC1_IN2", "pwm:TIM2_CH3", "pwm:TIM5_CH3", "pwm:TIM9_CH1"],
    "PA3": ["uart:USART2_RX", "adc:ADC1_IN3", "pwm:TIM2_CH4", "pwm:TIM5_CH4", "pwm:TIM9_CH2"],
    "PA4": ["spi:SPI1_NSS", "adc:ADC1_IN4", "spi:SPI3_NSS"],
    "PA5": ["spi:SPI1_SCK", "adc:ADC1_IN5", "pwm:TIM2_CH1"],
    "PA6": ["spi:SPI1_MISO", "adc:ADC1_IN6", "pwm:TIM3_CH1", "pwm:TIM1_BKIN"],
    "PA7": ["spi:SPI1_MOSI", "adc:ADC1_IN7", "pwm:TIM3_CH2", "pwm:TIM1_CH1N"],
    "PA8": ["pwm:TIM1_CH1", "i2c:I2C3_SCL", "other:MCO1", "uart:USART1_CK"],
    "PA9": ["uart:USART1_TX", "pwm:TIM1_CH2", "usb:OTG_FS_VBUS"],
    "PA10": ["uart:USART1_RX", "pwm:TIM1_CH3", "usb:OTG_FS_ID"],
    "PA11": ["usb:USB_DM", "pwm:TIM1_CH4", "uart:USART6_TX", "uart:USART1_CTS"],
    "PA12": ["usb:USB_DP", "pwm:TIM1_ETR", "uart:USART6_RX", "uart:USART1_RTS"],
    "PA13": ["other:SWDIO"], "PA14": ["other:SWCLK"],
    "PA15": ["other:JTDI", "pwm:TIM2_CH1", "spi:SPI1_NSS", "spi:SPI3_NSS"],
    "PB0": ["adc:ADC1_IN8", "pwm:TIM3_CH3", "pwm:TIM1_CH2N"],
    "PB1": ["adc:ADC1_IN9", "pwm:TIM3_CH4", "pwm:TIM1_CH3N"],
    "PB2": ["other:BOOT1"],
    "PB3": ["other:JTDO / SWO", "pwm:TIM2_CH2", "spi:SPI1_SCK", "spi:SPI3_SCK"],
    "PB4": ["other:NJTRST", "pwm:TIM3_CH1", "spi:SPI1_MISO", "spi:SPI3_MISO"],
    "PB5": ["pwm:TIM3_CH2", "spi:SPI1_MOSI", "spi:SPI3_MOSI", "i2c:I2C1_SMBA"],
    "PB6": ["i2c:I2C1_SCL", "uart:USART1_TX", "pwm:TIM4_CH1"],
    "PB7": ["i2c:I2C1_SDA", "uart:USART1_RX", "pwm:TIM4_CH2"],
    "PB8": ["i2c:I2C1_SCL", "pwm:TIM4_CH3", "pwm:TIM10_CH1"],
    "PB9": ["i2c:I2C1_SDA", "pwm:TIM4_CH4", "pwm:TIM11_CH1", "spi:SPI2_NSS"],
    "PB10": ["i2c:I2C2_SCL", "spi:SPI2_SCK", "pwm:TIM2_CH3"],
    "PB12": ["spi:SPI2_NSS", "pwm:TIM1_BKIN"],
    "PB13": ["spi:SPI2_SCK", "pwm:TIM1_CH1N"],
    "PB14": ["spi:SPI2_MISO", "pwm:TIM1_CH2N"],
    "PB15": ["spi:SPI2_MOSI", "pwm:TIM1_CH3N"],
    "PC0": ["adc:ADC1_IN10"], "PC1": ["adc:ADC1_IN11"], "PC2": ["adc:ADC1_IN12", "spi:SPI2_MISO"], "PC3": ["adc:ADC1_IN13", "spi:SPI2_MOSI"],
    "PC4": ["adc:ADC1_IN14"], "PC5": ["adc:ADC1_IN15"],
    "PC6": ["uart:USART6_TX", "pwm:TIM3_CH1"], "PC7": ["uart:USART6_RX", "pwm:TIM3_CH2"],
    "PC8": ["pwm:TIM3_CH3", "other:SDIO_D0"], "PC9": ["pwm:TIM3_CH4", "i2c:I2C3_SDA", "other:MCO2"],
    "PC10": ["spi:SPI3_SCK", "other:SDIO_D2"], "PC11": ["spi:SPI3_MISO", "other:SDIO_D3"], "PC12": ["spi:SPI3_MOSI", "other:SDIO_CK"],
    "PC13": ["other:TAMPER / RTC"], "PC14": ["other:OSC32_IN"], "PC15": ["other:OSC32_OUT"],
    "PD2": ["pwm:TIM3_ETR", "other:SDIO_CMD"], "PH0": ["other:OSC_IN"], "PH1": ["other:OSC_OUT"],
}

# ---------- Chức năng chân STM32F103 (medium density, không có TIM8) ----------
F103 = {
    "PA0": ["adc:ADC12_IN0", "pwm:TIM2_CH1", "uart:USART2_CTS", "other:WKUP"],
    "PA1": ["adc:ADC12_IN1", "pwm:TIM2_CH2", "uart:USART2_RTS"],
    "PA2": ["uart:USART2_TX", "adc:ADC12_IN2", "pwm:TIM2_CH3"],
    "PA3": ["uart:USART2_RX", "adc:ADC12_IN3", "pwm:TIM2_CH4"],
    "PA4": ["spi:SPI1_NSS", "adc:ADC12_IN4", "uart:USART2_CK"],
    "PA5": ["spi:SPI1_SCK", "adc:ADC12_IN5"],
    "PA6": ["spi:SPI1_MISO", "adc:ADC12_IN6", "pwm:TIM3_CH1"],
    "PA7": ["spi:SPI1_MOSI", "adc:ADC12_IN7", "pwm:TIM3_CH2"],
    "PA8": ["pwm:TIM1_CH1", "other:MCO", "uart:USART1_CK"],
    "PA9": ["uart:USART1_TX", "pwm:TIM1_CH2"], "PA10": ["uart:USART1_RX", "pwm:TIM1_CH3"],
    "PA11": ["usb:USB_DM", "usb:CAN_RX", "pwm:TIM1_CH4"], "PA12": ["usb:USB_DP", "usb:CAN_TX", "pwm:TIM1_ETR"],
    "PA13": ["other:SWDIO"], "PA14": ["other:SWCLK"],
    "PA15": ["other:JTDI", "pwm:TIM2_CH1 (remap)", "spi:SPI1_NSS (remap)"],
    "PB0": ["adc:ADC12_IN8", "pwm:TIM3_CH3"], "PB1": ["adc:ADC12_IN9", "pwm:TIM3_CH4"], "PB2": ["other:BOOT1"],
    "PB3": ["other:JTDO / SWO", "pwm:TIM2_CH2 (remap)", "spi:SPI1_SCK (remap)"],
    "PB4": ["other:NJTRST", "pwm:TIM3_CH1 (remap)", "spi:SPI1_MISO (remap)"],
    "PB5": ["i2c:I2C1_SMBA", "pwm:TIM3_CH2 (remap)", "spi:SPI1_MOSI (remap)"],
    "PB6": ["i2c:I2C1_SCL", "pwm:TIM4_CH1", "uart:USART1_TX (remap)"],
    "PB7": ["i2c:I2C1_SDA", "pwm:TIM4_CH2", "uart:USART1_RX (remap)"],
    "PB8": ["pwm:TIM4_CH3", "i2c:I2C1_SCL (remap)", "usb:CAN_RX (remap)"],
    "PB9": ["pwm:TIM4_CH4", "i2c:I2C1_SDA (remap)", "usb:CAN_TX (remap)"],
    "PB10": ["i2c:I2C2_SCL", "uart:USART3_TX"], "PB11": ["i2c:I2C2_SDA", "uart:USART3_RX"],
    "PB12": ["spi:SPI2_NSS", "pwm:TIM1_BKIN"], "PB13": ["spi:SPI2_SCK", "pwm:TIM1_CH1N"],
    "PB14": ["spi:SPI2_MISO", "pwm:TIM1_CH2N"], "PB15": ["spi:SPI2_MOSI", "pwm:TIM1_CH3N"],
    "PC0": ["adc:ADC12_IN10"], "PC1": ["adc:ADC12_IN11"], "PC2": ["adc:ADC12_IN12"], "PC3": ["adc:ADC12_IN13"],
    "PC4": ["adc:ADC12_IN14"], "PC5": ["adc:ADC12_IN15"],
    "PC6": ["pwm:TIM3_CH1 (remap)"], "PC7": ["pwm:TIM3_CH2 (remap)"], "PC8": ["pwm:TIM3_CH3 (remap)"], "PC9": ["pwm:TIM3_CH4 (remap)"],
    "PC10": ["uart:USART3_TX (remap)"], "PC11": ["uart:USART3_RX (remap)"], "PC12": ["uart:USART3_CK (remap)"],
    "PC13": ["other:TAMPER / RTC"], "PC14": ["other:OSC32_IN"], "PC15": ["other:OSC32_OUT"],
    "PD0": ["other:OSC_IN"], "PD1": ["other:OSC_OUT"], "PD2": ["pwm:TIM3_ETR"],
}


def short(pin):
    """PA9 -> A9 (nhãn in trên Blue Pill / Black Pill)"""
    return pin[1:] if pin.startswith("P") else pin


# ---------------- Black Pill F411CE ----------------
def bp(pin, note=None, t=None):
    return P(short(pin), pin, F4X1.get(pin, []), t=t, note=note)


bp_notes = {"PA11": "Nối USB D−. Không dùng làm GPIO nếu cắm USB", "PA12": "Nối USB D+. Không dùng làm GPIO nếu cắm USB",
            "PA0": "Nối nút KEY trên board (nhấn = LOW)", "PB2": "Chân BOOT1, có điện trở kéo xuống trên board",
            "PB3": "Mặc định là chân JTAG. Chọn Debug: Serial Wire trong CubeMX để dùng làm GPIO",
            "PB4": "Mặc định là chân JTAG. Chọn Debug: Serial Wire trong CubeMX để dùng làm GPIO",
            "PA15": "Mặc định là chân JTAG. Chọn Debug: Serial Wire trong CubeMX để dùng làm GPIO",
            "PC13": "Nối LED xanh trên board (sáng khi LOW). Dòng ra yếu, tối đa khoảng 3 mA",
            "PC14": "Nối thạch anh 32.768 kHz trên board", "PC15": "Nối thạch anh 32.768 kHz trên board"}
bp_warn = {"PA11", "PA12"}


def bpp(pin):
    return bp(pin, bp_notes.get(pin), ["warn"] if pin in bp_warn else None)


save({
    "id": "stm32-black-pill", "name": "STM32F411CE Black Pill", "mcu": "STM32F411CEU6", "family": "STM32", "style": "black", "logic": "3.3V",
    "orientation": "Nhìn từ mặt trên, cổng USB-C ở phía dưới, header SWD ở phía trên (bản WeAct V2/V3). Bản F401CC có cùng sơ đồ chân",
    "shape": {"w": 20.8, "h": 52.8, "rowGap": 15.24, "start": 2.27, "r": 0.8, "parts": [
        {"type": "header", "x": 6.59, "y": 1.1, "cols": 4, "rows": 1},
        {"type": "text", "x": 10.4, "y": 3.3, "fs": 6.5, "label": "3V3 IO CLK GND"},
        {"type": "chip", "x": 6.9, "y": 14.5, "w": 7, "h": 7, "pins": 12, "label": "STM32\nF411CEU6", "fs": 7},
        {"type": "crystal", "x": 7.9, "y": 28.5, "w": 5, "h": 2.2, "label": "25M"},
        {"type": "button", "x": 4.6, "y": 36, "w": 3.4, "h": 3.4, "label": "BOOT0"},
        {"type": "button", "x": 8.7, "y": 36, "w": 3.4, "h": 3.4, "label": "KEY"},
        {"type": "button", "x": 12.8, "y": 36, "w": 3.4, "h": 3.4, "label": "NRST"},
        {"type": "led", "x": 6, "y": 44.2, "w": 1.8, "h": 1, "color": "#2f7bff"},
        {"type": "led", "x": 13, "y": 44.2, "w": 1.8, "h": 1, "color": "#e53935"},
        {"type": "text", "x": 6.9, "y": 46.8, "fs": 6.5, "label": "C13"},
        {"type": "usb", "x": 6.4, "y": 48.2, "w": 8, "h": 5.8}]},
    "left": [P("VB", "VBAT", k="power", note="Nguồn pin dự phòng cho RTC"), bpp("PC13"), bpp("PC14"), bpp("PC15"),
             P("R", "NRST", k="sys", f=["other:RESET"], note="Kéo LOW để reset")]
            + [bpp(p) for p in ("PA0", "PA1", "PA2", "PA3", "PA4", "PA5", "PA6", "PA7", "PB0", "PB1", "PB2", "PB10")]
            + [P("3.3", k="power"), P("G", k="gnd"), P("5V", k="power", note="Nối thẳng 5V của cổng USB-C")],
    "right": [P("3.3", k="power"), P("G", k="gnd"), P("5V", k="power", note="Nối thẳng 5V của cổng USB-C")]
             + [bpp(p) for p in ("PB9", "PB8", "PB7", "PB6", "PB5", "PB4", "PB3", "PA15", "PA12", "PA11", "PA10", "PA9", "PA8", "PB15", "PB14", "PB13", "PB12")],
    "notes": [
        "Mức logic 3.3V. Hầu hết chân chịu được 5V khi làm ngõ vào digital (FT), trừ khi đang dùng chức năng analog. Xem bảng chân trong datasheet để chắc chắn.",
        "Nạp code: giữ BOOT0, nhấn NRST rồi thả để vào bootloader USB DFU, hoặc dùng ST-Link qua header SWD.",
        "Các chân có nhiều chức năng thay thế (AF). Bảng trên liệt kê chức năng hay dùng; CubeMX cho biết đầy đủ khi bạn bấm vào chân.",
        "Khác Blue Pill: không có PB11, thêm PB2 và nút KEY ở PA0."
    ]
})


# ---------------- STM32F4DISCOVERY (MB997) ----------------
P1 = ["GND", "GND", "VDD", "VDD", "GND", "NRST", "PC1", "PC0", "PC3", "PC2", "PA1", "PA0", "PA3", "PA2", "PA5", "PA4", "PA7", "PA6",
      "PC5", "PC4", "PB1", "PB0", "GND", "PB2", "PE7", "PE8", "PE9", "PE10", "PE11", "PE12", "PE13", "PE14", "PE15", "PB10",
      "PB11", "PB12", "PB13", "PB14", "PB15", "PD8", "PD9", "PD10", "PD11", "PD12", "PD13", "PD14", "PD15", "NC", "GND", "GND"]
P2 = ["GND", "GND", "5V", "5V", "3V", "3V", "PH0", "PH1", "PC14", "PC15", "PE6", "PC13", "PE4", "PE5", "PE2", "PE3", "PE0", "PE1",
      "PB8", "PB9", "BOOT0", "VDD", "PB6", "PB7", "PB4", "PB5", "PD7", "PB3", "PD5", "PD6", "PD3", "PD4", "PD1", "PD2", "PC12", "PD0",
      "PC10", "PC11", "PA14", "PA15", "PA10", "PA13", "PA8", "PA9", "PC8", "PC9", "PC6", "PC7", "GND", "GND"]

F407 = {
    "PA0": ["adc:ADC123_IN0", "pwm:TIM2_CH1", "pwm:TIM5_CH1", "uart:UART4_TX", "other:WKUP"],
    "PA1": ["adc:ADC123_IN1", "pwm:TIM2_CH2", "pwm:TIM5_CH2", "uart:UART4_RX"],
    "PA2": ["uart:USART2_TX", "adc:ADC123_IN2", "pwm:TIM2_CH3", "pwm:TIM9_CH1"],
    "PA3": ["uart:USART2_RX", "adc:ADC123_IN3", "pwm:TIM2_CH4", "pwm:TIM9_CH2"],
    "PA4": ["dac:DAC_OUT1", "spi:SPI1_NSS", "adc:ADC12_IN4", "spi:I2S3_WS"],
    "PA5": ["spi:SPI1_SCK", "dac:DAC_OUT2", "adc:ADC12_IN5", "pwm:TIM2_CH1"],
    "PA6": ["spi:SPI1_MISO", "adc:ADC12_IN6", "pwm:TIM3_CH1", "pwm:TIM13_CH1"],
    "PA7": ["spi:SPI1_MOSI", "adc:ADC12_IN7", "pwm:TIM3_CH2", "pwm:TIM14_CH1"],
    "PA8": ["pwm:TIM1_CH1", "i2c:I2C3_SCL", "other:MCO1"],
    "PA9": ["uart:USART1_TX", "pwm:TIM1_CH2", "usb:OTG_FS_VBUS"], "PA10": ["uart:USART1_RX", "pwm:TIM1_CH3", "usb:OTG_FS_ID"],
    "PA13": ["other:SWDIO"], "PA14": ["other:SWCLK"], "PA15": ["other:JTDI", "pwm:TIM2_CH1", "spi:SPI3_NSS"],
    "PB0": ["adc:ADC12_IN8", "pwm:TIM3_CH3", "pwm:TIM1_CH2N"], "PB1": ["adc:ADC12_IN9", "pwm:TIM3_CH4", "pwm:TIM1_CH3N"],
    "PB2": ["other:BOOT1"], "PB3": ["other:JTDO / SWO", "pwm:TIM2_CH2", "spi:SPI1_SCK", "spi:SPI3_SCK"],
    "PB4": ["other:NJTRST", "pwm:TIM3_CH1", "spi:SPI1_MISO", "spi:SPI3_MISO"],
    "PB5": ["pwm:TIM3_CH2", "spi:SPI1_MOSI", "spi:SPI3_MOSI", "usb:CAN2_RX"],
    "PB6": ["i2c:I2C1_SCL", "uart:USART1_TX", "pwm:TIM4_CH1", "usb:CAN2_TX"], "PB7": ["i2c:I2C1_SDA", "uart:USART1_RX", "pwm:TIM4_CH2"],
    "PB8": ["i2c:I2C1_SCL", "pwm:TIM4_CH3", "pwm:TIM10_CH1", "usb:CAN1_RX"],
    "PB9": ["i2c:I2C1_SDA", "pwm:TIM4_CH4", "pwm:TIM11_CH1", "usb:CAN1_TX"],
    "PB10": ["i2c:I2C2_SCL", "uart:USART3_TX", "spi:SPI2_SCK", "pwm:TIM2_CH3"], "PB11": ["i2c:I2C2_SDA", "uart:USART3_RX", "pwm:TIM2_CH4"],
    "PB12": ["spi:SPI2_NSS", "usb:CAN2_RX", "pwm:TIM1_BKIN"], "PB13": ["spi:SPI2_SCK", "usb:CAN2_TX", "pwm:TIM1_CH1N"],
    "PB14": ["spi:SPI2_MISO", "pwm:TIM1_CH2N", "pwm:TIM12_CH1"], "PB15": ["spi:SPI2_MOSI", "pwm:TIM1_CH3N", "pwm:TIM12_CH2"],
    "PC0": ["adc:ADC123_IN10"], "PC1": ["adc:ADC123_IN11"], "PC2": ["adc:ADC123_IN12", "spi:SPI2_MISO"], "PC3": ["adc:ADC123_IN13", "spi:SPI2_MOSI"],
    "PC4": ["adc:ADC12_IN14"], "PC5": ["adc:ADC12_IN15"],
    "PC6": ["uart:USART6_TX", "pwm:TIM3_CH1", "pwm:TIM8_CH1"], "PC7": ["uart:USART6_RX", "pwm:TIM3_CH2", "pwm:TIM8_CH2"],
    "PC8": ["pwm:TIM3_CH3", "pwm:TIM8_CH3", "other:SDIO_D0"], "PC9": ["pwm:TIM3_CH4", "pwm:TIM8_CH4", "i2c:I2C3_SDA"],
    "PC10": ["uart:UART4_TX", "spi:SPI3_SCK", "uart:USART3_TX"], "PC11": ["uart:UART4_RX", "spi:SPI3_MISO", "uart:USART3_RX"],
    "PC12": ["uart:UART5_TX", "spi:SPI3_MOSI"], "PC13": ["other:TAMPER / RTC"], "PC14": ["other:OSC32_IN"], "PC15": ["other:OSC32_OUT"],
    "PD0": ["usb:CAN1_RX"], "PD1": ["usb:CAN1_TX"], "PD2": ["uart:UART5_RX"], "PD3": ["uart:USART2_CTS"], "PD4": ["uart:USART2_RTS"],
    "PD5": ["uart:USART2_TX"], "PD6": ["uart:USART2_RX"], "PD7": ["uart:USART2_CK"],
    "PD8": ["uart:USART3_TX"], "PD9": ["uart:USART3_RX"], "PD10": ["uart:USART3_CK"], "PD11": ["uart:USART3_CTS"],
    "PD12": ["pwm:TIM4_CH1", "other:LED xanh lá LD4"], "PD13": ["pwm:TIM4_CH2", "other:LED cam LD3"],
    "PD14": ["pwm:TIM4_CH3", "other:LED đỏ LD5"], "PD15": ["pwm:TIM4_CH4", "other:LED xanh dương LD6"],
    "PE0": ["pwm:TIM4_ETR"], "PE2": ["other:TRACECLK"], "PE5": ["pwm:TIM9_CH1"], "PE6": ["pwm:TIM9_CH2"],
    "PE7": ["pwm:TIM1_ETR"], "PE8": ["pwm:TIM1_CH1N"], "PE9": ["pwm:TIM1_CH1"], "PE10": ["pwm:TIM1_CH2N"], "PE11": ["pwm:TIM1_CH2"],
    "PE12": ["pwm:TIM1_CH3N"], "PE13": ["pwm:TIM1_CH3"], "PE14": ["pwm:TIM1_CH4"], "PE15": ["pwm:TIM1_BKIN"],
    "PH0": ["other:OSC_IN"], "PH1": ["other:OSC_OUT"],
}
DISC_NOTE = {
    "PA0": ("Nối nút USER (B1) màu xanh, nhấn = HIGH", None),
    "PA4": ("Nối chip âm thanh CS43L22 (I2S3_WS)", None), "PA5": ("Nối cảm biến gia tốc (SPI1_SCK)", None),
    "PA6": ("Nối cảm biến gia tốc (SPI1_MISO)", None), "PA7": ("Nối cảm biến gia tốc (SPI1_MOSI)", None),
    "PA9": ("Nối VBUS của cổng micro USB OTG", None), "PA10": ("Nối chân ID của cổng micro USB OTG", None),
    "PA13": ("Nối ST-LINK (SWDIO). Không dùng làm GPIO nếu muốn nạp và debug", ["warn"]),
    "PA14": ("Nối ST-LINK (SWCLK). Không dùng làm GPIO nếu muốn nạp và debug", ["warn"]),
    "PB3": ("Nối ST-LINK (SWO)", None), "PB6": ("Nối CS43L22 (I2C1_SCL)", None), "PB9": ("Nối CS43L22 (I2C1_SDA)", None),
    "PB10": ("Nối micro MP45DT02 (CLK)", None), "PC3": ("Nối micro MP45DT02 (DOUT)", None),
    "PC0": ("Điều khiển công tắc nguồn USB OTG. Nên tránh dùng", ["warn"]),
    "PC7": ("Nối CS43L22 (I2S3_MCK)", None), "PC10": ("Nối CS43L22 (I2S3_CK)", None), "PC12": ("Nối CS43L22 (I2S3_SD)", None),
    "PD4": ("Nối chân RESET của CS43L22", ["warn"]), "PD5": ("Báo quá dòng USB OTG", None),
    "PD12": ("Nối LED xanh lá LD4 (sáng khi HIGH)", None), "PD13": ("Nối LED cam LD3 (sáng khi HIGH)", None),
    "PD14": ("Nối LED đỏ LD5 (sáng khi HIGH)", None), "PD15": ("Nối LED xanh dương LD6 (sáng khi HIGH)", None),
    "PE0": ("Nối ngắt INT1 của cảm biến gia tốc", None), "PE1": ("Nối ngắt INT2 của cảm biến gia tốc", None),
    "PE3": ("Nối chân CS của cảm biến gia tốc", ["warn"]),
    "PH0": ("Nối thạch anh 8 MHz", ["warn"]), "PH1": ("Nối thạch anh 8 MHz", ["warn"]),
}


def disc_pin(name, num):
    if name in ("GND",): return P("GND", k="gnd", n=num)
    if name in ("VDD", "3V"): return P(name, k="power", n=num, note="Nguồn 3V của board")
    if name == "5V": return P("5V", k="power", n=num)
    if name == "NRST": return P("NRST", k="sys", n=num, f=["other:RESET"], note="Nối nút RESET (đen)")
    if name == "BOOT0": return P("BOOT0", k="sys", n=num, note="Chọn chế độ khởi động, mặc định kéo xuống GND")
    if name == "NC": return P("NC", k="nc", n=num, note="Không kết nối")
    note, t = DISC_NOTE.get(name, (None, None))
    return P(name, name, F407.get(name, []), n=num, t=t, note=note)


def col(names, start):
    return [disc_pin(names[i], i + 1) for i in range(start, len(names), 2)]


save({
    "id": "stm32f407-discovery", "name": "STM32F407 Discovery", "mcu": "STM32F407VGT6", "family": "STM32", "style": "discovery", "logic": "3.3V",
    "orientation": "Nhìn từ mặt trên, cổng mini USB (ST-LINK) ở phía trên. Header P1 bên trái, P2 bên phải, chân 1 ở góc trên. Số chân là số trên header P1/P2",
    "shape": {"w": 66, "h": 97, "rowGap": 0, "r": 2, "numbers": False, "parts": [
        {"type": "usb", "x": 29, "y": -2.2, "w": 8, "h": 7},
        {"type": "chip", "x": 23, "y": 8, "w": 7, "h": 7, "pins": 8, "label": "ST-LINK", "fs": 6.5},
        {"type": "chip", "x": 26, "y": 40, "w": 14, "h": 14, "pins": 14, "label": "STM32\nF407VGT6", "fs": 9},
        {"type": "button", "x": 18, "y": 82.5, "w": 6, "h": 6, "label": "USER"},
        {"type": "button", "x": 42, "y": 82.5, "w": 6, "h": 6, "label": "RESET"},
        {"type": "usb", "x": 22, "y": 92, "w": 7.5, "h": 5.6},
        {"type": "jack", "x": 37, "y": 88.5, "w": 7, "h": 9.5},
        {"type": "text", "x": 7.3, "y": 15.5, "fs": 10, "label": "P1", "weight": 700},
        {"type": "text", "x": 61.7, "y": 15.5, "fs": 10, "label": "P2", "weight": 700}]},
    "groups": [
        {"x": 3.0, "y": 18, "dir": "down", "labels": "left", "pins": col(P1, 0)},
        {"x": 5.54, "y": 18, "dir": "down", "labels": "right", "align": "pad", "pins": col(P1, 1)},
        {"x": 60.46, "y": 18, "dir": "down", "labels": "left", "align": "pad", "pins": col(P2, 0)},
        {"x": 63.0, "y": 18, "dir": "down", "labels": "right", "pins": col(P2, 1)}],
    "notes": [
        "Mức logic 3.3V. Phần lớn chân chịu được 5V khi làm ngõ vào digital (FT), trừ khi đang dùng chức năng analog.",
        "Nhiều chân đã nối linh kiện trên board: LED PD12–PD15, nút USER ở PA0, cảm biến gia tốc ở PA5–PA7 và PE3, chip âm thanh CS43L22 ở PA4, PB6, PB9, PC7, PC10, PC12, PD4. Nếu dùng các chân này cho việc khác, hãy chú ý xung đột.",
        "Nạp và debug qua ST-LINK/V2 tích hợp, cổng mini USB phía trên. Cổng micro USB phía dưới là USB OTG của STM32F407.",
        "Board có các bản MB997B/C/D/E khác nhau ở cảm biến gia tốc (LIS302DL, LIS3DSH, LIS3DH) nhưng giữ nguyên sơ đồ chân P1, P2."
    ]
})


# ---------------- Nucleo-64 (F103RB, F401RE) ----------------
CN7 = ["PC10", "PC11", "PC12", "PD2", "VDD", "E5V", "BOOT0", "GND", "NC", "NC", "NC", "IOREF", "PA13", "RESET", "PA14", "+3V3",
       "PA15", "+5V", "GND", "GND", "PB7", "GND", "PC13", "VIN", "PC14", "NC", "PC15", "PA0", "OSC_IN", "PA1", "OSC_OUT", "PA4",
       "VBAT", "PB0", "PC2", "PC1", "PC3", "PC0"]
CN10 = ["PC9", "PC8", "PB8", "PC6", "PB9", "PC5", "AVDD", "U5V", "GND", "NC", "PA5", "PA12", "PA6", "PA11", "PA7", "PB12",
        "PB6", "NC", "PC7", "GND", "PA9", "PB2", "PA8", "PB1", "PB10", "PB15", "PB4", "PB14", "PB5", "PB13", "PB3", "AGND",
        "PA10", "PC4", "PA2", "NC", "PA3", "NC"]
ARDUINO = {"PA3": "D0", "PA2": "D1", "PA10": "D2", "PB3": "D3", "PB5": "D4", "PB4": "D5", "PB10": "D6", "PA8": "D7", "PA9": "D8",
           "PC7": "D9", "PB6": "D10", "PA7": "D11", "PA6": "D12", "PA5": "D13", "PB9": "D14", "PB8": "D15",
           "PA0": "A0", "PA1": "A1", "PA4": "A2", "PB0": "A3", "PC1": "A4", "PC0": "A5"}
NUC_NOTE = {
    "PA2": ("USART2_TX nối ST-LINK (cổng COM ảo). Dùng làm GPIO sẽ mất Serial qua USB", ["warn"]),
    "PA3": ("USART2_RX nối ST-LINK (cổng COM ảo). Dùng làm GPIO sẽ mất Serial qua USB", ["warn"]),
    "PA5": ("Nối LED xanh LD2 (sáng khi HIGH)", None),
    "PC13": ("Nối nút USER B1 màu xanh (nhấn = LOW)", None),
    "PA13": ("Nối ST-LINK (SWDIO). Không dùng làm GPIO nếu muốn nạp và debug", ["warn"]),
    "PA14": ("Nối ST-LINK (SWCLK). Không dùng làm GPIO nếu muốn nạp và debug", ["warn"]),
    "PC14": ("Thạch anh 32.768 kHz (LSE) trên board", None), "PC15": ("Thạch anh 32.768 kHz (LSE) trên board", None),
}
POWER = {"VDD": "Nguồn 3.3V của MCU", "E5V": "Ngõ vào 5V ngoài (chọn bằng jumper JP5)", "IOREF": "Mức logic của board (3.3V) cho shield",
         "+3V3": "Ngõ ra 3.3V", "+5V": "Ngõ ra 5V", "VIN": "Nguồn vào 7–12V", "VBAT": "Nguồn pin dự phòng cho RTC",
         "AVDD": "Nguồn analog", "U5V": "5V từ cổng USB ST-LINK"}


def nucleo(variant):
    is103 = variant == "f103rb"
    funcs = F103 if is103 else F4X1
    osc = ("PD0", "PD1") if is103 else ("PH0", "PH1")

    def pin(name, num):
        if name in ("GND", "AGND"): return P(name, k="gnd", n=num)
        if name in POWER: return P(name, k="power", n=num, note=POWER[name])
        if name == "NC": return P("NC", k="nc", n=num)
        if name == "RESET": return P("RESET", k="sys", n=num, f=["other:NRST"], note="Nối nút RESET B2 (đen)")
        if name == "BOOT0": return P("BOOT0", k="sys", n=num, note="Chọn chế độ khởi động")
        if name in ("OSC_IN", "OSC_OUT"):
            real = osc[0] if name == "OSC_IN" else osc[1]
            return P(real, real, ["other:" + name], n=num, t=["warn"], note="Nhận clock 8 MHz từ ST-LINK (MCO) qua cầu hàn, không nối header theo mặc định")
        f = (["other:Arduino " + ARDUINO[name]] if name in ARDUINO else []) + funcs.get(name, [])
        note, t = NUC_NOTE.get(name, (None, None))
        return P(name, name, f, n=num, t=t, note=note)

    def cols(names, start):
        return [pin(names[i], i + 1) for i in range(start, len(names), 2)]

    mcu = "STM32F103RBT6" if is103 else "STM32F401RET6"
    return {
        "id": "nucleo-" + variant, "name": "Nucleo-" + variant.upper(), "mcu": mcu, "family": "STM32", "style": "nucleo", "logic": "3.3V",
        "orientation": "Nhìn từ mặt trên, phần ST-LINK (cổng mini USB) ở phía trên. Header Morpho CN7 bên trái, CN10 bên phải, chân 1 ở góc trên bên trái mỗi header",
        "shape": {"w": 70, "h": 82.5, "rowGap": 0, "r": 2, "numbers": False, "parts": [
            {"type": "usb", "x": 31, "y": -2.2, "w": 8, "h": 7},
            {"type": "chip", "x": 24, "y": 7, "w": 7, "h": 7, "pins": 8, "label": "ST-LINK", "fs": 6.5},
            {"type": "text", "x": 35, "y": 21.5, "fs": 8, "label": "- - - - - - - - - - - - - - - - - -"},
            {"type": "button", "x": 18, "y": 24, "w": 5.5, "h": 5.5, "label": "USER"},
            {"type": "button", "x": 46.5, "y": 24, "w": 5.5, "h": 5.5, "label": "RESET"},
            {"type": "led", "x": 33.6, "y": 26, "w": 2, "h": 1.1, "color": "#3ddc84"},
            {"type": "text", "x": 34.6, "y": 29.6, "fs": 6.5, "label": "LD2"},
            {"type": "chip", "x": 30, "y": 50, "w": 10, "h": 10, "pins": 10, "label": mcu[:11], "fs": 7},
            {"type": "text", "x": 5, "y": 30, "fs": 9, "label": "CN7", "weight": 700},
            {"type": "text", "x": 65, "y": 30, "fs": 9, "label": "CN10", "weight": 700}]},
        "groups": [
            {"x": 3.81, "y": 32, "dir": "down", "labels": "left", "pins": cols(CN7, 0)},
            {"x": 6.35, "y": 32, "dir": "down", "labels": "right", "align": "pad", "pins": cols(CN7, 1)},
            {"x": 63.65, "y": 32, "dir": "down", "labels": "left", "align": "pad", "pins": cols(CN10, 0)},
            {"x": 66.19, "y": 32, "dir": "down", "labels": "right", "pins": cols(CN10, 1)}],
        "notes": [
            "Mức logic 3.3V. Header Morpho (CN7, CN10) đưa ra mọi chân của MCU; header kiểu Arduino ở giữa board nối cùng các chân, ghi ở ô \"Arduino Dx/Ax\".",
            "PA2, PA3 (D1, D0) nối cổng COM ảo của ST-LINK nên Serial qua USB dùng hai chân này.",
            "LED LD2 ở PA5 (D13), nút USER ở PC13.",
            ("STM32F103RB không có TIM8 và USB OTG; chức năng ghi \"(remap)\" chỉ dùng được sau khi bật remap." if is103 else
             "STM32F401RE chạy tới 84 MHz, có USB OTG FS ở PA11, PA12.")
        ]
    }


save(nucleo("f103rb"))
save(nucleo("f401re"))


# ---------------- STM8S103F3 ----------------
S8 = {
    "D4": ("PD4", ["pwm:TIM2_CH1", "uart:UART1_CK", "other:BEEP"]), "D5": ("PD5", ["uart:UART1_TX", "adc:AIN5"]),
    "D6": ("PD6", ["uart:UART1_RX", "adc:AIN6"]), "A1": ("PA1", ["other:OSCIN"]), "A2": ("PA2", ["other:OSCOUT"]),
    "A3": ("PA3", ["pwm:TIM2_CH3", "spi:SPI_NSS"]), "D3": ("PD3", ["adc:AIN4", "pwm:TIM2_CH2", "adc:ADC_ETR"]),
    "D2": ("PD2", ["adc:AIN3", "pwm:TIM2_CH3 (remap)"]), "D1": ("PD1", ["other:SWIM"]),
    "C7": ("PC7", ["spi:SPI_MISO", "pwm:TIM1_CH2"]), "C6": ("PC6", ["spi:SPI_MOSI", "pwm:TIM1_CH1"]),
    "C5": ("PC5", ["spi:SPI_SCK", "pwm:TIM2_CH1 (remap)"]), "C4": ("PC4", ["pwm:TIM1_CH4", "adc:AIN2", "other:CLK_CCO"]),
    "C3": ("PC3", ["pwm:TIM1_CH3", "int:TLI"]), "B4": ("PB4", ["i2c:I2C_SCL"]), "B5": ("PB5", ["i2c:I2C_SDA", "other:LED test"])}
S8N = {"D1": ("Chân SWIM dùng để nạp code bằng ST-Link. Dùng làm GPIO thì không nạp lại được trừ khi reset giữ chip", ["warn"]),
       "B4": ("Cực máng hở thật (true open-drain): không xuất được mức HIGH, cần điện trở kéo lên", ["warn"]),
       "B5": ("Cực máng hở thật, nối LED test trên board (sáng khi LOW). Cần điện trở kéo lên khi dùng I2C", ["warn"]),
       "A1": ("Chân thạch anh ngoài; board không gắn thạch anh nên dùng làm GPIO được", None),
       "A2": ("Chân thạch anh ngoài; board không gắn thạch anh nên dùng làm GPIO được", None)}


def s8(lbl):
    name, f = S8[lbl]
    note, t = S8N.get(lbl, (None, None))
    return P(lbl, name, f, t=t, note=note)


save({
    "id": "stm8s103f3", "name": "STM8S103F3 board", "mcu": "STM8S103F3P6", "family": "STM8", "style": "stm32", "logic": "3.3V / 5V",
    "orientation": "Nhìn từ mặt trên, header SWIM ở phía trên, cổng micro USB (chỉ cấp nguồn) ở phía dưới. Các board xanh giá rẻ có thể đảo vị trí hai hàng, hãy đối chiếu chữ in trên board",
    "shape": {"w": 18.3, "h": 30.5, "rowGap": 15.24, "start": 3.8, "r": 0.8, "parts": [
        {"type": "header", "x": 5.34, "y": 1.3, "cols": 4, "rows": 1},
        {"type": "text", "x": 9.15, "y": 3.4, "fs": 6, "label": "3V3 SWIM GND RST"},
        {"type": "chip", "x": 6.4, "y": 8.5, "w": 5.5, "h": 7.8, "pins": 10, "label": "STM8S\n103F3", "fs": 7},
        {"type": "button", "x": 6.65, "y": 19, "w": 5, "h": 3.6, "label": "RESET"},
        {"type": "led", "x": 5, "y": 25.2, "w": 1.6, "h": 0.9, "color": "#3ddc84"},
        {"type": "led", "x": 11.7, "y": 25.2, "w": 1.6, "h": 0.9, "color": "#e53935"},
        {"type": "usb", "x": 5.4, "y": 26.4, "w": 7.5, "h": 5.4}]},
    "left": [s8("D4"), s8("D5"), s8("D6"), P("RST", "NRST", ["other:RESET"], k="sys", note="Kéo LOW để reset"), s8("A1"), s8("A2"),
             P("GND", k="gnd"), P("5V", k="power", note="5V từ cổng USB"), P("3V3", k="power", note="Ngõ ra 3.3V từ LDO"), s8("A3")],
    "right": [s8(x) for x in ("D3", "D2", "D1", "C7", "C6", "C5", "C4", "C3", "B4", "B5")],
    "notes": [
        "Chip chạy được ở 3.3V hoặc 5V; trên board mức logic là 3.3V khi cấp qua USB (qua LDO).",
        "Nạp code bằng ST-Link V2 qua header SWIM (3V3, SWIM, GND, RST). Cổng micro USB chỉ dùng để cấp nguồn.",
        "PB4, PB5 là cực máng hở thật: không xuất được mức HIGH, phải có điện trở kéo lên (kể cả khi dùng I2C).",
        "ADC 10-bit có ở các kênh AIN2 (PC4), AIN3 (PD2), AIN4 (PD3), AIN5 (PD5), AIN6 (PD6)."
    ]
})
print("stm ok")
