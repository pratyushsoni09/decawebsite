import * as THREE from "three";
import { CITY, CITY_RADIUS, SIGNED, TOWER_X, TOWER_Z, type CityData } from "./cityData";
import { StaticBuilder } from "./geom";
import { CAR_COLOURS, signUV, type MatKey } from "./materials";
import { vehicleGeometry } from "./traffic";

export { CITY, CITY_ATTRIBUTION, CITY_RADIUS } from "./cityData";

/**
 * The real surroundings of the tower: Kudasan, Gandhinagar from open map data (scripts/fetch_kudasan.py).
 *
 *  - near ring (to 1.8 km): every footprint extruded to its height. Within 320 m the blocks get real
 *    windows with frames and dark glass, half-wall balconies, AC units, parapets, stair heads, tanks and
 *    solar heaters; the shops the map names get a signboard and a glazed front; compound walls line the
 *    streets. To 900 m the facades are painted textures with a window per bay; beyond, plain massing.
 *  - far ring (to 7 km): the skyline's bigger buildings and the towers of Infocity and GIFT City,
 *    the main roads with their flyovers and bridges, the Sabarmati, the lakes and canals, parks, woods
 *    and farmland, out to where the haze takes over.
 *  - streets with kerbs, footpaths, planted medians and lamp posts near the tower; trees everywhere a
 *    tree can stand (Gandhinagar is the greenest capital in the country), as crossed leaf cards.
 *
 * Plan metres: x east, y south (→ world z); the tower's plot is kept clear.
 */

/** the ground disc reaches past the mapped city to where the fog has fully taken over */
export const GROUND_RADIUS = 12000;

const STOREY = 3.1;
/** detail bands, metres from the tower */
const NEAR = 320;
const MID = 900;
const TREE_NEAR = 260;

/* ------------------------------------------------------------------ geometry helpers */

/** flat polygon on the ground at height y (plan y → world z), facing up */
function flat(ring: number[][], y: number) {
  const g = new THREE.ShapeGeometry(new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z))));
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

/** polygon extruded from y0 to y0 + h; with `hole`, a ring wall between the two outlines */
function extrude(ring: number[][], h: number, y0 = 0, hole?: number[][]) {
  const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
  if (hole) shape.holes.push(new THREE.Path(hole.map(([x, z]) => new THREE.Vector2(x, -z))));
  const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, UVGenerator: metricSideUVs });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  return g;
}

function centroid(ring: number[][]): [number, number] {
  let x = 0, z = 0;
  for (const [px, pz] of ring) { x += px; z += pz; }
  return [x / ring.length, z / ring.length];
}

/** the outline grown (d > 0) or shrunk (d < 0) by about d metres, scaled about its centroid */
function offset(ring: number[][], d: number) {
  const [cx, cz] = centroid(ring);
  const r = ring.reduce((s, [x, z]) => s + Math.hypot(x - cx, z - cz), 0) / ring.length;
  const k = Math.max(0.2, 1 + d / r);
  return ring.map(([x, z]) => [cx + (x - cx) * k, cz + (z - cz) * k]);
}

function area(ring: number[][]) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, z1] = ring[i];
    const [x2, z2] = ring[(i + 1) % ring.length];
    a += x1 * z2 - x2 * z1;
  }
  return Math.abs(a) / 2;
}

/** side-wall UVs in metres (u along the wall, v = height) so the facade texture repeats per storey */
const metricSideUVs: THREE.ExtrudeGeometryOptions["UVGenerator"] = {
  generateTopUV(_g, v, a, b, c) {
    return [new THREE.Vector2(v[a * 3], v[a * 3 + 1]), new THREE.Vector2(v[b * 3], v[b * 3 + 1]), new THREE.Vector2(v[c * 3], v[c * 3 + 1])];
  },
  generateSideWallUV(_g, v, a, b, c, d) {
    const ax = v[a * 3], ay = v[a * 3 + 1], bx = v[b * 3], by = v[b * 3 + 1];
    const len = Math.hypot(bx - ax, by - ay);
    return [
      new THREE.Vector2(0, v[a * 3 + 2]), new THREE.Vector2(len, v[b * 3 + 2]),
      new THREE.Vector2(len, v[c * 3 + 2]), new THREE.Vector2(0, v[d * 3 + 2]),
    ];
  },
};

function inRing(x: number, z: number, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i];
    const [xj, zj] = ring[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** a box of w × h × d with its base centre at (x, y, z), turned by `yaw` about y */
function boxAt(w: number, h: number, d: number, x: number, y: number, z: number, yaw = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  if (yaw) g.rotateY(yaw);
  g.translate(x, y, z);
  return g;
}

/** a vertical quad of w × h, centred at (x, y, z), facing the horizontal direction (nx, nz); uv rect optional */
function quad(w: number, h: number, x: number, y: number, z: number, nx: number, nz: number, uv?: [number, number, number, number]) {
  const g = new THREE.PlaneGeometry(w, h);
  if (uv) {
    const a = g.attributes.uv as THREE.BufferAttribute;
    // PlaneGeometry uv order: (0,1) (1,1) (0,0) (1,0)
    a.setXY(0, uv[0], uv[3]); a.setXY(1, uv[2], uv[3]); a.setXY(2, uv[0], uv[1]); a.setXY(3, uv[2], uv[1]);
  }
  g.rotateY(Math.atan2(nx, nz));
  g.translate(x, y, z);
  return g;
}

/**
 * A ribbon along a polyline as one triangle strip with mitred joints, at a height given per metre of run.
 * UVs are metres along (u) and across (v). Returns null for degenerate lines.
 */
function strip(line: number[][], w: number, yAt: (s: number, total: number) => number, across = 0) {
  const pts = line.filter((p, i) => i === 0 || Math.hypot(p[0] - line[i - 1][0], p[1] - line[i - 1][1]) > 0.05);
  if (pts.length < 2) return null;
  const n = pts.length;
  const total = pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  const pos = new Float32Array(n * 2 * 3);
  const uv = new Float32Array(n * 2 * 2);
  let s = 0;
  for (let i = 0; i < n; i++) {
    const [x, z] = pts[i];
    if (i) s += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    let dx = 0, dz = 0;
    if (i > 0) { dx += x - pts[i - 1][0]; dz += z - pts[i - 1][1]; }
    if (i < n - 1) { dx += pts[i + 1][0] - x; dz += pts[i + 1][1] - z; }
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len, nz = dx / len;
    // widen at the joint so the mitre keeps the ribbon's width
    let k = 1;
    if (i > 0 && i < n - 1) {
      const ax = x - pts[i - 1][0], az = z - pts[i - 1][1];
      const al = Math.hypot(ax, az) || 1;
      const cos = (ax / al) * (dx / len) + (az / al) * (dz / len);
      k = Math.min(2.5, 1 / Math.max(0.4, cos));
    }
    const y = yAt(s, total);
    const off = across;
    pos.set([x + nx * (w / 2 + off) * k, y, z + nz * (w / 2 + off) * k], i * 6);
    pos.set([x + nx * (-w / 2 + off) * k, y, z + nz * (-w / 2 + off) * k], i * 6 + 3);
    uv.set([s, 0, s, w], i * 4);
  }
  const idx: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // face up whichever way the line runs
  const nrm = g.attributes.normal as THREE.BufferAttribute;
  if (nrm.getY(0) < 0) {
    const ix = g.index!;
    for (let i = 0; i < ix.count; i += 3) {
      const t = ix.getX(i + 1);
      ix.setX(i + 1, ix.getX(i + 2));
      ix.setX(i + 2, t);
    }
    g.computeVertexNormals();
  }
  return g;
}

/** the polyline shifted sideways by `off` metres (left of its run) */
function shifted(line: number[][], off: number) {
  const out: number[][] = [];
  const n = line.length;
  for (let i = 0; i < n; i++) {
    const [x, z] = line[i];
    let dx = 0, dz = 0;
    if (i > 0) { dx += x - line[i - 1][0]; dz += z - line[i - 1][1]; }
    if (i < n - 1) { dx += line[i + 1][0] - x; dz += line[i + 1][1] - z; }
    const len = Math.hypot(dx, dz) || 1;
    out.push([x - (dz / len) * off, z + (dx / len) * off]);
  }
  return out;
}

function pathLength(line: number[][]) {
  let l = 0;
  for (let i = 1; i < line.length; i++) l += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
  return l;
}

/** point and unit direction at `s` metres along the line */
function along(line: number[][], s: number): [number, number, number, number] {
  let acc = 0;
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i];
    const [bx, bz] = line[i + 1];
    const seg = Math.hypot(bx - ax, bz - az);
    if (acc + seg >= s || i === line.length - 2) {
      const f = seg ? Math.min(1, Math.max(0, (s - acc) / seg)) : 0;
      return [ax + (bx - ax) * f, az + (bz - az) * f, (bx - ax) / (seg || 1), (bz - az) / (seg || 1)];
    }
    acc += seg;
  }
  return [line[0][0], line[0][1], 1, 0];
}

/* ------------------------------------------------------------------ ground */

function vnoise(x: number, z: number) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const h = (a: number, b: number) => {
    const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  return (h(ix, iz) * (1 - sx) + h(ix + 1, iz) * sx) * (1 - sz) + (h(ix, iz + 1) * (1 - sx) + h(ix + 1, iz + 1) * sx) * sz;
}

/** the ground disc, finer near the tower, coloured by two octaves of noise between lawn, meadow, scrub and bare earth */
function groundDisc() {
  const radii = [0, 25, 55, 90, 140, 200, 280, 380, 500, 650, 820, 1020, 1250, 1520, 1850, 2250, 2700, 3250, 3900, 4700, 5600, 6700, 8000, 9600, 11000, GROUND_RADIUS];
  const segs = 96;
  const pos: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  // Gandhinagar is green: lawn and scrub between the houses, meadow and fields beyond, bare earth only in patches
  const lawn = [0.46, 0.60, 0.30], meadow = [0.58, 0.64, 0.36], scrub = [0.36, 0.50, 0.26], earth = [0.66, 0.60, 0.46];
  const push = (x: number, z: number) => {
    pos.push(x, -0.06, z);
    uv.push(x, z);
    const n1 = vnoise(x / 260 + 3.7, z / 260 + 1.3);
    const n2 = vnoise(x / 900 + 11.1, z / 900 + 5.2);
    const n = n1 * 0.6 + n2 * 0.4;
    const d = Math.hypot(x - TOWER_X, z - TOWER_Z);
    // the town is lawn with worn patches, the country outside turns to meadow and scrub
    const rural = Math.min(1, Math.max(0, (d - 1500) / 2500));
    let c: number[];
    if (n < 0.3) c = rural > 0.5 ? scrub : earth;
    else if (n < 0.62) c = lawn;
    else if (n < 0.8) c = rural > 0.5 ? meadow : lawn;
    else c = scrub;
    const t = Math.min(1, Math.max(0, (n - 0.4) * 4));
    col.push(c[0] * (0.92 + t * 0.08), c[1] * (0.92 + t * 0.08), c[2] * (0.92 + t * 0.08));
  };
  push(TOWER_X, TOWER_Z);
  for (let r = 1; r < radii.length; r++) {
    for (let s = 0; s < segs; s++) {
      const a = (s / segs) * Math.PI * 2;
      push(TOWER_X + Math.cos(a) * radii[r], TOWER_Z + Math.sin(a) * radii[r]);
    }
  }
  const idx: number[] = [];
  for (let s = 0; s < segs; s++) idx.push(0, 1 + ((s + 1) % segs), 1 + s);
  for (let r = 1; r < radii.length - 1; r++) {
    const a0 = 1 + (r - 1) * segs, b0 = 1 + r * segs;
    for (let s = 0; s < segs; s++) {
      const s1 = (s + 1) % segs;
      idx.push(a0 + s, b0 + s1, b0 + s, a0 + s, a0 + s1, b0 + s1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  if ((g.attributes.normal as THREE.BufferAttribute).getY(0) < 0) {
    const ix = g.index!;
    for (let i = 0; i < ix.count; i += 3) {
      const t = ix.getX(i + 1);
      ix.setX(i + 1, ix.getX(i + 2));
      ix.setX(i + 2, t);
    }
    g.computeVertexNormals();
  }
  return g;
}

/* ------------------------------------------------------------------ obstacles */

/**
 * Where a tree or a wall may not stand: on the tower's plot, inside a building, on a street or in the water.
 * Footprints and street segments are bucketed into 60 m cells so thousands of placements stay quick.
 */
class Obstacles {
  private cell = 60;
  private buildings = new Map<string, number[][][]>();
  private segments = new Map<string, [number, number, number, number, number][]>();
  constructor(private data: CityData) {
    for (const list of [data.buildings, data.skyline]) {
      for (const b of list) {
        const xs = b.p.map((p) => p[0]);
        const zs = b.p.map((p) => p[1]);
        this.cells(Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs), (k) => {
          const l = this.buildings.get(k);
          if (l) l.push(b.p);
          else this.buildings.set(k, [b.p]);
        });
      }
    }
    for (const r of data.roads) {
      for (let i = 0; i < r.p.length - 1; i++) {
        const [ax, az] = r.p[i];
        const [bx, bz] = r.p[i + 1];
        const seg: [number, number, number, number, number] = [ax, az, bx, bz, r.w / 2 + 1.2];
        this.cells(Math.min(ax, bx) - seg[4], Math.min(az, bz) - seg[4], Math.max(ax, bx) + seg[4], Math.max(az, bz) + seg[4], (k) => {
          const l = this.segments.get(k);
          if (l) l.push(seg);
          else this.segments.set(k, [seg]);
        });
      }
    }
  }
  private cells(x1: number, z1: number, x2: number, z2: number, f: (k: string) => void) {
    for (let cx = Math.floor(x1 / this.cell); cx <= Math.floor(x2 / this.cell); cx++)
      for (let cz = Math.floor(z1 / this.cell); cz <= Math.floor(z2 / this.cell); cz++) f(`${cx},${cz}`);
  }
  inBuilding(x: number, z: number) {
    const k = `${Math.floor(x / this.cell)},${Math.floor(z / this.cell)}`;
    for (const ring of this.buildings.get(k) ?? []) if (inRing(x, z, ring)) return true;
    return false;
  }
  onRoad(x: number, z: number, extra = 0) {
    const k = `${Math.floor(x / this.cell)},${Math.floor(z / this.cell)}`;
    for (const [ax, az, bx, bz, r] of this.segments.get(k) ?? []) {
      const dx = bx - ax, dz = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
      if (Math.hypot(x - ax - dx * t, z - az - dz * t) < r + extra) return true;
    }
    return false;
  }
  inWater(x: number, z: number) {
    for (const w of this.data.water) if (inRing(x, z, w.p)) return true;
    return false;
  }
  blocked(x: number, z: number) {
    const [px1, pz1, px2, pz2] = this.data.plot;
    if (x > px1 && x < px2 && z > pz1 && z < pz2) return true;
    return this.inBuilding(x, z) || this.onRoad(x, z) || this.inWater(x, z);
  }
}

/** a thin rod from a to b (wires, grills, branches) */
function bar(ax: number, ay: number, az: number, bx: number, by: number, bz: number, r: number, sides = 4) {
  const len = Math.hypot(bx - ax, by - ay, bz - az);
  const g = new THREE.CylinderGeometry(r, r, len, sides, 1, true);
  g.translate(0, len / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(bx - ax, by - ay, bz - az).normalize());
  g.applyQuaternion(q);
  g.translate(ax, ay, az);
  return g;
}

/** a low hipped roof: the outline's edges run up to one apex over the centroid */
function hipRoof(ring: number[][], y: number, rise: number) {
  const [cx, cz] = centroid(ring);
  const pos: number[] = [];
  for (let i = 0; i < ring.length; i++) {
    const [ax, az] = ring[i];
    const [bx, bz] = ring[(i + 1) % ring.length];
    // wind each face so its normal points up: ((b - a) x (apex - a)).y
    const up = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
    if (up >= 0) pos.push(ax, y, az, bx, y, bz, cx, y + rise, cz);
    else pos.push(bx, y, bz, ax, y, az, cx, y + rise, cz);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  const uv = new Float32Array((pos.length / 3) * 2);
  for (let i = 0; i < pos.length / 3; i++) { uv[i * 2] = pos[i * 3] * 0.5; uv[i * 2 + 1] = pos[i * 3 + 2] * 0.5; }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/** the three parts of a parked vehicle (body, glass, tyres), posed at (x, z) heading `yaw` */
function vehicleParts(kind: "car" | "auto" | "bus", x: number, z: number, yaw: number): [THREE.BufferGeometry, THREE.BufferGeometry, THREE.BufferGeometry] {
  const geo = vehicleGeometry(kind);
  geo.deleteAttribute("color");
  const out: THREE.BufferGeometry[] = [];
  for (const grp of geo.groups) {
    const part = new THREE.BufferGeometry();
    for (const name of ["position", "normal", "uv"]) {
      const a = geo.attributes[name] as THREE.BufferAttribute;
      part.setAttribute(name, new THREE.BufferAttribute((a.array as Float32Array).slice(grp.start * a.itemSize, (grp.start + grp.count) * a.itemSize), a.itemSize));
    }
    part.rotateY(yaw);
    part.translate(x, 0, z);
    out.push(part);
  }
  geo.dispose();
  return out as [THREE.BufferGeometry, THREE.BufferGeometry, THREE.BufferGeometry];
}

/** a parked scooter: the two-wheeler every Kudasan household keeps by its gate */
function scooter(sb: StaticBuilder, x: number, z: number, yaw: number, colour: MatKey) {
  sb.add(boxAt(1.0, 0.36, 0.5, x, 0.55, z, yaw), colour);
  sb.add(boxAt(0.6, 0.12, 0.42, x - Math.cos(yaw) * 0.15, 0.9, z + Math.sin(yaw) * 0.15, yaw), "tyre");
  sb.add(boxAt(0.5, 0.5, 0.3, x + Math.cos(yaw) * 0.55, 0.45, z - Math.sin(yaw) * 0.55, yaw), colour);
  for (const f of [0.7, -0.65]) {
    const w = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 8);
    w.rotateX(Math.PI / 2);
    w.rotateY(yaw);
    w.translate(x + Math.cos(yaw) * f, 0.25, z - Math.sin(yaw) * f);
    sb.add(w, "tyre");
  }
}

/* ------------------------------------------------------------------ trees */

/** one cluster of foliage: vertical leaf cards crossed at 60°, and one laid flat so the canopy reads from above */
function canopy(sb: StaticBuilder, x: number, y: number, z: number, r: number, cards: number, mat: MatKey, spin: number) {
  for (let i = 0; i < cards; i++) {
    const a = spin + (i * Math.PI) / cards;
    const g = new THREE.PlaneGeometry(r * 2, r * 1.7);
    g.rotateY(a);
    g.translate(x, y, z);
    sb.add(g, mat);
  }
  const top = new THREE.PlaneGeometry(r * 2, r * 2);
  top.rotateX(-Math.PI / 2);
  top.rotateY(spin);
  top.translate(x, y + r * 0.35, z);
  sb.add(top, mat);
}

/** a neem or gulmohar: a forked trunk with five clusters near the tower, two further out, a card pair far off */
export function tree(sb: StaticBuilder, x: number, z: number, s: number, tier: 0 | 1 | 2, rnd: () => number) {
  const mat: MatKey = rnd() < 0.6 ? "leafCard" : "leafCardB";
  const spin = rnd() * Math.PI;
  if (tier < 2) {
    const trunk = new THREE.CylinderGeometry(0.16 * s, 0.3 * s, 3.4 * s, tier === 0 ? 7 : 4, 1, true);
    trunk.translate(x, 1.7 * s, z);
    sb.add(trunk, "bark");
  }
  if (tier === 0) {
    // three limbs fork off the trunk, each carrying a cluster, with two more filling the crown
    const limbs: [number, number, number][] = [];
    for (let i = 0; i < 3; i++) {
      const a = spin + i * 2.1 + rnd() * 0.5;
      const lx = x + Math.cos(a) * 1.5 * s, lz = z + Math.sin(a) * 1.5 * s, ly = (4.6 + rnd() * 1.2) * s;
      sb.add(bar(x, 3.2 * s, z, lx, ly, lz, 0.09 * s, 5), "bark");
      limbs.push([lx, ly, lz]);
    }
    for (const [lx, ly, lz] of limbs) canopy(sb, lx, ly + 0.6 * s, lz, (2.0 + rnd() * 0.5) * s, 3, mat, rnd() * Math.PI);
    canopy(sb, x, 6.3 * s, z, 2.4 * s, 3, mat, spin + 0.9);
    canopy(sb, x + (rnd() - 0.5) * s, 5.0 * s, z + (rnd() - 0.5) * s, 2.8 * s, 3, mat, spin + 2.2);
  } else if (tier === 1) {
    canopy(sb, x, 5.0 * s, z, 3.1 * s, 3, mat, spin);
    canopy(sb, x + 1.2 * s, 5.8 * s, z - 0.6 * s, 2.0 * s, 2, mat, spin + 1.3);
  } else {
    canopy(sb, x, 4.2 * s, z, 3.4 * s, 2, mat, spin);
  }
}

/** a royal palm: a tall slim trunk with a crown of fronds */
function palm(sb: StaticBuilder, x: number, z: number, s: number, rnd: () => number) {
  const h = 7 * s;
  const trunk = new THREE.CylinderGeometry(0.14 * s, 0.22 * s, h, 5, 1, true);
  trunk.translate(x, h / 2, z);
  sb.add(trunk, "bark");
  const fronds = 7;
  const spin = rnd() * Math.PI;
  for (let i = 0; i < fronds; i++) {
    const a = spin + (i * Math.PI * 2) / fronds;
    const g = new THREE.PlaneGeometry(3.2 * s, 0.9 * s);
    g.translate(1.6 * s, 0, 0);
    g.rotateZ(-0.55);
    g.rotateY(a);
    g.translate(x, h, z);
    sb.add(g, "palmFrond");
  }
}

/* ------------------------------------------------------------------ buildings */

const WALLS: MatKey[] = ["wallCream", "wallCream", "wallBeige", "wallWhite", "wallWhite", "wallGrey", "wallOchre", "wallRose"];
const FACADES: MatKey[] = ["facadeA", "facadeB", "facadeC", "facadeD"];
const FAR: MatKey[] = ["farBlock", "farBlockB", "farBlockC"];

/** does the ring run clockwise when seen from above (x east, z south)? decides which way its edges face */
function clockwise(ring: number[][]) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, z1] = ring[i];
    const [x2, z2] = ring[(i + 1) % ring.length];
    a += (x2 - x1) * (z2 + z1);
  }
  return a > 0;
}

/** outward unit normal of edge i of the ring, in plan: the perpendicular that points away from the centroid */
function edgeNormal(ring: number[][], i: number, _cw: boolean): [number, number] {
  const [ax, az] = ring[i];
  const [bx, bz] = ring[(i + 1) % ring.length];
  const len = Math.hypot(bx - ax, bz - az) || 1;
  const nx = (bz - az) / len, nz = -(bx - ax) / len;
  const [cx, cz] = centroid(ring);
  const out = ((ax + bx) / 2 - cx) * nx + ((az + bz) / 2 - cz) * nz;
  return out >= 0 ? [nx, nz] : [-nx, -nz];
}

/**
 * A near-ring house or apartment block as Kudasan builds them: a painted RCC frame on a concrete plinth with
 * its columns showing at the corners, a window per 3 m bay with a projecting frame, sill, sunshade (chhajja)
 * and, low down, a safety grill; half-wall balconies with railings on the longer sides; AC units; drain pipes
 * down the corners; a parapet with coping round the flat roof, the stair head, black water tanks, a solar
 * heater and a dish. The bigger blocks stand on stilt parking; the small bungalows get a clay-tiled hip roof
 * or a porch over the door; the shops a shutter.
 */
function nearBlock(sb: StaticBuilder, ring: number[][], h: number, cls: string | undefined, d: number, rnd: () => number) {
  const wall = WALLS[Math.floor(rnd() * WALLS.length)];
  const trim: MatKey = rnd() < 0.55 ? "parapet" : "windowFrame";
  const floors = Math.max(1, Math.round(h / STOREY));
  const cw = clockwise(ring);
  const residential = !cls;
  const close = d < 200;
  const a = area(ring);
  const small = residential && a < 190 && floors <= 2;
  const tiled = small && rnd() < 0.4;
  const stilts = residential && !small && floors >= 4 && a > 150 && rnd() < 0.5;
  const yaw = (nx: number, nz: number) => Math.atan2(nx, nz);
  // the body: walls from the plinth (or from above the open parking), the roof slab, parapet and coping
  const gf = stilts ? STOREY : 0;
  sb.add(extrude(ring, h - gf, gf), wall);
  sb.add(flat(ring, h + 0.03), "roofGrey");
  sb.add(extrude(offset(ring, 0.06), 0.6), "concrete");
  if (!tiled) {
    sb.add(extrude(ring, 0.9, h, offset(ring, -0.22)), "parapet");
    sb.add(extrude(offset(ring, 0.07), 0.08, h + 0.9, offset(ring, -0.29)), trim);
  } else {
    sb.add(hipRoof(offset(ring, 0.55), h + 0.1, 1.2 + Math.sqrt(a) * 0.12), "roofTile");
    sb.add(extrude(offset(ring, 0.55), 0.14, h - 0.02, ring), trim);
  }
  if (stilts) {
    sb.add(extrude(offset(ring, -0.7), STOREY), "stiltDark");
    sb.add(extrude(offset(ring, 0.1), 0.16, STOREY - 0.16, offset(ring, -0.75)), trim);
  }
  // the frame's columns at the corners
  const [ccx, ccz] = centroid(ring);
  if (stilts || rnd() < 0.55) {
    for (const [vx, vz] of ring) {
      const dx = vx - ccx, dz = vz - ccz, dl = Math.hypot(dx, dz) || 1;
      sb.add(boxAt(0.44, stilts ? STOREY : h, 0.44, vx + (dx / dl) * 0.06, 0, vz + (dz / dl) * 0.06), stilts ? "concrete" : trim);
    }
  }
  // this building's window proportions and its slab line
  const winW = 1.1 + rnd() * 0.5, winH = 1.2 + rnd() * 0.35;
  if (rnd() < 0.7) {
    const lip = offset(ring, 0.12);
    for (let f = Math.max(1, stilts ? 2 : 1); f < floors; f++) sb.add(extrude(lip, 0.14, f * STOREY - 0.14, ring), rnd() < 0.5 ? "parapet" : wall);
  }
  if (!residential) sb.add(extrude(offset(ring, 0.05), 3.0), "shopGlass");
  let longest = 0, longestLen = 0;
  for (let i = 0; i < ring.length; i++) {
    const [ax, az] = ring[i];
    const [bx, bz] = ring[(i + 1) % ring.length];
    const len = Math.hypot(bx - ax, bz - az);
    if (len > longestLen) { longestLen = len; longest = i; }
    if (len < 2.6) continue;
    const [nx, nz] = edgeNormal(ring, i, cw);
    const ux = (bx - ax) / len, uz = (bz - az) / len;
    const bays = Math.max(1, Math.floor(len / 3));
    const step = len / bays;
    const balconies = residential && len >= 7 && floors >= 3 && rnd() < 0.8;
    for (let b = 0; b < bays; b++) {
      const t = (b + 0.5) * step;
      const x = ax + ux * t, z = az + uz * t;
      const balcony = balconies && b % 2 === 1;
      for (let f = 0; f < floors; f++) {
        const y0 = f * STOREY;
        if (f === 0 && stilts) {
          // a column per bay in front of the dark of the parking
          if (b < bays - 1) sb.add(boxAt(0.4, STOREY, 0.4, x + ux * (step / 2) - nx * 0.15, 0, z + uz * (step / 2) - nz * 0.15), "concrete");
          continue;
        }
        if (f === 0 && !residential && close && rnd() < 0.4) {
          // a rolled-down shutter on part of the shop front
          const sw = Math.min(2.6, step - 0.4);
          sb.add(quad(sw, 2.4, x + nx * 0.09, 1.25, z + nz * 0.09, nx, nz), "shutter");
          for (let r = 0.2; r < 2.4; r += 0.2) sb.add(boxAt(sw, 0.02, 0.03, x + nx * 0.1, r, z + nz * 0.1, yaw(nx, nz)), "pipe");
          continue;
        }
        if (f === 0 && residential && rnd() < 0.45) continue; // ground floors: parking, entrances, blank walls
        if (balcony && f > 0) {
          // a balcony 2.4 m wide, 1 m deep: slab, half wall, railing, the door onto it, and a sunshade over
          const bw = Math.min(2.4, step - 0.4);
          const by = yaw(nx, nz);
          sb.add(boxAt(bw + 0.2, 0.14, 1.05, x + nx * 0.52, y0 - 0.14, z + nz * 0.52, by), "parapet");
          sb.add(boxAt(bw, 0.5, 0.08, x + nx * 0.96, y0, z + nz * 0.96, by), wall);
          sb.add(boxAt(0.08, 0.5, 1.0, x + nx * 0.5 + ux * (bw / 2), y0, z + nz * 0.5 + uz * (bw / 2), by), wall);
          sb.add(boxAt(0.08, 0.5, 1.0, x + nx * 0.5 - ux * (bw / 2), y0, z + nz * 0.5 - uz * (bw / 2), by), wall);
          sb.add(boxAt(bw, 0.05, 0.05, x + nx * 0.96, y0 + 1.0, z + nz * 0.96, by), "balconyRail");
          if (close) {
            const bars = Math.round(bw / 0.16);
            for (let k = 1; k < bars; k++) {
              const o = -bw / 2 + (bw * k) / bars;
              sb.add(boxAt(0.025, 0.5, 0.025, x + nx * 0.96 + ux * o, y0 + 0.5, z + nz * 0.96 + uz * o, by), "balconyRail");
            }
            sb.add(boxAt(0.05, 0.5, 0.05, x + nx * 0.96 + ux * (bw / 2), y0 + 0.5, z + nz * 0.96 + uz * (bw / 2), by), "balconyRail");
            sb.add(boxAt(0.05, 0.5, 0.05, x + nx * 0.96 - ux * (bw / 2), y0 + 0.5, z + nz * 0.96 - uz * (bw / 2), by), "balconyRail");
          }
          sb.add(quad(1.4, 2.2, x + nx * 0.03, y0 + 1.1, z + nz * 0.03, nx, nz), "windowGlass");
          sb.add(boxAt(0.08, 2.2, 0.1, x + nx * 0.04 + ux * 0.72, y0, z + nz * 0.04 + uz * 0.72, by), trim);
          sb.add(boxAt(0.08, 2.2, 0.1, x + nx * 0.04 - ux * 0.72, y0, z + nz * 0.04 - uz * 0.72, by), trim);
          sb.add(boxAt(1.56, 0.08, 0.1, x + nx * 0.04, y0 + 2.2, z + nz * 0.04, by), trim);
          if (f === floors - 1) sb.add(boxAt(bw + 0.4, 0.1, 1.2, x + nx * 0.6, y0 + 2.75, z + nz * 0.6, by), trim);
          continue;
        }
        const ww = Math.min(winW, step - 0.6);
        const wy = y0 + 0.95;
        const by = yaw(nx, nz);
        sb.add(quad(ww - 0.1, winH - 0.1, x + nx * 0.02, wy + winH / 2, z + nz * 0.02, nx, nz), "windowGlass");
        // the projecting frame: jambs, head and the mullion down the middle
        sb.add(boxAt(0.08, winH, 0.1, x + nx * 0.05 + ux * (ww / 2), wy, z + nz * 0.05 + uz * (ww / 2), by), trim);
        sb.add(boxAt(0.08, winH, 0.1, x + nx * 0.05 - ux * (ww / 2), wy, z + nz * 0.05 - uz * (ww / 2), by), trim);
        sb.add(boxAt(ww + 0.08, 0.08, 0.1, x + nx * 0.05, wy + winH - 0.08, z + nz * 0.05, by), trim);
        sb.add(boxAt(0.05, winH, 0.06, x + nx * 0.04, wy, z + nz * 0.04, by), trim);
        // sill and sunshade
        sb.add(boxAt(ww + 0.3, 0.07, 0.2, x + nx * 0.1, wy - 0.07, z + nz * 0.1, by), "concrete");
        sb.add(boxAt(ww + 0.5, 0.1, 0.5, x + nx * 0.25, wy + winH + 0.02, z + nz * 0.25, by), trim);
        // a grill on the lower windows, an AC unit on some
        if (close && f <= 1) {
          const bars = Math.round(ww / 0.14);
          for (let k = 1; k < bars; k++) {
            const o = -ww / 2 + (ww * k) / bars;
            sb.add(boxAt(0.02, winH - 0.1, 0.02, x + nx * 0.08 + ux * o, wy + 0.05, z + nz * 0.08 + uz * o, by), "grill");
          }
          sb.add(boxAt(ww, 0.02, 0.02, x + nx * 0.08, wy + winH / 2, z + nz * 0.08, by), "grill");
        }
        if (close && rnd() < 0.3) sb.add(boxAt(0.8, 0.55, 0.3, x + nx * 0.16 + ux * (ww / 2 + 0.5), wy - 0.6, z + nz * 0.16 + uz * (ww / 2 + 0.5), by), "acUnit");
      }
    }
  }
  // a porch over the front door of the bungalows and small blocks, on the longest side
  if (residential && !stilts && floors <= 3 && longestLen >= 6) {
    const [ax, az] = ring[longest];
    const [bx, bz] = ring[(longest + 1) % ring.length];
    const [nx, nz] = edgeNormal(ring, longest, cw);
    const ux = (bx - ax) / longestLen, uz = (bz - az) / longestLen;
    const t = longestLen * (0.35 + rnd() * 0.3);
    const x = ax + ux * t, z = az + uz * t;
    const by = yaw(nx, nz);
    sb.add(boxAt(2.8, 0.15, 1.6, x + nx * 0.8, 2.75, z + nz * 0.8, by), trim);
    for (const o of [-1.2, 1.2]) sb.add(boxAt(0.25, 2.75, 0.25, x + nx * 1.45 + ux * o, 0, z + nz * 1.45 + uz * o, by), trim);
    sb.add(boxAt(2.2, 0.16, 0.9, x + nx * 0.45, 0.0, z + nz * 0.45, by), "concrete");
    sb.add(boxAt(2.2, 0.16, 0.5, x + nx * 0.25, 0.16, z + nz * 0.25, by), "concrete");
    sb.add(quad(1.1, 2.1, x + nx * 0.03, 1.05 + 0.32, z + nz * 0.03, nx, nz), "darkPlank");
  }
  // drain pipes down two corners
  if (close) {
    for (let k = 0; k < 2; k++) {
      const [vx, vz] = ring[Math.floor(rnd() * ring.length)];
      const dx = vx - ccx, dz = vz - ccz, dl = Math.hypot(dx, dz) || 1;
      const px = vx + (dx / dl) * 0.3, pz = vz + (dz / dl) * 0.3;
      sb.add(bar(px, 0.3, pz, px, h + 0.9, pz, 0.06, 6), "pipe");
    }
  }
  // the roof: stair head with its door, tanks on stands, a solar heater, a dish
  if (a > 90 && !tiled) {
    const sx = ccx + (rnd() - 0.5) * 2;
    const sz = ccz + (rnd() - 0.5) * 2;
    sb.add(boxAt(2.6, 2.5, 2.8, sx, h, sz), wall);
    sb.add(boxAt(2.9, 0.12, 3.1, sx, h + 2.5, sz), "parapet");
    sb.add(quad(0.9, 2.0, sx, h + 1.0, sz + 1.41, 0, 1), "darkPlank");
    const tanks = a > 320 ? 3 : a > 160 ? 2 : 1;
    for (let t = 0; t < tanks; t++) {
      const tx = sx + 2.3 + t * 1.5;
      const tank = new THREE.CylinderGeometry(0.62, 0.62, 1.1, 10);
      tank.translate(tx, h + 1.0, sz - 0.6);
      sb.add(tank, "tank");
      sb.add(boxAt(1.4, 0.45, 1.4, tx, h, sz - 0.6), "parapet");
    }
    if (close && rnd() < 0.45) {
      const panel = new THREE.BoxGeometry(2.0, 0.08, 1.2);
      panel.rotateX(-0.45);
      panel.translate(sx - 2.4, h + 0.9, sz + 1.2);
      sb.add(panel, "windowGlass");
      sb.add(boxAt(0.1, 0.9, 1.2, sx - 2.4, h, sz + 1.2), "balconyRail");
    }
    if (close && rnd() < 0.5) {
      const dish = new THREE.CylinderGeometry(0.45, 0.45, 0.05, 10);
      dish.rotateX(-1.0);
      dish.translate(sx - 1.0, h + 1.6, sz - 1.6);
      sb.add(dish, "acUnit");
      sb.add(bar(sx - 1.0, h, sz - 1.6, sx - 1.0, h + 1.5, sz - 1.6, 0.03, 4), "pipe");
    }
  }
}

/** a mid-ring block: the painted facade texture with one window per bay, parapet, tanks */
function midBlock(sb: StaticBuilder, ring: number[][], h: number, rnd: () => number) {
  sb.add(extrude(ring, h), FACADES[Math.floor(rnd() * FACADES.length)]);
  sb.add(flat(ring, h + 0.03), "roofGrey");
  sb.add(extrude(ring, 0.9, h, offset(ring, -0.22)), "parapet");
  if (area(ring) > 160 && rnd() < 0.7) {
    const [cx, cz] = centroid(ring);
    sb.add(boxAt(2.4, 2.4, 2.6, cx, h, cz), "parapet");
    const tank = new THREE.CylinderGeometry(0.62, 0.62, 1.1, 8);
    tank.translate(cx + 2.2, h + 0.95, cz - 0.4);
    sb.add(tank, "tank");
  }
}

/** a tower: concrete frame with a glass band per storey (near and mid); plain beyond */
function towerBlock(sb: StaticBuilder, ring: number[][], h: number, d: number) {
  sb.add(extrude(ring, h), "concrete");
  sb.add(flat(ring, h + 0.03), "roofGrey");
  if (d < MID) {
    sb.add(extrude(ring, 1.1, h, offset(ring, -0.25)), "parapet");
    for (let y = STOREY; y < h - 1; y += STOREY) {
      const band = extrude(ring, 1.5);
      band.scale(1.004, 1, 1.004);
      band.translate(0, y, 0);
      sb.add(band, "towerGlass");
    }
  }
}

/* ------------------------------------------------------------------ the city */

export function buildCity(sb: StaticBuilder) {
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const dist = (x: number, z: number) => Math.hypot(x - TOWER_X, z - TOWER_Z);
  const obstacles = new Obstacles(CITY);

  // ---- ground: dust and scrub to the horizon, its large-scale tones (bare plots, straw grass, darker
  // scrub, grey hardstanding) in the vertex colours, the fine grain in the texture
  sb.add(groundDisc(), "ground");
  const GREEN_MAT: Record<string, MatKey> = { park: "park", grass: "park", garden: "grass", pitch: "pitch", farm: "farm", forest: "park", scrub: "scrub", dirt: "dirt", urban: "urban" };
  // built-up land first (the dusty ground between the houses), the greens and fields on top of it
  for (const g of CITY.greens) if (g.k === "urban") sb.add(flat(g.p, -0.04), "urban");
  for (const g of CITY.greens) if (g.k !== "urban") sb.add(flat(g.p, -0.02), GREEN_MAT[g.k] ?? "park");
  for (const w of CITY.water) sb.add(flat(w.p, -0.03), w.k === "river" || w.k === "canal" ? "river" : "lake");

  // ---- streets: ribbons with mitred joints; bridges rise onto a deck on piers
  const deck = (s: number, total: number) => Math.min(5.5, s / 7, (total - s) / 7, total / 14);
  for (const r of CITY.roads) {
    const [cx, cz] = centroid(r.p);
    const d = dist(cx, cz);
    if (r.b) {
      const top = strip(r.p, r.w + 1.0, (s, t) => deck(s, t) + 0.3);
      if (top) sb.add(top, "asphalt");
      const under = strip(r.p, r.w + 1.4, (s, t) => deck(s, t) - 0.5);
      if (under) sb.add(under, "bridgeConcrete");
      for (const side of [1, -1]) {
        const rail = strip(shifted(r.p, side * (r.w / 2 + 0.3)), 0.35, (s, t) => deck(s, t) + 1.3);
        if (rail) sb.add(rail, "bridgeConcrete");
      }
      const total = pathLength(r.p);
      for (let s = 12; s < total - 12; s += 22) {
        const [x, z, ux, uz] = along(r.p, s);
        const hgt = deck(s, total) - 0.5;
        if (hgt > 1.5) sb.add(boxAt(1.4, hgt, r.w * 0.7, x, 0, z, Math.atan2(ux, uz) + Math.PI / 2), "bridgeConcrete");
      }
      continue;
    }
    const road = strip(r.p, r.w, () => 0.0);
    if (road) sb.add(road, "asphalt");
    if (d > MID) continue;
    if (r.w >= 9) {
      const line = strip(r.p, 0.3, () => 0.02);
      if (line) sb.add(line, "roadLine");
    }
    if (d > 650) continue;
    if (r.w >= 9) {
      // kerbs and paved footpaths both sides; a planted median on the wide roads
      for (const side of [1, -1]) {
        const kerb = strip(shifted(r.p, side * (r.w / 2 + 0.2)), 0.4, () => 0.12);
        if (kerb) sb.add(kerb, "kerb");
        const path = strip(shifted(r.p, side * (r.w / 2 + 1.3)), 1.8, () => 0.1);
        if (path) sb.add(path, "paver");
      }
      if (r.w >= 14) {
        const median = strip(r.p, 1.2, () => 0.3);
        if (median) sb.add(median, "divider");
        const kerbM = strip(r.p, 1.5, () => 0.14);
        if (kerbM) sb.add(kerbM, "kerb");
      }
      // lamp posts every 32 m, alternating sides
      const total = pathLength(r.p);
      let side = 1;
      for (let s = 10; s < total - 6; s += 32, side = -side) {
        const [x, z, ux, uz] = along(r.p, s);
        const px = x - uz * side * (r.w / 2 + 0.9), pz = z + ux * side * (r.w / 2 + 0.9);
        const pole = new THREE.CylinderGeometry(0.1, 0.14, 9, 5);
        pole.translate(px, 4.5, pz);
        sb.add(pole, "streetLight");
        sb.add(boxAt(0.12, 0.12, 2.2, px + uz * side * 1.1, 8.8, pz - ux * side * 1.1, Math.atan2(uz, ux) + Math.PI / 2), "streetLight");
        sb.add(boxAt(0.6, 0.18, 0.3, px + uz * side * 2.0, 8.75, pz - ux * side * 2.0, Math.atan2(uz, ux) + Math.PI / 2), "windowFrame");
      }
    }
    // compound walls along the quieter streets, with gateways
    if (d < 450 && r.w <= 12) {
      const total = pathLength(r.p);
      for (const side of [1, -1]) {
        const off = side * (r.w / 2 + 2.8);
        for (let s = 0; s < total - 2; s += 8) {
          const piece = Math.min(8, total - s);
          if (Math.floor(s / 8) % 5 === 4 && rnd() < 0.6) continue; // a gateway now and then
          const [x, z, ux, uz] = along(r.p, s + piece / 2);
          const wx = x - uz * off, wz = z + ux * off;
          if (obstacles.inBuilding(wx, wz) || obstacles.onRoad(wx, wz, -r.w / 2 + 1.2) || obstacles.inWater(wx, wz)) continue;
          sb.add(boxAt(piece - 0.1, 1.6, 0.23, wx, 0, wz, Math.atan2(ux, uz)), "compoundWall");
          if (rnd() < 0.5) sb.add(boxAt(0.35, 1.9, 0.35, wx + ux * (piece / 2 - 0.1), 0, wz + uz * (piece / 2 - 0.1)), "compoundWall");
        }
      }
    }
  }

  // ---- street life near the tower: overhead lines on concrete poles, parked cars, scooters and autos,
  // hoardings and bus shelters along the main roads
  const parkedKinds = ["car", "car", "car", "auto"] as const;
  for (const r of CITY.roads) {
    if (r.b) continue;
    const [rcx, rcz] = centroid(r.p);
    const d = dist(rcx, rcz);
    if (d > 650) continue;
    const total = pathLength(r.p);
    // the power lines: poles every 26 m on the side the lamps are not, three sagging wires between them
    if (r.w <= 12 && d < 500) {
      let prev: [number, number] | null = null;
      for (let s = 4; s < total; s += 26) {
        const [x, z, ux, uz] = along(r.p, s);
        const px = x + uz * (r.w / 2 + 1.1), pz = z - ux * (r.w / 2 + 1.1);
        if (obstacles.inBuilding(px, pz)) { prev = null; continue; }
        sb.add(boxAt(0.22, 8.4, 0.22, px, 0, pz), "pole");
        sb.add(boxAt(0.1, 0.1, 1.3, px, 7.9, pz, Math.atan2(uz, ux) + Math.PI / 2), "pole");
        if (prev) {
          for (const o of [-0.55, 0, 0.55]) {
            const ax = prev[0] - uz * o, az = prev[1] + ux * o, bx = px - uz * o, bz = pz + ux * o;
            let lx = ax, ly = 8.0, lz = az;
            for (let k = 1; k <= 5; k++) {
              const t = k / 5;
              const wx = ax + (bx - ax) * t, wz = az + (bz - az) * t, wy = 8.0 - Math.sin(t * Math.PI) * 0.55;
              sb.add(bar(lx, ly, lz, wx, wy, wz, 0.014, 3), "wire");
              lx = wx; ly = wy; lz = wz;
            }
          }
        }
        prev = [px, pz];
      }
    }
    // parked vehicles along the kerb
    if (r.w >= 6 && d < 420) {
      for (let s = 8; s < total - 6; s += 15) {
        if (rnd() < 0.6) continue;
        const [x, z, ux, uz] = along(r.p, s);
        const side = rnd() < 0.5 ? 1 : -1;
        const px = x - uz * side * (r.w / 2 - 1.3), pz = z + ux * side * (r.w / 2 - 1.3);
        if (obstacles.inBuilding(px, pz) || obstacles.inWater(px, pz)) continue;
        const kind = parkedKinds[Math.floor(rnd() * parkedKinds.length)];
        const [body, glass, tyres] = vehicleParts(kind, px, pz, Math.atan2(-uz, ux) + (side > 0 ? Math.PI : 0) + (rnd() - 0.5) * 0.1);
        sb.add(body, kind === "auto" ? (rnd() < 0.7 ? "carYellow" : "carBlack") : CAR_COLOURS[Math.floor(rnd() * CAR_COLOURS.length)]);
        sb.add(glass, "carGlass");
        sb.add(tyres, "tyre");
      }
      // scooters by the gates
      for (let s = 3; s < total - 3; s += 9) {
        if (rnd() < 0.55) continue;
        const [x, z, ux, uz] = along(r.p, s);
        const side = rnd() < 0.5 ? 1 : -1;
        const off = side * (r.w / 2 + (r.w >= 9 ? 2.2 : 0.9));
        const px = x - uz * off, pz = z + ux * off;
        if (obstacles.inBuilding(px, pz) || obstacles.inWater(px, pz)) continue;
        scooter(sb, px, pz, Math.atan2(-uz, ux) + (rnd() - 0.5) * 0.6, (["carBlack", "carBlack", "carRed", "carSilver", "carBlue"] as MatKey[])[Math.floor(rnd() * 5)]);
      }
    }
    // hoardings and bus shelters on the main roads
    if (r.w >= 9) {
      for (let s = 60; s < total - 20; s += 170) {
        const [x, z, ux, uz] = along(r.p, s);
        const side = rnd() < 0.5 ? 1 : -1;
        const off = side * (r.w / 2 + 4.5);
        const hx = x - uz * off, hz = z + ux * off;
        if (obstacles.inBuilding(hx, hz) || obstacles.inWater(hx, hz)) continue;
        const nx = uz * side, nz = -ux * side; // facing the road
        const sy = 6 + rnd() * 3;
        sb.add(quad(8, 3, hx + nx * 0.05, sy + 1.5, hz + nz * 0.05, nx, nz, signUV(Math.floor(rnd() * 128))), "shopSign");
        sb.add(boxAt(8.2, 3.2, 0.1, hx, sy - 0.1, hz, Math.atan2(nx, nz)), "parapet");
        for (const o of [-2.5, 2.5]) sb.add(boxAt(0.3, sy, 0.3, hx + ux * o, 0, hz + uz * o), "streetLight");
      }
      if (d < 600) {
        for (let s = 110; s < total - 10; s += 260) {
          const [x, z, ux, uz] = along(r.p, s);
          const side = rnd() < 0.5 ? 1 : -1;
          const off = side * (r.w / 2 + 2.2);
          const bx = x - uz * off, bz = z + ux * off;
          if (obstacles.inBuilding(bx, bz)) continue;
          const by = Math.atan2(ux, uz);
          sb.add(boxAt(4.2, 0.12, 1.8, bx, 2.7, bz, by), "roofGrey");
          sb.add(boxAt(4.2, 1.6, 0.06, bx - uz * side * 0.85, 1.1, bz + ux * side * 0.85, by), "shopGlass");
          sb.add(boxAt(3.6, 0.08, 0.5, bx - uz * side * 0.5, 0.5, bz + ux * side * 0.5, by), "balconyRail");
          for (const o of [-1.9, 1.9]) sb.add(boxAt(0.12, 2.7, 0.12, bx + ux * o, 0, bz + uz * o), "streetLight");
        }
      }
    }
  }
  // autos waiting outside the shops
  for (const poi of SIGNED) {
    if (poi.d > 500 || rnd() < 0.5) continue;
    const px = poi.x + (rnd() - 0.5) * 6, pz = poi.y + 7 + rnd() * 3;
    if (obstacles.inBuilding(px, pz) || obstacles.inWater(px, pz)) continue;
    const [body, glass, tyres] = vehicleParts("auto", px, pz, rnd() * Math.PI * 2);
    sb.add(body, rnd() < 0.7 ? "carYellow" : "carBlack");
    sb.add(glass, "carGlass");
    sb.add(tyres, "tyre");
  }

  // ---- buildings of the near ring
  const signed = new Map<number, number[]>();
  SIGNED.forEach((p, i) => {
    const list = signed.get(p.b!) ?? [];
    list.push(i);
    signed.set(p.b!, list);
  });
  CITY.buildings.forEach((b, bi) => {
    const h = Math.max(STOREY + 1, b.h);
    const [cx, cz] = centroid(b.p);
    const d = dist(cx, cz);
    if (b.k === "tower") towerBlock(sb, b.p, h, d);
    else if (d < NEAR) nearBlock(sb, b.p, h, b.c, d, rnd);
    else if (d < MID) midBlock(sb, b.p, h, rnd);
    else {
      sb.add(extrude(b.p, h), FACADES[Math.floor(rnd() * FACADES.length)]);
      sb.add(flat(b.p, h + 0.03), "roofGrey");
    }
    // shopfronts: the map's named places, a signboard above a glazed ground floor on the side they stand on
    const signs = signed.get(bi);
    if (signs && d < 750) {
      const cw = clockwise(b.p);
      for (const si of signs) {
        const poi = SIGNED[si];
        let best = 0, bestD = Infinity;
        for (let i = 0; i < b.p.length; i++) {
          const [ax, az] = b.p[i];
          const [bx, bz] = b.p[(i + 1) % b.p.length];
          const len = Math.hypot(bx - ax, bz - az);
          if (len < 3) continue;
          const t = Math.max(0, Math.min(1, ((poi.x - ax) * (bx - ax) + (poi.y - az) * (bz - az)) / (len * len)));
          const dd = Math.hypot(poi.x - ax - (bx - ax) * t, poi.y - az - (bz - az) * t);
          if (dd < bestD) { bestD = dd; best = i; }
        }
        const [ax, az] = b.p[best];
        const [bx, bz] = b.p[(best + 1) % b.p.length];
        const len = Math.hypot(bx - ax, bz - az);
        const [nx, nz] = edgeNormal(b.p, best, cw);
        const ux = (bx - ax) / len, uz = (bz - az) / len;
        const sw = Math.min(6, len - 0.6);
        const t = Math.max(sw / 2 + 0.3, Math.min(len - sw / 2 - 0.3, ((poi.x - ax) * ux + (poi.y - az) * uz)));
        const x = ax + ux * t, z = az + uz * t;
        sb.add(quad(sw, 0.9, x + nx * 0.1, 3.45, z + nz * 0.1, nx, nz, signUV(si)), "shopSign");
        sb.add(quad(sw, 2.5, x + nx * 0.04, 1.6, z + nz * 0.04, nx, nz), "shopGlass");
        if (rnd() < 0.5) {
          const awning = new THREE.PlaneGeometry(sw, 1.1);
          awning.rotateX(-Math.PI / 2 + 0.35);
          awning.rotateY(Math.atan2(nx, nz));
          awning.translate(x + nx * 0.6, 2.85, z + nz * 0.6);
          sb.add(awning, "awning");
        }
      }
    }
  });

  // ---- the skyline beyond: plain massing in three tones, the landmark towers in concrete and glass
  for (const b of CITY.skyline) {
    const h = Math.max(6, b.h);
    if (b.k === "landmark") {
      sb.add(extrude(b.p, h), "concrete");
      sb.add(flat(b.p, h + 0.03), "roofGrey");
      const glass = extrude(b.p, h * 0.9, h * 0.05);
      glass.scale(1.002, 1, 1.002);
      sb.add(glass, "towerGlass");
    } else {
      sb.add(extrude(b.p, h), FAR[Math.floor(rnd() * FAR.length)]);
      sb.add(flat(b.p, h + 0.03), "roofGrey");
    }
  }

  // ---- trees
  const planted: [number, number][] = [];
  const plant = (x: number, z: number, s: number, limit = CITY_RADIUS) => {
    const d = dist(x, z);
    if (d > limit || obstacles.blocked(x, z)) return false;
    tree(sb, x, z, s, d < TREE_NEAR ? 0 : d < MID ? 1 : 2, rnd);
    planted.push([x, z]);
    return true;
  };
  for (const [x, z] of CITY.trees) plant(x, z, 1.0 + rnd() * 0.5);
  // the greens: thick in the parks and woods, a few in the gardens, none on the pitches
  let count = 0;
  for (const g of CITY.greens) {
    if (g.k === "pitch" || g.k === "dirt") continue;
    const dense = g.k === "forest";
    const gap = dense ? 9 : g.k === "farm" || g.k === "scrub" ? 34 : 12;
    const xs = g.p.map((p) => p[0]);
    const zs = g.p.map((p) => p[1]);
    for (let x = Math.min(...xs); x < Math.max(...xs); x += gap) {
      for (let z = Math.min(...zs); z < Math.max(...zs); z += gap) {
        const tx = x + rnd() * gap * 0.6;
        const tz = z + rnd() * gap * 0.6;
        if (count < 2600 && inRing(tx, tz, g.p) && plant(tx, tz, (dense ? 1.1 : 1.0) + rnd() * 0.5, CITY.far)) count++;
      }
    }
  }
  // avenue trees along both sides of the streets, palms on the wide ones
  count = 0;
  for (const r of CITY.roads) {
    if (r.b) continue;
    const [cx, cz] = centroid(r.p);
    if (dist(cx, cz) > CITY_RADIUS) continue;
    const total = pathLength(r.p);
    const gap = r.w >= 9 ? 11 : 10;
    for (let s = 5; s < total; s += gap) {
      const [x, z, ux, uz] = along(r.p, s);
      for (const side of [1, -1]) {
        if (rnd() < 0.2) continue;
        const off = side * (r.w / 2 + (r.w >= 9 ? 3.6 : 2.2));
        const tx = x - uz * off, tz = z + ux * off;
        if (count >= 7000) break;
        if (r.w >= 9 && rnd() < 0.15 && dist(tx, tz) < MID) {
          if (!obstacles.blocked(tx, tz)) { palm(sb, tx, tz, 0.9 + rnd() * 0.4, rnd); count++; }
        } else if (plant(tx, tz, (r.w >= 9 ? 1.0 : 0.85) + rnd() * 0.5)) count++;
      }
    }
  }
  // garden trees on the plots between the houses, one every 30 m or so; thinner out to 4 km
  count = 0;
  for (let x = TOWER_X - CITY_RADIUS; x < TOWER_X + CITY_RADIUS; x += 22) {
    for (let z = TOWER_Z - CITY_RADIUS; z < TOWER_Z + CITY_RADIUS; z += 22) {
      if (rnd() < 0.4) continue;
      if (count < 5000 && plant(x + rnd() * 14, z + rnd() * 14, 0.9 + rnd() * 0.6)) count++;
    }
  }
  // and right up against the houses: a tree or two in most compounds near the tower
  count = 0;
  for (const b of CITY.buildings) {
    const [cx, cz] = centroid(b.p);
    if (dist(cx, cz) > 700 || rnd() < 0.35) continue;
    const r = Math.sqrt(area(b.p)) * 0.5 + 3.5;
    const a = rnd() * Math.PI * 2;
    if (count < 2500 && plant(cx + Math.cos(a) * r, cz + Math.sin(a) * r, 1.0 + rnd() * 0.6)) count++;
  }
  count = 0;
  for (let x = TOWER_X - 4200; x < TOWER_X + 4200; x += 55) {
    for (let z = TOWER_Z - 4200; z < TOWER_Z + 4200; z += 55) {
      const tx = x + rnd() * 30, tz = z + rnd() * 30;
      const d = dist(tx, tz);
      if (d <= CITY_RADIUS || d > 4200 || rnd() < 0.35) continue;
      if (count < 5000 && plant(tx, tz, 1.1 + rnd() * 0.6, 4200)) count++;
    }
  }
  return planted.length;
}
