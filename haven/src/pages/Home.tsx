import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "../components/home/SiteHeader";
import { Hero } from "../components/home/Hero";
import { Overview } from "../components/home/Overview";
import { RoomsWalk } from "../components/home/RoomsWalk";
import { FloorPlans } from "../components/home/FloorPlans";
import { Gallery } from "../components/home/Gallery";
import { Inspiration } from "../components/home/Inspiration";
import { TourCta } from "../components/home/TourCta";
import { Enquiry } from "../components/home/Enquiry";
import { SiteFooter } from "../components/home/SiteFooter";
import { useReveal } from "../hooks/useReveal";


export default function Home() {
  // the hero draws the tower while the page loads, then reports ready
  const [ready, setReady] = useState(false);
  const done = useCallback(() => setReady(true), []);
  useReveal([ready]);

  useEffect(() => {
    document.title = "Haven — The Oak Residences · Walk Residence 11A in 3D";
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader show={ready} />
      <main id="main">
        <Hero onReady={done} />
        <Overview />
        <RoomsWalk />
        <FloorPlans />
        <Gallery />
        <Inspiration />
        <TourCta />
        <Enquiry />
      </main>
      <SiteFooter />
    </>
  );
}
