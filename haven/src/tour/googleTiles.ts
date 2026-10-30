import * as THREE from "three";
import { TilesRenderer } from "3d-tiles-renderer";
import { GoogleCloudAuthPlugin, ReorientationPlugin, TilesFadePlugin } from "3d-tiles-renderer/plugins";
import { CITY } from "./buildCity";

/**
 * Optional live layer: Google's Photorealistic 3D Tiles of Kudasan streamed into the tour in
 * place of the open-data city. Needs a Google Maps Platform key with the Map Tiles API enabled
 * (VITE_GOOGLE_MAPS_KEY). Google's terms: the tiles are shown live with Google's attribution and
 * logo and are never saved or baked into renders — the Blender images keep the open-data city.
 */

export const GOOGLE_KEY = (import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined) || "";
const DEG = Math.PI / 180;

export class GoogleTilesLayer {
  readonly tiles: TilesRenderer;
  private grounded = false;
  private readonly origin: THREE.Vector3;
  private readonly ray = new THREE.Raycaster();

  constructor(private scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer, origin: THREE.Vector3) {
    this.origin = origin.clone();
    const tiles = new TilesRenderer("https://tile.googleapis.com/v1/3dtiles/root.json");
    tiles.registerPlugin(new GoogleCloudAuthPlugin({ apiToken: GOOGLE_KEY, autoRefreshToken: true }));
    // put Kudasan's centre at the tower's position, y up, x east, z south — the plan's own frame
    tiles.registerPlugin(new ReorientationPlugin({ lat: CITY.origin.lat * DEG, lon: CITY.origin.lon * DEG, height: 0, recenter: true }));
    tiles.registerPlugin(new TilesFadePlugin());
    tiles.setCamera(camera);
    tiles.setResolutionFromRenderer(camera, renderer);
    tiles.errorTarget = 16;
    tiles.group.position.copy(origin);
    scene.add(tiles.group);
    this.tiles = tiles;
  }

  /** stream tiles for the current view; once terrain has loaded, drop it so the ground meets the tower's plot */
  update() {
    this.tiles.update();
    if (!this.grounded) this.ground();
  }

  private ground() {
    this.ray.set(new THREE.Vector3(this.origin.x, 400, this.origin.z), new THREE.Vector3(0, -1, 0));
    this.ray.far = 2000;
    const hit = this.ray.intersectObject(this.tiles.group, true)[0];
    if (!hit) return;
    this.tiles.group.position.y -= hit.point.y;
    this.grounded = true;
  }

  /** Google's required data credits for what is on screen now */
  attributions() {
    return this.tiles.getAttributions().map((a) => String(a.value)).filter(Boolean).join(" · ");
  }

  setVisible(on: boolean) {
    this.tiles.group.visible = on;
  }

  dispose() {
    this.scene.remove(this.tiles.group);
    this.tiles.dispose();
  }
}
