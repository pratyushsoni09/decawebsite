import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { NM, T } from "../data/content";
import { $, routeKey, rt } from "./runtime";

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const [page, setPage] = useState(routeKey);
  const [nonce, setNonce] = useState(0); // bumps on every doRoute, even to the same page
  const [pick, setPickState] = useState(rt.pi);
  const [drawer, setDrawer] = useState({ i: null, on: false });
  const [menuOn, setMenuOn] = useState(false);
  const [vt, setVt] = useState({ text: "", cls: "vt" });
  const drawerOn = useRef(false);

  /* personalise: pz(i) */
  const setPick = useCallback((i) => {
    rt.pi = i;
    try { localStorage.setItem("dc_pick", i); } catch (e) {}
    setPickState(i);
  }, []);

  /* drawer: openS / closeS */
  const openS = useCallback((i, from) => {
    rt.lastF = from;
    drawerOn.current = true;
    setDrawer({ i, on: true });
    const dr = $("#dr");
    if (dr) dr.scrollTop = 0;
    rt.ln && rt.ln.stop();
    setTimeout(() => { const x = $("#dx"); x && x.focus(); }, 50);
    setPick(i);
  }, [setPick]);

  // Like the prototype, this runs on every Esc and route change, restoring focus each time.
  const closeS = useCallback(() => {
    drawerOn.current = false;
    setDrawer((d) => ({ ...d, on: false }));
    rt.ln && rt.ln.start();
    rt.lastF && rt.lastF.focus && rt.lastF.focus();
  }, []);

  /* menu: mOpen / mClose */
  const mOpen = useCallback(() => { setMenuOn(true); rt.ln && rt.ln.stop(); }, []);
  const mClose = useCallback(() => {
    setMenuOn(false);
    rt.ln && !drawerOn.current && rt.ln.start();
  }, []);

  /* router: doRoute + route (page curtain) */
  const doRoute = useCallback(() => {
    const k = routeKey();
    closeS();
    mClose();
    rt.oa = 0;
    setPage(k);
    setNonce((n) => n + 1);
    document.title = T[k];
  }, [closeS, mClose]);

  useEffect(() => {
    document.title = T[routeKey()];
    const route = () => {
      const k = location.hash.replace(/^#\/?/, "") || "home";
      setVt({ text: NM[k] || "", cls: "vt in" });
      setTimeout(() => {
        doRoute();
        setVt((v) => ({ ...v, cls: "vt out" }));
        setTimeout(() => setVt((v) => ({ ...v, cls: "vt" })), 700);
      }, 580);
    };
    addEventListener("hashchange", route);
    return () => removeEventListener("hashchange", route);
  }, [doRoute]);

  const value = { page, nonce, pick, setPick, drawer, openS, closeS, menuOn, mOpen, mClose, vt };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
