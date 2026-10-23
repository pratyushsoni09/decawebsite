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


# photo-scanned CC0 surface textures: id -> real-world size of one repeat in metres (from the Poly Haven listing)
TEXTURES = {
    "marble_01": 1.5,          # polished marble: hall, dining hall, kitchen, lobby
    "laminate_floor_02": 1.7,  # laminated wood: bedrooms
    "tiled_floor_001": 1.5,    # bathroom floors
    "long_white_tiles": 1.27,  # bathroom walls, kitchen dado
    "plastered_wall_04": 3.2,  # interior walls and ceilings
    "wood_floor_deck": 1.8,    # balcony deck
}
TEX_MAPS = {"Diffuse": "diff", "nor_gl": "nor", "Rough": "rough"}


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


def fetch_texture(tex_id):
    out = os.path.join(DEST, "tex", tex_id)
    os.makedirs(out, exist_ok=True)
    files = json.loads(get(f"https://api.polyhaven.com/files/{tex_id}"))
    total = 0
    for key, short in TEX_MAPS.items():
        entry = files[key][RES]["jpg"]
        path = os.path.join(out, f"{short}.jpg")
        if not (os.path.exists(path) and hashlib.md5(open(path, "rb").read()).hexdigest() == entry.get("md5")):
            data = get(entry["url"])
            if entry.get("md5") and hashlib.md5(data).hexdigest() != entry["md5"]:
                raise ValueError(f"checksum mismatch for {tex_id}/{key}")
            with open(path, "wb") as f:
                f.write(data)
        total += os.path.getsize(path)
    with open(os.path.join(out, "size.txt"), "w") as f:
        f.write(str(TEXTURES[tex_id]))
    print(f"texture {tex_id}: {total / 1e6:.1f} MB")


if __name__ == "__main__":
    os.makedirs(DEST, exist_ok=True)
    for a in ASSETS:
        fetch(a)
    for t in TEXTURES:
        fetch_texture(t)
    with open(os.path.join(DEST, "LICENSE.txt"), "w") as f:
        f.write("All models in this folder are from Poly Haven (https://polyhaven.com) and are licensed CC0 1.0.\n")
