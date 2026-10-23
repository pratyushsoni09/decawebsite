import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";

const Tour = lazy(() => import("./pages/Tour"));
const Studio = lazy(() => import("./pages/Studio"));

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tour" element={<Tour />} />
        {import.meta.env.DEV && <Route path="/studio" element={<Studio />} />}
        <Route path="*" element={<Home />} />
      </Routes>
    </Suspense>
  );
}
