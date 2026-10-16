import React, { useEffect, useLayoutEffect } from "react";
import Lenis from "lenis";
import { useStore } from "./lib/store";
import { $, $$, emitScroll, onScroll, rm, rt } from "./lib/runtime";
import { Background, ChapterDots, Cursor, Curtain, Drawer, Footer, Menu, Nav, NextBar, Preloader, Wordmark } from "./components/shell";
import { Home } from "./pages/Home";
import { Careers, Contact, Insights, Services, Studio, Work } from "./pages/Pages";

const PAGES = { home: Home, services: Services, work: Work, studio: Studio, insights: Insights, careers: Careers, contact: Contact };

/* Elements that get the scroll reveal (TAG in the prototype). */
const TAG = "#app .ey,#app h1,#app h2,#app .lead,#app .sr,#app .cd,#app .fc,#app .wf,#app .st6>div,#app .tl4>div,#app .bx span,#app .sculpt,#app .cos,#app .cr,#app .band,#app .fl2,#app .chips,#app .pp,#app .it2,#app .hl>*,#app .kc,#app .tile,#app .cl3";

let io = null;
/* Scroll reveal + KPI count-up. Content the prototype injects after this pass (FAQ, poll,
   slides) is marked data-late / lives in .sd so it is treated the same way here. */
function reveal() {
  const late = (e) => e.closest("[data-late]") || e.closest(".sd");
  $$(TAG).filter((e) => !e.classList.contains("rv") && !late(e) && !e.closest(".cta2 h2")).forEach((e) => e.classList.add("rv"));
  const rvs = $$("#app .rv").filter((e) => !late(e));
  rvs.forEach((e) => {
    const s = [...e.parentNode.children].filter((x) => x.classList.contains("rv"));
    e.style.setProperty("--dl", Math.min(s.indexOf(e), 5) * .09 + "s");
  });
  io && io.disconnect();
  io = new IntersectionObserver((l) => l.forEach((x) => {
    if (!x.isIntersecting) return;
    x.target.classList.add("vis");
    io.unobserve(x.target);
    x.target.querySelectorAll("[data-n]").forEach((c) => {
      const n = +c.dataset.n, t0 = performance.now();
      (function f(t) {
        const q = Math.min(1, (t - t0) / 1100);
        c.textContent = String(Math.round(n * (1 - Math.pow(1 - q, 3)))).padStart(n < 10 ? 2 : 1, "0");
        if (q < 1) requestAnimationFrame(f);
      })(t0);
    });
  }), { threshold: .1, rootMargin: "0px 0px -5% 0px" });
  rvs.forEach((e) => io.observe(e));
  return setTimeout(() => $$("#app .rv:not(.vis)").forEach((e) => {
    const r = e.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) e.classList.add("vis");
  }), 1800);
}

/* ex(): dashboard scale-in and hero parallax */
function ex() {
  const y = scrollY, hs = $(".hero");
  $$(".cos").forEach((d) => {
    const q = d.getBoundingClientRect(), p = Math.min(1, Math.max(0, 1 - q.top / (innerHeight * .95)));
    d.style.scale = .88 + .12 * p;
  });
  if (!hs) return;
  const sl0 = $("#sl");
  sl0 && (sl0.style.scale = 1 - Math.min(.08, y / 5000));
  const hh = hs.offsetHeight;
  $(".hero h1").style.translate = `0 ${-y * .08}px`;
  const hg = $(".hg");
  hg && (hg.style.translate = `0 ${-y * .06}px`);
  $(".hero>.w").style.opacity = Math.max(0, 1 - y / (hh * .95));
}

export default function App() {
  const { page, nonce, openS, closeS, mClose } = useStore();
  const Page = PAGES[page];

  /* Lenis smooth scroll + global scroll fan-out */
  useEffect(() => {
    const unsub = onScroll(ex);
    const onWin = () => emitScroll();
    addEventListener("scroll", onWin, { passive: true });
    addEventListener("resize", onWin);
    let raf = 0;
    if (!rm) {
      const ln = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      rt.ln = ln;
      ln.on("scroll", emitScroll);
      const r = (t) => { ln.raf(t); raf = requestAnimationFrame(r); };
      raf = requestAnimationFrame(r);
    }
    return () => {
      unsub();
      removeEventListener("scroll", onWin);
      removeEventListener("resize", onWin);
      cancelAnimationFrame(raf);
      rt.ln && rt.ln.destroy();
      rt.ln = null;
    };
  }, []);

  /* Esc, drawer delegation ([data-s]), drawer CTA, in-page anchors */
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { closeS(); mClose(); } };
    const onClick = (e) => {
      const b = e.target.closest("[data-s]");
      if (b) { e.preventDefault(); openS(+b.dataset.s, b); return; }
      if (e.target.closest("#dcta")) closeS();
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const h = a.getAttribute("href");
      if (h.length < 2 || h.startsWith("#/")) return;
      const el = $(h);
      if (el && rt.ln) { e.preventDefault(); rt.ln.scrollTo(el, { offset: -70 }); }
    };
    addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => { removeEventListener("keydown", onKey); document.removeEventListener("click", onClick); };
  }, [openS, closeS, mClose]);

  /* After each route: scroll to top and reveal before paint... */
  useLayoutEffect(() => {
    rt.ln ? rt.ln.scrollTo(0, { immediate: true }) : scrollTo(0, 0);
    const t = reveal();
    return () => clearTimeout(t);
  }, [nonce, page]);

  /* ...then sync scroll-driven state (sc + ex). Declared after the subscription effects so every
     listener, including ones registered by the new page and the chapter dots, is attached. */
  useEffect(() => { emitScroll(); }, [nonce, page]);

  return (
    <>
      <Preloader />
      <Background />
      <Nav />
      <Menu />
      <ChapterDots />
      <div className="hp" id="hp" aria-hidden="true"></div>
      <Curtain />
      <main id="app" style={{ position: "relative", zIndex: 1 }}>
        <Page key={nonce} />
      </main>
      <Wordmark />
      <Footer />
      <NextBar />
      <Drawer />
      <Cursor />
    </>
  );
}
