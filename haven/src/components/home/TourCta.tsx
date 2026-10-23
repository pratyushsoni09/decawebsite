import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import styles from "./TourCta.module.css";

const KEYS = [
  { k: "W", area: "w" },
  { k: "A", area: "a" },
  { k: "S", area: "s" },
  { k: "D", area: "d" },
  { k: "E", area: "e" },
];

export function TourCta() {
  return (
    <section className={styles.band} aria-labelledby="cta-title">
      <img className={styles.bg} src="/images/stair.webp" alt="" aria-hidden="true" loading="lazy" width={2000} height={1125} />
      <div className={styles.inner}>
        <div className={`${styles.copy} reveal`}>
          <p className="eyebrow">Walk it yourself</p>
          <h2 id="cta-title" className={styles.title}>Every room, both floors, the real staircase.</h2>
          <p className={styles.sub}>
            Drag to look around, walk with W A S D or the on-screen pad, and press E to open the door in front of you.
          </p>
          <Link to="/tour" className={styles.button}>
            Explore the 360° house <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>
        <div className={`${styles.keys} reveal`} aria-hidden="true">
          {KEYS.map(({ k, area }) => (
            <span key={k} className={`${styles.key} ${k === "E" ? styles.keyE : ""}`} style={{ gridArea: area }}>
              {k}
            </span>
          ))}
          <span className={styles.keyNote} style={{ gridArea: "n1" }}>walk</span>
          <span className={styles.keyNote} style={{ gridArea: "n2" }}>door</span>
        </div>
      </div>
    </section>
  );
}
