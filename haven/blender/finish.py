"""
Interior finishing for Residence 11A, modelled on finished Indian 3BHK homes:
polished marble floors with tile skirting in the hall, dining hall and
kitchen; laminated wood in the bedrooms; bathroom walls tiled to 2.1 m;
wooden architraves on every door
and archway; recessed spotlights; pleated curtains on rods.

Surfaces use photo-scanned CC0 textures from Poly Haven
(blender/assets/tex, fetched by fetch_assets.py) at real-world scale.
Everything is placed from blender/export/layout.json, the same layout the
web model, plan and collision map are built from.
"""
import math
import os

import bmesh
import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, "assets", "tex")

# web material key -> (texture id, roughness scale, tile joints in metres or None)
SURFACES = {
    "darkPlank": ("laminate_floor_02", 0.7, None, (0.42, 0.3, 0.22)),  # dark-stained wood: hall, dining hall, kitchen
    "polished": ("marble_01", 0.25, None, (0.07, 0.07, 0.075)),          # dark polished floor: master bedroom
    "stone": ("marble_01", 0.3, (1.6, 0.8)),
    "herringbone": ("marble_01", 0.3, (1.6, 0.8)),
    "oak": ("laminate_floor_02", 0.8, None),
    "tile": ("tiled_floor_001", 0.6, None),
    "plaster": ("plastered_wall_04", 1.0, None),
    "ceiling": ("plastered_wall_04", 1.0, None),
    "teak": ("wood_floor_deck", 0.9, None),
}


# ---------------------------------------------------------------- textures

def _image(path, colour):
    img = bpy.data.images.load(path, check_existing=True)
    img.colorspace_settings.name = "sRGB" if colour else "Non-Color"
    return img


def textured(mat, tex_id, rough_scale=1.0, joints=None, box=False, normal_strength=0.6, tint=None):
    """Rewire a material's Principled BSDF to a photo-scanned texture, mapped in metres."""
    folder = os.path.join(TEX, tex_id)
    if not os.path.isdir(folder):
        print(f"[finish] missing texture {tex_id}; run fetch_assets.py")
        return
    size = float(open(os.path.join(folder, "size.txt")).read())
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if bsdf is None:
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
        nt.links.new(bsdf.outputs[0], out.inputs["Surface"])
    for name in ("Base Color", "Roughness", "Normal"):
        for link in list(bsdf.inputs[name].links):
            nt.links.remove(link)
    coord = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (1 / size, 1 / size, 1 / size)
    nt.links.new(coord.outputs["Object" if box else "UV"], mapping.inputs["Vector"])

    def tex(file, colour):
        n = nt.nodes.new("ShaderNodeTexImage")
        n.image = _image(os.path.join(folder, file), colour)
        if box:
            n.projection = "BOX"
            n.projection_blend = 0.25
        nt.links.new(mapping.outputs["Vector"], n.inputs["Vector"])
        return n

    diff = tex("diff.jpg", True)
    colour_out = diff.outputs["Color"]
    if joints:
        # thin grout lines every `joints` metres (vitrified / marble tiles)
        brick = nt.nodes.new("ShaderNodeTexBrick")
        brick.offset = 0.0
        brick.squash = 1.0
        brick.inputs["Scale"].default_value = 1.0
        jw, jh = joints if isinstance(joints, tuple) else (joints, joints)
        brick.inputs["Brick Width"].default_value = jw
        brick.inputs["Row Height"].default_value = jh
        brick.inputs["Mortar Size"].default_value = 0.0025
        brick.inputs["Mortar Smooth"].default_value = 0.2
        brick.inputs["Color1"].default_value = (1, 1, 1, 1)
        brick.inputs["Color2"].default_value = (1, 1, 1, 1)
        brick.inputs["Mortar"].default_value = (0.55, 0.52, 0.48, 1)
        nt.links.new(coord.outputs["Object" if box else "UV"], brick.inputs["Vector"])
        mul = nt.nodes.new("ShaderNodeMix")
        mul.data_type = "RGBA"
        mul.blend_type = "MULTIPLY"
        mul.inputs["Factor"].default_value = 1.0
        nt.links.new(colour_out, mul.inputs["A"])
        nt.links.new(brick.outputs["Color"], mul.inputs["B"])
        colour_out = mul.outputs["Result"]
    if tint:
        # stain: multiply the scan's colour (dark wood, dark polished stone)
        stain = nt.nodes.new("ShaderNodeMix")
        stain.data_type = "RGBA"
        stain.blend_type = "MULTIPLY"
        stain.inputs["Factor"].default_value = 1.0
        nt.links.new(colour_out, stain.inputs["A"])
        stain.inputs["B"].default_value = (*tint, 1)
        colour_out = stain.outputs["Result"]
    nt.links.new(colour_out, bsdf.inputs["Base Color"])
    rough = tex("rough.jpg", False)
    scale = nt.nodes.new("ShaderNodeMath")
    scale.operation = "MULTIPLY"
    scale.inputs[1].default_value = rough_scale
    nt.links.new(rough.outputs["Color"], scale.inputs[0])
    nt.links.new(scale.outputs["Value"], bsdf.inputs["Roughness"])
    nor = tex("nor.jpg", False)
    nmap = nt.nodes.new("ShaderNodeNormalMap")
    nmap.inputs["Strength"].default_value = normal_strength
    nt.links.new(nor.outputs["Color"], nmap.inputs["Color"])
    nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    if "Coat Weight" in bsdf.inputs and (tex_id == "marble_01" or tint):
        bsdf.inputs["Coat Weight"].default_value = 0.35
        bsdf.inputs["Coat Roughness"].default_value = 0.04


PAINT = {"plaster": (0.86, 0.83, 0.77), "ceiling": (0.93, 0.92, 0.89)}


def painted(mat, key):
    """Emulsion-painted plaster: an even ivory colour, with only the scanned surface relief from the texture."""
    textured(mat, "plastered_wall_04", 1.0, normal_strength=0.12 if key == "plaster" else 0.0)
    nt = mat.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    for link in list(bsdf.inputs["Base Color"].links) + list(bsdf.inputs["Roughness"].links):
        nt.links.remove(link)
    bsdf.inputs["Base Color"].default_value = (*PAINT[key], 1)
    bsdf.inputs["Roughness"].default_value = 0.88


def carpet(mat):
    """Beige carpet tiles, 0.5 m, each a shade different, with a fine pile bump."""
    mat.use_nodes = True
    nt = mat.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    for name in ("Base Color", "Roughness", "Normal"):
        for link in list(b.inputs[name].links):
            nt.links.remove(link)
    coord = nt.nodes.new("ShaderNodeTexCoord")
    brick = nt.nodes.new("ShaderNodeTexBrick")
    brick.offset = 0.0
    brick.inputs["Scale"].default_value = 1.0
    brick.inputs["Brick Width"].default_value = 0.5
    brick.inputs["Row Height"].default_value = 0.5
    brick.inputs["Mortar Size"].default_value = 0.002
    brick.inputs["Color1"].default_value = (0.44, 0.39, 0.33, 1)
    brick.inputs["Color2"].default_value = (0.4, 0.355, 0.3, 1)
    brick.inputs["Mortar"].default_value = (0.3, 0.27, 0.23, 1)
    nt.links.new(coord.outputs["UV"], brick.inputs["Vector"])
    nt.links.new(brick.outputs["Color"], b.inputs["Base Color"])
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 900.0
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.35
    bump.inputs["Distance"].default_value = 0.002
    nt.links.new(coord.outputs["UV"], noise.inputs["Vector"])
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Roughness"].default_value = 0.98
    if "Sheen Weight" in b.inputs:
        b.inputs["Sheen Weight"].default_value = 0.5


def upgrade_surfaces():
    done = 0
    for mat in bpy.data.materials:
        key = mat.name.split(".")[0]
        if key == "carpet":
            carpet(mat)
            done += 1
        elif key in PAINT:
            painted(mat, key)
            done += 1
        elif key in SURFACES:
            tex_id, rough, joints, *tint = SURFACES[key]
            textured(mat, tex_id, rough, joints, normal_strength=0.25 if key in ("plaster", "ceiling") else 0.6, tint=tint[0] if tint else None)
            done += 1
    print(f"[finish] photo-scanned textures on {done} materials")


def material(name, factory):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        factory(m)
    return m


def _principled(m):
    return next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")


def fabric_material():
    def make(m):
        b = _principled(m)
        b.inputs["Base Color"].default_value = (0.86, 0.81, 0.72, 1)
        b.inputs["Roughness"].default_value = 0.95
        b.inputs["Sheen Weight"].default_value = 0.6
        b.inputs["Subsurface Weight"].default_value = 0.08
    return material("curtain_fabric", make)


def simple_material(name, colour, rough=0.5, metal=0.0, emission=None, strength=0.0):
    def make(m):
        b = _principled(m)
        b.inputs["Base Color"].default_value = (*colour, 1)
        b.inputs["Roughness"].default_value = rough
        b.inputs["Metallic"].default_value = metal
        if emission:
            b.inputs["Emission Color"].default_value = (*emission, 1)
            b.inputs["Emission Strength"].default_value = strength
    return material(name, make)


def tile_material():
    def make(m):
        textured(m, "long_white_tiles", 0.5, box=True, normal_strength=0.8)
    return material("wall_tiles", make)


def marble_box_material():
    def make(m):
        textured(m, "marble_01", 0.35, box=True)
    return material("marble_skirting", make)


# ---------------------------------------------------------------- geometry helpers

class Mesh:
    """Accumulates boxes (plan coordinates, heights above the residence floor) into one object."""

    def __init__(self, name, mat, elevation):
        self.bm = bmesh.new()
        self.name = name
        self.mat = mat
        self.e = elevation

    def box(self, x1, y1, z1, x2, y2, z2):
        if x2 - x1 < 1e-4 or y2 - y1 < 1e-4 or z2 - z1 < 1e-4:
            return
        e = self.e
        # plan y runs south; Blender y = -plan y
        vs = [self.bm.verts.new((x, -y, e + z)) for z in (z1, z2) for y in (y1, y2) for x in (x1, x2)]
        for f in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)):
            self.bm.faces.new([vs[i] for i in f])

    def done(self):
        me = bpy.data.meshes.new(self.name)
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        self.bm.to_mesh(me)
        self.bm.free()
        me.materials.append(self.mat)
        ob = bpy.data.objects.new(self.name, me)
        bpy.context.scene.collection.objects.link(ob)
        return ob


def _overlaps(a, b, pad=0.0):
    return a["x1"] < b["x2"] + pad and a["x2"] > b["x1"] - pad and a["y1"] < b["y2"] + pad and a["y2"] > b["y1"] - pad


def _inside(x, y, r, pad=0.0):
    return r["x1"] - pad <= x <= r["x2"] + pad and r["y1"] - pad <= y <= r["y2"] + pad


def wall_runs(room, cuts, step=0.05):
    """Edges of a room's rectangles where there is wall: not shared with its own other rectangles, not cut by openings.
    Yields (side, fixed, a, b): side N/S/E/W, the edge coordinate, and the run along it."""
    rects = room["rects"]
    for i, r in enumerate(rects):
        for side in "NSWE":
            if side in "NS":
                fixed = r["y1"] if side == "N" else r["y2"]
                lo, hi = r["x1"], r["x2"]
                probe = lambda t: (t, fixed + (-0.06 if side == "N" else 0.06))
                at = lambda t: (t, fixed)
            else:
                fixed = r["x1"] if side == "W" else r["x2"]
                lo, hi = r["y1"], r["y2"]
                probe = lambda t: (fixed + (-0.06 if side == "W" else 0.06), t)
                at = lambda t: (fixed, t)
            keep = []
            n = max(1, int((hi - lo) / step))
            for k in range(n):
                t = lo + (k + 0.5) * (hi - lo) / n
                px, py = probe(t)
                ex, ey = at(t)
                own = any(_inside(px, py, o) for j, o in enumerate(rects) if j != i)
                cut = any(_inside(ex, ey, c, 0.02) for c in cuts)
                keep.append(not own and not cut)
            k = 0
            while k < n:
                if keep[k]:
                    s = k
                    while k < n and keep[k]:
                        k += 1
                    yield side, fixed, lo + s * (hi - lo) / n, lo + k * (hi - lo) / n
                else:
                    k += 1


def along(mesh, side, fixed, a, b, t, z1, z2):
    """A strip of thickness t standing on a room edge, on the room's side of the wall."""
    if side == "N":
        mesh.box(a, fixed, z1, b, fixed + t, z2)
    elif side == "S":
        mesh.box(a, fixed - t, z1, b, fixed, z2)
    elif side == "W":
        mesh.box(fixed, a, z1, fixed + t, b, z2)
    else:
        mesh.box(fixed - t, a, z1, fixed, b, z2)


# ---------------------------------------------------------------- finishing

def finish(layout):
    e = layout["residenceElevation"]
    ceiling = layout["ceilingHeight"]
    head = layout["doorHead"]
    rooms = [r for r in layout["rooms"] if r["kind"] != "outdoor"]
    door_cuts = [d["rect"] for d in layout["doors"]] + [o["rect"] for o in layout["openings"]]
    window_cuts = [w["rect"] for w in layout["windows"]]

    upgrade_surfaces()

    # skirting: marble-tile skirting on marble floors, white painted skirting on laminate
    marble_sk = Mesh("finish_skirting_marble", marble_box_material(), e)
    white_sk = Mesh("finish_skirting_white", simple_material("skirting_white", (0.92, 0.9, 0.86), 0.35), e)
    # no skirting under floor-to-ceiling glazing
    low_sills = [w["rect"] for w in layout["windows"] if w["sill"] < 0.2]
    for room in rooms:
        if room["kind"] == "bathroom":
            continue
        target = white_sk if room["finish"] in ("oak", "darkPlank") else marble_sk
        for side, fixed, a, b in wall_runs(room, door_cuts):
            for s0, s1 in _split(side, fixed, a, b, low_sills):
                along(target, side, fixed, s0, s1, 0.012, 0.0, 0.1 if target is marble_sk else 0.09)
    marble_sk.done()
    white_sk.done()

    # bathroom walls tiled to 2.1 m (the kitchen has a full-height quartz splashback instead)
    tiles = Mesh("finish_wall_tiles", tile_material(), e)
    for room in rooms:
        if room["kind"] == "bathroom":
            for side, fixed, a, b in wall_runs(room, door_cuts + window_cuts):
                along(tiles, side, fixed, a, b, 0.008, 0.0, 2.1)
    tiles.done()

    # wooden architraves around every internal door and archway, both faces
    frames = Mesh("finish_door_frames", simple_material("frame_teak", (0.33, 0.2, 0.11), 0.45), e)
    for d in layout["doors"] + layout["openings"]:
        if d.get("glazed"):
            continue
        r = d["rect"]
        top = d.get("head", head)
        w, depth = 0.07, 0.02
        if d["axis"] == "x":  # opening runs along x; wall faces at y1 and y2
            for y0, y1 in ((r["y1"] - depth, r["y1"]), (r["y2"], r["y2"] + depth)):
                frames.box(r["x1"] - w, y0, 0, r["x1"], y1, top + w)
                frames.box(r["x2"], y0, 0, r["x2"] + w, y1, top + w)
                frames.box(r["x1"] - w, y0, top, r["x2"] + w, y1, top + w)
            frames.box(r["x1"], r["y1"], 0, r["x1"] + 0.03, r["y2"], top)
            frames.box(r["x2"] - 0.03, r["y1"], 0, r["x2"], r["y2"], top)
            frames.box(r["x1"], r["y1"], top - 0.03, r["x2"], r["y2"], top)
        else:
            for x0, x1 in ((r["x1"] - depth, r["x1"]), (r["x2"], r["x2"] + depth)):
                frames.box(x0, r["y1"] - w, 0, x1, r["y1"], top + w)
                frames.box(x0, r["y2"], 0, x1, r["y2"] + w, top + w)
                frames.box(x0, r["y1"] - w, top, x1, r["y2"] + w, top + w)
            frames.box(r["x1"], r["y1"], 0, r["x2"], r["y1"] + 0.03, top)
            frames.box(r["x1"], r["y2"] - 0.03, 0, r["x2"], r["y2"], top)
            frames.box(r["x1"], r["y1"], top - 0.03, r["x2"], r["y2"], top)
    frames.done()

    # feature walls (wood panelling, terracotta, orange arches, charcoal) come with the furniture as accentWall items;
    # bedroom three's window wall is painted grey and its window has a white four-pane frame (client's photo)
    grey_wall = Mesh("finish_grey_wall", simple_material("paint_grey", (0.2, 0.195, 0.19), 0.9), e)
    frame_white = Mesh("finish_window_frame_white", simple_material("frame_white", (0.85, 0.85, 0.83), 0.35), e)
    for room in rooms:
        if room["id"] != "bed3":
            continue
        for side, fixed, a, b in wall_runs(room, door_cuts + window_cuts):
            if side == "W":
                along(grey_wall, side, fixed, a, b, 0.004, 0.0, ceiling)
        for w in layout["windows"]:
            r = w["rect"]
            if w["side"] != "W" or not _overlaps(r, room["rects"][0]):
                continue
            x0, x1 = r["x2"] - 0.07, r["x2"] + 0.006
            y1, y2, s0, s1 = r["y1"], r["y2"], w["sill"], w["head"]
            t = 0.05
            for yy in (y1, (y1 + y2) / 2 - t / 2, y2 - t):
                frame_white.box(x0, yy, s0, x1, yy + t, s1)
            for zz in (s0, s0 + (s1 - s0) * 0.72, s1 - t):
                frame_white.box(x0, y1, zz, x1, y2, zz + t)
            for yy in (y1 + (y2 - y1) * 0.25, y1 + (y2 - y1) * 0.75):
                frame_white.box(x0, yy - 0.015, s0 + (s1 - s0) * 0.72, x1, yy + 0.015, s1)
    grey_wall.done()
    frame_white.done()
    master_arches(layout, rooms, e)

    spotlights(rooms, e, ceiling)
    curtains(layout, rooms, e, ceiling)
    print("[finish] skirting, bathroom tiles, door frames, spotlights and curtains added")


def master_arches(layout, rooms, e):
    """Arched white surrounds inside the master bedroom's tall windows: the window corners are filled with a curved
    spandrel so each opening reads as a soft arch, like the sculpted glazing in the client's pink-bed photo."""
    master = next((r for r in rooms if r["id"] == "master"), None)
    if master is None:
        return
    mat = simple_material("arch_white", (0.86, 0.85, 0.82), 0.4)
    bm = bmesh.new()
    spans = [(w["side"], w["rect"], w["sill"], w["head"]) for w in layout["windows"] if w["sill"] < 0.2]
    made = 0
    for side, r, sill, head in spans:
        if not any(_overlaps(r, rc, 0.05) for rc in master["rects"]):
            continue
        if side in "NS":
            face = r["y2"] if side == "N" else r["y1"]
            inward = 1 if side == "N" else -1
            a, b = r["x1"], r["x2"]
        else:
            face = r["x2"] if side == "W" else r["x1"]
            inward = 1 if side == "W" else -1
            a, b = r["y1"], r["y2"]
        span = b - a
        rad = min(span / 2, 0.9)
        seg = 24
        for depth in (0.0, 0.08):
            pass
        # a closed ring: top edge, then the arch curve from right to left, all on one plane, extruded inward
        prof = [(a, head), (b, head)]
        for k in range(seg + 1):
            t = math.pi * k / seg  # 0 at the right spring, pi at the left
            cx = (a + b) / 2
            prof.append((cx + (span / 2) * math.cos(t), head - rad + rad * math.sin(t) - 0.001))
        rings = []
        for off in (0.0, 0.1):
            pos = face + inward * off
            ring = []
            for u, z in prof:
                ring.append(bm.verts.new((u, -pos, e + z) if side in "NS" else (pos, -u, e + z)))
            rings.append(ring)
        n = len(prof)
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((rings[0][i], rings[0][j], rings[1][j], rings[1][i]))
        for ring in rings:
            try:
                bm.faces.new(ring if ring is rings[0] else list(reversed(ring)))
            except ValueError:
                pass
        made += 1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new("finish_master_arches")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    ob = bpy.data.objects.new("finish_master_arches", me)
    bpy.context.scene.collection.objects.link(ob)
    bev = ob.modifiers.new("round", "BEVEL")
    bev.width = 0.02
    bev.segments = 3
    print(f"[finish] arched surrounds on {made} master windows")


def _split(side, fixed, a, b, cuts):
    """Remove the parts of run [a, b] covered by any cut rectangle on this edge."""
    spans = [(a, b)]
    for c in cuts:
        if side in "NS":
            if not (c["y1"] - 0.35 <= fixed <= c["y2"] + 0.35):
                continue
            ca, cb = c["x1"], c["x2"]
        else:
            if not (c["x1"] - 0.35 <= fixed <= c["x2"] + 0.35):
                continue
            ca, cb = c["y1"], c["y2"]
        nxt = []
        for s0, s1 in spans:
            if cb <= s0 or ca >= s1:
                nxt.append((s0, s1))
                continue
            if ca > s0:
                nxt.append((s0, ca))
            if cb < s1:
                nxt.append((cb, s1))
        spans = nxt
    return spans


def spotlights(rooms, e, ceiling):
    disc_mat = simple_material("spot_trim", (0.95, 0.93, 0.9), 0.3, emission=(1.0, 0.92, 0.8), strength=25.0)
    bm = bmesh.new()
    count = 0
    for room in rooms:
        if room["kind"] not in ("living", "bedroom", "kitchen", "bathroom") and room["id"] != "lobby":
            continue
        r = room["rects"][0]
        w, d = r["x2"] - r["x1"], r["y2"] - r["y1"]
        inset = 0.85 if min(w, d) > 3 else 0.6
        nx = 1 if w < 2.6 else 2 if w < 5 else 3
        ny = 1 if d < 2.6 else 2 if d < 5 else 3
        if room["kind"] == "bathroom":
            nx = ny = 1
        for i in range(nx):
            for j in range(ny):
                x = r["x1"] + inset + (w - 2 * inset) * (i / (nx - 1) if nx > 1 else 0.5)
                y = r["y1"] + inset + (d - 2 * inset) * (j / (ny - 1) if ny > 1 else 0.5)
                ring = bmesh.ops.create_circle(bm, cap_ends=True, radius=0.045, segments=20)
                for v in ring["verts"]:
                    v.co = Vector((x + v.co.x, -y + v.co.y, e + ceiling - 0.004))
                light = bpy.data.lights.new(f"spot_{room['id']}_{i}_{j}", "SPOT")
                light.energy = 9.0 if room["kind"] != "bathroom" else 14.0
                light.spot_size = math.radians(80)
                light.spot_blend = 0.7
                light.shadow_soft_size = 0.03
                light.color = (1.0, 0.9, 0.78)
                ob = bpy.data.objects.new(light.name, light)
                ob.location = Vector((x, -y, e + ceiling - 0.02))
                bpy.context.scene.collection.objects.link(ob)
                count += 1
    me = bpy.data.meshes.new("finish_spotlights")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(disc_mat)
    ob = bpy.data.objects.new("finish_spotlights", me)
    bpy.context.scene.collection.objects.link(ob)
    print(f"[finish] {count} recessed spotlights")


def curtains(layout, rooms, e, ceiling):
    """Two pleated drapes drawn open at the sides of each window or glass door in the living spaces and bedrooms, on a rod."""
    fabric = fabric_material()
    grey = simple_material("curtain_grey", (0.2, 0.19, 0.185), 0.95)
    # bedroom three has grey drapes, as in the client's photo
    grey_rooms = [r for r in rooms if r["id"] == "bed3"]
    rod_mat = simple_material("curtain_rod", (0.12, 0.11, 0.1), 0.35, metal=0.8)
    bm = bmesh.new()
    rods = Mesh("finish_curtain_rods", rod_mat, e)
    lived = [r for r in rooms if r["kind"] in ("living", "bedroom") and r["id"] != "master"]
    spans = [(w["side"], w["rect"]) for w in layout["windows"] if w["sill"] < 1.2]
    spans += [("S", d["rect"]) for d in layout["doors"] if d.get("glazed")]
    made = 0
    for side, r in spans:
        if not any(_overlaps(r, rc, 0.31) for room in lived for rc in room["rects"]):
            continue
        if side in "NS":
            face = r["y2"] if side == "N" else r["y1"]
            inward = 1 if side == "N" else -1
            a, b = r["x1"], r["x2"]
        else:
            face = r["x2"] if side == "W" else r["x1"]
            inward = 1 if side == "W" else -1
            a, b = r["y1"], r["y2"]
        off = face + inward * 0.12
        tone = 1 if any(_overlaps(r, rc, 0.31) for room in grey_rooms for rc in room["rects"]) else 0
        panel = 0.42
        for c0 in (a - 0.18 - panel, b + 0.18):
            pleats = 9
            segs = pleats * 4
            for k in range(segs):
                t0, t1 = k / segs, (k + 1) / segs
                u0, u1 = c0 + t0 * panel, c0 + t1 * panel
                w0 = math.sin(t0 * pleats * 2 * math.pi) * 0.035
                w1 = math.sin(t1 * pleats * 2 * math.pi) * 0.035
                quad = []
                for u, w in ((u0, w0), (u1, w1)):
                    for z in (0.03, ceiling - 0.12):
                        if side in "NS":
                            quad.append((u, -(off + inward * w), e + z))
                        else:
                            quad.append((off + inward * w, -u, e + z))
                vs = [bm.verts.new(p) for p in (quad[0], quad[2], quad[3], quad[1])]
                bm.faces.new(vs).material_index = tone
        if side in "NS":
            rods.box(a - 0.7, off - 0.012, ceiling - 0.13, b + 0.7, off + 0.012, ceiling - 0.105)
        else:
            rods.box(off - 0.012, a - 0.7, ceiling - 0.13, off + 0.012, b + 0.7, ceiling - 0.105)
        made += 1
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0005)
    me = bpy.data.meshes.new("finish_curtains")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(fabric)
    me.materials.append(grey)
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new("finish_curtains", me)
    bpy.context.scene.collection.objects.link(ob)
    sol = ob.modifiers.new("thickness", "SOLIDIFY")
    sol.thickness = 0.004
    rods.done()
    print(f"[finish] curtains on {made} windows and glass doors")
