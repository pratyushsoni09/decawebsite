import city from "../data/kudasan.json";

/**
 * The real surroundings of the tower, from open map data (scripts/fetch_kudasan.py), in plan metres:
 * x east, y south (→ world z). The tower's centre is plan (12, 8).
 */
export interface CityData {
  origin: { lat: number; lon: number };
  /** the near ring: every building, street, green and named place */
  radius: number;
  /** the far ring: the skyline, main roads, the Sabarmati, lakes, parks and farmland */
  far: number;
  plot: [number, number, number, number];
  attribution: string;
  /** k: block | tower; c: com | edu | ind | civ | rel | med (residential when absent) */
  buildings: { p: number[][]; h: number; k: string; c?: string }[];
  /** the far ring's bigger and taller buildings; k "landmark" for the towers that read from 7 km */
  skyline: { p: number[][]; h: number; k?: string }[];
  /** c: Overture road class; b: 1 on a bridge span */
  roads: { p: number[][]; w: number; c: string; b?: number }[];
  /** k: park | grass | garden | pitch | farm | forest | scrub | dirt */
  greens: { p: number[][]; k: string; n?: string }[];
  /** k: river | lake | canal | pool */
  water: { p: number[][]; k: string; n?: string }[];
  trees: number[][];
  /** named places: n the sign text, k its kind, b the index of the building it stands in */
  pois: { x: number; y: number; n: string; k: string; b?: number }[];
}

export const CITY = city as unknown as CityData;
export const CITY_ATTRIBUTION = CITY.attribution;
export const CITY_RADIUS = CITY.radius;
export const TOWER_X = 12;
export const TOWER_Z = 8;

/** the places that get a signboard, nearest first (the sign atlas has 128 cells) */
export const SIGNED = CITY.pois
  .filter((p) => p.b !== undefined)
  .map((p) => ({ ...p, d: Math.hypot(p.x - TOWER_X, p.y - TOWER_Z) }))
  .sort((a, b) => a.d - b.d)
  .slice(0, 128);
export const SIGNS = SIGNED.map((p) => p.n);
