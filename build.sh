#!/usr/bin/env bash
# Đóng gói plugin thành dist/kn-tools.zip để upload lên WordPress (Plugins > Add New > Upload).
set -euo pipefail
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist/kn-tools
cp -r kn-tools.php includes assets data dist/kn-tools/
(cd dist && zip -qr kn-tools.zip kn-tools && rm -rf kn-tools)
echo "dist/kn-tools.zip"
