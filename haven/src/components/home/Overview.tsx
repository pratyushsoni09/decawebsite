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
          <p className={`mono ${styles.sheet}`}>Sheet A-100 · General arrangement</p>
          <h2 id="overview-title" className={styles.title}>A quiet house, built around light and oak.</h2>
        </header>
        <div className={styles.body}>
          <p className={`${styles.lead} reveal`}>
            The Oak Mansion is planned symmetrically around a stone-floored entrance hall and a U-shaped oak staircase rising beneath a tall north window. On the ground floor are the drawing room, library, kitchen, an enclosed dining room for ten and a guest bedroom with its own bathroom. Upstairs, a gallery opens into the family lounge, the primary suite with dressing room and private bathroom, and three further bedrooms, each with a bathroom close at hand.
          </p>
          <p className={`${styles.disclaimer} reveal`}>
            An illustrative, designed residence. The 3D model is authored geometry, and every image on this site is a render of that model. Neither documents a real property.
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
