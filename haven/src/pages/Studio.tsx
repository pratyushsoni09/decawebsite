import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { TourEngine } from "../tour/engine";
import { setSky, type SkyPreset } from "../tour/buildHouse";

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
}

const golden = { intensity: 4.4, color: 0xffbd7a, dir: [-0.66, 0.26, 0.7] as [number, number, number] };
const day = { intensity: 3.0, color: 0xffe2b8, dir: [-0.55, 0.55, 0.62] as [number, number, number] };
const room = (name: string, pos: [number, number, number], look: [number, number, number], extra: Partial<View> = {}): View => ({
  name, w: 1200, h: 1500, pos, look, fov: 62, sky: "day", exposure: 1.18, sun: day, hemi: 1.0, env: 0.55, lamps: 1.4, ...extra,
});

const UP = 3.6;
export const VIEWS: View[] = [
  { name: "facade-golden", w: 2400, h: 1350, pos: [20, 1.75, 47], look: [20, 3.9, 9], fov: 38, sky: "golden", exposure: 0.92, sun: golden, hemi: 0.6, env: 0.35, lamps: 1.6 },
  { name: "hero-sketch", w: 2400, h: 1350, pos: [20, 1.75, 47], look: [20, 3.9, 9], fov: 38, sky: "day", exposure: 1.0, sun: day, hemi: 0.9, env: 0.3, lamps: 0, sketch: true },
  { name: "facade-dusk", w: 1800, h: 1350, pos: [52, 1.9, 42], look: [20, 3.6, 9], fov: 42, sky: "dusk", exposure: 1.25, sun: { intensity: 0.7, color: 0xff9d6a, dir: [-0.7, 0.06, 0.71] }, hemi: 0.22, env: 0.12, lamps: 3.4 },
  room("entrance", [20, 1.6, 18.1], [20, 2.2, 6.0], { fov: 64 }),
  room("drawing", [11.3, 1.55, 17.0], [3.5, 1.0, 12.0]),
  room("library", [6.7, 1.55, 8.9], [2.0, 1.3, 2.6]),
  room("kitchen", [38.2, 1.6, 8.7], [30.5, 0.9, 1.8]),
  room("dining", [29.0, 1.6, 17.1], [37.0, 1.0, 12.0]),
  room("lounge", [26.2, UP + 1.6, 10.6], [15.5, UP + 0.9, 16.8]),
  room("primary-bed", [1.0, UP + 1.6, 9.3], [7.8, UP + 0.6, 15.0]),
  room("dressing", [0.8, UP + 1.6, 6.98], [8.3, UP + 1.0, 6.98], { fov: 66 }),
  room("primary-bath", [1.7, UP + 1.6, 5.0], [6.0, UP + 0.8, 0.6]),
  room("stair", [20, 1.6, 9.0], [20, 3.6, 0.8], { w: 2000, h: 1125, fov: 60 }),
];

async function save(name: string, dataUrl: string) {
  const res = await fetch("/api/__save-render", { method: "POST", body: JSON.stringify({ name, dataUrl }) });
  return res.json();
}

function sketchPass(engine: TourEngine, render: () => void): HTMLCanvasElement {
  const { scene, renderer } = engine;
  const paper = new THREE.MeshLambertMaterial({ color: 0xf6f3ec });
  const ink = new THREE.LineBasicMaterial({ color: 0x3a342e, transparent: true, opacity: 0.85 });
  const swapped: [THREE.Mesh, THREE.Material | THREE.Material[]][] = [];
  const lines: THREE.LineSegments[] = [];
  const hidden: THREE.Object3D[] = [];
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    if (m.name === "sky" || m.name === "static:glass" || m.name === "static:grass" || m.name === "static:glow") {
      hidden.push(m);
      return;
    }
    swapped.push([m, m.material]);
    m.material = paper;
    if (m.name.startsWith("static:") && !["static:leaf", "static:olive", "static:boxwood"].includes(m.name)) {
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
    camera.aspect = v.w / v.h;
    camera.fov = v.fov;
    camera.updateProjectionMatrix();
    camera.position.set(...v.pos);
    camera.lookAt(...v.look);
    setSky(eng.house.sky, v.sky);
    renderer.toneMappingExposure = v.exposure;
    eng.sun.intensity = v.sun.intensity;
    eng.sun.color.setHex(v.sun.color);
    const d = new THREE.Vector3(...v.sun.dir).normalize();
    eng.sun.position.copy(eng.sun.target.position).addScaledVector(d, 60);
    eng.hemi.intensity = v.hemi;
    scene.environmentIntensity = v.env;
    eng.pointLights.forEach((p) => (p.visible = v.lamps > 0) && (p.intensity = 9 * v.lamps));
    (scene.fog as THREE.Fog).color.set(v.sky === "dusk" ? 0x3a3340 : 0xe9dfcf);
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
