"""
Contemporary furniture for Residence 11A, modelled in Blender.

Poly Haven's CC0 furniture is mostly vintage, so the pieces that set the
style of a current Indian 3BHK are built here instead: soft upholstered
sofa and dining chairs, walnut tables on slim legs, beds with
channel-tufted headboards and layered bedding, floating nightstands with
lamps, handleless wardrobes with black profile handles, and modern
bathroom fittings (wall-hung WC, vessel basin on a floating vanity,
frameless glass shower in matte black), and a luxury modular kitchen:
handleless greige run with a quartz splashback, walnut appliance column
and a quartz waterfall island with counter stools.

Every builder works in the item's local frame — origin at the centre of
its floor footprint, front facing −Y — and fills the w × d × h box the
floor plan reserves for it, so collision and checks stay true.
"""
import math

import bmesh
import bpy
from mathutils import Matrix, Vector

# ---------------------------------------------------------------- materials


def _mat(name, make):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        make(m, next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"))
    return m


def fabric(name, colour, sheen=0.5, weave=0.25):
    def make(m, b):
        nt = m.node_tree
        b.inputs["Base Color"].default_value = (*colour, 1)
        b.inputs["Roughness"].default_value = 0.92
        b.inputs["Sheen Weight"].default_value = sheen
        b.inputs["Sheen Tint"].default_value = (1, 1, 1, 1)
        # woven texture: fine noise into the bump
        noise = nt.nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 900.0
        noise.inputs["Detail"].default_value = 4.0
        bump = nt.nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = weave
        bump.inputs["Distance"].default_value = 0.002
        nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
        nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return _mat(name, make)


def solid(name, colour, rough=0.5, metal=0.0, coat=0.0, emit=None, strength=0.0, transmission=0.0):
    def make(m, b):
        b.inputs["Base Color"].default_value = (*colour, 1)
        b.inputs["Roughness"].default_value = rough
        b.inputs["Metallic"].default_value = metal
        b.inputs["Coat Weight"].default_value = coat
        if transmission:
            b.inputs["Transmission Weight"].default_value = transmission
            b.inputs["IOR"].default_value = 1.5
        if emit:
            b.inputs["Emission Color"].default_value = (*emit, 1)
            b.inputs["Emission Strength"].default_value = strength
    return _mat(name, make)


def existing(name, fallback):
    """A material from the imported model (walnut, oak …) so new pieces match the rest of the home."""
    for m in bpy.data.materials:
        if m.name.split(".")[0] == name:
            return m
    return fallback


def palette():
    return {
        "oat": fabric("m_fabric_oat", (0.62, 0.57, 0.5)),
        "taupe": fabric("m_fabric_taupe", (0.42, 0.37, 0.33)),
        "sage": fabric("m_fabric_sage", (0.43, 0.48, 0.41)),
        "rust": fabric("m_fabric_rust", (0.52, 0.24, 0.13)),
        "ink": fabric("m_fabric_ink", (0.16, 0.2, 0.26)),
        "linen": fabric("m_linen_white", (0.86, 0.85, 0.82), sheen=0.3, weave=0.12),
        "throw": fabric("m_throw_knit", (0.55, 0.46, 0.36), sheen=0.6, weave=0.6),
        "outdoor": fabric("m_fabric_outdoor", (0.78, 0.75, 0.68), sheen=0.2),
        "walnut": existing("walnut", solid("m_walnut", (0.2, 0.12, 0.07), 0.45)),
        "oak": existing("oakWood", solid("m_oak", (0.6, 0.45, 0.3), 0.5)),
        "teak": existing("teak", solid("m_teak", (0.45, 0.3, 0.18), 0.6)),
        "black": solid("m_black_metal", (0.025, 0.025, 0.025), 0.42, metal=0.85),
        "matte": solid("m_matte_laminate", (0.84, 0.82, 0.78), 0.6),
        "laminate_dark": solid("m_laminate_greige", (0.42, 0.39, 0.35), 0.55),
        "quartz": solid("m_quartz", (0.9, 0.89, 0.87), 0.18, coat=0.4),
        "ceramic": solid("m_ceramic_white", (0.93, 0.93, 0.92), 0.08, coat=0.6),
        "glass": solid("m_glass_clear", (0.95, 0.97, 0.97), 0.0, transmission=1.0),
        "shade": solid("m_lamp_shade", (0.92, 0.88, 0.8), 0.9, emit=(1.0, 0.82, 0.6), strength=1.2, transmission=0.3),
        "stone": solid("m_lamp_stone", (0.75, 0.7, 0.64), 0.6),
        "brass": existing("brass", solid("m_brass", (0.8, 0.62, 0.35), 0.25, metal=1.0)),
        "greige": solid("m_kitchen_greige", (0.13, 0.115, 0.1), 0.42, coat=0.15),
        "dark_glass": solid("m_appliance_glass", (0.015, 0.015, 0.018), 0.04, coat=1.0),
        "steel": solid("m_brushed_steel", (0.55, 0.55, 0.55), 0.3, metal=1.0),
        "led": solid("m_led_strip", (1.0, 0.9, 0.75), 0.5, emit=(1.0, 0.82, 0.6), strength=12.0),
    }


# ---------------------------------------------------------------- mesh helpers

class Piece:
    """Builds one furniture object from rounded boxes and cylinders in the item's local frame."""

    def __init__(self, name, frame):
        self.name = name
        self.frame = frame
        self.objects = []

    def _add(self, bm, mat, bevel=0.0, segments=3, smooth=True):
        me = bpy.data.meshes.new(f"{self.name}.{len(self.objects)}")
        bm.to_mesh(me)
        bm.free()
        me.materials.append(mat)
        if smooth:
            for p in me.polygons:
                p.use_smooth = True
        ob = bpy.data.objects.new(me.name, me)
        ob.matrix_world = self.frame
        bpy.context.scene.collection.objects.link(ob)
        if bevel > 0:
            mod = ob.modifiers.new("round", "BEVEL")
            mod.width = bevel
            mod.segments = segments
            mod.limit_method = "NONE"
        self.objects.append(ob)
        return ob

    def box(self, mat, cx, cy, z0, w, d, h, r=0.0, seg=3, tilt=0.0):
        """Rounded box: centre (cx, cy) in plan-local metres, bottom z0, size w × d × h, edge radius r."""
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        for v in bm.verts:
            v.co = Vector((v.co.x * w, v.co.y * d, v.co.z * h + h / 2))
        if tilt:
            bmesh.ops.rotate(bm, verts=bm.verts, cent=Vector((0, 0, 0)), matrix=Matrix.Rotation(tilt, 3, "X"))
        bmesh.ops.translate(bm, verts=bm.verts, vec=Vector((cx, cy, z0)))
        return self._add(bm, mat, bevel=min(r, w / 2.05, d / 2.05, h / 2.05), segments=seg, smooth=r > 0)

    def cyl(self, mat, cx, cy, z0, r_bottom, r_top, h, seg=32, bevel=0.0):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r_bottom, radius2=r_top, depth=h)
        bmesh.ops.translate(bm, verts=bm.verts, vec=Vector((cx, cy, z0 + h / 2)))
        return self._add(bm, mat, bevel=bevel, segments=2, smooth=True)

    def ellipsoid(self, mat, cx, cy, cz, rx, ry, rz):
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=1.0)
        for v in bm.verts:
            v.co = Vector((cx + v.co.x * rx, cy + v.co.y * ry, cz + v.co.z * rz))
        return self._add(bm, mat, smooth=True)

    def leg(self, mat, x, y, h, r_top=0.018, r_bottom=0.012, splay=0.0):
        """Tapered round leg from the floor to height h, optionally splayed outward."""
        ob = self.cyl(mat, 0, 0, 0, r_bottom, r_top, h, seg=16)
        lean = Matrix.Translation(Vector((x, y, 0))) @ Matrix.Rotation(splay * (1 if x > 0 else -1), 4, "Y")
        ob.matrix_world = self.frame @ lean
        return ob


def lamp_light(frame, x, y, z, watts=6.0):
    data = bpy.data.lights.new("table_lamp", "POINT")
    data.energy = watts
    data.color = (1.0, 0.8, 0.58)
    data.shadow_soft_size = 0.06
    ob = bpy.data.objects.new(data.name, data)
    ob.matrix_world = frame @ Matrix.Translation(Vector((x, y, z)))
    bpy.context.scene.collection.objects.link(ob)


# ---------------------------------------------------------------- builders (front faces −Y)

def sofa(p, it, M):
    w, d = it["w"], it["d"]
    seat_h = 0.44
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.cyl(M["black"], sx * (w / 2 - 0.12), sy * (d / 2 - 0.1), 0, 0.012, 0.016, 0.1, seg=12)
    p.box(M["oat"], 0, 0, 0.1, w, d, 0.2, r=0.03)  # base
    n = 3 if w > 2.4 else 2
    arm = 0.17
    inner = w - 2 * arm
    cw = inner / n
    for i in range(n):
        cx = -inner / 2 + cw * (i + 0.5)
        p.box(M["oat"], cx, -0.08, 0.3, cw - 0.015, d - 0.32, 0.16, r=0.06, seg=5)  # seat cushion
        p.box(M["oat"], cx, d / 2 - 0.17, seat_h, cw - 0.03, 0.22, 0.44, r=0.08, seg=5, tilt=-0.12)  # back cushion
    p.box(M["oat"], 0, d / 2 - 0.06, 0.3, w, 0.12, 0.42, r=0.04)  # back frame
    for sx in (-1, 1):
        p.box(M["oat"], sx * (w / 2 - arm / 2), 0, 0.3, arm, d, 0.3, r=0.06, seg=5)  # arms
    # scatter cushions
    for sx, mat in ((-1, M["rust"]), (1, M["ink"])):
        p.box(mat, sx * (inner / 2 - 0.3), d / 2 - 0.33, seat_h + 0.02, 0.44, 0.13, 0.42, r=0.06, seg=5, tilt=-0.25)


def dining_chair(p, it, M):
    outdoor = it["room"] == "balcony"
    wood = M["teak"] if outdoor else M["walnut"]
    cloth = M["outdoor"] if outdoor else M["taupe"]
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.leg(wood, sx * 0.19, sy * 0.19, 0.44, r_top=0.017, r_bottom=0.011, splay=0.05)
    p.box(cloth, 0, 0.0, 0.43, 0.48, 0.46, 0.07, r=0.025, seg=4)
    p.box(cloth, 0, 0.22, 0.48, 0.46, 0.05, 0.42, r=0.02, seg=4, tilt=-0.1)
    p.box(wood, 0, 0.24, 0.45, 0.42, 0.02, 0.04)


def desk_chair(p, it, M):
    p.cyl(M["black"], 0, 0, 0, 0.26, 0.26, 0.02, seg=5)
    p.cyl(M["black"], 0, 0, 0.02, 0.025, 0.025, 0.4)
    p.box(M["taupe"], 0, 0, 0.42, 0.48, 0.46, 0.08, r=0.03, seg=4)
    p.box(M["taupe"], 0, 0.21, 0.55, 0.46, 0.06, 0.45, r=0.03, seg=4, tilt=-0.1)
    for sx in (-1, 1):
        p.box(M["black"], sx * 0.25, 0.02, 0.5, 0.025, 0.36, 0.025, r=0.01)


def table(p, it, M):
    """Dining table: walnut top with a softened edge on four splayed tapered legs."""
    w, d, h = it["w"], it["d"], it["h"]
    outdoor = it["room"] == "balcony"
    wood = M["teak"] if outdoor else M["walnut"]
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.leg(wood, sx * (w / 2 - 0.16), sy * (d / 2 - 0.12), h - 0.04, r_top=0.03, r_bottom=0.018, splay=0.06)
    p.box(wood, 0, 0, h - 0.13, w - 0.3, d - 0.2, 0.09)  # apron
    p.box(wood, 0, 0, h - 0.04, w, d, 0.04, r=0.008)


def round_table(p, it, M):
    r = it["w"] / 2
    outdoor = it["room"] == "balcony"
    p.cyl(M["black"], 0, 0, 0, 0.22, 0.22, 0.02)
    p.cyl(M["black"], 0, 0, 0.02, 0.03, 0.03, it["h"] - 0.06)
    p.cyl(M["teak"] if outdoor else M["quartz"], 0, 0, it["h"] - 0.04, r, r, 0.04, seg=48, bevel=0.006)


def coffee_table(p, it, M):
    """Low walnut table with rounded corners on a slim black frame, with a lower shelf."""
    w, d, h = it["w"], it["d"], it["h"]
    wood = M["teak"] if it["room"] == "balcony" else M["walnut"]
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.box(M["black"], sx * (w / 2 - 0.05), sy * (d / 2 - 0.05), 0, 0.02, 0.02, h - 0.03)
    p.box(wood, 0, 0, h - 0.035, w, d, 0.035, r=0.015)
    p.box(wood, 0, 0, 0.1, w - 0.12, d - 0.12, 0.02, r=0.006)


def side_table(p, it, M):
    r = min(it["w"], it["d"]) / 2
    p.cyl(M["black"], 0, 0, 0, r * 0.6, r * 0.6, 0.015)
    p.cyl(M["black"], 0, 0, 0.015, 0.018, 0.018, it["h"] - 0.045)
    p.cyl(M["quartz"], 0, 0, it["h"] - 0.03, r, r, 0.03, seg=40, bevel=0.005)


def bed(p, it, M):
    w, d = it["w"], it["d"]
    master = it["room"] == "master"
    head_cloth = M["sage"] if master else M["oat"]
    # platform base on a recessed plinth
    p.box(M["black"], 0, 0, 0, w - 0.2, d - 0.2, 0.08)
    p.box(head_cloth, 0, 0.0, 0.08, w + 0.08, d + 0.04, 0.24, r=0.03, seg=4)
    # mattress, fitted sheet
    p.box(M["linen"], 0, 0.0, 0.3, w - 0.04, d - 0.06, 0.22, r=0.06, seg=5)
    # duvet over the lower two thirds, folded back at the top
    p.box(M["linen"], 0, -d * 0.16, 0.48, w + 0.04, d * 0.7, 0.08, r=0.04, seg=5)
    p.box(M["linen"], 0, d * 0.19, 0.5, w + 0.02, 0.12, 0.07, r=0.035, seg=4)
    # knitted throw across the foot
    p.box(M["throw"], 0, -d / 2 + 0.36, 0.55, w + 0.08, 0.5, 0.025, r=0.012, seg=3)
    # pillows: two sleeping, two decorative
    pw = (w - 0.2) / 2 if w > 1.4 else w - 0.2
    xs = (-pw / 2 - 0.04, pw / 2 + 0.04) if w > 1.4 else (0.0,)
    for x in xs:
        p.box(M["linen"], x, d / 2 - 0.3, 0.52, pw, 0.42, 0.15, r=0.07, seg=6, tilt=-0.35)
        p.box(M["rust"] if master else M["ink"], x * 0.7, d / 2 - 0.48, 0.55, 0.42, 0.13, 0.38, r=0.06, seg=5, tilt=-0.3)
    # channel-tufted headboard: vertical upholstered ribs
    hw = w + 0.2
    ribs = max(6, int(hw / 0.16))
    rw = hw / ribs
    for i in range(ribs):
        p.box(head_cloth, -hw / 2 + rw * (i + 0.5), d / 2 - 0.03, 0.25, rw - 0.008, 0.1, 0.95, r=0.045, seg=5)


def nightstand(p, it, M):
    """Floating-look walnut nightstand with one drawer, on slim black legs, and a table lamp."""
    w, d = it["w"], it["d"]
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.box(M["black"], sx * (w / 2 - 0.04), sy * (d / 2 - 0.04), 0, 0.015, 0.015, 0.18)
    p.box(M["walnut"], 0, 0, 0.18, w, d, 0.34, r=0.008)
    p.box(M["black"], 0, -d / 2 - 0.001, 0.36, w - 0.06, 0.004, 0.006)
    # lamp: stone base, linen drum shade
    p.ellipsoid(M["stone"], 0.03, 0.05, 0.62, 0.08, 0.08, 0.1)
    p.cyl(M["brass"], 0.03, 0.05, 0.7, 0.008, 0.008, 0.12, seg=8)
    p.cyl(M["shade"], 0.03, 0.05, 0.78, 0.15, 0.12, 0.2, seg=32)
    lamp_light(p.frame, 0.03, 0.05, 0.86)


def wardrobe(p, it, M):
    """Floor-to-ceiling handleless wardrobe: matte laminate doors with black profile handles and a loft above."""
    w, d, h = it["w"], it["d"], it["h"]
    p.box(M["matte"], 0, 0.01, 0, w, d - 0.02, h)
    n = max(2, round(w / 0.5))
    dw = w / n
    for i in range(1, n):
        p.box(M["black"], -w / 2 + dw * i, -d / 2 + 0.008, 0.06, 0.004, 0.004, h - 0.12)
    p.box(M["black"], 0, -d / 2 + 0.008, 2.25, w, 0.004, 0.004)  # loft line
    for i in range(n):
        x = -w / 2 + dw * (i + 0.5) + (dw / 2 - 0.03) * (1 if i % 2 else -1)
        p.box(M["black"], x, -d / 2 - 0.006, 0.7, 0.012, 0.012, 0.9)  # profile handle
    p.box(M["black"], 0, -d / 2 + 0.01, 0, w, 0.01, 0.06)  # recessed plinth


def dresser(p, it, M):
    w, d, h = it["w"], it["d"], it["h"]
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.box(M["black"], sx * (w / 2 - 0.05), sy * (d / 2 - 0.05), 0, 0.016, 0.016, 0.16)
    p.box(M["walnut"], 0, 0, 0.16, w, d, h - 0.16, r=0.008)
    for z in (0.38, 0.6):
        p.box(M["black"], 0, -d / 2 - 0.001, z, w - 0.06, 0.004, 0.005)
    p.ellipsoid(M["stone"], w * 0.3, 0, h + 0.12, 0.07, 0.07, 0.12)


def desk(p, it, M):
    w, d, h = it["w"], it["d"], it["h"]
    for sx in (-1, 1):
        p.box(M["black"], sx * (w / 2 - 0.03), 0, 0, 0.025, d - 0.06, 0.025)
        p.box(M["black"], sx * (w / 2 - 0.03), 0, 0, 0.025, 0.025, h - 0.03)
    p.box(M["walnut"], 0, 0, h - 0.03, w, d, 0.03, r=0.006)
    p.box(M["walnut"], w * 0.25, 0.02, h - 0.17, w * 0.4, d - 0.08, 0.14, r=0.004)
    p.cyl(M["black"], -w * 0.33, d * 0.2, h, 0.06, 0.06, 0.015)
    p.cyl(M["black"], -w * 0.33, d * 0.2, h + 0.015, 0.008, 0.008, 0.38, seg=8)
    p.cyl(M["black"], -w * 0.33, d * 0.05, h + 0.36, 0.06, 0.035, 0.1)


def bench(p, it, M):
    w, d = it["w"], it["d"]
    for sx in (-1, 1):
        p.box(M["black"], sx * (w / 2 - 0.06), 0, 0, 0.02, d - 0.06, 0.02)
        p.box(M["black"], sx * (w / 2 - 0.06), 0, 0, 0.02, 0.02, 0.36)
    p.box(M["sage"] if it["room"] == "master" else M["oat"], 0, 0, 0.34, w, d, 0.12, r=0.035, seg=4)


def sideboard(p, it, M):
    """Fluted walnut sideboard on black legs."""
    w, d, h = it["w"], it["d"], it["h"]
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.box(M["black"], sx * (w / 2 - 0.06), sy * (d / 2 - 0.06), 0, 0.018, 0.018, 0.14)
    p.box(M["walnut"], 0, 0, 0.14, w, d, h - 0.14, r=0.006)
    ribs = int(w / 0.04)
    for i in range(ribs):
        p.cyl(M["walnut"], -w / 2 + 0.02 + i * (w - 0.04) / (ribs - 1), -d / 2, 0.17, 0.012, 0.012, h - 0.2, seg=10)


def vanity(p, it, M):
    """Floating walnut vanity, quartz top, white vessel basin, matte-black wall spout."""
    w, d = it["w"], it["d"]
    p.box(M["walnut"], 0, 0.01, 0.42, w, d - 0.02, 0.36, r=0.006)
    p.box(M["black"], 0, -d / 2 + 0.008, 0.56, w - 0.06, 0.004, 0.005)
    p.box(M["quartz"], 0, 0, 0.78, w + 0.01, d + 0.01, 0.03, r=0.004)
    p.ellipsoid(M["ceramic"], 0, -0.02, 0.86, min(0.22, w / 2 - 0.06), 0.17, 0.08)
    p.box(M["black"], 0, d / 2 - 0.07, 1.0, 0.025, 0.16, 0.025, r=0.006)
    p.box(M["black"], 0.12, d / 2 - 0.02, 0.98, 0.04, 0.03, 0.06, r=0.01)


def wc(p, it, M):
    """Wall-hung WC with a soft-close seat and a black flush plate on the concealed cistern."""
    p.box(M["ceramic"], 0, 0.04, 0.22, 0.36, 0.52, 0.2, r=0.1, seg=6)
    p.box(M["ceramic"], 0, 0.04, 0.4, 0.36, 0.52, 0.04, r=0.12, seg=6)
    p.box(M["ceramic"], 0, 0.25, 0.43, 0.3, 0.06, 0.32, r=0.02)
    p.box(M["black"], 0, it["d"] / 2 - 0.005, 1.0, 0.22, 0.01, 0.15, r=0.01)


def shower(p, it, M):
    """Frameless glass panel, linear drain, square matte-black rain head and mixer."""
    w, d = it["w"], it["d"]
    p.box(M["glass"], -0.15, -d / 2 + 0.01, 0.0, w - 0.3, 0.01, 2.0)
    p.box(M["black"], -0.15, -d / 2 + 0.01, 2.0, w - 0.3, 0.02, 0.015)
    p.box(M["black"], 0, d / 2 - 0.15, 0.002, w - 0.2, 0.06, 0.004)
    p.box(M["black"], w / 4, d / 4, 2.1, 0.25, 0.25, 0.01, r=0.004)
    p.box(M["black"], w / 4, d / 4, 2.11, 0.02, 0.02, 0.2)
    p.box(M["black"], w / 2 - 0.03, 0, 1.0, 0.02, 0.08, 0.2, r=0.006)


def kitchen_run(p, it, M):
    """Handleless greige base run: gola channel, quartz top and full-height splashback, undermount sink, gooseneck tap."""
    w, d, h = it["w"], it["d"], it["h"]
    front = -d / 2
    p.box(M["black"], 0, 0.05, 0, w - 0.02, d - 0.1, 0.1)  # recessed plinth
    p.box(M["greige"], 0, 0.015, 0.1, w, d - 0.03, 0.68, r=0.002)
    p.box(M["black"], 0, 0.035, 0.78, w, d - 0.07, 0.05)  # gola channel
    n = max(1, round(w / 0.6))
    for i in range(1, n):
        p.box(M["black"], -w / 2 + w / n * i, front + 0.015, 0.11, 0.004, 0.004, 0.66)
    for i in range(0, n, 2):
        p.box(M["black"], -w / 2 + w / n * (i + 0.5), front + 0.015, 0.45, w / n - 0.01, 0.004, 0.004)
    p.box(M["quartz"], 0, 0, h - 0.07, w, d, 0.05, r=0.004)
    p.box(M["quartz"], 0, d / 2 - 0.01, h - 0.02, w, 0.02, 0.62)  # splashback
    p.box(M["led"], 0, d / 2 - 0.035, h + 0.58, w - 0.04, 0.012, 0.008)
    if w >= 2.5:
        sx = w / 2 - 1.2  # under the kitchen window
        p.box(M["steel"], sx, -0.02, h - 0.24, 0.7, 0.42, 0.2)  # basin below the counter
        p.box(M["dark_glass"], sx, -0.02, h - 0.019, 0.7, 0.4, 0.001)
        p.cyl(M["black"], sx, d / 2 - 0.12, h - 0.02, 0.022, 0.018, 0.36, seg=20)
        p.box(M["black"], sx, d / 2 - 0.23, h + 0.3, 0.025, 0.24, 0.025, r=0.01)
        p.cyl(M["black"], sx + 0.08, d / 2 - 0.1, h - 0.02, 0.018, 0.018, 0.12, seg=16)


def tall_units(p, it, M):
    """Walnut appliance column: integrated fridge-freezer, built-in oven and combi microwave in black glass."""
    w, d, h = it["w"], it["d"], it["h"]
    front = -d / 2 - 0.001
    p.box(M["black"], 0, 0.04, 0, w - 0.04, d - 0.08, 0.1)
    p.box(M["walnut"], 0, 0.01, 0.1, w, d - 0.02, h - 0.1, r=0.003)
    p.box(M["black"], 0, front, 0.12, 0.004, 0.004, h - 0.14)  # bay split
    p.box(M["black"], -w / 4, front, 0.85, w / 2 - 0.02, 0.004, 0.004)  # freezer drawer
    p.box(M["black"], 0, front, h - 0.4, w - 0.02, 0.004, 0.004)  # loft line
    p.box(M["black"], -0.05, front - 0.012, 0.95, 0.02, 0.025, 1.1, r=0.006)
    p.box(M["black"], -0.05, front - 0.012, 0.25, 0.02, 0.025, 0.5, r=0.006)
    ox = w / 4
    p.box(M["black"], ox, front - 0.004, 0.8, 0.62, 0.012, 1.18)  # appliance frame
    p.box(M["dark_glass"], ox, front - 0.012, 0.84, 0.56, 0.006, 0.52)
    p.box(M["dark_glass"], ox, front - 0.012, 1.48, 0.56, 0.006, 0.42)
    p.box(M["steel"], ox, front - 0.03, 1.37, 0.5, 0.018, 0.018, r=0.008)
    p.box(M["steel"], ox, front - 0.03, 1.92, 0.5, 0.018, 0.018, r=0.008)
    for z in (0.33, 0.58):
        p.box(M["black"], ox, front, z, w / 2 - 0.04, 0.004, 0.004)
    p.box(M["led"], 0, front + 0.04, h - 0.01, w - 0.04, 0.02, 0.008)


def island(p, it, M):
    """Quartz waterfall island: greige drawers to the hob side, fluted walnut and a breakfast overhang to the front."""
    w, d, h = it["w"], it["d"], it["h"]
    base = d - 0.28
    by = d / 2 - base / 2  # base sits to the back (+Y); overhang to the front (−Y)
    p.box(M["black"], 0, by, 0, w - 0.2, base - 0.08, 0.08)
    p.box(M["greige"], 0, by, 0.08, w - 0.12, base, h - 0.13, r=0.002)
    for z in (0.35, 0.6):
        p.box(M["black"], 0, d / 2 + 0.001, z, w - 0.16, 0.004, 0.004)
    ribs = int((w - 0.16) / 0.04)
    for i in range(ribs):
        p.cyl(M["walnut"], -w / 2 + 0.1 + i * 0.04, by - base / 2 - 0.01, 0.08, 0.014, 0.014, h - 0.18, seg=12)
    p.box(M["quartz"], 0, 0, h - 0.05, w, d, 0.05, r=0.004)
    for sx in (-1, 1):
        p.box(M["quartz"], sx * (w / 2 - 0.025), 0, 0, 0.05, d, h - 0.05, r=0.003)
    p.box(M["led"], 0, -d / 2 + 0.05, h - 0.058, w - 0.14, 0.02, 0.006)


def stool(p, it, M):
    """Counter stool: black frame with a footrest ring, upholstered seat and low back."""
    if it["room"] != "kitchen":
        return dining_chair(p, it, M)
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.leg(M["black"], sx * 0.17, sy * 0.17, 0.66, r_top=0.012, r_bottom=0.01, splay=0.04)
    for sy in (-1, 1):
        p.box(M["black"], 0, sy * 0.18, 0.26, 0.38, 0.016, 0.016)
        p.box(M["black"], sy * 0.18, 0, 0.26, 0.016, 0.38, 0.016)
    p.box(M["taupe"], 0, 0, 0.64, 0.42, 0.4, 0.07, r=0.03, seg=4)
    p.box(M["taupe"], 0, 0.18, 0.71, 0.4, 0.05, 0.2, r=0.02, seg=4, tilt=-0.12)


def pendant(p, it, M):
    """Island pendant: small matte-black dome with a brass rim on a thin cord, about 0.8 m above the counter."""
    ceiling, low = 3.0, 1.75
    r = it["w"] / 2
    p.cyl(M["black"], 0, 0, ceiling - 0.025, 0.06, 0.06, 0.025)
    p.cyl(M["black"], 0, 0, low + 0.2, 0.003, 0.003, ceiling - low - 0.2, seg=8)
    p.cyl(M["black"], 0, 0, low + 0.14, 0.03, 0.03, 0.07)
    p.cyl(M["black"], 0, 0, low, r, 0.035, 0.16, seg=40)
    p.cyl(M["brass"], 0, 0, low - 0.006, r, r, 0.008, seg=40)
    p.cyl(M["shade"], 0, 0, low + 0.01, r - 0.02, r - 0.02, 0.004, seg=40)
    lamp_light(p.frame, 0, 0, low - 0.04, watts=3.0)


BUILDERS = {
    "pendant": pendant,
    "kitchenRun": kitchen_run,
    "tallUnits": tall_units,
    "island": island,
    "stool": stool,
    "sofa": sofa,
    "chair": dining_chair,
    "deskChair": desk_chair,
    "table": table,
    "roundTable": round_table,
    "coffeeTable": coffee_table,
    "sideTable": side_table,
    "bed": bed,
    "nightstand": nightstand,
    "wardrobe": wardrobe,
    "dresser": dresser,
    "desk": desk,
    "bench": bench,
    "sideboard": sideboard,
    "vanity": vanity,
    "wc": wc,
    "shower": shower,
}


def wants(it):
    """Whether this item is modelled here (pendants only over the kitchen island; the rest use CC0 lamps)."""
    if it["type"] not in BUILDERS or it.get("variant") == "outdoor":
        return False
    return it["type"] != "pendant" or it["room"] == "kitchen"


def build(it, frame, materials):
    builder = BUILDERS.get(it["type"])
    if builder is None or it.get("variant") == "outdoor":
        return False
    builder(Piece(f"modern-{it['id']}", frame), it, materials)
    return True
