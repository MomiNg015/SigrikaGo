import React from "react";
import { createRoot } from "react-dom/client";
import OpeningModal from "../../../../src/modals/gameLifecycle/OpeningModal.jsx";
import ResultModal from "../../../../src/modals/gameLifecycle/ResultModal.jsx";
import { COLORS } from "../../../../src/shared/game.js";
import "../../../../src/styles.css";

const view = new URLSearchParams(window.location.search).get("view") ?? "opening";

const resultRoom = {
  rated: false,
  matchSource: "sigrika-corruption-duel",
  sigrikaCandyDuel: { musicStarted: true },
  players: [
    { user: { id: "preview-user", username: "玩家" }, color: COLORS.black, characterId: null },
    { user: { id: "preview-bot", username: "西格莉卡？", isBot: true }, color: COLORS.white, characterId: null }
  ],
  game: { winner: { winnerColor: COLORS.black, text: "黑胜" } }
};

function Preview() {
  if (view === "result") {
    return (
      <div className="app-shell player-theme-enabled theme-bright-school is-sigrika-corrupted">
        <ResultModal
          room={resultRoom}
          user={{ id: "preview-user" }}
          characters={{}}
          audioSettings={{}}
          onClose={() => {}}
          onSpecialContinue={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="app-shell player-theme-enabled theme-bright-school theme-bright-school is-sigrika-corrupted">
      <div className="room-screen sigrika-candy-duel-room">
        <OpeningModal
          room={{
            sigrikaCandyDuel: { musicStarted: false },
            openingEndsAt: Date.now() + 30_000
          }}
          player={{ color: COLORS.black }}
        />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Preview />);
