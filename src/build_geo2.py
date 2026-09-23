import json, math
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

LON0, LAT1, KX, KY = 24.3, 43.6, 77.7, 100.0
def P(lon,lat): return ((lon-LON0)*KX, (LAT1-lat)*KY)

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
    pts = [P(*p) for p in ring]
    pts = rdp(pts, eps)
    if len(pts) < 4: return ''
    return 'M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z'

def geom_path(geom, eps):
    gj = mapping(geom)
    polys = gj['coordinates'] if gj['type'] == 'MultiPolygon' else [gj['coordinates']]
    out = []
    for poly in polys:
        out.append(ring_path(poly[0], eps))
        # holes (rare for provinces/lakes) - include too
        for hole in poly[1:]:
            out.append(ring_path(hole, eps))
    return ''.join(out)

# ---------- provinces ----------
il = json.load(open('il.json'))
NAME_FIX = {"Afyon":"Afyonkarahisar","Hakkari":"Hakkâri"}

BOLGE_ILLER = {
"Marmara":["Balıkesir","Bilecik","Bursa","Çanakkale","Edirne","İstanbul","Kırklareli","Kocaeli","Sakarya","Tekirdağ","Yalova"],
"Ege":["Afyonkarahisar","Aydın","Denizli","İzmir","Kütahya","Manisa","Muğla","Uşak"],
"Akdeniz":["Adana","Antalya","Burdur","Hatay","Isparta","Kahramanmaraş","Mersin","Osmaniye"],
"Karadeniz":["Amasya","Artvin","Bartın","Bayburt","Bolu","Çorum","Düzce","Giresun","Gümüşhane","Karabük","Kastamonu","Ordu","Rize","Samsun","Sinop","Tokat","Trabzon","Zonguldak"],
"İç Anadolu":["Aksaray","Ankara","Çankırı","Eskişehir","Karaman","Kayseri","Kırıkkale","Kırşehir","Konya","Nevşehir","Niğde","Sivas","Yozgat"],
"Doğu Anadolu":["Ağrı","Ardahan","Bingöl","Bitlis","Elazığ","Erzincan","Erzurum","Hakkâri","Iğdır","Kars","Malatya","Muş","Tunceli","Van"],
"Güneydoğu Anadolu":["Adıyaman","Batman","Diyarbakır","Gaziantep","Kilis","Mardin","Siirt","Şanlıurfa","Şırnak"]
}
REGION_COLORS = {
"Marmara":"#3D6EA5","Ege":"#2F8F76","Akdeniz":"#1E9DB0","Karadeniz":"#4C7A3E",
"İç Anadolu":"#C08A2E","Doğu Anadolu":"#8A4FB0","Güneydoğu Anadolu":"#C1602E"
}
name2key = {}
for k,v in BOLGE_ILLER.items():
    for n in v: name2key[n]=k

prov_out = []
all_geoms = []
region_geoms = {k:[] for k in BOLGE_ILLER}
for f in il['features']:
    nm = f['properties']['name']
    nm_fixed = NAME_FIX.get(nm, nm)
    key = name2key.get(nm_fixed)
    if key is None:
        print('UNMAPPED', nm); continue
    geom = shape(f['geometry'])
    all_geoms.append(geom)
    region_geoms[key].append(geom)
    path = geom_path(geom, 0.12)
    prov_out.append({"name": nm_fixed, "region": key, "color": REGION_COLORS[key], "path": path})

print('provinces done', len(prov_out))

# country outline = dissolve all provinces
country = unary_union(all_geoms)
country_path = geom_path(country, 0.32)

# region centroids (accurate) + dissolved boundary path (for reference / optional)
region_meta = {}
for k, geoms in region_geoms.items():
    u = unary_union(geoms)
    c = u.centroid
    region_meta[k] = {"lon": c.x, "lat": c.y}

# ---------- lakes (real polygons from Natural Earth) ----------
lakes = json.load(open('lakes10.json'))
WANT = {"Lake Van":"Van Gölü","Lake Tuz":"Tuz Gölü","Beyşehir":"Beyşehir Gölü","Eğirdir":"Eğirdir Gölü"}
lake_out = []
for f in lakes['features']:
    nm = f['properties'].get('name')
    if nm in WANT:
        geom = shape(f['geometry'])
        c = geom.centroid
        lake_out.append({"name": WANT[nm], "path": geom_path(geom, 0.05), "lon": c.x, "lat": c.y})
print('lakes real', [l['name'] for l in lake_out])

json.dump({
    "tur": country_path,
    "prov": prov_out,
    "lakesReal": lake_out,
    "regionMeta": region_meta
}, open('geo2.json','w'))
print('OK')
