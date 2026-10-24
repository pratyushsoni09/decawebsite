import * as THREE from "three";
import { CEILING_HEIGHT, FLOOR_LEVEL, WALL_TYPES, roomById, type FurnitureDef } from "../data/houseLayout";
import { StaticBuilder, metricBox, placeMatrix } from "./geom";
import type { MatKey, MaterialLib } from "./materials";

/**
 * Low-poly furniture, authored in local space: origin at the footprint
 * centre on the floor, front facing +z. Wall items (art, mirrors) have
 * their origin on the wall face at their centre height.
 */

type Ctx = { sb: StaticBuilder; M: THREE.Matrix4; it: FurnitureDef; hang?: SwingPart };

/** The moving part of a swing: geometry in hook-local space (y down from the hook). */
export interface SwingPart {
  it: FurnitureDef;
  sb: StaticBuilder;
  /** hook height above the floor */
  hookY: number;
  /** where a seated visitor's eyes are, hook-local */
  eye: [number, number, number];
}

const I = new THREE.Matrix4();
/** box into the swing's moving part (hook-local) */
function HB(c: Ctx, mat: MatKey, w: number, h: number, d: number, x = 0, y = 0, z = 0) {
  const g = metricBox(w, h, d);
  g.translate(x, y + h / 2, z);
  c.hang!.sb.add(g, mat, I);
}
function HC(c: Ctx, mat: MatKey, r: number, h: number, x: number, y: number, z: number) {
  const g = new THREE.CylinderGeometry(r, r, h, 6);
  g.translate(x, y + h / 2, z);
  c.hang!.sb.add(g, mat, I);
}
/** beam between two local points (frame members) */
function beam(c: Ctx, mat: MatKey, t: number, a: THREE.Vector3, b: THREE.Vector3) {
  const len = a.distanceTo(b);
  const g = metricBox(t, t, len);
  const m = new THREE.Matrix4().lookAt(b, a, new THREE.Vector3(0, 1, 0));
  m.setPosition(a.clone().add(b).multiplyScalar(0.5));
  c.sb.add(g, mat, c.M.clone().multiply(m));
}

/** box by centre-x, bottom-y, centre-z */
function B(c: Ctx, mat: MatKey, w: number, h: number, d: number, x = 0, y = 0, z = 0) {
  const g = metricBox(w, h, d);
  g.translate(x, y + h / 2, z);
  c.sb.add(g, mat, c.M);
}

function C(c: Ctx, mat: MatKey, rTop: number, rBot: number, h: number, x = 0, y = 0, z = 0, seg = 20) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg);
  g.translate(x, y + h / 2, z);
  c.sb.add(g, mat, c.M);
}

function S(c: Ctx, mat: MatKey, r: number, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, detail = 1) {
  const g = new THREE.IcosahedronGeometry(r, detail);
  g.scale(sx, sy, sz);
  g.translate(x, y, z);
  c.sb.add(g, mat, c.M);
}

/** flat rectangle facing +z, UVs 0..1 (for art) or metric (for books) */
function P(c: Ctx, mat: MatKey, w: number, h: number, x: number, y: number, z: number, metric = false) {
  const g = new THREE.PlaneGeometry(w, h);
  if (metric) {
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
  }
  g.translate(x, y, z);
  c.sb.add(g, mat, c.M);
}

function legs(c: Ctx, mat: MatKey, w: number, d: number, h: number, t = 0.04, inset = 0.04) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(c, mat, t, h, t, sx * (w / 2 - inset - t / 2), 0, sz * (d / 2 - inset - t / 2));
}

/** the same surface facing the other way, so curved shells show from inside too */
function flipped(g: THREE.BufferGeometry) {
  const f = g.toNonIndexed();
  const pos = f.attributes.position as THREE.BufferAttribute;
  const nor = f.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i += 3) {
    for (const a of [pos, nor]) {
      const x = a.getX(i + 1), y = a.getY(i + 1), z = a.getZ(i + 1);
      a.setXYZ(i + 1, a.getX(i + 2), a.getY(i + 2), a.getZ(i + 2));
      a.setXYZ(i + 2, x, y, z);
    }
  }
  for (let i = 0; i < nor.count; i++) nor.setXYZ(i, -nor.getX(i), -nor.getY(i), -nor.getZ(i));
  return f;
}
/** add a geometry in the item's local frame */
function G(c: Ctx, g: THREE.BufferGeometry, mat: MatKey) {
  c.sb.add(g, mat, c.M);
}

const hash = (s: string) => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);

const builders: Partial<Record<FurnitureDef["type"], (c: Ctx) => void>> = {
  sofa(c) {
    const { w, d } = c.it;
    const mat: MatKey = c.it.variant === "cognac" ? "leather" : c.it.variant === "linen" ? "linen" : c.it.variant === "tan" || c.it.variant === "tanThrow" ? "tan" : "cream";
    if (c.it.variant === "outdoor") {
      legs(c, "teak", w - 0.04, d - 0.04, 0.3, 0.06, 0.0);
      B(c, "teak", w, 0.06, d, 0, 0.24, 0);
      B(c, "teak", w, 0.5, 0.06, 0, 0.3, -d / 2 + 0.03);
      for (const sx of [-1, 1]) B(c, "teak", 0.06, 0.3, d, sx * (w / 2 - 0.03), 0.3, 0);
      const n = 3;
      const cw = (w - 0.16) / n;
      for (let i = 0; i < n; i++) B(c, "cream", cw - 0.02, 0.12, d - 0.14, -w / 2 + 0.08 + cw * (i + 0.5), 0.3, 0.05);
      for (let i = 0; i < n; i++) B(c, i === 1 ? "teal" : "cream", cw - 0.06, 0.38, 0.12, -w / 2 + 0.08 + cw * (i + 0.5), 0.42, -d / 2 + 0.14);
      return;
    }
    legs(c, "darkMetal", w - 0.1, d - 0.1, 0.1, 0.035);
    B(c, mat, w, 0.3, d, 0, 0.1, 0);
    const n = w > 2.6 ? 3 : 2;
    const cw = (w - 0.4) / n;
    for (let i = 0; i < n; i++) B(c, mat, cw - 0.02, 0.14, d - 0.3, -w / 2 + 0.2 + cw * (i + 0.5), 0.4, 0.08);
    B(c, mat, w, 0.42, 0.22, 0, 0.38, -d / 2 + 0.11);
    for (let i = 0; i < n; i++) B(c, mat, cw - 0.04, 0.34, 0.14, -w / 2 + 0.2 + cw * (i + 0.5), 0.52, -d / 2 + 0.28);
    for (const sx of [-1, 1]) B(c, mat, 0.2, 0.32, d, sx * (w / 2 - 0.1), 0.38, 0);
    if (c.it.variant === "tanThrow") {
      B(c, "cream", 0.5, 0.025, d * 0.75, w / 2 - 0.35, 0.56, 0.0);
      B(c, "cream", 0.5, 0.3, 0.025, w / 2 - 0.35, 0.28, d / 2 - 0.01);
    }
    if (mat !== "leather") for (const sx of [-1, 1]) B(c, mat === "tan" ? (sx < 0 ? "charcoal" : "cream") : "teal", 0.42, 0.36, 0.12, sx * (w / 2 - 0.42), 0.56, -d / 2 + 0.36);
  },
  loungeChair(c) {
    const { w, d } = c.it;
    if (c.it.variant === "pink") {
      C(c, "pinkLeather", 0.3, 0.32, 0.03, 0, 0, 0, 32);
      C(c, "pinkLeather", 0.035, 0.05, 0.28, 0, 0.03, 0, 12);
      C(c, "pinkLeather", 0.36, 0.3, 0.16, 0, 0.3, 0.02, 32);
      const r = Math.min(w, d) / 2 - 0.02;
      const shell = new THREE.CylinderGeometry(r, r * 0.82, 0.5, 32, 1, true, Math.PI * 0.62, Math.PI * 0.76);
      shell.translate(0, 0.55, 0);
      G(c, shell, "pinkLeather");
      G(c, flipped(shell), "pinkLeather");
      B(c, "rugRose", 0.36, 0.3, 0.1, 0, 0.5, -0.18);
      return;
    }
    legs(c, "oakWood", w - 0.1, d - 0.1, 0.18, 0.04);
    B(c, "cream", w, 0.24, d, 0, 0.16, 0);
    B(c, "teal", w - 0.3, 0.12, d - 0.28, 0, 0.4, 0.06);
    B(c, "cream", w, 0.4, 0.18, 0, 0.4, -d / 2 + 0.09);
    for (const sx of [-1, 1]) B(c, "cream", 0.15, 0.28, d, sx * (w / 2 - 0.075), 0.4, 0);
    B(c, "teal", 0.4, 0.3, 0.1, 0, 0.55, -d / 2 + 0.24);
  },
  readingChair(c) {
    const { w, d } = c.it;
    legs(c, "walnut", w - 0.12, d - 0.12, 0.16, 0.04);
    B(c, "leather", w, 0.26, d, 0, 0.14, 0);
    B(c, "leather", w - 0.28, 0.12, d - 0.26, 0, 0.4, 0.06);
    B(c, "leather", w, 0.62, 0.18, 0, 0.4, -d / 2 + 0.09);
    for (const sx of [-1, 1]) B(c, "leather", 0.14, 0.3, d, sx * (w / 2 - 0.07), 0.4, 0);
  },
  chair(c) {
    const seat: MatKey = c.it.room === "dining" ? "blackLeather" : c.it.room === "kitchen" ? "oakWood" : "linen";
    legs(c, c.it.room === "dining" ? "darkMetal" : "walnut", 0.44, 0.44, 0.44, c.it.room === "dining" ? 0.02 : 0.035, 0.01);
    B(c, seat, 0.46, 0.06, 0.46, 0, 0.44, 0);
    B(c, seat, 0.46, 0.46, 0.05, 0, 0.5, -0.21);
  },
  deskChair(c) {
    if (c.it.variant === "orange") {
      C(c, "darkMetal", 0.26, 0.26, 0.02, 0, 0.03, 0, 5);
      C(c, "darkMetal", 0.025, 0.025, 0.4, 0, 0.05, 0, 8);
      B(c, "orangePaint", 0.48, 0.07, 0.46, 0, 0.45, 0);
      B(c, "orangePaint", 0.46, 0.4, 0.05, 0, 0.52, -0.21);
      return;
    }
    legs(c, "walnut", 0.46, 0.46, 0.44, 0.035, 0.01);
    B(c, "leather", 0.5, 0.07, 0.48, 0, 0.44, 0);
    B(c, "walnut", 0.5, 0.36, 0.04, 0, 0.6, -0.22);
  },
  stool(c) {
    if (c.it.room === "kitchen") {
      // counter stool: black frame with a footrest, upholstered seat and low back
      legs(c, "darkMetal", 0.4, 0.4, 0.66, 0.022, 0.02);
      for (const sz of [-1, 1]) B(c, "darkMetal", 0.36, 0.02, 0.02, 0, 0.26, sz * 0.17);
      for (const sx of [-1, 1]) B(c, "darkMetal", 0.02, 0.02, 0.36, sx * 0.17, 0.26, 0);
      B(c, "upholstery", 0.42, 0.07, 0.4, 0, 0.66, 0);
      B(c, "upholstery", 0.4, 0.2, 0.05, 0, 0.73, -0.18);
      return;
    }
    C(c, "brass", 0.025, 0.025, 0.7, 0, 0, 0, 8);
    C(c, "brass", 0.17, 0.17, 0.02, 0, 0, 0);
    C(c, "brass", 0.14, 0.14, 0.015, 0, 0.3, 0);
    C(c, "leather", 0.2, 0.19, 0.06, 0, 0.7, 0);
  },
  coffeeTable(c) {
    const { w, d, h } = c.it;
    if (c.it.variant === "round") {
      const r = w / 2;
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        C(c, "darkMetal", 0.012, 0.012, h - 0.04, Math.cos(a) * r * 0.8, 0.02, Math.sin(a) * r * 0.8, 8);
      }
      const ring = new THREE.TorusGeometry(r * 0.8, 0.012, 6, 40);
      ring.rotateX(Math.PI / 2);
      ring.translate(0, 0.08, 0);
      G(c, ring, "darkMetal");
      C(c, "charcoal", r, r, 0.03, 0, h - 0.04, 0, 40);
      C(c, "darkMetal", r + 0.008, r + 0.008, 0.012, 0, h - 0.045, 0, 40);
      return;
    }
    B(c, "oakWood", w - 0.3, h - 0.05, d - 0.3, 0, 0, 0);
    B(c, "oakWood", w, 0.05, d, 0, h - 0.05, 0);
    B(c, "pot", 0.16, 0.1, 0.16, w * 0.22, h, -0.05);
    B(c, "walnut", 0.3, 0.05, 0.22, -w * 0.2, h, 0.05);
  },
  sideTable(c) {
    const { w, d, h } = c.it;
    C(c, "oakWood", 0.05, 0.08, h - 0.03, 0, 0, 0, 12);
    B(c, "oakWood", w, 0.03, d, 0, h - 0.03, 0);
  },
  table(c) {
    const { w, d } = c.it;
    if (c.it.variant === "slab") {
      for (const sx of [-1, 1]) B(c, "driftwood", 0.07, 0.68, d - 0.25, sx * (w / 2 - 0.4), 0, 0);
      B(c, "driftwood", w - 0.8, 0.05, d - 0.35, 0, 0.22, 0);
      B(c, "driftwood", w, 0.08, d, 0, 0.68, 0);
      C(c, "pot", 0.12, 0.08, 0.1, 0, 0.76, 0, 16);
      for (const x of [-0.45, 0.35]) C(c, "glowWarm", 0.03, 0.03, 0.18, x, 0.76, 0.12, 10);
      return;
    }
    for (const sx of [-1, 1]) B(c, "walnut", 0.1, 0.7, d - 0.4, sx * (w / 2 - 0.45), 0, 0);
    B(c, "walnut", w - 0.9, 0.08, 0.1, 0, 0.55, 0);
    B(c, "walnut", w, 0.06, d, 0, 0.7, 0);
    for (const x of [-1, 0, 1]) S(c, "pot", 0.06, x * 0.9, 0.82, 0, 1, 1.4, 1);
  },
  roundTable(c) {
    const r = c.it.w / 2;
    const entrance = c.it.room === "entrance";
    C(c, "walnut", 0.2, 0.35, 0.05, 0, 0, 0);
    C(c, "walnut", 0.1, 0.12, 0.7, 0, 0.05, 0);
    C(c, entrance ? "marble" : "oakWood", r, r, 0.04, 0, 0.72, 0, 40);
    if (entrance) {
      C(c, "pot", 0.12, 0.09, 0.32, 0, 0.76, 0);
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        S(c, i % 3 ? "olive" : "leaf", 0.16, Math.cos(a) * 0.2, 1.2 + (i % 3) * 0.08, Math.sin(a) * 0.2, 1, 1, 1, 0);
      }
    }
  },
  island(c) {
    const { w, d, h } = c.it;
    if (c.it.variant === "luxury") {
      // quartz waterfall island: greige drawers to the hob side, fluted walnut and a breakfast overhang to the front
      const base = d - 0.28;
      const bz = -d / 2 + base / 2;
      B(c, "darkMetal", w - 0.2, 0.08, base - 0.08, 0, 0, bz);
      B(c, "driftwood", w - 0.12, h - 0.13, base, 0, 0.08, bz);
      for (const y of [0.35, 0.6]) B(c, "darkMetal", w - 0.16, 0.004, 0.005, 0, y, -d / 2 + 0.002);
      const ribs = Math.floor((w - 0.16) / 0.04);
      for (let i = 0; i < ribs; i++) C(c, "driftwood", 0.014, 0.014, h - 0.18, -w / 2 + 0.1 + i * 0.04, 0.08, bz + base / 2 + 0.01, 8);
      B(c, "marble", w, 0.05, d, 0, h - 0.05, 0);
      for (const sx of [-1, 1]) B(c, "marble", 0.05, h - 0.05, d, sx * (w / 2 - 0.025), 0, 0);
      B(c, "glow", w - 0.14, 0.006, 0.02, 0, h - 0.056, d / 2 - 0.05);
      B(c, "porcelain", 0.3, 0.012, 0.3, w * 0.22, h, -0.05);
      return;
    }
    B(c, "oakWood", w - 0.1, 0.88, d - 0.25, 0, 0, -0.08);
    B(c, "marble", w, 0.04, d, 0, 0.88, 0);
    for (const sx of [-1, 1]) B(c, "marble", 0.04, 0.88, d, sx * (w / 2 - 0.02), 0, 0);
  },
  kitchenRun(c) {
    const { w, d } = c.it;
    if (c.it.variant === "modular") {
      // handleless greige run with a gola channel, quartz top and full-height quartz splashback;
      // undermount sink with a black gooseneck under the window, hob under the chimney
      B(c, "darkMetal", w - 0.02, 0.1, d - 0.1, 0, 0, -0.05);
      B(c, "driftwood", w, 0.68, d - 0.03, 0, 0.1, -0.015);
      B(c, "darkMetal", w, 0.05, d - 0.07, 0, 0.78, -0.035);
      const n = Math.max(1, Math.round(w / 0.6));
      for (let i = 1; i < n; i++) B(c, "darkMetal", 0.004, 0.66, 0.005, -w / 2 + (w / n) * i, 0.11, d / 2 - 0.028);
      for (let i = 0; i < n; i += 2) B(c, "darkMetal", w / n - 0.01, 0.004, 0.005, -w / 2 + (w / n) * (i + 0.5), 0.45, d / 2 - 0.028);
      B(c, "marble", w, 0.05, d, 0, 0.83, 0);
      B(c, "marble", w, 0.62, 0.02, 0, 0.88, -d / 2 + 0.01);
      B(c, "glow", w - 0.04, 0.008, 0.02, 0, 1.5, -d / 2 + 0.03);
      if (w >= 2.5) {
        const sx = w / 2 - 1.2;
        B(c, "darkGlass", 0.72, 0.004, 0.42, sx, 0.88, 0.02);
        C(c, "darkMetal", 0.016, 0.016, 0.42, sx, 0.88, -0.22, 10);
        B(c, "darkMetal", 0.03, 0.03, 0.22, sx, 1.27, -0.12);
      }
      return;
    }
    B(c, "oakWood", w, 0.86, d - 0.03, 0, 0, -0.015);
    B(c, "marble", w, 0.04, d, 0, 0.86, 0);
    const n = Math.max(1, Math.round(w / 0.6));
    for (let i = 1; i < n; i++) B(c, "darkMetal", 0.006, 0.78, 0.005, -w / 2 + (w / n) * i, 0.06, d / 2 - 0.028);
    for (let i = 0; i < n; i++) B(c, "brass", 0.22, 0.015, 0.02, -w / 2 + (w / n) * (i + 0.5), 0.72, d / 2 - 0.02);
    if (c.it.room === "kitchen") {
      B(c, "porcelain", 0.7, 0.02, 0.45, -w * 0.15, 0.9, 0); // sink
      C(c, "brass", 0.015, 0.015, 0.35, -w * 0.15, 0.9, -0.24, 8);
      B(c, "marble", w, 0.6, 0.02, 0, 0.9, -d / 2 + 0.01); // splashback
    }
  },
  tallUnits(c) {
    const { w, d, h } = c.it;
    if (c.it.variant === "column") {
      // walnut appliance column: integrated fridge-freezer, built-in oven and combi microwave
      B(c, "darkMetal", w - 0.04, 0.1, d - 0.08, 0, 0, -0.04);
      B(c, "driftwood", w, h - 0.1, d - 0.02, 0, 0.1, -0.01);
      const f = d / 2 + 0.001;
      B(c, "darkMetal", 0.004, h - 0.14, 0.005, 0, 0.12, f);
      B(c, "darkMetal", w / 2 - 0.02, 0.004, 0.005, -w / 4, 0.85, f);
      B(c, "darkMetal", w - 0.02, 0.004, 0.005, 0, h - 0.4, f);
      B(c, "darkMetal", 0.02, 1.1, 0.03, -0.05, 0.95, f);
      B(c, "darkMetal", 0.02, 0.5, 0.03, -0.05, 0.25, f);
      B(c, "darkGlass", 0.6, 0.6, 0.012, w / 4, 0.82, f);
      B(c, "darkGlass", 0.6, 0.46, 0.012, w / 4, 1.48, f);
      B(c, "darkMetal", 0.56, 0.02, 0.03, w / 4, 1.36, f + 0.01);
      for (const y of [0.33, 0.58]) B(c, "darkMetal", w / 2 - 0.04, 0.004, 0.005, w / 4, y, f);
      B(c, "glow", w - 0.04, 0.008, 0.02, 0, h - 0.008, d / 2 - 0.04);
      return;
    }
    B(c, "oakWood", w, h, d - 0.02, 0, 0, -0.01);
    const n = Math.round(w / 0.65);
    for (let i = 1; i < n; i++) B(c, "darkMetal", 0.006, h - 0.1, 0.005, -w / 2 + (w / n) * i, 0.05, d / 2 - 0.018);
    const ovenX = -w / 2 + w / n / 2;
    B(c, "darkGlass", 0.56, 0.56, 0.01, ovenX, 0.85, d / 2 - 0.015);
    B(c, "darkGlass", 0.56, 0.45, 0.01, ovenX, 1.5, d / 2 - 0.015);
    for (let i = 0; i < n; i++) B(c, "brass", 0.02, 0.5, 0.025, -w / 2 + (w / n) * (i + 1) - 0.06, 1.1, d / 2 - 0.01);
  },
  bed(c) {
    const { w, d } = c.it;
    if (c.it.variant === "sculpted") {
      // the client's pink-bed photo: soft pink platform under a thick hood lit warm inside, side ledge and tray
      const mw = w - 0.7;
      const head = -d / 2;
      B(c, "pinkLeather", w - 0.1, 0.3, d - 0.2, 0, 0.02, 0.1);
      B(c, "mustard", mw, 0.2, d - 0.55, 0, 0.3, 0.12);
      B(c, "maroon", mw + 0.12, 0.1, d * 0.48, 0, 0.43, d * 0.2);
      for (const sx of [-1, 1]) B(c, "maroon", mw * 0.42, 0.2, 0.3, sx * mw * 0.25, 0.5, head + 0.55);
      for (let i = 0; i < 3; i++) B(c, "pinkLeather", mw * 0.32, 0.62, 0.14, (i - 1) * mw * 0.33, 0.42, head + 0.2);
      const R = w / 2 - 0.02;
      const T = 0.2;
      const L = 0.95;
      const y0 = 0.3;
      const outer = new THREE.CylinderGeometry(R, R, L, 48, 1, true, Math.PI / 2, Math.PI);
      outer.rotateX(Math.PI / 2);
      outer.scale(1, 0.7, 1);
      outer.translate(0, y0, head + L / 2);
      G(c, outer, "pinkLeather");
      const inner = new THREE.CylinderGeometry(R - T, R - T, L, 48, 1, true, Math.PI / 2, Math.PI);
      inner.rotateX(Math.PI / 2);
      inner.scale(1, 0.7, 1);
      inner.translate(0, y0, head + L / 2);
      G(c, flipped(inner), "glowWarm");
      const lip = new THREE.TorusGeometry(R - T / 2, T / 2, 10, 48, Math.PI);
      lip.scale(1, 0.7, 1);
      lip.translate(0, y0, head + L);
      G(c, lip, "pinkLeather");
      const back = new THREE.CircleGeometry(R - T, 48, 0, Math.PI);
      back.scale(1, 0.7, 1);
      back.translate(0, y0, head + 0.06);
      G(c, back, "glowWarm");
      B(c, "pinkLeather", 0.34, 0.42, 0.62, w / 2 - 0.17, 0.05, head + L + 0.32);
      C(c, "brass", 0.02, 0.02, 0.5, -(w / 2 - 0.18), 0, head + L + 0.25, 8);
      C(c, "pinkLeather", 0.2, 0.2, 0.05, -(w / 2 - 0.18), 0.5, head + L + 0.25, 32);
      S(c, "pinkLeather", 0.09, -(w / 2 - 0.15), 0.66, head + L + 0.21, 1, 1.3, 1);
      return;
    }
    if (c.it.variant === "twin" || c.it.variant === "grey") {
      const twin = c.it.variant === "twin";
      const frame: MatKey = twin ? "white" : "rugGrey";
      B(c, frame, w + 0.06, 0.34, d, 0, 0.04, 0);
      B(c, "bedLinen", w - 0.04, 0.18, d - 0.12, 0, 0.36, 0.03);
      B(c, twin ? "linen" : "greige", w + 0.02, 0.07, d * 0.62, 0, 0.5, d * 0.17);
      const pw = twin ? w - 0.3 : (w - 0.25) / 2;
      for (const x of twin ? [0] : [-pw / 2 - 0.04, pw / 2 + 0.04]) B(c, twin ? "orangePaint" : "bedLinen", pw, 0.16, 0.36, x, 0.54, -d / 2 + 0.3);
      if (twin) B(c, "cream", w * 0.45, 0.14, 0.12, 0, 0.6, -d / 2 + 0.5);
      // headboard: a panel with a rounded top
      const hb = 0.72;
      B(c, frame, w + 0.06, hb, 0.08, 0, 0.04, -d / 2 - 0.04);
      // half disc arching up: theta pi/2..3pi/2 lands above the axis once the cylinder lies along z
      const top = new THREE.CylinderGeometry((w + 0.06) / 2, (w + 0.06) / 2, 0.08, 32, 1, false, Math.PI / 2, Math.PI);
      top.rotateX(Math.PI / 2);
      top.translate(0, 0.04 + hb, -d / 2 - 0.04);
      if (twin) G(c, top, frame);
      return;
    }
    B(c, "walnut", w, 0.28, d, 0, 0.04, 0);
    B(c, "bedLinen", w - 0.06, 0.2, d - 0.08, 0, 0.32, 0.02);
    B(c, "duvet", w + 0.02, 0.07, d * 0.62, 0, 0.47, d * 0.18);
    B(c, "duvet", w + 0.04, 0.3, 0.03, 0, 0.24, d / 2 - 0.02);
    const pw = w > 1.7 ? (w - 0.3) / 2 : (w - 0.2) / 2;
    for (const sx of [-1, 1]) B(c, "bedLinen", pw, 0.16, 0.4, sx * (pw / 2 + 0.05), 0.52, -d / 2 + 0.32);
    B(c, "teal", w * 0.5, 0.12, 0.12, 0, 0.55, -d / 2 + 0.6);
    B(c, "upholstery", w + 0.16, 1.2, 0.1, 0, 0, -d / 2 - 0.05);
  },
  nightstand(c) {
    const { w, d, h } = c.it;
    if (c.it.variant === "cube") {
      B(c, "white", w, h, d);
      B(c, "darkMetal", w - 0.04, 0.004, 0.005, 0, h * 0.6, d / 2);
      C(c, "darkMetal", 0.06, 0.06, 0.02, -0.08, h, -0.05, 12);
      beam(c, "darkMetal", 0.012, new THREE.Vector3(-0.08, h + 0.02, -0.05), new THREE.Vector3(-0.05, h + 0.38, -0.08));
      C(c, "darkMetal", 0.07, 0.03, 0.12, -0.02, h + 0.3, -0.02, 12);
      return;
    }
    if (c.it.variant === "cream") {
      B(c, "white", w, h, d);
      B(c, "greige", w - 0.12, 0.14, 0.01, 0, 0.1, d / 2 + 0.001);
      B(c, "darkMetal", w - 0.12, 0.004, 0.005, 0, h * 0.62, d / 2 + 0.002);
      C(c, "glowWarm", 0.07, 0.07, 0.14, 0, h, -0.05, 16);
      return;
    }
    B(c, "oakWood", w, h, d);
    B(c, "darkMetal", w - 0.06, 0.004, 0.005, 0, h * 0.55, d / 2);
    C(c, "brass", 0.06, 0.07, 0.24, 0.05, h, -0.04, 12);
    C(c, "shade", 0.09, 0.13, 0.18, 0.05, h + 0.24, -0.04, 16);
  },
  desk(c) {
    const { w, d } = c.it;
    if (c.it.variant === "long") {
      for (const sx of [-1, 1]) {
        B(c, "oakWood", 0.42, 0.7, d - 0.04, sx * (w / 2 - 0.21), 0, 0);
        for (const y of [0.24, 0.47]) B(c, "darkMetal", 0.36, 0.004, 0.005, sx * (w / 2 - 0.21), y, d / 2 - 0.018);
      }
      B(c, "oakWood", w, 0.04, d, 0, 0.72, 0);
      B(c, "darkGlass", 0.34, 0.22, 0.015, w * 0.12, 0.76, -d / 2 + 0.16);
      C(c, "darkMetal", 0.06, 0.06, 0.02, -w * 0.3, 0.76, -d / 2 + 0.12, 12);
      C(c, "darkMetal", 0.01, 0.01, 0.42, -w * 0.3, 0.78, -d / 2 + 0.12, 6);
      return;
    }
    for (const sx of [-1, 1]) B(c, "walnut", 0.05, 0.72, d - 0.06, sx * (w / 2 - 0.05), 0, 0);
    B(c, "walnut", w, 0.04, d, 0, 0.72, 0);
    B(c, "leather", w * 0.5, 0.004, d * 0.45, 0, 0.76, 0.06);
    C(c, "brass", 0.07, 0.07, 0.02, w / 2 - 0.2, 0.76, -d / 2 + 0.15, 12);
    C(c, "brass", 0.012, 0.012, 0.4, w / 2 - 0.2, 0.76, -d / 2 + 0.15, 6);
    C(c, "brass", 0.05, 0.1, 0.1, w / 2 - 0.2, 1.12, -d / 2 + 0.2, 12);
  },
  shelf(c) {
    const { w, d, h } = c.it;
    const linen = c.it.variant === "linen";
    const mat: MatKey = linen ? "oakWood" : "walnut";
    B(c, mat, w, h, 0.03, 0, 0, -d / 2 + 0.015);
    const bays = Math.max(1, Math.round(w / 0.9));
    for (let i = 0; i <= bays; i++) B(c, mat, 0.03, h, d, -w / 2 + 0.015 + ((w - 0.03) / bays) * i, 0, 0);
    const rows = linen ? 5 : 7;
    const pitch = (h - 0.1) / rows;
    for (let r = 0; r <= rows; r++) B(c, mat, w, 0.03, d, 0, r * pitch + (r === 0 ? 0.06 : 0), 0);
    B(c, mat, w, 0.08, 0.02, 0, 0, d / 2 - 0.01);
    for (let r = 0; r < rows; r++) {
      if (linen) {
        for (let i = 0; i < 4; i++) B(c, i % 2 ? "bedLinen" : "duvet", w / 4 - 0.08, 0.22, d - 0.1, -w / 2 + (w / 4) * (i + 0.5), r * pitch + 0.09, 0);
      } else {
        P(c, "books", w - 0.06, Math.min(0.34, pitch - 0.06), 0, r * pitch + 0.09 + Math.min(0.34, pitch - 0.06) / 2, d / 2 - 0.08, true);
      }
    }
  },
  wardrobe(c) {
    const { w, d, h } = c.it;
    B(c, "oakWood", w, h, d - 0.02, 0, 0, -0.01);
    B(c, "darkMetal", 0.006, h - 0.1, 0.005, 0, 0.05, d / 2 - 0.018);
    for (const sx of [-1, 1]) B(c, "brass", 0.02, 0.6, 0.025, sx * 0.05, 0.95, d / 2 - 0.01);
  },
  bath(c) {
    const { w, d } = c.it;
    const outer = new THREE.CylinderGeometry(0.5, 0.44, 0.58, 40);
    outer.scale(w, 1, d);
    outer.translate(0, 0.29, 0);
    c.sb.add(outer, "porcelain", c.M);
    const water = new THREE.CircleGeometry(0.5, 40);
    water.rotateX(-Math.PI / 2);
    water.scale(w - 0.1, 1, d - 0.1);
    water.translate(0, 0.5, 0);
    c.sb.add(water, "water", c.M);
    C(c, "brass", 0.02, 0.02, 0.95, w / 2 + 0.12, 0, 0, 8);
    B(c, "brass", 0.22, 0.03, 0.03, w / 2 + 0.02, 0.92, 0);
  },
  vanity(c) {
    const { w, d } = c.it;
    const twin = c.it.variant === "twin";
    B(c, "oakWood", w, 0.45, d - 0.02, 0, 0.35, -0.01);
    B(c, "marble", w, 0.04, d, 0, 0.8, 0);
    const basins = twin ? [-w / 4, w / 4] : [0];
    for (const x of basins) {
      C(c, "porcelain", 0.2, 0.17, 0.12, x, 0.84, 0.03, 28);
      C(c, "brass", 0.012, 0.012, 0.28, x, 0.84, -d / 2 + 0.06, 8);
      B(c, "brass", 0.02, 0.02, 0.12, x, 1.1, -d / 2 + 0.11);
    }
  },
  shower(c) {
    const { w, d } = c.it;
    B(c, "porcelain", w, 0.04, d, 0, 0, 0);
    B(c, "glass", w - 0.6, 2.0, 0.01, -0.3, 0.04, d / 2 - 0.01);
    B(c, "glass", 0.01, 2.0, d, -w / 2 + 0.01, 0.04, 0);
    B(c, "bronze", w - 0.6, 0.03, 0.03, -0.3, 2.04, d / 2 - 0.015);
    C(c, "brass", 0.015, 0.015, 0.4, w / 4, 2.0, -d / 4, 8);
    C(c, "brass", 0.14, 0.14, 0.015, w / 4, 1.99, -d / 4, 24);
    B(c, "brass", 0.06, 0.18, 0.04, w / 2 - 0.05, 1.0, 0);
  },
  wc(c) {
    B(c, "porcelain", 0.36, 0.34, 0.52, 0, 0.26, 0.02);
    B(c, "porcelain", 0.38, 0.03, 0.5, 0, 0.6, 0.03);
    B(c, "brass", 0.2, 0.14, 0.01, 0, 0.95, -0.32);
  },
  sideboard(c) {
    const { w, d } = c.it;
    legs(c, "brass", w - 0.04, d - 0.04, 0.12, 0.025);
    B(c, "walnut", w, 0.66, d, 0, 0.12, 0);
    for (let i = 1; i < 4; i++) B(c, "darkMetal", 0.006, 0.6, 0.005, -w / 2 + (w / 4) * i, 0.15, d / 2);
    C(c, "pot", 0.1, 0.07, 0.36, -w * 0.3, 0.78, 0);
    S(c, "olive", 0.14, -w * 0.3, 1.25, 0, 1, 1.2, 1, 0);
    B(c, "oakWood", 0.32, 0.08, 0.24, w * 0.25, 0.78, 0);
    C(c, "brass", 0.06, 0.06, 0.3, w * 0.25, 0.86, 0, 12);
  },
  console(c) {
    const { w, d } = c.it;
    if (c.it.variant === "shoe") {
      // shoe cabinet: louvred teak doors, oak top
      B(c, "teak", w, 0.84, d, 0, 0.04, 0);
      B(c, "oakWood", w + 0.02, 0.04, d + 0.02, 0, 0.88, 0);
      for (let y = 0.12; y < 0.82; y += 0.06) B(c, "walnut", w - 0.08, 0.012, 0.006, 0, y, d / 2 + 0.002);
      B(c, "darkMetal", 0.004, 0.76, 0.006, 0, 0.08, d / 2 + 0.004);
      C(c, "pot", 0.07, 0.05, 0.22, w * 0.3, 0.92, 0, 14);
      return;
    }
    if (c.it.variant === "float") {
      const bw = 2.0;
      B(c, "veneer", w, 0.04, d, 0, c.it.h - 0.04, 0);
      B(c, "darkMetal", bw, 0.03, d - 0.04, 0, 0.1, -0.01);
      B(c, "darkMetal", bw, 0.3, 0.02, 0, 0.1, -d / 2 + 0.03);
      for (const x of [-bw / 2, bw / 2]) B(c, "darkMetal", 0.03, c.it.h - 0.14, d - 0.04, x, 0.1, -0.01);
      C(c, "pot", 0.06, 0.05, 0.14, -0.3, c.it.h, 0, 14);
      S(c, "terracotta", 0.06, -0.12, c.it.h + 0.06, 0.05);
      return;
    }
    if (c.it.variant === "media") {
      B(c, "darkMetal", w - 0.06, 0.06, d - 0.06, 0, 0, 0);
      B(c, "charcoal", w, c.it.h - 0.06, d, 0, 0.06, 0);
      B(c, "darkGlass", w - 0.12, (c.it.h - 0.06) * 0.5, 0.01, 0, 0.1, d / 2 + 0.001);
      B(c, "pot", 0.14, 0.22, 0.14, w * 0.36, 0.52, 0);
      B(c, "oakWood", 0.3, 0.06, 0.22, -w * 0.32, 0.52, 0);
      return;
    }
    legs(c, "bronze", w, d, 0.78, 0.03, 0.02);
    B(c, "oakWood", w, 0.04, d, 0, 0.78, 0);
    B(c, "oakWood", w - 0.1, 0.03, d - 0.06, 0, 0.2, 0);
    C(c, "pot", 0.09, 0.07, 0.28, -w * 0.25, 0.82, 0);
    S(c, "leaf", 0.12, -w * 0.25, 1.2, 0, 1, 1.3, 1, 0);
    C(c, "brass", 0.07, 0.08, 0.3, w * 0.28, 0.82, 0, 12);
    C(c, "shade", 0.12, 0.17, 0.24, w * 0.28, 1.12, 0, 18);
  },
  dresser(c) {
    const { w, d, h } = c.it;
    legs(c, "walnut", w, d, 0.12, 0.04);
    B(c, "oakWood", w, h - 0.12, d, 0, 0.12, 0);
    for (let i = 1; i < 3; i++) B(c, "darkMetal", w - 0.04, 0.005, 0.005, 0, 0.12 + ((h - 0.12) / 3) * i, d / 2);
  },
  bench(c) {
    if (c.it.variant === "ottoman") {
      const r = c.it.w / 2;
      C(c, "pinkLeather", r - 0.04, r - 0.04, 0.06, 0, 0, 0, 32);
      C(c, "pinkLeather", r, r, c.it.h - 0.14, 0, 0.06, 0, 32);
      C(c, "pinkLeather", r - 0.01, r - 0.04, 0.08, 0, c.it.h - 0.08, 0, 32);
      return;
    }
    const { w, d } = c.it;
    legs(c, "oakWood", w, d, 0.34, 0.045);
    B(c, c.it.room === "primary-bed" ? "teal" : "linen", w, 0.11, d, 0, 0.34, 0);
  },
  plant(c) {
    const { h, w } = c.it;
    const olive = c.it.variant !== "fig";
    const potR = Math.min(0.28, w * 0.38);
    C(c, "pot", potR, potR * 0.78, 0.45, 0, 0, 0, 20);
    C(c, "bark", 0.025, 0.04, h * 0.6, 0, 0.4, 0, 6);
    const n = olive ? 9 : 7;
    const seed = hash(c.it.id);
    for (let i = 0; i < n; i++) {
      const a = ((seed % 97) / 97) * 6 + i * 2.4;
      const rr = 0.12 + ((i * 37 + seed) % 10) / 50;
      S(c, olive ? "olive" : "leaf", olive ? 0.2 : 0.24, Math.cos(a) * rr, h * 0.62 + ((i * 13) % 5) * 0.09, Math.sin(a) * rr, 1, olive ? 0.8 : 1.1, 1, 0);
    }
  },
  floorLamp(c) {
    if (c.it.variant === "arc") {
      C(c, "darkMetal", 0.16, 0.16, 0.03, 0, 0, 0, 20);
      beam(c, "darkMetal", 0.02, new THREE.Vector3(0, 0.03, 0), new THREE.Vector3(0, 1.55, -0.05));
      beam(c, "darkMetal", 0.02, new THREE.Vector3(0, 1.55, -0.05), new THREE.Vector3(0, 1.62, -0.45));
      C(c, "darkMetal", 0.04, 0.11, 0.16, 0, 1.47, -0.48, 16);
      S(c, "glow", 0.04, 0, 1.47, -0.48);
      return;
    }
    C(c, "brass", 0.16, 0.16, 0.025, 0, 0, 0, 20);
    C(c, "brass", 0.012, 0.012, 1.3, 0, 0.02, 0, 8);
    C(c, "shade", 0.15, 0.2, 0.28, 0, 1.3, 0, 20);
  },
  rug(c) {
    const { w, d } = c.it;
    const mat: MatKey = c.it.variant === "grey" ? "rugGrey" : c.it.variant === "rose" ? "rugRose" : c.it.room === "entrance" || c.it.room === "lounge" ? "rugSand" : c.it.room === "library" || c.it.room === "bed4" ? "rugTeal" : "rug";
    if (c.it.variant === "round") C(c, mat, w / 2, w / 2, 0.012, 0, 0.002, 0, 48);
    else B(c, mat, w, 0.012, d, 0, 0.002, 0);
  },
  art(c) {
    const { w, h } = c.it;
    B(c, hash(c.it.id) % 2 ? "walnut" : "brass", w + 0.06, h + 0.06, 0.035, 0, -h / 2 - 0.03, 0.0175);
    P(c, `art${hash(c.it.id) % 6}` as MatKey, w - 0.04, h - 0.04, 0, 0, 0.037);
  },
  mirror(c) {
    const { w, h } = c.it;
    B(c, "brass", w + 0.05, h + 0.05, 0.025, 0, -h / 2 - 0.025, 0.0125);
    B(c, "mirror", w - 0.02, h - 0.02, 0.01, 0, -h / 2 + 0.01, 0.027);
  },
  pendant(c) {
    if (c.it.variant === "bulb") {
      const low = CEILING_HEIGHT - c.it.h;
      C(c, "darkMetal", 0.004, 0.004, c.it.h - 0.06, 0, low + 0.06, 0, 4);
      C(c, "darkMetal", 0.02, 0.02, 0.05, 0, low + 0.03, 0, 10);
      S(c, "glow", 0.035, 0, low, 0, 0.8, 1.4, 0.8);
      return;
    }
    if (c.it.variant === "cluster") {
      const { w } = c.it;
      B(c, "darkMetal", w, 0.03, 0.06, 0, CEILING_HEIGHT - 0.03, 0);
      const low = 1.95;
      for (let i = 0; i < 4; i++) {
        const x = -w / 2 + 0.15 + ((w - 0.3) / 3) * i;
        const drop = low + (i % 2) * 0.08;
        C(c, "darkMetal", 0.003, 0.003, CEILING_HEIGHT - drop - 0.2, x, drop + 0.2, 0, 4);
        C(c, "glass", 0.04, 0.12, 0.2, x, drop, 0, 18);
        S(c, "glow", 0.035, x, drop + 0.05, 0);
      }
      return;
    }
    // island pendants hang lower, about 0.8 m over the counter
    const low = c.it.room === "kitchen" ? 1.75 : 2.35;
    const r = 0.28 * Math.min(1, c.it.w / 0.6);
    C(c, "darkMetal", 0.006, 0.006, CEILING_HEIGHT - low - 0.25, 0, low + 0.25, 0, 4);
    C(c, "brass", 0.08, 0.08, 0.03, 0, CEILING_HEIGHT - 0.03, 0, 12);
    const dome = new THREE.SphereGeometry(r, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.scale(1, 0.85, 1);
    dome.translate(0, low, 0);
    c.sb.add(dome, "brass", c.M);
    S(c, "glow", 0.07, 0, low - 0.02, 0, 1, 1, 1, 1);
  },
  chandelier(c) {
    if (c.it.variant === "ring") {
      const ring = new THREE.TorusGeometry(0.7, 0.025, 8, 48);
      ring.rotateX(Math.PI / 2);
      ring.translate(0, 2.6, 0);
      c.sb.add(ring, "brass", c.M);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        S(c, "glow", 0.045, Math.cos(a) * 0.7, 2.66, Math.sin(a) * 0.7, 1, 1, 1, 1);
      }
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        C(c, "darkMetal", 0.004, 0.004, CEILING_HEIGHT - 2.6, Math.cos(a) * 0.68, 2.6, Math.sin(a) * 0.68, 4);
      }
      return;
    }
    const { w } = c.it;
    B(c, "brass", w, 0.05, 0.08, 0, 2.45, 0);
    for (const sx of [-1, 1]) C(c, "darkMetal", 0.005, 0.005, CEILING_HEIGHT - 2.5, sx * (w / 2 - 0.2), 2.5, 0, 4);
    for (let i = 0; i < 10; i++) {
      const x = -w / 2 + 0.15 + ((w - 0.3) / 9) * i;
      C(c, "brass", 0.018, 0.018, 0.08, x, 2.5, 0, 8);
      S(c, "glow", 0.035, x, 2.62, 0, 1, 1.3, 1, 1);
    }
  },
  tv(c) {
    const { w, h } = c.it;
    B(c, "darkMetal", w, h, 0.04, 0, -h / 2, 0.02);
    B(c, "darkGlass", w - 0.03, h - 0.03, 0.005, 0, -h / 2 + 0.015, 0.042);
  },
  lift(c) {
    const { w, h } = c.it;
    B(c, "bronze", w + 0.2, h + 0.12, 0.05, 0, -h / 2, 0.025);
    B(c, "liftDoor", w / 2 - 0.01, h, 0.02, -w / 4, -h / 2, 0.06);
    B(c, "liftDoor", w / 2 - 0.01, h, 0.02, w / 4, -h / 2, 0.06);
    B(c, "glow", 0.06, 0.12, 0.02, w / 2 + 0.25, -0.1, 0.03);
  },
  planter(c) {
    const { w, d, h } = c.it;
    B(c, "concrete", w, h, d);
    for (let i = 0; i < Math.round(w / 0.32); i++) {
      S(c, i % 2 ? "leaf" : "olive", 0.2, -w / 2 + 0.18 + i * 0.32, h + 0.12, 0, 1, 1.3, 0.9, 0);
    }
    S(c, "leaf", 0.12, 0, h + 0.45, 0, 1, 2.2, 1, 0);
  },
  swingEgg(c) {
    // C-shaped stand; the rattan egg hangs from the hook and sways
    const hookY = 1.95;
    C(c, "darkMetal", 0.42, 0.45, 0.05, 0, 0, 0, 28);
    beam(c, "darkMetal", 0.045, new THREE.Vector3(0, 0.05, -0.32), new THREE.Vector3(0, 1.8, -0.42));
    beam(c, "darkMetal", 0.045, new THREE.Vector3(0, 1.8, -0.42), new THREE.Vector3(0, hookY + 0.08, -0.1));
    beam(c, "darkMetal", 0.045, new THREE.Vector3(0, hookY + 0.08, -0.1), new THREE.Vector3(0, hookY + 0.04, 0));
    c.hang = { it: c.it, sb: new StaticBuilder(), hookY, eye: [0, 1.22 - hookY, 0.1] };
    HC(c, "darkMetal", 0.008, 0.5, 0, -0.5, 0);
    const shell = new THREE.SphereGeometry(0.5, 32, 18, Math.PI * 0.72, Math.PI * 1.56, 0.05, Math.PI * 0.95);
    // the open sector is centred on +z, the chair's front (away from the stand's post)
    shell.scale(1, 1.25, 0.95);
    shell.translate(0, -1.15, 0);
    c.hang.sb.add(shell, "rattan", I);
    const cushion = new THREE.SphereGeometry(0.4, 20, 10);
    cushion.scale(1, 0.32, 0.95);
    cushion.translate(0, -1.55, 0.02);
    c.hang.sb.add(cushion, "cream", I);
    const back = new THREE.SphereGeometry(0.28, 16, 10);
    back.scale(1.1, 0.9, 0.45);
    back.translate(0, -1.25, -0.25);
    c.hang.sb.add(back, "teal", I);
  },
  swingBench(c) {
    // A-frame porch swing in teak; the bench hangs on four chains
    const { w, d } = c.it;
    const top = 2.1;
    for (const sx of [-1, 1]) {
      const x = sx * (w / 2 - 0.06);
      beam(c, "teak", 0.08, new THREE.Vector3(x, 0, -d / 2 + 0.05), new THREE.Vector3(x, top, 0));
      beam(c, "teak", 0.08, new THREE.Vector3(x, 0, d / 2 - 0.05), new THREE.Vector3(x, top, 0));
      beam(c, "teak", 0.06, new THREE.Vector3(x, 0.55, -d / 2 + 0.3), new THREE.Vector3(x, 0.55, d / 2 - 0.3));
    }
    beam(c, "teak", 0.1, new THREE.Vector3(-w / 2, top + 0.02, 0), new THREE.Vector3(w / 2, top + 0.02, 0));
    c.hang = { it: c.it, sb: new StaticBuilder(), hookY: top - 0.03, eye: [-0.3, 1.3 - (top - 0.03), 0.05] };
    const seatY = -(top - 0.03) + 0.45;
    for (const sx of [-0.62, 0.62]) {
      HC(c, "darkMetal", 0.008, -seatY - 0.02, sx, seatY + 0.02, 0.18);
      HC(c, "darkMetal", 0.008, -seatY - 0.44, sx, seatY + 0.44, -0.2);
    }
    HB(c, "teak", 1.4, 0.06, 0.5, 0, seatY, 0);
    HB(c, "teak", 1.4, 0.45, 0.05, 0, seatY + 0.06, -0.24);
    for (const sx of [-1, 1]) HB(c, "teak", 0.05, 0.22, 0.5, sx * 0.7, seatY + 0.06, 0);
    HB(c, "linen", 1.3, 0.08, 0.44, 0, seatY + 0.06, 0.01);
    HB(c, "teal", 0.4, 0.3, 0.1, -0.35, seatY + 0.14, -0.17);
    HB(c, "cream", 0.4, 0.3, 0.1, 0.35, seatY + 0.14, -0.17);
  },
  tvWall(c) {
    // fluted oak feature wall with the TV set into it and a warm LED line at the base
    const { w, h } = c.it;
    if (c.it.variant === "panel") {
      const base = -(c.it.elev ?? 1.45);
      const cw = 2.0;
      const side = (w - cw) / 2;
      B(c, "walnut", w, h, 0.03, 0, base, 0.015);
      B(c, "veneer", cw, h, 0.08, 0, base, 0.04);
      B(c, "darkMetal", 1.36, 1.36, 0.03, 0, base + 1.17, 0.095);
      P(c, "art2", 1.3, 1.3, 0, base + 1.85, 0.111);
      // black open shelving in the left recess, lit from above
      const sx = -(cw / 2 + side / 2);
      const sw = side - 0.18;
      for (const x of [-sw / 2, sw / 2]) B(c, "darkMetal", 0.02, 1.4, 0.02, sx + x, base + 1.0, 0.24);
      for (const y of [1.0, 1.47, 1.94, 2.4]) B(c, "darkMetal", sw, 0.02, 0.26, sx, base + y, 0.13);
      B(c, "glow", sw - 0.06, 0.006, 0.01, sx, base + 2.38, 0.2);
      C(c, "white", 0.05, 0.05, 0.14, sx - 0.15, base + 1.49, 0.13, 12);
      C(c, "glowWarm", 0.04, 0.04, 0.08, sx + 0.12, base + 1.49, 0.13, 12);
      B(c, "white", 0.2, 0.22, 0.14, sx + 0.12, base + 1.02, 0.12);
      B(c, "books", 0.06, 0.1, 0.2, sx - 0.12, base + 1.96, 0.13);
      return;
    }
    const base = -(c.it.elev ?? 1.3); // floor, relative to the wall item's centre height
    B(c, "walnut", w, h, 0.03, 0, base, 0.015);
    const tvW = 1.65;
    for (let x = -w / 2 + 0.03; x < w / 2 - 0.03; x += 0.06) {
      if (Math.abs(x) < tvW / 2 + 0.08) continue;
      B(c, "oakWood", 0.035, h - 0.04, 0.025, x + 0.0175, base + 0.02, 0.04);
    }
    B(c, "oakWood", tvW + 0.16, h - 0.04, 0.012, 0, base + 0.02, 0.036);
    B(c, "darkMetal", tvW, 0.95, 0.04, 0, base + 0.95, 0.062);
    B(c, "darkGlass", tvW - 0.03, 0.92, 0.005, 0, base + 0.965, 0.085);
    B(c, "glow", w - 0.1, 0.012, 0.012, 0, base + 0.62, 0.05);
  },
  accentWall(c) {
    // a painted or panelled feature wall; origin on the wall face at its centre height
    const { w, h } = c.it;
    const v = c.it.variant;
    const base = -h / 2;
    if (v === "charcoal") {
      B(c, "charcoal", w, h, 0.012, 0, base, 0.006);
      return;
    }
    if (v === "terracotta") {
      B(c, "terracotta", w, h, 0.012, 0, base, 0.006);
      const n = 5;
      const bw = 0.62;
      const x0 = 0.1 - (n * bw) / 2;
      const z0 = base + 1.62;
      const bh = 0.5;
      for (let i = 0; i < n; i++) {
        const x = x0 + bw * (i + 0.5);
        B(c, "white", bw - 0.01, 0.02, 0.3, x, z0, 0.16);
        B(c, "white", bw - 0.01, 0.02, 0.3, x, z0 + bh - 0.02, 0.16);
        B(c, "white", bw - 0.01, 0.015, 0.3, x, z0 + bh / 2, 0.16);
        B(c, "white", 0.02, bh, 0.3, x - bw / 2 + 0.01, z0, 0.16);
        P(c, "books", bw - 0.14, 0.2, x, z0 + 0.12, 0.2, true);
      }
      B(c, "white", 0.02, bh, 0.3, x0 + n * bw - 0.01, z0, 0.16);
      for (const x of [x0 + 0.3, x0 + n * bw - 0.3]) C(c, "white", 0.006, 0.006, -base + h / 2 - (z0 + bh - base) + 0.0, x, z0 + bh, 0.16, 6);
      return;
    }
    if (v === "orangeArc") {
      // cream panelling with an orange arch behind each bed and a reading light either side
      B(c, "white", w, h, 0.012, 0, base, 0.006);
      for (const x of [1.15, -0.95]) {
        const aw = 1.35;
        B(c, "orangePaint", aw, 1.45, 0.018, x, base, 0.012);
        const arch = new THREE.CircleGeometry(aw / 2, 40, 0, Math.PI);
        arch.translate(x, base + 1.45, 0.021);
        G(c, arch, "orangePaint");
        for (const sx of [-0.45, 0.45]) {
          B(c, "white", 0.08, 0.12, 0.1, x + sx, base + 1.2, 0.06);
          B(c, "glow", 0.06, 0.02, 0.06, x + sx, base + 1.18, 0.08);
        }
      }
      return;
    }
  },
  poojaUnit(c) {
    // open wooden mandir: drawers below, an arched, back-lit shrine above, brass bells and diyas
    const { w, d } = c.it;
    B(c, "teak", w, 0.85, d, 0, 0, 0);
    for (const y of [0.3, 0.58]) B(c, "darkMetal", w - 0.06, 0.005, 0.005, 0, y, d / 2);
    for (const sx of [-0.25, 0.25]) B(c, "brass", 0.12, 0.02, 0.02, sx * w, 0.45, d / 2 + 0.01);
    B(c, "shade", w - 0.32, 1.15, 0.02, 0, 0.88, -d / 2 + 0.05);
    for (const sx of [-1, 1]) B(c, "teak", 0.14, 1.25, d - 0.1, sx * (w / 2 - 0.09), 0.85, -0.05);
    const arch = new THREE.TorusGeometry((w - 0.32) / 2, 0.05, 10, 32, Math.PI);
    arch.translate(0, 1.72, -0.02);
    c.sb.add(arch, "teak", c.M);
    B(c, "teak", w + 0.06, 0.16, d + 0.04, 0, 2.06, -0.02);
    B(c, "teak", w - 0.2, 0.18, 0.08, 0, 2.0, d / 2 - 0.04);
    // idol (abstract brass form) on a stepped platform
    B(c, "walnut", 0.5, 0.08, 0.32, 0, 0.85, -0.05);
    B(c, "walnut", 0.34, 0.08, 0.24, 0, 0.93, -0.07);
    C(c, "brass", 0.11, 0.14, 0.26, 0, 1.01, -0.08, 20);
    S(c, "brass", 0.1, 0, 1.36, -0.08, 1, 1.15, 1, 2);
    // bells
    for (const sx of [-1, 1]) {
      C(c, "brass", 0.005, 0.005, 0.24, sx * 0.4, 1.62, 0.05, 6);
      C(c, "brass", 0.025, 0.06, 0.09, sx * 0.4, 1.53, 0.05, 16);
    }
    // diyas with flames
    for (const sx of [-0.33, 0.33]) {
      C(c, "brass", 0.06, 0.04, 0.035, sx, 0.85, d / 2 - 0.12, 16);
      S(c, "glow", 0.016, sx, 0.91, d / 2 - 0.12, 0.8, 1.6, 0.8, 1);
    }
    // marigold garland along the arch
    for (let i = 0; i <= 14; i++) {
      const a = (i / 14) * Math.PI;
      const rr = (w - 0.32) / 2;
      S(c, "leather", 0.035, Math.cos(a) * rr, 1.72 + Math.sin(a) * rr - 0.06, 0.04, 1, 1, 1, 1);
    }
  },
  chimney(c) {
    // wall-mounted hood above a glass hob on the counter
    const { w } = c.it;
    const counter = 0.88 - (c.it.elev ?? 1.9);
    B(c, "darkMetal", w, 0.1, 0.5, 0, -0.3, 0.25);
    B(c, "darkGlass", w - 0.02, 0.32, 0.01, 0, -0.2, 0.495);
    B(c, "darkMetal", 0.3, 0.75, 0.25, 0, 0.12, 0.125);
    B(c, "glow", 0.5, 0.005, 0.03, 0, -0.302, 0.3);
    B(c, "darkGlass", 0.6, 0.012, 0.5, 0, counter, 0.3);
    for (const [x, z] of [[-0.15, 0.2], [0.15, 0.2], [-0.15, 0.4], [0.15, 0.4]]) C(c, "darkMetal", 0.07, 0.07, 0.012, x, counter + 0.012, z, 18);
  },
  cove(c) {
    // false ceiling: a dropped plaster border with a warm LED cove washing the ceiling
    const { w, d } = c.it;
    const top = CEILING_HEIGHT;
    const drop = 0.22;
    const band = 0.55;
    B(c, "ceiling", w, drop, band, 0, top - drop, -d / 2 + band / 2);
    B(c, "ceiling", w, drop, band, 0, top - drop, d / 2 - band / 2);
    B(c, "ceiling", band, drop, d - 2 * band, -w / 2 + band / 2, top - drop, 0);
    B(c, "ceiling", band, drop, d - 2 * band, w / 2 - band / 2, top - drop, 0);
    // lip and LED strip on the inner edge, facing up
    const lw = w - 2 * band;
    const ld = d - 2 * band;
    B(c, "ceiling", lw, 0.06, 0.03, 0, top - drop, -ld / 2 + 0.015);
    B(c, "ceiling", lw, 0.06, 0.03, 0, top - drop, ld / 2 - 0.015);
    B(c, "ceiling", 0.03, 0.06, ld, -lw / 2 + 0.015, top - drop, 0);
    B(c, "ceiling", 0.03, 0.06, ld, lw / 2 - 0.015, top - drop, 0);
    B(c, "glow", lw + 0.1, 0.01, 0.02, 0, top - drop + 0.05, -ld / 2 - 0.03);
    B(c, "glow", lw + 0.1, 0.01, 0.02, 0, top - drop + 0.05, ld / 2 + 0.03);
    B(c, "glow", 0.02, 0.01, ld + 0.1, -lw / 2 - 0.03, top - drop + 0.05, 0);
    B(c, "glow", 0.02, 0.01, ld + 0.1, lw / 2 + 0.03, top - drop + 0.05, 0);
  },
  washer(c) {
    const { w, d, h } = c.it;
    B(c, "white", w, h, d);
    for (const y of [0.42, 1.25]) {
      const g = new THREE.CylinderGeometry(0.2, 0.2, 0.02, 28);
      g.rotateX(Math.PI / 2);
      g.translate(0, y, d / 2);
      c.sb.add(g, "darkGlass", c.M);
    }
  },
};

export interface LightSpot {
  x: number;
  y: number;
  z: number;
  room: string;
  strength: number;
}

/** Builds every item into the static builder; returns lamp positions and the swings' moving parts. */
export function buildFurniture(sb: StaticBuilder, items: FurnitureDef[]): { lights: LightSpot[]; swings: SwingPart[] } {
  const lights: LightSpot[] = [];
  const swings: SwingPart[] = [];
  for (const it of items) {
    const room = roomById(it.room)!;
    const level = FLOOR_LEVEL[room.floor];
    const isWall = WALL_TYPES.includes(it.type);
    const M = placeMatrix(it.x, level + (isWall ? it.elev ?? 1.5 : 0), it.y, it.rot);
    const c: Ctx = { sb, M, it };
    builders[it.type]?.(c);
    if (c.hang) swings.push(c.hang);
    if (it.type === "pendant" || it.type === "chandelier") {
      lights.push({ x: it.x, y: level + 2.3, z: it.y, room: it.room, strength: it.type === "chandelier" ? 1.4 : 1 });
    }
  }
  return { lights, swings };
}

/** Every item as its own group named `item:<id>` (world space), for the Blender export. */
export function buildFurnitureItems(lib: MaterialLib, items: FurnitureDef[]): THREE.Group {
  const all = new THREE.Group();
  all.name = "furniture";
  for (const it of items) {
    const sb = new StaticBuilder();
    const { swings } = buildFurniture(sb, [it]);
    const g = new THREE.Group();
    g.name = `item:${it.id}`;
    sb.build(lib, g);
    for (const h of swings) {
      const hang = new THREE.Group();
      h.sb.build(lib, hang);
      hang.applyMatrix4(placeMatrix(h.it.x, FLOOR_LEVEL[roomById(h.it.room)!.floor] + h.hookY, h.it.y, h.it.rot));
      g.add(hang);
    }
    all.add(g);
  }
  return all;
}
