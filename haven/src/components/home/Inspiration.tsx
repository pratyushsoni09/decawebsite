import { inspiration, photoUrl, photographerUrl } from "../../data/inspiration";
import styles from "./Inspiration.module.css";

export function Inspiration() {
  return (
    <section id="real-homes" className={styles.section} aria-labelledby="real-homes-title">
      <header className={`${styles.head} reveal`}>
        <p className="eyebrow">Real homes · interior inspiration</p>
        <h2 id="real-homes-title" className={styles.title}>How 3BHK homes are lived in.</h2>
        <p className={styles.note}>
          Real photographs of other Indian homes, shown for inspiration. They are not Residence 11A, which exists as a 3D model;
          its own images above are renders.
        </p>
      </header>
      <ul className={styles.grid}>
        {inspiration.map((p) => (
          <li key={p.photoId} className={`${styles.cell} reveal`}>
            <a className={styles.thumb} href={photoUrl(p)} target="_blank" rel="noopener noreferrer" aria-label={`${p.room} — view the photo on Unsplash`}>
              <img src={p.src} alt={p.alt} loading="lazy" width={1400} height={934} />
            </a>
            <p className={styles.room}>
              {p.room}
              {p.place && <span className={styles.place}> · {p.place}</span>}
            </p>
            <p className={styles.credit}>
              Photo by{" "}
              <a href={photographerUrl(p)} target="_blank" rel="noopener noreferrer">{p.photographer}</a> on{" "}
              <a href={photoUrl(p)} target="_blank" rel="noopener noreferrer">Unsplash</a>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
