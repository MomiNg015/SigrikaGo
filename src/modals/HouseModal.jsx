import { useState } from "react";
import {
  ChartNoAxesColumn,
  CircleDollarSign,
  Flag,
  HelpCircle,
  MonitorPlay,
  Star,
  Trophy,
  X
} from "lucide-react";
import { COLORS } from "../shared/game.js";
import { canonicalCharacterId } from "../shared/characterAliases.js";
import { resolveCandyPortrait } from "../shared/candyPortraits.js";
import { derivePlayerRecordStats, recordWinnerColor } from "../shared/gameRecords.js";
import { getStoneDecoration } from "../shared/stoneDecorations.js";
import { SYSTEM_VOICE_EVENTS } from "../shared/systemVoices.js";
import { playSystemVoice } from "../audio/systemVoicePlayback.js";
import { ReplayList } from "./ReplayList.jsx";
import StoneDecorationPreview from "./StoneDecorationPreview.jsx";

export default function HouseModal({ user, records, characterListView, audioSettings, onClose, onSelectCharacter, onApplyDecoration, onOpenReplay }) {
  const [detailCharacter, setDetailCharacter] = useState(null);
  const [showReplays, setShowReplays] = useState(false);
  const [showCharacterRecords, setShowCharacterRecords] = useState(false);
  const [applyingDecoration, setApplyingDecoration] = useState("");
  const [decorationError, setDecorationError] = useState("");
  const stats = derivePlayerRecordStats(user, records);
  const characterRecords = deriveCharacterRecordStats(user, records, characterListView);
  const owned = new Set((user.ownedCharacters ?? []).map(canonicalCharacterId));
  const selectedCharacter = canonicalCharacterId(user.selectedCharacter);
  const itemEffects = user.itemEffects ?? {};
  const detailOwned = detailCharacter ? owned.has(canonicalCharacterId(detailCharacter.id)) : false;
  const emptySlots = Array.from({ length: Math.max(0, 10 - characterListView.length) }, (_, index) => index);

  function openCharacterDetail(character) {
    setDetailCharacter(character);
    playSystemVoice(SYSTEM_VOICE_EVENTS.houseDetail, {
      character,
      audioSettings
    });
  }

  async function applyDecoration(decorationId) {
    setDecorationError("");
    setApplyingDecoration(decorationId || "default");
    try {
      await onApplyDecoration(decorationId);
    } catch (error) {
      setDecorationError(error.message);
    } finally {
      setApplyingDecoration("");
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="house-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <header className="house-header">
          <h2>部员手册</h2>
          <button className="replay-open-button" onClick={() => setShowReplays(true)}>
            <MonitorPlay size={18} />对局回放
          </button>
        </header>
        <div className="profile-grid">
          <Stat
            label="战绩"
            value={`${stats.totalGames}局 · ${stats.wins}胜${stats.losses}负${stats.draws}和`}
            icon={<ChartNoAxesColumn size={16} />}
            onClick={() => setShowCharacterRecords(true)}
          />
          <Stat
            label="积分"
            value={stats.rating}
            icon={<Star size={16} />}
            tip="积分：每胜一局+20，负一局-20，和棋或无效对局不增减积分。"
          />
          <Stat
            label="段位"
            value={user.rank}
            icon={<Trophy size={16} />}
            tip="段位由积分决定。积分1000分为1段，每+/-100分升/降一段，最高为9段。"
          />
          <Stat
            label="金币"
            value={user.coins}
            icon={<CircleDollarSign size={16} />}
            tip="金币：每胜一局+50，负一局+20，和棋或无效对局不获得金币。"
          />
        </div>
        <div className="character-list">
          {characterListView.map((character) => {
            const characterId = canonicalCharacterId(character.id);
            const disabledReason = characterSortieDisabledReason(characterId, itemEffects);
            const sortieDisabled = !owned.has(characterId) || Boolean(disabledReason);
            return (
              <div
                className={`character-card portrait-card ${selectedCharacter === characterId ? "selected" : ""} ${owned.has(characterId) ? "" : "unowned"}`}
                key={character.id}
                onClick={() => openCharacterDetail(character)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") openCharacterDetail(character);
                }}
              >
                <button
                  className={`sortie-button ${selectedCharacter === characterId ? "selected" : ""}`}
                  title={disabledReason || (selectedCharacter === characterId ? "出战中" : "设为出战")}
                  disabled={sortieDisabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!sortieDisabled) onSelectCharacter(characterId);
                  }}
                >
                  <Flag size={18} />
                </button>
                <img src={characterCandyPortrait(character, itemEffects)} alt={character.name} />
                <strong>{character.name}</strong>
              </div>
            );
          })}
          {emptySlots.map((slot) => (
            <div className="character-card portrait-card locked" key={`empty-${slot}`}>
              <button className="sortie-button" disabled title="未获得">
                <Flag size={18} />
              </button>
              <span className="locked-portrait">?</span>
              <strong>敬请期待</strong>
            </div>
          ))}
        </div>
        <section className="owned-decoration-section">
          <div className="owned-decoration-header">
            <h3>装饰</h3>
            {user.selectedStoneDecoration && (
              <button className="secondary-action compact-action" disabled={applyingDecoration === "default"} onClick={() => applyDecoration("")}>
                恢复初始装饰
              </button>
            )}
          </div>
          <div className="owned-decoration-list">
            {(user.ownedDecorations ?? []).length === 0 && <p className="quiet-text">暂无装饰。</p>}
            {(user.ownedDecorations ?? []).map((decorationId) => {
              const decoration = getStoneDecoration(decorationId);
              const selected = user.selectedStoneDecoration === decorationId;
              return (
                <button
                  className={`owned-decoration-chip ${selected ? "selected" : ""}`}
                  key={decorationId}
                  disabled={selected || applyingDecoration === decorationId}
                  onClick={() => applyDecoration(decorationId)}
                >
                  {decoration ? <StoneDecorationPreview decoration={decoration} /> : null}
                  <span>{decoration?.name ?? decorationId}</span>
                  <strong>{selected ? "使用中" : applyingDecoration === decorationId ? "应用中" : "应用"}</strong>
                </button>
              );
            })}
          </div>
          {decorationError && <p className="form-error admin-action-error">{decorationError}</p>}
        </section>
        {detailCharacter && (
          <div className="nested-modal-backdrop" onClick={() => setDetailCharacter(null)}>
            <section className={`nested-modal character-detail ${detailOwned ? "" : "unowned"}`} onClick={(event) => event.stopPropagation()}>
              <button className="close-button" onClick={() => setDetailCharacter(null)}><X size={18} /></button>
              <div className="character-detail-art">
                <img src={characterCandyPortrait(detailCharacter, itemEffects)} alt={detailCharacter.name} />
              </div>
              <div className="character-detail-copy">
                <h3>{detailCharacter.name}</h3>
                <div className="skill-title-row">
                  <strong>{detailCharacter.skill.name}</strong>
                  <span className="skill-cost-badge">超频 {formatSkillCost(detailCharacter.skill)}</span>
                </div>
                <p>{detailCharacter.skill.description}</p>
                <p className="acquisition-method"><strong>获得途径</strong>{detailCharacter.acquisitionMethod || "初始可用"}</p>
              </div>
            </section>
          </div>
        )}
        {showReplays && (
          <div className="nested-modal-backdrop" onClick={() => setShowReplays(false)}>
            <section className="nested-modal replay-dialog" onClick={(event) => event.stopPropagation()}>
              <button className="close-button" onClick={() => setShowReplays(false)}><X size={18} /></button>
              <h3>对局回放</h3>
              <ReplayList records={records} characters={characterListView} onOpenReplay={onOpenReplay} />
            </section>
          </div>
        )}
        {showCharacterRecords && (
          <div className="nested-modal-backdrop" onClick={() => setShowCharacterRecords(false)}>
            <section className="nested-modal character-record-dialog" onClick={(event) => event.stopPropagation()}>
              <button className="close-button" onClick={() => setShowCharacterRecords(false)}><X size={18} /></button>
              <h3>角色战绩</h3>
              <div className="character-record-list">
                {characterRecords.length === 0 && <p className="quiet-text">暂无角色战绩。</p>}
                {characterRecords.map((entry) => (
                  <article className="character-record-row" key={entry.character.id}>
                    <img src={characterCandyPortrait(entry.character, itemEffects)} alt={entry.character.name} />
                    <strong>{entry.character.name}</strong>
                    <span>{entry.total}局 · {entry.wins}胜{entry.losses}负{entry.draws}和</span>
                    <b>{entry.total > 0 ? `${((entry.wins / entry.total) * 100).toFixed(1)}%` : "0.0%"}</b>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

export function deriveCharacterRecordStats(user = {}, records = [], characters = []) {
  const owned = new Set((user.ownedCharacters ?? []).map(canonicalCharacterId));
  const characterMap = new Map(characters.map((character) => [canonicalCharacterId(character.id), character]));
  const stats = new Map();
  for (const record of Array.isArray(records) ? records : []) {
    const color = playerColorForReplayRecord(user, record);
    if (!color) continue;
    const characterId = canonicalCharacterId(color === COLORS.black ? record.blackCharacter : record.whiteCharacter);
    const character = characterMap.get(characterId);
    if (!character || !owned.has(canonicalCharacterId(character.id))) continue;
    if (!stats.has(character.id)) {
      stats.set(character.id, { character, total: 0, wins: 0, losses: 0, draws: 0 });
    }
    const entry = stats.get(character.id);
    const winner = recordWinnerColor(record);
    entry.total += 1;
    if (!winner) {
      entry.draws += 1;
    } else if (winner === color) {
      entry.wins += 1;
    } else {
      entry.losses += 1;
    }
  }
  return Array.from(stats.values()).sort((a, b) => b.total - a.total || b.wins - a.wins || a.character.name.localeCompare(b.character.name, "zh-CN"));
}

export function characterSortieDisabledReason(characterId, itemEffects = {}) {
  return canonicalCharacterId(characterId) === "sigrika" && itemEffects?.sigrikaCandyDisabled
    ? "糖果效果中，暂时无法出战"
    : "";
}

export function characterCandyPortrait(character = {}, itemEffects = {}) {
  return resolveCandyPortrait(character, itemEffects);
}

export function playerColorForReplayRecord(user = {}, record = {}) {
  if (user.id && record.blackUserId === user.id) return COLORS.black;
  if (user.id && record.whiteUserId === user.id) return COLORS.white;
  if (user.username && record.blackName === user.username) return COLORS.black;
  if (user.username && record.whiteName === user.username) return COLORS.white;
  return null;
}

function Stat({ label, value, icon = null, tip = "", onClick = null }) {
  const Component = onClick ? "button" : "div";
  return (
    <Component className={`stat ${onClick ? "stat-button" : ""}`} type={onClick ? "button" : undefined} onClick={onClick}>
      <span>
        {icon}
        {label}
        {tip && (
          <span className="stat-tip-wrap">
            <HelpCircle size={14} />
            <span className="stat-tip" role="tooltip">{tip}</span>
          </span>
        )}
      </span>
      <strong>{value}</strong>
    </Component>
  );
}

function formatSkillCost(skillOrCost) {
  if (skillOrCost && typeof skillOrCost === "object") {
    const costType = skillOrCost.costType ?? "numeric";
    const costValue = String(skillOrCost.costValue ?? skillOrCost.cost ?? 0);
    return costType === "numeric" ? `${costValue || 0}子` : costValue;
  }
  return typeof skillOrCost === "number" ? `${skillOrCost}子` : skillOrCost;
}
