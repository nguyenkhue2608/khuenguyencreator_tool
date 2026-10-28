#!/usr/bin/env python3
"""Ghép một tool thành trang preview độc lập (CSS/JS inline): dist/preview/<slug>.html

    python3 preview/build.py stm32-pwm      (bỏ trống = build mọi trang trong pages.json)
"""
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def read(path):
    p = ROOT / path
    return p.read_text(encoding="utf-8") if p.exists() else ""


def build(slug):
    meta = json.loads(read("data/pages.json"))[slug]
    deps = meta.get("deps", [])
    css = "\n".join([read("assets/common/kn-tools.css")] + [read(f"assets/common/{d}.css") for d in deps] + [read(f"assets/tools/{slug}/tool.css")])
    js = "\n".join([read("assets/common/kn-select.js")] + [read(f"assets/common/{d}.js") for d in deps] + [read(f"assets/tools/{slug}/tool.js")])
    if meta.get("data"):
        files = sorted((ROOT / "data" / meta["data"]).glob("*.json"))
        bundle = {f.name: json.loads(f.read_text(encoding="utf-8")) for f in files}
        js = "window.KN_PINOUT_DATA = " + json.dumps(bundle, ensure_ascii=False) + ";\n" + js
    if meta.get("hub"):
        # Trang Hub do PHP sinh ra: chạy includes/ thật qua preview/render_hub.php (giả lập vài hàm WordPress)
        tool = subprocess.run(["php", str(ROOT / "preview" / "render_hub.php")], capture_output=True, text=True, check=True).stdout
        crumbs = "Trang chủ › Công cụ"
    else:
        tool = f'<div class="kn-tool" id="kn-tool-{slug}" data-tool="{slug}"></div>'
        crumbs = "Trang chủ › Công cụ › " + meta["title"]
    content = "\n".join(l for l in read(f"content/{slug}.html").splitlines() if not l.startswith("<!--"))
    html = read("preview/page.html")
    for key, val in {
        "TITLE": meta["title"], "H1": meta["h1"], "INTRO": meta["intro"], "SLUG": slug,
        "CSS": css, "JS": js, "CONTENT": content, "TOOL": tool, "CRUMBS": crumbs,
    }.items():
        html = html.replace("{{" + key + "}}", val)
    out = ROOT / "dist" / "preview" / f"{slug}.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(out)


if __name__ == "__main__":
    for s in sys.argv[1:] or json.loads(read("data/pages.json")).keys():
        build(s)
