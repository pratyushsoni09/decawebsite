import * as THREE from "three";
import { SIGNS } from "./cityData";

/**
 * Procedural PBR materials. Every texture is painted onto a canvas at
 * start-up (no downloads) and mapped in metres: a texture's `size` is the
 * real-world span one repeat covers.
 */

type Paint = (ctx: CanvasRenderingContext2D, w: number, h: number, rnd: () => number) => void;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function canvasTexture(px: number, paint: Paint, seed: number, sizeM: [number, number], srgb = true, pxH = px) {
  const c = document.createElement("canvas");
  c.width = px;
  c.height = pxH;
  const ctx = c.getContext("2d")!;
  paint(ctx, px, pxH, rng(seed));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / sizeM[0], 1 / sizeM[1]);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const hsl = (h: number, s: number, l: number, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

function noise(ctx: CanvasRenderingContext2D, w: number, h: number, rnd: () => number, amount: number, count = 9000, size = 2) {
  for (let i = 0; i < count; i++) {
    const v = rnd() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${amount * rnd()})`;
    ctx.fillRect(rnd() * w, rnd() * h, size, size);
  }
}

function grain(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rnd: () => number, base: [number, number, number], vertical = false) {
  const [hh, ss, ll] = base;
  ctx.fillStyle = hsl(hh, ss, ll + (rnd() - 0.5) * 7);
  ctx.fillRect(x, y, w, h);
  const lines = Math.floor((vertical ? w : h) / 3);
  for (let i = 0; i < lines; i++) {
    ctx.strokeStyle = hsl(hh - 4, ss + 6, ll - 8 - rnd() * 10, 0.12 + rnd() * 0.18);
    ctx.lineWidth = 0.6 + rnd() * 1.2;
    ctx.beginPath();
    if (vertical) {
      const gx = x + rnd() * w;
      ctx.moveTo(gx, y);
      ctx.bezierCurveTo(gx + (rnd() - 0.5) * 6, y + h / 3, gx + (rnd() - 0.5) * 6, y + (2 * h) / 3, gx + (rnd() - 0.5) * 4, y + h);
    } else {
      const gy = y + rnd() * h;
      ctx.moveTo(x, gy);
      ctx.bezierCurveTo(x + w / 3, gy + (rnd() - 0.5) * 6, x + (2 * w) / 3, gy + (rnd() - 0.5) * 6, x + w, gy + (rnd() - 0.5) * 4);
    }
    ctx.stroke();
  }
}

const paintPlanks: Paint = (ctx, w, h, rnd) => {
  // 2 m × 2 m: planks 0.2 m wide (rows), lengths 0.8–2.0 m, staggered
  const rows = 10;
  const rh = h / rows;
  for (let r = 0; r < rows; r++) {
    let x = -rnd() * w * 0.5;
    while (x < w) {
      const len = w * (0.4 + rnd() * 0.6);
      grain(ctx, x, r * rh, len, rh, rnd, [32, 42, 63]);
      ctx.fillStyle = "rgba(60,40,20,0.35)";
      ctx.fillRect(x, r * rh, 1.5, rh);
      x += len;
    }
    ctx.fillStyle = "rgba(60,40,20,0.3)";
    ctx.fillRect(0, r * rh, w, 1.2);
  }
  noise(ctx, w, h, rnd, 0.04);
};

/** Chevron-laid oak: 4 columns × 12 courses tile seamlessly over HERRINGBONE_TILE metres. */
export const HERRINGBONE_TILE = 4 * 0.6 * Math.SQRT1_2;
const paintHerringbone: Paint = (ctx, w, h, rnd) => {
  ctx.fillStyle = hsl(31, 40, 59);
  ctx.fillRect(0, 0, w, h);
  const cols = 4;
  const colW = w / cols;
  const step = h / 12;
  for (let c = 0; c < cols; c++) {
    const x0 = c * colW;
    const dir = c % 2 === 0 ? 1 : -1;
    for (let r = -6; r < 16; r++) {
      const y0 = r * step;
      const yA = dir > 0 ? y0 : y0 + colW;
      const yB = dir > 0 ? y0 + colW : y0;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x0, yA);
      ctx.lineTo(x0 + colW, yB);
      ctx.lineTo(x0 + colW, yB + step);
      ctx.lineTo(x0, yA + step);
      ctx.closePath();
      ctx.clip();
      ctx.translate(x0, yA);
      ctx.rotate(dir * Math.PI / 4);
      grain(ctx, -4, -step, colW * 1.5 + 8, step * 2.2, rnd, [31, 40, 59]);
      ctx.restore();
      ctx.strokeStyle = "rgba(60,40,20,0.35)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x0, yA);
      ctx.lineTo(x0 + colW, yB);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(60,40,20,0.3)";
    ctx.fillRect(x0, 0, 1.2, h);
  }
  noise(ctx, w, h, rnd, 0.04);
};

/** Kudasan facades at 300-900 m: painted render, one window per 3 m bay with frame, dark glass and a sill shadow,
 *  a slab line at the top of each 3.1 m storey and weather streaks under the sills */
const paintFacade = (hue: number, sat: number, light: number): Paint => (ctx, w, h, rnd) => {
  ctx.fillStyle = hsl(hue, sat, light);
  ctx.fillRect(0, 0, w, h);
  noise(ctx, w, h, rnd, 0.05, 6000, 2);
  const storey = 3.1;
  const y = (m: number) => h * (1 - m / storey); // canvas y runs down; v = 0 is the storey floor
  // weather streaks
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = hsl(hue, sat - 10, light - 16, 0.08 + rnd() * 0.1);
    const sx = rnd() * w;
    ctx.fillRect(sx, 0, 2 + rnd() * 5, h);
  }
  ctx.fillStyle = hsl(hue, sat, light - 14, 0.55);
  ctx.fillRect(0, y(storey), w, y(storey - 0.2) - y(storey));
  // window: frame, glass with a sky gradient, a lit curtain in some, sill with its shadow
  const x0 = w * 0.3, x1 = w * 0.7;
  ctx.fillStyle = "rgba(240,238,232,0.95)";
  ctx.fillRect(x0 - 4, y(2.3) - 4, x1 - x0 + 8, y(0.95) - y(2.3) + 8);
  const g = ctx.createLinearGradient(0, y(2.3), 0, y(0.95));
  g.addColorStop(0, "rgba(96,122,146,0.95)");
  g.addColorStop(0.5, "rgba(38,48,60,0.95)");
  g.addColorStop(1, "rgba(22,28,36,0.95)");
  ctx.fillStyle = g;
  ctx.fillRect(x0, y(2.3), x1 - x0, y(0.95) - y(2.3));
  if (rnd() < 0.35) {
    ctx.fillStyle = hsl(36 + rnd() * 20, 40, 78, 0.85);
    ctx.fillRect(x0 + 2, y(2.3) + 2, (x1 - x0) * 0.45, y(0.95) - y(2.3) - 4);
  }
  ctx.fillStyle = "rgba(240,238,232,0.9)";
  ctx.fillRect(x0 + (x1 - x0) / 2 - 1.5, y(2.3), 3, y(0.95) - y(2.3));
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(x0 - 6, y(0.95), x1 - x0 + 12, 4);
  ctx.fillStyle = hsl(hue, sat, light - 22, 0.25);
  ctx.fillRect(x0 - 2, y(0.95) + 4, x1 - x0 + 4, y(0.4) - y(0.95));
};

/** weathered exterior emulsion: a plain field with stains, hairline cracks and rain streaks (tinted per building) */
const paintWall: Paint = (ctx, w, h, rnd) => {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = `rgba(90,80,60,${0.03 + rnd() * 0.07})`;
    ctx.beginPath();
    ctx.ellipse(rnd() * w, rnd() * h, 10 + rnd() * 60, 6 + rnd() * 30, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 10; i++) {
    const sx = rnd() * w;
    ctx.fillStyle = `rgba(70,65,55,${0.04 + rnd() * 0.08})`;
    ctx.fillRect(sx, rnd() * h * 0.3, 1.5 + rnd() * 4, h);
  }
  noise(ctx, w, h, rnd, 0.06, 7000, 2);
};

/** a cluster of foliage for a crossed-card canopy: leaves in two greens with a dark heart, clear around the edge */
const paintLeafCard = (hue: number, sat: number): Paint => (ctx, w, h, rnd) => {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  // five or six lobes of leaves around the centre, each a loose cloud of small leaf shapes
  const lobes = 5 + Math.floor(rnd() * 2);
  for (let l = 0; l < lobes + 1; l++) {
    const la = (l / lobes) * Math.PI * 2 + rnd();
    const lr = l === lobes ? 0 : w * (0.16 + rnd() * 0.14);
    const lx = cx + Math.cos(la) * lr, ly = cy + Math.sin(la) * lr * 0.85;
    const size = w * (0.12 + rnd() * 0.08);
    for (let i = 0; i < 70; i++) {
      const a = rnd() * Math.PI * 2;
      const r = Math.pow(rnd(), 0.7) * size;
      const x = lx + Math.cos(a) * r, y = ly + Math.sin(a) * r;
      const edge = Math.hypot(x - cx, y - cy) / (w * 0.46);
      ctx.fillStyle = hsl(hue + (rnd() - 0.5) * 20, sat + (rnd() - 0.5) * 16, 15 + edge * 16 + rnd() * 10, 0.97);
      ctx.beginPath();
      ctx.ellipse(x, y, 4 + rnd() * 7, 2.5 + rnd() * 4, rnd() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // sky showing through
  ctx.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2;
    const r = w * (0.08 + rnd() * 0.34);
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9, 3 + rnd() * 9, 2 + rnd() * 6, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  // a few sunlit leaves on top
  for (let i = 0; i < 40; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.pow(rnd(), 0.6) * w * 0.4;
    ctx.fillStyle = hsl(hue + 8, sat, 38 + rnd() * 10, 0.9);
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9, 4 + rnd() * 6, 2.5 + rnd() * 3, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
};

/** one palm frond, drawn along u: a rib with leaflets either side, clear elsewhere */
const paintFrond: Paint = (ctx, w, h, rnd) => {
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = hsl(80, 30, 30);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
  for (let x = 8; x < w; x += 6) {
    const len = (h / 2) * (0.35 + 0.65 * Math.sin((x / w) * Math.PI)) * (0.8 + rnd() * 0.3);
    for (const side of [-1, 1]) {
      ctx.strokeStyle = hsl(84 + rnd() * 16, 36, 28 + rnd() * 14);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, h / 2);
      ctx.lineTo(x + 10, h / 2 + side * len);
      ctx.stroke();
    }
  }
};

const paintFarm: Paint = (ctx, w, h, rnd) => {
  // 24 m tile of ploughed fields: furrows in dark soil, some strips greened by a standing crop
  ctx.fillStyle = hsl(32, 30, 34);
  ctx.fillRect(0, 0, w, h);
  const strips = 6;
  for (let i = 0; i < strips; i++) {
    const green = rnd() < 0.45;
    ctx.fillStyle = green ? hsl(78 + rnd() * 20, 30, 30 + rnd() * 10) : hsl(30 + rnd() * 8, 28, 30 + rnd() * 12);
    ctx.fillRect(0, (i * h) / strips, w, h / strips);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let y = (i * h) / strips; y < ((i + 1) * h) / strips; y += 5) ctx.fillRect(0, y, w, 1.5);
  }
  noise(ctx, w, h, rnd, 0.08, 9000, 1.5);
};

const paintScrub: Paint = (ctx, w, h, rnd) => {
  // dry season Gandhinagar: straw grass with bare earth showing and patches of darker scrub
  ctx.fillStyle = hsl(46, 26, 52);
  ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 120; k++) {
    ctx.fillStyle = rnd() < 0.5 ? hsl(70 + rnd() * 20, 22, 30 + rnd() * 10, 0.5) : hsl(38 + rnd() * 10, 26, 44 + rnd() * 14, 0.45);
    ctx.beginPath();
    ctx.ellipse(rnd() * w, rnd() * h, 6 + rnd() * 40, 4 + rnd() * 24, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  noise(ctx, w, h, rnd, 0.1, 14000, 1.5);
};

const paintDirt: Paint = (ctx, w, h, rnd) => {
  ctx.fillStyle = hsl(34, 24, 50);
  ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 60; k++) {
    ctx.fillStyle = hsl(30 + rnd() * 10, 20, 38 + rnd() * 20, 0.4);
    ctx.beginPath();
    ctx.ellipse(rnd() * w, rnd() * h, 10 + rnd() * 50, 6 + rnd() * 30, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  noise(ctx, w, h, rnd, 0.12, 12000, 1.5);
};

const paintAwning: Paint = (ctx, w, h, rnd) => {
  const hue = rnd() * 360;
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? "#f3efe6" : hsl(hue, 55, 42);
    ctx.fillRect((i * w) / 8, 0, w / 8, h);
  }
};

const SIGN_COLS = 8;
const SIGN_ROWS = 16;
/** every shop sign of the neighbourhood in one atlas: a coloured board with the name in bold, 256 × 64 px each */
const paintSigns: Paint = (ctx, w, h, rnd) => {
  const cw = w / SIGN_COLS, ch = h / SIGN_ROWS;
  const palette: [string, string][] = [["#c8102e", "#fff"], ["#0b3d91", "#fff"], ["#f2c200", "#1a1a1a"], ["#1b7f3b", "#fff"],
    ["#f5f1e8", "#1a1a1a"], ["#e8641b", "#fff"], ["#4b2a84", "#fff"], ["#111111", "#f2c200"], ["#0e8a9e", "#fff"]];
  for (let i = 0; i < SIGN_COLS * SIGN_ROWS; i++) {
    const x = (i % SIGN_COLS) * cw, y = Math.floor(i / SIGN_COLS) * ch;
    const [bg, fg] = palette[Math.floor(rnd() * palette.length)];
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, cw, ch);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(x, y + ch - 3, cw, 3);
    const name = SIGNS[i] ?? "";
    if (!name) continue;
    ctx.fillStyle = fg;
    let size = 30;
    ctx.font = `bold ${size}px Arial, Helvetica, sans-serif`;
    while (ctx.measureText(name).width > cw - 20 && size > 12) {
      size -= 2;
      ctx.font = `bold ${size}px Arial, Helvetica, sans-serif`;
    }
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(name, x + cw / 2, y + ch / 2 + 1);
  }
};
/** uv rectangle [u0, v0, u1, v1] of sign i in the atlas (v up) */
export function signUV(i: number): [number, number, number, number] {
  const c = i % SIGN_COLS, r = Math.floor(i / SIGN_COLS);
  return [c / SIGN_COLS, 1 - (r + 1) / SIGN_ROWS, (c + 1) / SIGN_COLS, 1 - r / SIGN_ROWS];
}

const paintAsphalt: Paint = (ctx, w, h, rnd) => {
  ctx.fillStyle = hsl(30, 4, 30);
  ctx.fillRect(0, 0, w, h);
  noise(ctx, w, h, rnd, 0.12, 16000, 1.5);
};

const paintGround: Paint = (ctx, w, h, rnd) => {
  // the grain of the ground only; its tones come from the disc's vertex colours
  ctx.fillStyle = hsl(44, 14, 74);
  ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 160; k++) {
    const roll = rnd();
    ctx.fillStyle = roll < 0.4 ? hsl(66 + rnd() * 24, 14, 60 + rnd() * 12, 0.4)
      : roll < 0.7 ? hsl(50 + rnd() * 14, 16, 68 + rnd() * 12, 0.4)
      : hsl(34 + rnd() * 12, 16, 76 + rnd() * 12, 0.4);
    ctx.beginPath();
    ctx.ellipse(rnd() * w, rnd() * h, 24 + rnd() * 160, 14 + rnd() * 90, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  // tracks and field edges
  for (let k = 0; k < 10; k++) {
    ctx.strokeStyle = hsl(40, 20, 64, 0.35);
    ctx.lineWidth = 2 + rnd() * 3;
    ctx.beginPath();
    ctx.moveTo(rnd() * w, rnd() * h);
    ctx.lineTo(rnd() * w, rnd() * h);
    ctx.stroke();
  }
  noise(ctx, w, h, rnd, 0.1, 16000, 1.5);
};

/** the ground of the built-up plots: trodden dust and gravel in beige and grey, darker where it is paved */
const paintUrban: Paint = (ctx, w, h, rnd) => {
  ctx.fillStyle = hsl(38, 16, 60);
  ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 120; k++) {
    ctx.fillStyle = rnd() < 0.5 ? hsl(34 + rnd() * 10, 12 + rnd() * 10, 50 + rnd() * 18, 0.5) : hsl(40, 6, 44 + rnd() * 16, 0.45);
    ctx.beginPath();
    ctx.ellipse(rnd() * w, rnd() * h, 14 + rnd() * 90, 10 + rnd() * 60, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let k = 0; k < 30; k++) {
    ctx.fillStyle = hsl(90 + rnd() * 20, 18, 34 + rnd() * 10, 0.4);
    ctx.beginPath();
    ctx.ellipse(rnd() * w, rnd() * h, 6 + rnd() * 24, 4 + rnd() * 16, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  noise(ctx, w, h, rnd, 0.12, 16000, 1.5);
};

const paintStone: Paint = (ctx, w, h, rnd) => {
  // 1.6 m tile, 0.8 m limestone flags
  const n = 2;
  const s = w / n;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      ctx.fillStyle = hsl(38, 18, 82 + (rnd() - 0.5) * 5);
      ctx.fillRect(i * s, j * s, s, s);
      for (let k = 0; k < 40; k++) {
        ctx.fillStyle = hsl(36, 15, 70 + rnd() * 15, 0.15);
        ctx.beginPath();
        ctx.arc(i * s + rnd() * s, j * s + rnd() * s, 2 + rnd() * 14, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(90,75,60,0.45)";
      ctx.lineWidth = 2;
      ctx.strokeRect(i * s, j * s, s, s);
    }
  noise(ctx, w, h, rnd, 0.06, 20000, 1.5);
};

const paintMarble: Paint = (ctx, w, h, rnd) => {
  ctx.fillStyle = hsl(40, 20, 93);
  ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 18; k++) {
    ctx.strokeStyle = hsl(30, 8, 55 + rnd() * 25, 0.15 + rnd() * 0.35);
    ctx.lineWidth = 0.6 + rnd() * 2.2;
    ctx.beginPath();
    let x = rnd() * w;
    let y = 0;
    ctx.moveTo(x, y);
    while (y < h) {
      x += (rnd() - 0.45) * 60;
      y += 20 + rnd() * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  noise(ctx, w, h, rnd, 0.03);
};

const paintTile: Paint = (ctx, w, h, rnd) => {
  const n = 8;
  const s = w / n;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      ctx.fillStyle = hsl(35, 10, 84 + (rnd() - 0.5) * 4);
      ctx.fillRect(i * s, j * s, s, s);
    }
  ctx.strokeStyle = "rgba(120,110,100,0.5)";
  ctx.lineWidth = 2;
  for (let i = 0; i <= n; i++) {
    ctx.beginPath(); ctx.moveTo(i * s, 0); ctx.lineTo(i * s, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * s); ctx.lineTo(w, i * s); ctx.stroke();
  }
};

const paintPlaster: Paint = (ctx, w, h, rnd) => {
  ctx.fillStyle = hsl(40, 30, 92);
  ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 220; k++) {
    ctx.fillStyle = hsl(38, 25, 85 + rnd() * 12, 0.08);
    ctx.beginPath();
    ctx.arc(rnd() * w, rnd() * h, 10 + rnd() * 50, 0, Math.PI * 2);
    ctx.fill();
  }
  noise(ctx, w, h, rnd, 0.035, 14000, 1.5);
};

const paintWalnut: Paint = (ctx, w, h, rnd) => {
  for (let i = 0; i < 4; i++) grain(ctx, 0, (i * h) / 4, w, h / 4, rnd, [22, 32, 28]);
  noise(ctx, w, h, rnd, 0.04);
};

const paintOakVertical: Paint = (ctx, w, h, rnd) => {
  for (let i = 0; i < 6; i++) grain(ctx, (i * w) / 6, 0, w / 6, h, rnd, [30, 40, 52], true);
  noise(ctx, w, h, rnd, 0.04);
};

const paintFabric = (hue: number, sat: number, light: number): Paint => (ctx, w, h, rnd) => {
  ctx.fillStyle = hsl(hue, sat, light);
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 2) {
    ctx.fillStyle = `rgba(0,0,0,${0.03 + rnd() * 0.03})`;
    ctx.fillRect(0, y, w, 1);
  }
  for (let x = 0; x < w; x += 2) {
    ctx.fillStyle = `rgba(255,255,255,${0.02 + rnd() * 0.03})`;
    ctx.fillRect(x, 0, 1, h);
  }
};

const paintLeather: Paint = (ctx, w, h, rnd) => {
  ctx.fillStyle = hsl(24, 52, 36);
  ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 500; k++) {
    ctx.fillStyle = hsl(22, 50, 26 + rnd() * 18, 0.12);
    ctx.beginPath();
    ctx.arc(rnd() * w, rnd() * h, 3 + rnd() * 22, 0, Math.PI * 2);
    ctx.fill();
  }
  noise(ctx, w, h, rnd, 0.06);
};

const paintGrass: Paint = (ctx, w, h, rnd) => {
  ctx.fillStyle = hsl(78, 20, 33);
  ctx.fillRect(0, 0, w, h);
  for (let k = 0; k < 26000; k++) {
    ctx.fillStyle = hsl(62 + rnd() * 30, 14 + rnd() * 16, 24 + rnd() * 20, 0.5);
    ctx.fillRect(rnd() * w, rnd() * h, 1.5, 3 + rnd() * 3);
  }
};

const paintRug = (hue: number, sat: number, light: number, border: string): Paint => (ctx, w, h, rnd) => {
  paintFabric(hue, sat, light)(ctx, w, h, rnd);
  ctx.strokeStyle = border;
  ctx.lineWidth = w * 0.025;
  ctx.strokeRect(w * 0.06, h * 0.06, w * 0.88, h * 0.88);
  ctx.lineWidth = w * 0.006;
  ctx.strokeRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
};

const paintRattan: Paint = (ctx, w, h, rnd) => {
  ctx.fillStyle = hsl(34, 40, 62);
  ctx.fillRect(0, 0, w, h);
  const n = 8;
  const s = w / n;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const horiz = (i + j) % 2 === 0;
      ctx.fillStyle = hsl(32, 38, 52 + rnd() * 10);
      if (horiz) ctx.fillRect(i * s + 1, j * s + s * 0.2, s - 2, s * 0.6);
      else ctx.fillRect(i * s + s * 0.2, j * s + 1, s * 0.6, s - 2);
      ctx.strokeStyle = "rgba(70,45,25,0.45)";
      ctx.strokeRect(i * s + 0.5, j * s + 0.5, s - 1, s - 1);
    }
  noise(ctx, w, h, rnd, 0.05);
};

const BOOK_COLOURS = [
  [24, 40, 32], [176, 18, 30], [37, 38, 50], [10, 35, 35], [40, 30, 80], [200, 15, 30], [30, 25, 60], [0, 0, 18], [140, 15, 35], [35, 45, 70],
];
const paintBooks: Paint = (ctx, w, h, rnd) => {
  // 2 m of shelf, 0.32 m tall row of spines
  ctx.fillStyle = "#2a1f19";
  ctx.fillRect(0, 0, w, h);
  let x = 0;
  while (x < w) {
    const bw = 8 + rnd() * 18;
    const bh = h * (0.68 + rnd() * 0.3);
    if (rnd() < 0.06) { x += bw * 2; continue; }
    const [hh, ss, ll] = BOOK_COLOURS[Math.floor(rnd() * BOOK_COLOURS.length)];
    ctx.fillStyle = hsl(hh, ss, ll + (rnd() - 0.5) * 10);
    ctx.fillRect(x, h - bh, bw - 1, bh);
    ctx.fillStyle = "rgba(220,190,120,0.55)";
    if (rnd() > 0.4) ctx.fillRect(x + 2, h - bh + bh * 0.15, bw - 5, 2);
    if (rnd() > 0.5) ctx.fillRect(x + 2, h - bh * 0.25, bw - 5, 1.5);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(x + bw - 2, h - bh, 1, bh);
    x += bw;
  }
};

const ART_PALETTES = [
  ["#efe6d6", "#b88a52", "#3c5b59", "#2c221c"],
  ["#e9dfcd", "#c46a3c", "#d8b77a", "#4c3a2f"],
  ["#d9d4c7", "#5d7a74", "#a9b8ad", "#2f3b39"],
  ["#f1ebe0", "#8a5a3c", "#d6c3a5", "#1f1a17"],
  ["#2b2420", "#b48a4f", "#e9dfcc", "#6d8580"],
  ["#e5ddd0", "#9a7a5a", "#596f6a", "#c9a46c"],
];
function paintArt(i: number): Paint {
  return (ctx, w, h, rnd) => {
    const p = ART_PALETTES[i % ART_PALETTES.length];
    ctx.fillStyle = p[0];
    ctx.fillRect(0, 0, w, h);
    const kind = i % 3;
    if (kind === 0) {
      // arches
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = p[1 + k];
        const aw = w * (0.18 + rnd() * 0.12);
        const ax = w * (0.15 + k * 0.27);
        const ay = h * (0.35 + rnd() * 0.2);
        ctx.beginPath();
        ctx.moveTo(ax, h * 0.85);
        ctx.lineTo(ax, ay);
        ctx.arc(ax + aw / 2, ay, aw / 2, Math.PI, 0);
        ctx.lineTo(ax + aw, h * 0.85);
        ctx.fill();
      }
    } else if (kind === 1) {
      // sun and horizon
      ctx.fillStyle = p[2];
      ctx.fillRect(0, h * 0.62, w, h * 0.38);
      ctx.fillStyle = p[1];
      ctx.beginPath();
      ctx.arc(w * (0.35 + rnd() * 0.3), h * 0.45, w * 0.17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p[3];
      ctx.fillRect(0, h * 0.78, w, h * 0.03);
    } else {
      // gestural strokes
      for (let k = 0; k < 7; k++) {
        ctx.strokeStyle = p[1 + (k % 3)];
        ctx.lineWidth = w * (0.02 + rnd() * 0.06);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(rnd() * w, rnd() * h);
        ctx.quadraticCurveTo(rnd() * w, rnd() * h, rnd() * w, rnd() * h);
        ctx.stroke();
      }
    }
    noise(ctx, w, h, rnd, 0.05);
  };
}

export type MatKey =
  | "plaster" | "ceiling" | "oak" | "herringbone" | "stone" | "marble" | "tile" | "walnut" | "oakWood"
  | "oakVertical" | "leather" | "cream" | "linen" | "teal" | "brass" | "bronze" | "glass" | "porcelain"
  | "darkMetal" | "rug" | "rugTeal" | "rugSand" | "books" | "leaf" | "olive" | "pot" | "glow" | "shade"
  | "bedLinen" | "duvet" | "grass" | "pathStone" | "boxwood" | "terrace" | "stoneTrim" | "mirror"
  | "darkGlass" | "water" | "bark" | "art0" | "art1" | "art2" | "art3" | "art4" | "art5" | "white"
  | "upholstery" | "teak" | "rattan" | "curtain" | "curtainLit" | "concrete" | "towerGlass" | "liftDoor" | "greige"
  | "darkPlank" | "polished" | "driftwood" | "tan" | "blackLeather" | "pinkLeather" | "mustard" | "maroon"
  | "terracotta" | "orangePaint" | "charcoal" | "rugGrey" | "rugRose" | "glowWarm" | "carpet" | "veneer"
  | "ground" | "park" | "asphalt" | "roadLine" | "facadeA" | "facadeB" | "facadeC" | "facadeD" | "roofGrey" | "parapet" | "tank"
  | "wallCream" | "wallBeige" | "wallOchre" | "wallGrey" | "wallWhite" | "wallRose" | "farBlock" | "farBlockB" | "farBlockC"
  | "windowGlass" | "windowFrame" | "balconyRail" | "acUnit" | "shopSign" | "shopGlass" | "awning" | "compoundWall"
  | "kerb" | "paver" | "divider" | "streetLight" | "bridgeConcrete" | "river" | "lake" | "leafCard" | "leafCardB" | "palmFrond"
  | "farm" | "scrub" | "dirt" | "pitch" | "urban" | "carWhite" | "carSilver" | "carGrey" | "carRed" | "carBlue" | "carBlack"
  | "carYellow" | "carOrange" | "carGlass" | "tyre" | "carPaint";

/** the body colour of a car, chosen by its number; the keys the exporter writes one material per */
export const CAR_COLOURS: MatKey[] = ["carWhite", "carWhite", "carWhite", "carSilver", "carSilver", "carGrey", "carRed", "carBlue", "carBlack", "carBlack"];

export type MaterialLib = Record<MatKey, THREE.MeshStandardMaterial>;

export function createMaterials(onStep?: (name: string) => void): MaterialLib {
  const tx = (name: string, px: number, paint: Paint, seed: number, size: [number, number], pxH?: number) => {
    const t = canvasTexture(px, paint, seed, size, true, pxH);
    onStep?.(name);
    return t;
  };
  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);

  const plasterMap = tx("plaster", 512, paintPlaster, 3, [3, 3]);
  const wallMap = tx("weathered wall", 512, paintWall, 5, [6, 6]);
  const lib: Partial<MaterialLib> = {
    plaster: std({ map: plasterMap, roughness: 0.92, color: 0xf7f0e4 }),  // warm ivory emulsion, as in the Blender scene
    ceiling: std({ map: plasterMap, roughness: 0.95, color: 0xfbf8f2 }),
    white: std({ color: 0xf4f0e8, roughness: 0.6 }),
    oak: std({ map: tx("oak floor", 1024, paintPlanks, 7, [2, 2]), roughness: 0.55, metalness: 0 }),
    herringbone: std({ map: tx("herringbone", 1024, paintHerringbone, 11, [HERRINGBONE_TILE, HERRINGBONE_TILE]), roughness: 0.5 }),
    stone: std({ map: tx("stone", 1024, paintStone, 13, [1.6, 1.6]), roughness: 0.62 }),
    marble: std({ map: tx("marble", 1024, paintMarble, 17, [1.4, 1.4]), roughness: 0.18 }),
    tile: std({ map: tx("tile", 512, paintTile, 19, [1.2, 1.2]), roughness: 0.4 }),
    walnut: std({ map: tx("walnut", 512, paintWalnut, 23, [1.2, 1.2]), roughness: 0.48 }),
    oakWood: std({ map: tx("oak", 512, paintPlanks, 29, [1.5, 1.5]), roughness: 0.5, color: 0xf2e6d6 }),
    oakVertical: std({ map: tx("oak cladding", 512, paintOakVertical, 31, [0.6, 2.4]), roughness: 0.62 }),
    leather: std({ map: tx("leather", 512, paintLeather, 37, [0.8, 0.8]), roughness: 0.45 }),
    cream: std({ map: tx("bouclé", 256, paintFabric(40, 30, 86), 41, [0.3, 0.3]), roughness: 0.95 }),
    linen: std({ map: tx("linen", 256, paintFabric(35, 18, 72), 43, [0.3, 0.3]), roughness: 0.95 }),
    teal: std({ map: tx("teal", 256, paintFabric(176, 22, 36), 47, [0.3, 0.3]), roughness: 0.9 }),
    upholstery: std({ map: tx("upholstery", 256, paintFabric(32, 22, 64), 49, [0.3, 0.3]), roughness: 0.92 }),
    bedLinen: std({ color: 0xf6f2ea, roughness: 0.9 }),
    duvet: std({ map: tx("duvet", 256, paintFabric(36, 20, 80), 53, [0.4, 0.4]), roughness: 0.95 }),
    rug: std({ map: tx("rug", 512, paintRug(36, 25, 78, "rgba(140,105,70,0.6)"), 59, [3, 3]), roughness: 1 }),
    rugTeal: std({ map: tx("rug teal", 512, paintRug(176, 14, 52, "rgba(230,220,200,0.6)"), 61, [3, 3]), roughness: 1 }),
    rugSand: std({ map: tx("rug sand", 512, paintRug(30, 30, 66, "rgba(60,45,35,0.5)"), 67, [3, 3]), roughness: 1 }),
    books: std({ map: tx("books", 1024, paintBooks, 71, [2, 0.34], 192), roughness: 0.8 }),
    brass: std({ color: 0xc9a467, metalness: 1, roughness: 0.32 }),
    bronze: std({ color: 0x4a3b2e, metalness: 0.85, roughness: 0.45 }),
    darkMetal: std({ color: 0x2a2522, metalness: 0.7, roughness: 0.5 }),
    mirror: std({ color: 0xe8e6e0, metalness: 1, roughness: 0.04 }),
    porcelain: std({ color: 0xfbfaf7, roughness: 0.18 }),
    greige: std({ color: 0x8a8278, roughness: 0.55 }),
    // restyle palette, after the client's concept images
    darkPlank: std({ map: tx("dark oak floor", 1024, paintPlanks, 71, [2, 2]), roughness: 0.5, color: 0x8a6448 }),
    polished: std({ color: 0x2a292b, roughness: 0.12, metalness: 0.1 }),
    driftwood: std({ map: tx("driftwood", 512, paintPlanks, 75, [1.4, 1.4]), roughness: 0.6, color: 0xa8968a }),
    tan: std({ map: tx("tan", 256, paintFabric(24, 38, 52), 77, [0.3, 0.3]), roughness: 0.92 }),
    blackLeather: std({ color: 0x1e1d1f, roughness: 0.5 }),
    pinkLeather: std({ color: 0xdba29a, roughness: 0.42 }),
    mustard: std({ map: tx("mustard", 256, paintFabric(40, 70, 52), 79, [0.4, 0.4]), roughness: 0.9 }),
    maroon: std({ map: tx("maroon", 256, paintFabric(352, 32, 30), 81, [0.3, 0.3]), roughness: 0.95 }),
    terracotta: std({ color: 0xc66f4c, roughness: 0.9 }),
    orangePaint: std({ color: 0xee8a4e, roughness: 0.85 }),
    charcoal: std({ color: 0x2c2b2d, roughness: 0.8 }),
    rugGrey: std({ map: tx("grey rug", 256, paintFabric(30, 4, 66), 85, [0.5, 0.5]), roughness: 1 }),
    rugRose: std({ map: tx("rose rug", 256, paintFabric(350, 34, 48), 87, [0.5, 0.5]), roughness: 1 }),
    carpet: std({ map: tx("carpet tiles", 256, paintFabric(34, 16, 70), 91, [0.5, 0.5]), roughness: 1 }),
    veneer: std({ map: tx("veneer", 512, paintOakVertical, 93, [0.6, 2.4]), roughness: 0.55, color: 0xd7a27a }),
    // Kudasan surroundings
    ground: std({ map: tx("ground", 512, paintGround, 95, [110, 110]), roughness: 1, vertexColors: true, polygonOffset: true, polygonOffsetFactor: 3, polygonOffsetUnits: 6 }),
    park: std({ map: tx("park", 512, paintGrass, 96, [6, 6]), roughness: 1, color: 0x9fb37a }),
    asphalt: std({ map: tx("asphalt", 256, paintAsphalt, 97, [4, 4]), roughness: 0.95 }),
    roadLine: std({ color: 0xe8e2d0, roughness: 0.8 }),
    // the paint of Kudasan's apartment blocks: cream, ochre, peach and a weathered grey-white
    facadeA: std({ map: tx("facade cream", 256, paintFacade(42, 32, 86), 98, [3, 3.1], 265), roughness: 0.85 }),
    facadeB: std({ map: tx("facade ochre", 256, paintFacade(34, 48, 66), 99, [3, 3.1], 265), roughness: 0.85 }),
    facadeC: std({ map: tx("facade peach", 256, paintFacade(24, 38, 78), 101, [3, 3.1], 265), roughness: 0.85 }),
    facadeD: std({ map: tx("facade grey", 256, paintFacade(40, 8, 74), 102, [3, 3.1], 265), roughness: 0.85 }),
    roofGrey: std({ color: 0x8c8780, roughness: 0.95 }),
    parapet: std({ color: 0xd9d2c4, roughness: 0.9 }),
    tank: std({ color: 0x14151a, roughness: 0.6 }),
    // the near ring: plain weathered walls with real windows and balconies built on them
    wallCream: std({ map: wallMap, color: 0xf0e6d2, roughness: 0.9 }),
    wallBeige: std({ map: wallMap, color: 0xdcc9a8, roughness: 0.9 }),
    wallOchre: std({ map: wallMap, color: 0xc99a5e, roughness: 0.9 }),
    wallGrey: std({ map: wallMap, color: 0xc9c4ba, roughness: 0.9 }),
    wallWhite: std({ map: wallMap, color: 0xf6f3ec, roughness: 0.88 }),
    wallRose: std({ map: wallMap, color: 0xd9a98f, roughness: 0.9 }),
    farBlock: std({ color: 0xbfb8ab, roughness: 0.95 }),
    farBlockB: std({ color: 0xa9a297, roughness: 0.95 }),
    farBlockC: std({ color: 0xcec7ba, roughness: 0.95 }),
    urban: std({ map: tx("plots", 512, paintUrban, 113, [60, 60]), roughness: 1, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4 }),
    windowGlass: std({ color: 0x33444f, metalness: 0.55, roughness: 0.1 }),
    windowFrame: std({ color: 0xe9e5dc, roughness: 0.6 }),
    balconyRail: std({ color: 0x3a3a3c, metalness: 0.6, roughness: 0.45 }),
    acUnit: std({ color: 0xd6d6d0, roughness: 0.7 }),
    shopSign: std({ map: tx("shop signs", 2048, paintSigns, 103, [1, 1], 1024), roughness: 0.6 }),
    shopGlass: std({ color: 0x1c242c, metalness: 0.4, roughness: 0.12 }),
    awning: std({ map: tx("awning", 256, paintAwning, 104, [3, 1], 64), roughness: 0.9, side: THREE.DoubleSide }),
    compoundWall: std({ map: wallMap, color: 0xc6bdae, roughness: 0.92 }),
    kerb: std({ color: 0xb9b5ac, roughness: 0.9 }),
    paver: std({ map: tx("pavers", 256, paintStone, 105, [1.6, 1.6]), color: 0xb8ada0, roughness: 0.9 }),
    divider: std({ color: 0x3e6a33, roughness: 0.95 }),
    streetLight: std({ color: 0x6c6c6a, metalness: 0.6, roughness: 0.5 }),
    bridgeConcrete: std({ color: 0xa9a49b, roughness: 0.9 }),
    river: std({ color: 0x5c7a80, metalness: 0.25, roughness: 0.08 }),
    lake: std({ color: 0x4f6e6c, metalness: 0.25, roughness: 0.08 }),
    leafCard: std({ map: tx("neem canopy", 256, paintLeafCard(104, 38), 106, [1, 1]), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 }),
    leafCardB: std({ map: tx("gulmohar canopy", 256, paintLeafCard(80, 42), 107, [1, 1]), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 }),
    palmFrond: std({ map: tx("palm frond", 256, paintFrond, 108, [1, 1], 64), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 }),
    farm: std({ map: tx("fields", 512, paintFarm, 109, [24, 24]), roughness: 1 }),
    scrub: std({ map: tx("scrub", 512, paintScrub, 110, [40, 40]), roughness: 1 }),
    dirt: std({ map: tx("bare earth", 512, paintDirt, 111, [30, 30]), roughness: 1 }),
    pitch: std({ map: tx("pitch", 512, paintGrass, 112, [6, 6]), roughness: 1, color: 0x8fb46a }),
    carWhite: std({ color: 0xf2f2ee, roughness: 0.25, metalness: 0.1 }),
    carSilver: std({ color: 0xb9bcc0, roughness: 0.22, metalness: 0.5 }),
    carGrey: std({ color: 0x5a5d62, roughness: 0.25, metalness: 0.4 }),
    carRed: std({ color: 0xa8201a, roughness: 0.25, metalness: 0.15 }),
    carBlue: std({ color: 0x1f3a6e, roughness: 0.25, metalness: 0.2 }),
    carBlack: std({ color: 0x15161a, roughness: 0.2, metalness: 0.3 }),
    carYellow: std({ color: 0xe0b020, roughness: 0.4 }),
    carOrange: std({ color: 0xd9601e, roughness: 0.4 }),
    carGlass: std({ color: 0x1a2229, metalness: 0.5, roughness: 0.1 }),
    tyre: std({ color: 0x151515, roughness: 0.9 }),
    // the moving traffic of the tour: one instanced mesh, body colour per instance over vertex colours
    carPaint: std({ color: 0xffffff, roughness: 0.3, metalness: 0.2, vertexColors: true }),
    glowWarm: std({ color: 0xffe3a6, emissive: 0xffc95e, emissiveIntensity: 1.1, roughness: 0.9 }),
    glass: std({ color: 0xcfe0e4, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }),
    darkGlass: std({ color: 0x15130f, metalness: 0.4, roughness: 0.15 }),
    water: std({ color: 0xdfe9ea, roughness: 0.05, metalness: 0.1 }),
    leaf: std({ color: 0x4f6b3a, roughness: 0.85, flatShading: true }),
    olive: std({ color: 0x7d8b67, roughness: 0.9, flatShading: true }),
    bark: std({ color: 0x5a4636, roughness: 0.95 }),
    pot: std({ color: 0xcdbfa8, roughness: 0.85 }),
    glow: std({ color: 0xfff0d6, emissive: 0xffd9a0, emissiveIntensity: 2.4, roughness: 1 }),
    shade: std({ color: 0xf5ecdc, emissive: 0xffc98a, emissiveIntensity: 0.55, roughness: 1, side: THREE.DoubleSide }),
    grass: std({ map: tx("lawn", 512, paintGrass, 73, [6, 6]), roughness: 1 }),
    pathStone: std({ color: 0xc9bfae, roughness: 0.85 }),
    terrace: std({ map: tx("terrace", 512, paintStone, 79, [2.4, 2.4]), roughness: 0.75, color: 0xeee6d8 }),
    stoneTrim: std({ map: tx("stone trim", 512, paintStone, 83, [1.6, 1.6]), roughness: 0.7, color: 0xe2dacb }),
    boxwood: std({ color: 0x3f5a2f, roughness: 0.9, flatShading: true }),
    teak: std({ map: tx("teak deck", 512, paintPlanks, 89, [2, 2]), roughness: 0.7, color: 0xc49a74 }),
    rattan: std({ map: tx("rattan", 256, paintRattan, 97, [0.25, 0.25]), roughness: 0.85, side: THREE.DoubleSide }),
    curtain: std({ color: 0xece3d3, roughness: 1, emissive: 0xffd9a8, emissiveIntensity: 0.0 }),
    curtainLit: std({ color: 0xf1e2c8, roughness: 1, emissive: 0xffc583, emissiveIntensity: 0.12 }),
    concrete: std({ map: plasterMap, color: 0xf3efe7, roughness: 0.85 }),
    towerGlass: std({ color: 0x9fb2b8, metalness: 0.6, roughness: 0.08, transparent: true, opacity: 0.55 }),
    liftDoor: std({ color: 0xb89a6a, metalness: 0.9, roughness: 0.35 }),
  };
  for (let i = 0; i < 6; i++) {
    lib[`art${i}` as MatKey] = std({ map: tx(`artwork ${i + 1}`, 512, paintArt(i), 100 + i, [1, 1]), roughness: 0.85 });
  }
  // names travel with the glTF export, so the Blender script can recognise each material
  for (const [k, m] of Object.entries(lib)) m!.name = k;
  return lib as MaterialLib;
}
