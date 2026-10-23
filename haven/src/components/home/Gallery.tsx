import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { gallery } from "../../data/gallery";
import { RENDER_LABEL } from "../../data/rooms";
import styles from "./Gallery.module.css";

function Lightbox({ index, onClose, onStep }: { index: number; onClose: () => void; onStep: (d: number) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const touch = useRef<number | null>(null);
  const img = gallery[index];

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [onClose, onStep]);

  return (
    <div
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      aria-label={`${img.caption}, image ${index + 1} of ${gallery.length}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) onStep(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <button ref={closeRef} className={styles.close} onClick={onClose} aria-label="Close gallery">
        <X size={22} strokeWidth={1.5} />
      </button>
      <button className={`${styles.nav} ${styles.prev}`} onClick={() => onStep(-1)} aria-label="Previous image">
        <ChevronLeft size={28} strokeWidth={1.3} />
      </button>
      <figure className={styles.lbFigure}>
        <img key={img.src} src={img.src} alt={img.alt} className={styles.lbImg} />
        <figcaption className={styles.lbCaption}>
          <span>{img.caption}</span>
          <span className="mono">{index + 1} / {gallery.length}</span>
          <span className={styles.lbNote}>{RENDER_LABEL}</span>
        </figcaption>
      </figure>
      <button className={`${styles.nav} ${styles.next}`} onClick={() => onStep(1)} aria-label="Next image">
        <ChevronRight size={28} strokeWidth={1.3} />
      </button>
    </div>
  );
}

export function Gallery() {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + gallery.length) % gallery.length)), []);

  return (
    <section id="gallery" className={styles.section} aria-labelledby="gallery-title">
      <header className={`${styles.head} reveal`}>
        <p className="eyebrow">Interior gallery</p>
        <h2 id="gallery-title" className={styles.title}>Materials and moods.</h2>
        <p className={styles.note}>All gallery images are illustrative renders of the 3D model, not photographs.</p>
      </header>
      <ul className={styles.grid}>
        {gallery.map((g, i) => (
          <li key={g.src + i} className={`${styles.cell} ${styles[g.shape]} reveal`}>
            <button className={styles.thumb} onClick={() => setOpen(i)} aria-label={`Open image: ${g.caption}`}>
              <img src={g.src} alt={g.alt} loading="lazy" width={1200} height={g.shape === "tall" ? 1500 : 900} />
            </button>
            <p className={styles.caption}>
              <span className="mono">{String(i + 1).padStart(2, "0")}</span> {g.caption}
            </p>
          </li>
        ))}
      </ul>
      {open !== null && <Lightbox index={open} onClose={close} onStep={step} />}
    </section>
  );
}
