import { createRoot } from "react-dom/client";
import AppErrorBoundary from "./app/AppErrorBoundary.jsx";
import { startSiteEntry } from "./app/siteEntryBootstrap.js";
import "./styles.css";

const root = document.getElementById("root");
void startSiteEntry({
  root,
  loadApplication: () => import("./app/App.jsx"),
  mountApplication: ({ default: App }, { characters, siteSettings }) => {
    createRoot(root).render(
      <AppErrorBoundary>
        <App initialCharacters={characters} initialSiteSettings={siteSettings} />
      </AppErrorBoundary>
    );
  }
});
