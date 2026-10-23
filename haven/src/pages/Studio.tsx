import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { TourEngine } from "../tour/engine";
import { setSky, type SkyPreset } from "../tour/buildHouse";
import { RESIDENCE_ELEVATION } from "../data/houseLayout";

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
  { name: "hero-sketch", ...towerShot, sky: "day", exposure: 1.0, sun: day, hemi: 0.9, env: 0.3, lamps: 0, sketch: true },
  { name: "tower-dusk", w: 1800, h: 1350, pos: [70, 1.9, 70], look: [12, 1.9, 8], fov: 62, shift: 0.14, sky: "dusk", exposure: 1.3, sun: { intensity: 0.6, color: 0xff9d6a, dir: [-0.7, 0.05, 0.71] }, hemi: 0.2, env: 0.1, lamps: 3, windowsLit: 1.8 },
  room("lobby", [13.6, 1.6, 4.6], [12.0, 1.3, 0.3], { fov: 60 }),
  room("living", [9.6, 1.55, 10.3], [1.5, 0.9, 13.6]),
  room("kitchen", [11.0, 1.6, 9.5], [16.5, 0.9, 14.6]),
  room("primary-bed", [19.6, 1.6, 15.3], [22.9, 0.7, 11.0]),
  room("primary-bath", [21.4, 1.6, 8.5], [23.2, 0.7, 5.7]),
  room("bed2", [6.1, 1.6, 4.9], [2.0, 0.6, 0.8]),
  room("study", [10.6, 1.6, 4.9], [8.0, 0.9, 0.8]),
  room("balcony", [7.2, 1.6, 16.4], [1.4, 1.0, 17.5], { doors: "closed", fov: 62 }),
  room("swing", [17.6, 1.6, 16.45], [23.4, 0.9, 18.2], { doors: "closed", w: 2000, h: 1125, fov: 64 }),
];

async function save(name: string, dataUrl: string) {
  const res = await fetch("/api/__save-render", { method: "POST", body: JSON.stringify({ name, dataUrl }) });
  return res.json();
}

function sketchPass(engine: TourEngine, render: () => void): HTMLCanvasElement {
  const { scene, renderer } = engine;
  const paper = new THREE.MeshLambertMaterial({ color: 0xf6f3ec });
  const ink = new THREE.LineBasicMaterial({ color: 0x3a342e, transparent: true, opacity: 0.6 });
  const swapped: [THREE.Mesh, THREE.Material | THREE.Material[]][] = [];
  const lines: THREE.LineSegments[] = [];
  const hidden: THREE.Object3D[] = [];
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    if (["sky", "static:glass", "static:grass", "static:glow", "static:towerGlass", "static:curtain", "static:curtainLit"].includes(m.name)) {
      hidden.push(m);
      return;
    }
    swapped.push([m, m.material]);
    m.material = paper;
    if (m.name.startsWith("static:") && !["static:leaf", "static:olive", "static:boxwood", "static:bronze", "static:oakVertical"].includes(m.name)) {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 28), ink);
      e.matrixAutoUpdate = false;
      e.matrix.copy(m.matrixWorld);
      scene.add(e);
      lines.push(e);
    }
  });
  hidden.forEach((h) => (h.visible = false));
  const fog = scene.fog;
  scene.fog = null;
  scene.background = new THREE.Color(0xf6f3ec);
  const tm = renderer.toneMapping;
  renderer.toneMapping = THREE.NoToneMapping;
  render();
  renderer.toneMapping = tm;
  const src = renderer.domElement;
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#f3efe6";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.filter = "grayscale(1) contrast(1.25) brightness(1.06)";
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(src, 0, 0);
  ctx.filter = "none";
  // construction lines, like a drafting sheet
  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = "rgba(60,52,44,0.16)";
  ctx.lineWidth = 1;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 26; i++) {
    const y = out.height * (0.25 + rnd() * 0.6);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(out.width, y + (rnd() - 0.5) * 6);
    ctx.stroke();
  }
  for (let i = 0; i < 18; i++) {
    const x = out.width * (0.08 + rnd() * 0.84);
    ctx.beginPath();
    ctx.moveTo(x, out.height * 0.1);
    ctx.lineTo(x + (rnd() - 0.5) * 4, out.height);
    ctx.stroke();
  }
  // paper grain
  for (let i = 0; i < 60000; i++) {
    ctx.fillStyle = `rgba(90,80,70,${rnd() * 0.06})`;
    ctx.fillRect(rnd() * out.width, rnd() * out.height, 1.4, 1.4);
  }
  // restore
  swapped.forEach(([m, mat]) => (m.material = mat));
  lines.forEach((l) => { scene.remove(l); l.geometry.dispose(); });
  hidden.forEach((h) => (h.visible = true));
  scene.fog = fog;
  scene.background = null;
  paper.dispose();
  ink.dispose();
  return out;
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
    let canvas: HTMLCanvasElement;
    if (v.sketch) canvas = sketchPass(eng, draw);
    else {
      draw();
      canvas = renderer.domElement;
    }
    const url = canvas.toDataURL("image/webp", 0.84);
    const r = await save(v.name, url);
    setLog((l) => [...l, `${v.name}: ${r.ok ? `${Math.round(r.bytes / 1024)} KB` : "failed"}`]);
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
        {VIEWS.map((v) => (
          <button key={v.name} disabled={!engine || busy} onClick={() => renderView(v)}>{v.name}</button>
        ))}
      </div>
      <pre id="render-log">{engine ? log.join("\n") : "loading model…"}</pre>
      <div ref={host} style={{ width: 640, height: 400, overflow: "hidden", background: "#222" }} />
    </main>
  );
}
