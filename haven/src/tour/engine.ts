import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { FLOOR_LEVEL, FLOOR_TO_FLOOR, FOOTPRINT, roomById, type FloorId } from "../data/houseLayout";
import {
  buildObstacles, flight1Lane, flight2Lane, inRect, leafDir, roomAt, stairHeight, stairZone,
  type MoveMode, type Obstacle,
} from "../data/layoutGeometry";
import { createMaterials, type MaterialLib } from "./materials";
import { buildHouse, easeInOut, poseLeaf, type DoorLeafRuntime, type HouseBuild } from "./buildHouse";

export type Quality = "high" | "light";

export interface EngineState {
  floor: FloorId;
  roomId: string | null;
  roomName: string;
  doorAhead: boolean;
}

export interface Pose {
  x: number;
  y: number;
  floor: FloorId;
  /** plan facing angle in degrees (0 = south, 90 = east) */
  heading: number;
}

const EYE = 1.65;
const RADIUS = 0.3;
const HALF = FLOOR_TO_FLOOR / 2;
const DEG = Math.PI / 180;
const PITCH_LIMIT = 80 * DEG;
const REACH = 2.0;
const DOOR_TIME = 0.6;
const LEAF_HALF_T = 0.03;

// setTimeout rather than rAF so building continues in a background tab
const nextFrame = () => new Promise<void>((r) => setTimeout(r, 0));

/** closest point on segment ab to p */
function closestOnSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number): [number, number] {
  const vx = bx - ax;
  const vy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1)));
  return [ax + vx * t, ay + vy * t];
}

/** ray (o + d·t) vs segment; returns t or null */
function raySeg(ox: number, oy: number, dx: number, dy: number, ax: number, ay: number, bx: number, by: number): number | null {
  const ex = bx - ax;
  const ey = by - ay;
  const den = dx * ey - dy * ex;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((ax - ox) * ey - (ay - oy) * ex) / den;
  const u = ((ax - ox) * dy - (ay - oy) * dx) / den;
  return t >= 0 && u >= -0.02 && u <= 1.02 ? t : null;
}

/** ray vs AABB (slab test); returns entry t or null */
function rayBox(ox: number, oy: number, dx: number, dy: number, b: Obstacle): number | null {
  let t0 = 0;
  let t1 = Infinity;
  for (const [o, d, lo, hi] of [[ox, dx, b.x1, b.x2], [oy, dy, b.y1, b.y2]] as const) {
    if (Math.abs(d) < 1e-9) {
      if (o < lo || o > hi) return null;
    } else {
      let a = (lo - o) / d;
      let c = (hi - o) / d;
      if (a > c) [a, c] = [c, a];
      t0 = Math.max(t0, a);
      t1 = Math.min(t1, c);
      if (t0 > t1) return null;
    }
  }
  return t0;
}

export class TourEngine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  lib!: MaterialLib;
  house!: HouseBuild;
  sun!: THREE.DirectionalLight;
  hemi!: THREE.HemisphereLight;
  pointLights: THREE.PointLight[] = [];
  obstacles = buildObstacles();
  quality: Quality = "high";

  // player
  x = 20;
  y = 17;
  h = 0;
  mode: MoveMode = "ground";
  yaw = 0;
  pitch = 0;

  // input
  keys = new Set<string>();
  joy = { x: 0, y: 0 };
  private drag: { id: number; x: number; y: number } | null = null;

  private container: HTMLElement;
  private raf = 0;
  private running = false;
  private last = 0;
  private state: EngineState = { floor: 0, roomId: null, roomName: "", doorAhead: false };
  private stateListeners = new Set<(s: EngineState) => void>();
  private frameListeners = new Set<(p: Pose) => void>();
  private doorTarget: DoorLeafRuntime | null = null;
  private ro: ResizeObserver;
  private pmrem: THREE.PMREMGenerator;
  /** set false by the studio, which drives the camera itself */
  interactive = true;

  constructor(container: HTMLElement, opts: { quality?: Quality; preserveDrawingBuffer?: boolean } = {}) {
    this.container = container;
    this.quality = opts.quality ?? "high";
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: !!opts.preserveDrawingBuffer });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.touchAction = "none";
    this.renderer.domElement.setAttribute("aria-label", "First-person 3D view of The Oak Mansion");
    this.renderer.domElement.setAttribute("role", "img");
    container.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(70, 1, 0.05, 500);
    this.camera.rotation.order = "YXZ";
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.applyPixelRatio();
    this.resize();
  }

  /* ---------------------------------------------------------------- loading */

  async init(onProgress?: (p: number, label: string) => void) {
    const manager = new THREE.LoadingManager();
    const stages = [
      "Procedural textures", "Floors and ceilings", "Walls, both floors", "Bronze windows", "Oak staircase",
      "Ground-floor furniture", "First-floor furniture", "Garden and façade", "Doors", "Lighting", "Compiling shaders",
    ];
    manager.onProgress = (url, loaded, total) => onProgress?.(loaded / total, url);
    stages.forEach((s) => manager.itemStart(s));
    const done = async (s: string) => {
      manager.itemEnd(s);
      await nextFrame();
    };
    await nextFrame();

    this.lib = createMaterials();
    await done("Procedural textures");
    this.house = await buildHouse(this.lib, done);
    this.scene.add(this.house.root);
    this.setupLights();
    await done("Lighting");
    this.applyQuality();
    this.placeCamera();
    try {
      await this.renderer.compileAsync(this.scene, this.camera);
    } catch {
      /* compileAsync is an optimisation only */
    }
    await done("Compiling shaders");
  }

  private setupLights() {
    const env = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = env;
    this.scene.environmentIntensity = 0.42;
    this.scene.fog = new THREE.Fog(0xe9dfcf, 90, 260);

    this.hemi = new THREE.HemisphereLight(0xfff2de, 0x8a7058, 0.85);
    this.scene.add(this.hemi);

    const sun = new THREE.DirectionalLight(0xffe0b0, 3.2);
    sun.position.set(20 - 34, 26, 9 + 40);
    sun.target.position.set(20, 0, 9.5);
    sun.shadow.mapSize.set(2048, 2048);
    const cam = sun.shadow.camera;
    cam.left = -34;
    cam.right = 34;
    cam.top = 26;
    cam.bottom = -26;
    cam.near = 10;
    cam.far = 120;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.035;
    this.scene.add(sun, sun.target);
    this.sun = sun;

    // warm pendants: one light per room, the strongest fixture
    const byRoom = new Map<string, (typeof this.house.lights)[number]>();
    for (const l of this.house.lights) if (!byRoom.has(l.room) || l.strength > byRoom.get(l.room)!.strength) byRoom.set(l.room, l);
    for (const l of byRoom.values()) {
      const p = new THREE.PointLight(0xffc98f, 9 * l.strength, 10, 2);
      p.position.set(l.x, l.y, l.z);
      this.scene.add(p);
      this.pointLights.push(p);
    }
  }

  /* ---------------------------------------------------------------- quality */

  setQuality(q: Quality) {
    this.quality = q;
    this.applyQuality();
  }

  private applyPixelRatio() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.renderer.setPixelRatio(this.quality === "high" ? dpr : 1);
  }

  private applyQuality() {
    const high = this.quality === "high";
    this.applyPixelRatio();
    this.resize();
    this.renderer.shadowMap.enabled = high;
    if (this.sun) this.sun.castShadow = high;
    this.pointLights.forEach((p) => (p.visible = high));
    this.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m) m.needsUpdate = true;
    });
  }

  /* ---------------------------------------------------------------- lifecycle */

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onVisibility);
    const el = this.renderer.domElement;
    el.addEventListener("pointerdown", this.onPointerDown);
    el.addEventListener("pointermove", this.onPointerMove);
    el.addEventListener("pointerup", this.onPointerUp);
    el.addEventListener("pointercancel", this.onPointerUp);
    this.loop();
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    } else if (this.running && !this.raf) {
      this.last = performance.now();
      this.loop();
    }
  };

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.ro.disconnect();
    const textures = new Set<THREE.Texture>();
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
      const mats = mesh.material ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) : [];
      for (const m of mats) {
        for (const v of Object.values(m)) if (v instanceof THREE.Texture) textures.add(v);
        m.dispose();
      }
    });
    if (this.lib) for (const m of Object.values(this.lib)) {
      if (m.map) textures.add(m.map);
      m.dispose();
    }
    textures.forEach((t) => t.dispose());
    this.scene.environment?.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.stateListeners.clear();
    this.frameListeners.clear();
  }

  private resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /* ---------------------------------------------------------------- events */

  onState(cb: (s: EngineState) => void) {
    this.stateListeners.add(cb);
    cb(this.state);
    return () => {
      this.stateListeners.delete(cb);
    };
  }

  onFrame(cb: (p: Pose) => void) {
    this.frameListeners.add(cb);
    return () => {
      this.frameListeners.delete(cb);
    };
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code.startsWith("Arrow")) e.preventDefault();
    if (e.code === "KeyE" && !e.repeat) this.toggleDoor();
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);
  private onBlur = () => this.keys.clear();

  private onPointerDown = (e: PointerEvent) => {
    if (this.drag) return;
    this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    this.renderer.domElement.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    const k = e.pointerType === "touch" ? 0.0055 : 0.0038;
    this.yaw += (e.clientX - this.drag.x) * k;
    this.pitch += (e.clientY - this.drag.y) * k;
    this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));
    this.drag.x = e.clientX;
    this.drag.y = e.clientY;
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.drag?.id === e.pointerId) this.drag = null;
  };

  setJoystick(x: number, y: number) {
    this.joy.x = x;
    this.joy.y = y;
  }

  /* ---------------------------------------------------------------- navigation */

  teleport(roomId: string) {
    const rm = roomById(roomId);
    if (!rm) return false;
    this.x = rm.arrival.x;
    this.y = rm.arrival.y;
    this.mode = rm.floor === 0 ? "ground" : "first";
    this.h = FLOOR_LEVEL[rm.floor];
    this.yaw = rm.arrival.yaw * DEG + Math.PI;
    this.pitch = -0.04;
    this.placeCamera();
    this.updateState(true);
    return true;
  }

  resetView() {
    this.teleport(this.state.roomId && roomById(this.state.roomId) ? this.state.roomId : "entrance");
  }

  /** Toggle the leaf the player is facing. */
  toggleDoor() {
    const leaf = this.doorTarget ?? this.findDoorAhead();
    if (!leaf) return false;
    leaf.target = leaf.target === 1 ? 0 : 1;
    return true;
  }

  get floor(): FloorId {
    return this.mode === "ground" ? 0 : this.mode === "first" ? 1 : this.h < HALF ? 0 : 1;
  }

  private leafSegment(l: DoorLeafRuntime, s = l.s): [number, number, number, number] {
    const [dx, dy] = leafDir(l.geom, easeInOut(s));
    const g = l.geom;
    return [g.hx, g.hy, g.hx + dx * g.length, g.hy + dy * g.length];
  }

  private findDoorAhead(): DoorLeafRuntime | null {
    if (this.mode === "stair") return null;
    const fx = -Math.sin(this.yaw);
    const fy = -Math.cos(this.yaw);
    let best: DoorLeafRuntime | null = null;
    let bestT = REACH;
    for (const spread of [0, 0.14, -0.14]) {
      const c = Math.cos(spread);
      const s = Math.sin(spread);
      const dx = fx * c - fy * s;
      const dy = fx * s + fy * c;
      for (const l of this.house.leaves) {
        if (l.geom.floor !== this.floor) continue;
        const [ax, ay, bx, by] = this.leafSegment(l);
        const t = raySeg(this.x, this.y, dx, dy, ax, ay, bx, by);
        if (t !== null && t < bestT) {
          // make sure no wall sits between the player and the leaf
          const blocked = this.obstacles[this.mode].some((o) => {
            if (o.kind !== "wall") return false;
            const tb = rayBox(this.x, this.y, dx, dy, o);
            return tb !== null && tb < t - 0.08;
          });
          if (!blocked) {
            best = l;
            bestT = t;
          }
        }
      }
    }
    return best;
  }

  /* ---------------------------------------------------------------- simulation */

  private update(dt: number) {
    if (!this.house) return;
    if (this.interactive) {
      this.updateLook(dt);
      this.updateMove(dt);
    }
    this.updateDoors(dt);
    this.placeCamera();
    this.doorTarget = this.interactive ? this.findDoorAhead() : null;
    this.updateState();
    if (this.frameListeners.size) {
      const heading = ((this.yaw - Math.PI) / DEG) % 360;
      const pose = { x: this.x, y: this.y, floor: this.floor, heading };
      this.frameListeners.forEach((cb) => cb(pose));
    }
  }

  private updateLook(dt: number) {
    const k = this.keys;
    const rate = 1.9 * dt;
    if (k.has("ArrowLeft")) this.yaw += rate;
    if (k.has("ArrowRight")) this.yaw -= rate;
    if (k.has("ArrowUp")) this.pitch = Math.min(PITCH_LIMIT, this.pitch + rate * 0.7);
    if (k.has("ArrowDown")) this.pitch = Math.max(-PITCH_LIMIT, this.pitch - rate * 0.7);
  }

  private updateMove(dt: number) {
    const k = this.keys;
    let fwd = (k.has("KeyW") ? 1 : 0) - (k.has("KeyS") ? 1 : 0) + this.joy.y;
    let str = (k.has("KeyD") ? 1 : 0) - (k.has("KeyA") ? 1 : 0) + this.joy.x;
    const mag = Math.hypot(fwd, str);
    if (mag > 1) {
      fwd /= mag;
      str /= mag;
    }
    const speed = k.has("ShiftLeft") || k.has("ShiftRight") ? 3.3 : 1.7;
    const fx = -Math.sin(this.yaw);
    const fy = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw);
    const ry = -Math.sin(this.yaw);
    const mx = (fx * fwd + rx * str) * speed * dt;
    const my = (fy * fwd + ry * str) * speed * dt;
    const len = Math.hypot(mx, my);
    if (len > 1e-5) {
      const n = Math.ceil(len / 0.06);
      for (let i = 0; i < n; i++) {
        this.x += mx / n;
        this.y += my / n;
        this.resolveCollisions();
        this.updateMode();
      }
    }
    // height follows floor / stair surface
    let target = this.mode === "ground" ? 0 : this.mode === "first" ? FLOOR_TO_FLOOR : stairHeight(this.x, this.y) ?? this.h;
    if (this.mode === "stair") target = Math.max(0, Math.min(FLOOR_TO_FLOOR, target));
    this.h += (target - this.h) * Math.min(1, dt * (this.mode === "stair" ? 18 : 12));
  }

  private resolveCollisions() {
    const r = RADIUS;
    const obs = this.obstacles[this.mode];
    for (let iter = 0; iter < 3; iter++) {
      let moved = false;
      for (const o of obs) {
        if (this.x < o.x1 - r || this.x > o.x2 + r || this.y < o.y1 - r || this.y > o.y2 + r) continue;
        const cx = Math.max(o.x1, Math.min(this.x, o.x2));
        const cy = Math.max(o.y1, Math.min(this.y, o.y2));
        const dx = this.x - cx;
        const dy = this.y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 >= r * r) continue;
        if (d2 > 1e-10) {
          const d = Math.sqrt(d2);
          this.x += (dx / d) * (r - d);
          this.y += (dy / d) * (r - d);
        } else {
          const pen = [this.x - o.x1 + r, o.x2 - this.x + r, this.y - o.y1 + r, o.y2 - this.y + r];
          const m = pen.indexOf(Math.min(...pen));
          if (m === 0) this.x = o.x1 - r;
          else if (m === 1) this.x = o.x2 + r;
          else if (m === 2) this.y = o.y1 - r;
          else this.y = o.y2 + r;
        }
        moved = true;
      }
      if (this.mode !== "stair") {
        for (const l of this.house.leaves) {
          if (l.geom.floor !== this.floor) continue;
          const [ax, ay, bx, by] = this.leafSegment(l);
          const [cx, cy] = closestOnSeg(this.x, this.y, ax, ay, bx, by);
          const dx = this.x - cx;
          const dy = this.y - cy;
          const lim = r + LEAF_HALF_T;
          const d2 = dx * dx + dy * dy;
          if (d2 < lim * lim && d2 > 1e-10) {
            const d = Math.sqrt(d2);
            this.x += (dx / d) * (lim - d);
            this.y += (dy / d) * (lim - d);
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
  }

  private updateMode() {
    if (this.mode === "ground" && inRect(this.x, this.y, flight1Lane)) this.mode = "stair";
    else if (this.mode === "first" && inRect(this.x, this.y, flight2Lane)) this.mode = "stair";
    else if (this.mode === "stair" && !inRect(this.x, this.y, stairZone)) {
      this.mode = this.h < HALF ? "ground" : "first";
      this.h = this.mode === "ground" ? Math.min(this.h, 0.2) : Math.max(this.h, FLOOR_TO_FLOOR - 0.2);
    }
  }

  private updateDoors(dt: number) {
    const step = dt / DOOR_TIME;
    for (const l of this.house.leaves) {
      if (l.s === l.target) continue;
      const next = l.target > l.s ? Math.min(1, l.s + step) : Math.max(0, l.s - step);
      if (this.interactive && l.geom.floor === this.floor && this.mode !== "stair") {
        const [ax, ay, bx, by] = this.leafSegment(l, next);
        const [cx, cy] = closestOnSeg(this.x, this.y, ax, ay, bx, by);
        // the player is standing in the swing: pause until they step clear
        if (Math.hypot(this.x - cx, this.y - cy) < RADIUS + LEAF_HALF_T + 0.02) continue;
      }
      l.s = next;
      poseLeaf(l);
    }
  }

  /** Instantly open (or close) every leaf — used by the studio. */
  setAllDoors(open: boolean) {
    for (const l of this.house.leaves) {
      l.s = l.target = open ? 1 : 0;
      poseLeaf(l);
    }
  }

  setDoorsOpen(ids: string[]) {
    for (const l of this.house.leaves) if (ids.includes(l.geom.doorId)) {
      l.s = l.target = 1;
      poseLeaf(l);
    }
  }

  placeCamera() {
    if (!this.interactive) return;
    this.camera.position.set(this.x, this.h + EYE, this.y);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  private updateState(force = false) {
    const floor = this.floor;
    const inside = inRect(this.x, this.y, FOOTPRINT);
    const rm = roomAt(floor, this.x, this.y);
    const roomId = rm ? rm.id : inside ? this.state.roomId : null;
    const roomName = rm ? rm.name : inside ? this.state.roomName : "Garden";
    const doorAhead = !!this.doorTarget;
    const s = this.state;
    if (!force && s.floor === floor && s.roomId === roomId && s.roomName === roomName && s.doorAhead === doorAhead) return;
    this.state = { floor, roomId, roomName, doorAhead };
    this.stateListeners.forEach((cb) => cb(this.state));
  }

  /** Count of meshes currently in the scene graph (merged batches + door parts). */
  sceneMeshCount() {
    let n = 0;
    this.scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) n++;
    });
    return n;
  }
}
