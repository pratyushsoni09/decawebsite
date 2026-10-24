"""
Swap the walkable model's low-poly furniture for detailed CC0 models from
Poly Haven (downloaded by fetch_assets.py) and dress the rooms with decor.

Each Poly Haven model is imported once as a hidden prototype, normalised
(centred on its footprint, resting on z = 0, front facing -Y like the
web model's items) and then instanced with linked mesh data, fitted to the
footprint the floor plan reserves for that item.
"""
import math
import os
import sys
import zlib

import bpy
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")

# furniture type → (asset, fit mode). Types not listed keep their web-model geometry
# (beds, bathroom fittings, kitchen, wardrobes, shelving, swings: no CC0 match). Wall art keeps the
# site's own abstract canvases; set "art": (None, "wall") to hang the CC0 frames in FRAMES instead.
REPLACE = {
    "sofa": ("sofa_03", "seat"),
    "loungeChair": ("modern_arm_chair_01", "seat"),
    "readingChair": ("mid_century_lounge_chair", "seat"),
    "chair": ("dining_chair_02", "seat"),
    "deskChair": ("gallinera_chair", "seat"),
    "stool": ("bar_chair_round_01", "seat"),
    "coffeeTable": ("modern_coffee_table_01", "table"),
    "sideTable": ("side_table_01", "table"),
    "table": ("dining_table", "table"),
    "roundTable": ("round_wooden_table_02", "table"),
    "plant": (None, "height"),
    "pendant": ("modern_ceiling_lamp_01", "ceiling"),
    "planter": ("planter_box_02", "table"),
}
FRAMES = ["hanging_picture_frame_01", "hanging_picture_frame_02", "hanging_picture_frame_03"]
# per-asset yaw fix (degrees) where a model's front doesn't face -Y
YAW = {}

_protos = {}


def _proto_collection():
    col = bpy.data.collections.get("cc0_prototypes")
    if col is None:
        col = bpy.data.collections.new("cc0_prototypes")
        bpy.context.scene.collection.children.link(col)
        bpy.context.view_layer.layer_collection.children[col.name].exclude = True
    return col


def proto(asset_id):
    """Import an asset once; return its meshes (in a normalised frame) and dimensions."""
    if asset_id in _protos:
        return _protos[asset_id]
    path = os.path.join(ASSETS, asset_id, f"{asset_id}.gltf")
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    bpy.context.view_layer.update()
    meshes = [o for o in new if o.type == "MESH"]
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    centre = Matrix.Translation(Vector((-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z)))
    yaw = Matrix.Rotation(math.radians(YAW.get(asset_id, 0)), 4, "Z")
    parts = [(o.data, yaw @ centre @ o.matrix_world) for o in meshes]
    col = _proto_collection()
    for o in new:
        for c in list(o.users_collection):
            c.objects.unlink(o)
        col.objects.link(o)
    dims = mx - mn
    if YAW.get(asset_id, 0) % 180 == 90:
        dims = Vector((dims.y, dims.x, dims.z))
    _protos[asset_id] = {"parts": parts, "dims": dims}
    return _protos[asset_id]


def place(asset_id, base, scale, name):
    """Instance a prototype: base = item frame (floor centre, front −Y), scale = (sx, sy, sz)."""
    p = proto(asset_id)
    S = Matrix.Diagonal((*scale, 1.0))
    obs = []
    for i, (data, m) in enumerate(p["parts"]):
        ob = bpy.data.objects.new(f"{name}.{i}", data)
        ob.matrix_world = base @ S @ m
        bpy.context.scene.collection.objects.link(ob)
        obs.append(ob)
    return obs


def item_frame(it, elevation):
    """Plan position → Blender frame at the item's floor centre, rotated so local −Y is its front."""
    return Matrix.Translation(Vector((it["x"], -it["y"], elevation))) @ Matrix.Rotation(math.radians(it["rot"]), 4, "Z")


def remove_lowpoly(item_id):
    root = bpy.data.objects.get(f"item:{item_id}")
    if root is None:
        return False
    stack = [root]
    doomed = []
    while stack:
        o = stack.pop()
        doomed.append(o)
        stack.extend(o.children)
    for o in doomed:
        bpy.data.objects.remove(o, do_unlink=True)
    return True


def fit(mode, it, dims, ceiling):
    w, d, h = it["w"], it["d"], it["h"]
    if mode == "seat":
        s = min(w / dims.x, d / dims.y)
        s = min(s, h * 1.35 / dims.z)
        return (s, s, s), 0.0
    if mode == "table":
        return (w / dims.x, d / dims.y, h / dims.z), 0.0
    if mode == "height":
        s = h / dims.z
        return (s, s, s), 0.0
    if mode == "ceiling":
        return (1.0, 1.0, 1.0), ceiling - dims.z
    raise ValueError(mode)


def furnish(data):
    elevation = data["residenceElevation"]
    ceiling = data["ceilingHeight"]
    swapped = 0
    built = 0
    sys.path.insert(0, HERE)
    import modern
    materials = modern.palette()
    for it in data["items"]:
        # contemporary pieces modelled in Blender take priority over CC0 swaps
        if modern.wants(it) and remove_lowpoly(it["id"]):
            modern.build(it, item_frame(it, elevation), materials)
            built += 1
            continue
        rule = REPLACE.get(it["type"])
        if not rule or it.get("variant") == "outdoor":
            continue
        asset, mode = rule
        if it["type"] == "plant":
            asset = "potted_plant_01" if it.get("variant") != "fig" else "potted_plant_02"
        if it["type"] == "art":
            asset = FRAMES[zlib.crc32(it["id"].encode()) % len(FRAMES)]
        if not remove_lowpoly(it["id"]):
            continue
        base = item_frame(it, elevation)
        dims = proto(asset)["dims"]
        if mode == "wall":
            # art hangs on the wall face, centred at its listed height, its back against the plaster
            sx, sz = it["w"] / dims.x, it["h"] / dims.z
            sy = min(sx, sz)
            lift = it.get("elev", 1.5) - dims.z * sz / 2
            offset = Matrix.Translation(Vector((0, -dims.y * sy / 2 - 0.005, lift)))
            place(asset, base @ offset, (sx, sy, sz), it["id"])
        else:
            scale, lift = fit(mode, it, dims, ceiling)
            place(asset, base @ Matrix.Translation(Vector((0, 0, lift))), scale, it["id"])
        swapped += 1
    dress(data["items"], elevation)
    print(f"[furnish] {built} pieces modelled in Blender; {swapped} items replaced with CC0 models; {len(_protos)} assets loaded")


def dress(items, elevation):
    """Decor on top of the furniture: what makes a room look lived in."""
    def on(it, asset, dx, dy, top, size=None, rot=0.0):
        base = item_frame(it, elevation) @ Matrix.Translation(Vector((dx, dy, top))) @ Matrix.Rotation(math.radians(rot), 4, "Z")
        dims = proto(asset)["dims"]
        s = 1.0 if size is None else size / max(dims.x, dims.y)
        place(asset, base, (s, s, s), f"decor-{asset}-{it['id']}")

    for it in items:
        t, room, w, d, h = it["type"], it["room"], it["w"], it["d"], it["h"]
        if t == "coffeeTable":
            on(it, "ceramic_vase_02", w * 0.25, 0.0, h)
            if room != "balcony":
                on(it, "book_encyclopedia_set_01", -w * 0.22, 0.0, h, rot=90)
        elif t == "table" and it.get("variant") != "slab":  # the slab table is set for dinner instead
            on(it, "brass_candleholders", 0.0, 0.0, h, size=w * 0.42)
        elif t == "island":
            on(it, "wooden_bowl_01", w * 0.18, 0.0, h, size=0.34)
            on(it, "ceramic_vase_01", -w * 0.3, 0.05, h)
        elif t == "sideTable" and room == "study":
            on(it, "chess_set", 0.0, 0.0, h, size=0.44)
        elif t == "sideTable":
            on(it, "brass_vase_01", 0.0, 0.0, h, size=0.14)
        elif t == "console" and it.get("variant") != "media":
            on(it, "ceramic_vase_01", w * 0.3, 0.0, h)
            on(it, "brass_vase_01", -w * 0.28, 0.0, h, size=0.16)
        elif t == "sideboard":
            on(it, "ceramic_vase_02", w * 0.25, 0.0, h)
            on(it, "brass_vase_01", -w * 0.2, 0.0, h, size=0.16)
