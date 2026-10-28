import React from "react";
import { createRoot } from "react-dom/client";
import AchievementModal from "/src/modals/AchievementModal.jsx";
import AdminAchievements from "/src/admin/AdminAchievements.jsx";
import "/src/styles.css";
import "/src/styles/admin.css";

document.documentElement.dataset.theme = "bright-school";
const mode = new URLSearchParams(location.search).get("mode");
const Component = mode === "admin" ? AdminAchievements : AchievementModal;
createRoot(document.getElementById("root")).render(<div className="app-shell player-theme-enabled theme-bright-school" style={{ minHeight: "100dvh" }}>
  <Component token="fixture" onClose={() => {}} onNotice={() => {}} />
</div>);
