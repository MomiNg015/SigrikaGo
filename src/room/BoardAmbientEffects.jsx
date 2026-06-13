import { memo } from "react";

export function hasColorIllusionFog(game) {
  return Object.values(game?.passives ?? {}).some((passive) => passive?.colorIllusion?.active);
}

function BoardAmbientEffects({ active = false }) {
  return (
    <div
      className="board-ambient-layer"
      data-ambient-effect={active ? "color-illusion-fog" : ""}
      aria-hidden="true"
    >
      {active && (
        <>
          <span className="fog-cloud fog-cloud-a" />
          <span className="fog-cloud fog-cloud-b" />
          <span className="fog-cloud fog-cloud-c" />
          <span className="fog-cloud fog-cloud-d" />
        </>
      )}
    </div>
  );
}

export default memo(BoardAmbientEffects);
