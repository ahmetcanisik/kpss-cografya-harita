"""src/ altındaki parçaları birleştirip tek dosyalık index.html üretir.

Kullanım: python3 build.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"

template = (SRC / "template.html").read_text(encoding="utf-8")
geo = json.loads((SRC / "geo.json").read_text(encoding="utf-8"))
data = (SRC / "data.js").read_text(encoding="utf-8") + "\n" + (SRC / "notes.js").read_text(encoding="utf-8")
app = (SRC / "app.js").read_text(encoding="utf-8")

for marker in ("/*GEO*/", "/*DATA*/", "/*APP*/"):
    if template.count(marker) != 1:
        raise SystemExit(f"template.html içinde {marker} tam olarak bir kez bulunmalı")

html = (template
        .replace("/*GEO*/", json.dumps(geo, ensure_ascii=False, separators=(",", ":")))
        .replace("/*DATA*/", data)
        .replace("/*APP*/", app))
(ROOT / "index.html").write_text(html, encoding="utf-8")
print(f"index.html yazıldı ({len(html.encode('utf-8')) / 1024:.0f} KB)")
