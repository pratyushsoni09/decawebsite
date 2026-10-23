"""
Download the CC0 furniture and decor models used by render.py from Poly Haven
(https://polyhaven.com, all assets CC0 1.0) into blender/assets/<id>/.

    python blender/fetch_assets.py
"""
import hashlib
import json
import os
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.join(HERE, "assets")
RES = "2k"
UA = {"User-Agent": "haven-oak-residences-renderer"}

ASSETS = [
    # seating
    "sofa_03", "modern_arm_chair_01", "mid_century_lounge_chair", "dining_chair_02", "gallinera_chair", "bar_chair_round_01",
    # tables
    "modern_coffee_table_01", "side_table_01", "dining_table", "round_wooden_table_02",
    # plants, lighting, walls, outdoor
    "potted_plant_01", "potted_plant_02", "modern_ceiling_lamp_01", "planter_box_02",
    "hanging_picture_frame_01", "hanging_picture_frame_02", "hanging_picture_frame_03",
    # decor
    "throw_pillows_01", "ceramic_vase_01", "ceramic_vase_02", "brass_vase_01", "brass_candleholders", "wooden_bowl_01",
    "chess_set", "book_encyclopedia_set_01",
]


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
        return r.read()


def fetch(asset_id):
    out = os.path.join(DEST, asset_id)
    files = json.loads(get(f"https://api.polyhaven.com/files/{asset_id}"))
    entry = files["gltf"][RES]["gltf"]
    targets = [(f"{asset_id}.gltf", entry["url"], entry.get("md5"))]
    targets += [(rel, v["url"], v.get("md5")) for rel, v in entry["include"].items()]
    total = 0
    for rel, url, md5 in targets:
        path = os.path.normpath(os.path.join(out, rel))
        if not path.startswith(out):
            raise ValueError(f"unexpected path in listing: {rel}")
        if os.path.exists(path) and md5 and hashlib.md5(open(path, "rb").read()).hexdigest() == md5:
            total += os.path.getsize(path)
            continue
        data = get(url)
        if md5 and hashlib.md5(data).hexdigest() != md5:
            raise ValueError(f"checksum mismatch for {asset_id}/{rel}")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(data)
        total += len(data)
    print(f"{asset_id}: {total / 1e6:.1f} MB")


if __name__ == "__main__":
    os.makedirs(DEST, exist_ok=True)
    for a in ASSETS:
        fetch(a)
    with open(os.path.join(DEST, "LICENSE.txt"), "w") as f:
        f.write("All models in this folder are from Poly Haven (https://polyhaven.com) and are licensed CC0 1.0.\n")
