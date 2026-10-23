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
          <h2 id="overview-title" className={styles.title}>A 3BHK among the treetops, eleven floors up.</h2>
        </header>
        <div className={styles.body}>
          <p className={`${styles.lead} reveal`}>
            The Oak Residences is a fifteen-storey tower wrapped in vertical oak fins, with two mirrored homes on every floor around a shared lift lobby. Residence 11A is a simple, generous 3BHK on level 11. The front door opens straight into the dining hall, where the family's pooja unit stands open against the wall and the modular kitchen opens through a wide archway. Beyond it, the hall runs along the south façade under a cove-lit false ceiling, facing a fluted oak TV wall. There are three bedrooms — the master with its own bathroom — and a common bathroom. Every room is furnished, and two pairs of glass doors open onto a balcony with an egg chair and a porch swing.
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
