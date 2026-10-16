// Global shell: everything outside <main id="app">, in the prototype's DOM order.
import React, { useEffect, useRef, useState } from "react";
import { ARR, NM, ORD, SV, href } from "../data/content";
import { useStore } from "../lib/store";
import { $, $$, onScroll, rm, rt } from "../lib/runtime";

/* Text roll: rollAll() wraps a label in two stacked copies. */
export const R = ({ children }) => (
  <span className="rl"><i>{children}</i><i aria-hidden="true">{children}</i></span>
);

/* vis[0]: interlocking rings inside a light frame (menu film tile). */
export const Rings = () => (
  <svg className="ring" viewBox="0 0 400 260" role="img" aria-label="Interlocking rings inside a light frame">
    <defs>
      <linearGradient id="gg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#f2f0ea" /><stop offset=".5" stopColor="#6c6a62" /><stop offset="1" stopColor="#cfcbbd" />
      </linearGradient>
    </defs>
    <rect className="fr" x="150" y="40" width="190" height="170" rx="4">
      <animate attributeName="x" values="150;158;150" dur="8s" repeatCount="indefinite" />
    </rect>
    <g transform="translate(205 130)">
      <g>
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="26s" repeatCount="indefinite" />
        <ellipse rx="96" ry="38" fill="none" stroke="url(#gg)" strokeWidth="12" />
      </g>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="34s" repeatCount="indefinite" />
        <ellipse rx="38" ry="96" fill="none" stroke="url(#gg)" strokeWidth="12" transform="rotate(35)" />
      </g>
    </g>
  </svg>
);

/* Loading screen */
export function Preloader() {
  const [gone, setGone] = useState(false);
  const ld = useRef(null), lc = useRef(null), lf = useRef(null);
  useEffect(() => {
    const t0 = performance.now();
    let done = 0, raf = 0;
    const fin = () => {
      if (done) return;
      done = 1;
      document.body.classList.add("rd");
      ld.current && ld.current.classList.add("off");
      setTimeout(() => setGone(true), 800);
    };
    const s = (t) => {
      const p = Math.min(1, (t - t0) / 1500);
      lc.current && (lc.current.textContent = String(Math.round(p * 100)).padStart(3, "0"));
      lf.current && (lf.current.style.width = p * 100 + "%");
      if (p < 1) raf = requestAnimationFrame(s); else fin();
    };
    s(t0);
    const safety = setTimeout(fin, 3200);
    return () => { cancelAnimationFrame(raf); clearTimeout(safety); };
  }, []);
  if (gone) return null;
  return (
    <div className="ld" id="ld" ref={ld}>
      <div className="lw">
        <small>INITIALIZING DIGITAL SYSTEM...</small>
        <b><span id="lc" ref={lc}>000</span><u>%</u></b>
        <i id="lf" ref={lf}></i>
      </div>
    </div>
  );
}

/* Background: dark galaxy, drifting glass shards */
export function Background() {
  const cvRef = useRef(null);
  useEffect(() => {
    const cv = cvRef.current, c = cv.getContext("2d");
    let W, H, d, SH = [], ST = [], t = 0, ly = scrollY, sv = 0, mx = 0, my = 0, tx = 0, ty = 0, raf = 0;
    const R = Math.random;
    function rs() {
      d = Math.min(devicePixelRatio || 1, 1.5);
      W = cv.width = innerWidth * d;
      H = cv.height = innerHeight * d;
      cv.style.width = innerWidth + "px";
      cv.style.height = innerHeight + "px";
      const n = innerWidth < 700 ? 42 : 80;
      SH = [];
      for (let i = 0; i < n; i++) {
        const z = .25 + R() * .75, k = 3 + (R() < .3), pts = [];
        for (let j = 0; j < k; j++) {
          const a = j / k * 6.283 + R() * .9, r = .45 + R() * .55;
          pts.push([Math.cos(a) * r, Math.sin(a) * r * (.5 + R() * .7)]);
        }
        SH.push({ x: R(), y: R(), z, sz: (7 + R() * R() * 46) * z * d, rot: R() * 6.28, vr: (R() - .5) * .012, tp: R() * 6.28, tv: .006 + R() * .014, vx: (R() - .5) * .00006, vy: (R() - .5) * .00005, pts, h: R() });
      }
      ST = [];
      for (let i = 0; i < 130; i++) ST.push({ x: R(), y: R(), r: (.4 + R() * 1.1) * d, p: R() * 6.28, s: .01 + R() * .03 });
    }
    rs();
    const onMove = (e) => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; };
    addEventListener("resize", rs);
    addEventListener("mousemove", onMove, { passive: true });
    function glow(x, y, r, col, a) {
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(" + col + "," + a + ")");
      g.addColorStop(1, "rgba(" + col + ",0)");
      c.fillStyle = g;
      c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    function draw() {
      c.clearRect(0, 0, W, H);
      mx += (tx - mx) * .04;
      my += (ty - my) * .04;
      const pu = .85 + .15 * Math.sin(t * .7);
      glow(W * .02, H * .52, H * .7 * pu, "255,255,255", .07);
      glow(W * .99, H * .52, H * .5 * pu, "255,255,255", .04);
      for (const q of ST) {
        const a = .25 + .35 * Math.sin(t * q.s * 20 + q.p);
        c.fillStyle = "rgba(235,235,235," + Math.max(a, .05).toFixed(2) + ")";
        c.fillRect(q.x * W, q.y * H, q.r, q.r);
      }
      for (const o of SH) {
        o.x += o.vx * (1 + Math.abs(sv) * .3);
        o.y += o.vy - sv * .00018 * o.z;
        o.rot += o.vr;
        o.tp += o.tv;
        if (o.x < -.1) o.x = 1.1;
        if (o.x > 1.1) o.x = -.1;
        if (o.y < -.1) o.y = 1.1;
        if (o.y > 1.1) o.y = -.1;
        const f = Math.cos(o.tp), br = .3 + .7 * f * f, px = o.x * W + mx * 60 * o.z * d, py = o.y * H + my * 40 * o.z * d;
        c.save();
        c.translate(px, py);
        c.rotate(o.rot);
        c.scale(Math.max(Math.abs(f), .12), 1);
        c.beginPath();
        o.pts.forEach((v, i) => (i ? c.lineTo(v[0] * o.sz, v[1] * o.sz) : c.moveTo(v[0] * o.sz, v[1] * o.sz)));
        c.closePath();
        const al = (.12 + .5 * o.z) * br, tint = o.h > .8 ? "205,205,205" : "215,215,215";
        c.fillStyle = "rgba(" + tint + "," + al.toFixed(3) + ")";
        c.fill();
        c.lineWidth = d * .8;
        c.strokeStyle = "rgba(255,255,255," + (al * .9).toFixed(3) + ")";
        c.stroke();
        c.restore();
      }
    }
    function f() {
      sv = sv * .9 + (scrollY - ly) * .1;
      ly = scrollY;
      t += .016;
      draw();
      if (!rm) raf = requestAnimationFrame(f);
    }
    f();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", rs); removeEventListener("mousemove", onMove); };
  }, []);
  return <div className="bgz" aria-hidden="true"><canvas id="bg" ref={cvRef}></canvas><i></i></div>;
}

/* Navigation pill */
const NAV = ["work", "services", "studio", "insights", "careers", "contact"];
export function Nav() {
  const { page, menuOn, mOpen, mClose } = useStore();
  const pn = useRef(null), pc = useRef(null);
  useEffect(() => onScroll(() => {
    const h = document.documentElement, m = h.scrollHeight - innerHeight;
    h.style.setProperty("--p", m > 0 ? scrollY / m : 0);
    pc.current && (pc.current.textContent = Math.round(Math.min(1, Math.max(0, m > 0 ? scrollY / m : 0)) * 100) + "%");
    pn.current && pn.current.classList.toggle("sm", scrollY > 140);
  }), []);
  return (
    <nav>
      <div className="w">
        <div className="pn" id="pn" ref={pn}>
          <a className="logo" href="#/">DecaCorpus</a>
          <div className="lks" id="lk">
            {NAV.map((k) => (
              <a key={k} href={"#/" + k} data-p={k} aria-current={page === k ? "page" : undefined}><R>{NM[k]}</R></a>
            ))}
          </div>
          <span className="pc" id="pc" ref={pc}>0%</span>
          <button className="mbtn" id="mb" aria-expanded={menuOn} aria-controls="mcard" onClick={() => (menuOn ? mClose() : mOpen())}>
            {menuOn ? "Close" : "Menu"}
          </button>
          <div id="sp"></div>
        </div>
      </div>
    </nav>
  );
}

/* Menu overlay */
const MENU = [["home", "00"], ["work", "01", 3], ["services", "02", 7], ["studio", "03"], ["insights", "04", 2], ["careers", "05"], ["contact", "06"]];
export function Menu() {
  const { menuOn, mClose } = useStore();
  const on = menuOn ? " on" : "";
  const film = (e) => {
    e.preventDefault();
    mClose();
    if (location.hash.replace(/^#\/?/, "")) location.hash = "#/";
    setTimeout(() => {
      const f = $("#film");
      f && (rt.ln ? rt.ln.scrollTo(f, { offset: -120 }) : f.scrollIntoView());
    }, 1700);
  };
  return (
    <>
      <div className={"msc" + on} id="msc" onClick={mClose}></div>
      <div className={"mcard" + on} id="mcard" role="dialog" aria-modal="true" aria-label="Menu" data-lenis-prevent=""
        onClick={(e) => { if (e.target.closest(".ml2 a,.mcta")) mClose(); }}>
        <div className="mg">
          <div className="ml2">
            {MENU.map(([k, i, n]) => (
              <a key={k} href={href(k)} data-i={i}><R>{NM[k]}{n ? <sup>{n}</sup> : null}</R></a>
            ))}
          </div>
          <a className="mpv" href="#/" id="mpv" data-cur="Play" onClick={film}>
            <div className="hpv"><Rings /></div>
            <span className="pl2">▶ Studio film preview</span>
          </a>
        </div>
        <div className="mf"><span>Build what’s next.</span><a className="mcta" href="#/contact">Start a Project ↗</a></div>
      </div>
    </>
  );
}

/* Section dots (Home only) */
export function ChapterDots() {
  const { page, nonce } = useStore();
  const [chs, setChs] = useState([]);
  const [act, setAct] = useState(0);
  const secs = useRef([]);
  const cn = useRef(null);
  useEffect(() => {
    const list = [];
    if (page === "home") {
      $$("#app .ey").forEach((e) => {
        const m = e.textContent.match(/^0(\d) \/ (.+)/);
        if (m) {
          const s = e.closest("section");
          if (s && !list.some((x) => x.s === s)) list.push({ s, t: m[2] });
        }
      });
    }
    secs.current = list;
    setChs(list.map((x) => x.t));
  }, [page, nonce]);
  useEffect(() => onScroll(() => {
    const c = cn.current;
    if (!c) return;
    c.style.opacity = scrollY > 420 ? 1 : 0;
    if (!secs.current.length) return;
    let a = 0;
    secs.current.forEach((x, i) => { if (x.s.getBoundingClientRect().top < innerHeight * .5) a = i; });
    setAct(a);
  }), []);
  const go = (i) => {
    const s = secs.current[i] && secs.current[i].s;
    if (s) rt.ln ? rt.ln.scrollTo(s, { offset: -10 }) : s.scrollIntoView();
  };
  return (
    <div className={"chn" + (page === "home" ? " on" : "")} id="chn" aria-label="Sections" ref={cn}>
      {chs.map((t, i) => (
        <button key={t} className={i === act ? "on" : undefined} data-i={i} aria-label={t} onClick={() => go(i)}><span>{t}</span><i></i></button>
      ))}
    </div>
  );
}

/* Page transition curtain */
export function Curtain() {
  const { vt } = useStore();
  return <div className={vt.cls} id="vt" aria-hidden="true">{vt.text}</div>;
}

/* Footer wordmark (sits above the footer) and footer */
export function Wordmark() {
  const b = useRef(null);
  // The prototype still drives these shimmer variables; the gradient they moved was removed
  // by a later override, so they have no visible effect. Kept for parity.
  useEffect(() => {
    const w = b.current;
    if (!w || matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    let t = 0;
    const u = () => {
      t = 0;
      w.style.setProperty("--bx", scrollY * -.35 + "px");
      w.style.setProperty("--b2", scrollY * .22 + "px");
      w.style.setProperty("--sh", scrollY * .7 + "px");
    };
    const on = () => { t || (t = requestAnimationFrame(u)); };
    addEventListener("scroll", on, { passive: true });
    u();
    return () => removeEventListener("scroll", on);
  }, []);
  return <div className="wm" aria-hidden="true"><b id="wm" ref={b}>DECACORPUS</b></div>;
}

export function Footer() {
  return (
    <footer>
      <div className="w">
        <div className="fcl">
          <div>
            <a className="logo" href="#/">DecaCorpus</a>
            <p style={{ marginTop: 12, fontSize: 16, color: "var(--tx)" }}>DECACORPUS – Digital technology studio.</p>
          </div>
          <div>
            <small>Studio</small>
            {NAV.map((k) => <a key={k} href={"#/" + k}><R>{NM[k]}</R></a>)}
          </div>
          <div>
            <small>Services</small>
            {SV.map((s, i) => <a key={i} href="#/services" data-s={i}><R>{s[0]}</R></a>)}
          </div>
          <div>
            <small>Reach us</small>
            <a href="mailto:hello@decacorpus.com"><R>hello@decacorpus.com</R></a>
            <a href="mailto:careers@decacorpus.com"><R>careers@decacorpus.com</R></a>
            <a href="#"><R>LinkedIn</R></a>
            <a href="#"><R>X / Twitter</R></a>
          </div>
        </div>
        <div className="fb2"><span>© 2026 DECACORPUS</span><span className="lk2"><a href="#">Privacy</a><a href="#">Terms</a></span></div>
      </div>
    </footer>
  );
}

/* Keep scrolling → next page (wheel only) */
export function NextBar() {
  const { page, nonce } = useStore();
  const a = useRef(null);
  const n = ORD[(ORD.indexOf(page) + 1) % 7];
  useEffect(() => { a.current && a.current.style.setProperty("--o", "0%"); }, [page, nonce]);
  useEffect(() => {
    const onWheel = (e) => {
      const m = document.documentElement.scrollHeight - innerHeight, el = a.current;
      if (!el) return;
      if (scrollY >= m - 3 && e.deltaY > 0) {
        rt.oa = Math.min(900, rt.oa + e.deltaY);
        el.style.setProperty("--o", rt.oa / 9 + "%");
        if (rt.oa >= 900) { rt.oa = 0; location.hash = el.getAttribute("href"); }
      } else {
        rt.oa = Math.max(0, rt.oa - 90);
        el.style.setProperty("--o", rt.oa / 9 + "%");
      }
    };
    addEventListener("wheel", onWheel, { passive: true });
    return () => removeEventListener("wheel", onWheel);
  }, []);
  return (
    <a className="nxp" id="nxp" href={href(n)} style={{ position: "relative", zIndex: 1 }} ref={a}>
      <small>Keep scrolling</small><b>Next: {NM[n]}</b><i></i>
    </a>
  );
}

/* Service detail drawer */
const li = (a) => a.map((x, j) => {
  const k = x.indexOf(": ");
  return k > 0 && k < 30 ? <li key={j}><b>{x.slice(0, k)}:</b> {x.slice(k + 2)}</li> : <li key={j}>{x}</li>;
});
export function Drawer() {
  const { drawer, closeS } = useStore();
  const s = drawer.i === null ? null : SV[drawer.i];
  const on = drawer.on ? " on" : "";
  return (
    <>
      <div className={"scrim" + on} id="scrim" onClick={closeS}></div>
      <aside className={"dr" + on} id="dr" role="dialog" aria-modal="true" aria-labelledby="dt" data-lenis-prevent="">
        <button className="x" id="dx" onClick={closeS}>Close</button>
        <div id="dc">
          {s && (
            <>
              <small style={{ color: "var(--mu)" }}>Service 0{drawer.i + 1}</small>
              <h2 id="dt">{s[0]}</h2>
              <p style={{ color: "#fff", fontSize: 18 }}>{s[1]}</p>
              <h4>Overview</h4><p>{s[3]}</p>
              <h4>{s[4][0]}</h4><ul>{li(s[4][1])}</ul>
              <h4>{s[5][0]}</h4><ul>{li(s[5][1])}</ul>
              <div className="q">{s[6]}</div>
              <h4>Key features</h4><div className="tg">{s[7].map((x) => <span key={x}>{x}</span>)}</div>
              <h4>Technologies</h4><div className="tg">{s[8].map((x) => <span key={x}>{x}</span>)}</div>
              <p style={{ marginTop: 34 }}><a className="b" href="#/contact" id="dcta">Start a Project</a></p>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

/* Custom cursor (fine pointers only). The label bubble exists but is hidden by the stylesheet. */
export function Cursor() {
  useEffect(() => {
    if (!matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    document.body.classList.add("cx");
    const c = document.createElement("div");
    c.className = "cur";
    c.innerHTML = "<i></i><span></span>";
    document.body.append(c);
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    const move = (e) => {
      tx = e.clientX; ty = e.clientY;
      c.style.opacity = 1;
      const t = e.target.closest && e.target.closest("[data-cur],input,a,button");
      let l = "";
      if (t) {
        const film = $("#film");
        l = t.dataset.cur || (t.id === "pb" ? (film && film.classList.contains("on") ? "Pause" : "Play") : t.matches("input") ? "Type" : t.matches(".chip") ? "Pick" : "Go");
      }
      c.lastChild.textContent = l;
      c.classList.toggle("big", !!l);
    };
    const leave = () => (c.style.opacity = 0);
    addEventListener("mousemove", move);
    document.addEventListener("mouseleave", leave);
    const f = () => {
      x += (tx - x) * .3;
      y += (ty - y) * .3;
      c.style.transform = `translate(${x}px,${y}px)`;
      raf = requestAnimationFrame(f);
    };
    f();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
      c.remove();
      document.body.classList.remove("cx");
    };
  }, []);
  return null;
}

export { ARR };
