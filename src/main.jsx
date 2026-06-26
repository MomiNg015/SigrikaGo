import { createRoot } from "react-dom/client";
import AppErrorBoundary from "./app/AppErrorBoundary.jsx";
import App from "./app/App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
