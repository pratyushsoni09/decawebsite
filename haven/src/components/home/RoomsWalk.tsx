import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { featuredRooms, RENDER_LABEL } from "../../data/rooms";
import { FloorPlanSvg } from "../FloorPlanSvg";
import styles from "./RoomsWalk.module.css";

/**
 * Room by room: a sticky "stage" (render + live key plan) on the left while
 * the room notes scroll past on the right. On small screens each note
 * carries its own image instead.
 */
export function RoomsWalk() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const current = featuredRooms[active];

  return (
    <section id="rooms" className={styles.section} aria-labelledby="rooms-title">
      <header className={`${styles.head} reveal`}>
        <p className="eyebrow">Room by room</p>
        <h2 id="rooms-title" className={styles.title}>Move through the residence.</h2>
        <p className={styles.headNote}>Every space of the 3BHK, in the order you would walk them from the front door to the balcony.</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.stage} aria-hidden="true">
          <div className={styles.frame}>
            {featuredRooms.map((rm, i) => (
              <img
                key={rm.id}
                src={rm.image}
                alt=""
                width={1200}
                height={1500}
                loading="lazy"
                className={`${styles.stageImg} ${i === active ? styles.on : ""}`}
                style={rm.focus ? { objectPosition: rm.focus } : undefined}
              />
            ))}
            <span className={styles.badge}>{current.label ?? RENDER_LABEL}</span>
            <div className={styles.counter}>
              <span className={styles.counterNum}>{current.num}</span>
              <span className="mono">/ 07</span>
            </div>
          </div>
          <div className={styles.keyPlan}>
            <div className={styles.keyHead}>
              <span className="mono">Key plan</span>
              <span className="mono">Level 11 · {current.name}</span>
            </div>
            <FloorPlanSvg highlight={current.id} labels="none" showFurniture={false} title="Key plan" />
          </div>
        </div>

        <ol className={styles.list}>
          {featuredRooms.map((rm, i) => (
            <li
              key={rm.id}
              className={`${styles.item} ${i === active ? styles.itemActive : ""}`}
              data-index={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
            >
              <figure className={styles.mobileFig}>
                <img src={rm.image} alt={rm.alt} width={1200} height={1500} loading="lazy" style={rm.focus ? { objectPosition: rm.focus } : undefined} />
                <figcaption className={styles.badge}>{rm.label ?? RENDER_LABEL}</figcaption>
              </figure>
              <p className="eyebrow">
                {rm.num} · Residence 11A
              </p>
              <h3 className={styles.name}>{rm.name}</h3>
              <p className={styles.desc}>{rm.description}</p>
              <ul className={styles.chips} aria-label="Specification">
                {rm.chips.map((c) => (
                  <li key={c} className="chip">{c}</li>
                ))}
              </ul>
              <Link to={`/tour?room=${rm.id}`} className={styles.link}>
                Stand in this room in 3D <ArrowRight size={15} strokeWidth={1.7} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
