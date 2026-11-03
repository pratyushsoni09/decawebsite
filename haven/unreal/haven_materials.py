"""
Unreal Editor Python (imported by build_level.py): the level's materials.

Every Blender material becomes an instance of one of a few master materials built here from nodes:

  M_Haven        plain colour (furniture, trims)
  M_HavenTex     textured: base colour x tint x vertex colour, normal map, roughness map
  M_HavenTri     the same surfaces projected world-aligned (triplanar) for meshes without metric UVs
  M_HavenGround  dusty soil and dry grass blended by a slow noise mask, tiled at two scales so it never repeats
  M_HavenWater   dark water with two layers of drifting ripples, reflecting the sky through Lumen
  M_HavenFoliage leaf cards: two-sided foliage shading (light through the leaves) and a gentle wind
  M_HavenGlass   translucent glass
  M_HavenCar     car paint under a clear coat

The city's surfaces come with the website's small painted canvases; the PBR table below swaps those for the
2048 px sets gen_textures.py makes (plaster, concrete, asphalt, pavers, soil, dry grass), with real relief.
"""
import json
import os
import re

import unreal

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(HERE, "export")
MAT_DIR = "/Game/Haven/Materials"

AT = unreal.AssetToolsHelpers.get_asset_tools()
EAL = unreal.EditorAssetLibrary
MEL = unreal.MaterialEditingLibrary
MP = unreal.MaterialProperty

# material name -> (texture set, tile metres, projection, tint or None for the exported tint, extra params)
PBR = {
    "wallCream": ("plaster", 2.5, "uv", None, {}),
    "wallBeige": ("plaster", 2.5, "uv", None, {}),
    "wallOchre": ("plaster", 2.5, "uv", None, {}),
    "wallGrey": ("plaster", 2.5, "uv", None, {}),
    "wallWhite": ("plaster", 2.5, "uv", None, {}),
    "wallRose": ("plaster", 2.5, "uv", None, {}),
    "compoundWall": ("plaster", 2.0, "uv", (0.80, 0.76, 0.69), {}),
    "plaster": ("plasterclean", 2.0, "uv", (0.88, 0.84, 0.75), {}),
    "parapet": ("plaster", 2.0, "tri", (0.84, 0.82, 0.77), {}),
    "concrete": ("concrete", 3.0, "uv", None, {}),
    "bridgeConcrete": ("concrete", 3.0, "tri", (0.74, 0.73, 0.69), {}),
    "kerb": ("concrete", 1.5, "tri", (0.82, 0.81, 0.78), {}),
    "roofGrey": ("concrete", 3.0, "tri", (0.58, 0.58, 0.56), {}),
    "tank": ("plaster", 1.0, "tri", (0.35, 0.35, 0.35), {}),
    "asphalt": ("asphalt", 4.0, "uv", (1.0, 1.0, 1.0), {}),
    "roofTile": ("rooftile", 1.6, "tri", (1.0, 1.0, 1.0), {}),
    "pole": ("concrete", 1.5, "tri", (0.8, 0.79, 0.76), {}),
    "paver": ("paver", 1.0, "uv", (0.92, 0.92, 0.92), {}),
    "pathStone": ("paver", 1.0, "tri", (0.86, 0.85, 0.82), {}),
    "ground": ("ground", 0, "ground", (1.0, 1.0, 1.0), {"GrassAmount": 0.7, "GrassBase": 0.55}),
    "urban": ("ground", 0, "ground", (0.9, 0.9, 0.86), {"GrassAmount": 0.6, "GrassBase": 0.35}),
    "dirt": ("ground", 0, "ground", (0.96, 0.92, 0.84), {"GrassAmount": 0.3, "GrassBase": 0.0}),
    "scrub": ("ground", 0, "ground", (0.95, 1.0, 0.9), {"GrassAmount": 0.6, "GrassBase": 0.6}),
    "grass": ("ground", 0, "ground", (0.85, 1.0, 0.8), {"GrassAmount": 0.0, "GrassBase": 1.0}),
    "park": ("ground", 0, "ground", (0.85, 1.0, 0.8), {"GrassAmount": 0.0, "GrassBase": 1.0}),
    "pitch": ("ground", 0, "ground", (0.7, 1.0, 0.65), {"GrassAmount": 0.0, "GrassBase": 1.0}),
    "farm": ("ground", 0, "ground", (0.95, 1.0, 0.8), {"GrassAmount": 0.5, "GrassBase": 0.5}),
    "river": ("water", 0, "water", (0.045, 0.075, 0.08), {}),
    "lake": ("water", 0, "water", (0.035, 0.06, 0.06), {}),
    "water": ("water", 0, "water", (0.05, 0.09, 0.1), {}),
}
CAR_PAINTS = ("carWhite", "carSilver", "carGrey", "carRed", "carBlue", "carBlack", "carYellow", "carOrange", "carPaint")


def log(msg):
    unreal.log(f"[haven] {msg}")


def clean(name):
    return re.sub(r"[^A-Za-z0-9_]", "_", name)


# ---------------------------------------------------------------- node helpers

def node(mat, cls, x, y, **props):
    n = MEL.create_material_expression(mat, cls, x, y)
    for k, v in props.items():
        n.set_editor_property(k, v)
    return n


def const(mat, v, x, y):
    return node(mat, unreal.MaterialExpressionConstant, x, y, r=float(v))


def scalar(mat, name, v, x, y):
    return node(mat, unreal.MaterialExpressionScalarParameter, x, y, parameter_name=name, default_value=float(v))


def vector(mat, name, rgb, x, y):
    return node(mat, unreal.MaterialExpressionVectorParameter, x, y, parameter_name=name, default_value=unreal.LinearColor(*rgb, 1))


def link(a, a_out, b, b_in):
    MEL.connect_material_expressions(a, a_out, b, b_in)


def binop(mat, cls, a, a_out, b, b_out, x, y):
    n = node(mat, cls, x, y)
    link(a, a_out, n, "A")
    link(b, b_out, n, "B")
    return n


def mul(mat, a, a_out, b, b_out, x, y):
    return binop(mat, unreal.MaterialExpressionMultiply, a, a_out, b, b_out, x, y)


def add(mat, a, a_out, b, b_out, x, y):
    return binop(mat, unreal.MaterialExpressionAdd, a, a_out, b, b_out, x, y)


def lerp(mat, a, a_out, b, b_out, t, t_out, x, y):
    n = node(mat, unreal.MaterialExpressionLinearInterpolate, x, y)
    link(a, a_out, n, "A")
    link(b, b_out, n, "B")
    link(t, t_out, n, "Alpha")
    return n


def mask(mat, src, src_out, x, y, r=False, g=False, b=False, a=False):
    n = node(mat, unreal.MaterialExpressionComponentMask, x, y, r=r, g=g, b=b, a=a)
    link(src, src_out, n, "")
    return n


_DEFAULTS = {}


def default_texture(kind):
    """The neutral texture a sampler shows until an instance sets it; sampler type and texture must agree."""
    if kind == "normal":
        return unreal.load_asset("/Engine/EngineMaterials/DefaultNormal")
    if kind == "linear":
        return _DEFAULTS.get("rough") or unreal.load_asset("/Engine/EngineMaterials/DefaultNormal")
    if kind == "mask":
        return _DEFAULTS.get("mask") or unreal.load_asset("/Engine/EngineMaterials/DefaultNormal")
    return unreal.load_asset("/Engine/EngineResources/WhiteSquareTexture")


def sampler(mat, pname, kind, x, y, uv=None, uv_out=""):
    """A texture parameter sampler: kind 'color' | 'linear' | 'mask' | 'normal'."""
    t = node(mat, unreal.MaterialExpressionTextureSampleParameter2D, x, y, parameter_name=pname)
    if kind == "normal":
        t.set_editor_property("sampler_type", unreal.MaterialSamplerType.SAMPLERTYPE_NORMAL)
    elif kind in ("linear", "mask"):
        t.set_editor_property("sampler_type", unreal.MaterialSamplerType.SAMPLERTYPE_LINEAR_COLOR)
    t.set_editor_property("texture", default_texture(kind))
    if uv is not None:
        link(uv, uv_out, t, "UVs")
    return t


def world_uv(mat, tile_m, x, y):
    """World XY in metres / tile: a top-down projection for ground-like surfaces."""
    wp = node(mat, unreal.MaterialExpressionWorldPosition, x, y)
    xy = mask(mat, wp, "", x + 150, y, r=True, g=True)
    d = node(mat, unreal.MaterialExpressionDivide, x + 300, y)
    link(xy, "", d, "A")
    link(const(mat, tile_m * 100.0, x + 150, y + 80), "", d, "B")
    return d


def triplanar(mat, pname, kind, divisor, x, y):
    """Sample a texture parameter along the three world axes (world cm / divisor) and blend by the surface normal."""
    wp = node(mat, unreal.MaterialExpressionWorldPosition, x, y)
    scaled = node(mat, unreal.MaterialExpressionDivide, x + 150, y)
    link(wp, "", scaled, "A")
    link(divisor, "", scaled, "B")
    n = node(mat, unreal.MaterialExpressionVertexNormalWS, x, y + 200)
    an = node(mat, unreal.MaterialExpressionAbs, x + 150, y + 200)
    link(n, "", an, "")
    sq = mul(mat, an, "", an, "", x + 300, y + 200)
    wx = mask(mat, sq, "", x + 450, y + 160, r=True)
    wy = mask(mat, sq, "", x + 450, y + 220, g=True)
    wz = mask(mat, sq, "", x + 450, y + 280, b=True)
    total = add(mat, add(mat, wx, "", wy, "", x + 600, y + 180), "", wz, "", x + 750, y + 200)
    out = None
    for i, (flags, w) in enumerate((({"g": True, "b": True}, wx), ({"r": True, "b": True}, wy), ({"r": True, "g": True}, wz))):
        uv = mask(mat, scaled, "", x + 300, y - 100 + i * 120, **flags)
        s = sampler(mat, pname, kind, x + 450, y - 100 + i * 120, uv)
        wn = node(mat, unreal.MaterialExpressionDivide, x + 900, y - 100 + i * 120)
        link(w, "", wn, "A")
        link(total, "", wn, "B")
        term = mul(mat, s, "RGB", wn, "", x + 1050, y - 100 + i * 120)
        out = term if out is None else add(mat, out, "", term, "", x + 1200 + i * 100, y)
    return out


def finish(mat):
    MEL.recompile_material(mat)
    EAL.save_loaded_asset(mat)
    return mat


def new_master(name):
    path = f"{MAT_DIR}/{name}"
    if EAL.does_asset_exist(path):
        EAL.delete_asset(path)
    return AT.create_asset(name, MAT_DIR, unreal.Material, unreal.MaterialFactoryNew())


def common(mat, rough_tex=None):
    """Roughness, metallic and emissive parameters every master shares; roughness optionally scaled by a map."""
    rough = scalar(mat, "Roughness", 0.5, -400, 200)
    if rough_tex is not None:
        r = mul(mat, rough, "", rough_tex, "R", -200, 200)
        MEL.connect_material_property(r, "", MP.MP_ROUGHNESS)
    else:
        MEL.connect_material_property(rough, "", MP.MP_ROUGHNESS)
    metal = scalar(mat, "Metallic", 0.0, -400, 300)
    MEL.connect_material_property(metal, "", MP.MP_METALLIC)
    emis = vector(mat, "Emissive", (0, 0, 0), -400, 400)
    MEL.connect_material_property(emis, "", MP.MP_EMISSIVE_COLOR)


# ---------------------------------------------------------------- masters

def master_color(name="M_Haven", glass=False, car=False):
    mat = new_master(name)
    if glass:
        mat.set_editor_property("blend_mode", unreal.BlendMode.BLEND_TRANSLUCENT)
        mat.set_editor_property("translucency_lighting_mode", unreal.TranslucencyLightingMode.TLM_SURFACE_PER_PIXEL_LIGHTING)
        mat.set_editor_property("two_sided", True)
    if car:
        # the clear-coat pins are not scriptable; unconnected they default to a full coat at roughness 0.1
        mat.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_CLEAR_COAT)
    common(mat)
    tint = vector(mat, "Color", (0.8, 0.8, 0.8), -700, 0)
    MEL.connect_material_property(tint, "", MP.MP_BASE_COLOR)
    if glass:
        op = scalar(mat, "Opacity", 0.25, -400, 500)
        MEL.connect_material_property(op, "", MP.MP_OPACITY)
    return finish(mat)


def master_tex(name="M_HavenTex", foliage=False):
    mat = new_master(name)
    if foliage:
        mat.set_editor_property("blend_mode", unreal.BlendMode.BLEND_MASKED)
        mat.set_editor_property("two_sided", True)
        mat.set_editor_property("opacity_mask_clip_value", 0.4)
        mat.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_TWO_SIDED_FOLIAGE)
    coord = node(mat, unreal.MaterialExpressionTextureCoordinate, -1300, 0)
    tiling = scalar(mat, "Tiling", 1.0, -1300, 150)
    uv = mul(mat, coord, "", tiling, "", -1100, 50)
    tex = sampler(mat, "BaseTex", "color", -900, -100, uv)
    tint = vector(mat, "Color", (0.8, 0.8, 0.8), -700, 0)
    base = mul(mat, tex, "RGB", tint, "", -500, -50)
    vcol = node(mat, unreal.MaterialExpressionVertexColor, -500, -200)
    base = mul(mat, base, "", vcol, "", -300, -100)
    MEL.connect_material_property(base, "", MP.MP_BASE_COLOR)
    nor = sampler(mat, "NormalTex", "normal", -900, 300, uv)
    MEL.connect_material_property(nor, "RGB", MP.MP_NORMAL)
    rough_tex = sampler(mat, "RoughTex", "linear", -900, 500, uv)
    common(mat, rough_tex)
    if foliage:
        MEL.connect_material_property(tex, "A", MP.MP_OPACITY_MASK)
        # light through the leaves
        sss = mul(mat, base, "", const(mat, 0.5, -300, 50), "", -150, 0)
        MEL.connect_material_property(sss, "", MP.MP_SUBSURFACE_COLOR)
        # a slow sway: every card drifts a few centimetres with a phase set by where it stands
        wp = node(mat, unreal.MaterialExpressionWorldPosition, -1300, 700)
        px = mask(mat, wp, "", -1150, 700, r=True)
        py = mask(mat, wp, "", -1150, 780, g=True)
        phase = add(mat, mul(mat, px, "", const(mat, 0.004, -1150, 850), "", -1000, 700), "", mul(mat, py, "", const(mat, 0.003, -1150, 900), "", -1000, 780), "", -850, 720)
        t = node(mat, unreal.MaterialExpressionTime, -1000, 900)
        tt = mul(mat, t, "", const(mat, 1.3, -1000, 960), "", -850, 900)
        arg = add(mat, phase, "", tt, "", -700, 800)
        s = node(mat, unreal.MaterialExpressionSine, -550, 800)
        link(arg, "", s, "")
        amp = scalar(mat, "Wind", 4.0, -550, 880)
        sw = mul(mat, s, "", amp, "", -400, 820)
        half = mul(mat, sw, "", const(mat, 0.5, -400, 900), "", -250, 880)
        v2 = node(mat, unreal.MaterialExpressionAppendVector, -100, 840)
        link(sw, "", v2, "A")
        link(half, "", v2, "B")
        v3 = node(mat, unreal.MaterialExpressionAppendVector, 50, 860)
        link(v2, "", v3, "A")
        link(const(mat, 0.0, -100, 940), "", v3, "B")
        MEL.connect_material_property(v3, "", MP.MP_WORLD_POSITION_OFFSET)
    return finish(mat)


def master_tri(name="M_HavenTri"):
    mat = new_master(name)
    # the instance's Tiling is tiles per 2 m, as for the UV master: world cm / (200 / Tiling)
    tiling = scalar(mat, "Tiling", 1.0, -2800, -600)
    tile = node(mat, unreal.MaterialExpressionDivide, -2600, -600)
    link(const(mat, 200.0, -2800, -520), "", tile, "A")
    link(tiling, "", tile, "B")
    base = triplanar(mat, "BaseTex", "color", tile, -2400, -300)
    tint = vector(mat, "Color", (0.8, 0.8, 0.8), -700, -500)
    MEL.connect_material_property(mul(mat, base, "", tint, "", -300, -400), "", MP.MP_BASE_COLOR)
    nor = triplanar(mat, "NormalTex", "normal", tile, -2400, 400)
    MEL.connect_material_property(nor, "", MP.MP_NORMAL)
    rough = triplanar(mat, "RoughTex", "linear", tile, -2400, 1100)
    r = scalar(mat, "Roughness", 0.5, -400, 1200)
    MEL.connect_material_property(mul(mat, rough, "", r, "", -200, 1200), "", MP.MP_ROUGHNESS)
    MEL.connect_material_property(scalar(mat, "Metallic", 0.0, -400, 1300), "", MP.MP_METALLIC)
    MEL.connect_material_property(vector(mat, "Emissive", (0, 0, 0), -400, 1400), "", MP.MP_EMISSIVE_COLOR)
    return finish(mat)


def master_ground(name="M_HavenGround"):
    """Soil at two scales (so the tiling never shows) and dry grass, blended by a 300 m noise mask."""
    mat = new_master(name)
    uv_a = world_uv(mat, 5.0, -2600, -400)
    uv_b = world_uv(mat, 23.0, -2600, -200)
    uv_g = world_uv(mat, 3.5, -2600, 0)
    uv_m = world_uv(mat, 300.0, -2600, 200)
    m = sampler(mat, "MaskTex", "mask", -2100, 200, uv_m)
    soil_a = sampler(mat, "SoilTex", "color", -2100, -400, uv_a)
    soil_b = sampler(mat, "SoilTex", "color", -2100, -250, uv_b)
    soil = lerp(mat, soil_a, "RGB", soil_b, "RGB", m, "B", -1800, -300)
    grass = sampler(mat, "GrassTex", "color", -2100, 0, uv_g)
    # grass everywhere the base amount says, soil showing through where the mask (times the amount) is low
    amount = scalar(mat, "GrassAmount", 0.6, -1800, 100)
    base_amount = scalar(mat, "GrassBase", 0.5, -1800, 180)
    gsum = add(mat, mul(mat, m, "R", amount, "", -1600, 150), "", base_amount, "", -1500, 170)
    gmask = node(mat, unreal.MaterialExpressionSaturate, -1400, 170)
    link(gsum, "", gmask, "")
    base = lerp(mat, soil, "", grass, "RGB", gmask, "", -1400, -100)
    damp = lerp(mat, const(mat, 1.0, -1400, 150), "", const(mat, 0.72, -1400, 200), "", m, "G", -1200, 150)
    base = mul(mat, base, "", damp, "", -1000, -50)
    tint = vector(mat, "Color", (1, 1, 1), -1000, 100)
    MEL.connect_material_property(mul(mat, base, "", tint, "", -800, 0), "", MP.MP_BASE_COLOR)
    nor_a = sampler(mat, "SoilNor", "normal", -2100, 400, uv_a)
    nor_b = sampler(mat, "SoilNor", "normal", -2100, 550, uv_b)
    nor_s = lerp(mat, nor_a, "RGB", nor_b, "RGB", m, "B", -1800, 450)
    nor_g = sampler(mat, "GrassNor", "normal", -2100, 700, uv_g)
    nor = lerp(mat, nor_s, "", nor_g, "RGB", gmask, "", -1400, 500)
    MEL.connect_material_property(nor, "", MP.MP_NORMAL)
    r_s = sampler(mat, "SoilRough", "linear", -2100, 900, uv_a)
    r_g = sampler(mat, "GrassRough", "linear", -2100, 1050, uv_g)
    r = lerp(mat, r_s, "R", r_g, "R", gmask, "", -1400, 950)
    MEL.connect_material_property(r, "", MP.MP_ROUGHNESS)
    MEL.connect_material_property(const(mat, 0.0, -400, 1100), "", MP.MP_METALLIC)
    MEL.connect_material_property(vector(mat, "Emissive", (0, 0, 0), -400, 1200), "", MP.MP_EMISSIVE_COLOR)
    return finish(mat)


def master_water(name="M_HavenWater"):
    mat = new_master(name)
    tint = vector(mat, "Color", (0.04, 0.07, 0.08), -700, -100)
    MEL.connect_material_property(tint, "", MP.MP_BASE_COLOR)
    MEL.connect_material_property(scalar(mat, "Roughness", 0.04, -400, 200), "", MP.MP_ROUGHNESS)
    MEL.connect_material_property(const(mat, 0.0, -400, 300), "", MP.MP_METALLIC)
    MEL.connect_material_property(const(mat, 1.0, -400, 360), "", MP.MP_SPECULAR)
    MEL.connect_material_property(vector(mat, "Emissive", (0, 0, 0), -400, 420), "", MP.MP_EMISSIVE_COLOR)
    out = None
    for i, (tile, sx, sy) in enumerate(((9.0, 0.018, 0.011), (3.2, -0.009, 0.016))):
        uv = world_uv(mat, tile, -2000, 500 + i * 300)
        pan = node(mat, unreal.MaterialExpressionPanner, -1500, 500 + i * 300, speed_x=sx, speed_y=sy)
        link(uv, "", pan, "Coordinate")
        s = sampler(mat, "WaterNor", "normal", -1300, 500 + i * 300, pan)
        out = s if out is None else add(mat, out, "RGB", s, "RGB", -1000, 650)
    # two normal maps added: halve towards one unit-ish vector (the sampler already decodes to -1..1)
    half = mul(mat, out, "", const(mat, 0.5, -1000, 750), "", -800, 650)
    strength = scalar(mat, "Ripple", 0.6, -800, 750)
    flat = node(mat, unreal.MaterialExpressionConstant3Vector, -800, 850, constant=unreal.LinearColor(0, 0, 1, 1))
    nor = lerp(mat, flat, "", half, "", strength, "", -600, 700)
    MEL.connect_material_property(nor, "", MP.MP_NORMAL)
    return finish(mat)


# ---------------------------------------------------------------- instances

def build_materials(textures):
    """Every exported material as an instance; returns {clean name: instance}."""
    _DEFAULTS["rough"] = textures.get("pbr_white_rough.png")
    _DEFAULTS["mask"] = textures.get("pbr_flat_mask.png")
    with open(os.path.join(EXPORT, "materials.json"), encoding="utf8") as f:
        specs = json.load(f)
    masters = {
        "color": master_color("M_Haven"), "glass": master_color("M_HavenGlass", glass=True), "car": master_color("M_HavenCar", car=True),
        "tex": master_tex("M_HavenTex"), "masked": master_tex("M_HavenFoliage", foliage=True),
        "tri": master_tri("M_HavenTri"), "ground": master_ground("M_HavenGround"), "water": master_water("M_HavenWater"),
    }
    have_pbr = {k for k in ("plaster", "concrete", "asphalt", "paver", "soil", "drygrass", "rooftile", "plasterclean") if f"pbr_{k}_diff.png" in textures}
    instances = {}
    swapped = 0
    for spec in specs:
        name = "MI_" + clean(spec["name"])
        path = f"{MAT_DIR}/{name}"
        if EAL.does_asset_exist(path):
            EAL.delete_asset(path)
        glass = spec["transmission"] > 0.5 or spec["alpha"] < 0.9
        base_tex = textures.get(spec["textures"].get("baseColor", ""))
        nor_tex = textures.get(spec["textures"].get("normal", ""))
        rough_tex = textures.get(spec["textures"].get("roughness", ""))
        c = spec["baseColor"]
        t = spec.get("tint", [1, 1, 1])
        pbr = PBR.get(spec["name"])
        if pbr and pbr[0] in ("ground", "water"):
            kind = pbr[0]
        elif pbr and pbr[0] in have_pbr:
            kind = "tri" if pbr[2] == "tri" else "tex"
        elif spec["name"] in CAR_PAINTS:
            kind, pbr = "car", None
        else:
            pbr = None
            kind = "masked" if (spec.get("masked") and base_tex) else "glass" if glass else ("tex" if (base_tex or nor_tex) else "color")
        mi = AT.create_asset(name, MAT_DIR, unreal.MaterialInstanceConstant, unreal.MaterialInstanceConstantFactoryNew())
        MEL.set_material_instance_parent(mi, masters[kind])
        vec = MEL.set_material_instance_vector_parameter_value
        sca = MEL.set_material_instance_scalar_parameter_value
        texp = MEL.set_material_instance_texture_parameter_value
        e = spec["emission"]
        s = spec["emissionStrength"]
        vec(mi, "Emissive", unreal.LinearColor(e[0] * s, e[1] * s, e[2] * s, 1))
        sca(mi, "Metallic", spec["metallic"])
        if pbr:
            swapped += 1
            setname, tile, mode, tint, extra = pbr
            colour = tint if tint is not None else (t if base_tex else c)
            vec(mi, "Color", unreal.LinearColor(colour[0], colour[1], colour[2], 1))
            for k, v in extra.items():
                sca(mi, k, v)
            if mode == "ground":
                texp(mi, "SoilTex", textures["pbr_soil_diff.png"])
                texp(mi, "SoilNor", textures["pbr_soil_nor.png"])
                texp(mi, "SoilRough", textures["pbr_soil_rough.png"])
                texp(mi, "GrassTex", textures["pbr_drygrass_diff.png"])
                texp(mi, "GrassNor", textures["pbr_drygrass_nor.png"])
                texp(mi, "GrassRough", textures["pbr_drygrass_rough.png"])
                texp(mi, "MaskTex", textures["pbr_groundmask_mask.png"])
            elif mode == "water":
                texp(mi, "WaterNor", textures["pbr_water_nor.png"])
                sca(mi, "Roughness", 0.04)
            else:
                texp(mi, "BaseTex", textures[f"pbr_{setname}_diff.png"])
                texp(mi, "NormalTex", textures[f"pbr_{setname}_nor.png"])
                texp(mi, "RoughTex", textures[f"pbr_{setname}_rough.png"])
                sca(mi, "Roughness", 1.0)
                sca(mi, "Tiling", (1.0 / tile) if mode == "uv" else (2.0 / tile))
        else:
            vec(mi, "Color", unreal.LinearColor(t[0], t[1], t[2], 1) if (kind in ("tex", "masked") and base_tex) else unreal.LinearColor(c[0], c[1], c[2], 1))
            if kind == "car":
                sca(mi, "Roughness", 0.42)
                sca(mi, "Metallic", 0.55)
            else:
                sca(mi, "Roughness", spec["roughness"])
            if kind in ("tex", "masked"):
                if base_tex:
                    texp(mi, "BaseTex", base_tex)
                if nor_tex:
                    texp(mi, "NormalTex", nor_tex)
                if rough_tex:
                    texp(mi, "RoughTex", rough_tex)
                scale = spec.get("uvScale", [1, 1])[0]
                sca(mi, "Tiling", float(scale) if scale else 1.0)
            if kind == "glass":
                sca(mi, "Opacity", 0.2 if spec["transmission"] > 0.5 else spec["alpha"])
        MEL.update_material_instance(mi)
        EAL.save_loaded_asset(mi)
        instances[clean(spec["name"])] = mi
    log(f"{len(instances)} material instances ({swapped} on the generated PBR sets)")
    return instances
