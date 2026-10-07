import { resolveHandbookPortrait } from "../shared/handbookPortraits.js";

export default function MatchCharacterPortrait({ character, user, avatar = false, framed = false }) {
  const portrait = resolveHandbookPortrait(character, { user, itemEffects: user.itemEffects });
  if (!portrait.isStandard) return <img src={portrait.src} style={portrait.style} alt={character.name} />;
  const width = avatar ? portrait.headWidth * 1.45 : portrait.cropWidth;
  // Match the taller photo window so raising it does not also zoom the face.
  const cropHeight = framed ? width * (0.72 * 4 / 3 / 0.82) : width;
  const x = portrait.focal[0] - width / 2;
  const y = Math.max(0, portrait.focal[1] - width * (avatar ? .45 : .32));
  return <svg className="match-character-portrait" viewBox={`${x} ${y} ${width} ${cropHeight}`} preserveAspectRatio={framed ? "xMidYMid slice" : "xMidYMid meet"} role="img" aria-label={character.name}>
    <image href={portrait.src} width={portrait.width} height={portrait.height} />
  </svg>;
}
