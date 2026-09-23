import json, math, sys
sys.setrecursionlimit(100000)
LON0, LAT1, KX, KY = 24.3, 43.6, 77.7, 100.0
def proj(p): return ((p[0]-LON0)*KX, (LAT1-p[1])*KY)
def rdp(pts, eps):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0]-a[0], b[1]-a[1]
    L = math.hypot(dx, dy)
    best, idx = -1, 0
    for i in range(1, len(pts)-1):
        p = pts[i]
        d = abs(dy*(p[0]-a[0]) - dx*(p[1]-a[1]))/L if L else math.hypot(p[0]-a[0], p[1]-a[1])
        if d > best: best, idx = d, i
    if best > eps:
        return rdp(pts[:idx+1], eps)[:-1] + rdp(pts[idx:], eps)
    return [a, b]
def ring_path(ring, eps):
    pts = [proj(p) for p in ring]
    pts = rdp(pts, eps)
    if len(pts) < 4: return ''
    return 'M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z'
def geom_path(g, eps, minpts=0):
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    out = []
    for poly in polys:
        if len(poly[0]) < minpts: continue
        out.append(ring_path(poly[0], eps))
    return ''.join(out)

tur = json.load(open('/home/claude/tur10.json'))
turd = geom_path(tur, 0.35)   # units (~0.0045 deg lon)
d50 = json.load(open('/home/claude/ne_50m_admin_0_countries.geojson'))
vb = (24.3, 34.0, 46.0, 43.6)
neigh = []
for f in d50['features']:
    p = f['properties']
    if p.get('ADM0_A3') == 'TUR': continue
    g = f['geometry']
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    keep = []
    for poly in polys:
        xs = [c[0] for c in poly[0]]; ys = [c[1] for c in poly[0]]
        if max(xs) < vb[0] or min(xs) > vb[2] or max(ys) < vb[1] or min(ys) > vb[3]: continue
        keep.append(poly)
    if keep:
        neigh.append(ring_path_all := ''.join(ring_path(pl[0], 0.8) for pl in keep))
json.dump({'tur': turd, 'neigh': ''.join(neigh)}, open('geo.json', 'w'))
print(len(turd), len(''.join(neigh)))
