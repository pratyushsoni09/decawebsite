import { useState } from "react";
import { AREAS, PLAN_BOUNDS, roomById, walkableRooms, dimsOf } from "../../data/houseLayout";
import { FloorPlanSvg } from "../FloorPlanSvg";
import styles from "./FloorPlans.module.css";

const VIEWS = [
  { id: "furnished", label: "Furnished" },
  { id: "dimensions", label: "Dimensions only" },
] as const;

export function FloorPlans() {
  const [view, setView] = useState<(typeof VIEWS)[number]["id"]>("furnished");
  const [hover, setHover] = useState<string | null>(null);
  const hovered = hover ? roomById(hover) : null;
  const barY = PLAN_BOUNDS.y2 + 0.9;

  const onKeyTabs = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const next = view === "furnished" ? "dimensions" : "furnished";
      setView(next);
      document.getElementById(`plan-tab-${next}`)?.focus();
    }
  };

  return (
    <section id="plans" className={styles.section} aria-labelledby="plans-title">
      <header className={`${styles.head} reveal`}>
        <div>
          <p className="eyebrow">Floor plan · Level 11 · 3BHK</p>
          <h2 id="plans-title" className={styles.title}>Drawn from the same model you can walk.</h2>
        </div>
        <p className={styles.sub}>Select any room on the plan to stand in it in 3D.</p>
      </header>

      <div className={`${styles.sheet} reveal`}>
        <div className={styles.tabs} role="tablist" aria-label="Plan view" onKeyDown={onKeyTabs}>
          {VIEWS.map((t) => (
            <button
              key={t.id}
              id={`plan-tab-${t.id}`}
              role="tab"
              aria-selected={view === t.id}
              aria-controls="plan-panel"
              tabIndex={view === t.id ? 0 : -1}
              className={`${styles.tab} ${view === t.id ? styles.tabActive : ""}`}
              onClick={() => setView(t.id)}
            >
              {t.label}
            </button>
          ))}
          <span className={styles.readout} aria-live="polite">
            {hovered ? (
              <>
                <strong>{hovered.name}</strong>
                {!hovered.hideDims && <span className="mono"> {dimsOf(hovered).w.toFixed(2)} × {dimsOf(hovered).d.toFixed(2)} m</span>}
                <span className={styles.enter}> · Enter to walk in</span>
              </>
            ) : (
              <span>3BHK · {walkableRooms.filter((r) => r.flat === "A").length} spaces · {Math.round(AREAS.internal)} m² carpet + {Math.round(AREAS.balcony)} m² balcony</span>
            )}
          </span>
        </div>

        <div id="plan-panel" role="tabpanel" aria-labelledby={`plan-tab-${view}`} className={styles.panel}>
          <div className={styles.planScroll}>
            <FloorPlanSvg
              interactive
              highlight={hover}
              onRoomEnter={setHover}
              showFurniture={view === "furnished"}
              className={styles.svg}
              title="Residence 11A floor plan"
            >
              {/* Scale bar and north point, drawn in plan metres */}
              <g aria-hidden="true" className={styles.annot}>
                {[0, 1, 2, 3].map((m, i) => (
                  <rect key={m} x={m} y={barY} width={1} height={0.16} className={i % 2 ? styles.barLight : styles.barDark} />
                ))}
                {[0, 2, 4].map((m) => (
                  <text key={m} x={m} y={barY + 0.62} className={styles.barText}>{m}</text>
                ))}
                <text x={4.4} y={barY + 0.62} className={styles.barText} textAnchor="start">m</text>
                <g transform={`translate(12.4 ${barY + 0.1})`}>
                  <circle r={0.6} className={styles.northRing} />
                  <path d="M0 -0.48 L0.26 0.34 L0 0.2 L-0.26 0.34 Z" className={styles.barDark} />
                  <text y={-0.75} className={styles.barText}>N</text>
                </g>
              </g>
            </FloorPlanSvg>
          </div>
        </div>

        <footer className={styles.titleBlock}>
          <div><span>Project</span>The Oak Residences</div>
          <div><span>Drawing</span>Residence 11A plan</div>
          <div><span>Scale</span>1:100 @ A1</div>
          <div><span>Sheet</span><b className="mono">A-211</b></div>
        </footer>
      </div>
    </section>
  );
}
