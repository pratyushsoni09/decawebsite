/**
 * Geometry derived from houseLayout.ts — shared by the SVG plan, the 3D
 * scene, the collision map and the model checks.
 */
import {
  BALCONY,
  DOOR_HEAD,
  EXT_WALL,
  FLOOR_TO_FLOOR,
  FOOTPRINT,
  NON_BLOCKING,
  doors,
  footprint,
  furniture,
  openings,
  rooms,
  windows,
  type DoorDef,
  type FloorId,
  type OpeningDef,
  type Rect,
  type RoomDef,
  type WindowDef,
} from "./houseLayout";

export const EPS = 1e-6;

export const inRect = (x: number, y: number, rc: Rect, pad = 0) =>
  x >= rc.x1 - pad && x <= rc.x2 + pad && y >= rc.y1 - pad && y <= rc.y2 + pad;

export const rectsOverlap = (a: Rect, b: Rect, pad = 0) =>
  a.x1 < b.x2 + pad && a.x2 > b.x1 - pad && a.y1 < b.y2 + pad && a.y2 > b.y1 - pad;

/* ------------------------------------------------------------------ resolved openings */

export interface ResolvedDoor extends DoorDef {
  /** the opening rectangle in plan (spans the full wall thickness) */
  rect: Rect;
  /** wall faces across the axis [low, high] */
  wall: [number, number];
}

export interface ResolvedOpening extends OpeningDef {
  rect: Rect;
  wall: [number, number];
}

export interface ResolvedWindow extends WindowDef {
  rect: Rect;
}

/** Find the wall faces around `pos` by looking at the rooms either side. */
function wallFaces(floor: FloorId, axis: "x" | "y", at: number, pos: number): [number, number] {
  let lo: number = axis === "x" ? FOOTPRINT.y1 : FOOTPRINT.x1;
  let hi: number = axis === "x" ? FOOTPRINT.y2 : FOOTPRINT.x2;
  for (const rm of rooms) {
    if (rm.floor !== floor) continue;
    for (const rc of rm.rects) {
      if (axis === "x") {
        if (at < rc.x1 || at > rc.x2) continue;
        if (rc.y2 <= pos + EPS) lo = Math.max(lo, rc.y2);
        if (rc.y1 >= pos - EPS) hi = Math.min(hi, rc.y1);
      } else {
        if (at < rc.y1 || at > rc.y2) continue;
        if (rc.x2 <= pos + EPS) lo = Math.max(lo, rc.x2);
        if (rc.x1 >= pos - EPS) hi = Math.min(hi, rc.x1);
      }
    }
  }
  return [lo, hi];
}

function spanRect(axis: "x" | "y", at: number, width: number, wall: [number, number]): Rect {
  return axis === "x"
    ? { x1: at - width / 2, x2: at + width / 2, y1: wall[0], y2: wall[1] }
    : { y1: at - width / 2, y2: at + width / 2, x1: wall[0], x2: wall[1] };
}

export const resolvedDoors: ResolvedDoor[] = doors.map((d) => {
  const wall = wallFaces(d.floor, d.axis, d.at, d.pos);
  return { ...d, wall, rect: spanRect(d.axis, d.at, d.width, wall) };
});

export const resolvedOpenings: ResolvedOpening[] = openings.map((o) => {
  const wall = wallFaces(o.floor, o.axis, o.at, o.pos);
  return { ...o, wall, rect: spanRect(o.axis, o.at, o.width, wall) };
});

export const resolvedWindows: ResolvedWindow[] = windows.map((w) => {
  const { x1, y1, x2, y2 } = FOOTPRINT;
  const half = w.width / 2;
  const rect =
    w.side === "N" ? { x1: w.at - half, x2: w.at + half, y1, y2: y1 + EXT_WALL }
    : w.side === "S" ? { x1: w.at - half, x2: w.at + half, y1: y2 - EXT_WALL, y2 }
    : w.side === "W" ? { y1: w.at - half, y2: w.at + half, x1, x2: x1 + EXT_WALL }
    : { y1: w.at - half, y2: w.at + half, x1: x2 - EXT_WALL, x2 };
  return { ...w, rect };
});

/* ------------------------------------------------------------------ door leaves */

export interface LeafGeom {
  doorId: string;
  floor: FloorId;
  /** hinge point (plan) */
  hx: number;
  hy: number;
  /** closed direction (unit) */
  ux: number;
  uy: number;
  /** open direction = swing normal (unit) */
  nx: number;
  ny: number;
  length: number;
  glazed: boolean;
}

export const leaves: LeafGeom[] = resolvedDoors.flatMap((d) => {
  const face = d.swing > 0 ? d.wall[1] : d.wall[0];
  const lo = d.at - d.width / 2;
  const hi = d.at + d.width / 2;
  const mk = (atLo: boolean, length: number): LeafGeom => {
    const along = atLo ? 1 : -1;
    const base = atLo ? lo : hi;
    return d.axis === "x"
      ? { doorId: d.id, floor: d.floor, hx: base, hy: face, ux: along, uy: 0, nx: 0, ny: d.swing, length, glazed: !!d.glazed }
      : { doorId: d.id, floor: d.floor, hx: face, hy: base, ux: 0, uy: along, nx: d.swing, ny: 0, length, glazed: !!d.glazed };
  };
  if (d.leaves === 2) return [mk(true, d.width / 2), mk(false, d.width / 2)];
  return [mk(d.hinge !== "end", d.width)];
});

/** Leaf direction at an opening fraction t ∈ [0,1] (0 closed, 1 = 90° open). */
export function leafDir(l: LeafGeom, t: number): [number, number] {
  const a = (t * Math.PI) / 2;
  return [l.ux * Math.cos(a) + l.nx * Math.sin(a), l.uy * Math.cos(a) + l.ny * Math.sin(a)];
}

/* ------------------------------------------------------------------ wall cells */

export type CellType = "room" | "solid" | "door" | "opening" | "window" | "void";

export interface WallBox extends Rect {
  type: Exclude<CellType, "room" | "void">;
  ref?: string;
  /** vertical extents relative to the floor level, for the parts of the wall that are solid */
  segments: [number, number][];
}

const roomRectsOn = (floor: FloorId) => rooms.filter((rm) => rm.floor === floor).flatMap((rm) => rm.rects);

function cellLines(floor: FloorId) {
  const xs = new Set<number>([FOOTPRINT.x1, FOOTPRINT.x2]);
  const ys = new Set<number>([FOOTPRINT.y1, FOOTPRINT.y2]);
  const add = (rc: Rect) => {
    xs.add(+Math.min(Math.max(rc.x1, FOOTPRINT.x1), FOOTPRINT.x2).toFixed(4));
    xs.add(+Math.min(Math.max(rc.x2, FOOTPRINT.x1), FOOTPRINT.x2).toFixed(4));
    ys.add(+Math.min(Math.max(rc.y1, FOOTPRINT.y1), FOOTPRINT.y2).toFixed(4));
    ys.add(+Math.min(Math.max(rc.y2, FOOTPRINT.y1), FOOTPRINT.y2).toFixed(4));
  };
  roomRectsOn(floor).forEach(add);
  resolvedDoors.filter((d) => d.floor === floor).forEach((d) => add(d.rect));
  resolvedOpenings.filter((d) => d.floor === floor).forEach((d) => add(d.rect));
  resolvedWindows.filter((d) => d.floor === floor).forEach((d) => add(d.rect));
  return { xs: [...xs].sort((a, b) => a - b), ys: [...ys].sort((a, b) => a - b) };
}

function classify(floor: FloorId, x: number, y: number): { type: CellType; ref?: string } {
  for (const rc of roomRectsOn(floor)) if (x > rc.x1 && x < rc.x2 && y > rc.y1 && y < rc.y2) return { type: "room" };
  if (!inRect(x, y, FOOTPRINT)) return { type: "void" };
  for (const d of resolvedDoors) if (d.floor === floor && inRect(x, y, d.rect)) return { type: "door", ref: d.id };
  for (const o of resolvedOpenings) if (o.floor === floor && inRect(x, y, o.rect)) return { type: "opening", ref: o.id };
  const wi = resolvedWindows.findIndex((w) => w.floor === floor && inRect(x, y, w.rect));
  if (wi >= 0) return { type: "window", ref: String(wi) };
  return { type: "solid" };
}

function verticalSegments(type: CellType, ref?: string): [number, number][] {
  const H = FLOOR_TO_FLOOR;
  if (type === "solid") return [[0, H]];
  if (type === "door") return [[DOOR_HEAD, H]];
  if (type === "opening") return [[resolvedOpenings.find((op) => op.id === ref)!.head, H]];
  if (type === "window") {
    const w = resolvedWindows[Number(ref)];
    const segs: [number, number][] = [];
    if (w.sill > 0.001) segs.push([0, w.sill]);
    if (w.head < H - 0.001) segs.push([w.head, H]);
    return segs;
  }
  return [];
}

const wallCache = new Map<FloorId, WallBox[]>();

/** Wall boxes for a floor: every non-room cell inside the footprint, merged into rectangles. */
export function wallBoxes(floor: FloorId): WallBox[] {
  const cached = wallCache.get(floor);
  if (cached) return cached;
  const { xs, ys } = cellLines(floor);
  const nx = xs.length - 1;
  const ny = ys.length - 1;
  const key: (string | null)[][] = [];
  const meta: ({ type: CellType; ref?: string } | null)[][] = [];
  for (let j = 0; j < ny; j++) {
    key.push([]);
    meta.push([]);
    for (let i = 0; i < nx; i++) {
      const c = classify(floor, (xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2);
      const wallish = c.type !== "room" && c.type !== "void";
      key[j].push(wallish ? `${c.type}:${c.ref ?? ""}` : null);
      meta[j].push(wallish ? c : null);
    }
  }
  // Greedy rectangle merge: extend runs along x, then grow downwards while the run repeats.
  const used = key.map((row) => row.map(() => false));
  const out: WallBox[] = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const k = key[j][i];
      if (!k || used[j][i]) continue;
      let i2 = i;
      while (i2 + 1 < nx && key[j][i2 + 1] === k && !used[j][i2 + 1]) i2++;
      let j2 = j;
      outer: while (j2 + 1 < ny) {
        for (let t = i; t <= i2; t++) if (key[j2 + 1][t] !== k || used[j2 + 1][t]) break outer;
        j2++;
      }
      for (let jj = j; jj <= j2; jj++) for (let t = i; t <= i2; t++) used[jj][t] = true;
      const m = meta[j][i]!;
      out.push({
        x1: xs[i], x2: xs[i2 + 1], y1: ys[j], y2: ys[j2 + 1],
        type: m.type as WallBox["type"], ref: m.ref,
        segments: verticalSegments(m.type, m.ref),
      });
    }
  }
  wallCache.set(floor, out);
  return out;
}

/** Wall boxes on the façade line (used for the shell of the other storeys). */
export const isFacadeBox = (b: Rect) =>
  b.x1 <= FOOTPRINT.x1 + EPS || b.x2 >= FOOTPRINT.x2 - EPS || b.y1 <= FOOTPRINT.y1 + EPS || b.y2 >= FOOTPRINT.y2 - EPS;

/** What is at a plan point (room, or a wall cell type). */
export function probe(floor: FloorId, x: number, y: number): { room?: RoomDef; cell: CellType; ref?: string } {
  const room = roomAt(floor, x, y);
  if (room) return { room, cell: "room" };
  const c = classify(floor, x, y);
  return { cell: c.type, ref: c.ref };
}

export function roomAt(floor: FloorId, x: number, y: number): RoomDef | undefined {
  return rooms.find((rm) => rm.floor === floor && rm.rects.some((rc) => x >= rc.x1 && x <= rc.x2 && y >= rc.y1 && y <= rc.y2));
}

/* ------------------------------------------------------------------ balcony balustrade */

export const BALUSTRADE_T = 0.15;
/** Glass balustrade on the three open sides of the balcony. */
export const balustrade: Rect[] = [
  { x1: FOOTPRINT.x1, y1: BALCONY.y2, x2: FOOTPRINT.x2, y2: BALCONY.y2 + BALUSTRADE_T },
  { x1: FOOTPRINT.x1, y1: BALCONY.y1, x2: BALCONY.x1, y2: BALCONY.y2 },
  { x1: BALCONY.x2, y1: BALCONY.y1, x2: FOOTPRINT.x2, y2: BALCONY.y2 },
];

/* ------------------------------------------------------------------ collision obstacles */

export interface Obstacle extends Rect {
  kind: "wall" | "furniture" | "balustrade";
}

/** Static obstacles: walls (door cells excluded — the leaves block when closed), furniture, balustrade. */
export function buildObstacles(): Obstacle[] {
  const walls = wallBoxes(0)
    .filter((b) => b.type === "solid" || b.type === "window")
    .map((b) => ({ x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2, kind: "wall" as const }));
  const items = furniture
    .filter((it) => !NON_BLOCKING.includes(it.type))
    .map((it) => ({ ...footprint(it), kind: "furniture" as const }));
  const rails = balustrade.map((b) => ({ ...b, kind: "balustrade" as const }));
  return [...walls, ...items, ...rails];
}

/* ------------------------------------------------------------------ misc */

/** Subtract rectangle b from a, returning up to four rectangles. */
export function subtractRect(a: Rect, b: Rect): Rect[] {
  if (!rectsOverlap(a, b)) return [a];
  const out: Rect[] = [];
  if (b.y1 > a.y1) out.push({ x1: a.x1, x2: a.x2, y1: a.y1, y2: b.y1 });
  if (b.y2 < a.y2) out.push({ x1: a.x1, x2: a.x2, y1: b.y2, y2: a.y2 });
  const y1 = Math.max(a.y1, b.y1);
  const y2 = Math.min(a.y2, b.y2);
  if (b.x1 > a.x1) out.push({ x1: a.x1, x2: b.x1, y1, y2 });
  if (b.x2 < a.x2) out.push({ x1: b.x2, x2: a.x2, y1, y2 });
  return out;
}
