"""Akarsu, göl ve baraj geometrilerini OpenStreetMap verisinden üretip geo.json'a "osm" alanı olarak yazar.

Kullanım (src/ içinden):  python3 build_osm.py [--fetch]
--fetch verilirse Overpass API'den veri yeniden indirilir (.cache/osm/ altına),
aksi hâlde önbellekteki JSON dosyaları kullanılır.
Veri © OpenStreetMap katkıda bulunanlar, ODbL.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

from shapely.geometry import LineString, MultiLineString, Point, Polygon, box
from shapely.ops import linemerge, polygonize, unary_union

from bookmap import P, turkey

SRC = Path(__file__).resolve().parent
CACHE = SRC.parent / ".cache" / "osm"
GEO = SRC / "geo.json"
MAP_BOX = box(24.3, 34.0, 46.0, 43.6)
UA = "kpss-cografya-harita/1.0 (educational map build script)"
OVERPASS = "https://overpass-api.de/api/interpreter"
BB = "(35.5,25.5,42.4,45.2)"

# ad, OSM ad düzenli ifadesi, [lon0, lat0, lon1, lat1] süzgeci (yoksa None)
RIVERS = [
    ("Kızılırmak", r"^Kızılırmak", None),
    ("Yeşilırmak", r"^Yeşilırmak", None),
    ("Sakarya", r"^Sakarya Nehri", None),
    ("Filyos (Yenice)", r"^Filyos", None),
    ("Çoruh", r"^(Çoruh|ჭოროხი)", None),
    ("Fırat", r"^Fırat", None),
    ("Dicle", r"^Dicle", None),
    ("Aras", r"^(Aras|Արաքս)", None),
    ("Kura", r"^(Kura|მტკვარი)", [41.5, 40.5, 44.6, 41.8]),
    ("Meriç", r"(Meriç|Έβρος)", None),
    ("Ergene", r"^Ergene", None),
    ("Susurluk (Simav)", r"^Simav Çayı", None),
    ("Bakırçay", r"^Bakırçay", None),
    ("Gediz", r"^Gediz", None),
    ("Küçük Menderes", r"^Küçük Menderes", None),
    ("Büyük Menderes", r"^Büyük Menderes", None),
    ("Dalaman Çayı", r"^Dalaman", None),
    ("Eşen Çayı", r"^Eşen", None),
    ("Aksu Çayı", r"^Aksu( Çayı)?$", [30.5, 36.8, 31.5, 38.0]),
    ("Köprüçay", r"^Köprüçay", None),
    ("Manavgat Çayı", r"^Manavgat", None),
    ("Göksu (Silifke)", r"^Göksu( Çayı| Nehri)?$", [32.3, 36.2, 34.2, 37.6]),
    ("Seyhan", r"^Seyhan", None),
    ("Ceyhan", r"^Ceyhan", None),
    ("Asi", r"^Asi", None),
    # kollar
    ("Porsuk Çayı", r"^Porsuk", None),
    ("Devrez Çayı", r"^Devrez", None),
    ("Kelkit Çayı", r"^Kelkit", None),
    ("Karasu (Fırat kolu)", r"^Karasu( Çayı| Irmağı)?$", [38.4, 39.3, 41.6, 40.2]),
    ("Murat", r"^Murat Nehri", None),
    ("Zap Suyu", r"^Zap", None),
    ("Harşit Çayı", r"^Harşit", None),
    ("Delice Irmağı", r"^Delice", [33.3, 39.2, 36.6, 40.6]),
    ("Gönen Çayı", r"^Gönen", None),
    ("Bartın Çayı", r"^Bartın", None),
    # sınır akarsuları
    ("Tunca", r"^Tunca", [26.3, 41.5, 27.3, 42.3]),
    ("Mutludere", r"Mutludere", None),
    ("Arpaçay", r"(Arpaçay|Ախուրյան|Akhurian)", [42.8, 40.0, 44.0, 41.4]),
    ("Hezil Çayı", r"^Hezil", None),
]

# göl adı -> (OSM adı, yaklaşık konum) ; OSM'de yoksa (None, lon, lat, rx, ry) elips
LAKES = {
    "Van Gölü": ("Van Gölü", 42.97, 38.66),
    "Tuz Gölü": ("Tuz Gölü", 33.45, 38.8),
    "Beyşehir Gölü": ("Beyşehir Gölü", 31.52, 37.78),
    "Eğirdir Gölü": ("Eğirdir Gölü", 30.86, 38.06),
    "Seyfe Gölü": ("Seyfe Gölü", 34.39, 39.21),
    "Aktaş Gölü": (None, 43.62, 41.24, 0.03, 0.035),
    "Hazar Gölü": ("Hazar Gölü", 39.4, 38.48),
    "Manyas (Kuş) Gölü": (None, 27.98, 40.2, 0.075, 0.05),
    "Uluabat Gölü": ("Uluabat Gölü", 28.59, 40.17),
    "İznik Gölü": ("İznik Gölü", 29.53, 40.44),
    "Burdur Gölü": ("Burdur Gölü", 30.16, 37.72),
    "Sapanca Gölü": ("Sapanca Gölü", 30.24, 40.72),
    "Eber Gölü": ("Eber Gölü", 31.15, 38.65),
    "Akşehir Gölü": ("Akşehir Gölü", 31.41, 38.52),
    "Acıgöl (Denizli)": ("Acıgöl", 29.88, 37.83),
    "Nemrut Krater Gölü": ("Nemrut Gölü", 42.23, 38.62),
    "Meke Gölü": (None, 33.64, 37.685, 0.012, 0.01),
    "Acıgöl (Karapınar)": ("Acıgöl", 33.67, 37.71),
    "Salda Gölü": ("Salda Gölü", 29.68, 37.55),
    "Avlan Gölü": ("Avlan Gölü", 29.94, 36.58),
    "Kızören Obruğu": (None, 33.19, 38.24, 0.008, 0.008),
    "Hafik Gölü": ("Hafik Gölü", 37.38, 39.87),
    "Tödürge Gölü": ("Tödürge Gölü", 37.6, 39.88),
    "Kovada Gölü": ("Kovada Gölü", 30.88, 37.63),
    "Suğla Gölü": ("Suğla Gölü", 32.0, 37.33),
    "Abant Gölü": ("Abant Gölü", 31.28, 40.61),
    "Yedigöller": ("Büyükgöl", 31.75, 40.94),
    "Borabay Gölü": ("Borabay Gölü", 36.15, 40.8),
    "Zinav Gölü": ("Zinav Gölü", 37.27, 40.45),
    "Sera Gölü": ("Sera Gölü", 39.61, 40.99),
    "Tortum Gölü": ("Tortum Gölü", 41.64, 40.63),
    "Uzungöl": ("Uzungöl", 40.3, 40.62),
    "Mogan Gölü": ("Mogan Gölü", 32.79, 39.77),
    "Eymir Gölü": ("Eymir Gölü", 32.83, 39.82),
    "Marmara Gölü": ("Marmara Gölü", 28.01, 38.62),
    "Bafa Gölü": ("Bafa Gölü", 27.45, 37.51),
    "Köyceğiz Gölü": ("Köyceğiz Gölü", 28.66, 36.91),
    "Çıldır Gölü": ("Çıldır Gölü", 43.23, 41.02),
    "Balık Gölü": ("Balık Gölü", 43.57, 39.78),
    "Haçlı Gölü": ("Haçlı Gölü", 42.3, 39.02),
    "Nazik Gölü": ("Nazik Gölü", 42.28, 38.87),
    "Erçek Gölü": ("Erçek Gölü", 43.58, 38.67),
    "Terkos (Durusu) Gölü": (None, 28.56, 41.32, 0.07, 0.03),
    "Büyükçekmece Gölü": ("Büyükçekmece Gölü", 28.56, 41.07),
    "Küçükçekmece Gölü": ("Küçükçekmece Gölü", 28.75, 41.02),
    "Ölüdeniz": (None, 29.115, 36.55, 0.01, 0.008),
    "Akyatan Lagünü": ("Akyatan Gölü", 35.27, 36.63),
    "Yumurtalık Lagünü": (None, 35.72, 36.73, 0.05, 0.02),
    "Akgöl (Göksu Deltası)": ("Akgöl", 33.96, 36.3),
    "Otlukbeli Gölü": (None, 39.95, 40.0, 0.012, 0.01),
}

DAMS = {
    "Atatürk Barajı": "Atatürk Barajı", "Karakaya Barajı": "Karakaya Barajı", "Keban Barajı": "Keban Barajı",
    "Ilısu Barajı": "Ilısu Barajı", "Altınkaya Barajı": "Altınkaya Barajı", "Birecik Barajı": "Birecik Barajı",
    "Deriner Barajı": "Deriner Barajı", "Oymapınar Barajı": None, "Berke Barajı": "Berke Barajı",
    "Ermenek Barajı": "Ermenek Barajı", "Gökçekaya Barajı": "Gökçekaya Barajı", "Sarıyar Barajı": "Sarıyar Barajı",
    "Hirfanlı Barajı": "Hirfanlı Barajı ve Hidroelektrik Santrali", "Almus Barajı": "Almus Barajı",
    "Yusufeli Barajı": "Yusufeli Barajı", "Demirköprü Barajı": "Demirköprü Barajı", "Adıgüzel Barajı": "Adıgüzel Barajı",
    "Kemer Barajı": "Kemer Barajı", "Manavgat Barajı": "Manavgat Barajı ve Hidroelektrik Santrali",
    "Çatalan Barajı": "Çatalan Barajı", "Aslantaş Barajı": "Aslantaş Barajı",
}
DAM_FALLBACK = {"Oymapınar Barajı": (31.56, 36.94), "Kemer Barajı": (28.525, 37.572)}


def fetch():
    CACHE.mkdir(parents=True, exist_ok=True)
    names = "|".join(sorted({re.sub(r"[\^$()]", "", r[1]).split("|")[0].split(" ")[0] for r in RIVERS}))
    queries = {
        "rivers_ways.json": f'[out:json][timeout:300];way["waterway"="river"]["name"~"{names}|მტკვარი|Έβρος|Արաքս|Ախուրյան|ჭოროხი"]{BB};out geom;',
        "rivers_rels.json": f'[out:json][timeout:300];rel["waterway"]["name"~"{names}"]{BB};out geom;',
        "lakes_dams.json": '[out:json][timeout:300];(nwr["natural"="water"]["name"~"^(' +
        "|".join(sorted({v[0] for v in LAKES.values() if v[0]})) + ')$"]' + BB + ';nwr["waterway"="dam"]["name"~"' +
        "|".join(n.split(" ")[0] for n in DAMS) + '"]' + BB + ';);out geom;',
    }
    for fn, q in queries.items():
        print("indiriliyor:", fn)
        subprocess.run(["curl", "-s", "-m", "500", "-A", UA, "-H", "Accept: application/json", OVERPASS,
                        "--data-urlencode", f"data={q}", "-o", str(CACHE / fn)], check=True)


def lines_of(el):
    if el["type"] == "way":
        yield [(p["lon"], p["lat"]) for p in el.get("geometry", [])]
    elif el["type"] == "relation":
        for m in el.get("members", []):
            if m.get("type") == "way" and m.get("role", "") in ("", "main_stream", "outer", "inner") and m.get("geometry"):
                yield [(p["lon"], p["lat"]) for p in m["geometry"]]


def lpath(g, nd=1):
    parts = getattr(g, "geoms", [g])
    out = []
    for ln in parts:
        if ln.geom_type != "LineString" or len(ln.coords) < 2:
            continue
        pts = [P(x, y) for x, y in ln.coords]
        out.append("M" + "L".join(f"{x:.{nd}f},{y:.{nd}f}" for x, y in pts))
    return "".join(out)


def ppath(g, nd=1):
    out = []
    for p in getattr(g, "geoms", [g]):
        if p.geom_type != "Polygon":
            continue
        for r in [p.exterior, *p.interiors]:
            pts = [P(x, y) for x, y in r.coords][:-1]
            if len(pts) >= 3:
                out.append("M" + "L".join(f"{x:.{nd}f},{y:.{nd}f}" for x, y in pts) + "Z")
    return "".join(out)


def rivers(elements):
    out = []
    for name, rx, bb in RIVERS:
        segs = []
        for el in elements:
            n = el.get("tags", {}).get("name", "")
            if not re.search(rx, n):
                continue
            for ln in lines_of(el):
                if len(ln) >= 2:
                    segs.append(LineString(ln))
        if not segs:
            print("  ! bulunamadı:", name)
            continue
        g = linemerge(unary_union(segs))
        if bb:
            g = g.intersection(box(*bb))
        g = g.intersection(MAP_BOX)
        # çok kısa kırıntıları at
        parts = [p for p in getattr(g, "geoms", [g]) if p.geom_type == "LineString" and p.length > 0.03]
        g = MultiLineString(parts).simplify(0.006)
        mid = g.interpolate(0.5, normalized=True) if g.geom_type == "LineString" else max(g.geoms, key=lambda s: s.length).interpolate(0.5, normalized=True)
        x0, y0, x1, y1 = g.bounds
        out.append({"name": name, "path": lpath(g), "lon": round(mid.x, 4), "lat": round(mid.y, 4),
                    "bbox": [round(v, 3) for v in (x0, y0, x1, y1)]})
        print(f"  {name}: {sum(len(p.coords) for p in getattr(g, 'geoms', [g]))} nokta")
    return out


def polygon_of(el):
    if el["type"] == "way":
        pts = [(p["lon"], p["lat"]) for p in el.get("geometry", [])]
        return Polygon(pts).buffer(0) if len(pts) >= 4 else None
    outers = [LineString([(p["lon"], p["lat"]) for p in m["geometry"]])
              for m in el.get("members", []) if m.get("role") == "outer" and m.get("geometry")]
    inners = [LineString([(p["lon"], p["lat"]) for p in m["geometry"]])
              for m in el.get("members", []) if m.get("role") == "inner" and m.get("geometry")]
    polys = list(polygonize(unary_union(outers)))
    if not polys:
        return None
    g = unary_union(polys)
    hol = list(polygonize(unary_union(inners))) if inners else []
    if hol:
        g = g.difference(unary_union(hol))
    return g.buffer(0)


def center_of(el):
    if el["type"] == "node":
        return el["lon"], el["lat"]
    b = el.get("bounds")
    if b:
        return (b["minlon"] + b["maxlon"]) / 2, (b["minlat"] + b["maxlat"]) / 2
    g = el.get("geometry") or []
    return (sum(p["lon"] for p in g) / len(g), sum(p["lat"] for p in g) / len(g)) if g else (0, 0)


def ellipse(lon, lat, rx, ry):
    import math
    return Polygon([(lon + rx * math.cos(t / 24 * math.tau), lat + ry * math.sin(t / 24 * math.tau)) for t in range(24)])


def lakes(elements):
    out = []
    for name, spec in LAKES.items():
        osm, lon, lat = spec[0], spec[1], spec[2]
        g = None
        if osm:
            cands = [e for e in elements if e.get("tags", {}).get("name") == osm and "waterway" not in e["tags"]]
            best = min(cands, key=lambda e: Point(center_of(e)).distance(Point(lon, lat)), default=None)
            if best is not None and Point(center_of(best)).distance(Point(lon, lat)) < 0.35:
                g = polygon_of(best)
        real = g is not None and not g.is_empty
        if not real:
            if len(spec) < 5:
                print("  ! göl bulunamadı:", name)
                continue
            g = ellipse(lon, lat, spec[3], spec[4])
        g = g.simplify(0.002 if g.area < 0.05 else 0.006)
        rp = g.representative_point()
        out.append({"name": name, "path": ppath(g), "lon": round(rp.x, 4), "lat": round(rp.y, 4), "real": real})
    return out


def dams(elements):
    out = []
    for name, osm in DAMS.items():
        c = None
        if osm:
            cands = [e for e in elements if e.get("tags", {}).get("name") == osm and e["tags"].get("waterway") == "dam"]
            if cands:
                c = center_of(cands[0])
        if name in DAM_FALLBACK and (c is None or name == "Kemer Barajı"):
            c = DAM_FALLBACK[name]
        if c is None:
            print("  ! baraj bulunamadı:", name)
            continue
        out.append({"name": name, "lon": round(c[0], 4), "lat": round(c[1], 4)})
    return out


def main():
    if "--fetch" in sys.argv:
        fetch()
    els = []
    for fn in ("rivers_ways.json", "rivers_rels.json"):
        els += json.loads((CACHE / fn).read_text(encoding="utf-8"))["elements"]
    ld = json.loads((CACHE / "lakes_dams.json").read_text(encoding="utf-8"))["elements"]
    geo = json.loads(GEO.read_text(encoding="utf-8"))
    print("• akarsular")
    geo["osm"] = {"rivers": rivers(els)}
    print("• göller")
    geo["osm"]["lakes"] = lakes(ld)
    print("• barajlar")
    geo["osm"]["dams"] = dams(ld)
    GEO.write_text(json.dumps(geo, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("geo.json güncellendi")


if __name__ == "__main__":
    main()
