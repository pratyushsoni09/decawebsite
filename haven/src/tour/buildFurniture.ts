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

const hash = (s: string) => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);

const builders: Partial<Record<FurnitureDef["type"], (c: Ctx) => void>> = {
  sofa(c) {
    const { w, d } = c.it;
    const mat: MatKey = c.it.variant === "cognac" ? "leather" : c.it.variant === "linen" ? "linen" : "cream";
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
    if (mat !== "leather") for (const sx of [-1, 1]) B(c, "teal", 0.42, 0.36, 0.12, sx * (w / 2 - 0.42), 0.56, -d / 2 + 0.36);
  },
  loungeChair(c) {
    const { w, d } = c.it;
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
    const seat: MatKey = c.it.room === "dining" ? "upholstery" : c.it.room === "kitchen" ? "oakWood" : "linen";
    legs(c, "walnut", 0.44, 0.44, 0.44, 0.035, 0.01);
    B(c, seat, 0.46, 0.06, 0.46, 0, 0.44, 0);
    B(c, seat, 0.46, 0.46, 0.05, 0, 0.5, -0.21);
  },
  deskChair(c) {
    legs(c, "walnut", 0.46, 0.46, 0.44, 0.035, 0.01);
    B(c, "leather", 0.5, 0.07, 0.48, 0, 0.44, 0);
    B(c, "walnut", 0.5, 0.36, 0.04, 0, 0.6, -0.22);
  },
  stool(c) {
    C(c, "brass", 0.025, 0.025, 0.7, 0, 0, 0, 8);
    C(c, "brass", 0.17, 0.17, 0.02, 0, 0, 0);
    C(c, "brass", 0.14, 0.14, 0.015, 0, 0.3, 0);
    C(c, "leather", 0.2, 0.19, 0.06, 0, 0.7, 0);
  },
  coffeeTable(c) {
    const { w, d, h } = c.it;
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
    const { w, d } = c.it;
    B(c, "oakWood", w - 0.1, 0.88, d - 0.25, 0, 0, -0.08);
    B(c, "marble", w, 0.04, d, 0, 0.88, 0);
    for (const sx of [-1, 1]) B(c, "marble", 0.04, 0.88, d, sx * (w / 2 - 0.02), 0, 0);
  },
  kitchenRun(c) {
    const { w, d } = c.it;
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
    B(c, "oakWood", w, h, d);
    B(c, "darkMetal", w - 0.06, 0.004, 0.005, 0, h * 0.55, d / 2);
    C(c, "brass", 0.06, 0.07, 0.24, 0.05, h, -0.04, 12);
    C(c, "shade", 0.09, 0.13, 0.18, 0.05, h + 0.24, -0.04, 16);
  },
  desk(c) {
    const { w, d } = c.it;
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
    if (c.it.variant === "media") {
      B(c, "walnut", w, 0.42, d, 0, 0.1, 0);
      legs(c, "brass", w - 0.1, d - 0.06, 0.1, 0.03);
      for (let i = 1; i < 4; i++) B(c, "darkMetal", 0.006, 0.36, 0.005, -w / 2 + (w / 4) * i, 0.13, d / 2);
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
    C(c, "brass", 0.16, 0.16, 0.025, 0, 0, 0, 20);
    C(c, "brass", 0.012, 0.012, 1.3, 0, 0.02, 0, 8);
    C(c, "shade", 0.15, 0.2, 0.28, 0, 1.3, 0, 20);
  },
  rug(c) {
    const { w, d } = c.it;
    const mat: MatKey = c.it.room === "entrance" || c.it.room === "lounge" ? "rugSand" : c.it.room === "library" || c.it.room === "bed4" ? "rugTeal" : "rug";
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
    const low = c.it.room === "kitchen" ? 2.2 : 2.35;
    C(c, "darkMetal", 0.006, 0.006, CEILING_HEIGHT - low - 0.25, 0, low + 0.25, 0, 4);
    C(c, "brass", 0.08, 0.08, 0.03, 0, CEILING_HEIGHT - 0.03, 0, 12);
    const dome = new THREE.SphereGeometry(0.28, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2);
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
    c.hang = { it: c.it, sb: new StaticBuilder(), hookY };
    HC(c, "darkMetal", 0.008, 0.5, 0, -0.5, 0);
    const shell = new THREE.SphereGeometry(0.5, 32, 18, Math.PI * 0.72, Math.PI * 1.56, 0.05, Math.PI * 0.95);
    shell.scale(1, 1.25, 0.95);
    shell.rotateY(Math.PI);
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
    c.hang = { it: c.it, sb: new StaticBuilder(), hookY: top - 0.03 };
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
