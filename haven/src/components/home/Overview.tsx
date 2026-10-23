import { STATS } from "../../data/rooms";
import { useCountUp } from "../../hooks/useCountUp";
import styles from "./Overview.module.css";

function Stat({ label, value, display, decimals = 0, suffix = "" }: { label: string; value: number; display: string; decimals?: number; suffix?: string }) {
  const { ref, value: v } = useCountUp<HTMLDivElement>(value, decimals);
  const shown = v === value ? display : `${v.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  return (
    <div className={styles.stat} ref={ref}>
      <dt className={styles.statLabel}>{label}</dt>
      <dd className={styles.statValue}>
        <span aria-hidden="true">{shown}</span>
        <span className="visually-hidden">{display}</span>
      </dd>
    </div>
  );
}

export function Overview() {
  return (
    <section id="overview" className={styles.section} aria-labelledby="overview-title">
      <div className={styles.grid}>
        <header className={`${styles.head} reveal`}>
          <p className="eyebrow">Property overview</p>
          <p className={`mono ${styles.sheet}`}>Sheet A-100 · Residence 11A, level 11</p>
          <h2 id="overview-title" className={styles.title}>A home among the treetops, eleven floors up.</h2>
        </header>
        <div className={styles.body}>
          <p className={`${styles.lead} reveal`}>
            The Oak Residences is a fifteen-storey tower wrapped in vertical oak fins, with white stone floor plates and a glass-fronted balcony on every level. Residence 11A takes the whole of level 11. A private lift opens into a gallery hall; along the south façade lie the living room, an open kitchen and dining room, and the primary suite with its own bathroom. Two further bedrooms, a study, a family bathroom and a laundry sit to the north. Every room is furnished, and three pairs of glass doors open onto a twenty-three-metre balcony with an egg chair and a porch swing.
          </p>
          <p className={`${styles.disclaimer} reveal`}>
            An illustrative, designed building. The 3D model is authored geometry, and every image on this site is a render of that model. Neither documents a real property.
          </p>
          <dl className={`${styles.stats} reveal`}>
            {STATS.map((s) => (
              <Stat
                key={s.label}
                label={s.label}
                value={s.value}
                display={s.display}
                decimals={"decimals" in s ? s.decimals : 0}
                suffix={"suffix" in s ? s.suffix : ""}
              />
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
