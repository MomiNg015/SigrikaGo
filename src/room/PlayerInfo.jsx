import { memo, useState } from "react";
import { Sparkles } from "lucide-react";
import { COLORS } from "../shared/game.js";
import { canonicalCharacterId } from "../shared/characterAliases.js";
import { resolveCandyPortrait } from "../shared/candyPortraits.js";
import { findCharacter } from "../shared/characterDisplay.js";
import TimeBar from "./TimeBar.jsx";

export const PLAYER_INFO_TOOLTIPS = {
  skillRemovals: "除子：因技能影响而从棋盘上移除的对方棋子数。数目时+除子*1的数值。",
  overclock: "超频：角色发动技能所造成的代价。数目时-超频*2的数值。"
};

function PlayerInfo({
  player,
  game,
  characters,
  align,
  viewColor = COLORS.black,
  canSwitchView = false,
  onViewColor,
  isWinner = false,
  isActiveTurn = false,
  isDrawResult = false,
  isSkillTargeting = false
}) {
  const [skillDetailOpen, setSkillDetailOpen] = useState(false);
  if (!player) return <aside className="player-info empty" />;
  const character = findCharacter(characters, player.character ?? player.characterId);
  const skillUses = game.skillUses[player.color] ?? 0;
  const skillCost = game.skillCosts?.[player.color] ?? 0;
  const skillRemovals = player.skillRemovals ?? game.skillRemovals?.[player.color] ?? 0;
  const resultBadge = resultBadgeForPlayer(player, game, { isWinner, isDrawResult });
  const disconnectBadge = disconnectBadgeForPlayer(player, game);
  return (
    <aside
      className={`player-info ${align} ${isWinner ? "winner" : ""} ${isActiveTurn ? "active-turn" : ""} ${isDrawResult ? "draw-result" : ""} ${canSwitchView ? "switchable-view" : ""} ${canSwitchView && viewColor === player.color ? "view-selected" : ""}`}
      onClick={canSwitchView ? () => onViewColor?.(player.color) : undefined}
      role={canSwitchView ? "button" : undefined}
      tabIndex={canSwitchView ? 0 : undefined}
      aria-pressed={canSwitchView ? viewColor === player.color : undefined}
      onKeyDown={canSwitchView ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onViewColor?.(player.color);
        }
      } : undefined}
    >
      <div className="portrait-wrap">
        <img src={playerCandyPortrait(character, player)} alt={character.name} />
        {disconnectBadge && <span className="disconnect-badge">{disconnectBadge}</span>}
        {resultBadge && <span className={`result-badge ${resultBadge === "胜" ? "win" : "loss"}`}>{resultBadge}</span>}
      </div>
      <div className="player-meta">
        <button className="name-button">{player.user.username}</button>
        <span className="meta-tag rank-tag">{player.user.rank}</span>
        <span className={`color-badge ${player.color}`} title={player.color === COLORS.black ? "执黑" : "执白"} />
        <span className="meta-tag rating-tag">{player.user.rating}分</span>
      </div>
      <TimeBar time={player.time} />
      <div className="captures">
        <span><strong>提子</strong>{player.captures}</span>
        <span
          className="info-stat removal-stat"
          data-tooltip={PLAYER_INFO_TOOLTIPS.skillRemovals}
          tabIndex={0}
          title={PLAYER_INFO_TOOLTIPS.skillRemovals}
        >
          <strong>除子</strong>{skillRemovals}
        </span>
        <span
          className="info-stat cost-stat"
          data-tooltip={PLAYER_INFO_TOOLTIPS.overclock}
          tabIndex={0}
          title={PLAYER_INFO_TOOLTIPS.overclock}
        >
          <strong>超频</strong>{skillCost}
        </span>
      </div>
      <div
        className={`skill-chip-wrap ${skillDetailOpen ? "open" : ""}`}
        onMouseLeave={() => setSkillDetailOpen(false)}
      >
        <button
          className={`skill-chip ${skillUses <= 0 ? "spent" : ""} ${isSkillTargeting ? "targeting" : ""}`}
          type="button"
          onClick={() => setSkillDetailOpen((open) => !open)}
          onFocus={() => setSkillDetailOpen(true)}
          onMouseEnter={() => setSkillDetailOpen(true)}
        >
          <Sparkles size={16} />
          {character.skill.name} · {skillUses}
        </button>
        <div className="skill-detail-panel" aria-hidden={!skillDetailOpen}>
          {character.skill.description || "暂无技能说明。"}
        </div>
      </div>
    </aside>
  );
}

export default memo(PlayerInfo, arePlayerInfoPropsEqual);

export function arePlayerInfoPropsEqual(previous, next) {
  const color = previous.player?.color ?? next.player?.color;
  return playerInfoSliceEqual(previous.player, next.player)
    && previous.characters === next.characters
    && previous.align === next.align
    && previous.viewColor === next.viewColor
    && previous.canSwitchView === next.canSwitchView
    && previous.onViewColor === next.onViewColor
    && previous.isWinner === next.isWinner
    && previous.isActiveTurn === next.isActiveTurn
    && previous.isDrawResult === next.isDrawResult
    && previous.isSkillTargeting === next.isSkillTargeting
    && gamePlayerSliceEqual(previous.game, next.game, color);
}

function playerInfoSliceEqual(previousPlayer, nextPlayer) {
  if (previousPlayer === nextPlayer) return true;
  return previousPlayer?.color === nextPlayer?.color
    && previousPlayer?.characterId === nextPlayer?.characterId
    && previousPlayer?.character === nextPlayer?.character
    && previousPlayer?.user === nextPlayer?.user
    && previousPlayer?.captures === nextPlayer?.captures
    && previousPlayer?.skillRemovals === nextPlayer?.skillRemovals
    && previousPlayer?.connected === nextPlayer?.connected
    && previousPlayer?.disconnectedAt === nextPlayer?.disconnectedAt
    && previousPlayer?.time?.main === nextPlayer?.time?.main
    && previousPlayer?.time?.byoYomi === nextPlayer?.time?.byoYomi
    && previousPlayer?.time?.periodRemaining === nextPlayer?.time?.periodRemaining
    && previousPlayer?.time?.periods === nextPlayer?.time?.periods;
}

function gamePlayerSliceEqual(previousGame, nextGame, color) {
  if (previousGame === nextGame) return true;
  return previousGame?.phase === nextGame?.phase
    && previousGame?.turn === nextGame?.turn
    && previousGame?.winner === nextGame?.winner
    && previousGame?.skillUses?.[color] === nextGame?.skillUses?.[color]
    && previousGame?.skillCosts?.[color] === nextGame?.skillCosts?.[color]
    && previousGame?.skillRemovals?.[color] === nextGame?.skillRemovals?.[color];
}

export function resultBadgeForPlayer(player, game, { isWinner = false, isDrawResult = false } = {}) {
  if (!player || isDrawResult || game.winner?.invalid) return null;
  if (isWinner) return "胜";
  return game.phase === "finished" ? "负" : null;
}

export function disconnectBadgeForPlayer(player, game) {
  if (!player || game?.phase === "finished") return null;
  return player.connected === false && player.disconnectedAt ? "断线中" : null;
}

export function playerCandyPortrait(character = {}, player = {}) {
  return resolveCandyPortrait(
    { ...character, id: canonicalCharacterId(player.characterId ?? character.id) },
    player.user?.itemEffects
  );
}
