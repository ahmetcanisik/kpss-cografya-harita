"""Kitap (docs/source.pdf) haritalarını coğrafi koordinata oturtma yardımcıları.

Her kitap haritası sayfası için Türkiye kara maskesi çıkarılır ve gerçek
Türkiye sınırı (il.json birleşimi) ile en iyi örtüşmeyi (IoU) veren
x = a*lon + b, y = c*merc(lat) + d dönüşümü bulunur. Sonra renk maskeleri
bu dönüşümün tersiyle boylam/enleme çevrilir.
"""
import json
import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw
from shapely.geometry import shape, Polygon, MultiPolygon
from shapely.ops import unary_union

SRC = Path(__file__).resolve().parent
LON0, LAT1, KX, KY = 24.3, 43.6, 77.7, 100.0


def P(lon, lat):
    return ((lon - LON0) * KX, (LAT1 - lat) * KY)


def merc(lat):
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


def imerc(y):
    return math.degrees(2 * math.atan(math.exp(y)) - math.pi / 2)


_TURKEY = None


def turkey():
    """Türkiye (tüm iller birleşimi), lon/lat."""
    global _TURKEY
    if _TURKEY is None:
        il = json.loads((SRC / "il.json").read_text(encoding="utf-8"))
        _TURKEY = unary_union([shape(f["geometry"]) for f in il["features"]]).buffer(0)
    return _TURKEY


def mainland():
    t = turkey()
    if isinstance(t, MultiPolygon):
        return max(t.geoms, key=lambda g: g.area)
    return t


def land_mask(img, crop=None, white=232, sat=18, erase=(), hole_max=6000):
    """Beyaz olmayan (kara) pikseller -> en büyük bileşen, delikleri doldurulmuş."""
    a = np.asarray(img.convert("RGB")).astype(np.int16)
    mx = a.max(2)
    mn = a.min(2)
    m = ((mn < white) | ((mx - mn) > sat)).astype(np.uint8)
    if crop:
        x0, y0, x1, y1 = crop
        c = np.zeros_like(m)
        c[y0:y1, x0:x1] = 1
        m &= c
    for (x0, y0, x1, y1) in erase:
        m[y0:y1, x0:x1] = 0
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    m = (lab == big).astype(np.uint8)
    inv = (1 - m).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(inv, 4)
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        touches = x == 0 or y == 0 or x + w >= m.shape[1] or y + h >= m.shape[0]
        if not touches and area < hole_max:
            m[lab == i] = 1
    return m


def _terms(lon, lat):
    x = (np.asarray(lon) - 35.0) / 10.0
    y = (np.asarray(lat) - 39.0) / 10.0
    return np.stack([np.ones_like(x), x, y, x * x, x * y, y * y], -1)


def _outline_pts(geom, step=0.02):
    ring = geom.exterior
    n = max(200, int(ring.length / step))
    return np.array([ring.interpolate(i / n, normalized=True).coords[0] for i in range(n)])


def fit(mask, iters=60):
    """Kara maskesinin dış konturuna Türkiye anakarasını ICP ile oturtur.

    Dönüşüm: lon/lat -> piksel, 2. derece polinom (kitaptaki konik projeksiyonu
    ve baskı kaymalarını karşılar)."""
    from scipy.spatial import cKDTree
    ml = mainland()
    geo = _outline_pts(ml)
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    book = max(cnts, key=cv2.contourArea)[:, 0, :].astype(float)
    book = book[:: max(1, len(book) // 4000)]
    tree_book = cKDTree(book)
    # başlangıç: sınır kutusu eşlemesi
    minx, miny = book.min(0)
    maxx, maxy = book.max(0)
    lx0, ly0, lx1, ly1 = ml.bounds
    A = _terms(geo[:, 0], geo[:, 1])
    tx = minx + (geo[:, 0] - lx0) / (lx1 - lx0) * (maxx - minx)
    ty = miny + (ly1 - geo[:, 1]) / (ly1 - ly0) * (maxy - miny)
    cx = np.linalg.lstsq(A, tx, rcond=None)[0]
    cy = np.linalg.lstsq(A, ty, rcond=None)[0]
    for it in range(iters):
        px = np.stack([A @ cx, A @ cy], 1)
        d, idx = tree_book.query(px)
        # ters yön: kitap noktası -> en yakın dönüştürülmüş coğrafi nokta
        tree_px = cKDTree(px)
        d2, idx2 = tree_px.query(book)
        thr = max(np.percentile(d, 80), 3.0)
        keep = d < thr
        keep2 = d2 < max(np.percentile(d2, 80), 3.0)
        AA = np.vstack([A[keep], A[idx2[keep2]]])
        bx = np.concatenate([book[idx[keep], 0], book[keep2, 0]])
        by = np.concatenate([book[idx[keep], 1], book[keep2, 1]])
        cx = np.linalg.lstsq(AA, bx, rcond=None)[0]
        cy = np.linalg.lstsq(AA, by, rcond=None)[0]
    px = np.stack([A @ cx, A @ cy], 1)
    d, _ = tree_book.query(px)
    T = {"cx": cx, "cy": cy}
    T["inv"] = _fit_inverse(T, ml.bounds)
    return T, float(np.median(d))


def _fit_inverse(T, bounds):
    lx0, ly0, lx1, ly1 = bounds
    g = np.array([(x, y) for x in np.linspace(lx0 - 1, lx1 + 1, 40) for y in np.linspace(ly0 - 1, ly1 + 1, 25)])
    A = _terms(g[:, 0], g[:, 1])
    px = A @ T["cx"]
    py = A @ T["cy"]
    # piksel -> lon/lat, 3. derece polinom
    u = (px - px.mean()) / px.std()
    v = (py - py.mean()) / py.std()
    B = np.stack([u ** i * v ** j for i in range(4) for j in range(4 - i)], 1)
    return {"mu": (px.mean(), px.std(), py.mean(), py.std()),
            "lon": np.linalg.lstsq(B, g[:, 0], rcond=None)[0],
            "lat": np.linalg.lstsq(B, g[:, 1], rcond=None)[0]}


def px_to_lonlat(T, x, y):
    mx, sx, my, sy = T["inv"]["mu"]
    u = (x - mx) / sx
    v = (y - my) / sy
    b = np.array([u ** i * v ** j for i in range(4) for j in range(4 - i)])
    return (float(b @ T["inv"]["lon"]), float(b @ T["inv"]["lat"]))


def lonlat_to_px(T, lon, lat):
    a = _terms(lon, lat)
    return (float(a @ T["cx"]), float(a @ T["cy"]))


def overlay(img, T, path):
    """Doğrulama için: gerçek Türkiye sınırını kitap görüntüsü üzerine çizer."""
    im = img.convert("RGB").copy()
    dr = ImageDraw.Draw(im)
    t = turkey()
    polys = t.geoms if isinstance(t, MultiPolygon) else [t]
    for p in polys:
        pts = [lonlat_to_px(T, x, y) for x, y in p.exterior.coords]
        dr.line(pts + [pts[0]], fill=(255, 0, 0), width=2)
    im.save(path)


def color_mask(img, colors, tol=40, land=None):
    """colors: [(r,g,b),...] listesine yakın pikseller."""
    a = np.asarray(img.convert("RGB")).astype(np.int32)
    m = np.zeros(a.shape[:2], dtype=bool)
    for col in colors:
        d = np.sqrt(((a - np.array(col)) ** 2).sum(2))
        m |= d < tol
    m = m.astype(np.uint8)
    if land is not None:
        m &= land
    return m


def clean(m, close=5, open_=3, min_area=150):
    if close:
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (close, close)))
    if open_:
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (open_, open_)))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    out = np.zeros_like(m)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= min_area:
            out[lab == i] = 1
    return out


def mask_to_geom(m, T, simplify_px=2.0):
    """İkili maske -> lon/lat shapely (Multi)Polygon."""
    cnts, hier = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    if hier is None:
        return Polygon()
    hier = hier[0]
    polys = []
    for i, cnt in enumerate(cnts):
        if hier[i][3] != -1:
            continue
        cnt = cv2.approxPolyDP(cnt, simplify_px, True)
        if len(cnt) < 3:
            continue
        shell = [px_to_lonlat(T, float(p[0][0]), float(p[0][1])) for p in cnt]
        holes = []
        j = hier[i][2]
        while j != -1:
            h = cv2.approxPolyDP(cnts[j], simplify_px, True)
            if len(h) >= 3:
                holes.append([px_to_lonlat(T, float(p[0][0]), float(p[0][1])) for p in h])
            j = hier[j][0]
        pg = Polygon(shell, holes).buffer(0)
        if not pg.is_empty:
            polys.append(pg)
    return unary_union(polys) if polys else Polygon()


def geom_to_path(g, nd=1):
    """lon/lat geometri -> proje SVG path (build_geo2.py ile aynı projeksiyon)."""
    if g.is_empty:
        return ""
    polys = g.geoms if hasattr(g, "geoms") else [g]
    out = []
    for p in polys:
        if p.geom_type != "Polygon" or p.is_empty:
            continue
        for ring in [p.exterior, *p.interiors]:
            pts = [P(x, y) for x, y in ring.coords]
            if len(pts) < 4:
                continue
            out.append("M" + "L".join(f"{x:.{nd}f},{y:.{nd}f}" for x, y in pts[:-1]) + "Z")
    return "".join(out)


def classify(img, land, palette, max_dist=48, smooth=9, min_area=250):
    """Kara pikselini en yakın lejant rengine atar.

    palette: {sınıf: [(r,g,b), ...]}. Uzak pikseller (çizgi, yazı) en yakın
    sınıflı komşudan doldurulur; sonra çoğunluk süzgeci ve küçük parça temizliği.
    Dönüş: (etiket dizisi [-1 = kara dışı], sınıf adları)."""
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    a = cv2.GaussianBlur(a, (3, 3), 0)
    names = list(palette)
    best = np.full(a.shape[:2], 1e9, np.float32)
    lab = np.full(a.shape[:2], -1, np.int32)
    for i, n in enumerate(names):
        for col in palette[n]:
            d = np.sqrt(((a - np.array(col, np.float32)) ** 2).sum(2))
            upd = d < best
            best[upd] = d[upd]
            lab[upd] = i
    lab[best > max_dist] = -1
    lab[land == 0] = -1
    # bilinmeyenleri en yakın bilinen pikselden doldur
    unknown = ((lab == -1) & (land == 1)).astype(np.uint8)
    if unknown.any():
        known = (lab >= 0).astype(np.uint8)
        _, idx = _nearest_index(known)
        lab_f = lab.reshape(-1)[idx].reshape(lab.shape)
        lab = np.where(unknown == 1, lab_f, lab)
    lab = majority(lab, land, len(names), smooth)
    # küçük parçaları komşu çoğunluğuna kat
    for _ in range(2):
        for i in range(len(names)):
            m = (lab == i).astype(np.uint8)
            n, cc, stats, _ = cv2.connectedComponentsWithStats(m, 8)
            small = np.zeros_like(m)
            for j in range(1, n):
                if stats[j, cv2.CC_STAT_AREA] < min_area:
                    small[cc == j] = 1
            if small.any():
                lab[small == 1] = -2
        hole = (lab == -2)
        if hole.any():
            known = ((lab >= 0)).astype(np.uint8)
            _, idx = _nearest_index(known)
            lab = np.where(hole, lab.reshape(-1)[idx].reshape(lab.shape), lab)
    lab[land == 0] = -1
    return lab, names


def _nearest_index(known):
    """known==1 piksellerinden her piksele en yakın olanın düz indeksini verir."""
    inv = (1 - known).astype(np.uint8)
    dist, labels = cv2.distanceTransformWithLabels(inv, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    ys, xs = np.nonzero(known == 1)
    # label k -> k'nıncı sıfır pikseli (tarama sırası)
    order = np.zeros(labels.max() + 1, np.int64)
    zl = labels[known == 1]
    order[zl] = ys * known.shape[1] + xs
    return dist, order[labels].reshape(-1)


def majority(lab, land, n, k):
    if not k:
        return lab
    acc = np.zeros(lab.shape + (n,), np.float32)
    for i in range(n):
        acc[..., i] = cv2.blur((lab == i).astype(np.float32), (k, k))
    out = acc.argmax(2).astype(np.int32)
    out[land == 0] = -1
    return out


def raster_turkey(T, hw, geom=None):
    """Gerçek Türkiye sınırını kitap sayfası piksel uzayında maskeler."""
    g = geom if geom is not None else turkey()
    im = Image.new("L", (hw[1], hw[0]), 0)
    dr = ImageDraw.Draw(im)
    for p in (g.geoms if hasattr(g, "geoms") else [g]):
        dr.polygon([lonlat_to_px(T, x, y) for x, y in p.exterior.coords], fill=1)
        for r in p.interiors:
            dr.polygon([lonlat_to_px(T, x, y) for x, y in r.coords], fill=0)
    return np.asarray(im, dtype=np.uint8).copy()
