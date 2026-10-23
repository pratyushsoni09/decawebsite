import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { RENDER_LABEL } from "../../data/rooms";
import { prefersReducedMotion } from "../../hooks/useReveal";
import styles from "./Hero.module.css";

const LINES = "/images/hero-lines.webp";
const TONE = "/images/hero-tone.webp";
const RENDER = "/images/tower-golden.webp";
const PRELOAD = [LINES, TONE, RENDER, "/images/living.webp"];

/** Construction lines drawn first, in % of the stage (x1, y1, x2, y2). */
const GUIDES: [number, number, number, number][] = [
  [0, 79, 100, 79.4], [0, 70, 100, 69.8], [4, 28, 96, 28.2], [0, 50, 100, 50.3], [8, 89, 92, 88.8],
  [36.5, 4, 36.4, 100], [63.4, 6, 63.6, 100], [50, 0, 50.1, 100], [22, 40, 22.2, 100], [78, 38, 77.9, 100],
];

let drawnOnce = false;

/**
 * The hero is the site's loader. While the page loads, the tower is drawn on
 * paper: construction lines first, then the ink line work rising floor by
 * floor, then graphite shading. When everything has loaded, the drawing
 * dissolves into the golden-hour render. The hero is then pinned while you
 * scroll: the picture settles and darkens, and the name rises across it.
 */
export function Hero({ onReady }: { onReady: () => void }) {
  const section = useRef<HTMLElement>(null);
  const [pct, setPct] = useState(0);
  const [drawn, setDrawn] = useState(false);

  // drawing progress, tied to real image loading and smoothed per frame
  useEffect(() => {
    const el = section.current!;
    if (prefersReducedMotion()) {
      el.style.setProperty("--draw", "1");
      el.style.setProperty("--tone", "1");
      setDrawn(true);
      onReady();
      return;
    }
    const minTime = drawnOnce ? 1300 : 4200;
    let loaded = 0;
    let alive = true;
    PRELOAD.forEach((src) => {
      const img = new Image();
      const done = () => alive && (loaded += 1);
      img.onload = done;
      img.onerror = done;
      img.src = src;
    });
    const t0 = performance.now();
    let shown = 0;
    let last = t0;
    let raf = 0;
    let finished = false;
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const timeP = Math.min(1, (now - t0) / minTime);
      const loadP = loaded / PRELOAD.length;
      // never draw ahead of the time curve, and never finish before everything has loaded
      const target = Math.min(timeP, loadP >= 1 ? 1 : Math.min(0.92, 0.12 + loadP * 0.8));
      shown += (target - shown) * (1 - Math.exp(-dt * 5));
      if (target >= 1 && shown > 0.996) shown = 1;
      const draw = Math.min(1, shown / 0.82);
      const tone = Math.max(0, Math.min(1, (shown - 0.62) / 0.38));
      el.style.setProperty("--draw", draw.toFixed(4));
      el.style.setProperty("--tone", tone.toFixed(4));
      setPct(Math.round(shown * 100));
      if (shown >= 1 && !finished) {
        finished = true;
        drawnOnce = true;
        setTimeout(() => {
          if (!alive) return;
          setDrawn(true);
          onReady();
        }, 250);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // pinned-scroll progress
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
      el.style.setProperty("--p", Math.min(1, Math.max(0, -r.top / (span || 1))).toFixed(4));
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
    <section ref={section} id="top" className={`${styles.hero} ${drawn ? styles.go : ""}`} aria-labelledby="hero-title" aria-busy={!drawn}>
      <div className={styles.stage}>
        <div className={styles.media} aria-hidden="true">
          <img className={styles.render} src={RENDER} alt="" width={2400} height={1350} {...{ fetchpriority: "high" }} />
          <div className={styles.sketch}>
            <svg className={styles.guides} viewBox="0 0 100 100" preserveAspectRatio="none">
              {GUIDES.map(([x1, y1, x2, y2], i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} pathLength={1} style={{ animationDelay: `${0.08 * i}s` }} />
              ))}
            </svg>
            <img className={styles.tone} src={TONE} alt="" width={2400} height={1350} />
            <img className={styles.lines} src={LINES} alt="" width={2400} height={1350} />
            <span className={styles.pencil} />
          </div>
          <div className={styles.shade} />
        </div>
        <img
          src={RENDER}
          alt="The Oak Residences: a fifteen-storey tower with vertical oak fins, white floor plates and glass balconies, at golden hour"
          className="visually-hidden"
        />

        <div className={styles.loading} role="status" aria-live="polite">
          <span className={styles.loadingLabel}>{drawn ? "Ready" : "Drawing the tower"}</span>
          <span className={styles.loadingTrack}><span style={{ transform: `scaleX(${pct / 100})` }} /></span>
          <span className="mono">{pct}%</span>
        </div>

        <p className={styles.intro}>
          <span className="eyebrow">Haven presents</span>
          <span>Residence 11A · 3BHK · Level 11 of 15</span>
        </p>

        <div className={styles.titleWrap}>
          <h1 id="hero-title" className={styles.title}>
            <span className={styles.titleLine}>The Oak</span> <span className={styles.titleLine}>Residences</span>
          </h1>
        </div>

        <div className={styles.content}>
          <p className={styles.sub}>
            A fifteen-storey tower of oak, white stone and glass. Walk a furnished 3BHK on level 11 — three bedrooms, a hall, a dining hall with an open pooja unit, a modular kitchen, and a balcony with two swings.
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
