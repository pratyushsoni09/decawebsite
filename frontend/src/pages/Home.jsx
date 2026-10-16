import React, { useEffect, useRef, useState } from "react";
import { FAQ, P, SI, SL, SLI, SV, TECH, WORK } from "../data/content";
import { Cards, Cta, Dash, Ico, Svc } from "../components/parts";
import { useStore } from "../lib/store";
import { $, onScroll, rm, rt } from "../lib/runtime";

/* Hero slideshow: auto 6s, pause on hover/focus, swipe, thirds-click, segment buttons */
function Slideshow() {
  const [cu, setCu] = useState(0);
  const cuR = useRef(0), tm = useRef(0), hold = useRef(false), sx = useRef(null);
  const sl = useRef(null), segs = useRef([]);

  const go = (n) => {
    const c = (n + SL.length) % SL.length;
    cuR.current = c;
    tm.current = 0;
    setCu(c);
    segs.current.forEach((e, i) => e && (e.style.width = i < c ? "100%" : "0"));
  };

  useEffect(() => {
    const id = setInterval(() => {
      if (!sl.current || hold.current || rm || !document.body.classList.contains("rd")) return;
      tm.current += 100;
      const f = segs.current[cuR.current];
      f && (f.style.width = tm.current / 60 + "%");
      if (tm.current >= 6000) go(cuR.current + 1);
    }, 100);
    return () => clearInterval(id);
  }, []);

  /* fitDash: scale the slide-2 dashboard to its frame */
  useEffect(() => {
    const fit = () => {
      const d = sl.current && sl.current.querySelector(".dfit");
      if (!d) return;
      const v = d.parentElement;
      const k = Math.min((v.clientWidth - 48) / d.offsetWidth, (v.clientHeight - 140) / d.offsetHeight, 1);
      d.style.setProperty("--k", Math.max(k, .2));
    };
    fit();
    addEventListener("resize", fit);
    document.fonts && document.fonts.ready.then(fit);
    return () => removeEventListener("resize", fit);
  }, []);

  const up = (e) => {
    if (sx.current !== null) {
      const dx = e.clientX - sx.current;
      if (Math.abs(dx) > 50) go(cuR.current + (dx < 0 ? 1 : -1));
      else if (!e.target.closest("button,a")) {
        const q = sl.current.getBoundingClientRect(), u = (e.clientX - q.left) / q.width;
        if (u < .33) go(cuR.current - 1);
        else if (u > .67) go(cuR.current + 1);
      }
    }
    sx.current = null;
  };

  return (
    <div className="sl" id="sl" data-cur="Drag" role="region" aria-roledescription="carousel" aria-label="Featured" ref={sl}
      onMouseEnter={() => (hold.current = true)} onMouseLeave={() => (hold.current = false)}
      onFocus={() => (hold.current = true)} onBlur={() => (hold.current = false)}
      onPointerDown={(e) => (sx.current = e.clientX)} onPointerUp={up}>
      {SL.map((s, i) => (
        <article key={i} className={"sd" + (i === cu ? " on" : "")} aria-label={`${i + 1} of ${SL.length}`}>
          <span className="tl">{s[0]}</span>
          <span className="tr">DC / 0{i + 1}</span>
          <div className="vz">
            {s[2] ? <img className="slimg" src={SLI[s[2]]} alt={s[3]} style={{ objectPosition: s[4] }} /> : <div className="dfit"><Dash variant="slide" /></div>}
          </div>
          <span className="bl">{s[1]}</span>
        </article>
      ))}
      <div className="ct">
        {SL.map((_, i) => (
          <button key={i} className="s" aria-label={`Go to slide ${i + 1}`} onClick={() => go(i)}><u><i ref={(el) => (segs.current[i] = el)}></i></u></button>
        ))}
      </div>
      <div className="cb">
        <button className="ar" id="pv" aria-label="Previous slide" onClick={() => go(cuR.current - 1)}>←</button>
        <button className="ar" id="nx" aria-label="Next slide" onClick={() => go(cuR.current + 1)}>→</button>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="sec hero">
      <span className="dc d1" style={{ right: "11%", top: "36%", "--f": "-100px" }}>Web</span>
      <span className="dc d2" style={{ right: "34%", top: "24%", "--f": "100px" }}>AI</span>
      <span className="dc d3" style={{ right: "3%", top: "50%", "--f": "-100px" }}>SaaS</span>
      <div className="w">
        <div className="cn"><span className="ey">Deca Corpus / Digital technology studio</span></div>
        <div className="hh">
          <h1><span><b>Build</b></span><span><b>what’s</b></span><span className="sg"><b><em className="sf">next.</em></b></span></h1>
          <span className="stk" aria-hidden="true">Systems, not silos.</span>
          <a className="rb" href="#/contact" aria-label="Start a project" data-cur="Start">↗</a>
        </div>
        <div className="hg">
          <div className="hl">
            <p className="l">We don’t just build websites. We build the systems behind businesses.</p>
            <p className="s">We engineer digital products, software systems, SaaS platforms and business technology built for the real world.</p>
            <div className="bt" style={{ marginTop: 28, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a className="b" href="#/contact">Start a Project</a><a className="b g" href="#/work">See the concept</a>
            </div>
          </div>
          <Slideshow />
        </div>
      </div>
    </section>
  );
}

const CHECK = '<path d="M5 12l4.5 4.5L19 7"/>';

/* Made around you: chips + personalised panel (pz) */
function MadeAroundYou() {
  const { pick, setPick } = useStore();
  const s = SV[pick];
  return (
    <section className="sec mau" style={{ paddingTop: 0 }}>
      <div className="w">
        <p className="ey">Made around you</p>
        <h2>What are you building?</h2>
        <p className="mau-s">Pick what you’re building — we’ll show how we’d shape it around you.</p>
        <div className="pz">
          <div className="chips" id="chips" role="group" aria-label="What are you building">
            {SV.map((x, i) => (
              <button key={i} className="chip" data-i={i} aria-pressed={i === pick} onClick={() => setPick(i)}>
                <Ico className="ci" d={SI[i]} /><span className="cl">{x[2]}</span><em>0{i + 1}</em>
              </button>
            ))}
          </div>
          <div className="pp" id="pp" aria-live="polite">
            <React.Fragment key={pick}>
              <div className="pph"><span className="pbd"><Ico d={SI[pick]} /></span><h3>{s[0]}</h3><small>0{pick + 1} / 07</small></div>
              <p>{s[1]}</p>
              <ul className="pfl">{s[7].map((x) => <li key={x}><Ico d={CHECK} sw={2} />{x}</li>)}</ul>
              <div className="tg">{s[8].map((x) => <span key={x}>{x}</span>)}</div>
              <div className="pbt">
                <button className="b" data-s={pick}>Read the overview</button>
                <a className="b g" href="#/contact">Start a {s[2].toLowerCase()} project</a>
              </div>
            </React.Fragment>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Our philosophy: words light up as the paragraph scrolls through */
const PH = "Behind every interface is a system. Behind every system is a business. We design both.".split(" ");
function Philosophy() {
  const [n, setN] = useState(0);
  const ph = useRef(null);
  useEffect(() => onScroll(() => {
    if (!ph.current) return;
    const r = ph.current.getBoundingClientRect(), pp = Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (innerHeight * .5)));
    setN(Math.round(pp * PH.length));
  }), []);
  return (
    <section className="sec" id="phil">
      <div className="w">
        <div className="two phl">
          <div>
            <p className="ey">04 / Our philosophy</p>
            <h2 className="tm">Technology should feel <em className="sf">simple.</em></h2>
            <p className="ph" id="ph" ref={ph}>
              {PH.map((w, k) => <React.Fragment key={k}>{k ? " " : ""}<span className={k < n ? "on" : ""}>{w}</span></React.Fragment>)}
            </p>
            <p className="phs">DecaCorpus is a digital technology studio focused on engineering complex systems with premium design execution.</p>
            <a className="b g" href="#/studio">Meet the studio</a>
          </div>
          <div className="bx">
            <span><b>01</b><i>Business</i><em>Goals, logic and growth</em></span>
            <span><b>02</b><i>System</i><em>Architecture, data and scale</em></span>
            <span><b>03</b><i>Interface</i><em>Experience and design</em></span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* How we get there: pinned, scroll-driven six steps */
function Process() {
  const [ps, setPs] = useState(-1);
  const [open, setOpen] = useState(false);
  const pr = useRef(null);
  useEffect(() => onScroll(() => {
    const pe = pr.current;
    if (!pe) return;
    const b = pe.getBoundingClientRect(), tt = b.height - (document.documentElement.clientHeight || innerHeight);
    if (tt > 0) setPs(Math.min(5, Math.max(0, Math.floor(-b.top / tt * 6))));
  }), []);
  useEffect(() => {
    const close = (e) => { if (!e.target.closest("#pill")) setOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  const jump = (i) => {
    const el = pr.current, h = el.offsetHeight - innerHeight, y = el.offsetTop + (i + .5) / 6 * h;
    rt.ln ? rt.ln.scrollTo(y) : scrollTo({ top: y });
  };
  const cur = P[Math.max(ps, 0)];
  return (
    <section className="pr" id="process" ref={pr}>
      <div className="ps">
        <div className={"pill" + (open ? " open" : "")} id="pill">
          <button id="pillb" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>
            <small>0{Math.max(ps, 0) + 1}</small><span>{cur[0]}</span><i>▾</i>
          </button>
          <ul id="pilll">
            {P.map((x, i) => <li key={i}><button data-i={i} onClick={() => { setOpen(false); jump(i); }}><small>0{i + 1}</small>{x[0]}</button></li>)}
          </ul>
        </div>
        <div className="gw" id="gw" aria-hidden="true">{cur[0]}</div>
        <div className="w pg">
          <div>
            <p className="ey">05 / How we get there</p>
            <h2 style={{ marginBottom: 34, fontSize: "clamp(30px,4vw,56px)" }}>A clear path through complexity.</h2>
            <ol className="pl" id="pl" style={ps < 0 ? undefined : { "--i": ps }}>
              {P.map((x, i) => (
                <li key={i}><button data-i={i} data-cur="Jump" className={i === ps ? "on" : i < ps ? "dn" : undefined} onClick={() => jump(i)}>{x[0]}</button></li>
              ))}
            </ol>
          </div>
          <div className="pd" id="pd">
            {P.map((x, i) => <div key={i} className={i === ps ? "on" : undefined}><small>Step {i + 1} of 6</small><h3>{x[0]}</h3><div className="h">{x[1]}</div></div>)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* Studio film preview (no real video) */
function Film() {
  const [on, setOn] = useState(false);
  const onR = useRef(false), ts = useRef(null);
  useEffect(() => {
    const id = setInterval(() => {
      if (onR.current && ts.current) {
        rt.fs = (rt.fs + 1) % 25;
        ts.current.textContent = `0:${String(rt.fs).padStart(2, "0")} / 0:24`;
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const tg = () => { onR.current = !onR.current; setOn(onR.current); };
  return (
    <section className="sec" style={{ paddingTop: 0 }}>
      <div className="w">
        <p className="ey">08 / Studio film</p>
        <h2>Studio film preview</h2>
        <p style={{ marginTop: 14 }}>A closer look at how we think, design and build.</p>
        <div className="fc">
          <div className={"film" + (on ? " on" : "")} id="film">
            <div className="lp"></div><div className="sc"></div><div className="fg"></div>
            <button className="pb" id="pb" aria-label={on ? "Pause film preview" : "Play studio film preview"} onClick={tg}>{on ? "❚❚" : "▶"}</button>
            <div className="fb"><i></i></div>
            <span className="ts" id="ts" ref={ts}>0:00 / 0:24</span>
          </div>
          <div className="bt3">
            <div><p style={{ marginTop: 0 }}>Video preview — footage pending.</p></div>
            <button className="b g" id="pb2" onClick={tg}>Watch preview</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqItem({ q }) {
  const [o, setO] = useState(false);
  return (
    <div className={"fq rv vis" + (o ? " open" : "")}>
      <button aria-expanded={o} data-cur="Toggle" onClick={() => setO(!o)}>{q[0]}</button>
      <div className="fa"><div><p>{q[1]}</p></div></div>
    </div>
  );
}

export function Home() {
  return (
    <>
      <Hero />

      <section className="sec">
        <div className="w">
          <div className="mp two">
            <div><p className="ey">01 / The bigger picture</p><p>Less fragmentation. More possibility.</p></div>
            <div>
              <h2>We build the <em className="sf">systems</em> behind businesses.</h2>
              <p style={{ marginTop: 22 }}>A beautiful interface is only the beginning. We connect the product, the processes and the technology into one considered whole.</p>
            </div>
          </div>
        </div>
      </section>

      <MadeAroundYou />

      <section className="sec" id="what">
        <div className="w">
          <p className="ey">02 / What we build</p>
          <h2>Connected thinking. Complete delivery.</h2>
          <p>From the first interface to the infrastructure beneath it.</p>
          <div className="sv7"><Svc /></div>
          <p style={{ marginTop: 26 }}><a className="b g" href="#/services">Explore services</a></p>
        </div>
      </section>

      {/* Unnumbered on purpose, so the section dots and "0N /" numbering stay as they were. */}
      <section className="sec" id="selwork">
        <div className="w">
          <div className="two" style={{ alignItems: "end" }}><div><p className="ey">Selected work</p></div><h2>Recent projects.</h2></div>
          <div className="wk-g">
            {WORK.map((p) => (
              <a key={p.key} className="kc wk-c" data-cur="Open"
                {...(p.link ? { href: p.link[0], target: "_blank", rel: "noopener" } : { href: "#/work" })}>
                <figure className="wk-shot"><img src={p.img} alt={p.alt} loading="lazy" style={{ objectPosition: p.pos }} /></figure>
                <h3>{p.title}</h3>
                <p>{p.card}</p>
                <div className="tgs">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <div className="two" style={{ alignItems: "end" }}><div><p className="ey">03 / Selected concept</p></div><h2>Healthcare CRM</h2></div>
          <Dash />
          <p className="ey" style={{ margin: "14px 0 0", textTransform: "uppercase" }}>Concept preview • All interface data is illustrative</p>
        </div>
      </section>

      <Philosophy />
      <Process />

      <section className="sec" id="tech">
        <div className="w">
          <div className="two" style={{ gridTemplateColumns: "1.3fr 1fr", alignItems: "end" }}>
            <div>
              <p className="ey">06 / Built on strong foundations</p>
              <h2 style={{ fontSize: "clamp(32px,4.6vw,64px)" }}>The right tools. Not just the <em className="sf">latest.</em></h2>
            </div>
            <p>We choose technology around the product, the people using it and the system it needs to become.</p>
          </div>
          <div className="tl4">
            {TECH.map((g) => (
              <div key={g[0]}>
                <small>{g[0]}</small>
                <div className="vm" aria-hidden="true"><div className="vt2">{[...g[1], ...g[1], ...g[1], ...g[1]].map((t, i) => <span key={i}>{t}</span>)}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="persp">
        <div className="w">
          <p className="ey">07 / Ideas in progress</p>
          <div className="two" style={{ gridTemplateColumns: "1fr auto", alignItems: "end" }}>
            <h2>A different <em className="sf">perspective.</em></h2>
            <a className="b g" href="#/insights">Explore Insights</a>
          </div>
          <Cards />
        </div>
      </section>

      <Film />

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="w">
          <div className="mp faq">
            <div><p className="ey">FAQ</p><h2>Questions, answered.</h2></div>
            <div id="fq" data-late="">{FAQ.map((q) => <FaqItem key={q[0]} q={q} />)}</div>
          </div>
        </div>
      </section>

      <Cta />
    </>
  );
}
