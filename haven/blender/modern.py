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


def wood(name, dark, light, scale=3.0):
    """Procedural veneer: fine noise stretched into long, quiet streaks between two wood tones."""
    def make(m, b):
        nt = m.node_tree
        coord = nt.nodes.new("ShaderNodeTexCoord")
        mapping = nt.nodes.new("ShaderNodeMapping")
        mapping.inputs["Scale"].default_value = (scale * 8.0, scale * 8.0, scale * 0.4)
        nt.links.new(coord.outputs["Object"], mapping.inputs["Vector"])
        noise = nt.nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 4.0
        noise.inputs["Detail"].default_value = 6.0
        noise.inputs["Roughness"].default_value = 0.55
        nt.links.new(mapping.outputs["Vector"], noise.inputs["Vector"])
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].position = 0.35
        ramp.color_ramp.elements[1].position = 0.65
        ramp.color_ramp.elements[0].color = (*dark, 1)
        ramp.color_ramp.elements[1].color = (*light, 1)
        nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.55
        b.inputs["Coat Weight"].default_value = 0.1
    return _mat(name, make)


def swirl_art():
    """Abstract marbled canvas in black, white, grey and burnt orange, like the painting in the client's hall photo."""
    def make(m, b):
        nt = m.node_tree
        coord = nt.nodes.new("ShaderNodeTexCoord")
        noise = nt.nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 0.9
        noise.inputs["Detail"].default_value = 10.0
        noise.inputs["Distortion"].default_value = 6.0
        nt.links.new(coord.outputs["Object"], noise.inputs["Vector"])
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        cr = ramp.color_ramp
        stops = [(0.0, (0.005, 0.006, 0.012)), (0.44, (0.01, 0.012, 0.02)), (0.48, (0.25, 0.26, 0.28)), (0.52, (0.85, 0.85, 0.83)),
                 (0.56, (0.5, 0.12, 0.03)), (0.6, (0.8, 0.79, 0.77)), (0.66, (0.06, 0.07, 0.1)), (1.0, (0.005, 0.006, 0.012))]
        cr.elements[0].position, cr.elements[0].color = stops[0][0], (*stops[0][1], 1)
        cr.elements[1].position, cr.elements[1].color = stops[-1][0], (*stops[-1][1], 1)
        for pos, col in stops[1:-1]:
            e = cr.elements.new(pos)
            e.color = (*col, 1)
        nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.6
    return _mat("m_art_swirl", make)


def existing(name, fallback):
    """A material from the imported model (walnut, oak …) so new pieces match the rest of the home."""
    for m in bpy.data.materials:
        if m.name.split(".")[0] == name:
            return m
    return fallback


def palette():
    import luxe
    return {**{
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
        "greige": wood("m_kitchen_driftwood", (0.05, 0.038, 0.03), (0.13, 0.1, 0.08)),
        "dark_glass": solid("m_appliance_glass", (0.015, 0.015, 0.018), 0.04, coat=1.0),
        "steel": solid("m_brushed_steel", (0.55, 0.55, 0.55), 0.3, metal=1.0),
        "led": solid("m_led_strip", (1.0, 0.9, 0.75), 0.5, emit=(1.0, 0.82, 0.6), strength=12.0),
        # restyle palette, after the client's concept images
        "tan": fabric("m_fabric_tan", (0.075, 0.042, 0.03), sheen=0.6),
        "tan_dark": fabric("m_fabric_tan_dark", (0.2, 0.12, 0.08), sheen=0.4),
        "black_leather": solid("m_black_leather", (0.018, 0.018, 0.02), 0.45, coat=0.2),
        "pink_leather": solid("m_pink_leather", (0.86, 0.43, 0.37), 0.5, coat=0.08),
        "gold": solid("m_gold", (0.85, 0.62, 0.32), 0.25, metal=1.0),
        "flower": solid("m_flower_red", (0.6, 0.06, 0.05), 0.6),
        "mustard": fabric("m_fabric_mustard", (0.62, 0.36, 0.06), sheen=0.4),
        "maroon": fabric("m_fabric_maroon", (0.11, 0.022, 0.025), sheen=0.25, weave=0.5),
        "rose": fabric("m_fabric_rose", (0.42, 0.13, 0.13), sheen=0.5),
        "grey": fabric("m_fabric_grey", (0.32, 0.31, 0.3), sheen=0.4),
        "orange": fabric("m_fabric_orange", (0.75, 0.22, 0.05), sheen=0.4),
        "cream": solid("m_cream_lacquer", (0.75, 0.7, 0.62), 0.35, coat=0.3),
        "stone_dark": solid("m_stone_dark", (0.06, 0.06, 0.065), 0.25, coat=0.4),
        "driftwood": wood("m_driftwood", (0.055, 0.038, 0.028), (0.14, 0.1, 0.075)),
        "light_oak": wood("m_light_oak", (0.42, 0.28, 0.16), (0.62, 0.45, 0.28)),
        "glow_warm": solid("m_glow_warm", (0.95, 0.55, 0.06), 0.8, emit=(1.0, 0.55, 0.06), strength=0.8),
        "veneer": wood("m_veneer_warm", (0.3, 0.15, 0.075), (0.46, 0.25, 0.13)),
        "walnut_dark": wood("m_walnut_recess", (0.07, 0.038, 0.022), (0.13, 0.072, 0.042)),
        "art_swirl": swirl_art(),
        "shag": fabric("m_rug_shag", (0.2, 0.2, 0.195), sheen=0.8, weave=0.9),
        "terracotta": solid("m_paint_terracotta", (0.42, 0.115, 0.05), 0.92),
        "shelf_white": solid("m_shelf_white", (0.72, 0.72, 0.7), 0.4, coat=0.1),
        "screen": solid("m_screen", (0.02, 0.025, 0.035), 0.1, emit=(0.5, 0.6, 0.8), strength=0.6),
        "book_a": solid("m_book_a", (0.02, 0.02, 0.022), 0.6),
        "book_b": solid("m_book_b", (0.7, 0.68, 0.64), 0.6),
        "book_c": solid("m_book_c", (0.3, 0.06, 0.03), 0.6),
        "book_d": solid("m_book_d", (0.18, 0.2, 0.24), 0.6),
        "placemat": fabric("m_placemat", (0.03, 0.03, 0.03), sheen=0.2, weave=0.8),
        "orange_paint": solid("m_paint_orange", (0.85, 0.24, 0.06), 0.85),
        "cream_wall": solid("m_paint_cream", (0.74, 0.69, 0.6), 0.8),
        "groove": solid("m_groove", (0.3, 0.26, 0.22), 0.8),
        "taupe_duvet": fabric("m_fabric_duvet_taupe", (0.32, 0.27, 0.22), sheen=0.5),
        "bulb": solid("m_bulb", (1.0, 0.9, 0.7), 0.3, emit=(1.0, 0.78, 0.5), strength=25.0),
    }, **luxe.palette()}  # the luxury palette wins where names collide (walnut, oak, brass)


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


    def arch(self, mat, cx, cy0, cy1, z0, r_out, r_in, seg=40):
        """Half ring standing in the x-z plane (an arch over the x axis), extruded along y from cy0 to cy1.
        r_in = 0 gives a half disc."""
        bm = bmesh.new()
        rings = []
        for y in (cy0, cy1):
            outer = [bm.verts.new((cx + r_out * math.cos(math.pi * i / seg), y, z0 + r_out * math.sin(math.pi * i / seg))) for i in range(seg + 1)]
            if r_in > 0:
                inner = [bm.verts.new((cx + r_in * math.cos(math.pi * i / seg), y, z0 + r_in * math.sin(math.pi * i / seg))) for i in range(seg + 1)]
            else:
                inner = [bm.verts.new((cx, y, z0))] * (seg + 1)
            rings.append((outer, inner))
        (o0, i0), (o1, i1) = rings
        for i in range(seg):
            bm.faces.new((o0[i], o0[i + 1], o1[i + 1], o1[i]))
            if r_in > 0:
                bm.faces.new((i0[i + 1], i0[i], i1[i], i1[i + 1]))
                bm.faces.new((o0[i + 1], o0[i], i0[i], i0[i + 1]))
                bm.faces.new((o1[i], o1[i + 1], i1[i + 1], i1[i]))
            else:
                bm.faces.new((o0[i + 1], o0[i], i0[0]))
                bm.faces.new((o1[i], o1[i + 1], i1[0]))
        for k in (0, seg):
            if r_in > 0:
                bm.faces.new((o0[k], o1[k], i1[k], i0[k]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        return self._add(bm, mat, smooth=True)

    def sector(self, mat, cx, cy, z0, r, t, h, a0, a1, seg=32):
        """Curved upright panel: a ring sector around the z axis from angle a0 to a1 (radians, 0 = +x), thickness t, height h."""
        bm = bmesh.new()
        cols = []
        for i in range(seg + 1):
            a = a0 + (a1 - a0) * i / seg
            ca, sa = math.cos(a), math.sin(a)
            cols.append([bm.verts.new((cx + rr * ca, cy + rr * sa, z)) for rr in (r, r - t) for z in (z0, z0 + h)])
        for i in range(seg):
            a, b = cols[i], cols[i + 1]
            bm.faces.new((a[0], b[0], b[1], a[1]))  # outer
            bm.faces.new((a[2], a[3], b[3], b[2]))  # inner
            bm.faces.new((a[1], b[1], b[3], a[3]))  # top
            bm.faces.new((a[0], a[2], b[2], b[0]))  # bottom
        for c in (cols[0], cols[-1]):
            bm.faces.new((c[0], c[1], c[3], c[2]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        ob = self._add(bm, mat, smooth=True)
        mod = ob.modifiers.new("round", "BEVEL")
        mod.width = min(0.01, t / 3)
        mod.segments = 2
        return ob

    def rumple(self, ob, strength=0.03, size=0.22):
        """Soft folds: subdivide and push the surface with a cloud texture (duvets, throws)."""
        sub = ob.modifiers.new("subdiv", "SUBSURF")
        sub.levels = sub.render_levels = 3
        sub.subdivision_type = "SIMPLE"
        tex = bpy.data.textures.get("rumple") or bpy.data.textures.new("rumple", "CLOUDS")
        tex.noise_scale = size
        disp = ob.modifiers.new("folds", "DISPLACE")
        disp.texture = tex
        disp.strength = strength
        disp.mid_level = 0.5
        smooth = ob.modifiers.new("smooth", "SMOOTH")
        smooth.iterations = 2
        return ob

    def prism(self, mat, pts, y0, y1):
        """A flat shape drawn in the x-z plane (list of (x, z)), extruded along y from y0 to y1."""
        bm = bmesh.new()
        f = [bm.verts.new((x, y0, z)) for x, z in pts]
        b = [bm.verts.new((x, y1, z)) for x, z in pts]
        bm.faces.new(f)
        bm.faces.new(list(reversed(b)))
        n = len(pts)
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((f[i], f[j], b[j], b[i]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        return self._add(bm, mat, smooth=False)

    def panel_y(self, mat, cx, cy, cz, r, depth, seg=40):
        """Upright disc facing -y (front), centre (cx, cy, cz)."""
        ob = self.cyl(mat, 0, 0, -depth / 2, r, r, depth, seg=seg)
        ob.matrix_world = self.frame @ Matrix.Translation(Vector((cx, cy, cz))) @ Matrix.Rotation(math.pi / 2, 4, "X")
        return ob


def area_light(frame, x, y, z, size, watts, colour=(1.0, 0.78, 0.52)):
    data = bpy.data.lights.new("feature_light", "AREA")
    data.energy = watts
    data.color = colour
    data.size = size
    ob = bpy.data.objects.new(data.name, data)
    ob.matrix_world = frame @ Matrix.Translation(Vector((x, y, z)))
    bpy.context.scene.collection.objects.link(ob)


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
    v = it.get("variant")
    if v in ("tan", "tanThrow"):
        return tan_sofa(p, it, M)
    seat_h = 0.44
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.cyl(M["black"], sx * (w / 2 - 0.12), sy * (d / 2 - 0.1), 0, 0.012, 0.016, 0.1, seg=12)
    cloth = M["oat"]
    p.box(cloth, 0, 0, 0.1, w, d, 0.2, r=0.03)  # base
    n = 3 if w > 2.4 else 2
    arm = 0.17
    inner = w - 2 * arm
    cw = inner / n
    for i in range(n):
        cx = -inner / 2 + cw * (i + 0.5)
        p.box(cloth, cx, -0.08, 0.3, cw - 0.015, d - 0.32, 0.16, r=0.06, seg=5)  # seat cushion
        p.box(cloth, cx, d / 2 - 0.17, seat_h, cw - 0.03, 0.22, 0.44, r=0.08, seg=5, tilt=-0.12)  # back cushion
    p.box(cloth, 0, d / 2 - 0.06, 0.3, w, 0.12, 0.42, r=0.04)  # back frame
    for sx in (-1, 1):
        p.box(cloth, sx * (w / 2 - arm / 2), 0, 0.3, arm, d, 0.3, r=0.06, seg=5)  # arms
    for sx, mat in ((-1, M["rust"]), (1, M["ink"])):
        p.box(mat, sx * (inner / 2 - 0.3), d / 2 - 0.33, seat_h + 0.02, 0.44, 0.13, 0.42, r=0.06, seg=5, tilt=-0.25)


def tan_sofa(p, it, M):
    """Low, deep sofa with slim square arms on tapered black legs, as in the client's hall photo."""
    w, d = it["w"], it["d"]
    cloth = M["tan"]
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.leg(M["black"], sx * (w / 2 - 0.08), sy * (d / 2 - 0.08), 0.15, r_top=0.018, r_bottom=0.008)
    p.box(cloth, 0, 0, 0.14, w, d, 0.22, r=0.02, seg=3)
    arm = 0.15
    inner = w - 2 * arm
    for sx in (-1, 1):
        p.box(cloth, sx * (w / 2 - arm / 2), 0, 0.14, arm, d, 0.47, r=0.03, seg=4)
    p.box(cloth, 0, d / 2 - 0.08, 0.36, inner, 0.16, 0.42, r=0.03, seg=4)
    for i in range(2):
        cx = -inner / 4 + inner / 2 * i
        p.box(cloth, cx, -0.06, 0.36, inner / 2 - 0.012, d - 0.3, 0.15, r=0.06, seg=6)
        p.box(cloth, cx, d / 2 - 0.26, 0.48, inner / 2 - 0.03, 0.22, 0.4, r=0.09, seg=6, tilt=-0.14)
    pillows = ((-1, M["ink"]), (1, M["mustard"])) if it.get("variant") == "tanThrow" else ((-1, M["ink"]), (1, M["tan_dark"]))
    for sx, mat in pillows:
        p.box(mat, sx * (inner / 2 - 0.26), d / 2 - 0.4, 0.5, 0.44, 0.14, 0.42, r=0.07, seg=6, tilt=-0.3)
    p.box(M["oat"], -inner / 2 + 0.62, d / 2 - 0.42, 0.5, 0.38, 0.12, 0.34, r=0.06, seg=6, tilt=-0.35)
    if it.get("variant") == "tanThrow":
        throw = p.box(M["throw"], w / 2 - 0.3, 0.02, 0.52, 0.5, d * 0.8, 0.03, r=0.01, seg=2)
        p.rumple(throw, 0.025, 0.15)
        drop = p.box(M["throw"], w / 2 - 0.3, -d / 2 + 0.06, 0.2, 0.5, 0.03, 0.34, r=0.01, seg=2)
        p.rumple(drop, 0.02, 0.15)


def dining_chair(p, it, M):
    outdoor = it["room"] == "balcony"
    if it["room"] == "dining":
        # black upholstered chair on slim black-metal legs
        for sx in (-1, 1):
            p.box(M["black"], sx * 0.2, 0, 0, 0.016, 0.46, 0.016)  # sled runner
            for sy in (-1, 1):
                p.box(M["black"], sx * 0.2, sy * 0.21, 0, 0.016, 0.016, 0.44)
        p.box(M["black_leather"], 0, 0.0, 0.42, 0.5, 0.48, 0.08, r=0.025, seg=4)
        p.box(M["black_leather"], 0, 0.23, 0.48, 0.5, 0.06, 0.48, r=0.025, seg=4, tilt=-0.08)
        return
    wood = M["teak"] if outdoor else M["walnut"]
    cloth = M["outdoor"] if outdoor else M["taupe"]
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.leg(wood, sx * 0.19, sy * 0.19, 0.44, r_top=0.017, r_bottom=0.011, splay=0.05)
    p.box(cloth, 0, 0.0, 0.43, 0.48, 0.46, 0.07, r=0.025, seg=4)
    p.box(cloth, 0, 0.22, 0.48, 0.46, 0.05, 0.42, r=0.02, seg=4, tilt=-0.1)
    p.box(wood, 0, 0.24, 0.45, 0.42, 0.02, 0.04)


def desk_chair(p, it, M):
    if it.get("variant") == "orange":
        p.cyl(M["black"], 0, 0, 0, 0.27, 0.27, 0.02, seg=5)
        p.cyl(M["black"], 0, 0, 0.02, 0.025, 0.025, 0.4)
        p.box(M["orange"], 0, 0, 0.42, 0.48, 0.46, 0.08, r=0.04, seg=5)
        p.box(M["orange"], 0, 0.21, 0.5, 0.46, 0.06, 0.42, r=0.05, seg=5, tilt=-0.12)
        return
    p.cyl(M["black"], 0, 0, 0, 0.26, 0.26, 0.02, seg=5)
    p.cyl(M["black"], 0, 0, 0.02, 0.025, 0.025, 0.4)
    p.box(M["taupe"], 0, 0, 0.42, 0.48, 0.46, 0.08, r=0.03, seg=4)
    p.box(M["taupe"], 0, 0.21, 0.55, 0.46, 0.06, 0.45, r=0.03, seg=4, tilt=-0.1)
    for sx in (-1, 1):
        p.box(M["black"], sx * 0.25, 0.02, 0.5, 0.025, 0.36, 0.025, r=0.01)


def table(p, it, M):
    """Dining table: walnut top with a softened edge on four splayed tapered legs."""
    w, d, h = it["w"], it["d"], it["h"]
    if it.get("variant") == "slab":
        # thick driftwood slab on panel legs with a shelf between
        for sx in (-1, 1):
            p.box(M["driftwood"], sx * (w / 2 - 0.4), 0, 0, 0.07, d - 0.25, h - 0.08, r=0.004)
        p.box(M["driftwood"], 0, 0, 0.2, w - 0.8, d - 0.35, 0.05, r=0.004)
        p.box(M["driftwood"], 0, 0, h - 0.1, w, d, 0.1, r=0.01)
        for sx in (-1, 1):
            p.box(M["black"], sx * (w / 2 - 0.4), 0, 0, 0.09, d - 0.2, h - 0.1)
        p.box(M["black"], 0, 0, 0.2, w - 0.8, d - 0.3, 0.06)
        places = [(-0.5, -0.3), (0.5, -0.3), (-0.5, 0.3), (0.5, 0.3), (-w / 2 + 0.25, 0.0), (w / 2 - 0.25, 0.0)]
        for x, y in places:
            p.box(M["placemat"], x, y, h, 0.42, 0.32, 0.004, r=0.01)
            p.cyl(M["ceramic"], x, y, h + 0.004, 0.13, 0.135, 0.016, seg=32)
            p.cyl(M["ceramic"], x, y, h + 0.02, 0.05, 0.075, 0.055, seg=28)
            gx, gy = x + (0.17 if x <= 0 else -0.17), y * 0.55
            p.cyl(M["glass"], gx, gy, h, 0.035, 0.035, 0.008, seg=20)
            p.cyl(M["glass"], gx, gy, h + 0.008, 0.005, 0.005, 0.09, seg=10)
            p.cyl(M["glass"], gx, gy, h + 0.098, 0.025, 0.04, 0.1, seg=24)
        p.cyl(M["black"], -0.05, 0.0, h, 0.12, 0.17, 0.07, seg=32)
        for x, y in ((-0.1, 0.03), (0.0, -0.04), (0.05, 0.05), (-0.02, 0.08)):
            p.ellipsoid(M["orange"], x, y, h + 0.1, 0.045, 0.045, 0.045)
        for x, ch in ((0.28, 0.22), (0.38, 0.15), (0.33, 0.1)):
            p.cyl(M["glow_warm"], x, 0.05, h, 0.03, 0.03, ch, seg=20)
            lamp_light(p.frame, x, 0.05, h + ch + 0.03, watts=1.0)
        return
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
    if it.get("variant") == "round":
        r = w / 2
        for i in range(3):
            a = i / 3 * math.pi * 2
            p.cyl(M["black"], math.cos(a) * r * 0.8, math.sin(a) * r * 0.8, 0.02, 0.012, 0.012, h - 0.06, seg=10)
        p.sector(M["black"], 0, 0, 0.07, r * 0.8 + 0.01, 0.02, 0.015, 0, math.pi * 2, seg=48)
        p.cyl(M["stone_dark"], 0, 0, h - 0.04, r, r, 0.035, seg=48, bevel=0.006)
        return
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
    v = it.get("variant")
    if v == "sculpted":
        return sculpted_bed(p, it, M)
    if v in ("twin", "grey"):
        return upholstered_bed(p, it, M)
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


def sculpted_bed(p, it, M):
    """The client's pink-bed photo: a low, soft pink-leather platform under a thick rounded hood that arches over the
    head, lit warm yellow inside, with a tufted headboard pad, mustard sheet, maroon knit throw, a curving ledge with a
    book niche on one side and a round tray on the other."""
    w, d = it["w"], it["d"]
    head = d / 2  # local +Y is the wall side
    mw = w - 0.7
    # platform: one soft rounded mass
    p.box(M["pink_leather"], 0, -0.1, 0.02, w - 0.1, d - 0.2, 0.3, r=0.15, seg=8)
    p.box(M["black"], 0, -0.1, 0.0, w - 0.4, d - 0.5, 0.03)
    # mattress, sheet, knit throw, pillows
    p.box(M["mustard"], 0, -0.12, 0.3, mw, d - 0.55, 0.2, r=0.07, seg=6)
    throw = p.box(M["maroon"], 0, -d * 0.2, 0.43, mw + 0.12, d * 0.48, 0.1, r=0.04, seg=3)
    p.rumple(throw, 0.035, 0.18)
    for sx in (-1, 1):
        p.box(M["maroon"], sx * mw * 0.25, head - 0.52, 0.48, mw * 0.42, 0.3, 0.2, r=0.09, seg=6, tilt=-0.35)
        p.box(M["pink_leather"], sx * mw * 0.18, head - 0.72, 0.5, mw * 0.3, 0.14, 0.32, r=0.07, seg=6, tilt=-0.3)
    p.box(M["rose"], 0, head - 0.82, 0.52, mw * 0.28, 0.12, 0.3, r=0.07, seg=6, tilt=-0.25)
    # tufted headboard pad inside the hood: three soft vertical cushions
    for i in range(3):
        p.box(M["pink_leather"], (i - 1) * mw * 0.33, head - 0.2, 0.42, mw * 0.32, 0.14, 0.62, r=0.07, seg=6)
    # the hood: a thick rounded arch, pink outside, warm yellow inside
    R, T, L, z0 = w / 2 - 0.02, 0.2, 0.95, 0.3
    hood = p.arch(M["pink_leather"], 0, head, head - L, z0, R, R - T, seg=56)
    lining = [p.arch(M["glow_warm"], 0, head - 0.01, head - L + 0.04, z0, R - T - 0.002, R - T - 0.012, seg=56),
              p.arch(M["glow_warm"], 0, head - 0.06, head - 0.07, z0, R - T - 0.002, 0, seg=56),
              p.arch(M["bulb"], 0, head - L + 0.1, head - L + 0.06, z0, R - T - 0.004, R - T - 0.02, seg=56)]
    # a wide, low oval rather than a half circle, as in the photo
    squash = Matrix.Translation(Vector((0, 0, z0))) @ Matrix.Diagonal((1.0, 1.0, 0.7, 1.0)) @ Matrix.Translation(Vector((0, 0, -z0)))
    for ob in [hood] + lining:
        ob.matrix_world = p.frame @ squash
    mod = hood.modifiers.new("round", "BEVEL")
    mod.width = 0.06
    mod.segments = 6
    mod.limit_method = "ANGLE"
    # reading lamps inside the hood
    for sx in (-1, 1):
        p.cyl(M["gold"], sx * (R - T - 0.22), head - 0.35, z0 + 0.5, 0.05, 0.11, 0.12)
        lamp_light(p.frame, sx * (R - T - 0.22), head - 0.35, z0 + 0.47, watts=3.0)
    # right: a curving ledge out of the hood foot, with a book niche below
    lx, ly = w / 2 - 0.17, head - L - 0.32
    p.box(M["pink_leather"], lx, ly, 0.05, 0.34, 0.62, 0.42, r=0.15, seg=8)
    p.box(M["stone_dark"], lx + 0.01, ly - 0.29, 0.12, 0.24, 0.04, 0.16, r=0.05, seg=4)
    for i, mat in enumerate(("book_b", "book_d", "book_b")):
        p.box(M[mat], lx, ly - 0.16, 0.13 + i * 0.025, 0.2, 0.22, 0.022)
    p.cyl(M["black"], lx, ly + 0.12, 0.47, 0.04, 0.025, 0.24, seg=20)
    p.box(M["book_b"], lx, ly - 0.12, 0.47, 0.16, 0.2, 0.04)
    # left: round tray table with books and a pink vase of red flowers
    tx, ty = -(w / 2 - 0.18), head - L - 0.25
    p.cyl(M["gold"], tx, ty, 0.0, 0.02, 0.02, 0.5, seg=12)
    p.cyl(M["pink_leather"], tx, ty, 0.5, 0.2, 0.2, 0.05, bevel=0.02, seg=48)
    p.ellipsoid(M["pink_leather"], tx + 0.03, ty + 0.04, 0.68, 0.08, 0.08, 0.12)
    for k in range(9):
        a = k * 2.4
        p.ellipsoid(M["flower"], tx + 0.03 + 0.11 * math.cos(a) * (k % 3) / 2, ty + 0.04 + 0.11 * math.sin(a) * (k % 3) / 2, 0.88 + 0.05 * (k % 4), 0.045, 0.045, 0.035)
    for i, mat in enumerate(("book_c", "book_b")):
        p.box(M[mat], tx - 0.06, ty - 0.08, 0.55 + i * 0.03, 0.14, 0.18, 0.028)
    area_light(p.frame, 0, head - L / 2, z0 + (R - T) * 0.7 - 0.12, 0.9, 5.0, (1.0, 0.72, 0.35))


def upholstered_bed(p, it, M):
    """Twin: cream rounded single bed with an arched panel headboard. Grey: upholstered grey double bed."""
    w, d = it["w"], it["d"]
    twin = it.get("variant") == "twin"
    frame = M["cream"] if twin else M["grey"]
    p.box(frame, 0, 0, 0.04, w + 0.06, d, 0.34, r=0.08 if twin else 0.03, seg=5)
    p.box(M["linen"], 0, -0.03, 0.36, w - 0.04, d - 0.12, 0.18, r=0.05, seg=5)
    if twin:
        return twin_bed(p, it, M)
    else:
        pw = (w - 0.25) / 2
        for x in (-pw / 2 - 0.04, pw / 2 + 0.04):
            p.box(M["grey"], x, d / 2 - 0.28, 0.5, pw, 0.4, 0.17, r=0.08, seg=6, tilt=-0.4)
            p.box(M["linen"], x * 0.9, d / 2 - 0.45, 0.52, pw * 0.9, 0.36, 0.15, r=0.07, seg=6, tilt=-0.3)
        duvet = p.box(M["grey"], 0, -d * 0.12, 0.28, w + 0.14, d * 0.78, 0.31, r=0.05, seg=3)
        p.rumple(duvet, 0.08, 0.28)
        p.box(frame, 0, d / 2 + 0.05, 0.04, w + 0.14, 0.1, 0.95, r=0.03, seg=4)


def twin_bed(p, it, M):
    """The client's twin-bed photo: a soft cream tub with geometric groove lines, a tall arched headboard with seams,
    taupe duvet folded at the foot, a flat orange pillow and a textured cream cushion."""
    w, d = it["w"], it["d"]
    base_h = 0.42
    tub = p.box(M["cream"], 0, -0.06, 0.0, w + 0.08, d - 0.12, base_h, r=0.14, seg=8)
    # groove lines: a stepped band round the foot and the sides
    for z in (0.12, 0.3):
        p.box(M["groove"], 0, -d / 2 - 0.002, z, w - 0.1, 0.006, 0.006)
    p.box(M["groove"], -w * 0.18, -d / 2 - 0.002, 0.12, 0.006, 0.006, 0.18)
    p.box(M["groove"], w * 0.22, -d / 2 - 0.002, 0.2, 0.25, 0.006, 0.006)
    p.box(M["groove"], w * 0.22 + 0.125, -d / 2 - 0.002, 0.12, 0.006, 0.006, 0.08)
    for sx in (-1, 1):
        p.box(M["groove"], sx * (w / 2 + 0.042), -d * 0.1, 0.2, 0.006, d * 0.55, 0.006)
        p.box(M["groove"], sx * (w / 2 + 0.042), -d * 0.37, 0.12, 0.006, 0.006, 0.08)
    p.box(M["linen"], 0, 0.02, base_h, w - 0.06, d - 0.14, 0.14, r=0.05, seg=5)
    duvet = p.box(M["taupe_duvet"], 0, -d * 0.14, base_h + 0.02, w + 0.04, d * 0.66, 0.15, r=0.05, seg=3)
    p.rumple(duvet, 0.03, 0.2)
    p.box(M["taupe_duvet"], 0, d * 0.17, base_h + 0.14, w + 0.02, 0.22, 0.06, r=0.03, seg=3)
    p.box(M["orange"], 0, d / 2 - 0.25, base_h + 0.12, w - 0.2, 0.18, 0.4, r=0.06, seg=6, tilt=-0.25)
    cush = p.box(M["oat"], 0, d / 2 - 0.45, base_h + 0.14, w * 0.45, 0.14, 0.34, r=0.08, seg=6, tilt=-0.2)
    p.rumple(cush, 0.012, 0.05)
    # headboard: upright panel with an arched top and two seams
    hw, ht = w + 0.08, 0.85
    hy = d / 2 - 0.05
    p.box(M["cream"], 0, hy, 0.0, hw, 0.1, ht, r=0.03, seg=4)
    p.panel_y(M["cream"], 0, hy, ht, hw / 2, 0.1, seg=48)
    for x in (-hw / 4, hw / 4):
        p.box(M["groove"], x, hy - 0.052, base_h + 0.15, 0.006, 0.006, ht + hw / 2 - base_h - 0.25)


def nightstand(p, it, M):
    """Floating-look walnut nightstand with one drawer, on slim black legs, and a table lamp."""
    w, d = it["w"], it["d"]
    if it.get("variant") == "cube":
        h = it["h"]
        p.box(M["shelf_white"], 0, 0, 0, w, d, h, r=0.008)
        p.box(M["black"], 0, -d / 2 - 0.001, h * 0.62, w - 0.04, 0.004, 0.004)
        p.cyl(M["black"], -0.08, 0.05, h, 0.06, 0.06, 0.02)
        p.cyl(M["black"], -0.08, 0.05, h + 0.02, 0.008, 0.008, 0.36, seg=10)
        p.box(M["black"], -0.04, 0.05, h + 0.36, 0.1, 0.014, 0.014, r=0.004)
        p.cyl(M["black"], 0.02, 0.05, h + 0.24, 0.06, 0.025, 0.12)
        lamp_light(p.frame, 0.02, 0.05, h + 0.22, watts=3.0)
        p.box(M["book_a"], 0.1, -0.02, h, 0.14, 0.2, 0.03)
        return
    if it.get("variant") == "cream":
        h = it["h"]
        p.box(M["cream"], 0, 0, 0, w, d, h, r=0.06, seg=6)
        p.box(M["groove"], 0, -d / 2 - 0.002, h * 0.62, w - 0.1, 0.006, 0.006)
        p.box(M["groove"], 0, -d / 2 + 0.08, 0.06, w - 0.12, 0.16, 0.2, r=0.04, seg=4)  # open cubby
        p.box(M["orange"], -0.06, -d / 2 + 0.1, 0.07, 0.2, 0.14, 0.03)
        p.box(M["book_b"], -0.06, -d / 2 + 0.1, 0.1, 0.18, 0.13, 0.025)
        p.ellipsoid(M["ceramic"], 0.0, 0.05, h + 0.07, 0.08, 0.08, 0.07)
        stem = p.cyl(M["ceramic"], 0, 0, 0, 0.008, 0.008, 0.38, seg=8)
        stem.matrix_world = p.frame @ Matrix.Translation(Vector((0, 0.05, h + 0.12))) @ Matrix.Rotation(-0.25, 4, "X")
        p.cyl(M["ceramic"], 0, -0.06, h + 0.44, 0.06, 0.03, 0.08, seg=20)
        lamp_light(p.frame, 0.0, -0.06, h + 0.42, watts=3.0)
        return
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
    if it.get("variant") == "long":
        # long light-oak desk on drawer pedestals, along the window
        for sx in (-1, 1):
            p.box(M["light_oak"], sx * (w / 2 - 0.21), 0, 0, 0.42, d - 0.04, h - 0.04, r=0.004)
            for z in (0.24, 0.47):
                p.box(M["black"], sx * (w / 2 - 0.21), -d / 2 + 0.018, z, 0.36, 0.004, 0.004)
        p.box(M["light_oak"], 0, 0, h - 0.04, w, d, 0.04, r=0.005)
        p.box(M["steel"], w * 0.1, -0.02, h, 0.34, 0.24, 0.012, r=0.004)  # laptop, open
        p.box(M["steel"], w * 0.1, 0.11, h + 0.005, 0.34, 0.01, 0.23, r=0.004, tilt=0.25)
        p.box(M["screen"], w * 0.1, 0.103, h + 0.02, 0.31, 0.003, 0.2, tilt=0.25)
        p.box(M["book_d"], -w * 0.05, -0.05, h, 0.22, 0.3, 0.02)
        p.cyl(M["black"], -w * 0.3, d / 2 - 0.12, h, 0.06, 0.06, 0.015)
        p.cyl(M["black"], -w * 0.3, d / 2 - 0.12, h + 0.015, 0.008, 0.008, 0.4, seg=8)
        p.cyl(M["black"], -w * 0.3, d / 2 - 0.25, h + 0.38, 0.06, 0.035, 0.1)
        return
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
    if it.get("variant") == "windowSeat":
        h = it["h"]
        p.box(M["cream"], 0, 0, 0, w, d, h - 0.08, r=0.02)
        p.box(M["linen"], 0, 0, h - 0.08, w - 0.04, d - 0.04, 0.08, r=0.03, seg=4)
        for x, mat in ((-0.6, M["orange"]), (-0.28, M["oat"])):
            p.box(mat, x, d / 2 - 0.1, h, 0.32, 0.12, 0.28, r=0.06, seg=5, tilt=0.25)
        return
    if it.get("variant") == "ottoman":
        # two-tier tufted pouf: a stout base drum, a deeper top cushion with four puffed quarters and a button
        r = w / 2
        h = it["h"]
        p.cyl(M["pink_leather"], 0, 0, 0, r - 0.02, r - 0.02, h * 0.35, bevel=0.04, seg=48)
        p.cyl(M["pink_leather"], 0, 0, h * 0.35, r, r, h * 0.45, bevel=0.06, seg=48)
        for a in range(4):
            ang = a * math.pi / 2 + math.pi / 4
            p.ellipsoid(M["pink_leather"], math.cos(ang) * r * 0.4, math.sin(ang) * r * 0.4, h * 0.8, r * 0.46, r * 0.46, 0.07)
        p.ellipsoid(M["gold"], 0, 0, h * 0.86, 0.02, 0.02, 0.012)
        return
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
    # uppers: a black-framed glass cabinet lit inside with stacked dishes (left), a plain wood cabinet (right)
    ud, uz0, uh = 0.35, 1.5, 0.85
    uy = d / 2 - ud / 2
    gx = -w / 2 + 0.34
    for x, wd in ((gx, 0.66),):
        p.box(M["black"], x, uy, uz0, wd, ud, 0.025)
        p.box(M["black"], x, uy, uz0 + uh - 0.025, wd, ud, 0.025)
        for sx2 in (-1, 1):
            p.box(M["black"], x + sx2 * (wd / 2 - 0.0125), uy, uz0, 0.025, ud, uh)
        p.box(M["black"], x, d / 2 - 0.01, uz0, wd, 0.02, uh)
        p.box(M["black"], x, uy, uz0 + uh / 2, wd - 0.04, ud - 0.04, 0.015)
        p.box(M["glass"], x, d / 2 - ud - 0.003, uz0 + 0.02, wd - 0.04, 0.006, uh - 0.04)
        for z in (uz0 + 0.03, uz0 + uh / 2 + 0.017):
            for k in range(4):
                p.cyl(M["ceramic"], x - 0.12, uy + 0.02, z + k * 0.012, 0.11, 0.11, 0.008, seg=28)
            p.cyl(M["ceramic"], x + 0.14, uy + 0.02, z, 0.05, 0.08, 0.09, seg=24)
        area_light(p.frame, x, uy, uz0 + uh - 0.05, 0.25, 6.0)
        area_light(p.frame, x, uy, uz0 + uh / 2 - 0.01, 0.25, 4.0)
    wx = w / 2 - 0.3
    p.box(M["greige"], wx, uy, uz0, 0.58, ud, uh, r=0.003)
    p.box(M["led"], gx, uy - 0.1, uz0 - 0.01, 0.6, 0.02, 0.008)
    # counter: black kettle, grinders, a board and a pot of herbs
    p.cyl(M["black"], -w / 2 + 0.9, -0.05, h - 0.02, 0.08, 0.07, 0.2, seg=24)
    for k in range(3):
        p.cyl(M["black"], -w / 2 + 1.2 + k * 0.07, 0.15, h - 0.02, 0.025, 0.025, 0.2, seg=16)
    p.box(M["light_oak"], w / 2 - 0.5, 0.18, h - 0.02, 0.4, 0.04, 0.3, r=0.01, tilt=0.12)
    p.cyl(M["stone"], w / 2 - 0.25, 0.1, h - 0.02, 0.06, 0.05, 0.1)
    p.ellipsoid(M["sage"], w / 2 - 0.25, 0.1, h + 0.15, 0.09, 0.09, 0.08)
    if w >= 2.5:
        sx = w / 2 - 1.2  # under the kitchen window
        p.box(M["steel"], sx, -0.02, h - 0.24, 0.7, 0.42, 0.2)  # basin below the counter
        p.box(M["dark_glass"], sx, -0.02, h - 0.019, 0.7, 0.4, 0.001)
        p.cyl(M["black"], sx, d / 2 - 0.12, h - 0.02, 0.022, 0.018, 0.36, seg=20)
        p.box(M["black"], sx, d / 2 - 0.23, h + 0.3, 0.025, 0.24, 0.025, r=0.01)
        p.cyl(M["black"], sx + 0.08, d / 2 - 0.1, h - 0.02, 0.018, 0.018, 0.12, seg=16)


def tall_units(p, it, M):
    """Wood appliance column: integrated fridge-freezer, built-in oven and combi microwave in black glass."""
    w, d, h = it["w"], it["d"], it["h"]
    front = -d / 2 - 0.001
    p.box(M["black"], 0, 0.04, 0, w - 0.04, d - 0.08, 0.1)
    p.box(M["greige"], 0, 0.01, 0.1, w, d - 0.02, h - 0.1, r=0.003)
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


def wood_island(p, it, M):
    """The photo's island: grey oak all round with long drawers, a thin white top, an induction hob with a pan,
    and a built-in oven facing the dining table."""
    w, d, h = it["w"], it["d"], it["h"]
    p.box(M["black"], 0, 0, 0, w - 0.1, d - 0.1, 0.08)
    p.box(M["greige"], 0, 0, 0.08, w, d, h - 0.12, r=0.003)
    for z in (0.3, 0.58):
        p.box(M["black"], 0.25, -d / 2 - 0.001, z, w - 0.6, 0.004, 0.004)
    p.box(M["black"], -w / 2 + 0.45, -d / 2 - 0.002, 0.16, 0.64, 0.01, 0.58)
    p.box(M["dark_glass"], -w / 2 + 0.45, -d / 2 - 0.006, 0.2, 0.58, 0.004, 0.36)
    p.box(M["steel"], -w / 2 + 0.45, -d / 2 - 0.03, 0.6, 0.5, 0.016, 0.016, r=0.006)
    p.box(M["quartz"], 0, 0, h - 0.04, w + 0.04, d + 0.04, 0.04, r=0.004)
    p.box(M["dark_glass"], -0.2, 0.05, h, 0.6, 0.5, 0.004, r=0.006)
    p.cyl(M["steel"], -0.35, 0.1, h + 0.004, 0.12, 0.12, 0.1, seg=32)
    p.box(M["black"], -0.35, 0.3, h + 0.08, 0.025, 0.2, 0.02, r=0.006)
    p.cyl(M["black"], 0.55, -0.1, h, 0.07, 0.07, 0.06, seg=24)
    for k, (x, y) in enumerate(((0.52, -0.12), (0.58, -0.08), (0.55, -0.04))):
        p.ellipsoid(M["orange"], x, y, h + 0.08, 0.04, 0.04, 0.04)


def chimney(p, it, M):
    """Stainless T-shaped hood: a flat canopy over the hob and a flue box to the ceiling; glass hob on the counter."""
    elev = it.get("elev", 1.9)
    w = it["w"]
    p.box(M["steel"], 0, -0.25, elev, w, 0.5, 0.06, r=0.004)
    p.box(M["steel"], 0, -0.125, elev + 0.06, 0.3, 0.25, 3.0 - elev - 0.06)
    p.box(M["led"], 0, -0.35, elev - 0.002, 0.5, 0.02, 0.004)
    p.box(M["dark_glass"], 0, -0.3, 0.88, 0.6, 0.5, 0.006, r=0.006)
    for x, y in ((-0.15, -0.2), (0.15, -0.2), (-0.15, -0.4), (0.15, -0.4)):
        p.cyl(M["black"], x, y, 0.886, 0.08, 0.08, 0.002, seg=24)
    lamp_light(p.frame, 0, -0.3, elev - 0.05, watts=6.0)


def island(p, it, M):
    if it.get("variant") == "wood":
        return wood_island(p, it, M)
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
        p.cyl(M["greige"], -w / 2 + 0.1 + i * 0.04, by - base / 2 - 0.01, 0.08, 0.014, 0.014, h - 0.18, seg=12)
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


def feature_wall(p, it, M):
    """Hall feature wall from the client's photo: warm veneer centre panel with a large marbled painting,
    dark walnut recesses either side, black open shelving lit from above in the left recess."""
    w, h = it["w"], it["h"]
    cw = 2.0
    side = (w - cw) / 2
    p.box(M["walnut_dark"], 0, -0.015, 0, w, 0.03, h)
    p.box(M["veneer"], 0, -0.04, 0, cw, 0.08, h, r=0.004)
    p.box(M["black"], 0, -0.095, 1.17, 1.36, 0.03, 1.36, r=0.004)
    p.box(M["art_swirl"], 0, -0.112, 1.2, 1.3, 0.006, 1.3)
    sx = -(cw / 2 + side / 2)
    sw = side - 0.18
    for x in (-sw / 2, sw / 2):
        p.box(M["black"], sx + x, -0.24, 1.0, 0.018, 0.018, 1.42)
    for z in (1.0, 1.47, 1.94, 2.4):
        p.box(M["black"], sx, -0.15, z, sw, 0.26, 0.018)
    p.box(M["shelf_white"], sx - 0.12, -0.14, 1.018, 0.1, 0.18, 0.24, r=0.01)
    p.cyl(M["ceramic"], sx + 0.12, -0.13, 1.018, 0.05, 0.035, 0.18)
    p.cyl(M["glow_warm"], sx - 0.1, -0.13, 1.488, 0.035, 0.035, 0.08)
    p.cyl(M["glow_warm"], sx + 0.02, -0.13, 1.488, 0.03, 0.03, 0.06)
    for i, mat in enumerate(("book_b", "book_a", "book_b", "book_d")):
        p.box(M[mat], sx + 0.05 + i * 0.035, -0.13, 1.958, 0.03, 0.18, 0.2 + (i % 2) * 0.03)
    p.ellipsoid(M["ceramic"], sx - 0.12, -0.13, 2.0, 0.05, 0.05, 0.06)
    area_light(p.frame, sx, -0.15, 2.38, 0.4, 25.0)
    area_light(p.frame, -sx, -0.15, 2.6, 0.4, 12.0)


def float_console(p, it, M):
    """Floating veneer console top over a black open box, with a vase of dried stems and an orange."""
    w, d, h = it["w"], it["d"], it["h"]
    bw = 2.0
    p.box(M["veneer"], 0, 0, h - 0.04, w, d, 0.04, r=0.004)
    p.box(M["black"], 0, 0.01, 0.1, bw, d - 0.04, 0.025)
    p.box(M["black"], 0, d / 2 - 0.02, 0.1, bw, 0.02, h - 0.14)
    for x in (-bw / 2, bw / 2):
        p.box(M["black"], x, 0.01, 0.1, 0.025, d - 0.04, h - 0.14)
    p.cyl(M["stone"], -0.35, 0.0, h, 0.06, 0.045, 0.14)
    for k in range(6):
        stem = p.cyl(M["brass"], 0, 0, 0, 0.002, 0.002, 0.32 + 0.04 * (k % 3), seg=6)
        stem.matrix_world = p.frame @ Matrix.Translation(Vector((-0.35, 0.0, h + 0.12))) @ Matrix.Rotation(0.18 * (k - 2.5), 4, "Y") @ Matrix.Rotation(0.1 * (k % 2), 4, "X")
    p.ellipsoid(M["orange"], -0.12, 0.04, h + 0.05, 0.05, 0.05, 0.05)
    p.ellipsoid(M["ceramic"], 0.9, 0.0, h + 0.06, 0.07, 0.07, 0.07)


def feature_panel(p, it, M):
    v = it.get("variant")
    if v == "terracotta":
        return terracotta_wall(p, it, M)
    if v == "orangeArc":
        return orange_arc_wall(p, it, M)
    if v == "shelfNiche":
        return shelf_niche(p, it, M)


def orange_arc_wall(p, it, M):
    """Bedroom two after the client's photo: cream panelling with geometric grooves, an orange field behind both beds
    and a cream heart between them, and two angled white sconces over each bed."""
    w, h = it["w"], it["h"]
    p.box(M["cream_wall"], 0, -0.005, 0, w, 0.01, h)
    # the cream centre is a wide bowl: broad at the ceiling, narrowing to a rounded bottom over the nightstand
    H, ow, top = 2.85, 1.75, 0.95
    for sx in (-1, 1):
        pts = [(sx * ow, 0.0), (sx * ow, H), (sx * top, H)]
        for i in range(1, 32):
            t = (math.pi / 2) * i / 32
            pts.append((sx * top * math.cos(t), H - (H - 0.85) * math.sin(t)))
        pts.append((0.0, 0.85))
        pts.append((0.0, 0.0))
        if sx < 0:
            pts = list(reversed(pts))
        p.prism(M["orange_paint"], pts, -0.012, -0.022)
        # grooves on the cream beyond the orange
        for z in (0.95, 1.9):
            p.box(M["groove"], sx * (ow + (w / 2 - ow) / 2), -0.012, z, w / 2 - ow - 0.06, 0.004, 0.004)
        for dx, z in ((-0.38 * sx, 1.85), (0.38 * sx, 1.55)):  # inner sconce higher, outer lower
            x = sx * 1.05 + dx
            p.box(M["ceramic"], x, -0.04, z + 0.03, 0.05, 0.06, 0.08, r=0.01)
            head = p.cyl(M["ceramic"], 0, 0, -0.06, 0.045, 0.03, 0.12, seg=20)
            head.matrix_world = p.frame @ Matrix.Translation(Vector((x, -0.12, z))) @ Matrix.Rotation(0.7, 4, "X")
            data = bpy.data.lights.new("sconce", "SPOT")
            data.energy = 5.0
            data.color = (1.0, 0.78, 0.55)
            data.spot_size = math.radians(70)
            data.shadow_soft_size = 0.04
            ob = bpy.data.objects.new(data.name, data)
            ob.matrix_world = p.frame @ Matrix.Translation(Vector((x, -0.16, z - 0.05))) @ Matrix.Rotation(0.7, 4, "X")
            bpy.context.scene.collection.objects.link(ob)
    # geometric panel grooves inside the cream bowl
    for z, wd in ((2.3, 1.9), (1.75, 1.1)):
        p.box(M["groove"], 0, -0.012, z, wd, 0.004, 0.004)
    for x in (-0.55, -0.15, 0.25, 0.6):
        p.box(M["groove"], x, -0.012, 1.75, 0.004, 0.004, 0.55)


def shelf_niche(p, it, M):
    """Cream built-in with grooves and a recessed niche of shelves holding books and small art."""
    w, h = it["w"], it["h"]
    p.box(M["cream_wall"], 0, -0.02, 0, w, 0.04, h)
    nw = w - 0.3
    p.box(M["groove"], 0, -0.04, 0.9, nw, 0.004, 1.32)
    for z in (0.9, 1.22, 1.54, 1.86, 2.2):
        p.box(M["cream"], 0, -0.17, z, nw, 0.26, 0.025)
    for side in (-1, 1):
        p.box(M["cream"], side * nw / 2, -0.17, 0.9, 0.025, 0.26, 1.32)
    for row, z in enumerate((0.925, 1.565)):
        bx = -nw / 2 + 0.06
        for k in range(6):
            bw = 0.03 + (k % 3) * 0.008
            p.box(M[("book_b", "book_d", "orange", "book_b", "book_a", "book_b")[(k + row) % 6]], bx, -0.15, z, bw, 0.18, 0.18 + (k % 2) * 0.04)
            bx += bw + 0.005
    p.box(M["black"], 0.3, -0.12, 1.245, 0.24, 0.015, 0.2, tilt=-0.15)
    p.box(M["orange"], 0.3, -0.13, 1.26, 0.18, 0.004, 0.14, tilt=-0.15)
    p.ellipsoid(M["ceramic"], -0.2, -0.15, 1.95, 0.05, 0.05, 0.08)


def terracotta_wall(p, it, M):
    """Bedroom three, after the client's photo: terracotta wall with a row of open white shelf boxes hung on rods."""
    w, h = it["w"], it["h"]
    p.box(M["terracotta"], 0, -0.006, 0, w, 0.012, h)
    n, bw, bh, depth = 5, 0.62, 0.5, 0.3
    x0 = 0.1 - n * bw / 2
    z0 = 1.62
    y = -0.012 - depth / 2
    for i in range(n):
        x = x0 + bw * (i + 0.5)
        p.box(M["shelf_white"], x, y, z0, bw - 0.01, depth, 0.02)
        p.box(M["shelf_white"], x, y, z0 + bh - 0.02, bw - 0.01, depth, 0.02)
        p.box(M["shelf_white"], x, y, z0 + bh / 2, bw - 0.01, depth, 0.015)
        p.box(M["shelf_white"], x - bw / 2 + 0.01, y, z0, 0.02, depth, bh)
        # books and objects, a little different in each box
        for row, zb in enumerate((z0 + 0.02, z0 + bh / 2 + 0.015)):
            k = 0
            bx = x - bw / 2 + 0.05
            while bx < x + bw / 2 - 0.12 and k < 7:
                bwid = 0.025 + ((i * 7 + k * 3 + row) % 4) * 0.008
                bht = 0.16 + ((i + k * 5 + row) % 3) * 0.03
                mat = M[("book_a", "book_b", "book_d", "book_b", "book_c")[(i + k + row) % 5]]
                lean = 0.12 if (i + k + row) % 6 == 0 else 0.0
                bk = p.box(mat, bx, y + 0.02, zb, bwid, 0.2, bht)
                if lean:
                    bk.matrix_world = bk.matrix_world @ Matrix.Translation(Vector((bx, 0, zb))) @ Matrix.Rotation(lean, 4, "Y") @ Matrix.Translation(Vector((-bx, 0, -zb)))
                bx += bwid + 0.004
                k += 1
            if (i + row) % 2 == 0:
                p.cyl(M["ceramic"], x + bw / 2 - 0.08, y, zb, 0.035, 0.03, 0.12)
            else:
                p.box(M["black"], x + bw / 2 - 0.08, y + 0.05, zb, 0.1, 0.015, 0.13, tilt=-0.15)
    p.box(M["shelf_white"], x0 + n * bw - 0.01, y, z0, 0.02, depth, bh)
    for x in (x0 + 0.3, x0 + n * bw - 0.3):
        p.cyl(M["shelf_white"], x, y, z0 + bh, 0.005, 0.005, 3.0 - z0 - bh, seg=8)


def shag_rug(p, it, M):
    ob = p.box(M["shag"], 0, 0, 0.0, it["w"], it["d"], 0.03, r=0.012, seg=2)
    p.rumple(ob, 0.006, 0.02)


def arc_lamp(p, it, M):
    """Black floor lamp with a conical shade on an angled arm, reaching back over the sofa."""
    p.cyl(M["black"], 0, 0, 0, 0.16, 0.16, 0.025)
    p.cyl(M["black"], 0, 0, 0.025, 0.011, 0.011, 1.5, seg=10)
    arm = p.cyl(M["black"], 0, 0, 0, 0.009, 0.009, 0.5, seg=10)
    arm.matrix_world = p.frame @ Matrix.Translation(Vector((0, 0, 1.52))) @ Matrix.Rotation(-1.2, 4, "X")
    head = p.cyl(M["black"], 0, 0, -0.16, 0.12, 0.04, 0.16, seg=24)
    head.matrix_world = p.frame @ Matrix.Translation(Vector((0, 0.46, 1.7))) @ Matrix.Rotation(0.5, 4, "X")
    lamp_light(p.frame, 0, 0.48, 1.6, watts=6.0)


def lounge_chair(p, it, M):
    """Pink leather swivel bucket chair on a trumpet base, channel-tufted inside, as in the client's photo."""
    w, d = it["w"], it["d"]
    r = min(w, d) / 2 - 0.02
    p.cyl(M["pink_leather"], 0, 0, 0, 0.26, 0.28, 0.025, bevel=0.01)
    p.cyl(M["pink_leather"], 0, 0, 0.025, 0.035, 0.18, 0.2)
    p.cyl(M["pink_leather"], 0, 0, 0.22, 0.05, 0.05, 0.1)
    p.ellipsoid(M["pink_leather"], 0, 0.0, 0.42, r, r, 0.12)
    p.cyl(M["pink_leather"], 0, -0.03, 0.42, r - 0.06, r - 0.08, 0.14, bevel=0.05)
    shell = p.sector(M["pink_leather"], 0, 0, 0.34, r, 0.12, 0.42, math.radians(-30), math.radians(210), seg=48)
    shell.modifiers["round"].width = 0.04
    shell.modifiers["round"].segments = 5
    for k in range(7):
        a = math.radians(5 + k * 24.0)
        p.box(M["pink_leather"], math.cos(a) * (r - 0.15), math.sin(a) * (r - 0.15), 0.5, 0.12, 0.08, 0.3, r=0.04, seg=5)
    p.box(M["rose"], 0, 0.14, 0.6, 0.36, 0.12, 0.3, r=0.06, seg=6, tilt=-0.25)


def pendant(p, it, M):
    v = it.get("variant")
    ceiling = 3.0
    if v == "bulb":
        low = ceiling - it["h"]
        p.cyl(M["black"], 0, 0, low + 0.06, 0.003, 0.003, it["h"] - 0.06, seg=8)
        p.cyl(M["black"], 0, 0, low + 0.03, 0.018, 0.018, 0.05)
        p.ellipsoid(M["bulb"], 0, 0, low, 0.03, 0.03, 0.05)
        lamp_light(p.frame, 0, 0, low - 0.02, watts=4.0)
        return
    if v == "cluster":
        w = it["w"]
        p.box(M["black"], 0, 0, ceiling - 0.03, w, 0.06, 0.03)
        for i in range(4):
            x = -w / 2 + 0.15 + (w - 0.3) / 3 * i
            drop = 1.95 + (i % 2) * 0.08
            p.cyl(M["black"], x, 0, drop + 0.2, 0.002, 0.002, ceiling - drop - 0.2, seg=6)
            p.cyl(M["glass"], x, 0, drop, 0.12, 0.04, 0.2, seg=24)
            p.ellipsoid(M["bulb"], x, 0, drop + 0.07, 0.025, 0.025, 0.035)
            lamp_light(p.frame, x, 0, drop + 0.04, watts=3.0)
        return
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
    "loungeChair": lounge_chair,
    "tvWall": feature_wall,
    "console": float_console,
    "accentWall": feature_panel,
    "rug": shag_rug,
    "floorLamp": arc_lamp,
    "chimney": chimney,
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
    import luxe
    if luxe.wants(it):
        return True
    if it["type"] not in BUILDERS or it.get("variant") == "outdoor":
        return False
    only = {"tvWall": "panel", "console": "float", "rug": "grey", "floorLamp": "arc"}
    if it["type"] in only:
        return it.get("variant") == only[it["type"]]
    if it["type"] == "accentWall":
        return it.get("variant") in ("terracotta", "orangeArc", "shelfNiche")
    if it["type"] == "chimney":
        return it["room"] == "kitchen"
    return it["type"] != "pendant" or it["room"] == "kitchen" or it.get("variant") in ("bulb", "cluster")


def build(it, frame, materials):
    import luxe
    if luxe.wants(it):
        return luxe.build(Piece(f"modern-{it['id']}", frame), it, materials)
    builder = BUILDERS.get(it["type"])
    if builder is None or it.get("variant") == "outdoor":
        return False
    builder(Piece(f"modern-{it['id']}", frame), it, materials)
    return True
