import { Link } from "react-router-dom";
import { ArrowRight, ArrowDown } from "lucide-react";
import { RENDER_LABEL } from "../../data/rooms";
import styles from "./Hero.module.css";

/**
 * The hero opens as a graphite drawing of the south elevation; a brass
 * drafting line then sweeps across and reveals the golden-hour render.
 */
export function Hero({ start }: { start: boolean }) {
  return (
    <section id="top" className={`${styles.hero} ${start ? styles.go : ""}`} aria-labelledby="hero-title">
      <div className={styles.media} aria-hidden="true">
        <img className={styles.render} src="/images/facade-golden.webp" alt="" width={2400} height={1350} {...{ fetchpriority: "high" }} />
        <div className={styles.sketchWrap}>
          <img className={styles.sketch} src="/images/hero-sketch.webp" alt="" width={2400} height={1350} />
        </div>
        <span className={styles.scan} />
        <div className={styles.shade} />
      </div>
      <img src="/images/facade-golden.webp" alt="The Oak Mansion's symmetrical south façade: ivory plaster, vertical oak cladding, tall bronze windows and oak front doors in a stone portal, at golden hour" className="visually-hidden" />

      <div className={styles.content}>
        <p className={`eyebrow ${styles.eyebrow}`}>Haven presents</p>
        <h1 id="hero-title" className={styles.title}>
          <span>The Oak</span> <span>Mansion</span>
        </h1>
        <div className={styles.dim} aria-hidden="true">
          <span className={styles.dimLine} />
          <span className="mono">40.00 m · south elevation</span>
          <span className={styles.dimLine} />
        </div>
        <p className={styles.sub}>
          Five bedrooms and five bathrooms over two floors, finished in natural oak, ivory plaster and bronze. Walk every room in 3D.
        </p>
        <div className={styles.actions}>
          <Link to="/tour" className={styles.primary}>
            Explore the 360° house <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </Link>
          <a href="#enquire" className={styles.secondary}>Book a viewing</a>
        </div>
      </div>

      <aside className={styles.titleBlock} aria-label="Drawing information">
        <dl>
          <div><dt>Project</dt><dd>The Oak Mansion</dd></div>
          <div><dt>Drawing</dt><dd>South elevation</dd></div>
          <div><dt>Sheet</dt><dd className="mono">A-000</dd></div>
        </dl>
        <p className={styles.caption}>Golden hour · {RENDER_LABEL}</p>
      </aside>

      <a href="#overview" className={styles.scroll} aria-label="Scroll to the property overview">
        <ArrowDown size={14} strokeWidth={1.6} aria-hidden="true" />
      </a>
    </section>
  );
}
