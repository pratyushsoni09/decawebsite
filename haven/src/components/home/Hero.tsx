import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { RENDER_LABEL } from "../../data/rooms";
import { prefersReducedMotion } from "../../hooks/useReveal";
import styles from "./Hero.module.css";

/**
 * The tower opens as an architect's graphite drawing that dissolves, from
 * the centre outwards, into the full-colour render. The hero is pinned while
 * you scroll: the picture settles and darkens, and the name rises across it.
 */
export function Hero({ start }: { start: boolean }) {
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = section.current;
    if (!el || prefersReducedMotion()) {
      el?.style.setProperty("--p", "1");
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const span = el.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / (span || 1)));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={section} id="top" className={`${styles.hero} ${start ? styles.go : ""}`} aria-labelledby="hero-title">
      <div className={styles.stage}>
        <div className={styles.media} aria-hidden="true">
          <img className={styles.render} src="/images/tower-golden.webp" alt="" width={2400} height={1350} {...{ fetchpriority: "high" }} />
          <img className={styles.sketch} src="/images/hero-sketch.webp" alt="" width={2400} height={1350} />
          <div className={styles.shade} />
        </div>
        <img
          src="/images/tower-golden.webp"
          alt="The Oak Residences: a fifteen-storey tower with vertical oak fins, white floor plates and glass balconies, at golden hour"
          className="visually-hidden"
        />

        <p className={styles.intro}>
          <span className="eyebrow">Haven presents</span>
          <span>Residence 11A · Level 11 of 15</span>
        </p>

        <div className={styles.titleWrap}>
          <h1 id="hero-title" className={styles.title}>
            <span className={styles.titleLine}>The Oak</span> <span className={styles.titleLine}>Residences</span>
          </h1>
        </div>

        <div className={styles.content}>
          <p className={styles.sub}>
            A fifteen-storey tower of oak, white stone and glass. Walk one full-floor home on level 11 — three bedrooms, every room furnished, and a long balcony with two swings.
          </p>
          <div className={styles.actions}>
            <Link to="/tour" className={styles.primary}>
              Walk Residence 11A in 3D <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </Link>
            <a href="#enquire" className={styles.secondary}>Book a viewing</a>
          </div>
        </div>

        <p className={styles.caption}>Golden hour · {RENDER_LABEL}</p>
        <span className={styles.scrollCue} aria-hidden="true">Scroll</span>
      </div>
    </section>
  );
}
