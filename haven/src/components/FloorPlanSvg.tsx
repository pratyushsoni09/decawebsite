import { memo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BALCONY, FOOTPRINT, PARTY_X, PLAN_BOUNDS, dimsOf, footprint, furniture, roomsOnFloor, type FloorId, type FurnitureDef } from "../data/houseLayout";
import { balustrade, leaves, wallBoxes } from "../data/layoutGeometry";
import styles from "./FloorPlanSvg.module.css";

interface Props {
  floor?: FloorId;
  variant?: "light" | "dark";
  /** rooms become links to /tour?room=… */
  interactive?: boolean;
  highlight?: string | null;
  labels?: "full" | "names" | "none";
  showFurniture?: boolean;
  className?: string;
  title?: string;
  children?: ReactNode;
  onRoomEnter?: (id: string | null) => void;
}

const PAD = 1.2;
/** The plan shows Residence 11A and the lift lobby only; the neighbouring home lies beyond the crop. */
export const PLAN_VIEW = { x1: PLAN_BOUNDS.x1, x2: 13.4, y1: PLAN_BOUNDS.y1, y2: PLAN_BOUNDS.y2 };
const VIEW = `${PLAN_VIEW.x1 - PAD} ${PLAN_VIEW.y1 - PAD} ${PLAN_VIEW.x2 - PLAN_VIEW.x1 + PAD} ${PLAN_VIEW.y2 - PLAN_VIEW.y1 + PAD * 2 + 1.2}`;

const fmt = (n: number) => n.toFixed(2);
/** Parts of the neighbouring home that fall inside the crop, blanked out. */
const NEIGHBOUR_BLOCK = [
  { x1: 12.125, y1: 5.75, x2: 14, y2: 15.75 },
  { x1: PARTY_X + 0.06, y1: 15.75, x2: 14, y2: 18.6 },
  { x1: 13.4, y1: -0.2, x2: 14, y2: 5.75 },
];
const SKIP: FurnitureDef["type"][] = ["art", "mirror", "pendant", "chandelier", "tv", "lift", "accentWall"];

function FurnitureMark({ it }: { it: FurnitureDef }) {
  const fp = footprint(it);
  if (it.type === "roundTable" || it.type === "plant" || it.type === "floorLamp" || it.type === "swingEgg" || it.variant === "round" || it.variant === "ottoman") {
    return <circle cx={it.x} cy={it.y} r={(fp.x2 - fp.x1) / 2} className={styles.furn} />;
  }
  if (it.type === "rug") {
    return <rect x={fp.x1} y={fp.y1} width={fp.x2 - fp.x1} height={fp.y2 - fp.y1} className={styles.rug} />;
  }
  const rx = it.type === "bath" ? 0.3 : it.type === "sofa" || it.type === "loungeChair" || it.type === "readingChair" ? 0.12 : 0.03;
  return <rect x={fp.x1} y={fp.y1} width={fp.x2 - fp.x1} height={fp.y2 - fp.y1} rx={rx} className={styles.furn} />;
}

function FloorPlanSvgInner({
  floor = 0, variant = "light", interactive = false, highlight = null, labels = "full",
  showFurniture = true, className, title, children, onRoomEnter,
}: Props) {
  const plan = roomsOnFloor(floor);
  const walls = wallBoxes(floor);
  const items = showFurniture ? furniture.filter((it) => !SKIP.includes(it.type)) : [];

  return (
    <svg
      viewBox={VIEW}
      className={`${styles.plan} ${styles[variant]} ${className ?? ""}`}
      role={interactive ? "group" : "img"}
      aria-label={title ?? "Residence 11A floor plan"}
    >
      <defs>
        <pattern id="hatch" patternUnits="userSpaceOnUse" width="0.5" height="0.5" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="0.5" className={styles.hatchLine} />
        </pattern>
      </defs>


      {/* Room fills (links when interactive) */}
      {plan.filter((rm) => rm.flat !== "B").map((rm) => {
        const active = highlight === rm.id;
        const body = rm.rects.map((rc, i) => (
          <rect key={i} x={rc.x1} y={rc.y1} width={rc.x2 - rc.x1} height={rc.y2 - rc.y1}
            className={`${styles.roomFill} ${rm.kind === "outdoor" ? styles.deck : ""}`} />
        ));
        const cls = `${styles.room} ${active ? styles.active : ""}`;
        if (!interactive) return <g key={rm.id} className={cls}>{body}</g>;
        return (
          <Link
            key={rm.id}
            to={`/tour?room=${rm.id}`}
            className={cls}
            aria-label={`${rm.name} — stand in this room in 3D`}
            onMouseEnter={() => onRoomEnter?.(rm.id)}
            onMouseLeave={() => onRoomEnter?.(null)}
            onFocus={() => onRoomEnter?.(rm.id)}
            onBlur={() => onRoomEnter?.(null)}
          >
            {body}
          </Link>
        );
      })}

      {/* deck boards on the balcony */}
      <g aria-hidden="true" className={styles.boards}>
        {Array.from({ length: Math.floor((BALCONY.x2 - BALCONY.x1) / 0.6) }, (_, i) => (
          <line key={i} x1={BALCONY.x1 + 0.6 * (i + 1)} x2={BALCONY.x1 + 0.6 * (i + 1)} y1={BALCONY.y1} y2={BALCONY.y2} />
        ))}
      </g>

      {showFurniture && <g className={styles.furnLayer} aria-hidden="true">{items.map((it) => <FurnitureMark key={it.id} it={it} />)}</g>}

      {/* Walls */}
      <g aria-hidden="true">
        {walls.map((b, i) =>
          b.type === "solid" ? (
            <rect key={i} x={b.x1} y={b.y1} width={b.x2 - b.x1} height={b.y2 - b.y1} className={styles.wall} />
          ) : b.type === "window" ? (
            <g key={i}>
              <rect x={b.x1} y={b.y1} width={b.x2 - b.x1} height={b.y2 - b.y1} className={styles.window} />
              {b.x2 - b.x1 > b.y2 - b.y1 ? (
                <line x1={b.x1} x2={b.x2} y1={(b.y1 + b.y2) / 2} y2={(b.y1 + b.y2) / 2} className={styles.glassLine} />
              ) : (
                <line y1={b.y1} y2={b.y2} x1={(b.x1 + b.x2) / 2} x2={(b.x1 + b.x2) / 2} className={styles.glassLine} />
              )}
            </g>
          ) : null,
        )}
        {/* glass balustrade (thin rails only; the wide block over 11B's balcony is collision, not glass) */}
        {balustrade.filter((b) => Math.min(b.x2 - b.x1, b.y2 - b.y1) < 0.4).map((b, i) => (
          <rect key={`rail${i}`} x={b.x1} y={b.y1} width={b.x2 - b.x1} height={b.y2 - b.y1} className={styles.rail} />
        ))}
        <rect x={FOOTPRINT.x2 - 0.3} y={BALCONY.y1} width={0.3} height={BALCONY.y2 - BALCONY.y1} className={styles.rail} />
        {/* the neighbouring home is not drawn: blank whatever of it falls inside the crop */}
        {NEIGHBOUR_BLOCK.map((rc, i) => (
          <rect key={`nb${i}`} x={rc.x1} y={rc.y1} width={rc.x2 - rc.x1} height={rc.y2 - rc.y1} className={styles.neighbourBase} />
        ))}
        <rect x={PARTY_X - 0.06} y={BALCONY.y1} width={0.12} height={BALCONY.y2 - BALCONY.y1 + 0.15} className={styles.wall} />
      </g>

      {/* Door swings */}
      <g aria-hidden="true" className={styles.doors}>
        {leaves.map((l, i) => {
          const L = l.length;
          const tipC = [l.hx + l.ux * L, l.hy + l.uy * L];
          const tipO = [l.hx + l.nx * L, l.hy + l.ny * L];
          const sweep = l.ux * l.ny - l.uy * l.nx > 0 ? 1 : 0;
          return (
            <g key={i}>
              <line x1={l.hx} y1={l.hy} x2={tipO[0]} y2={tipO[1]} className={styles.leaf} />
              <path d={`M ${tipC[0]} ${tipC[1]} A ${L} ${L} 0 0 ${sweep} ${tipO[0]} ${tipO[1]}`} className={styles.swing} />
            </g>
          );
        })}
      </g>

      {/* Labels */}
      {labels !== "none" && (
        <g aria-hidden="true" className={styles.labels}>
          {plan.filter((rm) => rm.flat !== "B").map((rm) => {
            const m = rm.rects[0];
            const w = m.x2 - m.x1;
            const h = m.y2 - m.y1;
            const cx = (m.x1 + m.x2) / 2;
            const cy = rm.kind === "outdoor" ? m.y1 + 0.75 : (m.y1 + m.y2) / 2;
            const size = Math.min(0.5, (w * 1.75) / Math.max(rm.name.length, 6), h / 3);
            const { w: dw, d: dd } = dimsOf(rm);
            return (
              <g key={rm.id}>
                <text x={cx} y={cy} fontSize={size} className={styles.name}>{rm.name}</text>
                {labels === "full" && !rm.hideDims && (
                  <text x={cx} y={cy + size * 1.15} fontSize={size * 0.72} className={styles.dims}>
                    {fmt(dw)} × {fmt(dd)} m
                  </text>
                )}
              </g>
            );
          })}
        </g>
      )}

      {labels !== "none" && (
        <g aria-hidden="true">
          <text x={PARTY_X} y={PLAN_BOUNDS.y1 - 0.45} className={styles.entrance}>Lifts ↓</text>
        </g>
      )}
      {children}
    </svg>
  );
}

export const FloorPlanSvg = memo(FloorPlanSvgInner);
