import { memo, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { COLORS } from "../shared/game.js";
import { canonicalCharacterId } from "../shared/characterAliases.js";
import CharacterChainBadge from "../shared/CharacterChainBadge.jsx";
import UserIdentity from "../shared/UserIdentity.jsx";
import { resolveCandyPortrait } from "../shared/candyPortraits.js";
import { findCharacter } from "../shared/characterDisplay.js";
import { effectiveSkillDisplayForPlayer, effectiveSkillUsesForColor } from "../shared/derivedSkills.js";
import { gameModeFamily } from "../shared/gameModes.js";
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
  isSkillTargeting = false,
  floatingLayerId,
  floatingLayerZ,
  onFloatingLayerRequest
}) {
  const [skillDetailOpen, setSkillDetailOpen] = useState(false);
  const [tapTooltip, setTapTooltip] = useState(null);
  useEffect(() => {
    if (!tapTooltip) return undefined;
    const closeTooltip = (event) => {
      if (event.target?.closest?.("[data-mobile-tooltip-trigger]")) return;
      if (event.target?.closest?.(".mobile-tap-tooltip")) return;
      setTapTooltip(null);
    };
    document.addEventListener("pointerdown", closeTooltip);
    return () => document.removeEventListener("pointerdown", closeTooltip);
  }, [tapTooltip]);
  if (!player) return <aside className="player-info empty" />;
  const hasCharacter = !(player.character === null && !player.characterId);
  const isNoCharacter = !hasCharacter;
  const baseCharacter = hasCharacter ? findCharacter(characters, player.character ?? player.characterId) : null;
  const activeSkill = hasCharacter ? effectiveSkillDisplayForPlayer(game, { ...player, character: baseCharacter }) : null;
  const character = activeSkill
    ? { ...baseCharacter, skill: { ...baseCharacter.skill, ...activeSkill } }
    : baseCharacter;
  const skillUses = effectiveSkillUsesForColor(game, player.color);
  const skillCost = game.skillCosts?.[player.color] ?? 0;
  const skillRemovals = player.skillRemovals ?? game.skillRemovals?.[player.color] ?? 0;
  const skillEnabled = game.skillEnabled !== false;
  const showNoCharacterSkillPlaceholder = skillEnabled && player.isTutorialPlayer && isNoCharacter;
  const showNoCharacterRolePlaceholder = player.isTutorialPlayer && isNoCharacter;
  const isGomoku = gameModeFamily(game.mode) === "gomoku";
  const showGoStats = !isGomoku;
  const resultBadge = resultBadgeForPlayer(player, game, { isWinner, isDrawResult });
  const isDisconnected = isDisconnectedPlayer(player, game);
  const requestFloatingLayer = () => onFloatingLayerRequest?.(floatingLayerId);
  return (
    <aside
      className={`player-info ${align} ${isWinner ? "winner" : ""} ${isActiveTurn ? "active-turn" : ""} ${isDrawResult ? "draw-result" : ""} ${isNoCharacter ? "no-character-player" : ""} ${canSwitchView ? "switchable-view" : ""} ${canSwitchView && viewColor === player.color ? "view-selected" : ""}`}
      style={floatingLayerZ ? { "--room-floating-z": floatingLayerZ } : undefined}
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
      <div className={`portrait-wrap ${player.color === COLORS.black ? "black-portrait" : "white-portrait"} ${isNoCharacter ? "no-character" : ""} ${isDisconnected ? "disconnected-portrait" : ""}`}>
        {hasCharacter && <img src={playerCandyPortrait(character, player)} alt={character.name} />}
        {hasCharacter && <CharacterChainBadge user={player.user} characterId={character.id} />}
        {resultBadge && <span className={`result-badge ${resultBadge.tone}`}>{resultBadge.label}</span>}
      </div>
      <div className="player-meta">
        <button className="name-button">
          <UserIdentity user={player.user} compact />
        </button>
        {hasCharacter && player.user.rank && <span className="meta-tag rank-tag">{player.user.rank}</span>}
        {showNoCharacterRolePlaceholder && <span className="meta-tag rank-tag meta-placeholder" aria-hidden="true" />}
        <span className={`color-badge ${player.color}`} title={player.color === COLORS.black ? "执黑" : "执白"} />
        {player.user.rating !== "" && player.user.rating != null && <span className="meta-tag rating-tag">{player.user.rating}分</span>}
      </div>
      <TimeBar time={player.time} />
      {showGoStats && <div className="captures">
        <span><strong>提子</strong>{player.captures}</span>
        {skillEnabled && <span
          className="info-stat removal-stat"
          data-tooltip={PLAYER_INFO_TOOLTIPS.skillRemovals}
          data-mobile-tooltip-trigger
          tabIndex={0}
          title={PLAYER_INFO_TOOLTIPS.skillRemovals}
          role="button"
          onMouseEnter={requestFloatingLayer}
          onFocus={requestFloatingLayer}
          onClick={(event) => {
            requestFloatingLayer();
            openTapTooltip(event, PLAYER_INFO_TOOLTIPS.skillRemovals, setTapTooltip);
          }}
          onKeyDown={(event) => {
            requestFloatingLayer();
            openTapTooltipFromKeyboard(event, PLAYER_INFO_TOOLTIPS.skillRemovals, setTapTooltip);
          }}
        >
          <strong>除子</strong>{skillRemovals}
        </span>}
        {skillEnabled && <span
          className="info-stat cost-stat"
          data-tooltip={PLAYER_INFO_TOOLTIPS.overclock}
          data-mobile-tooltip-trigger
          tabIndex={0}
          title={PLAYER_INFO_TOOLTIPS.overclock}
          role="button"
          onMouseEnter={requestFloatingLayer}
          onFocus={requestFloatingLayer}
          onClick={(event) => {
            requestFloatingLayer();
            openTapTooltip(event, PLAYER_INFO_TOOLTIPS.overclock, setTapTooltip);
          }}
          onKeyDown={(event) => {
            requestFloatingLayer();
            openTapTooltipFromKeyboard(event, PLAYER_INFO_TOOLTIPS.overclock, setTapTooltip);
          }}
        >
          <strong>超频</strong>{skillCost}
        </span>}
      </div>}
      {skillEnabled && hasCharacter && <div
        className={`skill-chip-wrap ${skillDetailOpen ? "open" : ""}`}
        onMouseLeave={() => setSkillDetailOpen(false)}
        onPointerDownCapture={requestFloatingLayer}
      >
        <button
          className={`skill-chip ${skillUses <= 0 ? "spent" : ""} ${isSkillTargeting ? "targeting" : ""}`}
          style={skillChipStyle(character)}
          type="button"
          data-mobile-tooltip-trigger
          onClick={(event) => {
            requestFloatingLayer();
            if (openTapTooltip(event, skillTooltipText(character), setTapTooltip)) {
              setSkillDetailOpen(false);
              return;
            }
            setSkillDetailOpen((open) => !open);
          }}
          onKeyDown={(event) => {
            requestFloatingLayer();
            if (openTapTooltipFromKeyboard(event, skillTooltipText(character), setTapTooltip)) {
              setSkillDetailOpen(false);
            }
          }}
          onFocus={() => {
            requestFloatingLayer();
            setSkillDetailOpen(true);
          }}
          onMouseEnter={() => {
            requestFloatingLayer();
            setSkillDetailOpen(true);
          }}
        >
          <Sparkles size={16} />
          {character.skill.name} · {skillUses}
        </button>
        <div className="skill-detail-panel" aria-hidden={!skillDetailOpen}>
          {character.skill.description || "暂无技能说明。"}
        </div>
      </div>}
      {showNoCharacterSkillPlaceholder && (
        <div className="skill-chip-wrap skill-chip-placeholder-wrap" aria-hidden="true">
          <span className="skill-chip skill-chip-placeholder" />
        </div>
      )}
      {tapTooltip && (
        <div
          className="mobile-tap-tooltip"
          style={{
            "--tooltip-x": `${tapTooltip.x}px`,
            "--tooltip-y": `${tapTooltip.y}px`,
            ...(floatingLayerZ ? { "--room-floating-z": floatingLayerZ } : {})
          }}
          data-placement={tapTooltip.placement}
          role="tooltip"
        >
          {tapTooltip.text}
        </div>
      )}
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
    && previous.floatingLayerId === next.floatingLayerId
    && previous.floatingLayerZ === next.floatingLayerZ
    && previous.onFloatingLayerRequest === next.onFloatingLayerRequest
    && gamePlayerSliceEqual(previous.game, next.game, color);
}

function playerInfoSliceEqual(previousPlayer, nextPlayer) {
  if (previousPlayer === nextPlayer) return true;
  return previousPlayer?.color === nextPlayer?.color
    && previousPlayer?.characterId === nextPlayer?.characterId
    && previousPlayer?.character === nextPlayer?.character
    && previousPlayer?.isTutorialPlayer === nextPlayer?.isTutorialPlayer
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
  return previousGame?.mode === nextGame?.mode
    && previousGame?.phase === nextGame?.phase
    && previousGame?.turn === nextGame?.turn
    && previousGame?.winner === nextGame?.winner
    && previousGame?.skillEnabled === nextGame?.skillEnabled
    && previousGame?.skillUses?.[color] === nextGame?.skillUses?.[color]
    && previousGame?.derivedSkills?.[color]?.name === nextGame?.derivedSkills?.[color]?.name
    && previousGame?.derivedSkills?.[color]?.uses === nextGame?.derivedSkills?.[color]?.uses
    && previousGame?.derivedSkills?.[color]?.sourceHiddenHandId === nextGame?.derivedSkills?.[color]?.sourceHiddenHandId
    && previousGame?.skillCosts?.[color] === nextGame?.skillCosts?.[color]
    && previousGame?.skillRemovals?.[color] === nextGame?.skillRemovals?.[color];
}

export function resultBadgeForPlayer(player, game, { isWinner = false, isDrawResult = false } = {}) {
  if (!player || game.winner?.invalid) return null;
  if (isDrawResult) return { label: "和", tone: "draw" };
  if (isWinner) return { label: "胜", tone: "win" };
  return game.phase === "finished" ? { label: "负", tone: "loss" } : null;
}

export function isDisconnectedPlayer(player, game) {
  if (!player || game?.phase === "finished") return null;
  return player.connected === false && player.disconnectedAt ? true : null;
}

export function playerCandyPortrait(character = {}, player = {}) {
  return resolveCandyPortrait(
    { ...character, id: canonicalCharacterId(player.characterId ?? character.id) },
    player.user?.itemEffects
  );
}

function skillChipStyle(character = {}) {
  return {
    "--skill-chip-accent": character.palette || "#ff9b4d"
  };
}

function skillTooltipText(character = {}) {
  return character.skill?.description || "暂无技能说明。";
}

export function isMobileTooltipInput() {
  return globalThis.matchMedia?.("(pointer: coarse), (max-width: 900px)")?.matches ?? false;
}

export function tooltipPointFromEvent(event, viewport = globalThis) {
  const width = viewport.innerWidth ?? 0;
  const height = viewport.innerHeight ?? 0;
  const horizontalInset = Math.min(TOOLTIP_HALF_WIDTH + TOOLTIP_VIEWPORT_MARGIN, Math.max(TOOLTIP_VIEWPORT_MARGIN, width / 2));
  const verticalInset = TOOLTIP_VIEWPORT_MARGIN;
  const rawY = event.clientY ?? 0;
  const placement = rawY < TOOLTIP_TOP_FLIP_THRESHOLD ? "below" : "above";
  return {
    x: clamp(event.clientX ?? 0, horizontalInset, Math.max(horizontalInset, width - horizontalInset)),
    y: clamp(rawY, verticalInset, Math.max(verticalInset, height - verticalInset)),
    placement
  };
}

function openTapTooltip(event, text, setTapTooltip) {
  if (!isMobileTooltipInput()) return false;
  event.preventDefault();
  event.stopPropagation();
  setTapTooltip({ ...tooltipPointFromEvent(event), text });
  return true;
}

function openTapTooltipFromKeyboard(event, text, setTapTooltip) {
  if (event.key !== "Enter" && event.key !== " ") return false;
  if (!isMobileTooltipInput()) return false;
  event.preventDefault();
  event.stopPropagation();
  const rect = event.currentTarget.getBoundingClientRect();
  setTapTooltip({
    ...tooltipPointFromEvent({
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    }),
    text
  });
  return true;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const TOOLTIP_MAX_WIDTH = 232;
const TOOLTIP_HALF_WIDTH = TOOLTIP_MAX_WIDTH / 2;
const TOOLTIP_VIEWPORT_MARGIN = 16;
const TOOLTIP_TOP_FLIP_THRESHOLD = 120;
