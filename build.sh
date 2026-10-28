#!/usr/bin/env bash
# Đóng gói plugin thành dist/kn-tools.zip để upload lên WordPress (Plugin → Cài mới → Tải plugin lên).
set -euo pipefail
cd "$(dirname "$0")"
rm -rf dist/kn-tools dist/kn-tools.zip && mkdir -p dist/kn-tools
cp -r kn-tools.php includes assets data content dist/kn-tools/
rm -f dist/kn-tools/data/pinout/_gen_*.py
(cd dist && zip -qr kn-tools.zip kn-tools && rm -rf kn-tools)
echo "dist/kn-tools.zip"
