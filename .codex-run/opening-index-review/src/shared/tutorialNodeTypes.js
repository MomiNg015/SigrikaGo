export const TUTORIAL_NODE_TYPES = Object.freeze({
  story: "story",
  boardSetup: "board-setup",
  npcDialogue: "npc-dialogue",
  playerChoice: "player-choice",
  playerMove: "player-move",
  npcMove: "npc-move",
  playerSkill: "player-skill",
  npcSkill: "npc-skill",
  countingStart: "counting-start",
  markDead: "mark-dead",
  markNeutral: "mark-neutral",
  countingConfirm: "counting-confirm",
  resign: "resign"
});

export const TUTORIAL_NODE_TYPE_VALUES = Object.freeze(Object.values(TUTORIAL_NODE_TYPES));

export function normalizeTutorialNodeType(value) {
  const type = String(value ?? "").trim() || TUTORIAL_NODE_TYPES.story;
  return TUTORIAL_NODE_TYPE_VALUES.includes(type) ? type : null;
}

export function isStoryNodeType(type) {
  return (String(type ?? "").trim() || TUTORIAL_NODE_TYPES.story) === TUTORIAL_NODE_TYPES.story;
}

export function isTutorialNpcNodeType(type) {
  return [
    TUTORIAL_NODE_TYPES.npcDialogue,
    TUTORIAL_NODE_TYPES.npcMove,
    TUTORIAL_NODE_TYPES.npcSkill
  ].includes(type);
}

export function isTutorialChoiceNodeType(type) {
  return [
    TUTORIAL_NODE_TYPES.story,
    TUTORIAL_NODE_TYPES.npcDialogue,
    TUTORIAL_NODE_TYPES.playerChoice,
    TUTORIAL_NODE_TYPES.playerMove,
    TUTORIAL_NODE_TYPES.playerSkill,
    TUTORIAL_NODE_TYPES.npcMove,
    TUTORIAL_NODE_TYPES.npcSkill
  ].includes(type);
}

export function nodeTypeRequiresPoint(type) {
  return [
    TUTORIAL_NODE_TYPES.playerMove,
    TUTORIAL_NODE_TYPES.npcMove,
    TUTORIAL_NODE_TYPES.markDead,
    TUTORIAL_NODE_TYPES.markNeutral
  ].includes(type);
}
