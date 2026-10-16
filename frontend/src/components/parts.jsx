// Shared blocks used by several pages: cta(), dash(), SVC(), cards() and the service icons.
import React, { useState } from "react";
import { AR, ARR, CARD_CAPTIONS, IMGS, SI, SV } from "../data/content";
import { R } from "./shell";

const svgProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" };

/* Inline SVG icon from raw path markup (SI and the page icons are kept verbatim from the source). */
export const Ico = ({ d, sw = 1.5, className }) => (
  <svg className={className} {...svgProps} strokeWidth={sw} dangerouslySetInnerHTML={{ __html: d }} />
);

/* Closing CTA band */
export const Cta = () => (
  <section className="sec cta2 lm">
    <div className="w">
      <p className="ey">Let’s build what’s next</p>
      <h2>Have something to build?<br />Let’s make it <em className="sf">real.</em></h2>
      <div className="cr">
        <a className="b" href="#/contact">Start a Project</a>
        <a className="ml" href="mailto:hello@decacorpus.com"><R>hello@decacorpus.com</R></a>
      </div>
    </div>
  </section>
);

/* Care / OS dashboard. variant="slide" is the scaled copy in hero slide 2 (static KPIs, no reveal). */
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const HS = [38, 58, 44, 74, 100, 62, 42];
const TABS = ["Overview", "Patients", "Appointments", "Workflows", "Analytics"];
const KPI = [[128, "Active records"], [24, "Appointments"], [8, "Follow-ups"]];

export function Dash({ variant }) {
  const slide = variant === "slide";
  const [tab, setTab] = useState(0);
  const [sel, setSel] = useState(4);
  const onClick = (e) => {
    const b = e.target.closest("aside button");
    if (!b) return;
    const t = +b.dataset.t;
    setTab(t);
    setSel((t * 2 + 1) % 7);
  };
  const onMove = (e) => {
    const d = e.currentTarget, r = d.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    d.style.transform = `rotateY(${x * 5}deg) rotateX(${-y * 4}deg)`;
  };
  const onLeave = (e) => { e.currentTarget.style.transform = ""; };
  return (
    <div className={slide ? "cos" : "cos rv"} data-cur="Live view" onClick={onClick} onMouseMove={onMove} onMouseLeave={onLeave}>
      <aside>
        <b>Care / OS</b>
        {TABS.map((x, i) => <button key={x} className={i === tab ? "on" : ""} data-t={i}>{x}</button>)}
        <small>Concept workspace</small>
      </aside>
      <div>
        <div className="hd2">
          <div><h4>Care, connected.</h4><span className="mu">Concept preview / sample data</span></div>
          <span className="chip2">Demo workspace</span>
        </div>
        <div className="k3">
          {KPI.map(([n, l]) => (
            <div key={l}>{slide ? <b>{String(n).padStart(n < 10 ? 2 : 1, "0")}</b> : <b data-n={n}>0</b>}{l}</div>
          ))}
        </div>
        <div className="g2">
          <div className="ca">
            <div><span>Care activity</span><span className="mu">Sample week</span></div>
            <div className="bc" id={slide ? undefined : "bc"} key={sel}>
              {DAYS.map((d, i) => (
                <div key={i}><i className={i === sel ? "d" : ""} style={{ "--h": HS[i] + "%" }} title="Sample day"></i>{d}</div>
              ))}
            </div>
          </div>
          <div className="nw">
            <p>Next in the workflow</p>
            <ul>
              <li>Appointment reminder<span>Ready</span></li>
              <li>Post-visit check-in<span>Ready</span></li>
              <li>Record review<span>Review</span></li>
            </ul>
            <span className="mu" style={{ textTransform: "none", letterSpacing: 0 }}>Illustrative workflow states</span>
          </div>
        </div>
        <div className="pw">
          <p>Patient workflow</p>
          <div className="h"><span>Record</span><span>Next action</span><span>Status</span></div>
          <div><span>Sample 01</span><span>Intake review</span><span>Review</span></div>
          <div><span>Sample 02</span><span>Visit reminder</span><span>Queued</span></div>
          <div><span>Sample 03</span><span>Care follow-up</span><span>Scheduled</span></div>
        </div>
      </div>
    </div>
  );
}

/* Service tiles (7 + the cream "Not sure where to start?" card) */
export const Svc = () => (
  <>
    {SV.map((s, i) => (
      <button key={i} className="sv rv" style={{ "--dl": i * .06 + "s" }} data-s={i} data-cur="Open">
        <span className="sv-t"><Ico className="sv-ic" d={SI[i]} sw={1.4} /><span className="sv-no">0{i + 1}</span></span>
        <span className="sv-b"><h3>{s[0]}</h3><p>{s[1]}</p></span>
        <span className="sv-ar">{ARR}</span>
      </button>
    ))}
    <a className="sv sv-cta rv" style={{ "--dl": ".42s" }} href="#/contact" data-cur="Go">
      <span className="sv-t"><span className="sv-no">08</span></span>
      <span className="sv-b"><h3>Not sure where to start?</h3><p>Tell us what you’re building.</p></span>
      <span className="sv-ar">{ARR}</span>
    </a>
  </>
);

/* Article preview cards. The Insights filter toggles .hide imperatively so the reveal's .vis class survives. */
export const Cards = () => (
  <div className="cs">
    {AR.map((a, i) => (
      <div key={i} className="cd rv" data-k={a[3]} tabIndex={0} data-cur="Preview">
        <div className="th">
          <img src={IMGS[i % 2][0]} alt={IMGS[i % 2][1]} loading="lazy" />
          <small className="a">{CARD_CAPTIONS[i ? 1 : 0]}</small>
          <small className="c">{ARR}</small>
        </div>
        <div className="mt"><span>{a[1]}</span></div>
        <h3>{a[0]}</h3>
        <p>{a[2]}</p>
      </div>
    ))}
  </div>
);
