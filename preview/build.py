#!/usr/bin/env python3
"""Ghép một tool thành trang preview độc lập (CSS/JS inline): dist/preview/<slug>.html

    python3 preview/build.py stm32-timer-pwm
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def read(path):
    p = ROOT / path
    return p.read_text(encoding="utf-8") if p.exists() else ""


def build(slug):
    meta = json.loads(read("preview/pages.json"))[slug]
    css = read("assets/common/kn-tools.css") + "\n" + read(f"assets/tools/{slug}/tool.css")
    content = "\n".join(l for l in read(f"content/{slug}.html").splitlines() if not l.startswith("<!--"))
    html = read("preview/page.html")
    for key, val in {
        "TITLE": meta["title"], "H1": meta["h1"], "INTRO": meta["intro"], "SLUG": slug,
        "CSS": css, "JS": read(f"assets/tools/{slug}/tool.js"), "CONTENT": content,
    }.items():
        html = html.replace("{{" + key + "}}", val)
    out = ROOT / "dist" / "preview" / f"{slug}.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(out)


if __name__ == "__main__":
    for s in sys.argv[1:] or ["stm32-timer-pwm"]:
        build(s)
