import React from "react";
import { createRoot } from "react-dom/client";
import Board from "../../../../src/room/Board.jsx";
import { createPoints } from "../../../../src/shared/game.js";
import "../../../../src/styles.css";
import "./preview.css";

const size = 13;
const effectPointId = new URLSearchParams(window.location.search).get("point") ?? "6,6";
const points = createPoints(size).map((point) => {
  if (point.id === effectPointId) return { ...point, stone: "black" };
  if (point.id === "4,5" || point.id === "8,7") return { ...point, stone: "white" };
  if (point.id === "5,8" || point.id === "7,4") return { ...point, stone: "black" };
  return point;
});

function Preview() {
  return (
    <div className="app-shell player-theme-enabled theme-bright-school theme-bright-school">
      <main className={`rainbow-preview room-screen ${window.innerWidth <= 768 ? "mobile-room-screen" : "desktop-room-screen"}`}>
        <p>爱弥斯 · 彩虹落子模式</p>
        <section className="rainbow-preview__board board-stage">
          <Board
            game={{
              phase: "playing",
              mode: "spark",
              size,
              points,
              history: [{ type: "move", color: "black", id: effectPointId, moveNumber: 1 }]
            }}
            showCoords
            showMoves={false}
            pendingSkill={false}
            previewPlayer={null}
            stoneDecorations={{ black: "", white: "" }}
            aemeathRainbowMoveEffect={{ pointId: effectPointId, key: "qa:aemeath:6,6" }}
            onPoint={() => {}}
            onScoringPoint={null}
            onNeutral={() => {}}
          />
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Preview />);
