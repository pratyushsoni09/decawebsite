import { Link } from "react-router-dom";
import { ArchMark } from "../ArchMark";
import { NAV } from "./SiteHeader";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <ArchMark size={44} className={styles.mark} />
          <p className={styles.word}>HAVEN</p>
          <p className={styles.line}>The Oak Mansion — an illustrative residence presented as a walkable 3D model.</p>
        </div>
        <nav className={styles.nav} aria-label="Footer">
          {NAV.map((n) => <a key={n.id} href={`#${n.id}`}>{n.label}</a>)}
          <Link to="/tour">Explore in 3D</Link>
        </nav>
      </div>
      <div className={styles.fine}>
        <p>
          3D model authored procedurally (Three.js) for this site. Images are renders of that model and are not photographs of a real property.
        </p>
        <p>© {new Date().getFullYear()} Haven</p>
      </div>
    </footer>
  );
}
