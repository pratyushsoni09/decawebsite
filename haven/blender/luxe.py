"""
Warm modern Indian luxury for Residence 11A: walnut and brass, fluted panels, ivory marble, ivory boucle and rust
velvet, cane, jaali screens and warm cove light. Every builder here works like the ones in modern.py — in the item's
local frame (origin at the centre of its floor footprint, front facing −Y, wall items from the floor up along the wall
face) and inside the w × d × h box the floor plan reserves for it. modern.py dispatches to these by variant.
"""
import math

import bpy
from mathutils import Matrix, Vector

from modern import area_light, fabric, lamp_light, solid, wood

# ---------------------------------------------------------------- materials

VARIANTS = {
    "sofa": {"ivoryBoucle", "ivoryBoucleRust"},
    "loungeChair": {"rustVelvet"},
    "chair": {"boucle"},
    "deskChair": {"boucle"},
    "stool": {"brass"},
    "table": {"walnutBrass"},
    "coffeeTable": {"marbleRound"},
    "bed": {"fluted", "cane", "linenOak"},
    "nightstand": {"walnutBrass", "oakDrum", "walnutCube"},
    "wardrobe": {"flutedWalnut", "flutedOak"},
    "dresser": {"walnutMarble"},
    "desk": {"walnutLong"},
    "bench": {"sageSeat", "brassOttoman"},
    "sideboard": {"flutedMarble"},
    "console": {"marbleFloat", "walnutShoe"},
    "vanity": {"marbleBrass"},
    "shower": {"brass"},
    "kitchenRun": {"luxe"},
    "tallUnits": {"walnutColumn"},
    "island": {"marbleLuxe"},
    "chimney": {"brass"},
    "tvWall": {"fluted"},
    "accentWall": {"caneSlats", "walnutNiche", "jaaliStudy"},
    "rug": {"ivory", "jute"},
    "floorLamp": {"brassArc"},
    "pendant": {"brassGlobe", "brassLinear", "brassDome"},
    "poojaUnit": {"jaali"},
}


def wants(it):
    return it.get("variant") in VARIANTS.get(it["type"], ())


def marble(name, base, vein, scale=0.9):
    """Ivory marble with soft grey veins: distorted noise through a colour ramp, polished."""
    m = bpy.data.materials.get(name)
    if m is not None:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    coord = nt.nodes.new("ShaderNodeTexCoord")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = 9.0
    noise.inputs["Roughness"].default_value = 0.62
    noise.inputs["Distortion"].default_value = 1.6
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    els = ramp.color_ramp.elements
    els[0].position = 0.485
    els[0].color = (*base, 1)
    els[1].position = 0.515
    els[1].color = (*vein, 1)
    e2 = els.new(0.545)
    e2.color = (*base, 1)
    nt.links.new(coord.outputs["Object"], noise.inputs["Vector"])
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.14
    if "Coat Weight" in b.inputs:
        b.inputs["Coat Weight"].default_value = 0.5
        b.inputs["Coat Roughness"].default_value = 0.08
    m.diffuse_color = (*base, 1)
    return m


def palette():
    return {
        "boucle": fabric("m_boucle_ivory", (0.84, 0.8, 0.72), sheen=0.75, weave=0.95),
        "boucle_sand": fabric("m_boucle_sand", (0.66, 0.58, 0.47), sheen=0.6, weave=0.9),
        "velvet": fabric("m_velvet_rust", (0.5, 0.16, 0.07), sheen=0.95, weave=0.15),
        "velvet_dark": fabric("m_velvet_rust_dark", (0.3, 0.09, 0.04), sheen=0.8, weave=0.15),
        "silk": solid("m_silk_champagne", (0.78, 0.64, 0.44), 0.3, coat=0.35),
        "linen_beige": fabric("m_linen_beige", (0.58, 0.5, 0.4), sheen=0.3, weave=0.2),
        "linen_ivory": fabric("m_linen_ivory", (0.86, 0.84, 0.78), sheen=0.3, weave=0.12),
        "sage_cloth": fabric("m_fabric_sage_lux", (0.46, 0.52, 0.42), sheen=0.4, weave=0.3),
        "sage_paint": solid("m_paint_sage", (0.5, 0.55, 0.45), 0.88),
        "ivory_paint": solid("m_paint_ivory", (0.84, 0.79, 0.69), 0.86),
        "walnut": wood("m_walnut_lux", (0.12, 0.065, 0.035), (0.26, 0.15, 0.085), scale=4.0),
        "walnut_dark": wood("m_walnut_lux_dark", (0.07, 0.038, 0.02), (0.15, 0.085, 0.048), scale=4.0),
        "oak": wood("m_oak_lux", (0.46, 0.33, 0.2), (0.66, 0.5, 0.32), scale=3.0),
        "brass": solid("m_brass_brushed", (0.8, 0.62, 0.36), 0.32, metal=1.0),
        "brass_polished": solid("m_brass_polished", (0.86, 0.68, 0.4), 0.14, metal=1.0),
        "marble": marble("m_marble_ivory", (0.88, 0.85, 0.78), (0.5, 0.47, 0.43)),
        "marble_dark": marble("m_marble_emperador", (0.2, 0.13, 0.09), (0.45, 0.35, 0.26), scale=1.4),
        "cane": fabric("m_cane", (0.64, 0.47, 0.26), sheen=0.3, weave=1.0),
        "jute": fabric("m_rug_jute", (0.56, 0.46, 0.31), sheen=0.5, weave=1.0),
        "rug_ivory": fabric("m_rug_ivory", (0.8, 0.76, 0.68), sheen=0.85, weave=0.95),
        "ceramic": solid("m_ceramic_white", (0.93, 0.93, 0.92), 0.08, coat=0.6),
        "ceramic_sand": solid("m_ceramic_sand", (0.7, 0.6, 0.47), 0.4),
        "glass": solid("m_glass_clear", (0.95, 0.97, 0.97), 0.0, transmission=1.0),
        "glass_smoked": solid("m_glass_smoked", (0.45, 0.36, 0.28), 0.02, transmission=0.85),
        "dark_glass": solid("m_appliance_glass", (0.015, 0.015, 0.018), 0.04, coat=1.0),
        "black": solid("m_black_metal", (0.025, 0.025, 0.025), 0.42, metal=0.85),
        "shade": solid("m_lamp_shade", (0.92, 0.88, 0.8), 0.9, emit=(1.0, 0.82, 0.6), strength=1.2, transmission=0.3),
        "led": solid("m_led_strip", (1.0, 0.9, 0.75), 0.5, emit=(1.0, 0.82, 0.6), strength=12.0),
        "glow": solid("m_glow_warm", (0.95, 0.55, 0.06), 0.8, emit=(1.0, 0.55, 0.06), strength=0.8),
        "bulb": solid("m_bulb", (1.0, 0.9, 0.7), 0.3, emit=(1.0, 0.78, 0.5), strength=25.0),
        "flame": solid("m_flame", (1.0, 0.6, 0.2), 0.5, emit=(1.0, 0.5, 0.12), strength=40.0),
        "marigold": solid("m_marigold", (0.92, 0.42, 0.04), 0.7),
        "leaf": solid("m_leaf_dark", (0.12, 0.22, 0.1), 0.6),
        "steel": solid("m_brushed_steel", (0.55, 0.55, 0.55), 0.3, metal=1.0),
        "book_a": solid("m_book_a", (0.02, 0.02, 0.022), 0.6),
        "book_b": solid("m_book_b", (0.7, 0.68, 0.64), 0.6),
        "book_c": solid("m_book_c", (0.3, 0.06, 0.03), 0.6),
        "book_d": solid("m_book_d", (0.18, 0.2, 0.24), 0.6),
        "screen": solid("m_screen", (0.02, 0.025, 0.035), 0.1, emit=(0.5, 0.6, 0.8), strength=0.6),
        "stone": solid("m_lamp_stone", (0.75, 0.7, 0.64), 0.6),
    }


# ---------------------------------------------------------------- helpers

def flutes(p, mat, x0, x1, y, z0, h, pitch=0.045, r=0.016):
    """Vertical half-round ribs between x0 and x1, standing on a face at y (ribs bulge towards −Y)."""
    n = max(1, int((x1 - x0) / pitch))
    for i in range(n):
        x = x0 + pitch / 2 + i * (x1 - x0) / n
        p.cyl(mat, x, y, z0, r, r, h, seg=12)


def strip(p, mat, x, y, z0, h, w=0.012, d=0.012):
    p.box(mat, x, y, z0, w, d, h)


def jaali(p, mat, cx, y, z0, w, h, cell=0.14, bar=0.012, depth=0.02):
    """Lattice screen: a square grid and a 45° grid over it, like a CNC-cut jaali."""
    nx, nz = max(1, round(w / cell)), max(1, round(h / cell))
    for i in range(nx + 1):
        p.box(mat, cx - w / 2 + i * w / nx, y, z0, bar, depth, h)
    for j in range(nz + 1):
        p.box(mat, cx, y, z0 + j * h / nz - bar / 2, w, depth, bar)
    rw, rh = w / nx, h / nz
    for i in range(nx):
        for j in range(nz):
            x, z = cx - w / 2 + (i + 0.5) * rw, z0 + (j + 0.5) * rh
            ring = p.sector(mat, 0, 0, -depth / 2, min(rw, rh) * 0.38, bar, depth, 0, math.pi * 2, seg=8)
            ring.matrix_world = p.frame @ Matrix.Translation(Vector((x, y, z))) @ Matrix.Rotation(math.pi / 2, 4, "X") @ Matrix.Rotation(math.pi / 8, 4, "Z")


def pillow(p, mat, x, y, z, w, h, tilt=-0.3, thick=0.13):
    p.box(mat, x, y, z, w, thick, h, r=0.055, seg=5, tilt=tilt)


def sconce(p, x, y, z, watts=4.0, M=None):
    """Brass cylinder up/down wall light."""
    p.box(M["brass"], x, y - 0.02, z - 0.03, 0.05, 0.04, 0.06, r=0.006)
    p.cyl(M["brass"], x, y - 0.07, z - 0.1, 0.028, 0.028, 0.2, seg=20)
    p.cyl(M["bulb"], x, y - 0.07, z - 0.102, 0.016, 0.016, 0.004, seg=12)
    p.cyl(M["bulb"], x, y - 0.07, z + 0.098, 0.016, 0.016, 0.004, seg=12)
    lamp_light(p.frame, x, y - 0.07, z - 0.14, watts=watts)
    lamp_light(p.frame, x, y - 0.07, z + 0.14, watts=watts)


def table_lamp(p, M, x, y, z0, shade_r=0.13, h=0.42, base="brass"):
    p.cyl(M[base], x, y, z0, 0.05, 0.045, 0.02, seg=24)
    p.cyl(M[base], x, y, z0 + 0.02, 0.009, 0.009, h - 0.22, seg=10)
    p.cyl(M["shade"], x, y, z0 + h - 0.2, shade_r, shade_r - 0.02, 0.2, seg=32)
    lamp_light(p.frame, x, y, z0 + h - 0.1, watts=5.0)


def vase(p, M, x, y, z0, r=0.05, h=0.22, mat="ceramic_sand", stems=True):
    p.cyl(M[mat], x, y, z0, r, r * 0.6, h, seg=24)
    if stems:
        for k in range(5):
            st = p.cyl(M["leaf"], 0, 0, 0, 0.0025, 0.0025, 0.26 + 0.04 * (k % 3), seg=6)
            st.matrix_world = p.frame @ Matrix.Translation(Vector((x, y, z0 + h - 0.02))) @ Matrix.Rotation(0.16 * (k - 2), 4, "Y") @ Matrix.Rotation(0.12 * (k % 2) - 0.06, 4, "X")


def marigolds(p, M, x, y, z0, n=9, spread=0.07):
    for k in range(n):
        a = k * 2.4
        rr = spread * ((k % 3) + 0.5) / 3
        p.ellipsoid(M["marigold"], x + rr * math.cos(a), y + rr * math.sin(a), z0 + 0.03 * (k % 3), 0.028, 0.028, 0.024)


# ---------------------------------------------------------------- seating

def lux_sofa(p, it, M):
    """Low ivory boucle sofa on a walnut plinth with a brass line, loose back cushions, rust velvet and silk pillows."""
    w, d = it["w"], it["d"]
    p.box(M["walnut"], 0, 0.02, 0.0, w - 0.06, d - 0.1, 0.1, r=0.006)
    p.box(M["brass"], 0, -d / 2 + 0.04, 0.09, w - 0.06, 0.012, 0.008)
    cloth = M["boucle"]
    p.box(cloth, 0, 0, 0.1, w, d, 0.24, r=0.05, seg=5)
    arm = 0.18
    inner = w - 2 * arm
    for sx in (-1, 1):
        p.box(cloth, sx * (w / 2 - arm / 2), 0, 0.1, arm, d, 0.5, r=0.06, seg=6)
    p.box(cloth, 0, d / 2 - 0.09, 0.3, inner, 0.18, 0.46, r=0.05, seg=5)
    n = 2
    for i in range(n):
        cx = -inner / 4 + inner / 2 * i
        p.box(cloth, cx, -0.07, 0.34, inner / 2 - 0.012, d - 0.32, 0.16, r=0.07, seg=6)
        back = p.box(cloth, cx, d / 2 - 0.3, 0.5, inner / 2 - 0.03, 0.24, 0.44, r=0.1, seg=6, tilt=-0.16)
        p.rumple(back, 0.012, 0.12)
    rust = it.get("variant") == "ivoryBoucleRust"
    pillow(p, M["velvet"] if rust else M["silk"], -inner / 2 + 0.28, d / 2 - 0.44, 0.52, 0.46, 0.44, tilt=-0.3)
    pillow(p, M["silk"] if rust else M["velvet"], inner / 2 - 0.28, d / 2 - 0.44, 0.52, 0.46, 0.44, tilt=-0.3)
    pillow(p, M["boucle_sand"], inner / 2 - 0.62, d / 2 - 0.46, 0.52, 0.36, 0.34, tilt=-0.35)
    if rust:
        throw = p.box(M["silk"], -w / 2 + 0.42, 0.0, 0.52, 0.5, d * 0.78, 0.025, r=0.01, seg=2)
        p.rumple(throw, 0.02, 0.14)


def velvet_chair(p, it, M):
    """Rust velvet barrel chair, channel-stitched inside, on a brass swivel base."""
    w, d = it["w"], it["d"]
    r = min(w, d) / 2 - 0.02
    p.cyl(M["brass"], 0, 0, 0, 0.3, 0.3, 0.015, seg=40)
    p.cyl(M["brass"], 0, 0, 0.015, 0.04, 0.04, 0.22, seg=20)
    p.cyl(M["velvet"], 0, 0.0, 0.23, r - 0.02, r, 0.2, bevel=0.05, seg=40)
    p.cyl(M["velvet"], 0, -0.02, 0.43, r - 0.08, r - 0.09, 0.08, bevel=0.03, seg=36)
    shell = p.sector(M["velvet"], 0, 0, 0.36, r, 0.11, 0.4, math.radians(-25), math.radians(205), seg=48)
    shell.modifiers["round"].width = 0.035
    shell.modifiers["round"].segments = 5
    for k in range(8):
        a = math.radians(0 + k * 23.0)
        p.box(M["velvet_dark"], math.cos(a) * (r - 0.14), math.sin(a) * (r - 0.14), 0.5, 0.1, 0.07, 0.26, r=0.035, seg=5)
    pillow(p, M["silk"], 0, 0.12, 0.52, 0.34, 0.3, tilt=-0.25)


def boucle_chair(p, it, M):
    """Ivory boucle shell chair; brass legs for dining, a brass star base for the desk."""
    desk = it["type"] == "deskChair"
    if desk:
        p.cyl(M["brass"], 0, 0, 0, 0.27, 0.27, 0.015, seg=36)
        p.cyl(M["brass"], 0, 0, 0.015, 0.025, 0.025, 0.38, seg=16)
    else:
        for sx in (-1, 1):
            for sy in (-1, 1):
                p.leg(M["brass"], sx * 0.19, sy * 0.19, 0.42, r_top=0.012, r_bottom=0.009, splay=0.04)
    seat = p.box(M["boucle"], 0, 0.0, 0.42, 0.5, 0.48, 0.09, r=0.04, seg=5)
    p.rumple(seat, 0.006, 0.06)
    shell = p.sector(M["boucle"], 0, 0.04, 0.5, 0.26, 0.07, 0.4, math.radians(20), math.radians(160), seg=36)
    shell.modifiers["round"].width = 0.03
    shell.modifiers["round"].segments = 4
    p.box(M["brass"], 0, 0.2, 0.47, 0.42, 0.02, 0.02, r=0.006)


def brass_stool(p, it, M):
    """Counter stool: brass frame and footrest ring, boucle seat pad, low brass back."""
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.leg(M["brass"], sx * 0.16, sy * 0.16, 0.66, r_top=0.011, r_bottom=0.009, splay=0.04)
    p.sector(M["brass"], 0, 0, 0.25, 0.19, 0.012, 0.012, 0, math.pi * 2, seg=40)
    p.cyl(M["walnut"], 0, 0, 0.64, 0.2, 0.2, 0.03, seg=36, bevel=0.006)
    seat = p.cyl(M["boucle"], 0, 0, 0.67, 0.19, 0.19, 0.06, seg=36, bevel=0.02)
    p.rumple(seat, 0.005, 0.05)
    back = p.sector(M["brass"], 0, 0, 0.73, 0.2, 0.012, 0.18, math.radians(30), math.radians(150), seg=24)
    back.modifiers["round"].width = 0.004


# ---------------------------------------------------------------- tables

def lux_table(p, it, M):
    """Walnut dining table on a sculptural brass base, set for six: brass chargers, ivory plates, glasses, marigolds."""
    w, d, h = it["w"], it["d"], it["h"]
    for sx in (-1, 1):
        x = sx * (w / 2 - 0.42)
        p.box(M["brass"], x, 0, 0, 0.08, d - 0.3, 0.03)
        a = p.box(M["brass"], 0, 0, 0, 0.05, 0.05, h - 0.12)
        a.matrix_world = p.frame @ Matrix.Translation(Vector((x, 0.0, 0.03))) @ Matrix.Rotation(0.28 * sx, 4, "Y")
        b = p.box(M["brass"], 0, 0, 0, 0.05, 0.05, h - 0.12)
        b.matrix_world = p.frame @ Matrix.Translation(Vector((x, 0.0, 0.03))) @ Matrix.Rotation(-0.28 * sx, 4, "Y")
    p.box(M["brass"], 0, 0, h - 0.11, w - 0.9, 0.05, 0.03)
    p.box(M["walnut"], 0, 0, h - 0.07, w, d, 0.07, r=0.012, seg=4)
    p.box(M["brass"], 0, 0, h - 0.072, w - 0.06, d - 0.06, 0.003)
    p.box(M["walnut"], 0, 0, h - 0.07, w - 0.08, d - 0.08, 0.071, r=0.004)
    places = [(-0.5, -0.3), (0.5, -0.3), (-0.5, 0.3), (0.5, 0.3), (-w / 2 + 0.24, 0.0), (w / 2 - 0.24, 0.0)]
    for x, y in places:
        p.cyl(M["brass"], x, y, h, 0.16, 0.16, 0.005, seg=36)
        p.cyl(M["ceramic"], x, y, h + 0.005, 0.12, 0.125, 0.012, seg=32)
        p.cyl(M["ceramic"], x, y, h + 0.017, 0.07, 0.085, 0.01, seg=28)
        p.box(M["linen_beige"], x + (0.2 if x <= 0 else -0.2), y, h, 0.05, 0.2, 0.004, r=0.006)
        gx, gy = x + (0.2 if x <= 0 else -0.2), y * 0.5 + (0.12 if y >= 0 else -0.12)
        p.cyl(M["glass"], gx, gy, h, 0.03, 0.03, 0.006, seg=20)
        p.cyl(M["glass"], gx, gy, h + 0.006, 0.004, 0.004, 0.08, seg=8)
        p.cyl(M["glass"], gx, gy, h + 0.086, 0.022, 0.036, 0.09, seg=24)
    p.cyl(M["brass"], 0, 0, h, 0.11, 0.14, 0.05, seg=36)
    marigolds(p, M, 0, 0, h + 0.06, n=12, spread=0.1)
    for x, ch in ((0.42, 0.2), (0.5, 0.14), (0.46, 0.1)):
        p.cyl(M["brass"], x, 0.08, h, 0.028, 0.028, ch, seg=20)
        p.ellipsoid(M["flame"], x, 0.08, h + ch + 0.015, 0.006, 0.006, 0.012)
        lamp_light(p.frame, x, 0.08, h + ch + 0.03, watts=0.8)
    for x, ch in ((-0.46, 0.16), (-0.52, 0.1)):
        p.cyl(M["brass"], x, -0.06, h, 0.028, 0.028, ch, seg=20)
        p.ellipsoid(M["flame"], x, -0.06, h + ch + 0.015, 0.006, 0.006, 0.012)


def marble_round_table(p, it, M):
    """Ivory marble disc on a brass drum, a brass tray with a candle and a stack of books."""
    r = it["w"] / 2
    h = it["h"]
    p.cyl(M["brass"], 0, 0, 0, r * 0.55, r * 0.5, h - 0.05, seg=48)
    p.cyl(M["marble"], 0, 0, h - 0.05, r, r, 0.05, seg=64, bevel=0.012)
    p.cyl(M["brass"], 0.18, -0.1, h, 0.14, 0.14, 0.012, seg=36)
    p.cyl(M["brass"], 0.18, -0.1, h, 0.14, 0.145, 0.03, seg=36)
    p.cyl(M["ceramic_sand"], 0.14, -0.08, h + 0.012, 0.045, 0.045, 0.06, seg=20)
    p.ellipsoid(M["flame"], 0.14, -0.08, h + 0.08, 0.006, 0.006, 0.012)
    lamp_light(p.frame, 0.14, -0.08, h + 0.1, watts=0.6)
    for i, mat in enumerate(("book_b", "book_d")):
        p.box(M[mat], -0.22, 0.12, h + i * 0.03, 0.24, 0.3, 0.028, r=0.003)
    vase(p, M, -0.2, -0.16, h, r=0.04, h=0.16)


# ---------------------------------------------------------------- beds

def lux_bed(p, it, M):
    """Master bed: walnut plinth with a brass line, ivory boucle base and headboard, layered ivory linen with a
    champagne silk runner and rust velvet pillows, under a full-width fluted walnut headboard wall with brass strips,
    reading sconces and a warm LED line."""
    w, d = it["w"], it["d"]
    head = d / 2
    p.box(M["walnut"], 0, 0.03, 0.0, w - 0.16, d - 0.22, 0.1, r=0.006)
    p.box(M["brass"], 0, -d / 2 + 0.12, 0.09, w - 0.16, 0.012, 0.008)
    p.box(M["boucle"], 0, 0.0, 0.1, w + 0.1, d, 0.25, r=0.05, seg=5)
    p.box(M["linen_ivory"], 0, 0.0, 0.35, w - 0.04, d - 0.08, 0.2, r=0.06, seg=5)
    duvet = p.box(M["linen_ivory"], 0, -d * 0.14, 0.52, w + 0.06, d * 0.68, 0.09, r=0.04, seg=5)
    p.rumple(duvet, 0.025, 0.22)
    p.box(M["linen_ivory"], 0, d * 0.2, 0.54, w + 0.04, 0.14, 0.07, r=0.035, seg=4)
    runner = p.box(M["silk"], 0, -d / 2 + 0.45, 0.6, w + 0.1, 0.55, 0.02, r=0.008, seg=2)
    p.rumple(runner, 0.012, 0.16)
    pw = (w - 0.2) / 2
    for x in (-pw / 2 - 0.04, pw / 2 + 0.04):
        pillow(p, M["linen_ivory"], x, head - 0.32, 0.55, pw, 0.44, tilt=-0.35, thick=0.15)
        pillow(p, M["velvet"], x * 0.75, head - 0.5, 0.57, 0.44, 0.4, tilt=-0.3)
    pillow(p, M["silk"], 0, head - 0.66, 0.57, 0.5, 0.3, tilt=-0.28, thick=0.1)
    # upholstered headboard panel
    p.box(M["boucle"], 0, head - 0.06, 0.1, w + 0.3, 0.12, 1.1, r=0.04, seg=5)
    # the fluted walnut wall behind (the plan leaves 0.1 m between the bed head and the wall for it), as wide as the
    # room allows, a brass strip every sixth flute, an LED cove along the top
    ww = min(3.0, w + 1.2)
    p.box(M["walnut_dark"], 0, head + 0.08, 0.0, ww, 0.04, 2.95)
    pitch = 0.05
    n = int((ww - 0.1) / pitch)
    for i in range(n):
        x = -ww / 2 + 0.05 + pitch / 2 + i * pitch
        if i % 6 == 3:
            p.box(M["brass"], x, head + 0.04, 0.05, 0.012, 0.012, 2.85)
        else:
            p.cyl(M["walnut"], x, head + 0.04, 0.05, 0.018, 0.018, 2.85, seg=12)
    p.box(M["led"], 0, head + 0.03, 2.9, ww - 0.1, 0.02, 0.008)
    area_light(p.frame, 0, head - 0.05, 2.85, 1.2, 14.0, (1.0, 0.75, 0.45))
    for sx in (-1, 1):
        sconce(p, sx * (w / 2 + 0.32), head + 0.02, 1.25, watts=4.0, M=M)


def cane_bed(p, it, M):
    """Guest single bed: oak frame, cane headboard in an oak surround, sage linen duvet, ivory pillows, a rust bolster."""
    w, d = it["w"], it["d"]
    head = d / 2
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.leg(M["oak"], sx * (w / 2 - 0.05), sy * (d / 2 - 0.08), 0.22, r_top=0.025, r_bottom=0.018, splay=0.03)
    p.box(M["oak"], 0, 0, 0.22, w + 0.04, d, 0.12, r=0.01)
    p.box(M["linen_ivory"], 0, -0.02, 0.34, w - 0.04, d - 0.12, 0.18, r=0.05, seg=5)
    duvet = p.box(M["sage_cloth"], 0, -d * 0.15, 0.5, w + 0.06, d * 0.64, 0.1, r=0.04, seg=4)
    p.rumple(duvet, 0.025, 0.2)
    p.box(M["sage_cloth"], 0, d * 0.18, 0.52, w + 0.04, 0.14, 0.06, r=0.03, seg=4)
    pillow(p, M["linen_ivory"], 0, head - 0.3, 0.52, w - 0.16, 0.4, tilt=-0.3, thick=0.14)
    p.cyl(M["velvet"], 0, 0, 0, 0.09, 0.09, w - 0.3, seg=24)
    bol = p.objects[-1]
    bol.matrix_world = p.frame @ Matrix.Translation(Vector((-(w - 0.3) / 2, head - 0.52, 0.62))) @ Matrix.Rotation(math.pi / 2, 4, "Y")
    # headboard: oak frame with a cane panel and a soft arched top
    hw, ht = w + 0.04, 1.0
    p.box(M["oak"], 0, head - 0.03, 0.22, hw, 0.05, 0.06)
    for sx in (-1, 1):
        p.box(M["oak"], sx * (hw / 2 - 0.03), head - 0.03, 0.22, 0.06, 0.05, ht)
    p.box(M["oak"], 0, head - 0.03, 0.22 + ht - 0.06, hw, 0.05, 0.06)
    p.box(M["brass"], 0, head - 0.03, 0.22 + ht - 0.012, hw, 0.054, 0.012)
    p.box(M["cane"], 0, head - 0.02, 0.28, hw - 0.12, 0.012, ht - 0.12)


def linen_oak_bed(p, it, M):
    """Study bedroom double: oak platform, beige linen headboard with brass-trimmed wings, ivory duvet, sage throw."""
    w, d = it["w"], it["d"]
    head = d / 2
    p.box(M["oak"], 0, 0.02, 0.0, w - 0.1, d - 0.16, 0.08)
    p.box(M["oak"], 0, 0, 0.08, w + 0.14, d + 0.02, 0.2, r=0.015, seg=3)
    p.box(M["linen_ivory"], 0, -0.02, 0.28, w - 0.04, d - 0.1, 0.2, r=0.06, seg=5)
    duvet = p.box(M["linen_ivory"], 0, -d * 0.12, 0.46, w + 0.08, d * 0.72, 0.1, r=0.04, seg=4)
    p.rumple(duvet, 0.03, 0.24)
    throw = p.box(M["sage_cloth"], 0, -d / 2 + 0.4, 0.55, w + 0.12, 0.5, 0.025, r=0.01, seg=2)
    p.rumple(throw, 0.015, 0.14)
    pw = (w - 0.22) / 2
    for x in (-pw / 2 - 0.04, pw / 2 + 0.04):
        pillow(p, M["linen_ivory"], x, head - 0.3, 0.5, pw, 0.42, tilt=-0.35, thick=0.14)
        pillow(p, M["boucle_sand"], x * 0.7, head - 0.48, 0.52, 0.4, 0.36, tilt=-0.3)
    hb = p.box(M["linen_beige"], 0, head - 0.05, 0.08, w + 0.14, 0.1, 1.05, r=0.03, seg=4)
    p.rumple(hb, 0.004, 0.1)
    for sx in (-1, 1):
        p.box(M["brass"], sx * (w / 2 + 0.085), head - 0.05, 0.1, 0.012, 0.11, 1.0)
    p.box(M["brass"], 0, head - 0.05, 1.12, w + 0.16, 0.11, 0.012)


# ---------------------------------------------------------------- storage

def walnut_brass_nightstand(p, it, M):
    w, d, h = it["w"], it["d"], it["h"]
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.cyl(M["brass"], sx * (w / 2 - 0.04), sy * (d / 2 - 0.04), 0, 0.008, 0.008, 0.16, seg=10)
    p.box(M["walnut"], 0, 0, 0.16, w, d, h - 0.16, r=0.006)
    p.box(M["brass"], 0, -d / 2 - 0.004, h - 0.14, w * 0.5, 0.008, 0.012)
    p.box(M["brass"], 0, -d / 2 - 0.004, 0.3, w * 0.5, 0.008, 0.012)
    table_lamp(p, M, 0.02, 0.05, h, shade_r=0.12, h=0.44)
    p.box(M["book_c"], -0.1, -0.06, h, 0.13, 0.18, 0.025)


def oak_drum_nightstand(p, it, M):
    w, d, h = it["w"], it["d"], it["h"]
    r = min(w, d) / 2
    p.cyl(M["brass"], 0, 0, 0, r * 0.7, r * 0.7, 0.03, seg=36)
    p.cyl(M["oak"], 0, 0, 0.03, r, r, h - 0.03, seg=48, bevel=0.01)
    drum = p.sector(M["cane"], 0, 0, 0.08, r + 0.004, 0.006, h - 0.16, math.radians(200), math.radians(340), seg=36)
    drum.modifiers["round"].width = 0.002
    p.cyl(M["brass"], 0, -r, h * 0.55, 0.012, 0.012, 0.012, seg=10)
    p.ellipsoid(M["ceramic"], 0.0, 0.03, h + 0.09, 0.08, 0.08, 0.09)
    p.cyl(M["brass"], 0, 0.03, h + 0.17, 0.008, 0.008, 0.14, seg=8)
    p.cyl(M["shade"], 0, 0.03, h + 0.3, 0.12, 0.1, 0.16, seg=32)
    lamp_light(p.frame, 0, 0.03, h + 0.36, watts=4.0)
    p.box(M["book_b"], 0.1, -0.06, h, 0.12, 0.16, 0.02)


def walnut_cube_nightstand(p, it, M):
    w, d, h = it["w"], it["d"], it["h"]
    p.box(M["walnut"], 0, 0, 0, w, d, h, r=0.008)
    p.box(M["brass"], 0, -d / 2 - 0.003, h * 0.6, w - 0.06, 0.006, 0.008)
    p.box(M["brass"], 0, -d / 2 - 0.003, 0.03, w, 0.006, 0.02)
    table_lamp(p, M, -0.06, 0.04, h, shade_r=0.1, h=0.36)
    p.box(M["book_d"], 0.1, -0.04, h, 0.12, 0.16, 0.028)


def fluted_wardrobe(p, it, M):
    """Floor-to-ceiling fluted wardrobe (walnut or oak) with long brass pulls, a brass plinth line and a loft above."""
    w, d, h = it["w"], it["d"], it["h"]
    oak = it.get("variant") == "flutedOak"
    body, rib = (M["oak"], M["oak"]) if oak else (M["walnut_dark"], M["walnut"])
    p.box(body, 0, 0.01, 0, w, d - 0.02, h)
    p.box(M["brass"], 0, -d / 2 - 0.002, 0.0, w, 0.004, 0.05)
    loft = 2.25
    flutes(p, rib, -w / 2 + 0.02, w / 2 - 0.02, -d / 2, 0.08, loft - 0.12, pitch=0.045, r=0.016)
    p.box(M["brass"], 0, -d / 2 - 0.004, loft - 0.02, w, 0.008, 0.012)
    flutes(p, rib, -w / 2 + 0.02, w / 2 - 0.02, -d / 2, loft + 0.02, h - loft - 0.06, pitch=0.045, r=0.016)
    n = max(2, round(w / 0.55))
    dw = w / n
    for i in range(n):
        x = -w / 2 + dw * (i + 0.5) + (dw / 2 - 0.04) * (1 if i % 2 else -1)
        p.box(M["brass"], x, -d / 2 - 0.03, 0.75, 0.014, 0.03, 0.8, r=0.005)


def walnut_dresser(p, it, M):
    w, d, h = it["w"], it["d"], it["h"]
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.cyl(M["brass"], sx * (w / 2 - 0.05), sy * (d / 2 - 0.05), 0, 0.01, 0.01, 0.14, seg=10)
    p.box(M["walnut"], 0, 0, 0.14, w, d, h - 0.18, r=0.006)
    for z in (0.36, 0.6):
        p.box(M["brass"], 0, -d / 2 - 0.004, z, w * 0.4, 0.008, 0.012)
    p.box(M["marble"], 0, 0, h - 0.04, w + 0.02, d + 0.02, 0.04, r=0.006)
    p.cyl(M["brass"], -w * 0.25, 0, h, 0.12, 0.12, 0.012, seg=36)
    vase(p, M, -w * 0.25, 0, h + 0.012, r=0.045, h=0.18)
    p.box(M["book_b"], w * 0.25, 0, h, 0.2, 0.26, 0.03)
    p.ellipsoid(M["ceramic_sand"], w * 0.25, 0, h + 0.09, 0.07, 0.07, 0.06)


def walnut_desk(p, it, M):
    """Long walnut desk on brass sled legs with a drawer pedestal, laptop and brass lamp."""
    w, d, h = it["w"], it["d"], it["h"]
    for sx in (-1, 1):
        x = sx * (w / 2 - 0.08)
        p.box(M["brass"], x, 0, 0, 0.025, d - 0.1, 0.025, r=0.008)
        for sy in (-1, 1):
            p.box(M["brass"], x, sy * (d / 2 - 0.06), 0, 0.025, 0.025, h - 0.04)
        p.box(M["brass"], x, 0, h - 0.065, 0.025, d - 0.1, 0.025, r=0.008)
    p.box(M["walnut"], 0, 0, h - 0.04, w, d, 0.04, r=0.006)
    p.box(M["walnut"], w / 2 - 0.3, 0.02, h - 0.3, 0.5, d - 0.08, 0.26, r=0.004)
    p.box(M["brass"], w / 2 - 0.3, -d / 2 + 0.05, h - 0.18, 0.18, 0.008, 0.012)
    p.box(M["steel"], -w * 0.12, -0.02, h, 0.34, 0.24, 0.012, r=0.004)
    p.box(M["steel"], -w * 0.12, 0.11, h + 0.005, 0.34, 0.01, 0.23, r=0.004, tilt=0.25)
    p.box(M["screen"], -w * 0.12, 0.103, h + 0.02, 0.31, 0.003, 0.2, tilt=0.25)
    p.box(M["book_d"], w * 0.08, 0.0, h, 0.22, 0.3, 0.02)
    table_lamp(p, M, -w * 0.38, d / 2 - 0.14, h, shade_r=0.09, h=0.42)


def sage_seat(p, it, M):
    w, d, h = it["w"], it["d"], it["h"]
    p.box(M["walnut"], 0, 0, 0, w, d, h - 0.1, r=0.01)
    p.box(M["brass"], 0, -d / 2 - 0.003, h - 0.16, w - 0.2, 0.006, 0.01)
    cushion = p.box(M["sage_cloth"], 0, 0, h - 0.1, w - 0.03, d - 0.03, 0.1, r=0.035, seg=4)
    p.rumple(cushion, 0.008, 0.1)
    pillow(p, M["boucle_sand"], -w * 0.3, d / 2 - 0.1, h, 0.36, 0.3, tilt=0.25)
    pillow(p, M["velvet"], -w * 0.3 + 0.3, d / 2 - 0.08, h, 0.3, 0.28, tilt=0.3)


def brass_ottoman(p, it, M):
    r = it["w"] / 2
    h = it["h"]
    p.cyl(M["brass"], 0, 0, 0, r - 0.03, r - 0.03, 0.05, seg=48)
    p.cyl(M["velvet"], 0, 0, 0.05, r, r, h - 0.15, bevel=0.05, seg=48)
    for a in range(4):
        ang = a * math.pi / 2 + math.pi / 4
        p.ellipsoid(M["velvet"], math.cos(ang) * r * 0.4, math.sin(ang) * r * 0.4, h - 0.1, r * 0.46, r * 0.46, 0.07)
    p.ellipsoid(M["brass"], 0, 0, h - 0.04, 0.018, 0.018, 0.01)


def fluted_sideboard(p, it, M):
    """Fluted walnut sideboard on brass legs with an ivory marble top and decor."""
    w, d, h = it["w"], it["d"], it["h"]
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.cyl(M["brass"], sx * (w / 2 - 0.06), sy * (d / 2 - 0.06), 0, 0.01, 0.01, 0.15, seg=10)
    p.box(M["walnut_dark"], 0, 0, 0.15, w, d, h - 0.19, r=0.006)
    flutes(p, M["walnut"], -w / 2 + 0.02, w / 2 - 0.02, -d / 2, 0.18, h - 0.25, pitch=0.04, r=0.014)
    p.box(M["marble"], 0, 0, h - 0.04, w + 0.02, d + 0.02, 0.04, r=0.006)
    vase(p, M, w * 0.3, 0.0, h, r=0.06, h=0.3, mat="ceramic")
    p.cyl(M["brass"], -w * 0.25, 0.0, h, 0.14, 0.14, 0.03, seg=36)
    p.ellipsoid(M["ceramic_sand"], -w * 0.25, 0.0, h + 0.1, 0.06, 0.06, 0.08)
    p.box(M["book_a"], 0.05, 0.02, h, 0.18, 0.24, 0.03)


def marble_float_console(p, it, M):
    """Floating walnut console with an ivory marble top and a brass-lit groove, under the hall's feature wall."""
    w, d, h = it["w"], it["d"], it["h"]
    p.box(M["walnut_dark"], 0, 0.02, 0.1, w, d - 0.04, h - 0.16, r=0.004)
    p.box(M["led"], 0, -d / 2 + 0.03, h - 0.065, w - 0.1, 0.02, 0.006)
    p.box(M["marble"], 0, 0, h - 0.04, w, d, 0.04, r=0.005)
    p.box(M["brass"], 0, -d / 2 - 0.004, 0.34, w * 0.4, 0.008, 0.012)
    p.cyl(M["brass"], -0.9, 0.0, h, 0.16, 0.16, 0.012, seg=36)
    vase(p, M, -0.9, 0.0, h + 0.012, r=0.05, h=0.24, mat="ceramic")
    p.ellipsoid(M["ceramic_sand"], 0.95, 0.0, h + 0.08, 0.08, 0.08, 0.08)
    for i, mat in enumerate(("book_b", "book_c")):
        p.box(M[mat], 0.3, 0.0, h + i * 0.03, 0.22, 0.28, 0.028)
    area_light(p.frame, 0, -d / 2 + 0.05, h - 0.08, 0.6, 6.0, (1.0, 0.75, 0.45))


def walnut_shoe_console(p, it, M):
    w, d, h = it["w"], it["d"], it["h"]
    p.box(M["walnut"], 0, 0.01, 0.12, w, d - 0.02, h - 0.12, r=0.006)
    p.box(M["brass"], 0, -d / 2 - 0.002, 0.12, w, 0.004, 0.04)
    for z in (0.4, 0.68):
        p.box(M["brass"], 0, -d / 2 - 0.004, z, w * 0.5, 0.008, 0.012)
    p.box(M["marble"], 0, 0, h - 0.03, w + 0.02, d + 0.02, 0.03, r=0.005)
    p.cyl(M["brass"], w * 0.25, 0, h, 0.1, 0.1, 0.012, seg=32)
    vase(p, M, w * 0.25, 0, h + 0.012, r=0.04, h=0.2)


# ---------------------------------------------------------------- bathrooms

def marble_vanity(p, it, M):
    w, d = it["w"], it["d"]
    p.box(M["walnut"], 0, 0.01, 0.42, w, d - 0.02, 0.34, r=0.006)
    p.box(M["brass"], 0, -d / 2 - 0.004, 0.6, w * 0.5, 0.008, 0.012)
    p.box(M["led"], 0, -d / 2 + 0.04, 0.415, w - 0.06, 0.02, 0.006)
    p.box(M["marble"], 0, 0, 0.76, w + 0.01, d + 0.01, 0.04, r=0.004)
    p.ellipsoid(M["ceramic"], 0, -0.02, 0.84, min(0.2, w / 2 - 0.06), 0.16, 0.08)
    p.cyl(M["brass"], 0, d / 2 - 0.02, 0.98, 0.012, 0.012, 0.14, seg=16)
    p.box(M["brass"], 0, d / 2 - 0.09, 1.1, 0.022, 0.16, 0.022, r=0.008)
    p.cyl(M["brass"], 0.12, d / 2 - 0.02, 0.98, 0.016, 0.012, 0.06, seg=16)
    vase(p, M, -w * 0.3, 0.05, 0.8, r=0.03, h=0.12, mat="ceramic", stems=False)


def brass_shower(p, it, M):
    w, d = it["w"], it["d"]
    p.box(M["glass"], -0.15, -d / 2 + 0.01, 0.0, w - 0.3, 0.01, 2.0)
    p.box(M["brass"], -0.15, -d / 2 + 0.01, 2.0, w - 0.3, 0.02, 0.015)
    p.box(M["brass"], -0.15, -d / 2 + 0.01, 0.0, w - 0.3, 0.02, 0.012)
    p.box(M["brass"], 0, d / 2 - 0.15, 0.002, w - 0.2, 0.06, 0.004)
    p.box(M["brass"], w / 4, d / 4, 2.1, 0.25, 0.25, 0.01, r=0.004)
    p.box(M["brass"], w / 4, d / 4, 2.11, 0.02, 0.02, 0.2)
    p.cyl(M["brass"], w / 2 - 0.03, 0, 1.0, 0.03, 0.03, 0.2, seg=20)


# ---------------------------------------------------------------- kitchen

def luxe_kitchen_run(p, it, M):
    """Ivory handleless base units with a brass gola, ivory marble top and full-height splashback, walnut uppers
    with brass bar pulls and a warm LED line beneath, an undermount sink with a brass tap."""
    w, d, h = it["w"], it["d"], it["h"]
    front = -d / 2
    p.box(M["walnut_dark"], 0, 0.05, 0, w - 0.02, d - 0.1, 0.1)
    p.box(M["ivory_paint"], 0, 0.015, 0.1, w, d - 0.03, 0.68, r=0.002)
    p.box(M["brass"], 0, 0.035, 0.78, w, d - 0.07, 0.05)
    n = max(1, round(w / 0.6))
    for i in range(1, n):
        p.box(M["walnut_dark"], -w / 2 + w / n * i, front + 0.012, 0.11, 0.004, 0.004, 0.66)
    for i in range(0, n, 2):
        p.box(M["walnut_dark"], -w / 2 + w / n * (i + 0.5), front + 0.012, 0.45, w / n - 0.01, 0.004, 0.004)
    p.box(M["marble"], 0, 0, h - 0.07, w, d, 0.05, r=0.004)
    p.box(M["marble"], 0, d / 2 - 0.01, h - 0.02, w, 0.02, 0.62)
    p.box(M["led"], 0, d / 2 - 0.035, h + 0.58, w - 0.04, 0.012, 0.008)
    area_light(p.frame, 0, d / 2 - 0.1, h + 0.55, 0.3, 10.0, (1.0, 0.78, 0.5))
    ud, uz0, uh = 0.35, 1.5, 0.85
    uy = d / 2 - ud / 2
    p.box(M["walnut"], 0, uy, uz0, w, ud, uh, r=0.003)
    nu = max(2, round(w / 0.6))
    for i in range(1, nu):
        p.box(M["walnut_dark"], -w / 2 + w / nu * i, uy - ud / 2 + 0.004, uz0 + 0.02, 0.004, 0.004, uh - 0.04)
    for i in range(nu):
        x = -w / 2 + w / nu * (i + 0.5)
        p.box(M["brass"], x, uy - ud / 2 - 0.02, uz0 + 0.1, 0.012, 0.02, 0.3, r=0.004)
    # a glass-fronted brass-framed display bay at the left end, lit inside
    gx = -w / 2 + 0.34
    p.box(M["walnut_dark"], gx, uy, uz0 + 0.03, 0.62, ud - 0.05, uh - 0.06)
    p.box(M["glass_smoked"], gx, uy - ud / 2 - 0.004, uz0 + 0.03, 0.6, 0.006, uh - 0.06)
    p.box(M["brass"], gx, uy - ud / 2 - 0.006, uz0 + uh / 2, 0.62, 0.008, 0.01)
    for k in range(4):
        p.cyl(M["ceramic"], gx - 0.12, uy + 0.02, uz0 + 0.06 + k * 0.012, 0.1, 0.1, 0.008, seg=28)
    p.cyl(M["ceramic_sand"], gx + 0.14, uy + 0.02, uz0 + 0.06, 0.05, 0.075, 0.09, seg=24)
    area_light(p.frame, gx, uy, uz0 + uh - 0.08, 0.25, 6.0)
    # counter: brass kettle, a walnut board, a marble mortar and a pot of basil
    p.cyl(M["brass"], -w / 2 + 0.9, -0.05, h - 0.02, 0.08, 0.07, 0.2, seg=24)
    p.box(M["walnut"], w / 2 - 0.5, 0.18, h - 0.02, 0.4, 0.04, 0.3, r=0.01, tilt=0.12)
    p.cyl(M["marble"], w / 2 - 0.25, 0.1, h - 0.02, 0.06, 0.05, 0.1)
    p.ellipsoid(M["leaf"], w / 2 - 0.25, 0.1, h + 0.14, 0.09, 0.09, 0.07)
    if w >= 2.5:
        sx = w / 2 - 1.2
        p.box(M["steel"], sx, -0.02, h - 0.24, 0.7, 0.42, 0.2)
        p.box(M["dark_glass"], sx, -0.02, h - 0.019, 0.7, 0.4, 0.001)
        p.cyl(M["brass"], sx, d / 2 - 0.12, h - 0.02, 0.02, 0.016, 0.34, seg=20)
        arm = p.cyl(M["brass"], 0, 0, 0, 0.012, 0.012, 0.26, seg=16)
        arm.matrix_world = p.frame @ Matrix.Translation(Vector((sx, d / 2 - 0.12, h + 0.3))) @ Matrix.Rotation(math.pi / 2, 4, "X")
        p.cyl(M["brass"], sx + 0.08, d / 2 - 0.1, h - 0.02, 0.016, 0.016, 0.1, seg=16)


def walnut_tall_units(p, it, M):
    w, d, h = it["w"], it["d"], it["h"]
    front = -d / 2 - 0.001
    p.box(M["walnut_dark"], 0, 0.04, 0, w - 0.04, d - 0.08, 0.1)
    p.box(M["walnut"], 0, 0.01, 0.1, w, d - 0.02, h - 0.1, r=0.003)
    p.box(M["walnut_dark"], 0, front, 0.12, 0.004, 0.004, h - 0.14)
    p.box(M["walnut_dark"], -w / 4, front, 0.85, w / 2 - 0.02, 0.004, 0.004)
    p.box(M["walnut_dark"], 0, front, h - 0.4, w - 0.02, 0.004, 0.004)
    p.box(M["brass"], -0.05, front - 0.015, 0.95, 0.014, 0.03, 1.0, r=0.005)
    p.box(M["brass"], -0.05, front - 0.015, 0.3, 0.014, 0.03, 0.4, r=0.005)
    ox = w / 4
    p.box(M["black"], ox, front - 0.004, 0.8, 0.62, 0.012, 1.18)
    p.box(M["dark_glass"], ox, front - 0.012, 0.84, 0.56, 0.006, 0.52)
    p.box(M["dark_glass"], ox, front - 0.012, 1.48, 0.56, 0.006, 0.42)
    p.box(M["brass"], ox, front - 0.03, 1.37, 0.5, 0.018, 0.018, r=0.008)
    p.box(M["brass"], ox, front - 0.03, 1.92, 0.5, 0.018, 0.018, r=0.008)
    p.box(M["led"], 0, front + 0.04, h - 0.01, w - 0.04, 0.02, 0.008)


def marble_island(p, it, M):
    """Fluted walnut island under an ivory marble waterfall top, brass footrail, with a brass bowl of fruit."""
    w, d, h = it["w"], it["d"], it["h"]
    p.box(M["walnut_dark"], 0, 0, 0, w - 0.14, d - 0.14, 0.08)
    p.box(M["walnut_dark"], 0, 0, 0.08, w - 0.1, d - 0.04, h - 0.13, r=0.003)
    flutes(p, M["walnut"], -w / 2 + 0.08, w / 2 - 0.08, -d / 2 + 0.02, 0.1, h - 0.18, pitch=0.045, r=0.016)
    flutes(p, M["walnut"], -w / 2 + 0.08, w / 2 - 0.08, d / 2 - 0.02, 0.1, h - 0.18, pitch=0.045, r=0.016)
    p.box(M["marble"], 0, 0, h - 0.05, w, d, 0.05, r=0.004)
    for sx in (-1, 1):
        p.box(M["marble"], sx * (w / 2 - 0.025), 0, 0, 0.05, d, h - 0.05, r=0.003)
    p.box(M["brass"], 0, -d / 2 + 0.06, 0.2, w - 0.3, 0.014, 0.014)
    p.box(M["led"], 0, -d / 2 + 0.05, h - 0.058, w - 0.14, 0.02, 0.006)
    p.cyl(M["brass"], -0.35, 0.1, h, 0.14, 0.16, 0.06, seg=36)
    for k, (x, y) in enumerate(((-0.4, 0.12), (-0.32, 0.06), (-0.36, 0.16), (-0.3, 0.14))):
        p.ellipsoid(M["marigold"] if k % 2 else M["leaf"], x, y, h + 0.085, 0.04, 0.04, 0.04)
    p.box(M["walnut"], 0.4, 0.0, h, 0.42, 0.3, 0.025, r=0.01)
    p.cyl(M["glass"], 0.52, -0.06, h + 0.025, 0.035, 0.035, 0.12, seg=20)


def brass_chimney(p, it, M):
    elev = it.get("elev", 1.9)
    w = it["w"]
    p.box(M["brass"], 0, -0.25, elev, w, 0.5, 0.05, r=0.004)
    p.box(M["walnut"], 0, -0.125, elev + 0.05, 0.34, 0.25, 3.0 - elev - 0.05)
    p.box(M["led"], 0, -0.35, elev - 0.002, 0.5, 0.02, 0.004)
    p.box(M["dark_glass"], 0, -0.3, 0.88, 0.6, 0.5, 0.006, r=0.006)
    for x, y in ((-0.15, -0.2), (0.15, -0.2), (-0.15, -0.4), (0.15, -0.4)):
        p.cyl(M["black"], x, y, 0.886, 0.08, 0.08, 0.002, seg=24)
    lamp_light(p.frame, 0, -0.3, elev - 0.05, watts=6.0)


# ---------------------------------------------------------------- walls

def fluted_tv_wall(p, it, M):
    """Hall feature wall: fluted walnut either side of an ivory marble slab framed in brass, with a slim TV on the
    marble, brass open shelves lit from above in the left bay, and an LED cove washing the top edge."""
    w, h = it["w"], it["h"]
    cw = 1.9
    side = (w - cw) / 2
    p.box(M["walnut_dark"], 0, -0.015, 0, w, 0.03, h)
    p.box(M["marble"], 0, -0.045, 0, cw, 0.09, h, r=0.004)
    for sx in (-1, 1):
        p.box(M["brass"], sx * (cw / 2 + 0.01), -0.05, 0, 0.02, 0.1, h)
    p.box(M["black"], 0, -0.1, 0.95, 1.5, 0.03, 0.86, r=0.004)
    p.box(M["dark_glass"], 0, -0.117, 0.97, 1.46, 0.004, 0.82)
    p.box(M["brass"], 0, -0.1, 0.95, 1.52, 0.004, 0.006)
    # right bay: full-height flutes; left bay: flutes above and below a lit brass shelving niche
    sx_r = cw / 2 + side / 2
    flutes(p, M["walnut"], sx_r - side / 2 + 0.04, sx_r + side / 2 - 0.04, -0.03, 0.05, h - 0.1, pitch=0.045, r=0.016)
    sx_l = -sx_r
    flutes(p, M["walnut"], sx_l - side / 2 + 0.04, sx_l + side / 2 - 0.04, -0.03, 0.05, 0.85, pitch=0.045, r=0.016)
    flutes(p, M["walnut"], sx_l - side / 2 + 0.04, sx_l + side / 2 - 0.04, -0.03, 2.3, h - 2.35, pitch=0.045, r=0.016)
    nw = side - 0.16
    p.box(M["walnut_dark"], sx_l, -0.14, 0.9, nw, 0.28, 1.4)
    p.box(M["ivory_paint"], sx_l, -0.02, 0.92, nw - 0.04, 0.03, 1.36)
    for z in (1.3, 1.75, 2.2):
        p.box(M["brass"], sx_l, -0.15, z, nw - 0.06, 0.24, 0.016)
    p.box(M["led"], sx_l, -0.06, 2.28, nw - 0.08, 0.016, 0.006)
    area_light(p.frame, sx_l, -0.15, 2.26, 0.35, 16.0, (1.0, 0.76, 0.45))
    p.cyl(M["ceramic_sand"], sx_l - 0.1, -0.14, 0.92, 0.05, 0.035, 0.2)
    p.ellipsoid(M["brass"], sx_l + 0.12, -0.14, 0.99, 0.055, 0.055, 0.07)
    for i, mat in enumerate(("book_b", "book_a", "book_d")):
        p.box(M[mat], sx_l - 0.12 + i * 0.035, -0.14, 1.316, 0.03, 0.2, 0.22 + (i % 2) * 0.03)
    vase(p, M, sx_l + 0.12, -0.14, 1.316, r=0.035, h=0.14, mat="ceramic")
    p.ellipsoid(M["ceramic"], sx_l - 0.08, -0.14, 1.82, 0.06, 0.06, 0.06)
    p.cyl(M["glow"], sx_l + 0.12, -0.14, 1.766, 0.03, 0.03, 0.08)
    # cove along the top edge, lit
    p.box(M["walnut_dark"], 0, -0.06, h - 0.06, w, 0.12, 0.06)
    p.box(M["led"], 0, -0.1, h - 0.065, w - 0.1, 0.02, 0.006)
    area_light(p.frame, 0, -0.2, h - 0.12, 1.5, 20.0, (1.0, 0.76, 0.45))


def cane_slat_wall(p, it, M):
    """Bedroom two: sage panels behind each bed under a run of oak slats, brass sconces at the bed heads."""
    w, h = it["w"], it["h"]
    p.box(M["ivory_paint"], 0, -0.005, 0, w, 0.01, h)
    for sx in (-1, 1):
        p.box(M["sage_paint"], sx * 1.05, -0.012, 0.0, 1.6, 0.012, 2.2)
        p.box(M["brass"], sx * 1.05, -0.02, 2.2, 1.6, 0.012, 0.012)
    pitch = 0.09
    n = int((w - 0.2) / pitch)
    for i in range(n):
        x = -w / 2 + 0.1 + pitch / 2 + i * pitch
        if abs(x) < 0.18:
            continue
        p.box(M["oak"], x, -0.035, 0.08, 0.03, 0.04, h - 0.18, r=0.004)
    for sx in (-1, 1):
        sconce(p, sx * 1.05, -0.03, 1.45, watts=4.0, M=M)
    p.box(M["led"], 0, -0.02, h - 0.1, w - 0.2, 0.012, 0.006)


def walnut_niche(p, it, M):
    """Walnut shelving niche with a brass-lit back, books and small objects."""
    w, h = it["w"], it["h"]
    p.box(M["ivory_paint"], 0, -0.005, 0, w, 0.01, h)
    nw = w - 0.2
    p.box(M["walnut_dark"], 0, -0.15, 0.85, nw, 0.3, 1.5)
    p.box(M["sage_paint"], 0, -0.02, 0.87, nw - 0.05, 0.03, 1.46)
    for z in (0.87, 1.22, 1.57, 1.92, 2.3):
        p.box(M["walnut"], 0, -0.16, z, nw - 0.05, 0.27, 0.025)
    p.box(M["led"], 0, -0.06, 2.3, nw - 0.1, 0.012, 0.006)
    area_light(p.frame, 0, -0.16, 2.28, 0.3, 8.0, (1.0, 0.76, 0.45))
    for row, z in enumerate((0.895, 1.595)):
        bx = -nw / 2 + 0.08
        for k in range(6):
            bw = 0.03 + (k % 3) * 0.008
            p.box(M[("book_b", "book_d", "book_c", "book_b", "book_a", "book_b")[(k + row) % 6]], bx, -0.15, z, bw, 0.18, 0.18 + (k % 2) * 0.04)
            bx += bw + 0.005
    p.cyl(M["brass"], 0.25, -0.14, 1.245, 0.045, 0.03, 0.14)
    p.ellipsoid(M["ceramic"], -0.2, -0.15, 1.99, 0.05, 0.05, 0.07)
    vase(p, M, 0.22, -0.15, 1.945, r=0.035, h=0.14)


def jaali_study_wall(p, it, M):
    """Bedroom three: walnut slats across the left, a brass jaali panel lit from behind on the right, two floating
    walnut shelves with books between."""
    w, h = it["w"], it["h"]
    p.box(M["ivory_paint"], 0, -0.005, 0, w, 0.01, h)
    # slats behind the bed head and the nightstand (local +x is the window side), the jaali over the bed's far side,
    # floating shelves beyond it
    pitch = 0.08
    x0, x1 = -0.1, w / 2 - 0.1
    n = int((x1 - x0) / pitch)
    for i in range(n):
        p.box(M["walnut"], x0 + pitch / 2 + i * pitch, -0.03, 0.06, 0.03, 0.04, h - 0.14, r=0.004)
    jx, jw, jz, jh = -0.8, 1.0, 0.95, 1.6
    p.box(M["walnut_dark"], jx, -0.03, jz - 0.05, jw + 0.1, 0.06, jh + 0.1)
    p.box(M["glow"], jx, -0.02, jz, jw, 0.01, jh)
    jaali(p, M["brass"], jx, -0.07, jz, jw, jh, cell=0.16, bar=0.012, depth=0.02)
    area_light(p.frame, jx, -0.14, jz + jh / 2, 0.8, 10.0, (1.0, 0.74, 0.42))
    sx = -w / 2 + 0.25
    for z in (1.15, 1.7):
        p.box(M["walnut"], sx, -0.15, z, 0.4, 0.26, 0.03)
    bx = sx - 0.17
    for k in range(5):
        bw = 0.03 + (k % 3) * 0.008
        p.box(M[("book_b", "book_d", "book_c", "book_a", "book_b")[k % 5]], bx, -0.15, 1.18, bw, 0.2, 0.18 + (k % 2) * 0.04)
        bx += bw + 0.005
    p.ellipsoid(M["ceramic"], sx + 0.1, -0.15, 1.8, 0.06, 0.06, 0.07)
    p.cyl(M["brass"], sx - 0.1, -0.15, 1.73, 0.04, 0.03, 0.12)


# ---------------------------------------------------------------- rugs, lamps, pendants

def lux_rug(p, it, M):
    mat = M["jute"] if it.get("variant") == "jute" else M["rug_ivory"]
    if it.get("variant") == "jute" and abs(it["w"] - it["d"]) < 0.01:
        ob = p.cyl(mat, 0, 0, 0, it["w"] / 2, it["w"] / 2, 0.018, seg=64)
    else:
        ob = p.box(mat, 0, 0, 0.0, it["w"], it["d"], 0.025, r=0.01, seg=2)
    p.rumple(ob, 0.005, 0.03)


def brass_arc_lamp(p, it, M):
    """Brass arc floor lamp on a marble disc base with a linen drum shade over the sofa."""
    p.cyl(M["marble"], 0, 0, 0, 0.17, 0.17, 0.03, seg=40)
    p.cyl(M["brass"], 0, 0, 0.03, 0.012, 0.012, 1.4, seg=12)
    arm = p.cyl(M["brass"], 0, 0, 0, 0.01, 0.01, 0.9, seg=12)
    arm.matrix_world = p.frame @ Matrix.Translation(Vector((0, 0, 1.42))) @ Matrix.Rotation(-1.15, 4, "X")
    p.cyl(M["brass"], 0, 0.82, 1.78, 0.01, 0.01, 0.06, seg=12)
    p.cyl(M["shade"], 0, 0.82, 1.52, 0.2, 0.2, 0.26, seg=40)
    lamp_light(p.frame, 0, 0.82, 1.62, watts=8.0)


def brass_pendant(p, it, M):
    v = it.get("variant")
    ceiling = 3.0
    if v == "brassGlobe":
        low = ceiling - it["h"]
        p.cyl(M["brass"], 0, 0, ceiling - 0.02, 0.05, 0.05, 0.02, seg=24)
        p.cyl(M["brass"], 0, 0, low + 0.16, 0.006, 0.006, ceiling - low - 0.18, seg=10)
        p.cyl(M["brass"], 0, 0, low + 0.12, 0.03, 0.03, 0.05, seg=20)
        p.ellipsoid(M["glass"], 0, 0, low, 0.13, 0.13, 0.13)
        p.ellipsoid(M["bulb"], 0, 0, low, 0.035, 0.035, 0.05)
        lamp_light(p.frame, 0, 0, low - 0.02, watts=6.0)
        return
    if v == "brassLinear":
        w = it["w"]
        p.box(M["brass"], 0, 0, ceiling - 0.03, 0.24, 0.08, 0.03)
        bar_z = 2.05
        p.box(M["brass"], 0, 0, bar_z, w, 0.035, 0.035, r=0.008)
        for sx in (-1, 1):
            p.cyl(M["brass"], sx * (w / 2 - 0.15), 0, bar_z + 0.035, 0.004, 0.004, ceiling - bar_z - 0.065, seg=8)
        for i in range(5):
            x = -w / 2 + 0.12 + (w - 0.24) / 4 * i
            p.ellipsoid(M["glass"], x, 0, bar_z - 0.1, 0.085, 0.085, 0.085)
            p.ellipsoid(M["bulb"], x, 0, bar_z - 0.1, 0.028, 0.028, 0.036)
            lamp_light(p.frame, x, 0, bar_z - 0.16, watts=3.0)
        return
    # brassDome: lobby dome pendant
    low = 2.3
    r = it["w"] / 2
    p.cyl(M["brass"], 0, 0, ceiling - 0.025, 0.06, 0.06, 0.025)
    p.cyl(M["brass"], 0, 0, low + 0.3, 0.004, 0.004, ceiling - low - 0.32, seg=8)
    dome = p.ellipsoid(M["brass"], 0, 0, low + 0.3, r, r, 0.3)
    p.cyl(M["shade"], 0, 0, low + 0.01, r - 0.02, r - 0.02, 0.004, seg=40)
    p.ellipsoid(M["bulb"], 0, 0, low + 0.12, 0.04, 0.04, 0.06)
    lamp_light(p.frame, 0, 0, low - 0.04, watts=8.0)


# ---------------------------------------------------------------- pooja

def jaali_pooja(p, it, M):
    """Walnut mandir: marble plinth, walnut unit with brass-pulled drawers, an arched open shrine lit warm from above
    with a brass jaali backdrop, brass bells and diyas, a marigold garland."""
    w, d, h = it["w"], it["d"], it["h"]
    p.box(M["marble"], 0, 0, 0, w + 0.06, d + 0.04, 0.1, r=0.006)
    p.box(M["walnut"], 0, 0.01, 0.1, w, d - 0.02, 0.7, r=0.006)
    for sx in (-1, 1):
        p.box(M["brass"], sx * w / 4, -d / 2 - 0.004, 0.45, w * 0.3, 0.008, 0.012)
    p.box(M["marble"], 0, 0, 0.8, w + 0.02, d + 0.02, 0.04, r=0.004)
    # shrine: walnut sides and top, an arched brass-trimmed opening, jaali back lit from behind
    sh = h - 0.84
    for sx in (-1, 1):
        p.box(M["walnut"], sx * (w / 2 - 0.04), 0.0, 0.84, 0.08, d, sh)
    p.box(M["walnut"], 0, 0.0, 0.84 + sh - 0.08, w, d, 0.08)
    p.box(M["glow"], 0, d / 2 - 0.03, 0.84, w - 0.16, 0.01, sh - 0.08)
    jaali(p, M["brass"], 0, d / 2 - 0.06, 0.9, w - 0.24, sh - 0.2, cell=0.12, bar=0.01, depth=0.016)
    area_light(p.frame, 0, d / 2 - 0.12, 0.84 + sh - 0.12, 0.5, 9.0, (1.0, 0.7, 0.35))
    arch_r = (w - 0.16) / 2
    arch = p.arch(M["walnut"], 0, -d / 2, -d / 2 + 0.06, 0.84 + sh - 0.08 - arch_r, arch_r + 0.08, arch_r, seg=40)
    p.arch(M["brass"], 0, -d / 2 - 0.004, -d / 2 + 0.002, 0.84 + sh - 0.08 - arch_r, arch_r + 0.012, arch_r, seg=40)
    # inside: a brass pedestal with a lotus form, diyas, bells on cords, a garland across the opening
    p.cyl(M["brass_polished"], 0, 0.05, 0.84, 0.1, 0.12, 0.06, seg=32)
    for k in range(8):
        a = k * math.pi / 4
        petal = p.ellipsoid(M["brass_polished"], 0.07 * math.cos(a), 0.05 + 0.07 * math.sin(a), 0.93, 0.045, 0.02, 0.05)
    p.ellipsoid(M["brass_polished"], 0, 0.05, 0.98, 0.04, 0.04, 0.06)
    for x in (-w / 2 + 0.16, w / 2 - 0.16):
        p.cyl(M["brass"], x, -0.08, 0.84, 0.03, 0.035, 0.025, seg=20)
        p.ellipsoid(M["flame"], x, -0.08, 0.875, 0.007, 0.007, 0.014)
        lamp_light(p.frame, x, -0.08, 0.9, watts=1.2)
    for x in (-w / 2 + 0.22, w / 2 - 0.22):
        p.cyl(M["brass"], x, -d / 2 + 0.1, 0.84 + sh - 0.34, 0.002, 0.002, 0.26, seg=6)
        p.cyl(M["brass_polished"], x, -d / 2 + 0.1, 0.84 + sh - 0.4, 0.03, 0.045, 0.06, seg=24)
    n = 11
    for k in range(n):
        t = k / (n - 1)
        x = -w / 2 + 0.12 + t * (w - 0.24)
        z = 0.84 + sh - 0.1 - 0.14 * math.sin(math.pi * t)
        p.ellipsoid(M["marigold"], x, -d / 2 + 0.02, z, 0.03, 0.03, 0.03)
    # a brass tray of marigolds and a small incense holder on the plinth
    p.cyl(M["brass"], -w / 4, -0.12, 0.84, 0.08, 0.08, 0.01, seg=28)
    marigolds(p, M, -w / 4, -0.12, 0.85, n=7, spread=0.06)
    p.box(M["led"], 0, -d / 2 + 0.03, 0.835, w - 0.2, 0.01, 0.006)


# ---------------------------------------------------------------- dispatch

BUILDERS = {
    ("sofa", "ivoryBoucle"): lux_sofa, ("sofa", "ivoryBoucleRust"): lux_sofa,
    ("loungeChair", "rustVelvet"): velvet_chair,
    ("chair", "boucle"): boucle_chair, ("deskChair", "boucle"): boucle_chair,
    ("stool", "brass"): brass_stool,
    ("table", "walnutBrass"): lux_table,
    ("coffeeTable", "marbleRound"): marble_round_table,
    ("bed", "fluted"): lux_bed, ("bed", "cane"): cane_bed, ("bed", "linenOak"): linen_oak_bed,
    ("nightstand", "walnutBrass"): walnut_brass_nightstand, ("nightstand", "oakDrum"): oak_drum_nightstand,
    ("nightstand", "walnutCube"): walnut_cube_nightstand,
    ("wardrobe", "flutedWalnut"): fluted_wardrobe, ("wardrobe", "flutedOak"): fluted_wardrobe,
    ("dresser", "walnutMarble"): walnut_dresser,
    ("desk", "walnutLong"): walnut_desk,
    ("bench", "sageSeat"): sage_seat, ("bench", "brassOttoman"): brass_ottoman,
    ("sideboard", "flutedMarble"): fluted_sideboard,
    ("console", "marbleFloat"): marble_float_console, ("console", "walnutShoe"): walnut_shoe_console,
    ("vanity", "marbleBrass"): marble_vanity,
    ("shower", "brass"): brass_shower,
    ("kitchenRun", "luxe"): luxe_kitchen_run,
    ("tallUnits", "walnutColumn"): walnut_tall_units,
    ("island", "marbleLuxe"): marble_island,
    ("chimney", "brass"): brass_chimney,
    ("tvWall", "fluted"): fluted_tv_wall,
    ("accentWall", "caneSlats"): cane_slat_wall, ("accentWall", "walnutNiche"): walnut_niche,
    ("accentWall", "jaaliStudy"): jaali_study_wall,
    ("rug", "ivory"): lux_rug, ("rug", "jute"): lux_rug,
    ("floorLamp", "brassArc"): brass_arc_lamp,
    ("pendant", "brassGlobe"): brass_pendant, ("pendant", "brassLinear"): brass_pendant, ("pendant", "brassDome"): brass_pendant,
    ("poojaUnit", "jaali"): jaali_pooja,
}


def build(p, it, M):
    builder = BUILDERS.get((it["type"], it.get("variant")))
    if builder is None:
        return False
    builder(p, it, M)
    return True
