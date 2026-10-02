import { CHARACTERS } from "../shared/characters.js";
import { findCharacter } from "../shared/characterDisplay.js";
import { COLORS, createGameState, opponent } from "../shared/game.js";

const DEFAULT_PLAYER_CHARACTER_ID = "";
const DEFAULT_NPC_CHARACTER_ID = "denia";
const TUTORIAL_TIME = Object.freeze({ main: 0, byoYomi: 30, periodRemaining: 30, periods: 0 });

export function tutorialPlayersForSetup(node = {}, user = {}, characters = CHARACTERS) {
  const playerColor = normalizeColor(node.playerColor) ?? COLORS.black;
  const npcColor = opponent(playerColor);
  const playerCharacterId = String(node.playerCharacterId ?? DEFAULT_PLAYER_CHARACTER_ID).trim();
  const npcCharacterId = String(node.npcCharacterId ?? node.characterId ?? DEFAULT_NPC_CHARACTER_ID).trim() || DEFAULT_NPC_CHARACTER_ID;
  return [
    tutorialPlayer({
      color: playerColor,
      user: {
        ...(user ?? {}),
        id: user?.id ?? "tutorial-player",
        username: user?.username ?? "Player",
        rank: "",
        rating: ""
      },
      characterId: playerCharacterId,
      characters
    }),
    tutorialPlayer({
      color: npcColor,
      user: {
        id: "tutorial-npc",
        username: node.npcName || findCharacter(characters, npcCharacterId).name || "NPC",
        rank: "NPC",
        rating: ""
      },
      characterId: npcCharacterId,
      characters
    })
  ];
}

export function createTutorialBattleRoom({ code = "TUTORIAL", game, players, scriptTitle = "剧情教学", chat = [] } = {}) {
  const resolvedPlayers = syncPlayersFromGame(players, game);
  return {
    code,
    title: scriptTitle,
    mode: game?.mode ?? "spark",
    role: "player",
    players: resolvedPlayers,
    spectators: [],
    spectatorCount: 0,
    chat,
    game: {
      ...(game ?? createGameState(resolvedPlayers)),
      players: resolvedPlayers
    }
  };
}

export function setupNodeEntryText(node = {}) {
  return String(node.entryText ?? node.prompt ?? "").trim();
}

function tutorialPlayer({ color, user, characterId, characters }) {
  const hasCharacter = Boolean(characterId);
  const character = hasCharacter ? findCharacter(characters, characterId) : null;
  return {
    color,
    user,
    characterId: hasCharacter ? character.id : "",
    character,
    captures: 0,
    skillRemovals: 0,
    connected: true,
    time: { ...TUTORIAL_TIME },
    isTutorialPlayer: true
  };
}

function syncPlayersFromGame(players = [], game = {}) {
  return players.map((player) => ({
    ...player,
    captures: game.captures?.[player.color] ?? player.captures ?? 0,
    skillRemovals: game.skillRemovals?.[player.color] ?? player.skillRemovals ?? 0,
    time: player.time ?? { ...TUTORIAL_TIME }
  }));
}

function normalizeColor(color) {
  return color === COLORS.black || color === COLORS.white ? color : null;
}
