/**
 * Model checks — a live self-test computed from the layout data and the
 * loaded scene. Nothing here is hard-coded to pass: every row measures.
 */
import {
  BALCONY, BATHROOM_IDS, BEDROOM_IDS, CEILING_HEIGHT, NON_BLOCKING, PLAN_BOUNDS, SEAT_TYPES, SWING_TYPES, TOWER, WALL_TYPES,
  facing, footprint, furniture, roomById, walkableRooms as rooms, type FurnitureDef, type Rect,
} from "../data/houseLayout";
import {
  balustrade, buildObstacles, inRect, leafDir, leaves, probe, rectsOverlap, resolvedDoors, resolvedOpenings, resolvedWindows, wallBoxes,
} from "../data/layoutGeometry";
import { featuredRooms, STATS } from "../data/rooms";

export interface CheckRow {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
}

const blocking = (it: FurnitureDef) => !NON_BLOCKING.includes(it.type);

/* 1 — seats face their table or group */
function checkSeats(): CheckRow {
  const seats = furniture.filter((f) => SEAT_TYPES.includes(f.type));
  const bad: string[] = [];
  for (const s of seats) {
    const group = furniture.filter((f) => f.group && f.group === s.group && f.id !== s.id);
    const anchor = group.find((f) => f.anchor);
    if (!anchor) { bad.push(s.id); continue; }
    // a seat must look at its table: its facing ray hits the table footprint within reach
    const fp = footprint(anchor);
    const [fx, fy] = facing(s.rot);
    let hit = false;
    for (let t = 0; t <= 2.5 && !hit; t += 0.05) hit = inRect(s.x + fx * t, s.y + fy * t, fp, 0.05);
    if (!hit) bad.push(s.id);
  }
  return {
    id: "seats", label: "Chairs and sofas face their table or group", pass: bad.length === 0,
    detail: bad.length ? `${bad.length} of ${seats.length} seats face away` : `${seats.length} seats checked`,
  };
}

/* 2 — art, mirrors, the TV and the lift hang on solid wall */
function checkWallItems(): CheckRow {
  const items = furniture.filter((f) => WALL_TYPES.includes(f.type));
  const bad: string[] = [];
  for (const it of items) {
    const [fx, fy] = facing(it.rot);
    const tx = -fy;
    const ty = fx;
    for (const u of [-0.45, 0, 0.45]) {
      const px = it.x + tx * it.w * u - fx * 0.1;
      const py = it.y + ty * it.w * u - fy * 0.1;
      if (probe(0, px, py).cell !== "solid") { bad.push(it.id); break; }
    }
    if (!probe(0, it.x + fx * 0.06, it.y + fy * 0.06).room && !bad.includes(it.id)) bad.push(it.id);
  }
  const mirrors = items.filter((i) => i.type === "mirror").length;
  return {
    id: "wall-items", label: "Artwork, mirrors and the TV on solid walls", pass: bad.length === 0,
    detail: bad.length ? `${bad.length} items off a solid wall` : `${items.length} items, ${mirrors} mirrors`,
  };
}

/* 3 — door swings clear of furniture */
function checkDoorSwings(): CheckRow {
  const bad = new Set<string>();
  const items = furniture.filter(blocking).map(footprint);
  for (const l of leaves) {
    for (let a = 0; a <= 1.0001; a += 0.1) {
      const [dx, dy] = leafDir(l, a);
      for (let r = 0.1; r <= l.length; r += 0.1) {
        if (items.some((fp) => inRect(l.hx + dx * r, l.hy + dy * r, fp, -0.005))) bad.add(l.doorId);
      }
    }
  }
  for (const d of resolvedDoors) {
    const zone: Rect = d.axis === "x"
      ? { x1: d.rect.x1 + 0.05, x2: d.rect.x2 - 0.05, y1: d.rect.y1 - 0.6, y2: d.rect.y2 + 0.6 }
      : { x1: d.rect.x1 - 0.6, x2: d.rect.x2 + 0.6, y1: d.rect.y1 + 0.05, y2: d.rect.y2 - 0.05 };
    if (furniture.some((f) => blocking(f) && rectsOverlap(footprint(f), zone))) bad.add(d.id);
  }
  return {
    id: "doors", label: "Doors swing clear; nothing blocks an entrance", pass: bad.size === 0,
    detail: bad.size ? `Blocked: ${[...bad].join(", ")}` : `${leaves.length} leaves checked`,
  };
}

/* 4 — every room reachable from the lift (BFS, doors open) */
const CELL = 0.1;
const GW = Math.ceil((PLAN_BOUNDS.x2 - PLAN_BOUNDS.x1) / CELL);
const GH = Math.ceil((PLAN_BOUNDS.y2 - PLAN_BOUNDS.y1) / CELL);
let reachCache: typeof rooms | null = null;

export function reachability() {
  if (reachCache) return reachCache;
  const r = 0.24;
  const obs = buildObstacles().filter((o) => o.kind !== "wall");
  const grid = new Uint8Array(GW * GH);
  for (let j = 0; j < GH; j++)
    for (let i = 0; i < GW; i++) {
      const x = (i + 0.5) * CELL;
      const y = (j + 0.5) * CELL;
      const c = probe(0, x, y).cell;
      if (c === "solid" || c === "window" || c === "void") continue;
      if (obs.some((o) => x > o.x1 - r && x < o.x2 + r && y > o.y1 - r && y < o.y2 + r)) continue;
      grid[j * GW + i] = 1;
    }
  const seen = new Uint8Array(GW * GH);
  const idx = (x: number, y: number) => Math.floor(y / CELL) * GW + Math.floor(x / CELL);
  const queue: number[] = [];
  const push = (k: number) => {
    if (grid[k] && !seen[k]) { seen[k] = 1; queue.push(k); }
  };
  const lobby = roomById("lobby")!;
  push(idx(lobby.arrival.x, lobby.arrival.y));
  for (let q = 0; q < queue.length; q++) {
    const k = queue[q];
    const i = k % GW;
    if (i > 0) push(k - 1);
    if (i < GW - 1) push(k + 1);
    if (k >= GW) push(k - GW);
    if (k < GW * (GH - 1)) push(k + GW);
  }
  reachCache = rooms.filter((rm) => rm.rects.some((rc) => {
    for (let y = rc.y1 + CELL / 2; y < rc.y2; y += CELL)
      for (let x = rc.x1 + CELL / 2; x < rc.x2; x += CELL) if (seen[idx(x, y)]) return true;
    return false;
  }));
  return reachCache;
}

function checkReach(): CheckRow {
  const reached = reachability();
  const missing = rooms.filter((r) => !reached.includes(r));
  return {
    id: "reach", label: "Every room reachable from the lift lobby (walk test)", pass: missing.length === 0,
    detail: missing.length ? `Unreached: ${missing.map((m) => m.name).join(", ")}` : `${reached.length} rooms reached`,
  };
}

/* 5 — balcony guarded, swings with room to swing */
function checkBalcony(): CheckRow {
  // every point along the open edges of the balcony is behind the balustrade
  const edge: [number, number][] = [];
  for (let x = BALCONY.x1; x <= BALCONY.x2; x += 0.1) edge.push([x, BALCONY.y2 + 0.05]);
  for (let y = BALCONY.y1 + 0.05; y <= BALCONY.y2; y += 0.1) edge.push([BALCONY.x1 - 0.05, y], [BALCONY.x2 + 0.05, y]);
  const guarded = edge.every(([x, y]) => balustrade.some((b) => inRect(x, y, b, 0.001)));
  // each swing's sway envelope (±0.35 m fore and aft) stays on the balcony, clear of other furniture and door leaves
  const swings = furniture.filter((f) => SWING_TYPES.includes(f.type));
  const others = furniture.filter((f) => blocking(f) && !SWING_TYPES.includes(f.type)).map(footprint);
  const clashes: string[] = [];
  for (const s of swings) {
    const fp = footprint(s);
    const env: Rect = { x1: fp.x1, x2: fp.x2, y1: fp.y1 - 0.35, y2: fp.y2 + 0.35 };
    const onDeck = env.x1 >= BALCONY.x1 && env.x2 <= BALCONY.x2 && env.y1 >= BALCONY.y1 - 1e-6 && env.y2 <= BALCONY.y2 + 1e-6;
    const hitsFurniture = others.some((o) => rectsOverlap(o, { ...fp, y1: env.y1, y2: env.y2 }));
    const hitsLeaf = leaves.some((l) => {
      for (let a = 0; a <= 1; a += 0.25) {
        const [dx, dy] = leafDir(l, a);
        for (let r = 0; r <= l.length; r += 0.1) if (inRect(l.hx + dx * r, l.hy + dy * r, env)) return true;
      }
      return false;
    });
    if (!onDeck || hitsFurniture || hitsLeaf) clashes.push(s.type);
  }
  return {
    id: "balcony", label: "Balcony guarded; both swings have room to swing", pass: guarded && swings.length === 2 && clashes.length === 0,
    detail: `${(BALCONY.x2 - BALCONY.x1).toFixed(1)} m glass balustrade · ${swings.length} swings${clashes.length ? ` · clash: ${clashes.join(", ")}` : " clear"}`,
  };
}

/* 6 — arrival points clear */
function checkArrivals(): CheckRow {
  const obs = buildObstacles();
  const bad: string[] = [];
  for (const rm of rooms) {
    const { x, y } = rm.arrival;
    const clear = obs.every((o) => {
      const cx = Math.max(o.x1, Math.min(x, o.x2));
      const cy = Math.max(o.y1, Math.min(y, o.y2));
      return Math.hypot(x - cx, y - cy) >= 0.32;
    });
    const leafClear = leaves.every((l) => {
      for (let a = 0; a <= 1; a += 0.25) {
        const [dx, dy] = leafDir(l, a);
        for (let r = 0; r <= l.length; r += 0.1) if (Math.hypot(l.hx + dx * r - x, l.hy + dy * r - y) < 0.32) return false;
      }
      return true;
    });
    if (!(clear && leafClear && probe(0, x, y).room?.id === rm.id)) bad.push(rm.name);
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
  const stat = (label: string) => STATS.find((s) => s.label.startsWith(label))!.value;
  const pass = beds === stat("Bedrooms") && baths === stat("Bathrooms") && TOWER.storeys === stat("Storeys") && Math.abs(CEILING_HEIGHT - stat("Ceiling")) < 1e-9;
  return {
    id: "stats", label: "Property statistics match the model", pass,
    detail: `${beds} bedrooms, ${baths} bathrooms, level ${TOWER.residenceLevel} of ${TOWER.storeys}`,
  };
}

/* 8 — daylight: every habitable room has a window or glazed door */
function checkDaylight(): CheckRow {
  const habitable = rooms.filter((r) => r.flat === "A" && (r.kind === "living" || r.kind === "bedroom" || r.kind === "kitchen"));
  // a room is daylit if it has a window or glazed door, or opens to a daylit room through an opening ≥ 2 m wide
  const touches = (rm: (typeof rooms)[number], r: Rect) => rm.rects.some((rc) => rectsOverlap(r, rc, 0.31));
  const lit = new Set(habitable.filter((rm) =>
    resolvedWindows.some((w) => touches(rm, w.rect)) || resolvedDoors.some((d) => d.glazed && touches(rm, d.rect))).map((rm) => rm.id));
  let grew = true;
  while (grew) {
    grew = false;
    for (const rm of habitable) {
      if (lit.has(rm.id)) continue;
      const borrowed = resolvedOpenings.some((o) => o.width >= 2 && touches(rm, o.rect) &&
        habitable.some((other) => other.id !== rm.id && lit.has(other.id) && touches(other, o.rect)));
      if (borrowed) {
        lit.add(rm.id);
        grew = true;
      }
    }
  }
  const dark = habitable.filter((rm) => !lit.has(rm.id)).map((rm) => rm.name);
  return {
    id: "daylight", label: "Every habitable room has daylight", pass: dark.length === 0,
    detail: dark.length ? `No window: ${dark.join(", ")}` : `${habitable.length} rooms, ${resolvedWindows.length} windows`,
  };
}

/* 9 — measured room sizes */
function measure(x: number, y: number, dx: number, dy: number) {
  let d = 0;
  while (d < 50 && probe(0, x + dx * d, y + dy * d).cell === "room") d += 0.005;
  return d;
}

function checkSizes(): CheckRow {
  const bad: string[] = [];
  // L-shaped rooms (more than one rectangle) have no single width × depth to measure
  const measured = featuredRooms.filter((fr) => /×/.test(fr.chips[0]) && fr.id !== "balcony" && roomById(fr.id)!.rects.length === 1);
  for (const fr of measured) {
    const r = roomById(fr.id)!.rects[0];
    const cx = (r.x1 + r.x2) / 2;
    const cy = (r.y1 + r.y2) / 2;
    const w = measure(cx, cy, -1, 0) + measure(cx, cy, 1, 0);
    const d = measure(cx, cy, 0, -1) + measure(cx, cy, 0, 1);
    const m = fr.chips[0].match(/([\d.]+)\s*×\s*([\d.]+)/);
    if (!m || Math.abs(w - +m[1]) > 0.02 || Math.abs(d - +m[2]) > 0.02) bad.push(`${fr.name} ${w.toFixed(2)}×${d.toFixed(2)}`);
  }
  return {
    id: "sizes", label: "Room sizes match the dimensions listed on the site", pass: bad.length === 0,
    detail: bad.length ? bad.join("; ") : `${measured.length} rooms, measured wall face to wall face`,
  };
}

/* 10 — model loaded */
function checkLoaded(meshes: number, authored: number, ceilingRooms: Set<string>): CheckRow {
  const indoor = rooms.filter((r) => r.kind !== "outdoor");
  const ceilings = indoor.every((r) => ceilingRooms.has(r.id));
  return {
    id: "loaded", label: "Tower and residence loaded", pass: meshes > 0 && wallBoxes(0).length > 0 && ceilings,
    detail: `${TOWER.storeys} storeys · ${meshes} meshes (${authored.toLocaleString("en-GB")} parts merged)`,
  };
}

export function runModelChecks(scene: { meshes: number; authored: number; ceilingRooms: Set<string> }): CheckRow[] {
  return [
    checkSeats(),
    checkWallItems(),
    checkDoorSwings(),
    checkReach(),
    checkBalcony(),
    checkArrivals(),
    checkStats(),
    checkDaylight(),
    checkSizes(),
    checkLoaded(scene.meshes, scene.authored, scene.ceilingRooms),
  ];
}
