import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "normalize.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import { OverlaysProvider } from "@blueprintjs/core";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <OverlaysProvider>
      <App />
    </OverlaysProvider>
  </React.StrictMode>
);
