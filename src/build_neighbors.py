import json
import math
from pathlib import Path

from shapely.geometry import box, shape

ROOT = Path(__file__).resolve().parent
NATURAL_EARTH = Path("/tmp/kpss-geo/ne_50m_admin_0_countries.geojson")
GEO_PATH = ROOT / "geo.json"

LON0, LAT1, KX, KY = 24.3, 43.6, 77.7, 100.0
WANTED = {
    "GRC": ("Yunanistan", "#6D8594"),
    "BGR": ("Bulgaristan", "#6D8594"),
    "GEO": ("Gürcistan", "#6D8594"),
    "ARM": ("Ermenistan", "#6D8594"),
    "AZE": ("Azerbaycan (Nahçıvan dahil)", "#6D8594"),
    "IRN": ("İran", "#6D8594"),
    "IRQ": ("Irak", "#6D8594"),
    "SYR": ("Suriye", "#6D8594"),
}
MAP_BBOX = box(24.3, 34.0, 46.0, 43.6)


def project(lon, lat):
    return (lon - LON0) * KX, (LAT1 - lat) * KY


def rdp(points, epsilon):
    if len(points) < 3:
        return points
    ax, ay = points[0]
    bx, by = points[-1]
    dx, dy = bx - ax, by - ay
    length = math.hypot(dx, dy)
    best = -1
    index = 0
    for i, (px, py) in enumerate(points[1:-1], 1):
        distance = abs(dy * (px - ax) - dx * (py - ay)) / length if length else math.hypot(px - ax, py - ay)
        if distance > best:
            best, index = distance, i
    if best > epsilon:
        return rdp(points[: index + 1], epsilon)[:-1] + rdp(points[index:], epsilon)
    return [points[0], points[-1]]


def ring_path(ring):
    points = rdp([project(lon, lat) for lon, lat in ring], 0.45)
    if len(points) < 4:
        return ""
    return "M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in points) + "Z"


def geometry_path(geometry):
    polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
    paths = []
    for polygon in polygons:
        paths.append(ring_path(polygon[0]))
        for hole in polygon[1:]:
            paths.append(ring_path(hole))
    return "".join(paths)


natural_earth = json.loads(NATURAL_EARTH.read_text())
features = {f["properties"]["ADM0_A3"]: f for f in natural_earth["features"]}
missing = sorted(set(WANTED) - set(features))
if missing:
    raise SystemExit(f"Missing Natural Earth country codes: {', '.join(missing)}")

neighbors = []
for code, (name, color) in WANTED.items():
    geometry = features[code]["geometry"]
    country = shape(geometry)
    centroid = country.centroid
    visible = country.intersection(MAP_BBOX)
    label_point = visible.representative_point() if not visible.is_empty else country.representative_point()
    neighbors.append(
        {
            "id": code.lower(),
            "name": name,
            "path": geometry_path(geometry),
            "lon": round(centroid.x, 5),
            "lat": round(centroid.y, 5),
            "labelLon": round(label_point.x, 5),
            "labelLat": round(label_point.y, 5),
            "color": color,
            "source": "Natural Earth 50m admin-0",
        }
    )

geo = json.loads(GEO_PATH.read_text())
geo["neighbors"] = neighbors
GEO_PATH.write_text(json.dumps(geo, ensure_ascii=False, separators=(",", ":")))
print("neighbors:", ", ".join(n["name"] for n in neighbors))
