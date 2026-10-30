import * as THREE from "three";
import city from "../data/kudasan.json";
import { StaticBuilder } from "./geom";
import type { MatKey } from "./materials";

/**
 * The real surroundings of the tower: central Kudasan, Gandhinagar, from open map data
 * (see scripts/fetch_kudasan.py). Building footprints are extruded to their known or
 * estimated heights, streets are laid as ribbons, parks and the pond as flat patches,
 * with trees along the residential streets and in the greens. Plan metres: x east,
 * y south (→ world z); the tower's plot is kept clear.
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
export const CITY_RADIUS = 700;

const STOREY = 3.1;

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

function tree(sb: StaticBuilder, x: number, z: number, s: number) {
  const trunk = new THREE.CylinderGeometry(0.14 * s, 0.22 * s, 3.6 * s, 7);
  trunk.translate(x, 1.8 * s, z);
  sb.add(trunk, "bark");
  for (let i = 0; i < 5; i++) {
    const a = i * 2.3 + x;
    const c = new THREE.IcosahedronGeometry((1.3 + (i % 3) * 0.35) * s, 1);
    c.translate(x + Math.cos(a) * 1.1 * s, (4.4 + (i % 3) * 0.6) * s, z + Math.sin(a) * 1.1 * s);
    sb.add(c, i % 2 ? "leaf" : "olive");
  }
}

export function buildCity(sb: StaticBuilder) {
  const [px1, pz1, px2, pz2] = CITY.plot;
  const onPlot = (x: number, z: number) => x > px1 && x < px2 && z > pz1 && z < pz2;
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // dusty open ground with the greens and the pond laid on it
  const ground = new THREE.CircleGeometry(CITY_RADIUS + 300, 64);
  ground.rotateX(-Math.PI / 2);
  ground.translate(12, -0.04, 8);
  sb.add(ground, "ground");
  for (const g of CITY.greens) sb.add(flat(g, -0.02), "park");
  for (const w of CITY.water) sb.add(flat(w, -0.03), "water");

  // streets
  for (const r of CITY.roads) {
    for (const g of ribbon(r.p, r.w, -0.01)) sb.add(g, "asphalt");
    if (r.w >= 9) for (const g of ribbon(r.p, 0.35, 0.0)) sb.add(g, "roadLine");
  }

  // buildings as Kudasan builds them: painted RCC frames with a window per bay, projecting floor slabs (chajjas),
  // a parapet round a flat roof with a stair head and black water tanks; the few towers get glass bands
  const facades: MatKey[] = ["facadeA", "facadeB", "facadeC", "facadeD"];
  for (const b of CITY.buildings) {
    const h = Math.max(STOREY + 1, b.h);
    const [cx, cz] = centroid(b.p);
    const near = Math.hypot(cx - 12, cz - 8) < 320;
    const a = area(b.p);
    const walls = extrude(b.p, h);
    sb.add(walls, b.k === "tower" ? "concrete" : facades[Math.floor(rnd() * facades.length)]);
    sb.add(flat(b.p, h + 0.03), "roofGrey");
    if (b.k === "tower") {
      for (let y = STOREY; y < h - 1; y += STOREY) {
        const band = extrude(b.p, 1.4);
        band.scale(1.004, 1, 1.004);
        band.translate(0, y, 0);
        sb.add(band, "towerGlass");
      }
      continue;
    }
    // parapet
    const inner = offset(b.p, -0.22);
    sb.add(extrude(b.p, 0.9, h, inner), "parapet");
    if (near && a > 45) {
      // chajjas: slabs projecting 0.35 m at every floor
      const lip = offset(b.p, 0.35);
      for (let y = STOREY; y < h - 1; y += STOREY) sb.add(extrude(lip, 0.12, y - 0.12, b.p), "parapet");
    }
    if (a > 110) {
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

  // trees: in the greens, and along the quieter streets, never on the tower's plot
  const blocked = (x: number, z: number) => onPlot(x, z) || CITY.buildings.some((b) => inRing(x, z, b.p));
  let count = 0;
  for (const g of CITY.greens) {
    const xs = g.map((p) => p[0]);
    const zs = g.map((p) => p[1]);
    for (let x = Math.min(...xs); x < Math.max(...xs); x += 14) {
      for (let z = Math.min(...zs); z < Math.max(...zs); z += 14) {
        const tx = x + rnd() * 6;
        const tz = z + rnd() * 6;
        if (inRing(tx, tz, g) && !blocked(tx, tz) && count++ < 120) tree(sb, tx, tz, 0.8 + rnd() * 0.5);
      }
    }
  }
  for (const r of CITY.roads) {
    if (r.w > 7) continue;
    for (let i = 0; i < r.p.length - 1; i++) {
      const [ax, az] = r.p[i];
      const [bx, bz] = r.p[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const nx = -(bz - az) / len;
      const nz = (bx - ax) / len;
      for (let t = 12; t < len; t += 26) {
        const side = rnd() > 0.5 ? 1 : -1;
        const x = ax + ((bx - ax) * t) / len + nx * side * (r.w / 2 + 2.2);
        const z = az + ((bz - az) * t) / len + nz * side * (r.w / 2 + 2.2);
        if (!blocked(x, z) && count++ < 260) tree(sb, x, z, 0.7 + rnd() * 0.4);
      }
    }
  }
}
