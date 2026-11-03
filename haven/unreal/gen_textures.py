"""
Generate the tileable PBR texture sets the Unreal level uses on the city's surfaces (plaster, concrete,
asphalt, pavers, dusty soil, dry grass), a large-scale ground blend mask and a rippling water normal map:

    python unreal/gen_textures.py            -> unreal/export/textures/pbr_<set>_{diff,nor,rough}.png

The website paints its materials on small canvases that read as flat colour at 1080p; these are 2048 px with
real relief (normal maps derived from a height field) and roughness variation. Everything is periodic noise,
so every set tiles seamlessly. build_level.py imports whatever is in the textures folder and maps each set to
the materials listed in its PBR table.
"""
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "export", "textures")
SIZE = 2048


def rng(seed):
    return np.random.default_rng(seed)


def value_noise(size, cells, seed):
    """Periodic value noise: a cells×cells random lattice, smoothly interpolated over a size×size image."""
    lat = rng(seed).random((cells, cells))
    t = np.arange(size) / size * cells
    i0 = np.floor(t).astype(int)
    f = t - i0
    f = f * f * (3 - 2 * f)
    i1 = (i0 + 1) % cells
    i0 = i0 % cells
    a = lat[np.ix_(i0, i0)]
    b = lat[np.ix_(i0, i1)]
    c = lat[np.ix_(i1, i0)]
    d = lat[np.ix_(i1, i1)]
    fy = f[:, None]
    fx = f[None, :]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def fbm(size, base_cells, octaves, seed, gain=0.5, lacunarity=2):
    out = np.zeros((size, size))
    amp = 1.0
    total = 0.0
    cells = base_cells
    for o in range(octaves):
        out += amp * value_noise(size, int(cells), seed + o * 101)
        total += amp
        amp *= gain
        cells *= lacunarity
    return out / total


def white(size, seed):
    return rng(seed).random((size, size))


def normal_from_height(h, strength):
    """Tangent-space normal map (Unreal's -Y green) from a periodic height field in [0, 1]."""
    dx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * strength
    dy = (np.roll(h, -1, axis=0) - np.roll(h, 1, axis=0)) * strength
    n = np.stack([-dx, dy, np.ones_like(h)], axis=-1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return (n * 0.5 + 0.5)


def save(name, rgb=None, nor=None, rough=None):
    os.makedirs(OUT, exist_ok=True)
    if rgb is not None:
        Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, f"pbr_{name}_diff.png"))
    if nor is not None:
        Image.fromarray((np.clip(nor, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, f"pbr_{name}_nor.png"))
    if rough is not None:
        r = (np.clip(rough, 0, 1) * 255).astype(np.uint8)
        Image.fromarray(r[::2, ::2]).save(os.path.join(OUT, f"pbr_{name}_rough.png"))
    print(f"[textures] {name}")


def colourise(lum, tint):
    return np.stack([lum * tint[i] for i in range(3)], axis=-1)


def plaster(clean=False):
    """Lime-washed plaster: fine grain, a few shallow trowel undulations and, outdoors, warm stains and faint grime streaks."""
    s = SIZE
    grain = fbm(s, 64, 5, 1)
    undul = fbm(s, 6, 3, 2)
    stains = np.clip((fbm(s, 4, 4, 3) - 0.55) * 4, 0, 1)
    streaks = np.clip((fbm(s, 24, 2, 4) - 0.6) * 3, 0, 1)
    lum = 0.90 + (grain - 0.5) * 0.08 + (undul - 0.5) * 0.05
    rgb = colourise(lum, (1.0, 0.985, 0.95))
    if clean:
        stains *= 0.12
        streaks *= 0.0
    rgb -= stains[..., None] * np.array([0.07, 0.09, 0.12])
    rgb -= (streaks * 0.3)[..., None] * np.array([0.05, 0.06, 0.07])
    pits = np.clip((white(s, 6) - 0.985) * 60, 0, 1)
    height = 0.5 + (grain - 0.5) * 0.6 + (undul - 0.5) * 0.9 - pits * 0.6
    nor = normal_from_height(height, 1.6)
    rough = 0.82 + (grain - 0.5) * 0.15 + stains * 0.08
    save("plasterclean" if clean else "plaster", rgb, nor, rough)


def concrete():
    """Cast concrete: pores, aggregate flecks, dark water stains, the odd hairline crack."""
    s = SIZE
    grain = fbm(s, 96, 4, 11)
    cloud = fbm(s, 5, 4, 12)
    pores = np.clip((white(s, 13) - 0.975) * 40, 0, 1) * (fbm(s, 8, 2, 14) > 0.45)
    stains = np.clip((fbm(s, 3, 5, 15) - 0.5) * 2.5, 0, 1)
    lum = 0.70 + (grain - 0.5) * 0.10 + (cloud - 0.5) * 0.12 - stains * 0.14 - pores * 0.25
    rgb = colourise(lum, (1.0, 0.98, 0.95))
    height = 0.5 + (grain - 0.5) * 0.5 + (cloud - 0.5) * 0.5 - pores * 0.9
    nor = normal_from_height(height, 2.2)
    rough = 0.88 + (grain - 0.5) * 0.1 - stains * 0.1
    save("concrete", rgb, nor, rough)


def asphalt():
    """Worn asphalt: dark binder, bright aggregate specks, lighter patches where it has been driven on."""
    s = SIZE
    specks = white(s, 21)
    agg = np.clip((specks - 0.90) * 10, 0, 1)
    fine = fbm(s, 128, 3, 22)
    wear = fbm(s, 3, 4, 23)
    patches = fbm(s, 10, 3, 24)
    lum = 0.16 + agg * 0.30 + (fine - 0.5) * 0.08 + (wear - 0.5) * 0.12 + np.clip(patches - 0.6, 0, 1) * 0.15
    rgb = colourise(lum, (1.0, 0.99, 0.97))
    height = 0.5 + agg * 0.8 + (fine - 0.5) * 0.5
    nor = normal_from_height(height, 1.4)
    rough = 0.92 - np.clip(patches - 0.6, 0, 1) * 0.3 + (fine - 0.5) * 0.1
    save("asphalt", rgb, nor, rough)


def paver():
    """Interlocking concrete pavers in a running bond, 25 × 12.5 cm on a 1 m tile, each a slightly different grey."""
    s = SIZE
    rows, cols = 8, 4
    y = np.arange(s)
    x = np.arange(s)
    ry = (y * rows) // s
    shift = ((ry % 2) * s // (cols * 2))
    xs = (x[None, :] + shift[:, None]) % s
    cx = (xs * cols) // s
    cell = (ry[:, None] * 1000 + cx) % 9973
    r = rng(31)
    lut = r.random(9973)
    tint_lut = r.random((9973, 3))
    fy = (y * rows / s) % 1
    fx = (xs * cols / s) % 1
    mortar_w = 0.045
    edge = np.minimum(np.minimum(fy[:, None], 1 - fy[:, None]) / mortar_w, np.minimum(fx, 1 - fx) / (mortar_w / 2))
    brick = np.clip(edge, 0, 1)
    grain = fbm(s, 80, 4, 32)
    stains = np.clip((fbm(s, 3, 4, 33) - 0.5) * 2, 0, 1)
    base = 0.55 + (lut[cell] - 0.5) * 0.18 + (grain - 0.5) * 0.08
    warm = np.array([1.0, 0.97, 0.92])
    rgb = np.stack([base * warm[i] * (0.985 + tint_lut[cell][..., i] * 0.03) for i in range(3)], axis=-1)
    rgb = rgb * brick[..., None] + np.array([0.42, 0.40, 0.37]) * (1 - brick)[..., None]
    rgb -= stains[..., None] * 0.12
    height = brick * (0.6 + (grain - 0.5) * 0.2) + 0.1
    nor = normal_from_height(height, 2.5)
    rough = 0.78 + (1 - brick) * 0.15 + (grain - 0.5) * 0.1
    save("paver", rgb, nor, rough)


def rooftile():
    """Mangalore clay tiles: 40 cm courses of half-round tiles, each course overlapping the one below, on a 1.6 m tile."""
    s = SIZE
    courses, across = 4, 8
    y, x = np.mgrid[0:s, 0:s] / s
    fy = (y * courses) % 1
    fx = (x * across + np.floor(y * courses) * 0.5) % 1
    # the round of each tile across, the lip of each course down the slope
    round_ = np.sin(fx * np.pi) ** 0.8
    lip = np.clip(1 - fy * 1.2, 0, 1)
    height = round_ * 0.6 + lip * 0.4
    grain = fbm(s, 90, 3, 91)
    weather = fbm(s, 3, 4, 92)
    moss = np.clip((fbm(s, 6, 3, 93) - 0.62) * 4, 0, 1) * lip
    rgb = colourise(0.86 + (grain - 0.5) * 0.12 + (weather - 0.5) * 0.18 - (1 - round_) * 0.12, (1.0, 0.58, 0.42))
    rgb = rgb * (1 - moss[..., None] * 0.6) + np.array([0.35, 0.40, 0.22]) * moss[..., None] * 0.6
    nor = normal_from_height(height, 3.0)
    rough = 0.8 + (grain - 0.5) * 0.15 + moss * 0.15
    save("rooftile", rgb, nor, rough)


def soil():
    """Dry, dusty ground: tan silt, darker damp patches, pebbles and a scatter of dead grass."""
    s = SIZE
    silt = fbm(s, 6, 6, 41)
    fine = fbm(s, 160, 3, 42)
    pebbles = np.clip((white(s, 43) - 0.96) * 25, 0, 1) * (fbm(s, 6, 2, 44) > 0.4)
    damp = np.clip((fbm(s, 3, 4, 45) - 0.55) * 3, 0, 1)
    straw = np.clip((fbm(s, 90, 2, 46) - 0.62) * 4, 0, 1) * (fbm(s, 4, 2, 47) > 0.5)
    lum = 0.62 + (silt - 0.5) * 0.18 + (fine - 0.5) * 0.08 - damp * 0.22 + pebbles * 0.15
    rgb = colourise(lum, (1.0, 0.86, 0.66))
    rgb = rgb * (1 - straw[..., None] * 0.5) + np.array([0.72, 0.64, 0.38]) * straw[..., None] * 0.5
    height = 0.5 + (silt - 0.5) * 0.6 + (fine - 0.5) * 0.5 + pebbles * 0.8 + straw * 0.2
    nor = normal_from_height(height, 1.8)
    rough = 0.95 - damp * 0.12 - pebbles * 0.2
    save("soil", rgb, nor, rough)


def drygrass():
    """Lawn grass: streaky green blades, a little straw in it, patchy where it has worn through to the soil."""
    s = SIZE
    blades = fbm(s, 20, 5, 51)
    streak = value_noise(s, 256, 52)
    # stretch the fine noise along y so it reads as blades
    streak = np.roll(streak, 0, axis=0)
    streak = (streak + np.roll(streak, 3, axis=0) + np.roll(streak, 6, axis=0) + np.roll(streak, 9, axis=0)) / 4
    patch = fbm(s, 4, 4, 53)
    worn = np.clip((patch - 0.58) * 4, 0, 1)
    green = np.array([0.30, 0.46, 0.16])
    straw = np.array([0.56, 0.58, 0.28])
    mix = np.clip(blades * 0.5 + streak * 0.5 - 0.3, 0, 1)[..., None]
    rgb = green * (1 - mix) + straw * mix
    rgb = rgb * (1 - worn[..., None]) + np.array([0.58, 0.49, 0.36]) * worn[..., None]
    rgb *= 0.9 + (streak - 0.5)[..., None] * 0.5
    height = 0.5 + (streak - 0.5) * 0.8 + (blades - 0.5) * 0.4 - worn * 0.3
    nor = normal_from_height(height, 1.5)
    rough = 0.9 + (streak - 0.5) * 0.1
    save("drygrass", rgb, nor, rough)


def ground_mask():
    """Where grass survives on the plain (R) and where the ground is darker and damp (G): slow noise, tiled every 300 m."""
    s = 1024
    r = np.clip((fbm(s, 5, 5, 61) - 0.46) * 3.5, 0, 1)
    g = np.clip((fbm(s, 3, 4, 62) - 0.5) * 3, 0, 1)
    b = fbm(s, 9, 3, 63)
    Image.fromarray((np.stack([r, g, b], axis=-1) * 255).astype(np.uint8)).save(os.path.join(OUT, "pbr_groundmask_mask.png"))
    print("[textures] groundmask")


def water_normal():
    """Small wind ripples: a dozen periodic sine waves plus a little noise, as a normal map that tiles every 8 m."""
    s = 1024
    r = rng(71)
    y, x = np.mgrid[0:s, 0:s] / s
    h = np.zeros((s, s))
    for _ in range(14):
        kx, ky = r.integers(-9, 10), r.integers(-9, 10)
        if kx == 0 and ky == 0:
            continue
        amp = 1.0 / (1 + np.hypot(kx, ky))
        h += amp * np.sin(2 * np.pi * (kx * x + ky * y) + r.random() * 6.28)
    h = (h - h.min()) / (h.max() - h.min())
    h = h * 0.8 + fbm(s, 40, 3, 72) * 0.2
    nor = normal_from_height(h, 1.2)
    Image.fromarray((np.clip(nor, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, "pbr_water_nor.png"))
    print("[textures] water")


def flat_defaults():
    """Tiny neutral textures the masters default to: linear white (roughness) and a flat blend mask."""
    Image.fromarray(np.full((4, 4), 255, np.uint8)).save(os.path.join(OUT, "pbr_white_rough.png"))
    Image.fromarray(np.zeros((4, 4, 3), np.uint8)).save(os.path.join(OUT, "pbr_flat_mask.png"))
    print("[textures] defaults")


def detail_normal():
    """A faint generic micro-surface for everything plain-coloured: the brush marks and dust that keep a surface from reading as CG."""
    s = 1024
    h = fbm(s, 48, 4, 81) * 0.7 + white(s, 82) * 0.3
    nor = normal_from_height(h, 0.9)
    Image.fromarray((np.clip(nor, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, "pbr_detail_nor.png"))
    print("[textures] detail")


if __name__ == "__main__":
    plaster()
    plaster(clean=True)
    concrete()
    asphalt()
    paver()
    rooftile()
    soil()
    drygrass()
    ground_mask()
    water_normal()
    detail_normal()
    flat_defaults()
