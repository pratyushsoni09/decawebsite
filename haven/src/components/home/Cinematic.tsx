import { Download, Monitor } from "lucide-react";
import styles from "./Cinematic.module.css";

/**
 * The Unreal Engine cinematic of the residence and its Kudasan surroundings, with the
 * downloadable Windows walkthrough. Mounted once the video and the build exist.
 */
export interface CinematicProps {
  video: string;
  poster: string;
  /** direct download of the packaged Windows walkthrough (zip), or null while there is none */
  download: { url: string; size: string } | null;
}

export function Cinematic({ video, poster, download }: CinematicProps) {
  return (
    <section id="cinematic" className={styles.section} aria-labelledby="cinematic-title">
      <header className={`${styles.head} reveal`}>
        <p className="eyebrow">Cinematic</p>
        <h2 id="cinematic-title" className={styles.title}>From the street to the swing.</h2>
        <p className={styles.note}>
          A fly-through rendered in Unreal Engine 5 from the same 3D model: the tower from Kudasan's lanes, up to level 11,
          through the dining hall, the hall and the master bedroom, out to the balcony and the city beyond.
        </p>
      </header>
      <figure className={`${styles.figure} reveal`}>
        <video className={styles.video} controls playsInline preload="metadata" poster={poster} width={1920} height={1080}>
          <source src={video} type="video/mp4" />
          Your browser cannot play this video.
        </video>
        <figcaption className={styles.caption}>Rendered in Unreal Engine 5 from the 3D model · not a photograph</figcaption>
      </figure>
      {download && (
        <div className={`${styles.download} reveal`}>
          <Monitor size={22} strokeWidth={1.5} aria-hidden="true" />
          <div>
            <p className={styles.dlTitle}>Walk it yourself on Windows</p>
            <p className={styles.dlNote}>
              The same residence as a first-person walkthrough app: WASD to walk, mouse to look. Unzip and run HavenOak.exe. Windows 10/11, a
              graphics card with DirectX 12, {download.size} download.
            </p>
          </div>
          <a className={styles.dlBtn} href={download.url} download>
            <Download size={16} strokeWidth={1.8} aria-hidden="true" /> Download
          </a>
        </div>
      )}
    </section>
  );
}
