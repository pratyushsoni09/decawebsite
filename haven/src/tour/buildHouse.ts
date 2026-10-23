import * as THREE from "three";
import {
  CEILING_HEIGHT, DOOR_HEAD, FLOOR_LEVEL, FLOOR_TO_FLOOR, FOOTPRINT, STAIR, furniture, rooms,
  type FloorId, type FloorFinish,
} from "../data/houseLayout";
import {
  gardenFeatures, leafDir, leaves, resolvedDoors, resolvedOpenings, resolvedWindows, subtractRect, wallBoxes,
  type LeafGeom,
} from "../data/layoutGeometry";
import { StaticBuilder, boxAt, metricBox, planeAt } from "./geom";
import { buildFurniture, type LightSpot } from "./buildFurniture";
import type { MatKey, MaterialLib } from "./materials";

const FINISH: Record<FloorFinish, MatKey> = { oak: "oak", herringbone: "herringbone", stone: "stone", marble: "marble", tile: "tile" };
const ROOF = FLOOR_TO_FLOOR * 2;

export interface DoorLeafRuntime {
  geom: LeafGeom;
  pivot: THREE.Group;
  /** opening progress 0..1 (linear; eased when applied) */
  s: number;
  target: 0 | 1;
}

export interface HouseBuild {
  root: THREE.Group;
  leaves: DoorLeafRuntime[];
  lights: LightSpot[];
  sky: THREE.Mesh;
  /** logical meshes authored (before merging) */
  authoredMeshes: number;
  ceilingRooms: Set<string>;
}

type Step = (label: string) => Promise<void>;

/* ------------------------------------------------------------------ shell */

function buildFloorsAndCeilings(sb: StaticBuilder, ceilingRooms: Set<string>) {
  // ground slab / plinth under the whole footprint
  sb.add(boxAt(FOOTPRINT.x1, -0.45, FOOTPRINT.y1, FOOTPRINT.x2, 0, FOOTPRINT.y2), "stoneTrim");
  for (const rm of rooms) {
    const level = FLOOR_LEVEL[rm.floor];
    for (const rc of rm.rects) {
      const floorParts = rm.floor === 1 ? subtractRect(rc, STAIR.void) : [rc];
      for (const p of floorParts) sb.add(planeAt(p.x1, p.y1, p.x2, p.y2, level + 0.002), FINISH[rm.finish]);
      const ceilParts = rm.floor === 0 ? subtractRect(rc, STAIR.void) : [rc];
      for (const p of ceilParts) sb.add(planeAt(p.x1, p.y1, p.x2, p.y2, level + CEILING_HEIGHT, true), "ceiling");
      ceilingRooms.add(rm.id);
    }
  }
  // thresholds in door / opening cells
  for (const d of [...resolvedDoors, ...resolvedOpenings]) {
    const level = FLOOR_LEVEL[d.floor];
    const r = d.rect;
    const mat: MatKey = d.id === "front" || d.id === "stair-entrance" ? "stone" : d.id === "garden" ? "stoneTrim" : "oak";
    sb.add(planeAt(r.x1, r.y1, r.x2, r.y2, level + 0.003), mat);
  }
  // slab edges around the stair void (between ground ceiling and first floor)
  const v = STAIR.void;
  sb.add(boxAt(v.x1, CEILING_HEIGHT, v.y2, v.x2, FLOOR_TO_FLOOR, v.y2 + 0.04), "ceiling");
  sb.add(boxAt(v.x1 - 0.04, CEILING_HEIGHT, v.y1, v.x1, FLOOR_TO_FLOOR, v.y2), "ceiling");
  sb.add(boxAt(v.x2, CEILING_HEIGHT, v.y1, v.x2 + 0.04, FLOOR_TO_FLOOR, v.y2), "ceiling");
}

function buildWalls(sb: StaticBuilder) {
  for (const floor of [0, 1] as FloorId[]) {
    const level = FLOOR_LEVEL[floor];
    for (const b of wallBoxes(floor)) {
      for (const [a, top] of b.segments) sb.add(boxAt(b.x1, level + a, b.y1, b.x2, level + top, b.y2), "plaster");
    }
  }
}

function buildWindows(sb: StaticBuilder) {
  const F = 0.055; // frame member
  for (const w of resolvedWindows) {
    const level = FLOOR_LEVEL[w.floor];
    const r = w.rect;
    const ns = w.side === "N" || w.side === "S";
    const y0 = level + w.sill;
    const y1 = level + w.head;
    // centre plane of the wall
    const c = ns ? (r.y1 + r.y2) / 2 : (r.x1 + r.x2) / 2;
    const a = ns ? r.x1 : r.y1;
    const b = ns ? r.x2 : r.y2;
    const frame = (p1: number, q1: number, p2: number, q2: number, mat: MatKey, depth = 0.09) =>
      sb.add(ns ? boxAt(p1, q1, c - depth / 2, p2, q2, c + depth / 2) : boxAt(c - depth / 2, q1, p1, c + depth / 2, q2, p2), mat);
    frame(a, y0, b, y0 + F, "bronze");
    frame(a, y1 - F, b, y1, "bronze");
    frame(a, y0, a + F, y1, "bronze");
    frame(b - F, y0, b, y1, "bronze");
    const width = b - a;
    const mullions = width > 2.2 ? 2 : width > 1.25 ? 1 : 0;
    for (let i = 1; i <= mullions; i++) {
      const m = a + (width / (mullions + 1)) * i;
      frame(m - F / 2, y0, m + F / 2, y1, "bronze");
    }
    if (w.head - w.sill > 2.2) frame(a, y1 - 0.62, b, y1 - 0.62 + F * 0.8, "bronze");
    frame(a + F, y0 + F, b - F, y1 - F, "glass", 0.012);
    // stone sill outside, oak sill inside
    const ext = w.side === "N" ? -1 : w.side === "S" ? 1 : w.side === "W" ? -1 : 1;
    const outer = ns ? (ext > 0 ? r.y2 : r.y1) : ext > 0 ? r.x2 : r.x1;
    if (w.sill > 0.05) {
      if (ns) sb.add(boxAt(a - 0.05, y0 - 0.06, Math.min(outer, outer + ext * 0.06), b + 0.05, y0, Math.max(outer, outer + ext * 0.06)), "stoneTrim");
      else sb.add(boxAt(Math.min(outer, outer + ext * 0.06), y0 - 0.06, a - 0.05, Math.max(outer, outer + ext * 0.06), y0, b + 0.05), "stoneTrim");
    }
  }
}

/* ------------------------------------------------------------------ stair */

function rail(sb: StaticBuilder, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, balusters = true) {
  // handrail along the segment at the given heights (y = top of rail); balusters drop 0.9 m to the walking line
  const p1 = new THREE.Vector3(x1, y1, z1);
  const p2 = new THREE.Vector3(x2, y2, z2);
  const len = p1.distanceTo(p2);
  const g = metricBox(0.06, 0.05, len);
  const m = new THREE.Matrix4().lookAt(p2, p1, new THREE.Vector3(0, 1, 0));
  m.setPosition(p1.clone().add(p2).multiplyScalar(0.5).add(new THREE.Vector3(0, -0.025, 0)));
  sb.add(g, "oakWood", m);
  if (!balusters) return;
  const n = Math.max(2, Math.floor(len / 0.12));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x1 + (x2 - x1) * t;
    const z = z1 + (z2 - z1) * t;
    const top = y1 + (y2 - y1) * t - 0.05;
    sb.add(boxAt(x - 0.01, top - 0.88, z - 0.01, x + 0.01, top, z + 0.01), "bronze");
  }
}

function buildStair(sb: StaticBuilder) {
  const { flight1, flight2, yFoot, yLanding, yNorth, going, rise } = STAIR;
  const HALF = FLOOR_TO_FLOOR / 2;
  const nose = 0.025;
  // flight 1 (rising north)
  for (let i = 1; i <= 9; i++) {
    const zA = yFoot - i * going;
    const zB = yFoot - (i - 1) * going;
    const top = rise * i;
    sb.add(boxAt(flight1.x1, 0, zA, flight1.x2, top - 0.04, zB), "white");
    sb.add(boxAt(flight1.x1, top - 0.04, zA, flight1.x2, top, zB + nose), "oakWood");
  }
  // half landing
  sb.add(boxAt(flight1.x1, 0, yNorth, flight2.x2, HALF - 0.04, yLanding), "white");
  sb.add(boxAt(flight1.x1, HALF - 0.04, yNorth, flight2.x2, HALF, yLanding + nose), "oakWood");
  // flight 2 (rising south)
  for (let k = 1; k <= 9; k++) {
    const zA = yLanding + (k - 1) * going;
    const zB = yLanding + k * going;
    const top = HALF + rise * k;
    sb.add(boxAt(flight2.x1, 0, zA, flight2.x2, top - 0.04, zB), "white");
    sb.add(boxAt(flight2.x1, top - 0.04, zA - nose, flight2.x2, top, zB), "oakWood");
  }
  // spine wall between flights (plastered, oak capped up to the guard line)
  sb.add(boxAt(flight1.x2, 0, yLanding, flight2.x1, 0.3, yFoot), "white");
  // balustrades: rail 0.9 m above the pitch line
  const H = 0.95;
  const pitch1 = (z: number) => HALF * ((yFoot - z) / (yFoot - yLanding));
  const pitch2 = (z: number) => HALF + HALF * ((z - yLanding) / (yFoot - yLanding));
  rail(sb, flight1.x1 - 0.03, pitch1(yFoot) + H, yFoot, flight1.x1 - 0.03, pitch1(yLanding) + H, yLanding);
  rail(sb, (flight1.x2 + flight2.x1) / 2, pitch1(yFoot) + H, yFoot, (flight1.x2 + flight2.x1) / 2, HALF + H, yLanding);
  rail(sb, flight2.x2 + 0.03, pitch2(yLanding) + H, yLanding, flight2.x2 + 0.03, pitch2(yFoot) + H, yFoot);
  // half-landing side guards
  rail(sb, flight1.x1 - 0.03, HALF + H, yLanding, flight1.x1 - 0.03, HALF + H, yNorth + 0.05);
  rail(sb, flight2.x2 + 0.03, HALF + H, yLanding, flight2.x2 + 0.03, HALF + H, yNorth + 0.05);
  // first-floor gallery guard around the void
  const v = STAIR.void;
  const top = FLOOR_TO_FLOOR + 1.0;
  rail(sb, v.x1 + 0.03, top, v.y2 - 0.03, flight2.x1 - 0.02, top, v.y2 - 0.03);
  rail(sb, v.x1 + 0.03, top, v.y2 - 0.03, v.x1 + 0.03, top, v.y1 + 0.05);
  rail(sb, v.x2 - 0.03, top, v.y2 - 0.03, v.x2 - 0.03, top, v.y1 + 0.05);
  // newel posts
  for (const [x, z, h] of [[flight1.x1 - 0.03, yFoot, 1.05], [flight2.x1 - 0.1, yFoot, FLOOR_TO_FLOOR + 1.05]] as const) {
    sb.add(boxAt(x - 0.05, h > 2 ? FLOOR_TO_FLOOR : 0, z - 0.05, x + 0.05, h, z + 0.05), "oakWood");
  }
}

/* ------------------------------------------------------------------ doors */

function buildLeaf(lib: MaterialLib, l: LeafGeom, height: number): THREE.Group {
  const g = new THREE.Group();
  const T = 0.045;
  const L = l.length - 0.01;
  const front = l.doorId === "front";
  if (l.glazed) {
    const F = 0.08;
    const mk = (w: number, h: number, x: number, y: number, mat: THREE.Material, d = T) => {
      const m = new THREE.Mesh(metricBox(w, h, d), mat);
      m.position.set(x, y, 0);
      m.castShadow = mat !== lib.glass;
      g.add(m);
    };
    mk(L, F, L / 2, height - F / 2, lib.bronze);
    mk(L, F * 1.6, L / 2, F * 0.8, lib.bronze);
    mk(F, height, F / 2, height / 2, lib.bronze);
    mk(F, height, L - F / 2, height / 2, lib.bronze);
    mk(L - 2 * F, height - 2.6 * F, L / 2, height / 2 + 0.3 * F, lib.glass, 0.012);
  } else {
    const body = new THREE.Mesh(metricBox(L, height, T), front ? lib.oakVertical : lib.oakWood);
    body.position.set(L / 2, height / 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);
    if (front) {
      for (let i = 1; i < 6; i++) {
        const groove = new THREE.Mesh(metricBox(0.008, height - 0.2, T + 0.004), lib.walnut);
        groove.position.set((L / 6) * i, height / 2, 0);
        g.add(groove);
      }
    }
  }
  // handles on both faces
  const hl = front ? 0.9 : 0.14;
  for (const side of [-1, 1]) {
    const h = new THREE.Mesh(metricBox(0.025, hl, 0.025), lib.brass);
    h.position.set(L - 0.09, front ? 1.15 : 1.0, side * (T / 2 + 0.035));
    g.add(h);
  }
  return g;
}

function buildDoors(lib: MaterialLib, root: THREE.Group): DoorLeafRuntime[] {
  return leaves.map((l) => {
    const pivot = new THREE.Group();
    pivot.position.set(l.hx, FLOOR_LEVEL[l.floor] + 0.01, l.hy);
    const leaf = buildLeaf(lib, l, DOOR_HEAD - 0.06);
    // keep the leaf's thickness on the non-swing side of the hinge line
    const [dx, dy] = leafDir(l, 0);
    const psi = Math.atan2(-dy, dx);
    const sgn = Math.sin(psi) * l.nx + Math.cos(psi) * l.ny;
    leaf.position.z = -sgn * 0.03;
    pivot.add(leaf);
    pivot.rotation.y = psi;
    pivot.userData.leafDoor = l.doorId;
    root.add(pivot);
    return { geom: l, pivot, s: 0, target: 0 as const };
  });
}

/** Apply a leaf's pose for its current progress. */
export function poseLeaf(rt: DoorLeafRuntime) {
  const t = easeInOut(rt.s);
  const [dx, dy] = leafDir(rt.geom, t);
  rt.pivot.rotation.y = Math.atan2(-dy, dx);
}

export const easeInOut = (s: number) => (s < 0.5 ? 2 * s * s : 1 - Math.pow(-2 * s + 2, 2) / 2);

/* ------------------------------------------------------------------ exterior */

function buildExterior(sb: StaticBuilder) {
  const { x1, y1, x2, y2 } = FOOTPRINT;
  // lawn + terrace
  sb.add(planeAt(-140, -140, 180, 160, -0.02), "grass");
  sb.add(boxAt(x1 - 2.2, -0.45, y1 - 2.2, x2 + 2.2, -0.005, y2 + 1.4), "terrace");
  sb.add(boxAt(x2 + 2.2, -0.45, 9.6, x2 + 6, -0.005, 18.6), "terrace"); // east dining terrace
  // stepping-stone path to the front door
  for (let z = y2 + 2.1, i = 0; z < 38; z += 0.92, i++) {
    const w = i % 2 ? 1.3 : 1.5;
    sb.add(boxAt(20 - w / 2, -0.03, z, 20 + w / 2, 0.015, z + 0.58), "pathStone");
  }
  // plinth, string course and parapet
  const band = (yA: number, yB: number, out: number, mat: MatKey) => {
    sb.add(boxAt(x1 - out, yA, y1 - out, x2 + out, yB, y1), mat);
    sb.add(boxAt(x1 - out, yA, y2, x2 + out, yB, y2 + out), mat);
    sb.add(boxAt(x1 - out, yA, y1, x1, yB, y2), mat);
    sb.add(boxAt(x2, yA, y1, x2 + out, yB, y2), mat);
  };
  // plinth, interrupted at the front and garden doors
  const P = 0.32;
  const o = 0.04;
  const fr = resolvedDoors.find((d) => d.id === "front")!.rect;
  const gd = resolvedDoors.find((d) => d.id === "garden")!.rect;
  sb.add(boxAt(x1 - o, 0, y1 - o, x2 + o, P, y1), "stoneTrim");
  sb.add(boxAt(x1 - o, 0, y2, fr.x1 - 0.45, P, y2 + o), "stoneTrim");
  sb.add(boxAt(fr.x2 + 0.45, 0, y2, x2 + o, P, y2 + o), "stoneTrim");
  sb.add(boxAt(x1 - o, 0, y1, x1, P, y2), "stoneTrim");
  sb.add(boxAt(x2, 0, y1, x2 + o, P, gd.y1), "stoneTrim");
  sb.add(boxAt(x2, 0, gd.y2, x2 + o, P, y2), "stoneTrim");
  band(FLOOR_TO_FLOOR - 0.12, FLOOR_TO_FLOOR + 0.06, 0.05, "stoneTrim");
  sb.add(boxAt(x1, ROOF, y1, x2, ROOF + 0.25, y2), "plaster");
  band(ROOF + 0.25, ROOF + 0.85, 0, "plaster");
  sb.add(boxAt(x1 + 0.35, ROOF + 0.25, y1 + 0.35, x2 - 0.35, ROOF + 0.85, y1 + 0.35 + 0.001), "plaster");
  band(ROOF + 0.85, ROOF + 0.93, 0.06, "stoneTrim");
  // central bay: vertical oak cladding on the south face, where the wall is solid
  for (const floor of [0, 1] as FloorId[]) {
    const level = FLOOR_LEVEL[floor];
    for (const b of wallBoxes(floor)) {
      if (b.y2 !== y2 || b.x1 < 13 - 0.7 || b.x2 > 27 + 0.7) continue;
      for (const [a, top] of b.segments) {
        const lo = level + Math.max(a, floor === 0 ? 0.32 : 0.06);
        const hi = level + Math.min(top, floor === 0 ? FLOOR_TO_FLOOR - 0.12 : FLOOR_TO_FLOOR);
        if (hi - lo < 0.1) continue;
        for (let x = b.x1 + 0.02; x + 0.09 <= b.x2; x += 0.13) sb.add(boxAt(x, lo, y2, x + 0.09, hi, y2 + 0.05), "oakVertical");
      }
    }
  }
  // stone portal around the front door
  const front = resolvedDoors.find((d) => d.id === "front")!;
  const fx1 = front.rect.x1;
  const fx2 = front.rect.x2;
  sb.add(boxAt(fx1 - 0.45, 0, y2, fx1, DOOR_HEAD + 0.55, y2 + 0.2), "stoneTrim");
  sb.add(boxAt(fx2, 0, y2, fx2 + 0.45, DOOR_HEAD + 0.55, y2 + 0.2), "stoneTrim");
  sb.add(boxAt(fx1 - 0.6, DOOR_HEAD, y2, fx2 + 0.6, DOOR_HEAD + 0.62, y2 + 0.28), "stoneTrim");
  sb.add(boxAt(fx1 - 0.9, -0.02, y2, fx2 + 0.9, 0.06, y2 + 1.3), "stoneTrim");
  // wall lanterns either side of the portal
  for (const x of [fx1 - 0.85, fx2 + 0.85]) {
    sb.add(boxAt(x - 0.09, 1.7, y2, x + 0.09, 2.15, y2 + 0.16), "bronze");
    sb.add(boxAt(x - 0.06, 1.76, y2 + 0.02, x + 0.06, 2.08, y2 + 0.17), "glow");
  }
  // garden
  for (const gf of gardenFeatures) {
    if (gf.type === "boxBall") {
      const g = new THREE.IcosahedronGeometry(gf.r, 2);
      g.translate(gf.x, gf.r * 0.92, gf.y);
      sb.add(g, "boxwood");
      const pot = new THREE.CylinderGeometry(gf.r * 0.7, gf.r * 0.6, 0.12, 16);
      pot.translate(gf.x, 0.06, gf.y);
      sb.add(pot, "stoneTrim");
    } else if (gf.type === "hedge") {
      sb.add(boxAt(gf.x - gf.w! / 2, 0, gf.y - gf.d! / 2, gf.x + gf.w! / 2, 0.85, gf.y + gf.d! / 2), "boxwood");
    } else {
      const trunk = new THREE.CylinderGeometry(0.16, 0.24, 4.2, 8);
      trunk.translate(gf.x, 2.1, gf.y);
      sb.add(trunk, "bark");
      for (let i = 0; i < 7; i++) {
        const a = i * 2.3 + gf.x;
        const c = new THREE.IcosahedronGeometry(1.5 + (i % 3) * 0.35, 1);
        c.translate(gf.x + Math.cos(a) * 1.3, 5.2 + (i % 3) * 0.7, gf.y + Math.sin(a) * 1.3);
        sb.add(c, "leaf");
      }
    }
  }
  // distant tree line
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2;
    const r = 70 + ((i * 53) % 17);
    const x = 20 + Math.cos(a) * r;
    const z = 9 + Math.sin(a) * r;
    const s = 3 + ((i * 31) % 5);
    const c = new THREE.IcosahedronGeometry(s, 1);
    c.scale(1, 1.25, 1);
    c.translate(x, s * 1.1, z);
    sb.add(c, i % 3 ? "leaf" : "olive");
  }
}

/* ------------------------------------------------------------------ sky */

export const SKY_PRESETS = {
  day: { top: "#8fb3cf", horizon: "#f1e3cb", sun: "#fff1d6", sunDir: [-0.55, 0.42, 0.72] },
  golden: { top: "#6a8fb5", horizon: "#f2c592", sun: "#ffd58f", sunDir: [-0.62, 0.2, 0.76] },
  dusk: { top: "#1d2a40", horizon: "#c98a6a", sun: "#ffb27a", sunDir: [-0.7, 0.03, 0.71] },
};
export type SkyPreset = keyof typeof SKY_PRESETS;

export function createSky(preset: SkyPreset = "day") {
  const p = SKY_PRESETS[preset];
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(p.top) },
      horizon: { value: new THREE.Color(p.horizon) },
      sunColor: { value: new THREE.Color(p.sun) },
      sunDir: { value: new THREE.Vector3(...p.sunDir).normalize() },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 sunColor; uniform vec3 sunDir; varying vec3 vDir;
      void main(){
        float h = clamp(vDir.y, -0.2, 1.0);
        vec3 col = mix(horizon, top, pow(max(h, 0.0), 0.55));
        float s = max(dot(normalize(vDir), sunDir), 0.0);
        col += sunColor * (pow(s, 220.0) * 1.6 + pow(s, 8.0) * 0.28);
        if (h < 0.0) col = mix(horizon, vec3(0.42,0.45,0.33), clamp(-h*6.0,0.0,1.0));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), mat);
  sky.position.set(20, 0, 9);
  sky.name = "sky";
  return sky;
}

export function setSky(sky: THREE.Mesh, preset: SkyPreset) {
  const p = SKY_PRESETS[preset];
  const u = (sky.material as THREE.ShaderMaterial).uniforms;
  u.top.value.set(p.top);
  u.horizon.value.set(p.horizon);
  u.sunColor.value.set(p.sun);
  u.sunDir.value.set(...(p.sunDir as [number, number, number])).normalize();
}

/* ------------------------------------------------------------------ assemble */

export async function buildHouse(lib: MaterialLib, step: Step): Promise<HouseBuild> {
  const root = new THREE.Group();
  root.name = "house";
  const sb = new StaticBuilder();
  const ceilingRooms = new Set<string>();

  buildFloorsAndCeilings(sb, ceilingRooms);
  await step("Floors and ceilings");
  buildWalls(sb);
  await step("Walls, both floors");
  buildWindows(sb);
  await step("Bronze windows");
  buildStair(sb);
  await step("Oak staircase");
  const lights = buildFurniture(sb, furniture.filter((f) => rooms.find((r) => r.id === f.room)!.floor === 0));
  await step("Ground-floor furniture");
  lights.push(...buildFurniture(sb, furniture.filter((f) => rooms.find((r) => r.id === f.room)!.floor === 1)));
  await step("First-floor furniture");
  buildExterior(sb);
  await step("Garden and façade");
  const authoredMeshes = sb.meshCount;
  sb.build(lib, root);
  const leafRuntimes = buildDoors(lib, root);
  await step("Doors");
  const sky = createSky("day");
  root.add(sky);
  return { root, leaves: leafRuntimes, lights, sky, authoredMeshes: authoredMeshes + leafRuntimes.length, ceilingRooms };
}
