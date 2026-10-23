import * as THREE from "three";
import {
  BALCONY, CEILING_HEIGHT, DOOR_HEAD, FLOOR_TO_FLOOR, FOOTPRINT, RESIDENCE_ELEVATION, TOWER, furniture, rooms,
  type FloorFinish,
} from "../data/houseLayout";
import {
  BALUSTRADE_T, isFacadeBox, leafDir, leaves, resolvedDoors, resolvedOpenings, resolvedWindows, wallBoxes,
  type LeafGeom, type WallBox,
} from "../data/layoutGeometry";
import { StaticBuilder, boxAt, metricBox, planeAt, placeMatrix } from "./geom";
import { buildFurniture, type LightSpot } from "./buildFurniture";
import type { MatKey, MaterialLib } from "./materials";

const FINISH: Record<FloorFinish, MatKey> = { oak: "oak", herringbone: "herringbone", stone: "stone", marble: "marble", tile: "tile", teak: "teak" };
const E = RESIDENCE_ELEVATION;
const H = FLOOR_TO_FLOOR;
const SLAB = H - CEILING_HEIGHT; // 0.3 m structural slab
const TOP = TOWER.storeys * H;
const levelZ = (level: number) => (level - 1) * H;

export interface DoorLeafRuntime {
  geom: LeafGeom;
  pivot: THREE.Group;
  /** opening progress 0..1 (linear; eased when applied) */
  s: number;
  target: 0 | 1;
}

export interface SwingRuntime {
  pivot: THREE.Group;
  phase: number;
  amp: number;
}

export interface HouseBuild {
  root: THREE.Group;
  leaves: DoorLeafRuntime[];
  swings: SwingRuntime[];
  lights: LightSpot[];
  sky: THREE.Mesh;
  authoredMeshes: number;
  ceilingRooms: Set<string>;
}

type Step = (label: string) => Promise<void>;

/* ------------------------------------------------------------------ residence 11A */

function buildResidenceShell(sb: StaticBuilder, ceilingRooms: Set<string>) {
  for (const rm of rooms) {
    for (const rc of rm.rects) {
      sb.add(planeAt(rc.x1, rc.y1, rc.x2, rc.y2, E + 0.002), FINISH[rm.finish]);
      if (rm.kind !== "outdoor") {
        sb.add(planeAt(rc.x1, rc.y1, rc.x2, rc.y2, E + CEILING_HEIGHT, true), "ceiling");
        ceilingRooms.add(rm.id);
      }
    }
  }
  for (const d of [...resolvedDoors, ...resolvedOpenings]) {
    const mat: MatKey = d.id === "front" ? "stone" : "oak";
    sb.add(planeAt(d.rect.x1, d.rect.y1, d.rect.x2, d.rect.y2, E + 0.003), mat);
  }
  for (const b of wallBoxes(0)) {
    for (const [a, top] of b.segments) sb.add(boxAt(b.x1, E + a, b.y1, b.x2, E + Math.min(top, CEILING_HEIGHT + 0.001), b.y2), "plaster");
  }
  for (const w of resolvedWindows) windowFrame(sb, w.rect, w.side, E + w.sill, E + w.head, false);
}

/* ------------------------------------------------------------------ façade pieces */

type Side = "N" | "S" | "E" | "W";

function sideOf(b: { x1: number; y1: number; x2: number; y2: number }): Side {
  if (b.y1 <= FOOTPRINT.y1 + 1e-6) return "N";
  if (b.y2 >= FOOTPRINT.y2 - 1e-6) return "S";
  if (b.x1 <= FOOTPRINT.x1 + 1e-6) return "W";
  return "E";
}

/** Bronze frame + glass in the wall's centre plane; optionally a curtain just inside (other storeys). */
function windowFrame(sb: StaticBuilder, r: { x1: number; y1: number; x2: number; y2: number }, side: Side, y0: number, y1: number, curtain: boolean, lit = false) {
  const F = 0.05;
  const ns = side === "N" || side === "S";
  const c = ns ? (r.y1 + r.y2) / 2 : (r.x1 + r.x2) / 2;
  const a = ns ? r.x1 : r.y1;
  const b = ns ? r.x2 : r.y2;
  const frame = (p1: number, q1: number, p2: number, q2: number, mat: MatKey, depth = 0.08, off = 0) =>
    sb.add(ns ? boxAt(p1, q1, c + off - depth / 2, p2, q2, c + off + depth / 2) : boxAt(c + off - depth / 2, q1, p1, c + off + depth / 2, q2, p2), mat);
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
  frame(a + F, y0 + F, b - F, y1 - F, "glass", 0.012);
  if (curtain) {
    const inward = side === "N" || side === "W" ? 1 : -1;
    frame(a + 0.02, y0 + 0.02, b - 0.02, y1 - 0.02, lit ? "curtainLit" : "curtain", 0.01, inward * 0.12);
  }
}

/** Glass balustrade (bronze cap) around a balcony at floor height z. */
function balustrade(sb: StaticBuilder, z: number) {
  const top = z + 1.08;
  const y2 = BALCONY.y2;
  const t = BALUSTRADE_T;
  // south
  sb.add(boxAt(FOOTPRINT.x1, z + 0.05, y2 + t / 2 - 0.006, FOOTPRINT.x2, top - 0.04, y2 + t / 2 + 0.006), "glass");
  sb.add(boxAt(FOOTPRINT.x1, top - 0.04, y2, FOOTPRINT.x2, top, y2 + t), "bronze");
  // sides
  for (const x of [FOOTPRINT.x1 + 0.15, FOOTPRINT.x2 - 0.15]) {
    sb.add(boxAt(x - 0.006, z + 0.05, BALCONY.y1, x + 0.006, top - 0.04, y2 + t), "glass");
    sb.add(boxAt(x - 0.075, top - 0.04, BALCONY.y1, x + 0.075, top, y2 + t), "bronze");
  }
  // posts
  for (let x = FOOTPRINT.x1 + 0.1; x <= FOOTPRINT.x2; x += 2.4) sb.add(boxAt(x - 0.025, z, y2, x + 0.025, top, y2 + t), "bronze");
}

function slab(sb: StaticBuilder, z: number) {
  // floor plate + balcony slab, with a crisp white edge band
  sb.add(boxAt(FOOTPRINT.x1 - 0.06, z - SLAB, FOOTPRINT.y1 - 0.06, FOOTPRINT.x2 + 0.06, z, FOOTPRINT.y2), "concrete");
  sb.add(boxAt(FOOTPRINT.x1 - 0.06, z - SLAB + 0.05, FOOTPRINT.y2, FOOTPRINT.x2 + 0.06, z, BALCONY.y2 + BALUSTRADE_T + 0.06), "concrete");
}

/** Façade-only shell of a storey that isn't the walkable residence. */
function buildStorey(sb: StaticBuilder, level: number, seed: number) {
  const z = levelZ(level);
  let k = seed;
  const rnd = () => ((k = (k * 16807) % 2147483647) / 2147483647);
  for (const b of wallBoxes(0)) {
    if (!isFacadeBox(b)) continue;
    const side = sideOf(b);
    if (b.type === "door") {
      sb.add(boxAt(b.x1, z + DOOR_HEAD, b.y1, b.x2, z + CEILING_HEIGHT, b.y2), "plaster");
      windowFrame(sb, b, side, z + 0.02, z + DOOR_HEAD, true, rnd() > 0.55);
      continue;
    }
    for (const [a, top] of (b as WallBox).segments) sb.add(boxAt(b.x1, z + a, b.y1, b.x2, z + Math.min(top, CEILING_HEIGHT), b.y2), "plaster");
    if (b.type === "window") {
      const w = resolvedWindows[Number(b.ref)];
      windowFrame(sb, b, side, z + w.sill, z + w.head, true, rnd() > 0.55);
    }
  }
  // dark interior volume so nothing reads as hollow through the glass
  sb.add(boxAt(0.5, z + 0.01, 0.5, 23.5, z + CEILING_HEIGHT - 0.01, 15.5), "darkGlass");
  balustrade(sb, z);
  // a few planters on every other balcony
  if (level % 2 === 0) for (const x of [3 + (level % 3), 12, 20 - (level % 4)]) sb.add(boxAt(x - 0.7, z, 17.8, x + 0.7, z + 0.5, 18.25), "concrete");
}

function buildLobby(sb: StaticBuilder) {
  // double-glazed ground floor: bronze mullions, lit interior, entrance canopy
  const z = 0;
  sb.add(boxAt(1.0, z, 1.0, 23.0, z + CEILING_HEIGHT, 15.0), "stoneTrim");
  sb.add(boxAt(0.6, z, 0.6, 23.4, z + 0.02, 15.4), "stone");
  for (const side of ["N", "S", "E", "W"] as Side[]) {
    const ns = side === "N" || side === "S";
    const len = ns ? FOOTPRINT.x2 : FOOTPRINT.y2;
    const c = side === "N" ? 0.3 : side === "S" ? FOOTPRINT.y2 - 0.3 : side === "W" ? 0.3 : FOOTPRINT.x2 - 0.3;
    for (let p = 0; p < len - 0.01; p += 2) {
      const r = ns ? { x1: p, x2: p + 2, y1: c - 0.15, y2: c + 0.15 } : { y1: p, y2: p + 2, x1: c - 0.15, x2: c + 0.15 };
      windowFrame(sb, r, side, z, z + CEILING_HEIGHT, false);
    }
  }
  // canopy over the entrance (south)
  sb.add(boxAt(8.5, CEILING_HEIGHT - 0.1, FOOTPRINT.y2, 15.5, CEILING_HEIGHT + 0.15, 21.5), "concrete");
  for (const x of [8.8, 15.2]) sb.add(boxAt(x - 0.12, 0, 21.0, x + 0.12, CEILING_HEIGHT - 0.1, 21.24), "bronze");
  // lit lobby
  sb.add(boxAt(10, 0.02, 7, 14, 0.9, 8.2), "oakWood");
  sb.add(boxAt(3, 2.6, 3, 21, 2.62, 13), "glow");
}

function buildFins(sb: StaticBuilder) {
  // vertical oak fins on the north, east and west faces, running the full height
  const z0 = H;
  const z1 = TOP;
  for (let x = 1.0; x < FOOTPRINT.x2; x += 1.5) sb.add(boxAt(x - 0.04, z0, FOOTPRINT.y1 - 0.4, x + 0.04, z1, FOOTPRINT.y1 - 0.06), "oakVertical");
  for (let y = 1.0; y < FOOTPRINT.y2; y += 1.5) {
    sb.add(boxAt(FOOTPRINT.x1 - 0.4, z0, y - 0.04, FOOTPRINT.x1 - 0.06, z1, y + 0.04), "oakVertical");
    sb.add(boxAt(FOOTPRINT.x2 + 0.06, z0, y - 0.04, FOOTPRINT.x2 + 0.4, z1, y + 0.04), "oakVertical");
  }
}

function buildRoof(sb: StaticBuilder) {
  sb.add(boxAt(FOOTPRINT.x1 - 0.06, TOP - SLAB, FOOTPRINT.y1 - 0.06, FOOTPRINT.x2 + 0.06, TOP, FOOTPRINT.y2), "concrete");
  // parapet
  sb.add(boxAt(FOOTPRINT.x1, TOP, FOOTPRINT.y1, FOOTPRINT.x2, TOP + 1.1, FOOTPRINT.y1 + 0.25), "concrete");
  sb.add(boxAt(FOOTPRINT.x1, TOP, FOOTPRINT.y2 - 0.25, FOOTPRINT.x2, TOP + 1.1, FOOTPRINT.y2), "concrete");
  sb.add(boxAt(FOOTPRINT.x1, TOP, FOOTPRINT.y1, FOOTPRINT.x1 + 0.25, TOP + 1.1, FOOTPRINT.y2), "concrete");
  sb.add(boxAt(FOOTPRINT.x2 - 0.25, TOP, FOOTPRINT.y1, FOOTPRINT.x2, TOP + 1.1, FOOTPRINT.y2), "concrete");
  // timber pergola crown + roof garden
  for (let x = 2; x <= 22; x += 1.0) sb.add(boxAt(x - 0.05, TOP + 3.2, 2, x + 0.05, TOP + 3.4, 14), "oakVertical");
  for (const [x, y] of [[2, 2], [22, 2], [2, 14], [22, 14], [12, 2], [12, 14]]) sb.add(boxAt(x - 0.15, TOP, y - 0.15, x + 0.15, TOP + 3.2, y + 0.15), "concrete");
  for (const [x, y] of [[5, 5], [9, 11], [15, 4.5], [19, 10]]) {
    sb.add(boxAt(x - 1.2, TOP, y - 1.2, x + 1.2, TOP + 0.6, y + 1.2), "concrete");
    const c = new THREE.IcosahedronGeometry(1.3, 1);
    c.translate(x, TOP + 1.9, y);
    sb.add(c, "leaf");
  }
}

/* ------------------------------------------------------------------ site and city */

function tree(sb: StaticBuilder, x: number, z: number, s = 1) {
  const trunk = new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 4.2 * s, 8);
  trunk.translate(x, 2.1 * s, z);
  sb.add(trunk, "bark");
  for (let i = 0; i < 6; i++) {
    const a = i * 2.3 + x;
    const c = new THREE.IcosahedronGeometry((1.4 + (i % 3) * 0.35) * s, 1);
    c.translate(x + Math.cos(a) * 1.2 * s, (5 + (i % 3) * 0.7) * s, z + Math.sin(a) * 1.2 * s);
    sb.add(c, i % 2 ? "leaf" : "olive");
  }
}

function buildSite(sb: StaticBuilder) {
  sb.add(planeAt(-260, -260, 290, 280, -0.03), "grass");
  sb.add(boxAt(-12, -0.4, -10, 36, -0.005, 34), "terrace");
  // path to the entrance and a reflecting pool
  sb.add(boxAt(10, -0.02, 21.5, 14, 0.01, 60), "pathStone");
  sb.add(boxAt(17, -0.02, 24, 30, 0.02, 30), "water");
  sb.add(boxAt(-6, -0.02, 24, 7, 0.4, 30), "boxwood");
  for (const [x, z, s] of [[-8, 26, 1.1], [3, 33, 1], [-10, 10, 1.2], [33, 34, 1], [36, 6, 1.1], [-4, -6, 1], [30, -6, 1.2], [22, 40, 0.9], [-14, 38, 1]] as const) tree(sb, x, z, s);
  // neighbouring city: lower blocks around the tower
  let k = 11;
  const rnd = () => ((k = (k * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + rnd() * 0.15;
    const dist = 85 + rnd() * 90;
    const cx = 12 + Math.cos(a) * dist;
    const cz = 9 + Math.sin(a) * dist;
    const w = 14 + rnd() * 18;
    const d = 12 + rnd() * 14;
    const h = 9 + rnd() * 30;
    sb.add(boxAt(cx - w / 2, 0, cz - d / 2, cx + w / 2, h, cz + d / 2), rnd() > 0.35 ? "concrete" : "stoneTrim");
    for (let y = 3.2; y < h - 1; y += 3.3) sb.add(boxAt(cx - w / 2 - 0.05, y, cz - d / 2 - 0.05, cx + w / 2 + 0.05, y + 1.5, cz + d / 2 + 0.05), "towerGlass");
  }
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    if (a > 0.6 && a < 2.0) continue; // keep the south-east view of the tower open
    const dist = 55 + ((i * 37) % 23);
    tree(sb, 12 + Math.cos(a) * dist, 9 + Math.sin(a) * dist, 0.8 + ((i * 13) % 5) / 10);
  }
}

/* ------------------------------------------------------------------ doors */

function buildLeaf(lib: MaterialLib, l: LeafGeom, height: number): THREE.Group {
  const g = new THREE.Group();
  const T = 0.045;
  const L = l.length - 0.01;
  if (l.glazed) {
    const F = 0.07;
    const mk = (w: number, h: number, x: number, y: number, mat: THREE.Material, d = T) => {
      const m = new THREE.Mesh(metricBox(w, h, d), mat);
      m.position.set(x, y, 0);
      m.castShadow = mat !== lib.glass;
      g.add(m);
    };
    mk(L, F, L / 2, height - F / 2, lib.bronze);
    mk(L, F * 1.4, L / 2, F * 0.7, lib.bronze);
    mk(F, height, F / 2, height / 2, lib.bronze);
    mk(F, height, L - F / 2, height / 2, lib.bronze);
    mk(L - 2 * F, height - 2.4 * F, L / 2, height / 2 + 0.2 * F, lib.glass, 0.012);
  } else {
    const front = l.doorId === "front";
    const body = new THREE.Mesh(metricBox(L, height, T), front ? lib.oakVertical : lib.oakWood);
    body.position.set(L / 2, height / 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);
  }
  for (const side of [-1, 1]) {
    const h = new THREE.Mesh(metricBox(0.025, l.glazed ? 0.4 : 0.14, 0.025), lib.brass);
    h.position.set(L - 0.09, 1.05, side * (T / 2 + 0.035));
    g.add(h);
  }
  return g;
}

function buildDoors(lib: MaterialLib, root: THREE.Group): DoorLeafRuntime[] {
  return leaves.map((l) => {
    const pivot = new THREE.Group();
    pivot.position.set(l.hx, E + 0.01, l.hy);
    const leaf = buildLeaf(lib, l, DOOR_HEAD - 0.06);
    const [dx, dy] = leafDir(l, 0);
    const psi = Math.atan2(-dy, dx);
    const sgn = Math.sin(psi) * l.nx + Math.cos(psi) * l.ny;
    leaf.position.z = -sgn * 0.03;
    pivot.add(leaf);
    pivot.rotation.y = psi;
    root.add(pivot);
    return { geom: l, pivot, s: 0, target: 0 as const };
  });
}

/** Apply a leaf's pose for its current progress. */
export function poseLeaf(rt: DoorLeafRuntime) {
  const [dx, dy] = leafDir(rt.geom, easeInOut(rt.s));
  rt.pivot.rotation.y = Math.atan2(-dy, dx);
}

export const easeInOut = (s: number) => (s < 0.5 ? 2 * s * s : 1 - Math.pow(-2 * s + 2, 2) / 2);

/* ------------------------------------------------------------------ sky */

export const SKY_PRESETS = {
  day: { top: "#7fa7c9", horizon: "#eee3cf", sun: "#fff1d6", sunDir: [-0.5, 0.55, 0.67] },
  golden: { top: "#6a8fb5", horizon: "#f2c592", sun: "#ffd58f", sunDir: [-0.66, 0.26, 0.7] },
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
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), mat);
  sky.position.set(12, 0, 9);
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
  root.name = "tower";
  const sb = new StaticBuilder();
  const ceilingRooms = new Set<string>();

  buildResidenceShell(sb, ceilingRooms);
  await step("Residence 11A");
  const { lights, swings: hanging } = buildFurniture(sb, furniture);
  await step("Furniture and fittings");
  for (let level = 1; level <= TOWER.storeys; level++) {
    slab(sb, levelZ(level));
    if (level === 1) buildLobby(sb);
    else if (level !== TOWER.residenceLevel) buildStorey(sb, level, level * 7919);
  }
  balustrade(sb, E);
  buildFins(sb);
  buildRoof(sb);
  await step("Fifteen storeys");
  buildSite(sb);
  await step("Gardens and city");
  const authoredMeshes = sb.meshCount;
  sb.build(lib, root);

  // swings: hanging parts on their own pivots so they can sway
  const swings: SwingRuntime[] = hanging.map((h, i) => {
    const outer = new THREE.Group();
    outer.applyMatrix4(placeMatrix(h.it.x, E + h.hookY, h.it.y, h.it.rot));
    const pivot = new THREE.Group();
    outer.add(pivot);
    const part = new THREE.Group();
    h.sb.build(lib, part);
    pivot.add(part);
    root.add(outer);
    return { pivot, phase: i * 1.7, amp: h.it.type === "swingEgg" ? 0.05 : 0.07 };
  });

  const leafRuntimes = buildDoors(lib, root);
  await step("Doors");
  const sky = createSky("day");
  root.add(sky);
  return { root, leaves: leafRuntimes, swings, lights, sky, authoredMeshes: authoredMeshes + leafRuntimes.length, ceilingRooms };
}
