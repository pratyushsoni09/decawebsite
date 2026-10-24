import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { TourEngine } from "../tour/engine";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { buildHouse, poseLeaf, setSky, type SkyPreset } from "../tour/buildHouse";
import { buildFurnitureItems } from "../tour/buildFurniture";
import { CEILING_HEIGHT, DOOR_HEAD, RESIDENCE_ELEVATION, furniture, rooms } from "../data/houseLayout";
import { resolvedDoors, resolvedOpenings, resolvedWindows } from "../data/layoutGeometry";

/**
 * Dev-only render studio (/studio). Renders the stills used on the home
 * page straight from the walkable model and writes them to public/images
 * through the dev server, so every image on the site is a view of the
 * same geometry you can walk.
 */

interface View {
  name: string;
  w: number;
  h: number;
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
  sky: SkyPreset;
  exposure: number;
  sun: { intensity: number; color: number; dir: [number, number, number] };
  hemi: number;
  env: number;
  lamps: number;
  sketch?: boolean;
  /** architectural lens shift: camera stays level, frame shows this fraction below the horizon */
  shift?: number;
  doors?: "open" | "closed";
  /** emissive strength of lit curtains on the other storeys */
  windowsLit?: number;
}

const golden = { intensity: 4.6, color: 0xffbd7a, dir: [-0.7, 0.3, 0.65] as [number, number, number] };
const day = { intensity: 3.2, color: 0xffe2b8, dir: [-0.5, 0.55, 0.67] as [number, number, number] };
const U = RESIDENCE_ELEVATION;
const room = (name: string, pos: [number, number, number], look: [number, number, number], extra: Partial<View> = {}): View => ({
  name, w: 1200, h: 1500, pos: [pos[0], U + pos[1], pos[2]], look: [look[0], U + look[1], look[2]],
  fov: 64, sky: "day", exposure: 1.12, sun: day, hemi: 1.0, env: 0.55, lamps: 1.4, windowsLit: 0.12, ...extra,
});

const towerShot = { w: 2400, h: 1350, pos: [33, 1.7, 68] as [number, number, number], look: [12, 1.7, 9] as [number, number, number], fov: 88, shift: 0.06 };
export const VIEWS: View[] = [
  { name: "tower-golden", ...towerShot, sky: "golden", exposure: 0.95, sun: golden, hemi: 0.65, env: 0.35, lamps: 1.2, windowsLit: 0.35 },
  { name: "hero", ...towerShot, sky: "day", exposure: 1.0, sun: day, hemi: 0.9, env: 0.3, lamps: 0, sketch: true },
  { name: "tower-dusk", w: 1800, h: 1350, pos: [70, 1.9, 70], look: [12, 1.9, 8], fov: 62, shift: 0.14, sky: "dusk", exposure: 1.3, sun: { intensity: 0.6, color: 0xff9d6a, dir: [-0.7, 0.05, 0.71] }, hemi: 0.2, env: 0.1, lamps: 3, windowsLit: 1.8 },
  // hall and bedroom three are framed like the client's photos they follow
  room("living", [5.55, 1.25, 12.4], [11.86, 1.3, 12.4], { w: 2000, h: 1366, fov: 56, sun: { intensity: 4.0, color: 0xffcf98, dir: [-0.2, 0.3, 0.93] } }),
  room("dining", [10.4, 1.6, 4.6], [5.2, 0.9, 7.7], { fov: 66 }),
  room("pooja", [6.7, 1.5, 8.05], [4.9, 1.3, 8.15], { fov: 56 }),
  room("kitchen", [10.3, 1.6, 3.35], [7.4, 1.0, 0.9], { fov: 72 }),
  room("master", [4.2, 1.6, 15.3], [1.2, 0.8, 12.0]),
  room("bed2", [3.4, 1.6, 4.6], [0.6, 0.8, 1.6], { fov: 70 }),
  room("bed3", [4.1, 1.35, 5.35], [0.3, 1.1, 7.6], { w: 2000, h: 1125, fov: 56, sun: { intensity: 5.0, color: 0xffd09a, dir: [-0.85, 0.28, 0.15] } }),
  room("balcony", [9.0, 1.6, 16.45], [3.5, 1.0, 18.2], { doors: "closed", fov: 62 }),
  room("swing", [7.4, 1.6, 16.6], [11.5, 0.9, 18.9], { doors: "closed", w: 2000, h: 1125, fov: 64 }),
];

async function save(name: string, dataUrl: string) {
  const res = await fetch("/api/__save-render", { method: "POST", body: JSON.stringify({ name, dataUrl }) });
  return res.json();
}

const SKETCH_HIDDEN = ["sky", "static:glass", "static:grass", "static:glow", "static:towerGlass", "static:curtain", "static:curtainLit"];
const NO_EDGES = ["static:leaf", "static:olive", "static:boxwood", "static:bronze", "static:oakVertical"];

/**
 * Two layers for the hero's drawing animation:
 *  - lines: ink edges only, hidden lines removed, on a transparent background
 *  - tone:  graphite shading on paper, no edges
 */
function sketchPass(engine: TourEngine, render: () => void): { lines: HTMLCanvasElement; tone: HTMLCanvasElement } {
  const { scene, renderer } = engine;
  const paper = new THREE.MeshLambertMaterial({ color: 0xf6f3ec });
  const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const ink = new THREE.LineBasicMaterial({ color: 0x000000 });
  const swapped: [THREE.Mesh, THREE.Material | THREE.Material[]][] = [];
  const lines: THREE.LineSegments[] = [];
  const hidden: THREE.Object3D[] = [];
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    if (SKETCH_HIDDEN.includes(m.name)) {
      hidden.push(m);
      return;
    }
    swapped.push([m, m.material]);
    if (m.name.startsWith("static:") && !NO_EDGES.includes(m.name)) {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 28), ink);
      e.matrixAutoUpdate = false;
      e.matrix.copy(m.matrixWorld);
      e.visible = false;
      lines.push(e);
    }
  });
  lines.forEach((l) => scene.add(l));
  hidden.forEach((h) => (h.visible = false));
  const fog = scene.fog;
  scene.fog = null;
  const tm = renderer.toneMapping;
  renderer.toneMapping = THREE.NoToneMapping;
  const src = renderer.domElement;
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = src.width;
    c.height = src.height;
    return c;
  };

  // pass 1: ink lines over depth-only geometry (hidden-line removal), white background
  swapped.forEach(([m]) => (m.material = depthOnly));
  lines.forEach((l) => (l.visible = true));
  scene.background = new THREE.Color(0xffffff);
  render();
  const linesCanvas = mk();
  const lctx = linesCanvas.getContext("2d")!;
  lctx.drawImage(src, 0, 0);
  const img = lctx.getImageData(0, 0, linesCanvas.width, linesCanvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const dark = 1 - (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
    d[i] = 52;
    d[i + 1] = 46;
    d[i + 2] = 40;
    d[i + 3] = Math.min(255, dark * 255 * 0.9);
  }
  lctx.putImageData(img, 0, 0);

  // pass 2: graphite tone on paper, no lines
  swapped.forEach(([m]) => (m.material = paper));
  lines.forEach((l) => (l.visible = false));
  scene.background = new THREE.Color(0xf6f3ec);
  render();
  const toneCanvas = mk();
  const ctx = toneCanvas.getContext("2d")!;
  ctx.fillStyle = "#f3efe6";
  ctx.fillRect(0, 0, toneCanvas.width, toneCanvas.height);
  ctx.filter = "grayscale(1) contrast(1.15) brightness(1.08)";
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(src, 0, 0);
  ctx.filter = "none";
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 60000; i++) {
    ctx.fillStyle = `rgba(90,80,70,${rnd() * 0.06})`;
    ctx.fillRect(rnd() * toneCanvas.width, rnd() * toneCanvas.height, 1.4, 1.4);
  }

  // restore
  renderer.toneMapping = tm;
  swapped.forEach(([m, mat]) => (m.material = mat));
  lines.forEach((l) => {
    scene.remove(l);
    l.geometry.dispose();
  });
  hidden.forEach((h) => (h.visible = true));
  scene.fog = fog;
  scene.background = null;
  paper.dispose();
  depthOnly.dispose();
  ink.dispose();
  return { lines: linesCanvas, tone: toneCanvas };
}

export default function Studio() {
  const host = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<TourEngine | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const eng = new TourEngine(host.current!, { quality: "high", preserveDrawingBuffer: true });
    eng.interactive = false;
    let alive = true;
    eng.init().then(() => {
      if (!alive) return;
      eng.setAllDoors(true);
      eng.sun.shadow.mapSize.set(4096, 4096);
      eng.sun.shadow.map?.dispose();
      eng.sun.shadow.map = null;
      setEngine(eng);
    });
    return () => {
      alive = false;
      eng.dispose();
    };
  }, []);

  const renderView = async (v: View) => {
    const eng = engine!;
    const { renderer, camera, scene } = eng;
    renderer.setPixelRatio(1);
    renderer.setSize(v.w, v.h, false);
    camera.position.set(...v.pos);
    camera.lookAt(...v.look);
    camera.fov = v.fov;
    if (v.shift !== undefined) {
      // shift lens: a level camera renders the upper part of a taller frustum, so verticals stay vertical
      const fullH = Math.round(2 * v.h * (1 - v.shift));
      camera.aspect = v.w / fullH;
      camera.setViewOffset(v.w, fullH, 0, 0, v.w, v.h);
    } else {
      camera.clearViewOffset();
      camera.aspect = v.w / v.h;
    }
    camera.updateProjectionMatrix();
    eng.setAllDoors(v.doors !== "closed");
    eng.tick(0.4);
    setSky(eng.house.sky, v.sky);
    renderer.toneMappingExposure = v.exposure;
    eng.sun.intensity = v.sun.intensity;
    eng.sun.color.setHex(v.sun.color);
    const exterior = v.shift !== undefined;
    eng.setShadowBounds(exterior ? 46 : 20, exterior ? new THREE.Vector3(12, 22, 9) : new THREE.Vector3(12, U, 10));
    eng.aimSun(new THREE.Vector3(...v.sun.dir));
    eng.hemi.intensity = v.hemi;
    scene.environmentIntensity = v.env;
    eng.pointLights.forEach((p) => {
      p.visible = v.lamps > 0;
      p.intensity = 6 * v.lamps;
    });
    eng.lib.curtainLit.emissiveIntensity = v.windowsLit ?? 0.12;
    eng.lib.curtain.emissiveIntensity = (v.windowsLit ?? 0.12) > 1 ? 0.25 : 0;
    eng.lib.glow.emissiveIntensity = v.sky === "dusk" ? 4 : 2.4;
    (scene.fog as THREE.Fog).color.set(v.sky === "dusk" ? 0x3a3340 : 0xe6e0d4);
    const draw = () => renderer.render(scene, camera);
    const outputs: [string, HTMLCanvasElement][] = [];
    if (v.sketch) {
      const { lines, tone } = sketchPass(eng, draw);
      outputs.push([`${v.name}-lines`, lines], [`${v.name}-tone`, tone]);
    } else {
      draw();
      outputs.push([v.name, renderer.domElement]);
    }
    for (const [name, canvas] of outputs) {
      const r = await save(name, canvas.toDataURL("image/webp", 0.84));
      setLog((l) => [...l, `${name}: ${r.ok ? `${Math.round(r.bytes / 1024)} KB` : "failed"}`]);
    }
  };

  /** Hand the model, the camera views and the lamp positions to blender/render.py. */
  const exportForBlender = async () => {
    const eng = engine!;
    setBusy(true);
    setLog(["exporting…"]);
    eng.setAllDoors(true);
    for (const l of eng.house.leaves) if (l.geom.doorId.endsWith("balcony")) {
      l.s = l.target = 0;
      poseLeaf(l);
    }
    eng.house.swings.forEach((s) => (s.pivot.rotation.x = 0));
    const root = eng.house.root;
    root.remove(eng.house.sky);
    root.updateMatrixWorld(true);
    const glb = (await new GLTFExporter().parseAsync(root, { binary: true, maxTextureSize: 2048 })) as ArrayBuffer;
    root.add(eng.house.sky);
    const put = (name: string, body: BodyInit) => fetch(`/api/__save-file?name=${name}`, { method: "POST", body }).then((r) => r.json());
    const a = await put("tower.glb", glb);
    // shell without furniture + furniture item by item, so Blender can swap pieces for detailed CC0 models
    const shell = await buildHouse(eng.lib, async () => {}, { furniture: false });
    for (const l of shell.leaves) {
      l.s = l.target = l.geom.doorId.endsWith("balcony") ? 0 : 1;
      poseLeaf(l);
    }
    shell.root.remove(shell.sky);
    shell.root.updateMatrixWorld(true);
    const shellGlb = (await new GLTFExporter().parseAsync(shell.root, { binary: true, maxTextureSize: 2048 })) as ArrayBuffer;
    const items = buildFurnitureItems(eng.lib, furniture);
    items.updateMatrixWorld(true);
    const itemsGlb = (await new GLTFExporter().parseAsync(items, { binary: true, maxTextureSize: 2048 })) as ArrayBuffer;
    for (const g of [shell.root, items]) g.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
    await put("shell.glb", shellGlb);
    await put("furniture.glb", itemsGlb);
    await put("furniture.json", JSON.stringify({ residenceElevation: U, ceilingHeight: CEILING_HEIGHT, items: furniture }, null, 2));
    // rooms, doors, archways and windows of the walkable home, for the Blender finishing pass (skirting, frames, curtains, tiles)
    await put("layout.json", JSON.stringify({
      residenceElevation: U, ceilingHeight: CEILING_HEIGHT, doorHead: DOOR_HEAD,
      rooms: rooms.filter((r) => r.flat !== "B").map(({ id, name, kind, finish, rects }) => ({ id, name, kind, finish, rects })),
      doors: resolvedDoors.map(({ id, axis, rect, glazed, width }) => ({ id, axis, rect, glazed: !!glazed, width })),
      openings: resolvedOpenings.map(({ id, axis, rect, head, width }) => ({ id, axis, rect, head, width })),
      windows: resolvedWindows.map(({ side, rect, sill, head }) => ({ side, rect, sill, head })),
    }, null, 2));
    const b = await put("views.json", JSON.stringify({ residenceElevation: U, views: VIEWS }, null, 2));
    const c = await put("lights.json", JSON.stringify(eng.house.lights, null, 2));
    setLog([`tower.glb: ${Math.round(a.bytes / 1048576)} MB`, `views.json: ${b.bytes} B`, `lights.json: ${c.bytes} B`, "export done"]);
    setBusy(false);
  };

  const renderAll = async () => {
    setBusy(true);
    setLog([]);
    for (const v of VIEWS) {
      await renderView(v);
      await new Promise((r) => setTimeout(r, 50));
    }
    setBusy(false);
    setLog((l) => [...l, "done"]);
  };

  return (
    <main style={{ padding: 20, fontFamily: "var(--font-family-base)" }}>
      <h1 style={{ fontSize: 28 }}>Render studio</h1>
      <p>Renders the home-page stills from the 3D model into public/images (dev server only).</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
        <button id="render-all" disabled={!engine || busy} onClick={renderAll}>Render all</button>
        <button id="export-blender" disabled={!engine || busy} onClick={exportForBlender}>Export for Blender</button>
        {VIEWS.map((v) => (
          <button key={v.name} disabled={!engine || busy} onClick={() => renderView(v)}>{v.name}</button>
        ))}
      </div>
      <pre id="render-log">{engine ? log.join("\n") : "loading model…"}</pre>
      <div ref={host} style={{ width: 640, height: 400, overflow: "hidden", background: "#222" }} />
    </main>
  );
}
