import { useState } from "react";
import { resolveHandbookPortrait } from "./handbookPortraits.js";

// Identity surfaces share the handbook's appearance resolver and landmarks.
// Only registered standard sprites are cropped; authored costume framing stays intact.
export default function CharacterBustPortrait({
  character,
  user = null,
  itemEffects = user?.itemEffects,
  equippedCostumes = null,
  costumeSnapshot = null,
  variant = "profile",
  alt = character?.name ?? "",
  loading = "eager",
}) {
  const portrait = resolveHandbookPortrait(character, { user, itemEffects, equippedCostumes, costumeSnapshot });
  return <BustImage key={`${portrait.isStandard ? "standard" : "authored"}:${portrait.src}`}
    portrait={portrait} variant={variant} alt={alt} loading={loading} />;
}

function BustImage({ portrait, variant, alt, loading }) {
  const [failed, setFailed] = useState(false);
  const standard = portrait.isStandard && !failed;
  const src = failed ? portrait.fallbackSrc : portrait.src;
  const faceFraction = variant === "team" ? .46 : variant === "student-id" ? .64 : .58;
  const cropWidth = standard
    ? variant === "student-id" ? portrait.headWidth / faceFraction : Math.max(portrait.cropWidth, portrait.headWidth / faceFraction)
    : null;
  const artStyle = standard ? {
    "--character-bust-width": `${portrait.width / cropWidth * 100}%`,
    "--character-bust-anchor-x": `${-portrait.focal[0] / portrait.width * 100}%`,
    "--character-bust-ratio": `${portrait.width} / ${portrait.height}`,
  } : portrait.style;

  return (
    <span className="character-bust-portrait" data-standard={standard ? "true" : "false"} data-variant={variant}>
      <span className="character-bust-art" style={artStyle}>
        <img
          className="character-bust-image"
          src={src || undefined}
          alt={alt}
          loading={loading}
          decoding="async"
          {...(standard ? { width: portrait.width, height: portrait.height } : {})}
          onError={() => {
            if (standard && portrait.fallbackSrc && portrait.fallbackSrc !== portrait.src) setFailed(true);
          }}
        />
      </span>
    </span>
  );
}
