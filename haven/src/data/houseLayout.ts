/**
 * Single source of truth for The Oak Residences — a 15-storey tower with two
 * mirrored 3BHK homes on every floor around a central lift lobby — and for
 * Residence 11A, the west home on level 11 that you can walk.
 *
 * Plan coordinates are in metres: x runs west → east, y runs north → south
 * (north at the top of the drawing). In the 3D scene plan y becomes world z.
 * Every room rectangle is an interior, wall-face to wall-face rectangle;
 * walls are *derived* as whatever is left between rooms inside the
 * footprint (see layoutGeometry.ts). The SVG plan, the 3D model, the
 * collision map and the model checks are all built from this file.
 */

export type FloorId = 0;

export interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type RoomKind = "living" | "bedroom" | "bathroom" | "hall" | "service" | "kitchen" | "outdoor";
export type FloorFinish = "oak" | "darkPlank" | "polished" | "carpet" | "herringbone" | "stone" | "marble" | "tile" | "teak";
/** A = the walkable home, B = the mirrored neighbour (shell only), common = the lift lobby. */
export type Flat = "A" | "B" | "common";

export interface RoomDef {
  id: string;
  floor: FloorId;
  name: string;
  flat: Flat;
  /** Interior rectangles (union). The first one is used for labels and dimensions. */
  rects: Rect[];
  kind: RoomKind;
  finish: FloorFinish;
  /** Arrival point for teleports / deep links. yaw: facing in degrees, 0 = south, 90 = east, 180 = north, 270 = west. */
  arrival: { x: number; y: number; yaw: number };
  hideDims?: boolean;
}

/** A door in a wall. axis "x": the opening runs along x (wall runs east-west). axis "y": opening runs along y. */
export interface DoorDef {
  id: string;
  floor: FloorId;
  axis: "x" | "y";
  at: number;
  /** any coordinate inside the wall thickness, across the axis */
  pos: number;
  width: number;
  leaves: 1 | 2;
  /** +1 = leaves swing towards +y (axis x) or +x (axis y) */
  swing: 1 | -1;
  hinge?: "start" | "end";
  glazed?: boolean;
  exterior?: boolean;
}

export interface OpeningDef {
  id: string;
  floor: FloorId;
  axis: "x" | "y";
  at: number;
  pos: number;
  width: number;
  head: number;
}

export interface WindowDef {
  floor: FloorId;
  side: "N" | "S" | "E" | "W";
  at: number;
  width: number;
  sill: number;
  head: number;
}

export type FurnitureType =
  | "sofa" | "loungeChair" | "readingChair" | "chair" | "deskChair" | "stool"
  | "coffeeTable" | "sideTable" | "table" | "roundTable" | "island"
  | "kitchenRun" | "tallUnits" | "bed" | "nightstand" | "desk" | "shelf" | "wardrobe"
  | "bath" | "vanity" | "shower" | "wc" | "sideboard" | "console" | "dresser" | "bench"
  | "plant" | "floorLamp" | "rug" | "art" | "mirror" | "pendant" | "chandelier" | "washer"
  | "tv" | "lift" | "planter" | "swingEgg" | "swingBench"
  | "tvWall" | "poojaUnit" | "chimney" | "cove" | "accentWall";

export interface FurnitureDef {
  id: string;
  room: string;
  type: FurnitureType;
  /** footprint centre (plan metres); for wall items: the point on the wall face */
  x: number;
  y: number;
  /** facing direction, degrees (0 = south, 90 = east, 180 = north, 270 = west) */
  rot: number;
  w: number;
  d: number;
  h: number;
  /** wall items: centre height above the floor */
  elev?: number;
  group?: string;
  anchor?: boolean;
  variant?: string;
}

/* ------------------------------------------------------------------ the tower */

export const TOWER = {
  storeys: 15,
  /** the walkable residence sits on this level (1 = ground) */
  residenceLevel: 11,
  floorToFloor: 3.3,
  homesPerFloor: 2,
};

/** Enclosed floor plate of every storey. */
export const FOOTPRINT: Rect = { x1: 0, y1: 0, x2: 24, y2: 16 };
/** Residence 11A's balcony (interior of the balustrade and the privacy screen). */
export const BALCONY: Rect = { x1: 0.3, y1: 16, x2: 11.875, y2: 19.0 };
/** Everything drawn on the plan: plate + balcony + balustrade. */
export const PLAN_BOUNDS: Rect = { x1: 0, y1: 0, x2: 24, y2: 19.15 };
/** The two homes meet on this line (party wall and balcony privacy screen). */
export const PARTY_X = 12;

export const EXT_WALL = 0.3;
export const FLOOR_TO_FLOOR = TOWER.floorToFloor;
export const CEILING_HEIGHT = 3.0;
export const DOOR_HEAD = 2.3;
export const RESIDENCE_ELEVATION = (TOWER.residenceLevel - 1) * FLOOR_TO_FLOOR;
export const FLOOR_LEVEL: Record<FloorId, number> = { 0: RESIDENCE_ELEVATION };
export const FLOOR_NAMES: Record<FloorId, string> = { 0: `Level ${TOWER.residenceLevel}` };
export const RESIDENCE_NAME = "Residence 11A";

const r = (x1: number, y1: number, x2: number, y2: number): Rect => ({ x1, y1, x2, y2 });
const mirrorRect = (rc: Rect): Rect => r(FOOTPRINT.x2 - rc.x2, rc.y1, FOOTPRINT.x2 - rc.x1, rc.y2);

/* ------------------------------------------------------------------ rooms */

/** Residence 11A — a simple 3BHK: hall, dining hall (with an open pooja unit), kitchen, three bedrooms, two bathrooms. */
const homeA: RoomDef[] = [
  { id: "kitchen", floor: 0, flat: "A", name: "Kitchen", rects: [r(6.8, 0.3, 10.6, 3.6)], kind: "kitchen", finish: "darkPlank", arrival: { x: 10.15, y: 1.7, yaw: 270 } },
  { id: "bath", floor: 0, flat: "A", name: "Bathroom", rects: [r(4.85, 0.3, 6.55, 3.6)], kind: "bathroom", finish: "tile", arrival: { x: 6.1, y: 2.0, yaw: 180 }, hideDims: true },
  { id: "bed2", floor: 0, flat: "A", name: "Bedroom two", rects: [r(0.3, 0.3, 4.6, 4.9)], kind: "bedroom", finish: "oak", arrival: { x: 2.9, y: 4.2, yaw: 300 } },
  { id: "bed3", floor: 0, flat: "A", name: "Bedroom three", rects: [r(0.3, 5.15, 4.6, 8.9)], kind: "bedroom", finish: "carpet", arrival: { x: 2.8, y: 6.3, yaw: 240 } },
  { id: "dining", floor: 0, flat: "A", name: "Dining hall", rects: [r(4.85, 3.85, 10.6, 8.9), r(10.6, 5.75, 11.875, 8.9)], kind: "living", finish: "darkPlank", arrival: { x: 9.9, y: 6.4, yaw: 270 } },
  { id: "living", floor: 0, flat: "A", name: "Hall", rects: [r(4.85, 9.15, 11.875, 15.7)], kind: "living", finish: "darkPlank", arrival: { x: 5.8, y: 10.4, yaw: 150 } },
  { id: "master-bath", floor: 0, flat: "A", name: "Master bath", rects: [r(0.3, 9.15, 2.4, 11.15)], kind: "bathroom", finish: "tile", arrival: { x: 1.75, y: 10.25, yaw: 180 }, hideDims: true },
  { id: "master", floor: 0, flat: "A", name: "Master bedroom", rects: [r(0.3, 11.4, 4.6, 15.7), r(2.65, 9.15, 4.6, 11.4)], kind: "bedroom", finish: "polished", arrival: { x: 3.6, y: 13.4, yaw: 300 } },
  { id: "balcony", floor: 0, flat: "A", name: "Balcony", rects: [BALCONY], kind: "outdoor", finish: "teak", arrival: { x: 8.0, y: 17.8, yaw: 0 } },
];

const lobby: RoomDef = {
  id: "lobby", floor: 0, flat: "common", name: "Lift lobby", rects: [r(10.85, 0.3, 13.15, 5.5)], kind: "hall", finish: "stone",
  arrival: { x: 12.0, y: 3.0, yaw: 270 }, hideDims: true,
};

/** Residence 11B mirrors 11A across the party wall; it is modelled as a shell (walls and windows) only. */
const homeB: RoomDef[] = homeA.map((rm) => ({
  ...rm,
  id: `b-${rm.id}`,
  flat: "B",
  rects: rm.rects.map(mirrorRect),
  arrival: { ...rm.arrival, x: FOOTPRINT.x2 - rm.arrival.x },
  hideDims: true,
}));

export const rooms: RoomDef[] = [...homeA, lobby, ...homeB];

/* ------------------------------------------------------------------ doors (10 leaves) */

export const doors: DoorDef[] = [
  { id: "front", floor: 0, axis: "y", at: 4.6, pos: 10.72, width: 1.0, leaves: 1, swing: -1, hinge: "start" },
  { id: "bath", floor: 0, axis: "x", at: 5.75, pos: 3.72, width: 0.8, leaves: 1, swing: -1, hinge: "start" },
  { id: "bed2", floor: 0, axis: "y", at: 4.4, pos: 4.72, width: 0.9, leaves: 1, swing: -1, hinge: "start" },
  { id: "bed3", floor: 0, axis: "y", at: 7.0, pos: 4.72, width: 0.9, leaves: 1, swing: -1, hinge: "start" },
  { id: "master-bath", floor: 0, axis: "y", at: 9.55, pos: 2.52, width: 0.7, leaves: 1, swing: -1, hinge: "start" },
  { id: "master", floor: 0, axis: "y", at: 10.2, pos: 4.72, width: 0.9, leaves: 1, swing: -1, hinge: "start" },
  { id: "master-balcony", floor: 0, axis: "x", at: 2.45, pos: 15.85, width: 1.5, leaves: 2, swing: 1, glazed: true, exterior: true },
  { id: "living-balcony", floor: 0, axis: "x", at: 8.0, pos: 15.85, width: 2.4, leaves: 2, swing: 1, glazed: true, exterior: true },
];

/** The kitchen and the hall open off the dining hall without doors. */
export const openings: OpeningDef[] = [
  { id: "kitchen-dining", floor: 0, axis: "x", at: 8.7, pos: 3.72, width: 3.5, head: 2.6 },
  { id: "dining-hall", floor: 0, axis: "x", at: 7.5, pos: 9.02, width: 3.0, head: 2.7 },
];

/* ------------------------------------------------------------------ windows */

const full = { sill: 0.12, head: 2.85 };
const std = { sill: 0.75, head: 2.7 };
const high = { sill: 1.4, head: 2.3 };
const windowsA: WindowDef[] = [
  { floor: 0, side: "N", at: 2.3, width: 1.8, ...std },
  { floor: 0, side: "N", at: 5.75, width: 0.7, ...high },
  { floor: 0, side: "N", at: 9.4, width: 1.2, sill: 1.1, head: 2.3 },
  { floor: 0, side: "W", at: 6.3, width: 2.0, sill: 0.8, head: 2.55 },
  { floor: 0, side: "W", at: 10.0, width: 0.6, ...high },
  { floor: 0, side: "W", at: 13.5, width: 1.8, ...full },
  { floor: 0, side: "S", at: 5.85, width: 1.6, ...full },
  { floor: 0, side: "S", at: 10.55, width: 2.2, ...full },
  { floor: 0, side: "S", at: 0.95, width: 0.9, ...full },
  { floor: 0, side: "S", at: 3.95, width: 0.9, ...full },
];
const mirrorWindow = (w: WindowDef): WindowDef =>
  w.side === "N" || w.side === "S" ? { ...w, at: FOOTPRINT.x2 - w.at } : { ...w, side: w.side === "W" ? "E" : "W" };
export const windows: WindowDef[] = [...windowsA, ...windowsA.map(mirrorWindow)];

/* ------------------------------------------------------------------ furniture */

const SIZES: Record<FurnitureType, [number, number, number]> = {
  sofa: [2.4, 0.95, 0.8],
  loungeChair: [0.85, 0.85, 0.8],
  readingChair: [0.8, 0.85, 0.95],
  chair: [0.5, 0.55, 0.95],
  deskChair: [0.55, 0.55, 0.9],
  stool: [0.42, 0.42, 0.75],
  coffeeTable: [1.2, 0.6, 0.4],
  sideTable: [0.5, 0.5, 0.55],
  table: [1.8, 0.9, 0.76],
  roundTable: [1.0, 1.0, 0.76],
  island: [2.8, 1.1, 0.92],
  kitchenRun: [3, 0.65, 0.9],
  tallUnits: [0.8, 0.65, 2.2],
  bed: [1.8, 2.1, 0.55],
  nightstand: [0.5, 0.45, 0.55],
  desk: [1.2, 0.6, 0.76],
  shelf: [1.6, 0.35, 2.0],
  wardrobe: [1.8, 0.6, 2.95],
  bath: [1.7, 0.8, 0.6],
  vanity: [0.8, 0.5, 0.85],
  shower: [1.0, 1.0, 2.1],
  wc: [0.4, 0.65, 0.8],
  sideboard: [1.6, 0.45, 0.8],
  console: [1.6, 0.42, 0.9],
  dresser: [1.2, 0.5, 0.85],
  bench: [1.4, 0.45, 0.45],
  plant: [0.6, 0.6, 1.5],
  floorLamp: [0.4, 0.4, 1.6],
  rug: [3, 2, 0.01],
  art: [1.0, 0.04, 0.8],
  mirror: [0.6, 0.04, 0.8],
  pendant: [0.6, 0.6, 0.45],
  chandelier: [1.2, 0.3, 0.5],
  washer: [0.62, 0.65, 0.88],
  tv: [1.65, 0.05, 0.95],
  lift: [1.3, 0.05, 2.25],
  planter: [1.6, 0.42, 0.55],
  swingEgg: [1.1, 1.1, 2.0],
  swingBench: [2.0, 1.2, 2.1],
  tvWall: [3.4, 0.06, 2.6],
  poojaUnit: [1.4, 0.6, 2.2],
  chimney: [0.9, 0.5, 0.5],
  cove: [6, 6, 0.25],
  accentWall: [3, 0.04, 2.9],
};

export const SEAT_TYPES: FurnitureType[] = ["sofa", "loungeChair", "readingChair", "chair", "deskChair", "stool"];
export const WALL_TYPES: FurnitureType[] = ["art", "mirror", "tv", "lift", "tvWall", "chimney", "accentWall"];
export const SWING_TYPES: FurnitureType[] = ["swingEgg", "swingBench"];
export const NON_BLOCKING: FurnitureType[] = ["rug", "art", "mirror", "pendant", "chandelier", "tv", "lift", "tvWall", "chimney", "cove", "accentWall"];

let counter = 0;
function f(
  room: string,
  type: FurnitureType,
  x: number,
  y: number,
  rot = 0,
  o: Partial<Omit<FurnitureDef, "id" | "room" | "type" | "x" | "y" | "rot">> = {},
): FurnitureDef {
  const [w, d, h] = SIZES[type];
  counter += 1;
  return { id: `${room}-${type}-${counter}`, room, type, x, y, rot, w, d, h, ...o };
}

export const furniture: FurnitureDef[] = [
  /* Lift lobby 10.85..13.15 × 0.3..5.5 */
  f("lobby", "lift", 12.0, 0.32, 0, { elev: 1.125 }),
  f("lobby", "plant", 12.75, 4.9, 0, { variant: "fig", w: 0.5, d: 0.5, h: 1.3 }),
  f("lobby", "pendant", 12.0, 2.8, 0, { variant: "dome" }),

  /* Kitchen 6.8..10.6 × 0.3..3.6 — after the client's dark kitchen-dining photo: open to the dining hall, charcoal walls,
     grey-oak run with lit glass uppers and a steel hood, wood appliance column, long wood island with an induction hob */
  f("kitchen", "kitchenRun", 8.7, 0.63, 0, { w: 3.8, variant: "modular" }),
  f("kitchen", "tallUnits", 7.125, 1.8, 90, { w: 1.6, h: 2.4, variant: "column" }),
  f("kitchen", "island", 9.05, 2.4, 0, { w: 1.8, d: 0.9, variant: "wood" }),
  f("kitchen", "accentWall", 7.775, 0.32, 0, { variant: "charcoal", w: 1.9, elev: 1.95, h: 2.1 }),
  f("kitchen", "accentWall", 10.58, 1.95, 270, { variant: "charcoal", w: 3.2, elev: 1.5, h: 3.0 }),
  f("kitchen", "accentWall", 6.82, 1.95, 90, { variant: "charcoal", w: 3.2, elev: 1.5, h: 3.0 }),
  f("kitchen", "chimney", 7.95, 0.32, 0, { elev: 1.9 }),

  /* Bathroom 4.85..6.55 × 0.3..3.6 */
  f("bath", "shower", 6.05, 0.8, 0),
  f("bath", "wc", 5.18, 1.0, 90),
  f("bath", "vanity", 5.1, 2.2, 90, { w: 0.8 }),
  f("bath", "mirror", 4.87, 2.2, 90, { elev: 1.5, w: 0.5 }),

  /* Bedroom two 0.3..4.6 × 0.3..4.9 — twin beds against an orange and cream feature wall */
  f("bed2", "accentWall", 0.32, 2.4, 90, { variant: "orangeArc", w: 4.2, elev: 1.45, h: 2.9 }),
  f("bed2", "rug", 2.0, 2.3, 0, { variant: "round", w: 2.8, d: 2.8 }),
  f("bed2", "bed", 1.3, 1.25, 90, { variant: "twin", w: 1.0, d: 2.0 }),
  f("bed2", "bed", 1.3, 3.35, 90, { variant: "twin", w: 1.0, d: 2.0 }),
  f("bed2", "nightstand", 0.55, 2.3, 90, { variant: "cream" }),
  f("bed2", "wardrobe", 4.3, 1.8, 270, { w: 2.2 }),
  f("bed2", "dresser", 3.3, 0.55, 0, { w: 0.9, d: 0.45 }),

  /* Bedroom three 0.3..4.6 × 5.15..8.9 — after the client's photo: terracotta wall with a row of open shelf boxes over a
     grey bed, a long wood desk under a wide window, orange chair, carpet tiles */
  f("bed3", "accentWall", 2.1, 8.88, 180, { variant: "terracotta", w: 3.6, elev: 1.45, h: 2.9 }),
  f("bed3", "desk", 0.62, 6.35, 90, { variant: "long", w: 1.8, group: "b3-desk", anchor: true }),
  f("bed3", "deskChair", 1.3, 6.35, 270, { variant: "orange", group: "b3-desk" }),
  f("bed3", "bed", 2.0, 7.9, 180, { variant: "grey", w: 1.6, d: 2.0 }),
  f("bed3", "nightstand", 0.85, 8.65, 180, { variant: "cube", w: 0.45, d: 0.4, h: 0.5 }),
  f("bed3", "plant", 2.6, 5.45, 0, { variant: "fig", w: 0.5, d: 0.5, h: 1.2 }),
  f("bed3", "wardrobe", 4.3, 8.2, 270, { w: 1.4 }),

  /* Dining hall 4.85..10.6 × 3.85..8.9 (+ 10.6..11.875 × 5.75..8.9) — table for six, open pooja unit, crockery, shoe cabinet */
  f("dining", "table", 7.7, 6.35, 0, { variant: "slab", w: 1.95, d: 1.0, group: "dining", anchor: true }),
  ...[7.2, 8.2].flatMap((x) => [
    f("dining", "chair", x, 5.45, 0, { group: "dining" }),
    f("dining", "chair", x, 7.25, 180, { group: "dining" }),
  ]),
  f("dining", "chair", 6.4, 6.35, 90, { group: "dining" }),
  f("dining", "chair", 9.0, 6.35, 270, { group: "dining" }),
  f("dining", "pendant", 7.7, 6.35, 0, { variant: "cluster", w: 1.3, d: 0.3, h: 0.45 }),
  f("dining", "poojaUnit", 5.15, 8.15, 90, { w: 1.2 }),
  f("dining", "sideboard", 10.3, 8.65, 180),
  f("dining", "art", 10.3, 8.88, 180, { elev: 1.6, w: 1.0, h: 0.7 }),
  f("dining", "console", 11.665, 7.3, 270, { variant: "shoe", w: 1.2 }),
  f("dining", "mirror", 11.86, 7.3, 270, { elev: 1.55, w: 0.7, h: 0.8 }),

  /* Hall 4.85..11.875 × 9.15..15.7 — after the client's photo: facing the east wall, a wood-veneer feature wall with a
     large painting and lit shelving, a floating console, two brown sofas facing across a round table, windows on the right */
  f("living", "cove", 8.36, 12.43, 0, { w: 6.6, d: 6.1 }),
  f("living", "tvWall", 11.86, 12.4, 270, { variant: "panel", w: 3.6, elev: 1.45, h: 2.9 }),
  f("living", "console", 11.65, 12.4, 270, { variant: "float", w: 3.4, d: 0.45, h: 0.45 }),
  f("living", "rug", 9.75, 12.4, 0, { variant: "grey", w: 2.3, d: 2.2 }),
  f("living", "coffeeTable", 9.6, 12.4, 0, { variant: "round", w: 0.9, d: 0.9, h: 0.42, group: "living", anchor: true }),
  f("living", "sofa", 9.6, 11.05, 0, { group: "living", w: 2.3, variant: "tan" }),
  f("living", "sofa", 9.6, 13.75, 180, { group: "living", w: 2.3, variant: "tanThrow" }),
  f("living", "floorLamp", 11.15, 14.6, 45, { variant: "arc" }),
  f("living", "plant", 11.4, 15.2, 0, { variant: "fig", w: 0.6, d: 0.6, h: 1.8 }),
  f("living", "plant", 11.4, 9.65, 0, { variant: "fig", w: 0.6, d: 0.6, h: 1.6 }),
  f("living", "art", 9.6, 9.17, 0, { elev: 1.55, w: 0.7, h: 1.1 }),
  f("living", "art", 10.45, 9.17, 0, { elev: 1.6, w: 0.5, h: 0.7 }),
  f("living", "art", 11.1, 9.17, 0, { elev: 1.6, w: 0.5, h: 0.7 }),
  f("living", "pendant", 11.55, 10.75, 0, { variant: "bulb", w: 0.12, d: 0.12, h: 1.5 }),
  f("living", "pendant", 11.55, 14.05, 0, { variant: "bulb", w: 0.12, d: 0.12, h: 1.5 }),
  f("living", "sideboard", 5.08, 12.4, 90, { w: 1.8 }),
  f("living", "art", 4.87, 12.4, 90, { elev: 1.6, w: 1.2, h: 0.8 }),

  /* Master bath 0.3..2.4 × 9.15..11.15 */
  f("master-bath", "shower", 0.85, 9.7, 0, { w: 1.1, d: 1.1 }),
  f("master-bath", "wc", 0.63, 10.9, 90),
  f("master-bath", "vanity", 1.75, 10.9, 180, { w: 0.8 }),
  f("master-bath", "mirror", 1.75, 11.13, 180, { elev: 1.5, w: 0.5 }),

  /* Master bedroom 0.3..4.6 × 11.4..15.7 (+ wardrobe bay 2.65..4.6 × 9.15..11.4) — sculpted bed under a lit canopy */
  f("master", "wardrobe", 2.95, 10.55, 90, { w: 1.4 }),
  f("master", "cove", 2.45, 13.55, 0, { w: 3.8, d: 3.8 }),
  f("master", "bed", 1.85, 12.55, 0, { variant: "sculpted", w: 2.6, d: 2.3 }),
  f("master", "rug", 1.3, 14.7, 0, { variant: "rose", w: 2.0, d: 1.6 }),
  f("master", "loungeChair", 0.95, 15.1, 135, { variant: "pink", w: 0.9, d: 0.9, group: "master-lounge" }),
  f("master", "bench", 1.6, 14.45, 0, { variant: "ottoman", w: 0.7, d: 0.7, h: 0.45, group: "master-lounge", anchor: true }),
  f("master", "dresser", 4.35, 13.6, 270),
  f("master", "mirror", 4.58, 13.6, 270, { elev: 1.45, w: 0.7, h: 0.8 }),
  f("master", "plant", 0.6, 14.0, 0, { variant: "olive", w: 0.5, d: 0.5, h: 1.3 }),

  /* Balcony 0.3..11.875 × 16..19.0 */
  f("balcony", "planter", 0.9, 18.75, 0, { w: 1.0 }),
  f("balcony", "roundTable", 2.45, 18.35, 0, { group: "bistro", anchor: true, w: 0.7, d: 0.7 }),
  f("balcony", "chair", 1.8, 18.35, 90, { group: "bistro" }),
  f("balcony", "chair", 3.1, 18.35, 270, { group: "bistro" }),
  f("balcony", "swingEgg", 4.6, 17.6, 90),
  f("balcony", "plant", 6.2, 18.65, 0, { variant: "olive" }),
  f("balcony", "planter", 8.0, 18.75, 0),
  f("balcony", "swingBench", 10.6, 17.7, 0),
];

/* ------------------------------------------------------------------ helpers */

export const roomById = (id: string) => rooms.find((rm) => rm.id === id);
export const roomsOnFloor = (floor: FloorId) => rooms.filter((rm) => rm.floor === floor);
/** Rooms you can walk: Residence 11A and the lift lobby. */
export const walkableRooms = rooms.filter((rm) => rm.flat !== "B");

export const BEDROOM_IDS = homeA.filter((rm) => rm.kind === "bedroom").map((rm) => rm.id);
export const BATHROOM_IDS = homeA.filter((rm) => rm.kind === "bathroom").map((rm) => rm.id);

/** Carpet area of Residence 11A (all its rooms except the balcony) and balcony area, m². */
export const AREAS = {
  internal: homeA.filter((rm) => rm.kind !== "outdoor").reduce((a, rm) => a + rm.rects.reduce((s, rc) => s + (rc.x2 - rc.x1) * (rc.y2 - rc.y1), 0), 0),
  balcony: (BALCONY.x2 - BALCONY.x1) * (BALCONY.y2 - BALCONY.y1),
};

/** Facing unit vector in plan space for a rotation in degrees. */
export function facing(rotDeg: number): [number, number] {
  const a = (rotDeg * Math.PI) / 180;
  return [Math.sin(a), Math.cos(a)];
}

/** Axis-aligned plan footprint of a furniture item (rotations are multiples of 90°). */
export function footprint(it: FurnitureDef): Rect {
  const quarter = Math.round(it.rot / 90) % 2 !== 0;
  const hw = (quarter ? it.d : it.w) / 2;
  const hd = (quarter ? it.w : it.d) / 2;
  return { x1: it.x - hw, y1: it.y - hd, x2: it.x + hw, y2: it.y + hd };
}

export function dimsOf(room: RoomDef) {
  const m = room.rects[0];
  return { w: +(m.x2 - m.x1).toFixed(2), d: +(m.y2 - m.y1).toFixed(2) };
}
