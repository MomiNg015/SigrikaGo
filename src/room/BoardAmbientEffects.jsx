import { memo } from "react";

export function hasColorIllusionFog(game) {
  return Object.values(game?.passives ?? {}).some((passive) => passive?.colorIllusion?.active);
}

function BoardAmbientEffects({ active = false, effectsEnabled = true }) {
  const ambientVisible = active && effectsEnabled !== false;

  return (
    <div
      className="board-ambient-layer"
      data-ambient-effect={ambientVisible ? "color-illusion-desaturate" : ""}
      aria-hidden="true"
    >
      {ambientVisible && (
        <span className="color-illusion-desaturate-wave" />
      )}
    </div>
  );
}

export default memo(BoardAmbientEffects);
