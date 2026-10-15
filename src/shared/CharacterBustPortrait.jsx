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
  battleForm = null,
  variant = "profile",
  alt = character?.name ?? "",
  loading = "eager",
}) {
  const portrait = resolveHandbookPortrait(character, { user, itemEffects, equippedCostumes, costumeSnapshot, chibi: true, battleForm });
  return <BustImage key={`${portrait.isStandard ? "standard" : "authored"}:${portrait.src}`}
    portrait={portrait} variant={variant} alt={alt} loading={loading} />;
}

function BustImage({ portrait, variant, alt, loading }) {
  const [failed, setFailed] = useState(false);
  const standard = portrait.isStandard && !failed;
  const compactHead = portrait.isChibi && variant === "profile";
  const src = failed ? portrait.fallbackSrc : compactHead ? portrait.src.replace(/\.webp$/, "-avatar.webp") : portrait.src;
  const centered = compactHead || variant === "team";
  const faceFraction = variant === "team" ? .72 : variant === "student-id" ? .64 : .58;
  const cropWidth = standard
    ? variant === "student-id" ? portrait.headWidth / faceFraction : Math.max(portrait.cropWidth, portrait.headWidth / faceFraction)
    : null;
  const artStyle = standard ? {
    "--character-bust-width": portrait.isChibi ? compactHead ? "100%" : "94%" : `${portrait.width / cropWidth * 100}%`,
    "--character-bust-anchor-x": portrait.isChibi ? "-50%" : `${-portrait.focal[0] / portrait.width * 100}%`,
    ...(portrait.isChibi ? { "--character-bust-top": centered ? "50%" : "4%", "--character-bust-anchor-y": centered ? "-50%" : "0%" } : {}),
    "--character-bust-ratio": compactHead ? "1 / 1" : `${portrait.width} / ${portrait.height}`,
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
          {...(standard ? { width: compactHead ? 512 : portrait.width, height: compactHead ? 512 : portrait.height } : {})}
          onError={() => {
            if (standard && portrait.fallbackSrc && portrait.fallbackSrc !== portrait.src) setFailed(true);
          }}
        />
      </span>
    </span>
  );
}
