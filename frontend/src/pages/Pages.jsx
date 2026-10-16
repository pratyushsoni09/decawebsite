// Services, Work, Studio, Insights, Careers and Contact, ported from the prototype's page templates.
import React, { useEffect, useRef, useState } from "react";
import { AR, Q, SV, WORK } from "../data/content";
import { Cards, Cta, Dash, Ico, Svc } from "../components/parts";
import { useStore } from "../lib/store";
import { $$, rt } from "../lib/runtime";
import { sendContact, sendPollVote } from "../lib/api";

/* Icons used by the Studio and Careers cards (verbatim paths) */
const IC = {
  cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  code: '<path d="M8 8l-4 4 4 4"/><path d="M16 8l4 4-4 4"/><path d="M13.5 5l-3 14"/>',
  star: '<path d="M12 3l2.4 5 5.6.8-4 3.9.9 5.6L12 15.6 7.1 18.3 8 12.7 4 8.8l5.6-.8z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16v4M17 18h4"/>',
};
const Kic = ({ d }) => <span className="kic"><Ico d={d} /></span>;

export function Services() {
  return (
    <>
      <section className="sec pg1 svp">
        <div className="w">
          <p className="ey">Services / 01–07</p>
          <h1>Systems for what’s <em className="sf">next.</em></h1>
          <div className="sv7"><Svc /></div>
        </div>
      </section>
      <section className="sec svp2" style={{ background: "#0a0a0acc" }}>
        <div className="w">
          <div className="svp2-h"><p className="ey">One connected engagement</p><h2>Not seven silos. One system.</h2></div>
          <ol className="stp4">
            {[["Discover", "Define the problem and the goal."], ["Shape", "Map the scope and architecture."], ["Deliver", "Build, integrate and test."], ["Improve", "Learn from use and refine."]].map((x, k) => (
              <li key={k} className="rv" style={{ "--dl": k * .08 + "s" }}><small>0{k + 1}</small><h3>{x[0]}</h3><p>{x[1]}</p></li>
            ))}
          </ol>
        </div>
      </section>
      <Cta />
    </>
  );
}

/* A project landing in the same two-column layout as the Healthcare CRM concept. */
function Project({ p }) {
  return (
    <section className="sec pg1 pgw" id={"wk-" + p.key}>
      <div className="w pgw-g">
        <div className="pgw-l">
          <p className="ey">{p.eyebrow}</p>
          <h1>{p.title}</h1>
          <p className="lead">{p.lead}</p>
          <div className="tgs">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
          <em className="pgw-n">{p.note}</em>
          {p.link && (
            <p className="wk-cta"><a className="b" href={p.link[0]} target="_blank" rel="noopener">{p.link[1]}</a></p>
          )}
        </div>
        <figure className="wk-shot rv">
          <img src={p.img} alt={p.alt} style={{ objectPosition: p.pos }} />
        </figure>
      </div>
    </section>
  );
}

export function Work() {
  return (
    <>
      {WORK.map((p) => <Project key={p.key} p={p} />)}
      <section className="sec pg1 pgw">
        <div className="w pgw-g">
          <div className="pgw-l">
            <p className="ey">Work / Concept preview</p>
            <h1>Healthcare <em className="sf">CRM</em></h1>
            <p className="lead">A connected system for the care journey, bringing patient relationships, workflows and analytics together.</p>
            <div className="tgs"><span>Custom CRM</span><span>Automation</span><span>Analytics</span></div>
            <em className="pgw-n">Illustrative concept • Not a delivered case study</em>
          </div>
          <Dash />
        </div>
      </section>
      <Cta />
    </>
  );
}

export function Studio() {
  return (
    <>
      <section className="sec pg1 std">
        <div className="w stdg">
          <div className="stdt">
            <p className="ey">People / Perspective / Practice</p>
            <h1>The <em className="sf">Studio</em></h1>
            <p className="lead">We are a team of engineers, designers, and strategists obsessed with pushing the boundaries of what’s possible.</p>
            <a className="b g jt" href="#/careers">Join the team</a>
          </div>
          <figure className="tile" role="img" aria-label="The DecaCorpus team at work.">
            <img src="/assets/images/studio-team.jpg" alt="" />
            <figcaption>Culture</figcaption>
          </figure>
        </div>
      </section>
      <section className="sec std2" style={{ paddingTop: 0 }}>
        <div className="w">
          <div className="stdp2">
            <div>
              <p className="ey">Our philosophy</p>
              <p className="lead">At DecaCorpus, we don’t just write code or design interfaces. We engineer holistic systems that scale.</p>
            </div>
            <p className="sp">True digital transformation needs a deep understanding of business logic, user psychology, and cutting-edge technology.</p>
          </div>
          <p className="ey" style={{ marginTop: "clamp(40px,6vw,72px)" }}>How we work</p>
          <div className="kg k3">
            <div className="kc"><Kic d={IC.cube} /><h3>Iterative</h3><p>We ship early, learn fast, and refine.</p></div>
            <div className="kc"><Kic d={IC.eye} /><h3>Radically transparent</h3><p>You see the architecture, trade-offs, and progress.</p></div>
            <div className="kc"><Kic d={IC.code} /><h3>Uncompromising on quality</h3><p>Design and engineering get equal care.</p></div>
          </div>
        </div>
      </section>
      <Cta />
    </>
  );
}

function Poll() {
  const [v, setV] = useState(() => { try { return localStorage.getItem("dc_poll"); } catch (e) { return null; } });
  const vote = (i) => {
    if (v !== null) return;
    const s = String(i);
    try { localStorage.setItem("dc_poll", s); } catch (er) {}
    setV(s);
    sendPollVote(i);
  };
  return (
    <div className="poll" id="poll" data-late="">
      <p className="ey">Small poll</p>
      <h3>Which idea should we write up first?</h3>
      <div className="po">
        {AR.map((a, i) => (
          <button key={i} data-i={i} disabled={v !== null} className={v == i ? "on" : ""} onClick={() => vote(i)}>{a[0]}</button>
        ))}
      </div>
      <p className="hint2">{v === null ? "Your vote stays in this browser. It is a demo, not a survey." : "Noted. We’ll weigh it when we start writing."}</p>
    </div>
  );
}

const FILTERS = [["all", "All perspectives"], ["ai", "AI"], ["design", "Design"]];
export function Insights() {
  const [f, setF] = useState("all");
  const [c, setC] = useState(2);
  const onFilter = (key) => {
    setF(key);
    let n = 0;
    $$(".cs .cd").forEach((d) => {
      const h = key !== "all" && d.dataset.k !== key;
      d.classList.toggle("hide", h);
      if (!h) n++;
    });
    setC(n);
  };
  return (
    <section className="sec pg1">
      <div className="w">
        <p className="ey">Ideas / Systems / New perspectives</p>
        <h1>Thinking out <em className="sf">loud.</em></h1>
        <div className="it"><p className="lead">Notes on the changing relationship between business, design and technology. A preview of the conversations we want to open.</p></div>
        <div className="fl2" id="fl2">
          {FILTERS.map(([k, l]) => <button key={k} data-f={k} aria-pressed={f === k} onClick={() => onFilter(k)}>{l}</button>)}
          <em id="fc">{`0${c} Editorial preview${c > 1 ? "s" : ""} / No articles published yet`}</em>
        </div>
        <div id="persp" style={{ padding: 0 }}><Cards /></div>
        <Poll />
      </div>
    </section>
  );
}

const ROLES = [
  ["code", "Engineering", "Front-end, back-end, full-stack, mobile.", "Engineering"],
  ["star", "Design", "UI/UX, product design, motion.", "Design"],
  ["compass", "Strategy and delivery", "Product strategy, project leadership.", "Strategy%20and%20delivery"],
  ["spark", "AI and automation", "Workflow and LLM integration.", "AI%20and%20automation"],
];
export function Careers() {
  return (
    <>
      <section className="sec pg1 pgk">
        <div className="w">
          <p className="ey">Careers</p>
          <h1>Good minds. <em className="sf">Shared ambition.</em></h1>
          <div className="it">
            <p className="lead">We’re engineers, designers and strategists building the systems behind ambitious businesses. If that sounds like you, we’d like to know you.</p>
            <div className="pgk-a">
              <a className="b" href="mailto:careers@decacorpus.com">Write to us</a>
              <a className="b g" href="mailto:careers@decacorpus.com?subject=Introduction">Introduce yourself</a>
            </div>
          </div>
        </div>
      </section>
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="w">
          <p className="ey">01 / Why DecaCorpus</p>
          <h2>What it’s like to work here.</h2>
          <div className="kg k3">
            <div className="kc"><span>01</span><h3>Real systems, not just screens</h3><p>You’ll work on software, SaaS, CRM, AI and mobile products, from first idea to launch.</p></div>
            <div className="kc"><span>02</span><h3>Design and engineering side by side</h3><p>No handoff walls, and both get equal care.</p></div>
            <div className="kc"><span>03</span><h3>Open by default</h3><p>Architecture, trade-offs and decisions are visible to everyone on the team.</p></div>
          </div>
        </div>
      </section>
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="w">
          <p className="ey">02 / Areas we hire in</p>
          <h2>Where you could fit</h2>
          <p className="nt3">Demo roles, shown as placeholders until real openings exist.</p>
          <div className="kg k2">
            {ROLES.map(([ic, t, p, subj]) => (
              <div className="kc" key={t}>
                <Kic d={IC[ic]} /><h3>{t}</h3><p>{p}</p>
                <a className="b ap" href={`mailto:careers@decacorpus.com?subject=Interest%20in%20${subj}`}>Apply</a>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="w">
          <div className="mp cl3">
            <div>
              <h2>Don’t see your role? <em className="sf">Write to us anyway.</em></h2>
              <p className="smn">This is an open invitation to connect, not a list of confirmed open roles.</p>
            </div>
            <a className="mb" href="mailto:careers@decacorpus.com">careers@decacorpus.com ↗</a>
          </div>
        </div>
      </section>
    </>
  );
}

/* Contact: 6-step wizard. Answers live in rt.ans and survive page changes, as in the prototype. */
function Wizard() {
  const { pick } = useStore();
  const [qn, setQn] = useState(0);
  const [done, setDone] = useState(false);
  const inp = useRef(null), focusNext = useRef(false);
  const q = Q[qn];

  useEffect(() => {
    if (focusNext.current && inp.current) inp.current.focus({ preventScroll: true });
    focusNext.current = false;
  }, [qn]);

  const save = () => { rt.ans[qn] = inp.current ? inp.current.value : ""; };
  const next = () => {
    save();
    if (qn < 5) { focusNext.current = true; setQn(qn + 1); }
    else { setDone(true); sendContact(rt.ans); }
  };
  const prev = () => { save(); if (qn > 0) setQn(qn - 1); };

  if (done) {
    return (
      <form className="fp" id="fm" noValidate onSubmit={(e) => e.preventDefault()}>
        <h3 style={{ fontSize: 34 }}>Thanks{rt.ans[0] ? ", " + rt.ans[0] : ""}. We’ll be in touch.</h3>
        <p style={{ marginTop: 12 }}>This prototype doesn’t send messages yet.</p>
      </form>
    );
  }
  return (
    <form className="fp" id="fm" noValidate onSubmit={(e) => { e.preventDefault(); next(); }}>
      <div className="hr"><span id="cnt">0{qn + 1} / 06</span></div>
      <div className="seg" id="seg">{Q.map((_, i) => <i key={i} className={i <= qn ? "on" : ""}></i>)}</div>
      <div id="q" key={qn}>
        <h3>{q[0]}</h3>
        <label htmlFor="a">{q[1]}</label>
        <input id="a" ref={inp} type={q[4]} placeholder={q[2]} defaultValue={rt.ans[qn] || (qn === 3 ? SV[pick][2] : "")} autoComplete="off" />
      </div>
      <div className="nv">
        <button type="button" className="pvb" id="pv2" disabled={qn === 0} onClick={prev}>← Previous</button>
        <button type="button" className="b" id="nx2" onClick={next}>{qn === 5 ? "Send" : "Next"}</button>
      </div>
    </form>
  );
}

export function Contact() {
  return (
    <section className="sec pg1 pgc">
      <div className="w">
        <p className="ey">01 / Contact</p>
        <h1>Let’s make it <em className="sf">real.</em></h1>
        <div className="cc">
          <div>
            <h3>A good system starts with a good conversation.</h3>
            <div className="l2"><p className="ey">Prefer email?</p><a href="mailto:hello@decacorpus.com">hello@decacorpus.com</a></div>
          </div>
          <Wizard />
        </div>
      </div>
    </section>
  );
}
