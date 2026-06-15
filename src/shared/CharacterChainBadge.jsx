import { canonicalCharacterId } from "./characterAliases.js";

export function chainCountForCharacter(user, characterId) {
  const id = canonicalCharacterId(characterId);
  const chains = user?.characterChains ?? {};
  return Math.max(0, Number(chains[id] ?? chains[characterId] ?? 0) || 0);
}

export default function CharacterChainBadge({ user, characterId, className = "" }) {
  const count = chainCountForCharacter(user, characterId);
  if (count <= 0) return null;
  return (
    <span
      className={`character-chain-badge ${className}`.trim()}
      data-chain-count={count}
      title={`角色链数 ${count}`}
      aria-label={`角色链数 ${count}`}
    >
      {count > 5 ? `★×${count}` : "★".repeat(count)}
    </span>
  );
}
