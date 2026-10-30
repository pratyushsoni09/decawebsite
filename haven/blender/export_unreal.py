"""
Export the finished Blender scene (blender/out/oak-residences.blend, saved by render.py) for Unreal Engine:

    blender -b blender/out/oak-residences.blend -P blender/export_unreal.py

Writes unreal/export/scene.fbx with every object's transform applied (so Unreal places each mesh at the
origin), unreal/export/materials.json describing every material (colour, roughness, metallic, emission,
transmission, and any image textures, copied to unreal/export/textures/) and unreal/export/cameras.json
with the render views for the cinematic. Lights are read by Unreal from blender/export/lights.json.
"""
import json
import os
import shutil

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "unreal", "export")
TEX_OUT = os.path.join(OUT, "textures")


def principled(mat):
    if not mat.use_nodes:
        return None
    for n in mat.node_tree.nodes:
        if n.type == "BSDF_PRINCIPLED":
            return n
    return None


def linked_image(node, name):
    """The image feeding this input, if any (through a normal-map or mix node one step back)."""
    sock = node.inputs.get(name)
    if sock is None or not sock.is_linked:
        return None
    src = sock.links[0].from_node
    for _ in range(3):
        if src.type == "TEX_IMAGE" and src.image:
            return src.image
        feeders = [l.from_node for i in src.inputs for l in i.links]
        if not feeders:
            return None
        src = feeders[0]
    return None


def save_image(img):
    """Copy the texture file next to the FBX (named after its folder, so marble_01/diff.jpg keeps its identity)."""
    os.makedirs(TEX_OUT, exist_ok=True)
    src = bpy.path.abspath(img.filepath) if img.filepath else ""
    if src and os.path.exists(src):
        folder = os.path.basename(os.path.dirname(src))
        name = bpy.path.clean_name(f"{folder}_{os.path.splitext(os.path.basename(src))[0]}") + os.path.splitext(src)[1].lower()
        path = os.path.join(TEX_OUT, name)
        if not os.path.exists(path):
            shutil.copy(src, path)
        return name
    if not img.has_data:
        return None
    name = bpy.path.clean_name(os.path.splitext(img.name)[0]) + ".png"
    path = os.path.join(TEX_OUT, name)
    if not os.path.exists(path):
        img.filepath_raw = path
        img.file_format = "PNG"
        img.save()
    return name


def describe(mat):
    b = principled(mat)
    d = {"name": mat.name, "baseColor": [0.8, 0.8, 0.8], "roughness": 0.5, "metallic": 0.0, "emission": [0, 0, 0],
         "emissionStrength": 0.0, "transmission": 0.0, "alpha": 1.0, "textures": {}}
    if b is None:
        return d
    val = lambda n, default: list(b.inputs[n].default_value)[:3] if n in b.inputs and hasattr(b.inputs[n].default_value, "__len__") else (b.inputs[n].default_value if n in b.inputs else default)
    d["baseColor"] = val("Base Color", d["baseColor"])
    d["roughness"] = float(val("Roughness", 0.5))
    d["metallic"] = float(val("Metallic", 0.0))
    d["emission"] = val("Emission Color", [0, 0, 0])
    d["emissionStrength"] = float(val("Emission Strength", 0.0))
    for key in ("Transmission Weight", "Transmission"):
        if key in b.inputs:
            d["transmission"] = float(b.inputs[key].default_value)
            break
    d["alpha"] = float(val("Alpha", 1.0))
    for inp, key in (("Base Color", "baseColor"), ("Roughness", "roughness"), ("Normal", "normal")):
        img = linked_image(b, inp)
        saved = save_image(img) if img else None
        if saved:
            d["textures"][key] = saved
    # texture scale: the Mapping node feeding the image, if any
    for n in mat.node_tree.nodes:
        if n.type == "MAPPING":
            s = n.inputs["Scale"].default_value
            d["uvScale"] = [float(s[0]), float(s[1])]
            break
    return d


def main():
    os.makedirs(OUT, exist_ok=True)
    scene = bpy.context.scene
    # drop render-only helpers (cameras, the CC0 prototype collection) and keep meshes and lights
    for ob in list(scene.objects):
        if ob.type == "CAMERA":
            bpy.data.objects.remove(ob)
    protos = bpy.data.collections.get("cc0_prototypes")
    if protos:
        for ob in list(protos.objects):
            bpy.data.objects.remove(ob)
    meshes = [ob for ob in scene.objects if ob.type == "MESH"]
    # make every mesh its own user and bake transforms, so Unreal can place everything at the origin
    bpy.ops.object.select_all(action="DESELECT")
    for ob in meshes:
        ob.hide_set(False)
        ob.hide_viewport = False
        ob.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.make_single_user(type="SELECTED_OBJECTS", object=True, obdata=True)
    # apply modifiers (bevels, rumples, solidify) so the FBX carries the finished surfaces
    for ob in meshes:
        bpy.context.view_layer.objects.active = ob
        for mod in list(ob.modifiers):
            try:
                bpy.ops.object.modifier_apply(modifier=mod.name)
            except RuntimeError:
                ob.modifiers.remove(mod)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    mats = {}
    for ob in meshes:
        for slot in ob.material_slots:
            if slot.material and slot.material.name not in mats:
                mats[slot.material.name] = describe(slot.material)
    with open(os.path.join(OUT, "materials.json"), "w", encoding="utf8") as f:
        json.dump(list(mats.values()), f, indent=1)

    cams = []
    with open(os.path.join(HERE, "export", "views.json"), encoding="utf8") as f:
        for v in json.load(f)["views"]:
            if v.get("sketch"):
                continue
            cams.append({"name": v["name"], "pos": v["pos"], "look": v["look"], "fov": v.get("fov", 64), "exterior": v.get("shift") is not None})
    with open(os.path.join(OUT, "cameras.json"), "w", encoding="utf8") as f:
        json.dump(cams, f, indent=1)

    bpy.ops.object.select_all(action="DESELECT")
    for ob in meshes:
        ob.select_set(True)
    bpy.ops.export_scene.fbx(filepath=os.path.join(OUT, "scene.fbx"), use_selection=True, object_types={"MESH"},
                             mesh_smooth_type="FACE", use_mesh_modifiers=True, path_mode="COPY", embed_textures=False,
                             axis_forward="-Z", axis_up="Y", apply_scale_options="FBX_SCALE_NONE", bake_space_transform=True)
    size = os.path.getsize(os.path.join(OUT, "scene.fbx")) / 1e6
    print(f"[unreal] {len(meshes)} meshes, {len(mats)} materials, {len(cams)} cameras -> scene.fbx ({size:.0f} MB)")


main()
