import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Board from "/src/room/Board.jsx";
import BoardSkillEffects from "/src/room/BoardSkillEffects.jsx";
import { VOYAGE_STAR_WHITEOUT_RESOLUTION_PROGRESS } from "/src/shared/skillPresentation.js";
import "/src/styles/room/board.css";
import "/src/styles/room/board/effects-canvas-motion.css";

const BOARD_SIZE = 13;

function CaptureHarness() {
  const [plan, setPlan] = useState(null);
  const [resolved, setResolved] = useState(false);
  const resolutionTimerRef = useRef(0);
  const pointNodes = useMemo(() => {
    const nodes = [];
    for (let y = 0; y < BOARD_SIZE; y += 1) {
      for (let x = 0; x < BOARD_SIZE; x += 1) {
        const id = `${x},${y}`;
        nodes.push(
          <span
            aria-hidden="true"
            className="point"
            data-point-id={id}
            key={id}
            style={{
              left: `${((x + 0.5) / BOARD_SIZE) * 100}%`,
              top: `${((y + 0.5) / BOARD_SIZE) * 100}%`
            }}
          />
        );
      }
    }
    return nodes;
  }, []);

  useEffect(() => {
    window.__skillGifCapture = {
      play(nextPlan) {
        window.clearTimeout(resolutionTimerRef.current);
        setResolved(false);
        setPlan({ ...nextPlan, nonce: Date.now() });
        const resolutionDelayMs = skillGifResolutionDelayMs(nextPlan.pendingSkill);
        if (resolutionDelayMs !== null) {
          resolutionTimerRef.current = window.setTimeout(() => setResolved(true), resolutionDelayMs);
        }
      }
    };
  }, []);

  const activePendingSkill = plan?.pendingSkill && !resolved ? {
    ...plan.pendingSkill,
    id: `${plan.pendingSkill.id}-${plan.nonce}`
  } : null;
  const displayPendingSkill = plan?.pendingSkill ? {
    ...plan.pendingSkill,
    id: `${plan.pendingSkill.id}-${plan.nonce}`
  } : null;
  const className = [
    "skill-gif-stage",
    plan?.theme === "board" ? "skill-gif-board-theme" : "skill-gif-black-theme"
  ].join(" ");

  if (!plan) return <main className="skill-gif-stage skill-gif-black-theme" />;

  return (
    <main className={className} style={{ "--capture-size": `${plan.size}px` }}>
      {plan.harness === "board" ? (
        <Board
          game={mockGameForPlan({ ...plan, pendingSkill: activePendingSkill, sourcePendingSkill: displayPendingSkill, resolved })}
          showCoords={false}
          showMoves={false}
          pendingSkill={activePendingSkill}
          audioSettings={mutedAudioSettings}
          skillEffectsEnabled
          onPoint={() => {}}
          onScoringPoint={null}
          onNeutral={() => {}}
          onBoardSurface={() => {}}
        />
      ) : (
        <section
          className="skill-gif-effect-host board-wrap"
          data-board-size={BOARD_SIZE}
          style={{ "--size": BOARD_SIZE }}
        >
          {pointNodes}
          <BoardSkillEffects
            boardSize={BOARD_SIZE}
            pendingSkill={displayPendingSkill}
            audioSettings={mutedAudioSettings}
            prewarm={false}
            effectsEnabled
          />
        </section>
      )}
    </main>
  );
}

const mutedAudioSettings = Object.freeze({
  master: 0,
  bgm: 0,
  sfx: 0,
  voice: 0,
  muted: { master: true, bgm: true, sfx: true, voice: true }
});

function skillGifResolutionDelayMs(pendingSkill) {
  const bannerDurationMs = Number(pendingSkill.bannerDurationMs ?? 2000);
  const boardEffectDurationMs = Number(pendingSkill.boardEffectDurationMs ?? 1800);
  if (pendingSkill?.effectType === "row-slash") return bannerDurationMs + 760;
  if (pendingSkill?.effectType !== "voyage-star") return null;
  return bannerDurationMs + Math.round(boardEffectDurationMs * VOYAGE_STAR_WHITEOUT_RESOLUTION_PROGRESS);
}

function mockGameForPlan(plan) {
  const pendingSkill = plan.pendingSkill;
  const resolvedVoyageStar = plan.resolved && plan.effectType === "voyage-star";
  const resolvedRowSlash = plan.resolved && plan.effectType === "row-slash";
  const voyageStarIds = resolvedVoyageStar
    ? new Set(Array.isArray(plan.sourcePendingSkill?.affectedPointIds) ? plan.sourcePendingSkill.affectedPointIds : [])
    : new Set();
  const voyageStarCenterId = resolvedVoyageStar ? plan.targetId : "";
  const rowSlashIds = resolvedRowSlash
    ? new Set(Array.isArray(plan.sourcePendingSkill?.affectedPointIds) ? plan.sourcePendingSkill.affectedPointIds : [])
    : new Set();
  const rowSlashY = resolvedRowSlash ? Number(plan.sourcePendingSkill?.row) : null;
  const points = [];
  const stones = stoneMapForSkill(pendingSkill);
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const id = `${x},${y}`;
      const voyageStarErased = voyageStarIds.has(id);
      const rowSlashRemoved = rowSlashIds.has(id);
      points.push({
        id,
        x,
        y,
        valid: !voyageStarErased,
        stone: voyageStarErased || rowSlashRemoved ? null : stones.get(id) ?? null,
        skillEffect: voyageStarErased
          ? id === voyageStarCenterId ? "voyage-star-crater-point" : "voyage-star-erased-point"
          : null,
        skillEffectOwner: voyageStarErased ? "black" : null
      });
    }
  }
  return {
    size: BOARD_SIZE,
    mode: "spark",
    phase: "skill-preview",
    points,
    pendingSkill,
    history: resolvedVoyageStar ? [{
      type: "skill",
      effectType: "voyage-star",
      id: voyageStarCenterId,
      color: "black"
    }] : [],
    rowEffects: resolvedRowSlash && Number.isInteger(rowSlashY) ? [{
      effectType: "row-slash",
      owner: "black",
      clearAfterColor: "white",
      y: rowSlashY,
      id: plan.targetId
    }] : [],
    skillEnabled: true,
    libertyPurgeMarks: [],
    scoring: {},
    passives: {}
  };
}

function stoneMapForSkill(pendingSkill) {
  const stones = new Map();
  const affected = Array.isArray(pendingSkill?.affectedPointIds) ? pendingSkill.affectedPointIds : [];
  if (pendingSkill?.effectType === "row-slash") {
    for (const [index, pointId] of affected.entries()) {
      if (index % 2 === 0) stones.set(pointId, index % 4 === 0 ? "black" : "white");
    }
  } else if (pendingSkill?.effectType === "flip-stone" || pendingSkill?.effectType === "spray-stone") {
    stones.set(pendingSkill.targetId, "white");
  } else if (pendingSkill?.effectType === "random-blast" || pendingSkill?.effectType === "voyage-star") {
    for (const [index, pointId] of affected.entries()) stones.set(pointId, index % 2 ? "white" : "black");
  }
  return stones;
}

createRoot(document.getElementById("root")).render(<CaptureHarness />);

const style = document.createElement("style");
style.textContent = `
  html,
  body,
  #root {
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
    background: #000;
  }

  .skill-gif-stage {
    width: var(--capture-size, 720px);
    height: var(--capture-size, 720px);
    position: relative;
    overflow: hidden;
    background: #000;
  }

  .skill-gif-effect-host,
  .skill-gif-stage .board-wrap,
  .skill-gif-stage .board {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .skill-gif-effect-host .point {
    position: absolute;
    width: 2px;
    height: 2px;
    transform: translate(-50%, -50%);
    pointer-events: none;
    opacity: 0;
  }

  .skill-gif-stage .board-wrap {
    display: block;
    padding: 0;
    margin: 0;
  }

  .skill-gif-stage .board {
    margin: 0;
    aspect-ratio: 1;
  }

  .skill-gif-effect-host.board-wrap {
    display: block;
    padding: 0;
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    background: var(--board-wood-texture);
  }

  .skill-gif-black-theme .board {
    background: transparent !important;
    box-shadow: none !important;
    border: 0 !important;
  }

  .skill-gif-black-theme .board-lines,
  .skill-gif-black-theme .point.star::before,
  .skill-gif-black-theme .point .stone {
    opacity: 0 !important;
  }

  .skill-gif-black-theme .point {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
  }

  .board-effects-layer,
  .board-effects-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
`;
document.head.appendChild(style);
