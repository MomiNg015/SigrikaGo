import { canonicalCharacterId } from "./characterAliases.js";

export function chainCountForCharacter(user, characterId) {
  const id = canonicalCharacterId(characterId);
  const chains = user?.characterChains ?? {};
  return Math.max(0, Number(chains[id] ?? chains[characterId] ?? 0) || 0);
}

export default function CharacterChainBadge() {
  return null;
}
