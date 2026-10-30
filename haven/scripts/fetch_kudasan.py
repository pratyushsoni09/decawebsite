"""
Fetch the surroundings of central Kudasan, Gandhinagar and write them in the residence's plan metres
to src/data/kudasan.json. The tower's centre (plan 12, 8) sits on ORIGIN; plan y runs south.

  * building footprints: Overture Maps (Google Open Buildings and Microsoft ML Buildings, ODbL / CC BY 4.0),
    via the `overturemaps` CLI (pip install overturemaps). Heights come from `num_floors` where known and
    are otherwise estimated from the footprint, so the massing is indicative, not surveyed.
  * streets, greens, water, trees: OpenStreetMap via the Overpass API (© OpenStreetMap contributors, ODbL).

    python scripts/fetch_kudasan.py
"""
import json
import math
import os
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request

ORIGIN = (23.1704419, 72.6234269)  # Kudasan, Gandhinagar (Nominatim)
RADIUS = 700
TOWER_CENTRE = (12.0, 8.0)
# the tower's own plot (terrace, entrance path, garden) is kept clear
PLOT = (-22.0, -20.0, 46.0, 64.0)
ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data", "kudasan.json")

QUERY = f"""
[out:json][timeout:90];
(
  way["building"](around:{RADIUS},{ORIGIN[0]},{ORIGIN[1]});
  way["highway"](around:{RADIUS},{ORIGIN[0]},{ORIGIN[1]});
  way["landuse"~"grass|park|meadow|recreation_ground|village_green|forest|farmland"](around:{RADIUS},{ORIGIN[0]},{ORIGIN[1]});
  way["leisure"~"park|garden|pitch|playground"](around:{RADIUS},{ORIGIN[0]},{ORIGIN[1]});
  way["natural"~"water|wood|scrub|grassland"](around:{RADIUS},{ORIGIN[0]},{ORIGIN[1]});
  node["natural"="tree"](around:{RADIUS},{ORIGIN[0]},{ORIGIN[1]});
);
out geom tags;
"""

ROAD_WIDTH = {"trunk": 16, "primary": 14, "secondary": 11, "tertiary": 9, "residential": 6.5, "unclassified": 6,
              "living_street": 5, "service": 4, "trunk_link": 8, "primary_link": 8, "secondary_link": 7}


def to_plan(lat, lon):
    lat0, lon0 = ORIGIN
    x = TOWER_CENTRE[0] + (lon - lon0) * math.cos(math.radians(lat0)) * 111320.0
    y = TOWER_CENTRE[1] - (lat - lat0) * 110574.0
    return round(x, 2), round(y, 2)


def in_plot(x, y):
    return PLOT[0] <= x <= PLOT[2] and PLOT[1] <= y <= PLOT[3]


def ring_area(ring):
    a = 0.0
    for i in range(len(ring)):
        x1, y1 = ring[i]
        x2, y2 = ring[(i + 1) % len(ring)]
        a += x1 * y2 - x2 * y1
    return abs(a) / 2


def estimate_height(area, floors=None, seed=0):
    """Kudasan is mostly 3-7 storey residential with a few 10-14 storey blocks; bigger footprints run taller."""
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


def overture_buildings():
    """Overture building footprints inside the fetch radius, as plan-metre rings with heights."""
    lat0, lon0 = ORIGIN
    dlat = RADIUS / 110574.0
    dlon = RADIUS / (111320.0 * math.cos(math.radians(lat0)))
    bbox = f"{lon0 - dlon:.5f},{lat0 - dlat:.5f},{lon0 + dlon:.5f},{lat0 + dlat:.5f}"
    out = os.path.join(tempfile.mkdtemp(), "buildings.geojson")
    subprocess.run([sys.executable, "-m", "overturemaps", "download", f"--bbox={bbox}", "-f", "geojson",
                    "--type=building", "-o", out], check=True, capture_output=True)
    with open(out, encoding="utf8") as f:
        fc = json.load(f)
    result = []
    for i, feat in enumerate(fc["features"]):
        geom = feat["geometry"]
        rings = [geom["coordinates"][0]] if geom["type"] == "Polygon" else [p[0] for p in geom["coordinates"]]
        for ring in rings:
            pts = [to_plan(lat, lon) for lon, lat in ring]
            pts = pts[:-1] if pts[0] == pts[-1] else pts
            if len(pts) < 3 or any(in_plot(x, y) for x, y in pts):
                continue
            if max(math.hypot(x - TOWER_CENTRE[0], y - TOWER_CENTRE[1]) for x, y in pts) > RADIUS:
                continue
            area = ring_area(pts)
            if area < 12:
                continue
            floors = feat["properties"].get("num_floors")
            result.append({"p": [list(p) for p in pts], "h": round(estimate_height(area, floors, i), 1),
                           "k": "tower" if estimate_height(area, floors, i) > 24 else "block"})
    return result


def height_of(tags):
    for key in ("height", "building:height"):
        if key in tags:
            try:
                return float(tags[key].split()[0])
            except ValueError:
                pass
    if "building:levels" in tags:
        try:
            return float(tags["building:levels"]) * 3.2 + 1.0
        except ValueError:
            pass
    kind = tags.get("building")
    return {"apartments": 24.0, "commercial": 12.0, "office": 15.0, "school": 10.0, "university": 12.0,
            "hospital": 15.0, "house": 7.0, "residential": 9.0, "garage": 3.0, "shed": 3.0, "roof": 4.0}.get(kind, 8.0)


def main():
    data = None
    for attempt in range(6):  # public Overpass servers are busy at times; retry and fall back to a mirror
        endpoint = ENDPOINTS[attempt % len(ENDPOINTS)]
        req = urllib.request.Request(endpoint, data=urllib.parse.urlencode({"data": QUERY}).encode(),
                                     headers={"User-Agent": "haven-oak-residences (static site build)"})
        try:
            data = json.load(urllib.request.urlopen(req, timeout=120))
            break
        except Exception as err:  # noqa: BLE001
            print(f"{endpoint}: {err}; retrying")
            time.sleep(5 + attempt * 5)
    if data is None:
        raise SystemExit("Overpass unavailable; try again later")
    buildings, roads, greens, water, trees = [], [], [], [], []
    for el in data["elements"]:
        tags = el.get("tags", {})
        if el["type"] == "node":
            x, y = to_plan(el["lat"], el["lon"])
            if not in_plot(x, y):
                trees.append([x, y])
            continue
        pts = [to_plan(g["lat"], g["lon"]) for g in el.get("geometry", [])]
        if len(pts) < 2:
            continue
        if "building" in tags:
            if any(in_plot(x, y) for x, y in pts) or len(pts) < 4:
                continue
            ring = pts[:-1] if pts[0] == pts[-1] else pts
            sized = "height" in tags or "building:height" in tags or "building:levels" in tags
            buildings.append({"p": [list(p) for p in ring], "h": round(height_of(tags), 1), "k": "tower" if height_of(tags) > 24 else "block", "sized": sized})
        elif "highway" in tags:
            kind = tags["highway"]
            if kind in ("footway", "path", "steps", "cycleway", "track", "pedestrian", "corridor", "bridleway"):
                continue
            w = ROAD_WIDTH.get(kind, 5.0)
            # split where the line crosses the tower plot
            run = []
            for x, y in pts:
                if in_plot(x, y):
                    if len(run) > 1:
                        roads.append({"p": [list(p) for p in run], "w": w})
                    run = []
                else:
                    run.append((x, y))
            if len(run) > 1:
                roads.append({"p": [list(p) for p in run], "w": w})
        else:
            if any(in_plot(x, y) for x, y in pts):
                continue
            ring = [list(p) for p in (pts[:-1] if pts[0] == pts[-1] else pts)]
            if tags.get("natural") == "water":
                water.append(ring)
            else:
                greens.append(ring)
    # Overture has far more footprints here than OSM; keep OSM's only where they carry a real height
    osm_sized = [b for b in buildings if b.get("sized")]
    buildings = overture_buildings() + osm_sized
    out = {"origin": {"lat": ORIGIN[0], "lon": ORIGIN[1]}, "radius": RADIUS, "plot": PLOT,
           "attribution": "Buildings: Overture Maps (Google Open Buildings, Microsoft ML Buildings); streets and greens: © OpenStreetMap contributors",
           "buildings": buildings, "roads": roads,
           "greens": greens, "water": water, "trees": trees}
    for b in buildings:
        b.pop("sized", None)
    with open(OUT, "w", encoding="utf8") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"buildings {len(buildings)}, roads {len(roads)}, greens {len(greens)}, water {len(water)}, trees {len(trees)}; "
          f"{os.path.getsize(OUT) // 1024} KB")


if __name__ == "__main__":
    main()
