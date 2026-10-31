"""
Export the detailed interior (modelled furniture, decor, finishes and the placed CC0 pieces) from the finished
Blender scene as a compressed glTF for the website's walkable tour:

    blender -b blender/out/oak-residences.blend -P blender/export_tour.py

Writes public/models/interior.glb (Draco-compressed, textures downscaled) and src/data/tourModel.json, which
lists the furniture items the tour must still build itself (the swings, the pooja unit and the few others that
were never replaced in Blender). The shell, the tower and Kudasan are not exported: the tour builds those.
"""
import json
import os
import re

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "public", "models", "interior.glb")
MANIFEST = os.path.join(HERE, "..", "src", "data", "tourModel.json")
INSTANCE = re.compile(r"^[a-z0-9]+-[A-Za-z0-9]+-\d+\.\d+$")  # a placed CC0 piece: "<room>-<type>-<n>.<k>"
BUDGET = {"leaves": 24000, "default": 12000}  # triangles per object after decimation
TEX = {"leaves": 1024, "default": 768}  # longest texture side


def tri_count(ob, dg):
    ev = ob.evaluated_get(dg)
    me = ev.to_mesh()
    n = sum(len(p.vertices) - 2 for p in me.polygons)
    ev.to_mesh_clear()
    return n


def principled(mat):
    if not mat or not mat.use_nodes:
        return None
    return next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)


def flatten_procedural(mat):
    """glTF can't carry node-built colours (wood grain ramps, noise): give such materials their average colour."""
    b = principled(mat)
    if b is None:
        return
    sock = b.inputs["Base Color"]
    if not sock.is_linked:
        return
    src = sock.links[0].from_node
    if src.type == "TEX_IMAGE":
        return
    colour = None
    if src.type == "VALTORGB":
        els = src.color_ramp.elements
        colour = [sum(e.color[i] for e in els) / len(els) for i in range(3)]
    elif src.type == "MIX" or src.type == "MIX_RGB":
        colour = list(mat.diffuse_color)[:3]
    if colour is None:
        colour = list(mat.diffuse_color)[:3]
    mat.node_tree.links.remove(sock.links[0])
    sock.default_value = (*colour, 1.0)


def main():
    scene = bpy.context.scene
    dg = bpy.context.evaluated_depsgraph_get()
    keep_lowpoly = []
    doomed = []
    protos = bpy.data.collections.get("cc0_prototypes")
    proto_objs = set(protos.all_objects) if protos else set()
    for ob in list(scene.objects):
        n = ob.name
        if ob.type in ("LIGHT", "CAMERA", "EMPTY") and not n.startswith("item:"):
            doomed.append(ob)
        elif n.startswith("static:") or re.match(r"^Mesh_\d+$", n) or n in ("water", "water.001") or ob in proto_objs:
            doomed.append(ob)  # shell, tower, city (the tour builds these); CC0 sources
        elif n.startswith("item:"):
            keep_lowpoly.append(n[len("item:"):])
            doomed.append(ob)
            doomed.extend(ob.children_recursive)
    for ob in set(doomed):
        bpy.data.objects.remove(ob, do_unlink=True)
    meshes = [ob for ob in scene.objects if ob.type == "MESH"]
    unknown = [ob.name for ob in meshes if not (ob.name.startswith(("modern-", "decor-", "finish_")) or INSTANCE.match(ob.name))]
    print(f"[tour] exporting {len(meshes)} meshes; keeping low-poly for {len(keep_lowpoly)} items; unclassified: {unknown[:10]}")

    # decimate the heavy scans so the whole interior stays streamable
    total = 0
    for ob in meshes:
        t = tri_count(ob, dg)
        kind = "leaves" if "leaves" in ob.name or "leaves" in (ob.data.materials[0].name if ob.data.materials else "") else "default"
        budget = BUDGET[kind]
        if t > budget:
            mod = ob.modifiers.new("web", "DECIMATE")
            mod.ratio = budget / t
            mod.use_collapse_triangulate = True
            t = budget
        total += t
    print(f"[tour] about {total / 1e3:.0f}k triangles after decimation")

    # textures: nothing above 1K on the web
    for img in bpy.data.images:
        if img.size[0] == 0:
            continue
        kind = "leaves" if "leaves" in img.name else "default"
        m = TEX[kind]
        if max(img.size) > m:
            s = m / max(img.size)
            img.scale(max(1, int(img.size[0] * s)), max(1, int(img.size[1] * s)))

    used = {s.material for ob in meshes for s in ob.material_slots if s.material}
    for mat in used:
        flatten_procedural(mat)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for ob in meshes:
        ob.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=OUT, export_format="GLB", use_selection=True, export_apply=True,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
        export_image_format="AUTO", export_jpeg_quality=72, export_lights=False, export_cameras=False,
        export_yup=True, export_animations=False, export_skins=False, export_morph=False,
    )
    with open(MANIFEST, "w", encoding="utf8") as f:
        json.dump({"model": "/models/interior.glb", "keepLowPoly": sorted(keep_lowpoly)}, f, indent=1)
    print(f"[tour] interior.glb {os.path.getsize(OUT) / 1e6:.1f} MB; manifest {len(keep_lowpoly)} low-poly items kept")


main()
