import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CAR_COLOURS, type MatKey, type MaterialLib } from "./materials";
import type { CityData } from "./cityData";

/**
 * The traffic of Kudasan: cars, auto-rickshaws and the odd bus driving the mapped streets around the tower.
 * Each vehicle shuttles along one stretch of road (up to 900 m), keeping left as India drives, turning back at
 * the ends. Every speed is trimmed so a whole number of return trips fits the LOOP, which lets Unreal play the
 * same plan as a looping sequence. The tour draws the lot as three instanced meshes; the exporter bakes them
 * into one mesh per vehicle so Blender and Unreal get them too.
 *
 * Plan metres: x east, y south (→ world z).
 */

export const LOOP = 240; // seconds

export type Kind = "car" | "auto" | "bus";

export interface CarPlan {
  name: string;
  kind: Kind;
  colour: MatKey;
  /** metres per second along the path */
  speed: number;
  /** where along the path (metres, 0..2L) it is at t = 0 */
  s0: number;
  /** the road's centre line */
  path: number[][];
  /** road width: the lane sits a quarter of it left of the centre */
  w: number;
}

export interface TrafficPlan {
  loop: number;
  cars: CarPlan[];
}

const TOWER_X = 12;
const TOWER_Z = 8;

function length(path: number[][]) {
  let l = 0;
  for (let i = 1; i < path.length; i++) l += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  return l;
}

/** cut a long road into stretches of at most `max` metres */
function chunks(path: number[][], max: number) {
  const out: number[][][] = [];
  let run: number[][] = [path[0]];
  let acc = 0;
  for (let i = 1; i < path.length; i++) {
    const seg = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    if (acc + seg > max && run.length > 1) {
      out.push(run);
      run = [path[i - 1]];
      acc = 0;
    }
    run.push(path[i]);
    acc += seg;
  }
  if (run.length > 1) out.push(run);
  return out;
}

export function planTraffic(city: CityData, rnd: () => number, maxCars = 320): TrafficPlan {
  const roads = city.roads
    .filter((r) => r.w >= 6 && !r.b)
    .map((r) => {
      const [cx, cz] = r.p.reduce(([x, z], p) => [x + p[0] / r.p.length, z + p[1] / r.p.length], [0, 0]);
      return { r, d: Math.hypot(cx - TOWER_X, cz - TOWER_Z) };
    })
    .filter((x) => x.d < 1200)
    .sort((a, b) => a.d - b.d);
  const cars: CarPlan[] = [];
  let n = 0;
  for (const { r } of roads) {
    for (const path of chunks(r.p, 900)) {
      const L = length(path);
      if (L < 40) continue;
      const spacing = r.w >= 9 ? 70 : 140;
      const count = Math.max(1, Math.floor(L / spacing));
      for (let i = 0; i < count && cars.length < maxCars; i++) {
        const kindRoll = rnd();
        const kind: Kind = kindRoll < 0.14 ? "auto" : kindRoll < 0.2 && r.w >= 9 ? "bus" : "car";
        const base = (r.w >= 14 ? 13 : r.w >= 9 ? 10 : 7) * (0.85 + rnd() * 0.3) * (kind === "car" ? 1 : kind === "auto" ? 0.8 : 0.85);
        // a whole number of return trips per LOOP
        const k = Math.max(1, Math.round((LOOP * base) / (2 * L)));
        const speed = (2 * L * k) / LOOP;
        const colour: MatKey = kind === "auto" ? "carYellow" : kind === "bus" ? "carOrange" : CAR_COLOURS[Math.floor(rnd() * CAR_COLOURS.length)];
        cars.push({ name: `car_${String(n++).padStart(3, "0")}`, kind, colour, speed, s0: rnd() * 2 * L, path, w: r.w });
      }
    }
  }
  return { loop: LOOP, cars };
}

/* ------------------------------------------------------------------ geometry */

function box(w: number, h: number, d: number, x: number, y: number, z: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

function wheel(x: number, z: number, r = 0.32, width = 0.22) {
  const g = new THREE.CylinderGeometry(r, r, width, 10);
  g.rotateX(Math.PI / 2);
  g.translate(x, r, z);
  return g;
}

/** vehicle geometry facing +x, floor at y = 0, centred on its length: groups 0 body, 1 glass, 2 tyres */
export function vehicleGeometry(kind: Kind) {
  const body: THREE.BufferGeometry[] = [];
  const glass: THREE.BufferGeometry[] = [];
  const tyres: THREE.BufferGeometry[] = [];
  if (kind === "car") {
    body.push(box(4.2, 0.72, 1.76, 0, 0.66, 0));
    body.push(box(2.3, 0.08, 1.6, -0.25, 1.62, 0)); // roof
    glass.push(box(2.1, 0.56, 1.62, -0.25, 1.3, 0));
    body.push(box(0.9, 0.3, 1.5, 1.6, 1.12, 0)); // bonnet rise
    for (const x of [1.35, -1.35]) for (const z of [0.78, -0.78]) tyres.push(wheel(x, z));
  } else if (kind === "auto") {
    body.push(box(2.5, 0.6, 1.3, 0, 0.62, 0));
    body.push(box(2.3, 0.06, 1.3, -0.05, 1.72, 0)); // canopy
    glass.push(box(0.5, 0.78, 1.2, 0.95, 1.3, 0)); // windscreen
    body.push(box(1.6, 0.8, 0.06, -0.3, 1.3, 0.62));
    body.push(box(1.6, 0.8, 0.06, -0.3, 1.3, -0.62));
    tyres.push(wheel(1.0, 0, 0.26, 0.16), wheel(-0.85, 0.6, 0.26, 0.16), wheel(-0.85, -0.6, 0.26, 0.16));
  } else {
    body.push(box(10.5, 1.3, 2.55, 0, 0.95, 0));
    glass.push(box(10.3, 1.1, 2.57, 0, 2.15, 0));
    body.push(box(10.5, 0.5, 2.55, 0, 2.95, 0));
    for (const x of [3.6, -3.4]) for (const z of [1.15, -1.15]) tyres.push(wheel(x, z, 0.5, 0.3));
  }
  const parts = [body, glass, tyres].map((list) => {
    const merged = mergeGeometries(list.map((g) => (g.index ? g.toNonIndexed() : g)), false)!;
    list.forEach((g) => g.dispose());
    return merged;
  });
  const geo = mergeGeometries(parts, true)!; // groups 0, 1, 2
  parts.forEach((g) => g.dispose());
  // vertex colours: white on the body (so the instance colour shows), fixed dark glass and black tyres
  const n = geo.attributes.position.count;
  const col = new Float32Array(n * 3);
  for (const grp of geo.groups) {
    const [r, g, b] = grp.materialIndex === 0 ? [1, 1, 1] : grp.materialIndex === 1 ? [0.35, 0.4, 0.45] : [0.1, 0.1, 0.1];
    for (let i = grp.start; i < grp.start + grp.count; i++) {
      col[i * 3] = r;
      col[i * 3 + 1] = g;
      col[i * 3 + 2] = b;
    }
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  for (const name of Object.keys(geo.attributes)) if (!["position", "normal", "uv", "color"].includes(name)) geo.deleteAttribute(name);
  return geo;
}

/* ------------------------------------------------------------------ motion */

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpP = new THREE.Vector3();
const tmpS = new THREE.Vector3(1, 1, 1);
const up = new THREE.Vector3(0, 1, 0);

/** point and unit tangent `s` metres along the path */
function along(path: number[][], s: number): [number, number, number, number] {
  let acc = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, az] = path[i];
    const [bx, bz] = path[i + 1];
    const seg = Math.hypot(bx - ax, bz - az);
    if (acc + seg >= s || i === path.length - 2) {
      const f = seg ? Math.min(1, Math.max(0, (s - acc) / seg)) : 0;
      return [ax + (bx - ax) * f, az + (bz - az) * f, (bx - ax) / (seg || 1), (bz - az) / (seg || 1)];
    }
    acc += seg;
  }
  return [path[0][0], path[0][1], 1, 0];
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Where a vehicle is at `phase` metres into its 2L return trip: on the left lane going out, the other lane
 * coming back, and swinging across the road through a U-turn over the last `u` metres before each end.
 */
export function lanePoint(car: CarPlan, phase: number, L: number): [number, number] {
  const forward = phase < L;
  const s = forward ? phase : 2 * L - phase;
  const [px, pz, tx, tz] = along(car.path, s);
  const u = Math.max(6, car.w);
  const e = Math.min(Math.abs(phase - L), phase, 2 * L - phase);
  const k = e < u ? smooth(e / u) : 1;
  // the left of the path's own direction, in a y-up world with z south, is (tz, -tx)
  const off = (car.w / 4) * (forward ? 1 : -1) * k;
  return [px + tz * off, pz - tx * off];
}

/** world transform of a vehicle at time t: position on its lane, heading along its motion */
export function poseAt(car: CarPlan, t: number, out: THREE.Matrix4) {
  const L = length(car.path);
  const P = 2 * L;
  const phase = (((car.s0 + car.speed * t) % P) + P) % P;
  const [x, z] = lanePoint(car, phase, L);
  const [x1, z1] = lanePoint(car, (phase + 0.4) % P, L);
  const [x0, z0] = lanePoint(car, (phase - 0.4 + P) % P, L);
  let hx = x1 - x0, hz = z1 - z0;
  const hl = Math.hypot(hx, hz);
  if (hl < 1e-6) { hx = 1; hz = 0; } else { hx /= hl; hz /= hl; }
  tmpP.set(x, 0, z);
  tmpQ.setFromAxisAngle(up, Math.atan2(-hz, hx));
  return out.compose(tmpP, tmpQ, tmpS);
}

/* ------------------------------------------------------------------ the tour's traffic */

export class Traffic {
  group = new THREE.Group();
  private meshes = new Map<Kind, { mesh: THREE.InstancedMesh; cars: CarPlan[] }>();

  constructor(private lib: MaterialLib, public plan: TrafficPlan) {
    this.group.name = "traffic";
    const kinds: Kind[] = ["car", "auto", "bus"];
    for (const kind of kinds) {
      const cars = plan.cars.filter((c) => c.kind === kind);
      if (!cars.length) continue;
      const mesh = new THREE.InstancedMesh(vehicleGeometry(kind), [lib.carPaint, lib.carGlass, lib.tyre], cars.length);
      mesh.name = `traffic:${kind}`;
      mesh.frustumCulled = false;
      cars.forEach((c, i) => mesh.setColorAt(i, lib[c.colour].color));
      mesh.instanceColor!.needsUpdate = true;
      this.group.add(mesh);
      this.meshes.set(kind, { mesh, cars });
    }
    this.update(0);
  }

  update(t: number) {
    for (const { mesh, cars } of this.meshes.values()) {
      cars.forEach((c, i) => mesh.setMatrixAt(i, poseAt(c, t, tmpM)));
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  /** one plain mesh per vehicle at t = 0, named car_NNN with its paint, glass and tyre materials, for the exporters */
  bake() {
    const group = new THREE.Group();
    group.name = "traffic";
    const geos = new Map<Kind, THREE.BufferGeometry>();
    for (const car of this.plan.cars) {
      let g = geos.get(car.kind);
      if (!g) {
        g = vehicleGeometry(car.kind);
        g.deleteAttribute("color");
        geos.set(car.kind, g);
      }
      const mesh = new THREE.Mesh(g, [this.lib[car.colour], this.lib.carGlass, this.lib.tyre]);
      mesh.name = car.name;
      poseAt(car, 0, mesh.matrix);
      mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
      group.add(mesh);
    }
    return group;
  }
}
