import { memo, useEffect, useState } from "react";
import { Eye, Sparkles } from "lucide-react";
import { COLORS } from "../shared/game.js";
import { canonicalCharacterId } from "../shared/characterAliases.js";
import CharacterChainBadge from "../shared/CharacterChainBadge.jsx";
import UserIdentity from "../shared/UserIdentity.jsx";
import { resolveCandyPortrait } from "../shared/candyPortraits.js";
import { CHARACTERS } from "../shared/characters.js";
import { findCharacter } from "../shared/characterDisplay.js";
import { effectiveSkillDisplayForPlayer, effectiveSkillUsesForColor } from "../shared/derivedSkills.js";
import { gameModeFamily } from "../shared/gameModes.js";
import SkillDescription from "../shared/SkillDescription.jsx";
import { formatSkillOverclock } from "../shared/skillTraits.js";
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
  const [traitPopoverOpen, setTraitPopoverOpen] = useState(false);
  useEffect(() => {
    if (!tapTooltip) return undefined;
    const closeTooltip = (event) => {
      if (event.__skillTraitTopLayer) return;
      if (event.target?.closest?.("[data-mobile-tooltip-trigger]")) return;
      if (event.target?.closest?.(".mobile-tap-tooltip")) return;
      if (event.target?.closest?.(".skill-trait-popover")) return;
      setTapTooltip(null);
    };
    document.addEventListener("pointerdown", closeTooltip);
    return () => document.removeEventListener("pointerdown", closeTooltip);
  }, [tapTooltip]);
  if (!player) return <aside className="player-info empty" />;
  const hasCharacter = !(player.character === null && !player.characterId);
  const isNoCharacter = !hasCharacter;
  const isBot = Boolean(player.isBot || player.user?.isBot);
  const isPracticeBot = isBot && isNoCharacter;
  const botPortraitUrl = isBot ? player.botProfile?.portraitUrl : "";
  const useNoCharacterPortraitLayout = isNoCharacter && !botPortraitUrl;
  const baseCharacter = hasCharacter ? playerCharacterForDisplay(characters, player) : null;
  const activeSkill = hasCharacter ? effectiveSkillDisplayForPlayer(game, { ...player, character: baseCharacter }) : null;
  const character = activeSkill
    ? { ...baseCharacter, skill: { ...baseCharacter.skill, ...activeSkill } }
    : baseCharacter;
  const skillUses = effectiveSkillUsesForColor(game, player.color);
  const skillCost = game.skillCosts?.[player.color] ?? 0;
  const skillRemovals = player.skillRemovals ?? game.skillRemovals?.[player.color] ?? 0;
  const skillEnabled = game.skillEnabled !== false;
  const keepNoCharacterCardSlots = isNoCharacter && (player.isTutorialPlayer || isPracticeBot);
  const showNoCharacterSkillPlaceholder = skillEnabled && keepNoCharacterCardSlots;
  const showNoCharacterRankPlaceholder = keepNoCharacterCardSlots && !player.user.rank;
  const showNoCharacterRatingPlaceholder = keepNoCharacterCardSlots
    && (player.user.rating === "" || player.user.rating == null);
  const isGomoku = gameModeFamily(game.mode) === "gomoku";
  const showGoStats = !isGomoku;
  const resultBadge = resultBadgeForPlayer(player, game, { isWinner, isDrawResult });
  const isDisconnected = isDisconnectedPlayer(player, game);
  const isSelectedView = canSwitchView && viewColor === player.color;
  const viewpointLabel = player.color === COLORS.black ? "黑方" : "白方";
  const requestFloatingLayer = () => onFloatingLayerRequest?.(floatingLayerId);
  const portraitContent = (
    <>
      {hasCharacter && <img src={playerCandyPortrait(character, player)} alt={character.name} />}
      {isBot && isNoCharacter && (botPortraitUrl
        ? <img className="practice-bot-portrait-image" src={botPortraitUrl} alt={player.botProfile?.name ?? "准时宝"} />
        : <span className="practice-bot-portrait" aria-label="准时宝">准</span>)}
      {hasCharacter && <CharacterChainBadge user={player.user} characterId={character.id} />}
      {resultBadge && <span className={`result-badge ${resultBadge.tone}`}>{resultBadge.label}</span>}
      {canSwitchView && (
        <span className="viewpoint-indicator" aria-hidden="true">
          {isSelectedView ? "当前" : <Eye size={12} />}
        </span>
      )}
    </>
  );
  return (
    <aside
      className={`player-info ${align} ${isWinner ? "winner" : ""} ${isActiveTurn ? "active-turn" : ""} ${isDrawResult ? "draw-result" : ""} ${isNoCharacter ? "no-character-player" : ""} ${isPracticeBot ? "practice-bot-player" : ""} ${canSwitchView ? "switchable-view" : ""} ${isSelectedView ? "view-selected" : ""}`}
      style={floatingLayerZ ? { "--room-floating-z": floatingLayerZ } : undefined}
    >
      {canSwitchView ? (
        <button
          type="button"
          className={`portrait-wrap portrait-viewpoint-button ${player.color === COLORS.black ? "black-portrait" : "white-portrait"} ${useNoCharacterPortraitLayout ? "no-character" : ""} ${isPracticeBot ? "practice-bot-portrait-wrap" : ""} ${isDisconnected ? "disconnected-portrait" : ""}`}
          aria-label={isSelectedView ? `当前为${viewpointLabel}视角` : `切换至${viewpointLabel}视角`}
          aria-pressed={isSelectedView}
          onClick={() => onViewColor?.(player.color)}
        >
          {portraitContent}
        </button>
      ) : (
        <div className={`portrait-wrap ${player.color === COLORS.black ? "black-portrait" : "white-portrait"} ${useNoCharacterPortraitLayout ? "no-character" : ""} ${isPracticeBot ? "practice-bot-portrait-wrap" : ""} ${isDisconnected ? "disconnected-portrait" : ""}`}>
          {portraitContent}
        </div>
      )}
      <div className="player-meta">
        <div className="name-button player-name">
          <UserIdentity user={player.user} compact />
        </div>
        {(hasCharacter || isBot) && player.user.rank && <span className="meta-tag rank-tag">{player.user.rank}</span>}
        {showNoCharacterRankPlaceholder && <span className="meta-tag rank-tag meta-placeholder" aria-hidden="true" />}
        <span className={`color-badge ${player.color}`} title={player.color === COLORS.black ? "执黑" : "执白"} />
        {player.user.rating !== "" && player.user.rating != null && <span className="meta-tag rating-tag text-rating-value">{player.user.rating}分</span>}
        {showNoCharacterRatingPlaceholder && <span className="meta-tag rating-tag meta-placeholder" aria-hidden="true" />}
      </div>
      <TimeBar time={player.time} />
      {showGoStats && <div className="captures">
        <span><strong>提子</strong>{player.captures}</span>
        {skillEnabled && <button
          type="button"
          className="info-stat removal-stat capture-control"
          data-mobile-tooltip-trigger
          data-tooltip={PLAYER_INFO_TOOLTIPS.skillRemovals}
          title={PLAYER_INFO_TOOLTIPS.skillRemovals}
          onMouseEnter={requestFloatingLayer}
          onFocus={requestFloatingLayer}
          onClick={(event) => {
            requestFloatingLayer();
            openTapTooltip(event, PLAYER_INFO_TOOLTIPS.skillRemovals, setTapTooltip);
          }}
        ><strong>除子</strong>{skillRemovals}</button>}
        {skillEnabled && <button
          type="button"
          className="info-stat cost-stat capture-control"
          data-mobile-tooltip-trigger
          data-tooltip={PLAYER_INFO_TOOLTIPS.overclock}
          title={PLAYER_INFO_TOOLTIPS.overclock}
          onMouseEnter={requestFloatingLayer}
          onFocus={requestFloatingLayer}
          onClick={(event) => {
            requestFloatingLayer();
            openTapTooltip(event, PLAYER_INFO_TOOLTIPS.overclock, setTapTooltip);
          }}
        ><strong>超频</strong>{skillCost}</button>}
      </div>}
      {skillEnabled && hasCharacter && <div
        className={`skill-chip-wrap ${skillDetailOpen ? "open" : ""}`}
        onMouseLeave={() => {
          if (!traitPopoverOpen) setSkillDetailOpen(false);
        }}
        onPointerDownCapture={requestFloatingLayer}
      >
        <button
          className={`skill-chip ${skillUses <= 0 ? "spent" : ""} ${isSkillTargeting ? "targeting" : ""}`}
          style={skillChipStyle(character)}
          type="button"
          data-mobile-tooltip-trigger
          onClick={(event) => {
            requestFloatingLayer();
            if (openTapTooltip(event, skillTooltipContent(character), setTapTooltip)) {
              setSkillDetailOpen(false);
              return;
            }
            setSkillDetailOpen((open) => !open);
          }}
          onKeyDown={(event) => {
            requestFloatingLayer();
            if (openTapTooltipFromKeyboard(event, skillTooltipContent(character), setTapTooltip)) {
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
          <SkillDescription
            description={character.skill.description || "暂无技能说明。"}
            overclockText={formatSkillOverclock(character.skill)}
            floatingLayerZ={floatingLayerZ}
            onPopoverOpenChange={setTraitPopoverOpen}
          />
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
          {tapTooltip.skill ? (
            <SkillDescription
              description={tapTooltip.skill.description || "暂无技能说明。"}
              overclockText={formatSkillOverclock(tapTooltip.skill)}
              floatingLayerZ={floatingLayerZ}
              onPopoverOpenChange={setTraitPopoverOpen}
            />
          ) : tapTooltip.text}
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
    && previousPlayer?.isBot === nextPlayer?.isBot
    && previousPlayer?.botProfile?.portraitUrl === nextPlayer?.botProfile?.portraitUrl
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

function skillTooltipContent(character = {}) {
  return { skill: character.skill ?? { description: "暂无技能说明。", costValue: "0" } };
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

function openTapTooltip(event, content, setTapTooltip) {
  if (!isMobileTooltipInput()) return false;
  event.preventDefault();
  event.stopPropagation();
  setTapTooltip({ ...tooltipPointFromEvent(event), ...tooltipContent(content) });
  return true;
}

function openTapTooltipFromKeyboard(event, content, setTapTooltip) {
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
    ...tooltipContent(content)
  });
  return true;
}

export function playerCharacterForDisplay(characters, player = {}) {
  const characterId = canonicalCharacterId(player.characterId ?? player.character?.id);
  const hasCurrentCatalogEntry = Boolean(
    characterId && (characters?.[characterId] || CHARACTERS[characterId])
  );
  return hasCurrentCatalogEntry
    ? findCharacter(characters, characterId)
    : findCharacter(characters, player.character ?? characterId);
}

function tooltipContent(content) {
  return typeof content === "string" ? { text: content } : content;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const TOOLTIP_MAX_WIDTH = 232;
const TOOLTIP_HALF_WIDTH = TOOLTIP_MAX_WIDTH / 2;
const TOOLTIP_VIEWPORT_MARGIN = 16;
const TOOLTIP_TOP_FLIP_THRESHOLD = 120;
