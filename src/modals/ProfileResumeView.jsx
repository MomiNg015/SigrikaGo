import { useRef } from "react";
import { CircleGauge, Gamepad2, HelpCircle, Star, Trophy } from "lucide-react";
import RecentResultMarkers from "../components/RecentResultMarkers.jsx";
import CharacterChainBadge from "../shared/CharacterChainBadge.jsx";
import { characterThemeStyle, findCharacter } from "../shared/characterDisplay.js";
import { characterPortraitImageProps } from "../shared/characterPortraits.js";
import { CHARACTERS } from "../shared/characters.js";
import { modeOrderedEntries, normalizeGameModeId } from "../shared/gameModes.js";
import UserIdentity from "../shared/UserIdentity.jsx";

export const PROFILE_RESUME_MODE_ORDER = ["spark", "standard", "gomoku"];

export function orderedProfileModes() {
  const entries = new Map(modeOrderedEntries().map((entry) => [entry.id, entry]));
  return PROFILE_RESUME_MODE_ORDER.map((id) => entries.get(id)).filter(Boolean);
}

export default function ProfileResumeView({
  context,
  user,
  characters,
  mode,
  onModeChange,
  modePending = false,
  stats,
  recentResults = [],
  characterStats = [],
  identityActions = null,
  recentAction = null,
  secondaryActions = null,
  status = null
}) {
  const normalizedMode = normalizeGameModeId(mode);
  const normalizedStats = normalizeProfileStats(stats);
  const mainCharacter = findCharacter(characters, user.characterId ?? user.selectedCharacter) ?? CHARACTERS.sigrika;
  const records = sortCharacterStatsByGames(characterStats);
  const winRate = winRateText(normalizedStats.wins, normalizedStats.totalGames);
  const panelId = `${context}-profile-mode-panel`;

  return (
    <div
      className={`profile-resume-view profile-resume-view-${context}`}
      data-profile-context={context}
      aria-busy={modePending ? "true" : undefined}
    >
      <section className="profile-resume-hero" aria-label={context === "self" ? "我的身份资料" : "用户身份资料"}>
        <span className="profile-chain-portrait profile-hero-portrait" style={characterThemeStyle(mainCharacter)}>
          <span className="profile-portrait-mask">
            <img
              {...characterPortraitImageProps(mainCharacter, { itemEffects: user.itemEffects, user })}
              alt={`${mainCharacter.name}立绘`}
            />
          </span>
          <CharacterChainBadge user={user} characterId={mainCharacter.id} />
        </span>
        <div className="profile-identity-block">
          <h3><UserIdentity user={user} /></h3>
        </div>
        {identityActions && (
          <div className="profile-identity-actions" aria-label={context === "self" ? "履历操作" : "用户互动"}>
            {identityActions}
          </div>
        )}
      </section>

      <ProfileModeTabs
        mode={normalizedMode}
        pending={modePending}
        onModeChange={onModeChange}
        panelId={panelId}
      />

      <div
        id={panelId}
        className="profile-record-panel"
        role="tabpanel"
        aria-labelledby={`${context}-profile-tab-${normalizedMode}`}
        aria-busy={modePending ? "true" : undefined}
      >
        {status && <div className="profile-resume-status" aria-live="polite">{status}</div>}

        <section className="profile-overview-grid" aria-label="模式战绩摘要">
          <div className="profile-summary-grid">
            <ProfileSummaryItem emphasis icon={<Trophy size={17} />} label="段位" value={user.rank ?? "未定段"} />
            <ProfileSummaryItem
              emphasis
              icon={<Star size={17} />}
              label="积分"
              value={`${finiteRecordNumber(stats?.rating ?? user.rating) ?? 0}分`}
              tip="对局中获得的积分会根据对手的实力动态增减。友谊赛不会增减积分。"
            />
            <ProfileSummaryItem icon={<Gamepad2 size={17} />} label="总对局" value={`${normalizedStats.totalGames}局`} />
            <ProfileSummaryItem icon={<CircleGauge size={17} />} label="胜率" value={winRate} />
          </div>
          <section className="profile-recent-section" aria-label="最近十盘">
            <div className="profile-section-heading">
              <h4>最近十盘</h4>
              {recentAction}
            </div>
            <RecentResultMarkers results={recentResults} className="profile-rank-results" />
          </section>
        </section>

        <section className="profile-character-section" aria-label="角色战绩">
          <div className="profile-section-heading">
            <h4>角色战绩</h4>
          </div>
          <div className="profile-character-table-scroll">
            <table className="profile-character-table">
              <thead>
                <tr>
                  <th scope="col">角色</th>
                  <th scope="col">对局</th>
                  <th scope="col">胜</th>
                  <th scope="col">负</th>
                  <th scope="col">和</th>
                  <th scope="col">胜率</th>
                </tr>
              </thead>
              <tbody>
                {records.map((item) => {
                  const character = findCharacter(characters, item.characterId) ?? CHARACTERS.sigrika;
                  const record = characterRecordColumns(item);
                  return (
                    <tr style={characterThemeStyle(character)} key={item.characterId}>
                      <th scope="row" data-label="角色">
                        <span className="profile-character-identity">
                          <span className="profile-chain-portrait small">
                            <span className="profile-portrait-mask">
                              <img
                                {...characterPortraitImageProps(character, { itemEffects: user.itemEffects, user })}
                                alt=""
                                loading="lazy"
                                decoding="async"
                              />
                            </span>
                            <CharacterChainBadge user={user} characterId={character.id} />
                          </span>
                          <span className="profile-character-name">{character.name}</span>
                        </span>
                      </th>
                      <td data-label="对局">{record.total}</td>
                      <td data-label="胜">{record.wins}</td>
                      <td data-label="负">{record.losses}</td>
                      <td data-label="和">{record.draws}</td>
                      <td data-label="胜率"><strong>{record.winRate}</strong></td>
                    </tr>
                  );
                })}
                {records.length === 0 && (
                  <tr className="profile-character-empty-row">
                    <td colSpan="6">暂无角色战绩。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {secondaryActions && (
          <footer className="profile-secondary-actions" aria-label="其他资料操作">
            {secondaryActions}
          </footer>
        )}
      </div>
    </div>
  );
}

function ProfileModeTabs({ mode, pending, onModeChange, panelId }) {
  const tabs = orderedProfileModes();
  const tabRefs = useRef([]);

  function handleKeyDown(event, index) {
    let nextIndex = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    tabRefs.current[nextIndex]?.focus();
    if (!pending) onModeChange?.(tabs[nextIndex].id);
  }

  return (
    <div className="mode-tabs profile-mode-tabs" role="tablist" aria-label="对弈模式">
      {tabs.map((entry, index) => (
        <button
          key={entry.id}
          ref={(node) => { tabRefs.current[index] = node; }}
          id={`${panelId.replace("-mode-panel", "-tab")}-${entry.id}`}
          type="button"
          role="tab"
          aria-selected={mode === entry.id}
          aria-controls={panelId}
          aria-disabled={pending ? "true" : undefined}
          tabIndex={mode === entry.id ? 0 : -1}
          className={mode === entry.id ? "active" : ""}
          onClick={() => { if (!pending) onModeChange?.(entry.id); }}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          {entry.shortTitle}
        </button>
      ))}
    </div>
  );
}

function ProfileSummaryItem({ icon, label, value, valueClassName = "", tip = "", emphasis = false }) {
  return (
    <div className={`profile-summary-item${emphasis ? " is-primary" : ""}`}>
      <span className="profile-summary-label">
        {icon}
        {label}
        {tip && (
          <span className="stat-tip-wrap" tabIndex="0" aria-label={`${label}说明`}>
            <HelpCircle size={14} />
            <span className="stat-tip" role="tooltip">{tip}</span>
          </span>
        )}
      </span>
      <strong className={valueClassName || undefined}>{value}</strong>
    </div>
  );
}

export function normalizeProfileStats(stats = {}) {
  const wins = finiteRecordNumber(stats.wins) ?? 0;
  const losses = finiteRecordNumber(stats.losses) ?? 0;
  const draws = finiteRecordNumber(stats.draws) ?? 0;
  return {
    totalGames: finiteRecordNumber(stats.totalGames ?? stats.total) ?? wins + losses + draws,
    wins,
    losses,
    draws
  };
}

export function recordStatsFromUser(user = {}) {
  if (user.recordStats) return normalizeProfileStats(user.recordStats);
  const match = String(user.record ?? "").match(/(\d+)\s*局\s*(?:[·•]\s*)?(\d+)\s*胜\s*(\d+)\s*负\s*(\d+)\s*和/u);
  if (match) {
    return {
      totalGames: Number(match[1]),
      wins: Number(match[2]),
      losses: Number(match[3]),
      draws: Number(match[4])
    };
  }
  return normalizeProfileStats(user);
}

export function sortCharacterStatsByGames(characterStats = []) {
  return [...(Array.isArray(characterStats) ? characterStats : [])].sort((a, b) => (
    characterStatGames(b) - characterStatGames(a)
      || String(a.characterId ?? "").localeCompare(String(b.characterId ?? ""), "zh-CN")
  ));
}

export function characterRecordColumns(item = {}) {
  const total = finiteRecordNumber(item.total);
  const wins = finiteRecordNumber(item.wins);
  const losses = finiteRecordNumber(item.losses);
  const draws = finiteRecordNumber(item.draws);
  if (total !== null || wins !== null || losses !== null || draws !== null) {
    const normalized = {
      total: total ?? Math.max(0, (wins ?? 0) + (losses ?? 0) + (draws ?? 0)),
      wins: wins ?? 0,
      losses: losses ?? 0,
      draws: draws ?? 0
    };
    return {
      ...normalized,
      winRate: item.winRate ?? winRateText(normalized.wins, normalized.total)
    };
  }

  const compact = String(item.record ?? "").match(/(\d+)\s*局\s*(?:[·•]\s*)?(\d+)\s*胜\s*(\d+)\s*负\s*(\d+)\s*和/u);
  if (compact) {
    const normalized = {
      total: Number(compact[1]),
      wins: Number(compact[2]),
      losses: Number(compact[3]),
      draws: Number(compact[4])
    };
    return {
      ...normalized,
      winRate: item.winRate ?? winRateText(normalized.wins, normalized.total)
    };
  }

  return { total: 0, wins: 0, losses: 0, draws: 0, winRate: item.winRate ?? "0.0%" };
}

function characterStatGames(item = {}) {
  if (Number.isFinite(item.total)) return item.total;
  const match = String(item.record ?? "").match(/(\d+)\s*局/u);
  return match ? Number(match[1]) : 0;
}

function finiteRecordNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : null;
}

function winRateText(wins, total) {
  return total > 0 ? `${((wins / total) * 100).toFixed(1)}%` : "0.0%";
}
