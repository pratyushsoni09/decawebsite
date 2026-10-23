/**
 * Model checks — a live self-test computed from the layout data and the
 * loaded scene. Nothing here is hard-coded to pass: every row measures.
 */
import {
  BATHROOM_IDS, BEDROOM_IDS, CEILING_HEIGHT, FLOOR_TO_FLOOR, FOOTPRINT, NON_BLOCKING, SEAT_TYPES, STAIR, WALL_TYPES,
  facing, footprint, furniture, roomById, rooms, roomsOnFloor, type FloorId, type FurnitureDef, type Rect,
} from "../data/houseLayout";
import {
  buildObstacles, flight1Lane, flight2Lane, halfLanding, inRect, leafDir, leaves, probe, rectsOverlap,
  resolvedDoors, stairHeight, wallBoxes, type Obstacle,
} from "../data/layoutGeometry";
import { featuredRooms, STATS } from "../data/rooms";

export interface CheckRow {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
}

const blocking = (it: FurnitureDef) => !NON_BLOCKING.includes(it.type);
const floorOf = (it: FurnitureDef) => roomById(it.room)!.floor;

/* 1 — seats face their table or group */
function checkSeats(): CheckRow {
  const seats = furniture.filter((f) => SEAT_TYPES.includes(f.type));
  const bad: string[] = [];
  for (const s of seats) {
    const group = furniture.filter((f) => f.group && f.group === s.group && f.id !== s.id);
    const anchor = group.find((f) => f.anchor);
    const pts = anchor ? [anchor] : group;
    if (!pts.length) { bad.push(s.id); continue; }
    if (anchor) {
      // a seat at a table must look at the table top: its facing ray hits the table footprint within reach
      const fp = footprint(anchor);
      const [fx, fy] = facing(s.rot);
      let hit = false;
      for (let t = 0; t <= 2.5 && !hit; t += 0.05) hit = inRect(s.x + fx * t, s.y + fy * t, fp, 0.05);
      if (!hit) bad.push(s.id);
      continue;
    }
    const tx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
    const ty = pts.reduce((a, p) => a + p.y, 0) / pts.length;
    const [fx, fy] = facing(s.rot);
    const dx = tx - s.x;
    const dy = ty - s.y;
    const cos = (fx * dx + fy * dy) / (Math.hypot(dx, dy) || 1);
    if (cos < Math.cos((50 * Math.PI) / 180)) bad.push(s.id);
  }
  return {
    id: "seats", label: "Chairs and sofas face their table or group", pass: bad.length === 0,
    detail: bad.length ? `${bad.length} of ${seats.length} seats face away` : `${seats.length} seats checked`,
  };
}

/* 2 — art and mirrors hang on solid wall */
function checkWallItems(): CheckRow {
  const items = furniture.filter((f) => WALL_TYPES.includes(f.type));
  const bad: string[] = [];
  for (const it of items) {
    const floor = floorOf(it);
    const [fx, fy] = facing(it.rot);
    // sample behind the item, across its width
    const tx = -fy;
    const ty = fx;
    for (const u of [-0.45, 0, 0.45]) {
      const px = it.x + tx * it.w * u - fx * 0.1;
      const py = it.y + ty * it.w * u - fy * 0.1;
      if (probe(floor, px, py).cell !== "solid") { bad.push(it.id); break; }
    }
    // and it must not be buried: its face sits inside the room
    const front = probe(floor, it.x + fx * 0.06, it.y + fy * 0.06);
    if (!front.room && !bad.includes(it.id)) bad.push(it.id);
  }
  const mirrors = items.filter((i) => i.type === "mirror").length;
  return {
    id: "wall-items", label: "Artwork and mirrors on solid walls (none buried)", pass: bad.length === 0,
    detail: bad.length ? `${bad.length} items off a solid wall` : `${items.length} items, ${mirrors} mirrors`,
  };
}

/* 3 — door swings clear of furniture */
function checkDoorSwings(): CheckRow {
  const bad = new Set<string>();
  for (const l of leaves) {
    const items = furniture.filter((f) => floorOf(f) === l.floor && blocking(f)).map(footprint);
    for (let a = 0; a <= 1.0001; a += 0.1) {
      const [dx, dy] = leafDir(l, a);
      for (let r = 0.1; r <= l.length; r += 0.1) {
        const px = l.hx + dx * r;
        const py = l.hy + dy * r;
        if (items.some((fp) => inRect(px, py, fp, -0.005))) bad.add(l.doorId);
      }
    }
  }
  // and nothing parks in front of an opening (0.6 m either side)
  for (const d of resolvedDoors) {
    const zone: Rect = d.axis === "x"
      ? { x1: d.rect.x1 + 0.05, x2: d.rect.x2 - 0.05, y1: d.rect.y1 - 0.6, y2: d.rect.y2 + 0.6 }
      : { x1: d.rect.x1 - 0.6, x2: d.rect.x2 + 0.6, y1: d.rect.y1 + 0.05, y2: d.rect.y2 - 0.05 };
    if (furniture.some((f) => floorOf(f) === d.floor && blocking(f) && rectsOverlap(footprint(f), zone))) bad.add(d.id);
  }
  return {
    id: "doors", label: "Doors swing clear; no wardrobe or fixture blocks an entrance", pass: bad.size === 0,
    detail: bad.size ? `Blocked: ${[...bad].join(", ")}` : `${leaves.length} leaves checked`,
  };
}

/* 4 — every room reachable from the front door (BFS, doors open) */
const CELL = 0.1;
const GW = Math.ceil((FOOTPRINT.x2 - FOOTPRINT.x1) / CELL);
const GH = Math.ceil((FOOTPRINT.y2 - FOOTPRINT.y1) / CELL);

function walkGrid(floor: FloorId, obstacles: Obstacle[], radius: number) {
  const grid = new Uint8Array(GW * GH);
  for (let j = 0; j < GH; j++)
    for (let i = 0; i < GW; i++) {
      const x = (i + 0.5) * CELL;
      const y = (j + 0.5) * CELL;
      const c = probe(floor, x, y).cell;
      if (c === "solid" || c === "window" || c === "void") continue;
      if (obstacles.some((o) => x > o.x1 - radius && x < o.x2 + radius && y > o.y1 - radius && y < o.y2 + radius)) continue;
      grid[j * GW + i] = 1;
    }
  return grid;
}

let reachCache: { reached: typeof rooms; stairClear: boolean } | null = null;

export function reachability() {
  if (reachCache) return reachCache;
  const obs = buildObstacles();
  const r = 0.24;
  const grids = [walkGrid(0, obs.ground.filter((o) => o.kind !== "wall"), r), walkGrid(1, obs.first.filter((o) => o.kind !== "wall"), r)];
  const seen = [new Uint8Array(GW * GH), new Uint8Array(GW * GH)];
  const idx = (x: number, y: number) => Math.floor(y / CELL) * GW + Math.floor(x / CELL);
  const queue: [number, number][] = [];
  const push = (f: number, k: number) => {
    if (grids[f][k] && !seen[f][k]) { seen[f][k] = 1; queue.push([f, k]); }
  };
  const front = resolvedDoors.find((d) => d.id === "front")!;
  push(0, idx(front.at, front.rect.y1 - 0.6));
  // the stair: walk the lanes with the stair-mode obstacles; if clear, connect foot and head
  const stairClear = [flight1Lane, halfLanding, flight2Lane].every((lane) => {
    const cx = (lane.x1 + lane.x2) / 2;
    return [lane.y1 + 0.3, (lane.y1 + lane.y2) / 2, lane.y2 - 0.3].every((y) =>
      obs.stair.every((o) => !(cx > o.x1 - 0.3 && cx < o.x2 + 0.3 && y > o.y1 - 0.3 && y < o.y2 + 0.3)));
  });
  const foot = idx((flight1Lane.x1 + flight1Lane.x2) / 2, STAIR.yFoot + 0.35);
  const head = idx((flight2Lane.x1 + flight2Lane.x2) / 2, STAIR.yFoot + 0.35);
  while (queue.length) {
    const [f, k] = queue.shift()!;
    const i = k % GW;
    const j = (k - i) / GW;
    if (i > 0) push(f, k - 1);
    if (i < GW - 1) push(f, k + 1);
    if (j > 0) push(f, k - GW);
    if (j < GH - 1) push(f, k + GW);
    if (stairClear && f === 0 && k === foot) push(1, head);
    if (stairClear && f === 1 && k === head) push(0, foot);
  }
  const reached = rooms.filter((rm) => rm.rects.some((rc) => {
    for (let y = rc.y1 + CELL / 2; y < rc.y2; y += CELL)
      for (let x = rc.x1 + CELL / 2; x < rc.x2; x += CELL) if (seen[rm.floor][idx(x, y)]) return true;
    return false;
  }));
  reachCache = { reached, stairClear };
  return reachCache;
}

function checkReach(): CheckRow {
  const { reached } = reachability();
  const missing = rooms.filter((r) => !reached.includes(r));
  return {
    id: "reach", label: "Every room has a usable entrance (walk test with doors open)", pass: missing.length === 0,
    detail: missing.length ? `Unreached: ${missing.map((m) => m.name).join(", ")}` : `${reached.length} rooms reached from the front door`,
  };
}

/* 5 — staircase */
function checkStair(): CheckRow {
  const risers = STAIR.risers;
  const rise = FLOOR_TO_FLOOR / risers;
  const riseOk = Math.abs(rise - STAIR.rise) < 1e-6 && rise <= 0.2;
  const runOk = Math.abs(STAIR.yFoot - STAIR.yLanding - 9 * STAIR.going) < 1e-6;
  const { stairClear } = reachability();
  // guard: every point on the void edge is guarded (stair obstacle in first-floor mode) except the flight-2 head
  const obs = buildObstacles().first.filter((o) => o.kind === "stair");
  const v = STAIR.void;
  const edge: [number, number][] = [];
  for (let x = v.x1; x <= STAIR.flight2.x1; x += 0.1) edge.push([x, v.y2 - 0.01]);
  for (let y = v.y1 + 0.1; y <= v.y2; y += 0.1) edge.push([v.x1 + 0.01, y], [v.x2 - 0.01, y]);
  const guarded = edge.every(([x, y]) => obs.some((o) => inRect(x, y, o, 0.02)));
  // headroom along the walking line: ceiling above minus surface
  let minHead = Infinity;
  const samples: [number, number, number][] = [];
  for (let y = STAIR.yLanding; y <= STAIR.yFoot + 0.6; y += 0.05) {
    samples.push([(flight1Lane.x1 + flight1Lane.x2) / 2, y, stairHeight((flight1Lane.x1 + flight1Lane.x2) / 2, y) ?? 0]);
    samples.push([(flight2Lane.x1 + flight2Lane.x2) / 2, y, stairHeight((flight2Lane.x1 + flight2Lane.x2) / 2, y) ?? FLOOR_TO_FLOOR]);
  }
  for (const [x, y, h] of samples) {
    const underVoid = inRect(x, y, v);
    const ceiling = h >= FLOOR_TO_FLOOR - 0.01 || underVoid ? FLOOR_TO_FLOOR + CEILING_HEIGHT : CEILING_HEIGHT;
    minHead = Math.min(minHead, ceiling - h);
  }
  const pass = riseOk && runOk && stairClear && guarded && minHead >= 2.0;
  return {
    id: "stair", label: "Staircase walkable both ways, guarded, with headroom", pass,
    detail: `${risers} risers × ${Math.round(rise * 1000)} mm, min headroom ${minHead.toFixed(2)} m${guarded ? "" : " · void unguarded"}${stairClear ? "" : " · lane blocked"}`,
  };
}

/* 6 — arrival points clear */
function checkArrivals(): CheckRow {
  const obs = buildObstacles();
  const bad: string[] = [];
  for (const rm of rooms) {
    const { x, y } = rm.arrival;
    const list = rm.floor === 0 ? obs.ground : obs.first;
    const clear = list.every((o) => {
      const cx = Math.max(o.x1, Math.min(x, o.x2));
      const cy = Math.max(o.y1, Math.min(y, o.y2));
      return Math.hypot(x - cx, y - cy) >= 0.32;
    });
    const leafClear = leaves.filter((l) => l.floor === rm.floor).every((l) => {
      for (let a = 0; a <= 1; a += 0.25) {
        const [dx, dy] = leafDir(l, a);
        for (let r = 0; r <= l.length; r += 0.1) if (Math.hypot(l.hx + dx * r - x, l.hy + dy * r - y) < 0.32) return false;
      }
      return true;
    });
    const inRoom = probe(rm.floor, x, y).room?.id === rm.id;
    if (!(clear && leafClear && inRoom)) bad.push(rm.name);
  }
  return {
    id: "arrivals", label: "Room navigation points clear of furniture", pass: bad.length === 0,
    detail: bad.length ? `Obstructed: ${bad.join(", ")}` : `${rooms.length} arrival points`,
  };
}

/* 7 — statistics */
function checkStats(): CheckRow {
  const isFull = (id: string) => {
    const f = furniture.filter((it) => it.room === id);
    return f.some((it) => it.type === "wc") && f.some((it) => it.type === "vanity") && f.some((it) => it.type === "bath" || it.type === "shower");
  };
  const beds = BEDROOM_IDS.filter((id) => furniture.some((it) => it.room === id && it.type === "bed")).length;
  const baths = BATHROOM_IDS.filter(isFull).length;
  const statBeds = STATS.find((s) => s.label === "Bedrooms")!.value;
  const statBaths = STATS.find((s) => s.label === "Bathrooms")!.value;
  const floors = new Set(rooms.map((r) => r.floor)).size;
  const statFloors = STATS.find((s) => s.label === "Floors")!.value;
  const pass = beds === statBeds && baths === statBaths && floors === statFloors && Math.abs(CEILING_HEIGHT - 3.35) < 1e-9;
  return {
    id: "stats", label: "Property statistics match the model", pass,
    detail: `${beds} bedrooms, ${baths} full bathrooms, ${floors} floors`,
  };
}

/* 8 — dining room enclosed */
function checkDining(ceilingRooms: Set<string>): CheckRow {
  const rm = roomById("dining")!;
  const r = rm.rects[0];
  const sides = [
    (t: number) => [r.x1 + (r.x2 - r.x1) * t, r.y1 - 0.1],
    (t: number) => [r.x1 + (r.x2 - r.x1) * t, r.y2 + 0.1],
    (t: number) => [r.x1 - 0.1, r.y1 + (r.y2 - r.y1) * t],
    (t: number) => [r.x2 + 0.1, r.y1 + (r.y2 - r.y1) * t],
  ];
  let walled = 0;
  let windows = 0;
  let doors = 0;
  for (const side of sides) {
    let solid = 0;
    const n = 60;
    for (let i = 0; i < n; i++) {
      const [x, y] = side((i + 0.5) / n);
      const c = probe(0, x, y);
      if (c.cell === "solid" || c.cell === "window" || c.cell === "door") solid++;
      if (c.cell === "window") windows++;
      if (c.cell === "door" && c.ref === "garden") doors++;
    }
    if (solid / n >= 0.7) walled++;
  }
  const ceiling = ceilingRooms.has("dining");
  const pass = walled === 4 && ceiling && windows > 0 && doors > 0;
  return {
    id: "dining", label: "Dining room enclosed with walls, ceiling, windows and garden doors", pass,
    detail: `${walled} walls${ceiling ? " + ceiling" : ""}`,
  };
}

/* 9 — measured room sizes */
function measure(floor: FloorId, x: number, y: number, dx: number, dy: number) {
  let d = 0;
  while (d < 50 && probe(floor, x + dx * d, y + dy * d).cell === "room") d += 0.005;
  return d;
}

function checkSizes(): CheckRow {
  const bad: string[] = [];
  for (const fr of featuredRooms) {
    const rm = roomById(fr.id)!;
    const r = rm.rects[0];
    const cx = (r.x1 + r.x2) / 2;
    const cy = (r.y1 + r.y2) / 2;
    const w = measure(rm.floor, cx, cy, -1, 0) + measure(rm.floor, cx, cy, 1, 0);
    const d = measure(rm.floor, cx, cy, 0, -1) + measure(rm.floor, cx, cy, 0, 1);
    const m = fr.chips[0].match(/([\d.]+)\s*×\s*([\d.]+)/);
    if (!m || Math.abs(w - +m[1]) > 0.02 || Math.abs(d - +m[2]) > 0.02) bad.push(`${fr.name} ${w.toFixed(2)}×${d.toFixed(2)}`);
  }
  return {
    id: "sizes", label: "Room sizes match the dimensions listed on the site", pass: bad.length === 0,
    detail: bad.length ? bad.join("; ") : `${featuredRooms.length} rooms, measured wall face to wall face`,
  };
}

/* 10 — floors loaded */
function checkFloors(meshes: number, authored: number): CheckRow {
  const g = roomsOnFloor(0).length;
  const f = roomsOnFloor(1).length;
  const walls = wallBoxes(0).length + wallBoxes(1).length;
  return {
    id: "floors", label: "Floors loaded", pass: g > 0 && f > 0 && meshes > 0 && walls > 0,
    detail: `Ground floor + First floor · ${meshes} meshes (${authored.toLocaleString("en-GB")} parts merged)`,
  };
}

export function runModelChecks(scene: { meshes: number; authored: number; ceilingRooms: Set<string> }): CheckRow[] {
  return [
    checkSeats(),
    checkWallItems(),
    checkDoorSwings(),
    checkReach(),
    checkStair(),
    checkArrivals(),
    checkStats(),
    checkDining(scene.ceilingRooms),
    checkSizes(),
    checkFloors(scene.meshes, scene.authored),
  ];
}
