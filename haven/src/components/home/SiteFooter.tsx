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
          <p className={styles.line}>The Oak Residences — an illustrative fifteen-storey tower, with one 3BHK home you can walk in 3D.</p>
        </div>
        <nav className={styles.nav} aria-label="Footer">
          {NAV.map((n) => <a key={n.id} href={`#${n.id}`}>{n.label}</a>)}
          <Link to="/tour">Explore in 3D</Link>
        </nav>
      </div>
      <div className={styles.fine}>
        <p>
          3D model authored procedurally (Three.js) for this site and rendered in Blender Cycles, with furniture modelled in Blender and some furniture, decor and surface textures from Poly Haven (CC0). Images are renders of that model or interior concept images showing the intended style; none are photographs of a real property.
        </p>
        <p>© {new Date().getFullYear()} Haven</p>
      </div>
    </footer>
  );
}
