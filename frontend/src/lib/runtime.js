// Shared, non-React runtime state. The prototype keeps these as module-level variables,
// and several of them deliberately survive page changes (film timer, contact answers).

export const rm = matchMedia("(prefers-reduced-motion:reduce)").matches;

let pi = 0;
try { pi = +localStorage.getItem("dc_pick") || 0; } catch (e) {}

export const rt = {
  ln: null,      // Lenis instance (null when reduced motion or not loaded)
  pi,            // picked service index (dc_pick)
  oa: 0,         // wheel accumulation for the next-page bar
  fs: 0,         // studio film timer seconds
  ans: [],       // contact wizard answers (persist across visits, as in the prototype)
  lastF: null,   // element that opened the drawer
};

const subs = new Set();
export const onScroll = (fn) => { subs.add(fn); return () => subs.delete(fn); };
export const emitScroll = () => subs.forEach((f) => f());

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const routeKey = () => {
  const k = location.hash.replace(/^#\/?/, "");
  return ["home", "services", "work", "studio", "insights", "careers", "contact"].includes(k) ? k : "home";
};
