import { useEffect, useState } from "react";
import { ArchMark } from "../ArchMark";
import styles from "./IntroLoader.module.css";

/** Preloads the given images and reports real progress; fades out when done. */
export function IntroLoader({ images, onDone }: { images: string[]; onDone: () => void }) {
  const [loaded, setLoaded] = useState(0);
  const [hidden, setHidden] = useState(false);
  const pct = Math.round((loaded / images.length) * 100);

  useEffect(() => {
    let alive = true;
    images.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      const done = () => alive && setLoaded((n) => n + 1);
      img.onload = done;
      img.onerror = done;
      img.src = src;
    });
    return () => { alive = false; };
  }, [images]);

  useEffect(() => {
    if (loaded < images.length) return;
    const t1 = setTimeout(() => { setHidden(true); onDone(); }, 350);
    return () => clearTimeout(t1);
  }, [loaded, images.length, onDone]);

  return (
    <div className={`${styles.loader} ${hidden ? styles.hidden : ""}`} role="status" aria-live="polite" aria-hidden={hidden}>
      <ArchMark size={64} className={styles.mark} />
      <div className={styles.track}><div className={styles.bar} style={{ transform: `scaleX(${pct / 100})` }} /></div>
      <div className={styles.pct}>{pct}%</div>
      <span className="visually-hidden">Loading The Oak Residences</span>
    </div>
  );
}
