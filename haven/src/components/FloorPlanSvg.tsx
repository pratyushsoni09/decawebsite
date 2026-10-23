import { memo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FOOTPRINT, STAIR, dimsOf, footprint, furniture, roomsOnFloor, type FloorId, type FurnitureDef } from "../data/houseLayout";
import { leaves, resolvedDoors, wallBoxes } from "../data/layoutGeometry";
import styles from "./FloorPlanSvg.module.css";

interface Props {
  floor: FloorId;
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
const VIEW = `${FOOTPRINT.x1 - PAD} ${FOOTPRINT.y1 - PAD} ${FOOTPRINT.x2 - FOOTPRINT.x1 + PAD * 2} ${FOOTPRINT.y2 - FOOTPRINT.y1 + PAD * 2 + 1.4}`;

const fmt = (n: number) => n.toFixed(2);
const SKIP: FurnitureDef["type"][] = ["art", "mirror", "pendant", "chandelier"];

function FurnitureMark({ it }: { it: FurnitureDef }) {
  const fp = footprint(it);
  if (it.type === "roundTable" || it.type === "plant" || it.type === "floorLamp") {
    return <circle cx={it.x} cy={it.y} r={(fp.x2 - fp.x1) / 2} className={styles.furn} />;
  }
  if (it.type === "rug") {
    return it.variant === "round"
      ? <circle cx={it.x} cy={it.y} r={it.w / 2} className={styles.rug} />
      : <rect x={fp.x1} y={fp.y1} width={fp.x2 - fp.x1} height={fp.y2 - fp.y1} className={styles.rug} />;
  }
  const rx = it.type === "bath" ? 0.3 : it.type === "sofa" || it.type === "loungeChair" || it.type === "readingChair" ? 0.12 : 0.03;
  return <rect x={fp.x1} y={fp.y1} width={fp.x2 - fp.x1} height={fp.y2 - fp.y1} rx={rx} className={styles.furn} />;
}

function Stair({ floor }: { floor: FloorId }) {
  const { flight1, flight2, yFoot, yLanding, yNorth, going } = STAIR;
  const treads: ReactNode[] = [];
  for (let i = 0; i <= 9; i++) {
    const y = yFoot - i * going;
    treads.push(<line key={`a${i}`} x1={flight1.x1} x2={flight1.x2} y1={y} y2={y} />);
    treads.push(<line key={`b${i}`} x1={flight2.x1} x2={flight2.x2} y1={y} y2={y} />);
  }
  return (
    <g className={styles.stair}>
      <rect x={flight1.x1} y={yNorth} width={flight2.x2 - flight1.x1} height={yLanding - yNorth} className={styles.stairLanding} />
      <rect x={flight1.x1} y={yLanding} width={flight1.x2 - flight1.x1} height={yFoot - yLanding} className={styles.stairFlight} />
      <rect x={flight2.x1} y={yLanding} width={flight2.x2 - flight2.x1} height={yFoot - yLanding} className={styles.stairFlight} />
      {treads}
      <line x1={(flight1.x2 + flight2.x1) / 2} x2={(flight1.x2 + flight2.x1) / 2} y1={yLanding} y2={yFoot} className={styles.stairRail} />
      {floor === 0 ? (
        <>
          <path d={`M ${(flight1.x1 + flight1.x2) / 2} ${yFoot - 0.15} V ${yLanding + 0.25}`} className={styles.stairArrow} markerEnd="url(#arrow)" />
          <text x={(flight1.x1 + flight1.x2) / 2} y={yFoot + 0.42} className={styles.stairText}>UP</text>
        </>
      ) : (
        <>
          <rect x={STAIR.void.x1} y={STAIR.void.y1} width={flight2.x1 - STAIR.void.x1} height={STAIR.void.y2 - STAIR.void.y1} className={styles.void} />
          <line x1={STAIR.void.x1} x2={flight2.x1} y1={STAIR.void.y2} y2={STAIR.void.y2} className={styles.guard} />
          <line x1={STAIR.void.x1} x2={STAIR.void.x1} y1={STAIR.void.y1} y2={STAIR.void.y2} className={styles.guard} />
          <line x1={STAIR.void.x2} x2={STAIR.void.x2} y1={STAIR.void.y1} y2={STAIR.void.y2} className={styles.guard} />
          <text x={(flight2.x1 + flight2.x2) / 2} y={yFoot + 0.42} className={styles.stairText}>DN</text>
        </>
      )}
    </g>
  );
}

function FloorPlanSvgInner({
  floor, variant = "light", interactive = false, highlight = null, labels = "full",
  showFurniture = true, className, title, children, onRoomEnter,
}: Props) {
  const plan = roomsOnFloor(floor);
  const walls = wallBoxes(floor);
  const floorLeaves = leaves.filter((l) => l.floor === floor);
  const items = showFurniture
    ? furniture.filter((it) => plan.some((rm) => rm.id === it.room) && !SKIP.includes(it.type))
    : [];
  const front = resolvedDoors.find((d) => d.id === "front")!;

  return (
    <svg
      viewBox={VIEW}
      className={`${styles.plan} ${styles[variant]} ${className ?? ""}`}
      role={interactive ? "group" : "img"}
      aria-label={title ?? `${floor === 0 ? "Ground" : "First"} floor plan`}
    >
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" className={styles.arrowHead} />
        </marker>
      </defs>

      {/* Room fills (links when interactive) */}
      {plan.map((rm) => {
        const active = highlight === rm.id;
        const body = rm.rects.map((rc, i) => (
          <rect key={i} x={rc.x1} y={rc.y1} width={rc.x2 - rc.x1} height={rc.y2 - rc.y1} className={styles.roomFill} />
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

      {showFurniture && <g className={styles.furnLayer} aria-hidden="true">{items.map((it) => <FurnitureMark key={it.id} it={it} />)}</g>}

      <Stair floor={floor} />

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
      </g>

      {/* Door swings */}
      <g aria-hidden="true" className={styles.doors}>
        {floorLeaves.map((l, i) => {
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
          {plan.map((rm) => {
            const m = rm.rects[0];
            const w = m.x2 - m.x1;
            const h = m.y2 - m.y1;
            const cx = (m.x1 + m.x2) / 2;
            let cy = (m.y1 + m.y2) / 2;
            if (rm.id === "stair-hall") cy = 7.6;
            if (rm.id === "landing") cy = 7.2;
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

      {floor === 0 && labels !== "none" && (
        <text x={front.at} y={FOOTPRINT.y2 + 0.95} className={styles.entrance} aria-hidden="true">
          Main entrance ↑
        </text>
      )}
      {children}
    </svg>
  );
}

export const FloorPlanSvg = memo(FloorPlanSvgInner);
