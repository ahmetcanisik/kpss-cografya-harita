"""docs/source.pdf içindeki haritaları sayısallaştırıp geo.json'a "book" alanı olarak yazar.

Kullanım (src/ içinden):  python3 build_book_layers.py
Gerekenler: poppler (pdftoppm), numpy, pillow, shapely, scipy, opencv-python-headless.

Yöntem: her harita sayfası 200 DPI render edilir, Türkiye kıyı/sınır çizgisi
gerçek il sınırlarına ICP ile oturtulur (bkz. bookmap.fit, medyan hata ≈ 2 px ≈ 2 km),
sonra alanlar lejant renklerine göre (sınıflandırma) ya da ad verilmiş bir tohum
noktasından renk bölgesi büyütülerek (flood fill) çıkarılır. Sonuçlar kitap
haritasının sayısallaştırılmış, yaklaşık hâlidir.
"""
import json
import pickle
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from shapely.geometry import Point, Polygon, box
from shapely.ops import unary_union

from bookmap import (P, classify, fit, geom_to_path, land_mask, lonlat_to_px,
                     mask_to_geom, px_to_lonlat, raster_turkey, turkey)

SRC = Path(__file__).resolve().parent
PDF = SRC.parent / "docs" / "source.pdf"
CACHE = SRC.parent / ".cache" / "book"
GEO = SRC / "geo.json"
DPI = 200


# ---------------------------------------------------------------- sayfa
class Page:
    def __init__(self, pdf_page, **mask_kw):
        CACHE.mkdir(parents=True, exist_ok=True)
        png = CACHE / f"p{pdf_page}.png"
        if not png.exists():
            subprocess.run(["pdftoppm", "-r", str(DPI), "-png", "-singlefile", "-f", str(pdf_page),
                            "-l", str(pdf_page), str(PDF), str(png.with_suffix(""))], check=True)
        self.img = Image.open(png).convert("RGB")
        self.a = np.asarray(self.img)
        tfile = CACHE / f"p{pdf_page}.T.pkl"
        if tfile.exists():
            self.T = pickle.loads(tfile.read_bytes())
        else:
            self.T, err = fit(land_mask(self.img, **mask_kw))
            print(f"  s.{pdf_page}: oturtma hatası {err:.1f} px")
            tfile.write_bytes(pickle.dumps(self.T))
        self.land = raster_turkey(self.T, self.a.shape[:2])

    def region(self, seed, tol=28, close=9, max_area=400000):
        """Tohum pikselinden renk bölgesi; taşarsa toleransı düşürür."""
        src = cv2.medianBlur(self.a.copy(), 3)
        h, w = src.shape[:2]
        for t in range(tol, 6, -4):
            mask = np.zeros((h + 2, w + 2), np.uint8)
            flags = 4 | cv2.FLOODFILL_MASK_ONLY | cv2.FLOODFILL_FIXED_RANGE | (255 << 8)
            cv2.floodFill(src.copy(), mask, seed, 0, (t,) * 3, (t,) * 3, flags)
            m = (mask[1:-1, 1:-1] > 0).astype(np.uint8)
            if m.sum() < max_area:
                break
        if close:
            m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (close, close)))
        cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        m = np.zeros_like(m)
        cv2.drawContours(m, cnts, -1, 1, -1)
        return m

    def regions(self, seeds, **kw):
        m = None
        for s in seeds:
            r = self.region(s, **kw)
            m = r if m is None else (m | r)
        return m

    def geom(self, m, simplify_px=1.5):
        return mask_to_geom(m.astype(np.uint8), self.T, simplify_px)


TR = None


def clip(g, tol=0.012, min_hole=0.03, min_part=0.002):
    """Türkiye'ye kırp, nehir/yazı kaynaklı küçük delikleri ve kırıntıları at."""
    global TR
    if TR is None:
        TR = turkey().buffer(0)
    g = g.buffer(0).intersection(TR)
    parts = []
    for p in getattr(g, "geoms", [g]):
        if p.geom_type != "Polygon" or p.area < min_part:
            continue
        holes = [r for r in p.interiors if Polygon(r).area >= min_hole]
        parts.append(Polygon(p.exterior, holes))
    g = unary_union(parts) if parts else Polygon()
    return g.simplify(tol, preserve_topology=True)


def feature(name, g, **extra):
    rp = g.representative_point()
    x0, y0, x1, y1 = g.bounds
    out = {"name": name, "path": geom_to_path(g), "lon": round(rp.x, 4), "lat": round(rp.y, 4),
           "bbox": [round(v, 3) for v in (x0, y0, x1, y1)]}
    out.update(extra)
    return out


def split_classes(pg, lab, names, keep):
    res = {}
    for n in keep:
        m = (lab == names.index(n)).astype(np.uint8)
        res[n] = clip(pg.geom(m, 2.0))
    return res


# ---------------------------------------------------------------- topraklar (kitap s.112-114)
SOIL_CLASSES = [
    # anahtar, ad, renk (kitap lejantı)
    ("asidik", "Asidik Kahverengi Orman Toprakları", "#8FD4F5"),
    ("kirecli", "Kireçli Orman Toprakları", "#5BB5E6"),
    ("terra", "Terra Rossa Toprakları", "#EF8A8F"),
    ("bozkir", "Bozkır Toprakları", "#EEEE9A"),
    ("tasli", "Taşlı ve Kumlu Topraklar", "#E39A74"),
    ("cernez", "Çernezyom Toprakları", "#353838"),
    ("vertisol", "Vertisol (Dönen) Topraklar", "#A0A2AE"),
    ("rendzina", "Rendzina Toprakları", "#C07CB5"),
    ("aluvyal", "Alüvyal Topraklar", "#8DC47E"),
]


def soils():
    pg = Page(113)
    pal = {"asidik": [(148, 218, 252)], "terra": [(244, 143, 145)], "bozkir": [(240, 241, 158)],
           "tasli": [(228, 156, 120)], "cernez": [(53, 56, 57)], "rendzina": [(192, 124, 181)],
           "vertisol": [(158, 160, 172), (197, 195, 202)], "aluvyal": [(160, 197, 142)],
           "lake": [(124, 206, 252)], "hatch": [(42, 106, 134)]}
    a = pg.a.astype(np.int32)
    # konuma bağlı düzeltmeler: gri (vertisol) yalnız Trakya'da, siyah (çernezyom) yalnız Erzurum-Kars'ta
    lon_px = np.zeros(a.shape[:2], np.float32)
    xs = np.arange(a.shape[1])
    ymid = a.shape[0] // 2
    lon_row = np.array([px_to_lonlat(pg.T, float(x), float(ymid))[0] for x in xs[::8]])
    lon_px[:] = np.interp(xs, xs[::8], lon_row)[None, :]
    lab, names = classify(pg.img, pg.land, pal, max_dist=40, smooth=0, min_area=0)
    V, C, L, H = (names.index(k) for k in ("vertisol", "cernez", "lake", "hatch"))
    lab[(lab == V) & (lon_px > 28.3)] = -3
    lab[(lab == C) & (lon_px < 41.5)] = -3
    cand = ((lab == H) | (lab == L)).astype(np.uint8)
    blobs = cv2.morphologyEx(cand, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    inner = cv2.erode(pg.land, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25)))
    hatch = cand & (1 - blobs) & inner
    # tarama çizgileri arasını kapat -> kireçli orman sahası
    zone = cv2.morphologyEx(hatch, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (95, 95)))
    lab[(lab == L) | (lab == H)] = -3
    unknown = (lab == -3) | ((lab == -1) & (pg.land == 1))
    from bookmap import _nearest_index, majority
    known = (lab >= 0).astype(np.uint8)
    _, idx = _nearest_index(known)
    lab = np.where(unknown, lab.reshape(-1)[idx].reshape(lab.shape), lab)
    lab[pg.land == 0] = -1
    A = names.index("asidik")
    names = names + ["kirecli"]
    K = len(names) - 1
    lab[(zone == 1) & (lab == A)] = K
    lab = majority(lab, pg.land, len(names), 11)
    out = []
    for key, name, color in SOIL_CLASSES:
        g = clip(pg.geom((lab == names.index(key)).astype(np.uint8), 2.0))
        g = unary_union([p for p in getattr(g, "geoms", [g]) if p.area > 0.004])
        if not g.is_empty:
            out.append(feature(name, g, key=key, color=color))
    return out


# ---------------------------------------------------------------- platolar (kitap s.60)
PLATEAU_TYPES = {
    "asinim": ("Aşınım düzlüğü platosu", "#3E7FA6"),
    "karstik": ("Karstik plato", "#9A9AA3"),
    "lav": ("Lav platosu", "#E8706C"),
    "tuf": ("Tüf platosu", "#3B3A40"),
    "yatay": ("Yatay duruşlu tabaka düzlüğü platosu", "#A56BC4"),
}
PLATEAU_SEEDS = [
    ("Çatalca-Kocaeli Platosu", "asinim", [(470, 785)], 28),
    ("Safranbolu Platosu", "asinim", [(800, 770)], 28),
    ("Perşembe Platosu", "asinim", [(1213, 853)], 28),
    ("Teke Platosu", "karstik", [(440, 1335)], 28),
    ("Taşeli Platosu", "karstik", [(760, 1330)], 28),
    ("Erzurum-Kars Platosu", "lav", [(1700, 867), (1700, 773)], 22),
    ("Kapadokya Platosu", "tuf", [(1005, 1073)], 28),
    ("Yazılıkaya Platosu", "yatay", [(480, 1040)], 28),
    ("Haymana Platosu", "yatay", [(780, 980)], 28),
    ("Cihanbeyli Platosu", "yatay", [(755, 1085)], 28),
    ("Obruk Platosu", "yatay", [(850, 1145)], 28),
    ("Bozok Platosu", "yatay", [(1000, 940)], 28),
    ("Uzunyayla Platosu", "yatay", [(1230, 990)], 28),
    ("Gaziantep Platosu", "yatay", [(1240, 1270)], 28),
    ("Şanlıurfa Platosu", "yatay", [(1333, 1287), (1450, 1280)], 28),
]


def plateaus():
    pg = Page(59)
    out = []
    for name, typ, seeds, tol in PLATEAU_SEEDS:
        g = clip(pg.geom(pg.regions(seeds, tol=tol)))
        if name == "Erzurum-Kars Platosu":
            # kitapta tek lav sahası; Ardahan kuzeyi ayrı plato olarak adlandırılır
            north = box(40, 40.95, 46, 42)
            ard = g.intersection(north)
            g = g.difference(north)
            out.append(feature("Ardahan Platosu", ard, type="lav"))
        out.append(feature(name, g, type=typ))
    return out


# ---------------------------------------------------------------- yardımcılar
def components(pg, m, min_area=120):
    """İkili maskenin bağlı parçaları: [(maske, lon, lat)]."""
    n, cc, st, cen = cv2.connectedComponentsWithStats(m.astype(np.uint8), 8)
    out = []
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < min_area:
            continue
        lon, lat = px_to_lonlat(pg.T, *cen[i])
        out.append(((cc == i).astype(np.uint8), lon, lat))
    return out


def assign(comps, anchors, max_deg=0.8):
    """Parçaları en yakın ad çapasına atar; aynı ada düşenler birleşir."""
    groups = {}
    for m, lon, lat in comps:
        best = min(anchors, key=lambda k: (anchors[k][0] - lon) ** 2 + (anchors[k][1] - lat) ** 2)
        d = ((anchors[best][0] - lon) ** 2 + (anchors[best][1] - lat) ** 2) ** 0.5
        if d > max_deg:
            continue
        groups[best] = m if best not in groups else (groups[best] | m)
    return groups


def circle(lon, lat, r=0.09):
    import math
    return Polygon([(lon + r / math.cos(math.radians(lat)) * math.cos(t / 20 * math.tau),
                     lat + r * math.sin(t / 20 * math.tau)) for t in range(20)])


# ---------------------------------------------------------------- masifler (kitap s.21-22)
MASSIF_ANCHORS = {
    "Yıldız (Istranca) Masifi": [(27.56, 41.76), (28.46, 41.32)],
    "Zonguldak Masifi": [(32.45, 41.51)],
    "Daday-Devrekani ve Ilgaz Masifi": [(33.55, 41.21), (34.54, 41.09)],
    "Kazdağı Masifi": [(27.09, 39.83)],
    "Biga Masifi": [(26.47, 39.92)],
    "Uludağ Masifi": [(29.57, 40.05), (28.16, 39.86), (28.64, 39.83)],
    "Amasya-Tokat Masifi": [(36.26, 40.19), (35.17, 40.19), (35.64, 39.92)],
    "Pulur Masifi": [(40.0, 40.14)],
    "Kırşehir Masifi": [(33.88, 39.18)],
    "Akdağmadeni Masifi": [(35.64, 39.42)],
    "Menderes Masifi": [(28.17, 38.24), (28.04, 38.82)],
    "Saruhan-Menteşe Masifi": [(28.08, 37.47)],
    "Sultandağları Masifi": [(31.44, 38.3)],
    "Niğde Masifi": [(34.94, 37.97)],
    "Akdağ Masifi": [(34.3, 37.56)],
    "Alanya-Anamur Masifi": [(32.38, 36.44)],
    "Malatya-Pötürge Masifi": [(39.16, 38.25)],
    "Bitlis Masifi": [(41.75, 38.44)],
    "Mardin-Derik Masifi": [(40.19, 37.76)],
}


def massifs():
    pg = Page(21, white=246, sat=9)
    A = cv2.medianBlur(pg.a.copy(), 5).astype(int)
    r, g, b = A[..., 0], A[..., 1], A[..., 2]
    m = ((r - b > 40) & (r < 200) & (g < 175)).astype(np.uint8)
    m &= cv2.dilate(pg.land, np.ones((15, 15), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    anchors = {f"{k}#{i}": p for k, ps in MASSIF_ANCHORS.items() for i, p in enumerate(ps)}
    groups = assign(components(pg, m, 150), anchors, 0.15)
    out = []
    for name in MASSIF_ANCHORS:
        ms = [v for k, v in groups.items() if k.split("#")[0] == name]
        if not ms:
            print("  ! masif bulunamadı:", name)
            continue
        mm = ms[0]
        for x in ms[1:]:
            mm = mm | x
        out.append(feature(name, clip(pg.geom(mm), min_part=0.0005)))
    return out


# ---------------------------------------------------------------- ovalar (kitap s.64-67)
TECTONIC_ANCHORS = {
    "Ergene Ovası": (27.0, 41.3), "Adapazarı Ovası": (30.4, 40.75), "Düzce Ovası": (31.15, 40.85),
    "Bolu Ovası": (31.6, 40.73), "Bursa Ovası": (29.1, 40.2), "Balıkesir Ovası": (27.9, 39.65),
    "Bakırçay Ovası": (27.2, 39.1), "Gediz Ovası": (27.8, 38.6), "Küçük Menderes Ovası": (27.7, 38.15),
    "Büyük Menderes Ovası": (27.9, 37.85), "Eskişehir Ovası": (30.8, 39.8),
    "Merzifon-Suluova": (35.5, 40.85), "Ladik Ovası": (35.9, 40.95), "Taşova": (36.3, 40.78),
    "Erbaa Ovası": (36.6, 40.7), "Niksar Ovası": (37.0, 40.6), "Tokat (Kazova)": (36.5, 40.35),
    "Tercan Ovası": (40.4, 39.8), "Erzincan Ovası": (39.5, 39.72), "Erzurum Ovası": (41.25, 39.95),
    "Pasinler Ovası": (41.75, 40.0), "Iğdır Ovası": (44.0, 39.95), "Malatya Ovası": (38.3, 38.4),
    "Elazığ Ovası": (39.25, 38.65), "Bingöl Ovası": (40.5, 38.9), "Muş Ovası": (41.5, 38.85),
    "Kahramanmaraş Ovası": (36.9, 37.5), "Adıyaman Ovası": (38.3, 37.75), "Amik Ovası": (36.35, 36.3),
    "Suruç Ovası": (38.4, 36.95), "Harran Ovası": (39.0, 36.85), "Ceylanpınar Ovası": (40.0, 36.85),
}
KARST_PLAINS = {  # kitapta tek karstik saha; alt adlar gerçek konumlarıyla bölünür
    "Muğla Polyesi": (28.37, 37.2), "Elmalı Polyesi": (29.92, 36.73), "Kestel Polyesi": (30.45, 37.3),
    "Korkuteli Polyesi": (30.2, 37.07), "Acıpayam Polyesi": (29.35, 37.43), "Tefenni Polyesi": (29.78, 37.31),
    "Burdur Ovası (Polye)": (30.25, 37.62),
}
DELTAS = {  # kitap s.64: nehir -> delta ovası (pinlerle gösterilmiş)
    "Meriç Deltası": ((26.1, 40.75), "Meriç"), "Karasu (Sakarya) Deltası": ((30.6, 41.05), "Sakarya"),
    "Bafra Ovası": ((35.95, 41.65), "Kızılırmak"), "Çarşamba Ovası": ((36.7, 41.25), "Yeşilırmak"),
    "Dikili Ovası": ((26.97, 39.08), "Bakırçay"), "Menemen Ovası": ((26.93, 38.6), "Gediz"),
    "Selçuk-Efes Ovası": ((27.32, 37.94), "Küçük Menderes"), "Balat Ovası": ((27.3, 37.5), "Büyük Menderes"),
    "Silifke Ovası": ((34.02, 36.33), "Göksu"), "Çukurova": ((35.3, 36.8), "Seyhan-Ceyhan"),
    "Asi Deltası": ((35.97, 36.05), "Asi"),
}
PIEDMONT = {"Bursa Ovası (dağ eteği)": ((29.02, 40.15), "Uludağ"), "Isparta Ovası": ((30.55, 37.8), "Davraz Dağı"),
            "Kayseri Ovası": ((35.45, 38.75), "Erciyes Dağı")}


def plains():
    out = []
    # tektonik (s.67)
    pg = Page(66)
    A = cv2.medianBlur(pg.a.copy(), 5).astype(int)
    r, g, b = A[..., 0], A[..., 1], A[..., 2]
    m = ((b - g > 20) & (r - g > 25) & (r < 235)).astype(np.uint8) & pg.land
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    comps = []
    for cm, lon, lat in components(pg, m, 60):
        # Kahramanmaraş-Amik oluğu kitapta tek parça; enleme göre bölünür
        if 36.0 < lon < 37.2 and 36.1 < lat < 37.8:
            g_ = pg.geom(cm)
            for nm, band in (("Kahramanmaraş Ovası", (37.2, 38)), ("Amik Ovası", (35.8, 36.7))):
                part = clip(g_.intersection(box(35.5, band[0], 37.5, band[1])), min_part=0.0005)
                if not part.is_empty:
                    out.append(feature(nm, part, type="tektonik"))
            continue
        comps.append((cm, lon, lat))
    for name, mm in assign(comps, TECTONIC_ANCHORS, 0.6).items():
        if name in ("Kahramanmaraş Ovası", "Amik Ovası"):
            continue
        out.append(feature(name, clip(pg.geom(mm), min_part=0.0005), type="tektonik"))
    # karstik, eski göl tabanı, lav örtüsü (s.65)
    pg = Page(64)
    karst = clip(pg.geom(pg.region((479, 1421), tol=20, close=15)))
    sites = [Point(*v) for v in KARST_PLAINS.values()]
    for (name, (lon, lat)), site in zip(KARST_PLAINS.items(), sites):
        cell = karst
        for other in sites:
            if other is site:
                continue
            # Voronoi hücresi: diğer siteye göre orta dik yarı düzlem
            mx, my = (site.x + other.x) / 2, (site.y + other.y) / 2
            dx, dy = site.x - other.x, site.y - other.y
            half = Polygon([(mx - dy * 50, my + dx * 50), (mx + dy * 50, my - dx * 50),
                            (mx + dy * 50 + dx * 50, my - dx * 50 + dy * 50),
                            (mx - dy * 50 + dx * 50, my + dx * 50 + dy * 50)])
            cell = cell.intersection(half)
        if cell.is_empty:
            cell = circle(lon, lat, 0.08)
        out.append(feature(name, clip(cell, min_part=0.0005), type="karstik"))
    for name, seed in (("Konya-Ereğli Ovası", (821, 1279)), ("Aksaray Ovası", (836, 1207))):
        out.append(feature(name, clip(pg.geom(pg.region(seed, tol=26))), type="eskigol"))
    for name, (cx, cy, rx, ry) in {"Malazgirt Ovası": (1665, 1148, 26, 9), "Çaldıran Ovası": (1803, 1118, 9, 18),
                                   "Muradiye Ovası": (1778, 1150, 18, 10)}.items():
        mm = np.zeros(pg.a.shape[:2], np.uint8)
        cv2.ellipse(mm, (cx, cy), (rx, ry), 0, 0, 360, 1, -1)
        out.append(feature(name, clip(pg.geom(mm), min_part=0.0001), type="lav"))
    for name, ((lon, lat), river) in DELTAS.items():
        out.append(feature(name, clip(circle(lon, lat, 0.09), min_part=0.0001), type="delta", river=river))
    for name, ((lon, lat), mt) in PIEDMONT.items():
        out.append(feature(name, clip(circle(lon, lat, 0.1), min_part=0.0001), type="dagetegi", mountain=mt))
    return out


# ---------------------------------------------------------------- akarsu havzaları (kitap s.93)
BASINS = [
    ("karadeniz", "Karadeniz Havzası", "açık", "#BDE7E1", [(205, 232, 225), (216, 235, 223)], None),
    ("marmara", "Marmara Havzası", "açık", "#EEF1B8", [(229, 239, 190)], (0, 31)),
    ("ege", "Ege Havzası", "açık", "#F4D6EE", [(245, 221, 241)], (0, 32)),
    ("akdeniz", "Akdeniz Havzası", "açık", "#F1C8B6", [(240, 200, 184)], None),
    ("basra", "Basra Körfezi Havzası", "açık", "#9FD8CD", [(190, 222, 200), (178, 217, 196), (155, 215, 207)], (36.5, 50)),
    ("hazar", "Hazar Havzası", "kapalı", "#B9E5FB", [(184, 229, 253)], (41.3, 50)),
    ("van", "Van Gölü Havzası", "kapalı", "#D9B6DA", [(217, 185, 219)], (41.0, 50)),
    ("tuz", "Tuz Gölü Havzası", "kapalı", "#F8B3AB", [(251, 181, 173)], None),
    ("goller", "Göller Yöresi Havzası", "kapalı", "#ACB5DA", [(172, 182, 218)], None),
]


def basins():
    pg = Page(92)
    pal = {k: cols for k, _, _, _, cols, _ in BASINS}
    lab, names = classify(pg.img, pg.land, pal, max_dist=26, smooth=0, min_area=0)
    lon_px = lon_grid(pg)
    for k, _, _, _, _, lonr in BASINS:
        if lonr:
            i = names.index(k)
            lab[(lab == i) & ((lon_px < lonr[0]) | (lon_px > lonr[1]))] = -3
    lab = fill_unknown(lab, pg.land)
    from bookmap import majority
    lab = majority(lab, pg.land, len(names), 21)
    out = []
    for k, name, kind, color, _, _ in BASINS:
        g = clip(pg.geom((lab == names.index(k)).astype(np.uint8), 2.0), min_part=0.01, min_hole=5)
        out.append(feature(name, g, key=k, kind=kind, color=color))
    return out


# ---------------------------------------------------------------- deprem bölgeleri (kitap s.33)
QUAKE = [
    (1, "1. derece deprem bölgesi", "Çok şiddetli ve yıkıcı depremler", "#EF8A63", [(242, 143, 105)]),
    (2, "2. derece deprem bölgesi", "Şiddetli depremler", "#F5C689", [(244, 198, 133)]),
    (3, "3. derece deprem bölgesi", "Orta şiddetli depremler", "#C09CCC", [(192, 156, 204)]),
    (4, "4. derece deprem bölgesi", "Az şiddetli depremler", "#A6CCA1", [(166, 204, 161)]),
    (5, "5. derece deprem bölgesi", "Hafif şiddetli depremler", "#F5CDE8", [(245, 205, 232)]),
]


def quake():
    pg = Page(32)
    pal = {str(d): cols for d, _, _, _, cols in QUAKE}
    lab, names = classify(pg.img, pg.land, pal, max_dist=30, smooth=0, min_area=0)
    lab = fill_unknown(lab, pg.land)
    from bookmap import majority
    lab = majority(lab, pg.land, len(names), 15)
    out = []
    for d, name, desc, color, _ in QUAKE:
        g = clip(pg.geom((lab == names.index(str(d))).astype(np.uint8), 2.0), min_part=0.005)
        out.append(feature(name, g, degree=d, desc=desc, color=color))
    return out


def lon_grid(pg):
    xs = np.arange(pg.a.shape[1])
    ymid = pg.a.shape[0] // 2
    row = np.array([px_to_lonlat(pg.T, float(x), float(ymid))[0] for x in xs[::8]])
    return np.broadcast_to(np.interp(xs, xs[::8], row)[None, :], pg.a.shape[:2])


def fill_unknown(lab, land):
    from bookmap import _nearest_index
    unknown = (lab < 0) & (land == 1)
    known = (lab >= 0).astype(np.uint8)
    _, idx = _nearest_index(known)
    lab = np.where(unknown, lab.reshape(-1)[idx].reshape(lab.shape), lab)
    lab[land == 0] = -1
    return lab


# ---------------------------------------------------------------- kıvrım dağları (kitap s.55)
FOLD_ANCHORS = {
    "Yıldız Dağları": [(27.59, 41.67)], "Küre Dağları": [(33.93, 41.73)], "Yalnızçam Dağları": [(42.33, 41.15)],
    "Ilgaz Dağları": [(33.82, 41.17)], "Bolu Dağları": [(31.69, 40.88)], "Samanlı Dağları": [(30.04, 40.64)],
    "Canik Dağları": [(35.43, 40.92), (35.96, 40.85)], "Kaçkar Dağları": [(40.44, 40.73)],
    "Allahuekber Dağları": [(42.64, 40.72)], "Köroğlu Dağları": [(32.93, 40.63)], "Mescit Dağları": [(40.9, 40.41)],
    "Giresun Dağları": [(37.94, 40.5)], "Sündiken Dağları": [(31.02, 39.95)], "Palandöken Dağları": [(41.12, 39.78)],
    "Mercan Dağları": [(39.21, 39.5)], "Tecer Dağları": [(36.47, 39.22)], "Tahtalı Dağları": [(36.25, 38.51)],
    "Güneydoğu Toroslar": [(39.89, 38.41)], "Hakkâri Dağları": [(43.06, 37.94), (44.05, 37.5)],
    "Sultan Dağları": [(31.28, 38.4)], "Dedegöl Dağları": [(31.24, 37.75)], "Aladağlar": [(35.11, 37.83)],
    "Geyik Dağları": [(32.26, 37.04)], "Bolkar Dağları": [(34.08, 37.07)], "Bey Dağları": [(30.09, 36.66)],
}


def stroke_line(pg, m, bins=14):
    """Kalın fırça izini ana ekseni boyunca örnekleyip çoklu çizgiye çevirir."""
    ys, xs = np.nonzero(m)
    pts = np.stack([xs, ys], 1).astype(float)
    c = pts.mean(0)
    u, s, vt = np.linalg.svd(pts - c, full_matrices=False)
    t = (pts - c) @ vt[0]
    edges = np.linspace(t.min(), t.max(), bins + 1)
    line = []
    for a, b in zip(edges[:-1], edges[1:]):
        sel = (t >= a) & (t <= b)
        if sel.sum() >= 3:
            line.append(pts[sel].mean(0))
    return [px_to_lonlat(pg.T, float(x), float(y)) for x, y in line]


def folds():
    pg = Page(54)
    A = pg.a.astype(int)
    m = (A.sum(2) < 250).astype(np.uint8) & pg.land
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    anchors = {f"{k}#{i}": p for k, ps in FOLD_ANCHORS.items() for i, p in enumerate(ps)}
    comps = components(pg, m, 150)
    out = []
    for name in FOLD_ANCHORS:
        lines = []
        for cm, lon, lat in comps:
            best = min(anchors, key=lambda k: (anchors[k][0] - lon) ** 2 + (anchors[k][1] - lat) ** 2)
            if best.split("#")[0] == name and ((anchors[best][0] - lon) ** 2 + (anchors[best][1] - lat) ** 2) < 0.02:
                lines.append([(round(x, 3), round(y, 3)) for x, y in stroke_line(pg, cm)])
        if not lines:
            print("  ! kıvrım dağı bulunamadı:", name)
            continue
        lines.sort(key=lambda l: l[0][0])
        out.append({"name": name, "lines": lines})
    return out


def main():
    geo = json.loads(GEO.read_text(encoding="utf-8"))
    book = geo.get("book", {})
    steps = {"soils": soils, "plateaus": plateaus, "massifs": massifs, "plains": plains,
             "basins": basins, "quake": quake, "folds": folds}
    only = sys.argv[1:] or list(steps)
    for k in only:
        print("•", k)
        book[k] = steps[k]()
        print(f"  {len(book[k])} öğe")
    geo["book"] = book
    GEO.write_text(json.dumps(geo, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("geo.json güncellendi")


if __name__ == "__main__":
    main()
