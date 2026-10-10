import { useState } from "react";
import { resolveResultCharacterPortrait } from "../../shared/resultCharacterPortraits.js";

export default function ResultCharacterPortrait({ character, outcome, ...options }) {
  const portrait = resolveResultCharacterPortrait(character, { outcome, ...options });
  return <PortraitImage key={portrait.src} portrait={portrait} name={character.name} />;
}

function PortraitImage({ portrait, name }) {
  const [failed, setFailed] = useState(false);
  const current = failed ? portrait.fallback : portrait;
  return <img className="result-player-portrait-image" src={current.src} style={current.style}
    data-result-expression={failed ? undefined : portrait.expressionId || undefined}
    alt={name} onError={!failed && portrait.src !== portrait.fallback.src ? () => setFailed(true) : undefined} />;
}
