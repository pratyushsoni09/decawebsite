import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Box, Menu, X } from "lucide-react";
import { useActiveSection } from "../../hooks/useActiveSection";
import styles from "./SiteHeader.module.css";

export const NAV = [
  { id: "overview", label: "The house" },
  { id: "rooms", label: "Rooms" },
  { id: "plans", label: "Floor plans" },
  { id: "gallery", label: "Gallery" },
  { id: "enquire", label: "Viewing" },
];
const IDS = NAV.map((n) => n.id);

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(IDS);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <header className={`${styles.header} ${scrolled ? styles.solid : ""} ${open ? styles.menuOpen : ""}`}>
      <div className={styles.inner}>
        <a href="#top" className={styles.brand} aria-label="Haven — The Oak Mansion, back to top">
          <span className={styles.word}>HAVEN</span>
          <span className={styles.sub}>The Oak Mansion</span>
        </a>
        <nav className={styles.nav} aria-label="Primary">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className={active === n.id ? styles.active : undefined} aria-current={active === n.id ? "true" : undefined}>
              {n.label}
            </a>
          ))}
        </nav>
        <Link to="/tour" className={styles.cta}>
          <Box size={15} strokeWidth={1.6} aria-hidden="true" /> Explore in 3D
        </Link>
        <button className={styles.burger} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
        </button>
      </div>
      <div id="mobile-nav" className={styles.sheet} hidden={!open}>
        <nav aria-label="Mobile">
          {NAV.map((n, i) => (
            <a key={n.id} href={`#${n.id}`} onClick={() => setOpen(false)}>
              <span className="mono">0{i + 1}</span>{n.label}
            </a>
          ))}
          <Link to="/tour" className={styles.sheetCta} onClick={() => setOpen(false)}>
            <Box size={16} strokeWidth={1.6} aria-hidden="true" /> Explore in 3D
          </Link>
        </nav>
      </div>
    </header>
  );
}
