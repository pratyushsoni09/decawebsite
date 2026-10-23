import { useState } from "react";
import { roomById, roomsOnFloor, dimsOf, type FloorId } from "../../data/houseLayout";
import { FloorPlanSvg } from "../FloorPlanSvg";
import styles from "./FloorPlans.module.css";

const TABS: { floor: FloorId; label: string; sheet: string }[] = [
  { floor: 0, label: "Ground floor", sheet: "A-201" },
  { floor: 1, label: "First floor", sheet: "A-202" },
];

export function FloorPlans() {
  const [floor, setFloor] = useState<FloorId>(0);
  const [hover, setHover] = useState<string | null>(null);
  const tab = TABS[floor];
  const hovered = hover ? roomById(hover) : null;

  const onKeyTabs = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const next = (floor === 0 ? 1 : 0) as FloorId;
      setFloor(next);
      document.getElementById(`plan-tab-${next}`)?.focus();
    }
  };

  return (
    <section id="plans" className={styles.section} aria-labelledby="plans-title">
      <header className={`${styles.head} reveal`}>
        <div>
          <p className="eyebrow">Floor plans</p>
          <h2 id="plans-title" className={styles.title}>Drawn from the same model you can walk.</h2>
        </div>
        <p className={styles.sub}>Select any room on the plan to stand in it in 3D.</p>
      </header>

      <div className={`${styles.sheet} reveal`}>
        <div className={styles.tabs} role="tablist" aria-label="Floor" onKeyDown={onKeyTabs}>
          {TABS.map((t) => (
            <button
              key={t.floor}
              id={`plan-tab-${t.floor}`}
              role="tab"
              aria-selected={floor === t.floor}
              aria-controls="plan-panel"
              tabIndex={floor === t.floor ? 0 : -1}
              className={`${styles.tab} ${floor === t.floor ? styles.tabActive : ""}`}
              onClick={() => setFloor(t.floor)}
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
              <span>{roomsOnFloor(floor).length} rooms on this floor</span>
            )}
          </span>
        </div>

        <div id="plan-panel" role="tabpanel" aria-labelledby={`plan-tab-${floor}`} className={styles.panel}>
          <div className={styles.planScroll}>
            <FloorPlanSvg key={floor} floor={floor} interactive highlight={hover} onRoomEnter={setHover} className={styles.svg}>
              {/* Scale bar and north point, drawn in plan metres */}
              <g aria-hidden="true" className={styles.annot}>
                {[0, 2, 4, 6].map((m, i) => (
                  <rect key={m} x={m} y={20.15} width={2} height={0.22} className={i % 2 ? styles.barLight : styles.barDark} />
                ))}
                {[0, 2, 4, 6, 8].map((m) => (
                  <text key={m} x={m} y={20.95} className={styles.barText}>{m}</text>
                ))}
                <text x={8.5} y={20.95} className={styles.barText} textAnchor="start">m</text>
                <g transform="translate(39 20.2)">
                  <circle r={0.75} className={styles.northRing} />
                  <path d="M0 -0.6 L0.32 0.42 L0 0.24 L-0.32 0.42 Z" className={styles.barDark} />
                  <text y={-0.95} className={styles.barText}>N</text>
                </g>
              </g>
            </FloorPlanSvg>
          </div>
        </div>

        <footer className={styles.titleBlock}>
          <div><span>Project</span>The Oak Mansion</div>
          <div><span>Drawing</span>{tab.label} plan</div>
          <div><span>Scale</span>1:200 @ A1</div>
          <div><span>Sheet</span><b className="mono">{tab.sheet}</b></div>
        </footer>
      </div>
    </section>
  );
}
