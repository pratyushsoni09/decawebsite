import { useCallback, useEffect, useState } from "react";
import { IntroLoader } from "../components/home/IntroLoader";
import { SiteHeader } from "../components/home/SiteHeader";
import { Hero } from "../components/home/Hero";
import { Overview } from "../components/home/Overview";
import { RoomsWalk } from "../components/home/RoomsWalk";
import { FloorPlans } from "../components/home/FloorPlans";
import { Gallery } from "../components/home/Gallery";
import { TourCta } from "../components/home/TourCta";
import { Enquiry } from "../components/home/Enquiry";
import { SiteFooter } from "../components/home/SiteFooter";
import { useReveal } from "../hooks/useReveal";

const PRELOAD = ["/images/hero-sketch.webp", "/images/facade-golden.webp", "/images/drawing.webp"];
let introShown = false;

export default function Home() {
  const [ready, setReady] = useState(introShown);
  const done = useCallback(() => {
    introShown = true;
    setReady(true);
  }, []);
  useReveal([ready]);

  useEffect(() => {
    document.title = "Haven — The Oak Mansion · A walkable 3D residence";
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      {!introShown && <IntroLoader images={PRELOAD} onDone={done} />}
      <SiteHeader />
      <main id="main">
        <Hero start={ready} />
        <Overview />
        <RoomsWalk />
        <FloorPlans />
        <Gallery />
        <TourCta />
        <Enquiry />
      </main>
      <SiteFooter />
    </>
  );
}
