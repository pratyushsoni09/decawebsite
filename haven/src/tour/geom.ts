import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { MatKey, MaterialLib } from "./materials";

/**
 * Collects world-space geometry per material and merges it into one mesh
 * per material, so the whole static house draws in a few dozen calls.
 */
export class StaticBuilder {
  private parts = new Map<MatKey, THREE.BufferGeometry[]>();
  meshCount = 0; // logical meshes added, before merging

  add(geo: THREE.BufferGeometry, mat: MatKey, matrix?: THREE.Matrix4) {
    let g = geo.index ? geo.toNonIndexed() : geo;
    if (g === geo) g = geo.clone();
    for (const name of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(name)) g.deleteAttribute(name);
    if (!g.attributes.uv) {
      g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((g.attributes.position.count) * 2), 2));
    }
    if (matrix) g.applyMatrix4(matrix);
    const list = this.parts.get(mat) ?? [];
    list.push(g);
    this.parts.set(mat, list);
    this.meshCount++;
    geo.dispose();
  }

  build(lib: MaterialLib, group: THREE.Group, shadows = true) {
    for (const [key, list] of this.parts) {
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, lib[key]);
      mesh.name = `static:${key}`;
      const transparent = lib[key].transparent;
      mesh.castShadow = shadows && !transparent && key !== "glow" && key !== "shade";
      mesh.receiveShadow = !transparent;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      group.add(mesh);
    }
    this.parts.clear();
  }
}

/**
 * Box with UVs in metres (so tiling textures keep real-world scale).
 * Positioned by its minimum corner and size.
 */
export function metricBox(w: number, h: number, d: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z (4 verts each)
  const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
    }
  }
  return g;
}

/** World-space box from min corner (x, y, z) to max (x2, y2, z2). */
export function boxAt(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
  const w = Math.max(0.001, x2 - x1);
  const h = Math.max(0.001, y2 - y1);
  const d = Math.max(0.001, z2 - z1);
  const g = metricBox(w, h, d);
  g.translate(x1 + w / 2, y1 + h / 2, z1 + d / 2);
  // shift UVs to world position so neighbouring boxes line up
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const n = g.attributes.normal as THREE.BufferAttribute;
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    const nx = Math.abs(n.getX(i));
    const ny = Math.abs(n.getY(i));
    if (ny > 0.5) uv.setXY(i, p.getX(i), p.getZ(i));
    else if (nx > 0.5) uv.setXY(i, p.getZ(i), p.getY(i));
    else uv.setXY(i, p.getX(i), p.getY(i));
  }
  return g;
}

/** Horizontal plane (floor or ceiling) over a plan rectangle at height y, UVs in world metres. */
export function planeAt(x1: number, z1: number, x2: number, z2: number, y: number, facingDown = false) {
  const g = new THREE.PlaneGeometry(x2 - x1, z2 - z1);
  g.rotateX(facingDown ? Math.PI / 2 : -Math.PI / 2);
  g.translate((x1 + x2) / 2, y, (z1 + z2) / 2);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), p.getZ(i));
  return g;
}

export const DEG = Math.PI / 180;

/** Local → world transform for an item at plan (x, y), floor level, facing rot (deg). */
export function placeMatrix(x: number, level: number, y: number, rotDeg: number) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, level, y),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotDeg * DEG),
    new THREE.Vector3(1, 1, 1),
  );
}
