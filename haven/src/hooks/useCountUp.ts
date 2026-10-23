import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./useReveal";

/** Counts from 0 to `target` the first time the element becomes visible. */
export function useCountUp<T extends HTMLElement>(target: number, decimals = 0, duration = 1400) {
  const ref = useRef<T>(null);
  const [value, setValue] = useState(prefersReducedMotion() ? target : 0);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(+(target * eased).toFixed(decimals));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target, decimals, duration]);
  return { ref, value };
}
