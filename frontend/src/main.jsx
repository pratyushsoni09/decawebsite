import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { StoreProvider } from "./lib/store.jsx";
import "./styles/prototype.css";
import "./styles/work.css";

// No StrictMode: its double-mounted effects would run the loader, canvas and cursor twice,
// which the prototype never does.
ReactDOM.createRoot(document.getElementById("root")).render(
  <StoreProvider>
    <App />
  </StoreProvider>,
);
