"""
Fetch the surroundings of The Oak Residences, Kudasan, Gandhinagar and write them in the residence's plan
metres to src/data/kudasan.json. The tower's centre (plan 12, 8) sits on ORIGIN; plan y runs south.

Everything comes from Overture Maps (ODbL / CC BY 4.0: Google Open Buildings, Microsoft ML Buildings and
OpenStreetMap), through the `overturemaps` CLI (pip install overturemaps):

  * near ring, to NEAR m: every building footprint (heights from `num_floors` where known, otherwise estimated
    from the footprint), every street, every green, pond, tree and named place (malls, cinemas, shops…)
  * far ring, to FAR m: the skyline only, the bigger or taller buildings, the main roads and their bridges,
    the Sabarmati and the lakes, parks, farmland and woods

    python scripts/fetch_kudasan.py [--cache DIR]   (DIR keeps the raw downloads between runs)
"""
import json
import math
import os
import subprocess
import sys
import tempfile
import time

ORIGIN = (23.1704419, 72.6234269)  # Kudasan, Gandhinagar (Nominatim)
NEAR = 1800
FAR = 7000
TOWER_CENTRE = (12.0, 8.0)
# the tower's own plot (terrace, entrance path, garden) is kept clear
PLOT = (-22.0, -20.0, 46.0, 64.0)
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data", "kudasan.json")

ROAD_WIDTH = {"motorway": 20, "trunk": 16, "primary": 14, "secondary": 11, "tertiary": 9, "residential": 6.5,
              "unclassified": 6, "living_street": 5, "service": 4, "unknown": 5}
FAR_ROADS = {"motorway", "trunk", "primary", "secondary", "tertiary"}
SKIP_ROADS = {"footway", "path", "steps", "cycleway", "track", "pedestrian", "bridleway", "sidewalk", "crosswalk",
              "standard_gauge", "subway", "monorail", "tram", "light_rail", "narrow_gauge", "funicular"}
GREEN_KIND = {"park": "park", "grass": "grass", "garden": "garden", "pitch": "pitch", "playground": "grass",
              "recreation_ground": "park", "track": "grass", "stadium": "pitch", "farmland": "farm", "orchard": "farm",
              "forest": "forest", "wood": "forest", "scrub": "scrub", "grassland": "scrub", "construction": "dirt",
              "greenfield": "scrub", "cemetery": "park", "zoo": "park", "camp_site": "scrub", "meadow": "grass",
              "residential": "urban", "commercial": "urban", "industrial": "urban", "retail": "urban", "garages": "urban"}
WATER_KIND = {"river": "river", "lake": "lake", "pond": "lake", "reservoir": "lake", "canal": "canal", "water": "lake",
              "swimming_pool": "pool"}
BUILDING_CLASS = {"commercial": "com", "retail": "com", "office": "com", "industrial": "ind", "warehouse": "ind",
                  "education": "edu", "school": "edu", "university": "edu", "college": "edu", "civic": "civ",
                  "government": "civ", "religious": "rel", "church": "rel", "temple": "rel", "mosque": "rel",
                  "medical": "med", "hospital": "med", "transportation": "civ", "train_station": "civ"}
# named places worth a sign: (keywords in the name, kind)
POI_KINDS = [
    (("multiplex", "cinema", "cinepolis", " pvr", "inox", "theatre", "theater", "big cinemas"), "cinema"),
    (("mall", "arcade", "plaza", "square", "complex", "galleria"), "mall"),
    (("hospital", "clinic", "medical", "pharmacy", "medicos", "diagnostic"), "hospital"),
    (("school", "vidyalaya", "academy", "college", "institute", "university"), "school"),
    (("hotel", "residency", "inn", "lodge"), "hotel"),
    (("bank", " atm", "finance"), "bank"),
    (("cafe", "café", "coffee", "restaurant", "pizza", "dhaba", "dining", "bakery", "sweets", "ice cream", "juice",
      "foods", "kitchen", "bhojanalay", "tiffin", "chai", "tea"), "cafe"),
    (("mandir", "temple", "derasar", "masjid", "church", "gurudwara", "swaminarayan"), "temple"),
    (("super market", "supermarket", "mart", "store", "stores", "general store", "kirana", "provision", "bazaar",
      "bazar", "shop", "shoppe", "emporium", "fashion", "garments", "boutique", "footwear", "mobile", "electronics",
      "furniture", "hardware", "jewellers", "jewelers", "salon", "saloon", "parlour", "gym", "fitness", "optical",
      "books", "stationery", "dairy", "medical store", "showroom", "motors", "automobile", "tyres", "travels", "studio"), "shop"),
]
SIGN_WORTHY_CLASSES = {"cinema", "mall", "shop", "cafe", "hotel", "hospital", "bank"}


def to_plan(lat, lon):
    lat0, lon0 = ORIGIN
    x = TOWER_CENTRE[0] + (lon - lon0) * math.cos(math.radians(lat0)) * 111320.0
    y = TOWER_CENTRE[1] - (lat - lat0) * 110574.0
    return round(x, 1), round(y, 1)


def dist(x, y):
    return math.hypot(x - TOWER_CENTRE[0], y - TOWER_CENTRE[1])


def in_plot(x, y):
    return PLOT[0] <= x <= PLOT[2] and PLOT[1] <= y <= PLOT[3]


def ring_area(ring):
    a = 0.0
    for i in range(len(ring)):
        x1, y1 = ring[i]
        x2, y2 = ring[(i + 1) % len(ring)]
        a += x1 * y2 - x2 * y1
    return abs(a) / 2


def centroid(ring):
    return sum(p[0] for p in ring) / len(ring), sum(p[1] for p in ring) / len(ring)


def simplify(ring, tol):
    """Douglas–Peucker on a closed ring (so distant footprints carry a handful of corners, not fifty)."""
    if len(ring) <= 4:
        return ring

    def dp(pts):
        if len(pts) < 3:
            return pts
        (ax, ay), (bx, by) = pts[0], pts[-1]
        dx, dy = bx - ax, by - ay
        n = math.hypot(dx, dy) or 1e-9
        best, idx = 0.0, 0
        for i in range(1, len(pts) - 1):
            d = abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / n
            if d > best:
                best, idx = d, i
        if best > tol:
            return dp(pts[:idx + 1])[:-1] + dp(pts[idx:])
        return [pts[0], pts[-1]]

    # split at the point farthest from the first so the ring has two open halves
    far_i = max(range(1, len(ring)), key=lambda i: math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1]))
    out = dp(ring[:far_i + 1])[:-1] + dp(ring[far_i:] + [ring[0]])[:-1]
    return out if len(out) >= 3 else ring


def estimate_height(area, floors=None, height=None, seed=0):
    """Kudasan is mostly 3-7 storey residential with a few 10-14 storey blocks; bigger footprints run taller."""
    if height:
        return float(height)
    if floors:
        return floors * 3.1 + 1.2
    jitter = ((seed * 7919) % 100) / 100.0
    if area < 60:
        floors = 1 + (jitter > 0.6)
    elif area < 150:
        floors = 2 + round(jitter * 1.5)
    elif area < 400:
        floors = 3 + round(jitter * 2)
    elif area < 900:
        floors = 5 + round(jitter * 3)
    else:
        floors = 8 + round(jitter * 5)
    return floors * 3.1 + 1.2


def overture(kind, cache):
    """One Overture theme type over the FAR bounding box, as GeoJSON features (cached when asked)."""
    lat0, lon0 = ORIGIN
    dlat = FAR / 110574.0
    dlon = FAR / (111320.0 * math.cos(math.radians(lat0)))
    bbox = f"{lon0 - dlon:.5f},{lat0 - dlat:.5f},{lon0 + dlon:.5f},{lat0 + dlat:.5f}"
    out = os.path.join(cache, f"ov7k_{kind}.geojson")
    if not os.path.exists(out):
        t0 = time.time()
        subprocess.run([sys.executable, "-m", "overturemaps", "download", f"--bbox={bbox}", "-f", "geojson",
                        f"--type={kind}", "-o", out], check=True, capture_output=True)
        print(f"  {kind}: downloaded in {time.time() - t0:.0f}s")
    with open(out, encoding="utf8") as f:
        return json.load(f)["features"]


def rings_of(geom):
    if geom["type"] == "Polygon":
        return [geom["coordinates"][0]]
    if geom["type"] == "MultiPolygon":
        return [p[0] for p in geom["coordinates"]]
    return []


def lines_of(geom):
    if geom["type"] == "LineString":
        return [geom["coordinates"]]
    if geom["type"] == "MultiLineString":
        return list(geom["coordinates"])
    return []


def plan_ring(ring):
    pts = [to_plan(lat, lon) for lon, lat in ring]
    pts = pts[:-1] if pts[0] == pts[-1] else pts
    return [list(p) for p in pts]


def name_of(props):
    n = props.get("names")
    if isinstance(n, str):
        try:
            n = json.loads(n)
        except ValueError:
            return n
    return (n or {}).get("primary") if isinstance(n, dict) else None


def buildings(feats):
    near, far, landmarks = [], [], []
    for i, feat in enumerate(feats):
        props = feat["properties"]
        for ring in rings_of(feat["geometry"]):
            pts = plan_ring(ring)
            if len(pts) < 3 or any(in_plot(x, y) for x, y in pts):
                continue
            cx, cy = centroid(pts)
            d = dist(cx, cy)
            if d > FAR:
                continue
            area = ring_area(pts)
            floors = props.get("num_floors")
            h = round(estimate_height(area, floors, props.get("height"), i), 1)
            cls = BUILDING_CLASS.get(props.get("class") or "", BUILDING_CLASS.get(props.get("subtype") or "", "res"))
            if d <= NEAR:
                if area < 12:
                    continue
                b = {"p": pts, "h": h, "k": "tower" if h > 24 else "block"}
                if cls != "res":
                    b["c"] = cls
                near.append(b)
            else:
                # the skyline: what still reads from a balcony 2-7 km away
                coarse = [[round(x), round(y)] for x, y in simplify(pts, 3.0)]
                if h >= 40:
                    landmarks.append({"p": coarse, "h": h})
                elif area >= 260 or h >= 16:
                    far.append({"p": coarse, "h": h})
    return near, far, landmarks


def split_at(points, fractions):
    """Cut a polyline at length fractions, returning (piece, is_bridge) runs."""
    seg = [math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]) for i in range(len(points) - 1)]
    total = sum(seg) or 1e-9
    cuts = sorted({0.0, 1.0, *[min(max(f, 0.0), 1.0) for f in fractions]})
    pieces = []
    for a, b in zip(cuts, cuts[1:]):
        if b - a < 1e-6:
            continue
        piece = []
        acc = 0.0
        for i, s in enumerate(seg):
            s0, s1 = acc / total, (acc + s) / total
            acc += s
            if s1 < a or s0 > b:
                continue
            for f in (a, b) if not piece else (b,):
                if s0 <= f <= s1:
                    t = (f - s0) / ((s1 - s0) or 1e-9)
                    p = [round(points[i][0] + (points[i + 1][0] - points[i][0]) * t, 1),
                         round(points[i][1] + (points[i + 1][1] - points[i][1]) * t, 1)]
                    if not piece or piece[-1] != p:
                        piece.append(p)
            if s0 >= a and s1 <= b and (not piece or piece[-1] != list(points[i + 1])):
                piece.append(list(points[i + 1]))
        if len(piece) > 1:
            pieces.append((piece, (a, b)))
    return pieces


def roads(feats):
    out = []
    for feat in feats:
        props = feat["properties"]
        cls = props.get("class") or "unknown"
        if props.get("subtype") not in (None, "road") or cls in SKIP_ROADS:
            continue
        w = ROAD_WIDTH.get(cls, 5.0)
        bridges = []
        for flag in props.get("road_flags") or []:
            if "is_bridge" in (flag.get("values") or []):
                bridges.append(tuple(flag.get("between") or (0.0, 1.0)))
        for line in lines_of(feat["geometry"]):
            pts = [list(to_plan(lat, lon)) for lon, lat in line]
            if len(pts) < 2:
                continue
            cx, cy = centroid(pts)
            d = dist(cx, cy)
            if d > FAR or (d > NEAR and cls not in FAR_ROADS) or (d > 3500 and cls == "tertiary"):
                continue
            if d > NEAR:
                pts = [[round(x), round(y)] for x, y in pts]
            fractions = [f for a, b in bridges for f in (a, b)]
            for piece, (a, b) in split_at(pts, fractions):
                is_bridge = any(ba <= a + 1e-6 and b <= bb + 1e-6 for ba, bb in bridges)
                # split where the line crosses the tower plot
                run = []
                for x, y in piece:
                    if in_plot(x, y):
                        if len(run) > 1:
                            out.append({"p": run, "w": w, "c": cls, **({"b": 1} if is_bridge else {})})
                        run = []
                    else:
                        run.append([x, y])
                if len(run) > 1:
                    out.append({"p": run, "w": w, "c": cls, **({"b": 1} if is_bridge else {})})
    return out


def patches(feats, kinds, near_only=()):
    out = []
    for feat in feats:
        props = feat["properties"]
        kind = kinds.get(props.get("class") or "", kinds.get(props.get("subtype") or ""))
        if not kind:
            continue
        for ring in rings_of(feat["geometry"]):
            pts = plan_ring(ring)
            if len(pts) < 3 or any(in_plot(x, y) for x, y in pts):
                continue
            cx, cy = centroid(pts)
            d = dist(cx, cy)
            area = ring_area(pts)
            if d > FAR + 3000 or (kind in near_only and d > NEAR):
                continue
            if d > NEAR and area < 1500:
                continue
            out.append({"p": simplify(pts, 1.0 if d <= NEAR else 4.0), "k": kind, "n": name_of(props)} if name_of(props)
                       else {"p": simplify(pts, 1.0 if d <= NEAR else 4.0), "k": kind})
    return out


def trees(land_feats):
    pts = []
    for feat in land_feats:
        cls = feat["properties"].get("class")
        g = feat["geometry"]
        if cls == "tree" and g["type"] == "Point":
            x, y = to_plan(g["coordinates"][1], g["coordinates"][0])
            if not in_plot(x, y) and dist(x, y) <= NEAR:
                pts.append([x, y])
        elif cls == "tree_row":
            for line in lines_of(g):
                prev = None
                for lon, lat in line:
                    x, y = to_plan(lat, lon)
                    if prev is not None:
                        n = max(1, int(math.hypot(x - prev[0], y - prev[1]) / 8))
                        for k in range(n):
                            px = prev[0] + (x - prev[0]) * k / n
                            py = prev[1] + (y - prev[1]) * k / n
                            if not in_plot(px, py) and dist(px, py) <= NEAR:
                                pts.append([round(px, 1), round(py, 1)])
                    prev = (x, y)
    return pts


def places(feats, near_buildings):
    """Named places that would carry a sign, tied to the footprint they stand in (or the nearest within 30 m)."""
    cells = {}
    for i, b in enumerate(near_buildings):
        cx, cy = centroid(b["p"])
        cells.setdefault((int(cx // 50), int(cy // 50)), []).append((i, cx, cy))
    out = []
    seen = set()
    for feat in feats:
        name = name_of(feat["properties"])
        g = feat["geometry"]
        if not name or g["type"] != "Point":
            continue
        x, y = to_plan(g["coordinates"][1], g["coordinates"][0])
        if in_plot(x, y) or dist(x, y) > NEAR:
            continue
        low = " " + name.lower() + " "
        kind = next((k for words, k in POI_KINDS if any(w in low for w in words)), None)
        if kind is None or kind not in SIGN_WORTHY_CLASSES:
            continue
        # the sign reads as a shop name: the first few words, Latin script only
        short = " ".join(name.replace("|", " ").replace("-", " ").split()[:4])
        if not short.isascii() or len(short) < 3:
            continue
        best, best_d = None, 30.0
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for i, cx, cy in cells.get((int(x // 50) + dx, int(y // 50) + dy), []):
                    dd = math.hypot(cx - x, cy - y)
                    if dd < best_d:
                        best, best_d = i, dd
        key = (short.lower(), best)
        if key in seen:
            continue
        seen.add(key)
        poi = {"x": x, "y": y, "n": short, "k": kind}
        if best is not None:
            poi["b"] = best
        out.append(poi)
    return out


def main():
    cache = None
    if "--cache" in sys.argv:
        cache = sys.argv[sys.argv.index("--cache") + 1]
        os.makedirs(cache, exist_ok=True)
    cache = cache or tempfile.mkdtemp()
    print("fetching Overture Maps…")
    near, far, landmarks = buildings(overture("building", cache))
    road_list = roads(overture("segment", cache))
    greens = patches(overture("land_use", cache), GREEN_KIND, near_only=("dirt", "pitch", "garden"))
    greens += patches(overture("land", cache), GREEN_KIND)
    water = patches(overture("water", cache), WATER_KIND, near_only=("pool",))
    tree_pts = trees(overture("land", cache))
    pois = places(overture("place", cache), near)
    for lm in landmarks:
        lm["k"] = "landmark"
    out = {"origin": {"lat": ORIGIN[0], "lon": ORIGIN[1]}, "radius": NEAR, "far": FAR, "plot": PLOT,
           "attribution": "Map data: Overture Maps (Google Open Buildings, Microsoft ML Buildings, OpenStreetMap contributors), ODbL / CC BY 4.0",
           "buildings": near, "skyline": far + landmarks, "roads": road_list, "greens": greens, "water": water,
           "trees": tree_pts, "pois": pois}
    with open(OUT, "w", encoding="utf8") as f:
        json.dump(out, f, separators=(",", ":"), ensure_ascii=False)
    from collections import Counter
    print(f"near buildings {len(near)} ({sum(1 for b in near if b['k'] == 'tower')} towers, "
          f"{Counter(b.get('c', 'res') for b in near).most_common()}), skyline {len(far)} + {len(landmarks)} landmarks, "
          f"roads {len(road_list)} ({sum(1 for r in road_list if r.get('b'))} bridge spans), greens {len(greens)} "
          f"{Counter(g['k'] for g in greens).most_common()}, water {len(water)} {Counter(w['k'] for w in water).most_common()}, "
          f"trees {len(tree_pts)}, places {len(pois)} {Counter(p['k'] for p in pois).most_common()}; {os.path.getsize(OUT) // 1024} KB")


if __name__ == "__main__":
    main()
