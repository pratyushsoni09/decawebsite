import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, DoorOpen, HelpCircle, Layers, ListChecks, RotateCcw, X } from "lucide-react";
import { FLOOR_NAMES, roomById, roomsOnFloor, type FloorId } from "../data/houseLayout";
import { FloorPlanSvg } from "../components/FloorPlanSvg";
import { TourEngine, type EngineState, type Quality } from "../tour/engine";
import { runModelChecks, type CheckRow } from "../tour/checks";
import styles from "./Tour.module.css";

type Panel = "rooms" | "help" | "checks" | null;

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

function Minimap({ engine, floor, roomId }: { engine: TourEngine; floor: FloorId; roomId: string | null }) {
  const marker = useRef<SVGGElement>(null);
  useEffect(
    () =>
      engine.onFrame((p) => {
        marker.current?.setAttribute("transform", `translate(${p.x.toFixed(3)} ${p.y.toFixed(3)}) rotate(${(-p.heading).toFixed(1)})`);
      }),
    [engine],
  );
  return (
    <div className={styles.minimap} aria-label={`Minimap, ${FLOOR_NAMES[floor]}`} role="img">
      <FloorPlanSvg floor={floor} variant="dark" labels="names" showFurniture={false} highlight={roomId}>
        <g ref={marker}>
          <path d="M0 0 L-1.6 3.4 A 3.8 3.8 0 0 0 1.6 3.4 Z" className={styles.cone} />
          <circle r={0.42} className={styles.dot} />
        </g>
      </FloorPlanSvg>
    </div>
  );
}

function Joystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef<number | null>(null);
  const R = 46;
  const update = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const m = Math.hypot(dx, dy);
    if (m > R) {
      dx = (dx / m) * R;
      dy = (dy / m) * R;
    }
    setKnob({ x: dx, y: dy });
    onMove(dx / R, -dy / R);
  };
  const end = () => {
    active.current = null;
    setKnob({ x: 0, y: 0 });
    onMove(0, 0);
  };
  return (
    <div
      ref={base}
      className={styles.joystick}
      onPointerDown={(e) => {
        active.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => active.current === e.pointerId && update(e)}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="Walk pad: drag to walk"
      role="application"
    >
      <span className={styles.knob} style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}

export default function Tour() {
  const host = useRef<HTMLDivElement>(null);
  const [params] = useSearchParams();
  const roomParam = params.get("room");
  const [engine, setEngine] = useState<TourEngine | null>(null);
  const [progress, setProgress] = useState({ p: 0, label: "Preparing" });
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState<EngineState>({ floor: 0, roomId: null, roomName: "", doorAhead: false });
  const [panel, setPanel] = useState<Panel>(null);
  const [panelFloor, setPanelFloor] = useState<FloorId>(0);
  const [fade, setFade] = useState(false);
  const [quality, setQuality] = useState<Quality>("high");
  const [checks, setChecks] = useState<CheckRow[] | null>(null);
  const [touch, setTouch] = useState(false);
  const [webgl] = useState(hasWebGL);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Explore the 360° house — Haven · The Oak Mansion";
    setTouch(window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window);
  }, []);

  // boot the engine once
  useEffect(() => {
    if (!webgl || !host.current) return;
    const eng = new TourEngine(host.current, { quality: "high" });
    let alive = true;
    eng
      .init((p, label) => alive && setProgress({ p, label }))
      .then(() => {
        if (!alive) return;
        const start = roomParam && roomById(roomParam) ? roomParam : "entrance";
        eng.teleport(start);
        eng.start();
        eng.onState(setState);
        setEngine(eng);
        if (import.meta.env.DEV) (window as unknown as { __tour: TourEngine }).__tour = eng;
        setLoaded(true);
        setPanelFloor(roomById(start)!.floor);
        // the self-test is heavier than a frame; run it once the house is on screen
        setTimeout(() => alive && setChecks(runModelChecks({ meshes: eng.sceneMeshCount(), authored: eng.house.authoredMeshes, ceilingRooms: eng.house.ceilingRooms })), 400);
      })
      .catch((e) => alive && setError(String(e?.message ?? e)));
    return () => {
      alive = false;
      eng.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webgl]);

  // deep links after load
  useEffect(() => {
    if (engine && roomParam && roomById(roomParam) && roomParam !== state.roomId) jump(roomParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomParam, engine]);

  const jump = useCallback(
    (id: string) => {
      if (!engine) return;
      setFade(true);
      setTimeout(() => {
        engine.teleport(id);
        setTimeout(() => setFade(false), 60);
      }, 280);
    },
    [engine],
  );

  // Esc closes panels
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = (p: Panel) => {
    setPanel((cur) => (cur === p ? null : p));
    if (p === "rooms") setPanelFloor(state.floor);
  };

  const setQ = (q: Quality) => {
    setQuality(q);
    engine?.setQuality(q);
  };

  if (!webgl) {
    return (
      <main className={styles.fallback}>
        <p className="eyebrow">Haven · The Oak Mansion</p>
        <h1>WebGL not supported</h1>
        <p>Your browser cannot display the 3D model. You can still read the house through its floor plans.</p>
        <Link to="/#plans" className={styles.fallbackLink}>View floor plans instead</Link>
      </main>
    );
  }

  const passCount = checks?.filter((c) => c.pass).length ?? 0;

  return (
    <main className={styles.tour}>
      <h1 className="visually-hidden">Explore The Oak Mansion in 3D</h1>
      <div ref={host} className={styles.canvasHost} />

      {/* loader */}
      <div className={`${styles.loader} ${loaded ? styles.loaderDone : ""}`} role="status" aria-live="polite">
        <p className="eyebrow">Haven · The Oak Mansion</p>
        <h2 className={styles.loaderTitle}>Building the house</h2>
        <div className={styles.loaderTrack}><span style={{ transform: `scaleX(${progress.p})` }} /></div>
        <p className={styles.loaderSub}>{error ? `Something went wrong: ${error}` : "Loading the model and baked lighting"}</p>
        <p className={`mono ${styles.loaderStep}`}>{Math.round(progress.p * 100)}% · {progress.label}</p>
      </div>

      <div className={`${styles.fade} ${fade ? styles.fadeOn : ""}`} aria-hidden="true" />

      {loaded && (
        <>
          <span className={styles.crosshair} aria-hidden="true" />

          <div className={`${styles.glass} ${styles.where}`} aria-live="polite">
            <p className={styles.whereFloor}>{FLOOR_NAMES[state.floor]}</p>
            <p className={styles.whereRoom}>{state.roomName || "—"}</p>
          </div>

          <div className={styles.topRight}>
            <div className={styles.toolbar} role="toolbar" aria-label="Tour controls">
              <button className={`${styles.glass} ${styles.tool} ${panel === "rooms" ? styles.toolOn : ""}`} onClick={() => toggle("rooms")} aria-expanded={panel === "rooms"} aria-controls="panel-rooms">
                <Layers size={16} strokeWidth={1.6} aria-hidden="true" /> <span>Floors &amp; rooms</span>
              </button>
              <button className={`${styles.glass} ${styles.iconTool} ${panel === "help" ? styles.toolOn : ""}`} onClick={() => toggle("help")} aria-expanded={panel === "help"} aria-controls="panel-help" aria-label="Help: controls">
                <HelpCircle size={17} strokeWidth={1.6} />
              </button>
              <button className={`${styles.glass} ${styles.iconTool} ${panel === "checks" ? styles.toolOn : ""}`} onClick={() => toggle("checks")} aria-expanded={panel === "checks"} aria-controls="panel-checks" aria-label="Model checks">
                <ListChecks size={17} strokeWidth={1.6} />
              </button>
              <button className={`${styles.glass} ${styles.iconTool}`} onClick={() => engine?.resetView()} aria-label="Reset view">
                <RotateCcw size={16} strokeWidth={1.6} />
              </button>
            </div>
            <Link to="/" className={`${styles.glass} ${styles.leave}`}>
              <ArrowLeft size={14} strokeWidth={1.7} aria-hidden="true" /> Leave tour
            </Link>

            {panel === "rooms" && (
              <section id="panel-rooms" className={`${styles.glass} ${styles.panel}`} aria-label="Floors and rooms">
                <div className={styles.panelHead}>
                  <div className={styles.segment} role="tablist" aria-label="Floor">
                    {([0, 1] as FloorId[]).map((f) => (
                      <button key={f} role="tab" aria-selected={panelFloor === f} className={panelFloor === f ? styles.segOn : ""} onClick={() => setPanelFloor(f)}>
                        {FLOOR_NAMES[f]}
                      </button>
                    ))}
                  </div>
                  <button className={styles.close} onClick={() => setPanel(null)} aria-label="Close panel"><X size={16} /></button>
                </div>
                <div className={styles.roomGrid}>
                  {roomsOnFloor(panelFloor).map((rm) => (
                    <button key={rm.id} className={`${styles.roomBtn} ${rm.id === state.roomId ? styles.roomHere : ""}`} onClick={() => jump(rm.id)} aria-current={rm.id === state.roomId ? "location" : undefined}>
                      {rm.name}
                    </button>
                  ))}
                </div>
                <p className={styles.foot}>Jumping between floors is a shortcut — the staircase in the stair hall is fully walkable.</p>
              </section>
            )}

            {panel === "help" && (
              <section id="panel-help" className={`${styles.glass} ${styles.panel}`} aria-label="Controls">
                <div className={styles.panelHead}>
                  <h2 className={styles.panelTitle}>Controls</h2>
                  <button className={styles.close} onClick={() => setPanel(null)} aria-label="Close panel"><X size={16} /></button>
                </div>
                <dl className={styles.keys}>
                  <div><dt>Drag</dt><dd>Look around</dd></div>
                  <div><dt>W A S D</dt><dd>Walk (hold Shift to move faster)</dd></div>
                  <div><dt>Arrow keys</dt><dd>Look</dd></div>
                  <div><dt>E</dt><dd>Open or close the door you face (each entrance leaf works independently)</dd></div>
                  <div><dt>Touch</dt><dd>Left pad to walk, drag anywhere else to look, door button to open</dd></div>
                </dl>
                <p className={styles.foot}>Doors pause if you stand in their swing.</p>
                <div className={styles.quality}>
                  <span>Rendering quality: {quality === "high" ? "high (shadows on)" : "light (no shadows)"}.</span>
                  <button className={styles.linkBtn} onClick={() => setQ(quality === "high" ? "light" : "high")}>
                    Switch to {quality === "high" ? "light" : "high"} quality
                  </button>
                </div>
              </section>
            )}

            {panel === "checks" && (
              <section id="panel-checks" className={`${styles.glass} ${styles.panel} ${styles.checksPanel}`} aria-label="Model checks">
                <div className={styles.panelHead}>
                  <h2 className={styles.panelTitle}>Model checks {checks && <span className="mono">{passCount}/{checks.length}</span>}</h2>
                  <button className={styles.close} onClick={() => setPanel(null)} aria-label="Close panel"><X size={16} /></button>
                </div>
                {!checks ? (
                  <p className={styles.foot}>Running checks against the loaded model…</p>
                ) : (
                  <ul className={styles.checks}>
                    {checks.map((c) => (
                      <li key={c.id}>
                        <span className={c.pass ? styles.ok : styles.fail} aria-label={c.pass ? "Pass" : "Fail"}>
                          {c.pass ? <Check size={13} strokeWidth={2.2} /> : <X size={13} strokeWidth={2.2} />}
                        </span>
                        <div>
                          <p>{c.label}</p>
                          <p className={styles.detail}>{c.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <p className={styles.foot}>Computed live from the layout data and the loaded scene.</p>
              </section>
            )}
          </div>

          {engine && <Minimap engine={engine} floor={state.floor} roomId={state.roomId} />}

          {state.doorAhead && !touch && (
            <p className={`${styles.glass} ${styles.hint}`} aria-live="polite">
              Press <kbd>E</kbd> to open or close the door
            </p>
          )}

          {touch && engine && (
            <>
              <Joystick onMove={(x, y) => engine.setJoystick(x, y)} />
              {state.doorAhead && (
                <button className={styles.doorBtn} onClick={() => engine.toggleDoor()} aria-label="Open or close the door">
                  <DoorOpen size={22} strokeWidth={1.6} />
                </button>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
