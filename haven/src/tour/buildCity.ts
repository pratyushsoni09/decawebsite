import * as THREE from "three";
import city from "../data/kudasan.json";
import { StaticBuilder } from "./geom";
import type { MatKey } from "./materials";

/**
 * The real surroundings of the tower: Kudasan, Gandhinagar out to 1.8 km, from open map data
 * (see scripts/fetch_kudasan.py). Building footprints are extruded to their known or
 * estimated heights, streets are laid as ribbons, parks and the pond as flat patches,
 * and the city is planted the way Gandhinagar is: trees along every residential street,
 * in the greens and across the garden plots. Detail falls off with distance (chajjas and
 * roof tanks near the tower, parapets to 900 m, plain massing beyond), and the ground runs
 * out to the horizon so the skyline fades into haze rather than ending at an edge.
 * Plan metres: x east, y south (→ world z); the tower's plot is kept clear.
 */

interface CityData {
  /** where the tower's centre (plan 12, 8) stands */
  origin: { lat: number; lon: number };
  radius: number;
  plot: [number, number, number, number];
  attribution: string;
  buildings: { p: number[][]; h: number; k: string }[];
  roads: { p: number[][]; w: number }[];
  greens: number[][][];
  water: number[][][];
  trees: number[][];
}

export const CITY = city as unknown as CityData;
export const CITY_ATTRIBUTION = CITY.attribution;
export const CITY_RADIUS = CITY.radius;
/** the ground disc reaches well past the mapped city, to where the haze takes over */
export const GROUND_RADIUS = 6000;

const STOREY = 3.1;
const TOWER_X = 12;
const TOWER_Z = 8;
/** detail bands, metres from the tower */
const NEAR = 320;
const MID = 900;

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

/** quad-strip ribbon along a polyline, with round joints */
function ribbon(line: number[][], w: number, y: number) {
  const geos: THREE.BufferGeometry[] = [];
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i];
    const [bx, bz] = line[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    if (len < 0.05) continue;
    const g = new THREE.PlaneGeometry(len, w);
    g.rotateX(-Math.PI / 2);
    g.rotateY(-Math.atan2(bz - az, bx - ax));
    g.translate((ax + bx) / 2, y, (az + bz) / 2);
    geos.push(g);
    if (i > 0) {
      const j = new THREE.CircleGeometry(w / 2, 10);
      j.rotateX(-Math.PI / 2);
      j.translate(ax, y, az);
      geos.push(j);
    }
  }
  return geos;
}

/**
 * Where a tree may not stand: on the tower's plot, inside a building, on a street or in the pond.
 * Buildings and street segments are bucketed into 60 m cells so thousands of trees can be placed quickly.
 */
class Obstacles {
  private cell = 60;
  private buildings = new Map<string, number[]>();
  private segments = new Map<string, [number, number, number, number, number][]>();
  constructor(private data: CityData) {
    data.buildings.forEach((b, i) => {
      const xs = b.p.map((p) => p[0]);
      const zs = b.p.map((p) => p[1]);
      this.cells(Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs), (k) => {
        const list = this.buildings.get(k);
        if (list) list.push(i);
        else this.buildings.set(k, [i]);
      });
    });
    for (const r of data.roads) {
      for (let i = 0; i < r.p.length - 1; i++) {
        const [ax, az] = r.p[i];
        const [bx, bz] = r.p[i + 1];
        const seg: [number, number, number, number, number] = [ax, az, bx, bz, r.w / 2 + 1.5];
        this.cells(Math.min(ax, bx) - seg[4], Math.min(az, bz) - seg[4], Math.max(ax, bx) + seg[4], Math.max(az, bz) + seg[4], (k) => {
          const list = this.segments.get(k);
          if (list) list.push(seg);
          else this.segments.set(k, [seg]);
        });
      }
    }
  }
  private cells(x1: number, z1: number, x2: number, z2: number, f: (k: string) => void) {
    for (let cx = Math.floor(x1 / this.cell); cx <= Math.floor(x2 / this.cell); cx++)
      for (let cz = Math.floor(z1 / this.cell); cz <= Math.floor(z2 / this.cell); cz++) f(`${cx},${cz}`);
  }
  blocked(x: number, z: number) {
    const [px1, pz1, px2, pz2] = this.data.plot;
    if (x > px1 && x < px2 && z > pz1 && z < pz2) return true;
    const k = `${Math.floor(x / this.cell)},${Math.floor(z / this.cell)}`;
    for (const i of this.buildings.get(k) ?? []) if (inRing(x, z, this.data.buildings[i].p)) return true;
    for (const [ax, az, bx, bz, r] of this.segments.get(k) ?? []) {
      const dx = bx - ax, dz = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
      if (Math.hypot(x - ax - dx * t, z - az - dz * t) < r) return true;
    }
    for (const w of this.data.water) if (inRing(x, z, w)) return true;
    return false;
  }
}

/** a neem or gulmohar: full canopy near the tower, a two-lobe sketch of one in the distance */
function tree(sb: StaticBuilder, x: number, z: number, s: number, detailed: boolean) {
  const trunk = new THREE.CylinderGeometry(0.14 * s, 0.22 * s, 3.6 * s, detailed ? 7 : 4, 1, true);
  trunk.translate(x, 1.8 * s, z);
  sb.add(trunk, "bark");
  const lobes = detailed ? 5 : 2;
  for (let i = 0; i < lobes; i++) {
    const a = i * 2.3 + x;
    const c = new THREE.IcosahedronGeometry((detailed ? 1.3 + (i % 3) * 0.35 : 1.9 + i * 0.5) * s, detailed ? 1 : 0);
    c.translate(x + Math.cos(a) * (detailed ? 1.1 : 0.7) * s, (4.4 + (i % 3) * 0.6) * s, z + Math.sin(a) * (detailed ? 1.1 : 0.7) * s);
    sb.add(c, i % 2 ? "leaf" : "olive");
  }
}

export function buildCity(sb: StaticBuilder) {
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const dist = (x: number, z: number) => Math.hypot(x - TOWER_X, z - TOWER_Z);

  // scrub and dust to the horizon, with the greens and the pond laid on it
  const ground = new THREE.CircleGeometry(GROUND_RADIUS, 96);
  ground.rotateX(-Math.PI / 2);
  ground.translate(TOWER_X, -0.04, TOWER_Z);
  sb.add(ground, "ground");
  for (const g of CITY.greens) sb.add(flat(g, -0.02), "park");
  for (const w of CITY.water) sb.add(flat(w, -0.03), "water");

  // streets
  for (const r of CITY.roads) {
    for (const g of ribbon(r.p, r.w, -0.01)) sb.add(g, "asphalt");
    if (r.w >= 9) for (const g of ribbon(r.p, 0.35, 0.0)) sb.add(g, "roadLine");
  }

  // buildings as Kudasan builds them: painted RCC frames with a window per bay, projecting floor slabs (chajjas),
  // a parapet round a flat roof with a stair head and black water tanks; the towers get glass bands
  const facades: MatKey[] = ["facadeA", "facadeB", "facadeC", "facadeD"];
  for (const b of CITY.buildings) {
    const h = Math.max(STOREY + 1, b.h);
    const [cx, cz] = centroid(b.p);
    const d = dist(cx, cz);
    const near = d < NEAR;
    const a = area(b.p);
    const walls = extrude(b.p, h);
    sb.add(walls, b.k === "tower" ? "concrete" : facades[Math.floor(rnd() * facades.length)]);
    sb.add(flat(b.p, h + 0.03), "roofGrey");
    if (b.k === "tower") {
      if (d < MID) {
        for (let y = STOREY; y < h - 1; y += STOREY) {
          const band = extrude(b.p, 1.4);
          band.scale(1.004, 1, 1.004);
          band.translate(0, y, 0);
          sb.add(band, "towerGlass");
        }
      }
      continue;
    }
    if (d >= MID) continue;
    // parapet
    const inner = offset(b.p, -0.22);
    sb.add(extrude(b.p, 0.9, h, inner), "parapet");
    if (near && a > 45) {
      // chajjas: slabs projecting 0.35 m at every floor
      const lip = offset(b.p, 0.35);
      for (let y = STOREY; y < h - 1; y += STOREY) sb.add(extrude(lip, 0.12, y - 0.12, b.p), "parapet");
    }
    if (near && a > 110) {
      // stair head and water tanks on the roof
      const sx = cx + (rnd() - 0.5) * 2;
      const sz = cz + (rnd() - 0.5) * 2;
      const head = new THREE.BoxGeometry(2.4, 2.4, 2.6);
      head.translate(sx, h + 1.2, sz);
      sb.add(head, "facadeA");
      const tanks = a > 300 ? 2 : 1;
      for (let t = 0; t < tanks; t++) {
        const tx = sx + 2.2 + t * 1.6;
        const tank = new THREE.CylinderGeometry(0.62, 0.62, 1.1, 12);
        tank.translate(tx, h + 0.95, sz - 0.4);
        sb.add(tank, "tank");
        const stand = new THREE.BoxGeometry(1.4, 0.4, 1.4);
        stand.translate(tx, h + 0.2, sz - 0.4);
        sb.add(stand, "parapet");
      }
    }
  }

  // trees: Gandhinagar is the greenest capital in the country, so they go everywhere a tree can stand —
  // thick in the greens, along both sides of the quieter streets, and scattered over the garden plots
  const obstacles = new Obstacles(CITY);
  const planted: [number, number][] = [];
  const plant = (x: number, z: number, s: number) => {
    const d = dist(x, z);
    if (d > CITY_RADIUS || obstacles.blocked(x, z)) return false;
    tree(sb, x, z, s, d < 200);
    planted.push([x, z]);
    return true;
  };
  for (const [x, z] of CITY.trees) plant(x, z, 0.8 + rnd() * 0.5);
  let count = 0;
  for (const g of CITY.greens) {
    const xs = g.map((p) => p[0]);
    const zs = g.map((p) => p[1]);
    for (let x = Math.min(...xs); x < Math.max(...xs); x += 11) {
      for (let z = Math.min(...zs); z < Math.max(...zs); z += 11) {
        const tx = x + rnd() * 6;
        const tz = z + rnd() * 6;
        if (count < 600 && inRing(tx, tz, g) && plant(tx, tz, 0.8 + rnd() * 0.5)) count++;
      }
    }
  }
  count = 0;
  for (const r of CITY.roads) {
    if (r.w > 12) continue;
    for (let i = 0; i < r.p.length - 1; i++) {
      const [ax, az] = r.p[i];
      const [bx, bz] = r.p[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      if (len < 1) continue;
      const nx = -(bz - az) / len;
      const nz = (bx - ax) / len;
      for (let t = 9; t < len; t += 16) {
        for (const side of [1, -1]) {
          if (rnd() < 0.3) continue;
          const x = ax + ((bx - ax) * t) / len + nx * side * (r.w / 2 + 2.4);
          const z = az + ((bz - az) * t) / len + nz * side * (r.w / 2 + 2.4);
          if (count < 3000 && plant(x, z, 0.7 + rnd() * 0.4)) count++;
        }
      }
    }
  }
  // garden trees on the plots between the houses and over the farmland beyond: one every 30 m or so
  count = 0;
  for (let x = TOWER_X - CITY_RADIUS; x < TOWER_X + CITY_RADIUS; x += 30) {
    for (let z = TOWER_Z - CITY_RADIUS; z < TOWER_Z + CITY_RADIUS; z += 30) {
      if (rnd() < 0.5) continue;
      const tx = x + rnd() * 18;
      const tz = z + rnd() * 18;
      if (count < 2400 && plant(tx, tz, 0.7 + rnd() * 0.5)) count++;
    }
  }
  return planted.length;
}
