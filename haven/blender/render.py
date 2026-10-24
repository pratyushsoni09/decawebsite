"""
Photoreal renders of The Oak Residences with Blender Cycles.

Pipeline: the dev-only /studio page exports the walkable three.js model
(blender/export/tower.glb) together with the camera views and lamp
positions it uses (views.json, lights.json). This script imports that
model, upgrades it for path tracing (bevelled edges, glass, metals,
fabric sheen, physical sky, warm lamps) and renders the same views into
public/images, so the photos still match the 3D tour and the hero sketch.

    blender -b -P blender/render.py -- [--views living,kitchen] [--samples 256] [--scale 1.0] [--out DIR]
"""
import bpy
import bmesh
import json
import math
import os
import sys
import time
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(HERE, "export")


def arg(name, default=None):
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return argv[argv.index(name) + 1] if name in argv else default


ONLY = [v for v in (arg("--views") or "").split(",") if v]
SAMPLES = int(arg("--samples", "0"))
SCALE = float(arg("--scale", "1.0"))
OUT = os.path.abspath(arg("--out", os.path.join(HERE, "..", "public", "images")))
NO_CC0 = arg("--no-cc0") is not None or "--no-cc0" in sys.argv


def three_to_blender(v):
    """three.js / glTF is Y-up; Blender is Z-up."""
    x, y, z = v
    return Vector((x, -z, y))


# ---------------------------------------------------------------- scene setup

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for kind in ("OPTIX", "CUDA"):
        try:
            prefs.compute_device_type = kind
            prefs.get_devices()
            gpus = [d for d in prefs.devices if d.type == kind]
            if gpus:
                for d in prefs.devices:
                    d.use = d.type == kind
                scene.cycles.device = "GPU"
                print(f"[render] using {kind}: {[d.name for d in gpus]}")
                break
        except Exception:
            continue
    c = scene.cycles
    c.use_adaptive_sampling = True
    c.adaptive_threshold = 0.015
    c.use_denoising = True
    try:
        c.denoiser = "OPENIMAGEDENOISE"
    except Exception:
        pass
    c.max_bounces = 10
    c.diffuse_bounces = 5
    c.glossy_bounces = 5
    c.transmission_bounces = 10
    c.transparent_max_bounces = 16
    c.caustics_reflective = False
    c.caustics_refractive = False
    c.sample_clamp_indirect = 8.0
    c.blur_glossy = 1.0
    scene.view_settings.view_transform = "AgX"
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        pass
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.quality = 88
    scene.render.film_transparent = False
    return scene


def import_model():
    """Shell + item-by-item furniture when available (so pieces can be swapped), else the merged model."""
    shell = os.path.join(EXPORT, "shell.glb")
    if os.path.exists(shell) and os.path.exists(os.path.join(EXPORT, "furniture.glb")) and not NO_CC0:
        bpy.ops.import_scene.gltf(filepath=shell)
        bpy.ops.import_scene.gltf(filepath=os.path.join(EXPORT, "furniture.glb"))
        print(f"[render] imported shell + furniture: {len(bpy.data.objects)} objects")
        sys.path.insert(0, HERE)
        import furnish
        with open(os.path.join(EXPORT, "furniture.json")) as f:
            furnish.furnish(json.load(f))
    else:
        bpy.ops.import_scene.gltf(filepath=os.path.join(EXPORT, "tower.glb"))
        print(f"[render] imported {len(bpy.data.objects)} objects")


def key_of(mat):
    return mat.name.split(".")[0]


def bsdf_of(mat):
    if not mat.use_nodes:
        return None
    for n in mat.node_tree.nodes:
        if n.type == "BSDF_PRINCIPLED":
            return n
    return None


def set_input(node, names, value):
    for name in names if isinstance(names, (list, tuple)) else [names]:
        if name in node.inputs:
            node.inputs[name].default_value = value
            return


FABRICS = {"leather", "linen", "cream", "teal", "upholstery", "duvet", "bedLinen", "rug", "rugTeal", "rugSand",
           "tan", "mustard", "maroon", "rugGrey", "rugRose", "blackLeather", "pinkLeather"}
PAINTS = {"terracotta", "orangePaint", "charcoal"}
WOODS = {"oak", "herringbone", "teak", "oakWood", "walnut", "oakVertical", "driftwood"}


def tune_materials():
    for mat in bpy.data.materials:
        k = key_of(mat)
        b = bsdf_of(mat)
        if not b:
            continue
        # the importer maps three.js opacity to alpha blending; path tracing wants real transmission instead
        set_input(b, "Alpha", 1.0)
        if k in ("glass", "towerGlass"):
            set_input(b, ["Transmission Weight", "Transmission"], 1.0)
            set_input(b, "Roughness", 0.0 if k == "glass" else 0.03)
            set_input(b, "IOR", 1.5)
            set_input(b, "Base Color", (0.93, 0.96, 0.96, 1) if k == "glass" else (0.72, 0.8, 0.82, 1))
            set_input(b, "Metallic", 0.0)
        elif k == "mirror":
            set_input(b, "Metallic", 1.0)
            set_input(b, "Roughness", 0.02)
            set_input(b, "Base Color", (0.92, 0.92, 0.9, 1))
        elif k in ("brass", "liftDoor"):
            set_input(b, "Metallic", 1.0)
            set_input(b, "Roughness", 0.22 if k == "brass" else 0.32)
            set_input(b, "Base Color", (0.78, 0.6, 0.34, 1))
        elif k == "bronze":
            set_input(b, "Metallic", 0.9)
            set_input(b, "Roughness", 0.38)
        elif k == "glow":
            set_input(b, ["Emission Color", "Emission"], (1.0, 0.82, 0.58, 1))
            set_input(b, "Emission Strength", 30.0)
        elif k == "glowWarm":
            set_input(b, ["Emission Color", "Emission"], (1.0, 0.72, 0.32, 1))
            set_input(b, "Emission Strength", 0.9)
        elif k in PAINTS:
            set_input(b, "Roughness", 0.9)
            set_input(b, ["Sheen Weight", "Sheen"], 0.0)
        elif k == "shade":
            set_input(b, ["Emission Color", "Emission"], (1.0, 0.8, 0.55, 1))
            set_input(b, "Emission Strength", 2.5)
            set_input(b, ["Transmission Weight", "Transmission"], 0.3)
        elif k in ("curtain", "curtainLit"):
            set_input(b, ["Emission Color", "Emission"], (1.0, 0.78, 0.52, 1))
            set_input(b, "Emission Strength", 0.0)
            set_input(b, ["Subsurface Weight"], 0.0)
        elif k == "water":
            set_input(b, "Roughness", 0.02)
            set_input(b, ["Coat Weight"], 0.6)
        elif k in FABRICS:
            leather = k in ("leather", "blackLeather", "pinkLeather")
            set_input(b, ["Sheen Weight", "Sheen"], 0.0 if leather else 0.35)
            set_input(b, "Roughness", 0.5 if leather else 0.92)
            if leather:
                set_input(b, ["Coat Weight"], 0.15)
        elif k in WOODS:
            set_input(b, "Roughness", 0.55)
            if k in ("oak", "herringbone", "walnut"):
                set_input(b, ["Coat Weight"], 0.08)
                set_input(b, ["Coat Roughness"], 0.25)
        elif k in ("marble", "porcelain"):
            set_input(b, "Roughness", 0.12 if k == "marble" else 0.08)
            set_input(b, ["Coat Weight"], 0.25)
        elif k in ("plaster", "ceiling", "concrete"):
            set_input(b, "Roughness", 0.9)
        elif k == "grass":
            mix = b.inputs["Base Color"]
            if mix.is_linked:
                tint = mat.node_tree.nodes.new("ShaderNodeMixRGB")
                tint.blend_type = "MULTIPLY"
                tint.inputs["Fac"].default_value = 1.0
                tint.inputs["Color2"].default_value = (0.55, 0.62, 0.42, 1)
                src = mix.links[0].from_socket
                mat.node_tree.links.new(src, tint.inputs["Color1"])
                mat.node_tree.links.new(tint.outputs["Color"], mix)
            set_input(b, "Roughness", 1.0)
        elif k in ("leaf", "olive", "boxwood"):
            set_input(b, ["Subsurface Weight"], 0.15)
            set_input(b, "Roughness", 0.7)
        # alpha-blend settings left by the importer would cut holes; render everything opaque
        for attr, val in (("blend_method", "OPAQUE"), ("surface_render_method", "DITHERED")):
            if hasattr(mat, attr):
                try:
                    setattr(mat, attr, val)
                except Exception:
                    pass


BEVEL = {"oakWood", "walnut", "leather", "linen", "cream", "teal", "upholstery", "marble", "porcelain",
         "stoneTrim", "duvet", "bedLinen", "teak", "plaster", "concrete", "white", "darkMetal", "liftDoor"}


def add_detail():
    """Weld the exported triangle soup, then bevel crisp edges so light catches them."""
    t0 = time.time()
    count = 0
    for ob in bpy.data.objects:
        if ob.type != "MESH" or not ob.data.materials:
            continue
        k = key_of(ob.data.materials[0])
        if k not in BEVEL:
            continue
        me = ob.data
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0004)
        bm.to_mesh(me)
        bm.free()
        for p in me.polygons:
            p.use_smooth = False
        mod = ob.modifiers.new("detail", "BEVEL")
        mod.width = 0.012 if k in ("leather", "linen", "cream", "teal", "upholstery", "duvet", "bedLinen") else 0.004
        mod.segments = 3 if mod.width > 0.01 else 2
        mod.limit_method = "ANGLE"
        mod.angle_limit = math.radians(35)
        mod.harden_normals = False
        count += 1
    print(f"[render] bevelled {count} meshes in {time.time() - t0:.1f}s")


# ---------------------------------------------------------------- lighting

def setup_world():
    world = bpy.data.worlds.new("sky")
    bpy.context.scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    sky = nt.nodes.new("ShaderNodeTexSky")
    bg = nt.nodes.new("ShaderNodeBackground")
    out = nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(sky.outputs["Color"], bg.inputs["Color"])
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
    try:
        sky.sky_type = "MULTIPLE_SCATTERING"
    except Exception:
        pass
    if hasattr(sky, "sun_disc"):
        sky.sun_disc = False
    return sky, bg


def add_sun():
    data = bpy.data.lights.new("sun", "SUN")
    data.angle = math.radians(0.6)
    ob = bpy.data.objects.new("sun", data)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def add_bathroom_lights():
    """Bathrooms have no pendant in the web model; give each a soft ceiling panel, centred on its fittings."""
    path = os.path.join(EXPORT, "furniture.json")
    if not os.path.exists(path):
        return []
    with open(path) as f:
        data = json.load(f)
    rooms = {}
    for it in data["items"]:
        rooms.setdefault(it["room"], []).append(it)
    obs = []
    for room, items in rooms.items():
        if not any(it["type"] == "wc" for it in items):
            continue
        x = sum(it["x"] for it in items) / len(items)
        y = sum(it["y"] for it in items) / len(items)
        data_l = bpy.data.lights.new(f"bath-{room}", "AREA")
        data_l.shape = "SQUARE"
        data_l.size = 1.0
        data_l.energy = 60.0
        data_l.color = (1.0, 0.93, 0.84)
        ob = bpy.data.objects.new(f"bath-{room}", data_l)
        ob.location = Vector((x, -y, data["residenceElevation"] + data["ceilingHeight"] - 0.02))
        bpy.context.scene.collection.objects.link(ob)
        obs.append(ob)
    return obs


def add_lamps(lights):
    obs = []
    for i, l in enumerate(lights):
        data = bpy.data.lights.new(f"lamp{i}", "POINT")
        data.shadow_soft_size = 0.06
        data.color = (1.0, 0.86, 0.7)
        ob = bpy.data.objects.new(f"lamp{i}", data)
        ob.location = three_to_blender((l["x"], l["y"], l["z"]))
        ob["strength"] = l.get("strength", 1)
        bpy.context.scene.collection.objects.link(ob)
        obs.append(ob)
    return obs


OUTDOOR_VIEWS = {"balcony", "swing"}
# north-facing rooms only get skylight: open them up further, as a photographer would
EXTRA_EV = {"bed2": 1.2, "bed3": 0.8, "kitchen": 0.0, "master": 0.9, "pooja": 0.9, "dining": -1.9, "living": -0.4}

PRESET = {
    "day": {"elev": 42, "air": 1.0, "dust": 1.0, "sun": 4.2, "sky": 1.0, "exposure": 0.0},
    "golden": {"elev": 9, "air": 1.6, "dust": 3.0, "sun": 4.6, "sky": 0.55, "exposure": -0.9},
    "dusk": {"elev": 1.5, "air": 2.0, "dust": 3.0, "sun": 0.8, "sky": 0.6, "exposure": 0.9},
}


def apply_light(view, sky, bg, sun, lamps):
    p = PRESET[view["sky"]]
    d = three_to_blender(view["sun"]["dir"]).normalized()
    sun.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
    sun.data.energy = p["sun"] * view["sun"]["intensity"] / 3.2
    c = view["sun"]["color"]
    sun.data.color = (((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255)
    for attr, val in (("sun_elevation", math.radians(p["elev"])), ("sun_rotation", math.atan2(d.y, d.x) - math.pi / 2),
                      ("altitude", 40.0), ("air_density", p["air"]), ("dust_density", p["dust"]),
                      ("aerosol_density", p["dust"]), ("ozone_density", 1.0)):
        if hasattr(sky, attr):
            setattr(sky, attr, val)
    bg.inputs["Strength"].default_value = p["sky"]
    for ob in lamps:
        ob.hide_render = view["lamps"] <= 0
        ob.data.energy = 35.0 * ob["strength"] * max(view["lamps"], 0.0)
    lit = view.get("windowsLit", 0.12)
    for mat in bpy.data.materials:
        k = key_of(mat)
        b = bsdf_of(mat)
        if not b:
            continue
        if k == "curtainLit":
            set_input(b, "Emission Strength", 0.6 if lit < 1 else 6.0)
        elif k == "curtain":
            set_input(b, "Emission Strength", 0.0 if lit < 1 else 1.2)
        elif k == "glow":
            set_input(b, "Emission Strength", 30.0 if view["lamps"] > 0 else 2.0)
    # interiors only see the sky through windows: open up like a photographer would
    interior = view.get("shift") is None
    lift = 0.0 if not interior else 0.5 if view["name"] in OUTDOOR_VIEWS else 1.7
    lift += EXTRA_EV.get(view["name"], 0.0)
    bpy.context.scene.view_settings.exposure = p["exposure"] + lift + math.log2(max(view["exposure"], 0.05))


# ---------------------------------------------------------------- cameras

def setup_camera(view):
    scene = bpy.context.scene
    cam = scene.camera
    if cam is None:
        cam = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
        scene.collection.objects.link(cam)
        scene.camera = cam
    w, h = view["w"], view["h"]
    scene.render.resolution_x = int(w * SCALE)
    scene.render.resolution_y = int(h * SCALE)
    scene.render.resolution_percentage = 100
    data = cam.data
    data.sensor_fit = "VERTICAL"
    data.clip_start = 0.05
    data.clip_end = 1500
    pos = three_to_blender(view["pos"])
    look = three_to_blender(view["look"])
    cam.location = pos
    cam.rotation_euler = (look - pos).to_track_quat("-Z", "Y").to_euler()
    fov = math.radians(view["fov"])
    if view.get("shift") is not None:
        # same lens shift as the studio's setViewOffset: a level camera framing the top of a taller frustum
        full_h = round(2 * h * (1 - view["shift"]))
        T = math.tan(fov / 2)
        visible = 2 * T * h / full_h
        centre = T - T * h / full_h
        data.angle_y = 2 * math.atan(visible / 2)
        data.shift_y = centre / visible
        data.shift_x = 0.0
    else:
        data.angle_y = fov
        data.shift_x = data.shift_y = 0.0


# ---------------------------------------------------------------- main

def main():
    with open(os.path.join(EXPORT, "views.json")) as f:
        views = json.load(f)["views"]
    with open(os.path.join(EXPORT, "lights.json")) as f:
        lights = json.load(f)
    scene = reset()
    import_model()
    tune_materials()
    add_detail()
    layout_path = os.path.join(EXPORT, "layout.json")
    if os.path.exists(layout_path) and not NO_CC0:
        sys.path.insert(0, HERE)
        import finish
        with open(layout_path) as f:
            finish.finish(json.load(f))
    sky, bg = setup_world()
    sun = add_sun()
    lamps = add_lamps(lights)
    add_bathroom_lights()
    os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "out", "oak-residences.blend"))
    os.makedirs(OUT, exist_ok=True)
    for view in views:
        if view.get("sketch"):
            continue  # the hero's line and tone layers stay vector-sharp from the studio
        if ONLY and view["name"] not in ONLY:
            continue
        exterior = view.get("shift") is not None
        scene.cycles.samples = SAMPLES or (160 if exterior else 320)
        setup_camera(view)
        apply_light(view, sky, bg, sun, lamps)
        scene.render.filepath = os.path.join(OUT, f"{view['name']}.webp")
        t0 = time.time()
        bpy.ops.render.render(write_still=True)
        print(f"[render] {view['name']}: {time.time() - t0:.0f}s -> {scene.render.filepath}", flush=True)


main()
