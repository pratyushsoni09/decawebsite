import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Box, X } from "lucide-react";
import { ArchMark } from "../ArchMark";
import { useActiveSection } from "../../hooks/useActiveSection";
import styles from "./SiteHeader.module.css";

export const NAV = [
  { id: "overview", label: "The residence" },
  { id: "rooms", label: "Rooms" },
  { id: "plans", label: "Floor plan" },
  { id: "gallery", label: "Gallery" },
  { id: "cinematic", label: "Cinematic" },
  { id: "enquire", label: "Viewing" },
];
const IDS = NAV.map((n) => n.id);

/** Floating pill navigation: MENU · mark · INQUIRE, with a full-screen menu. */
export function SiteHeader({ show = true }: { show?: boolean }) {
  const [open, setOpen] = useState(false);
  const active = useActiveSection(IDS);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    const btn = menuBtn.current;
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      btn?.focus();
    };
  }, [open]);

  return (
    <>
      <header className={`${styles.header} ${show ? "" : styles.waiting}`}>
        <div className={styles.pill}>
          <button ref={menuBtn} className={styles.menuBtn} onClick={() => setOpen(true)} aria-expanded={open} aria-controls="site-menu">
            <span className={styles.lines} aria-hidden="true"><span /><span /></span>
            Menu
          </button>
          <a href="#top" className={styles.mark} aria-label="Haven — The Oak Residences, back to top">
            <ArchMark size={38} />
          </a>
          <a href="#enquire" className={styles.inquire}>
            Inquire <ArrowRight size={18} strokeWidth={1.3} aria-hidden="true" />
          </a>
        </div>
      </header>

      <div id="site-menu" className={`${styles.menu} ${open ? styles.menuOpen : ""}`} role="dialog" aria-modal="true" aria-label="Site menu" hidden={!open}>
        <div className={styles.menuTop}>
          <p className={styles.menuBrand}>HAVEN <span>The Oak Residences</span></p>
          <button ref={closeBtn} className={styles.close} onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={22} strokeWidth={1.4} />
          </button>
        </div>
        <nav aria-label="Primary" className={styles.menuNav}>
          {NAV.map((n, i) => (
            <a key={n.id} href={`#${n.id}`} onClick={() => setOpen(false)} aria-current={active === n.id ? "true" : undefined}
              className={active === n.id ? styles.current : undefined}>
              <span className="mono">0{i + 1}</span>
              {n.label}
            </a>
          ))}
          <Link to="/tour" className={styles.menu3d} onClick={() => setOpen(false)}>
            <Box size={18} strokeWidth={1.5} aria-hidden="true" /> Walk Residence 11A in 3D
          </Link>
        </nav>
        <p className={styles.menuFoot}>3BHK on level 11 of 15 · hall, dining hall, kitchen · a balcony with two swings</p>
      </div>
    </>
  );
}
