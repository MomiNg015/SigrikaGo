import { Star } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import RankProgress from "../../shared/RankProgress.jsx";
import UserIdentity from "../../shared/UserIdentity.jsx";
import { characterPortraitImageProps } from "../../shared/characterPortraits.js";
import { findCharacter } from "../../shared/characterDisplay.js";
import { normalizeRankProgress, rankStarLimit } from "../../shared/rankProgression.js";

function recordFor(player) {
  const total = player.totalGames ?? 0;
  const wins = player.wins ?? 0;
  const losses = player.losses ?? 0;
  return { total, wins, losses, draws: player.draws ?? Math.max(0, total - wins - losses), rate: total > 0 ? (wins / total * 100).toFixed(1) : "0.0" };
}

function Portrait({ player, characters, capture, rank }) {
  const [failedSource, setFailedSource] = useState(null);
  const characterId = capture ? player.recordCharacter : player.commonCharacter;
  const character = findCharacter(characters, characterId);
  const image = characterPortraitImageProps(character, { variant: "avatar", itemEffects: player.itemEffects, user: player, ...(capture ? { costumeSnapshot: player.costumeSnapshot } : {}) });
  return <div className="lp-avatar" data-character-id={character?.id ?? characterId ?? ""}>
    {image.src && image.src !== failedSource ? <img {...image} alt={`${player.username}头像`} onError={() => setFailedSource(image.src)}/> : <span className="lp-avatar-fallback" role="img" aria-label={`${player.username}头像暂无`}>{String(player.username ?? "?").slice(0, 1)}</span>}
    {rank != null && <b className="lp-avatar-place" aria-hidden="true">{rank}</b>}
  </div>;
}

function CompactRank({ player }) {
  if (!/^(\d+)(段|级)$/u.test(String(player.rank ?? ""))) return <span className="lp-compact-rank">{player.rank ?? "未定段"}</span>;
  const progress = normalizeRankProgress(player);
  const limit = rankStarLimit(progress.rank);
  return <span className="lp-compact-rank" aria-label={`${progress.rank} ${limit ? `${progress.stars}/${limit}星` : `${progress.rating}分`}`}>
    <span>{progress.rank}</span><span>{limit ? <><Star aria-hidden="true"/>{progress.stars}/{limit}</> : `${progress.rating}分`}</span>
  </span>;
}

function Record({ record }) {
  return <div className="lp-record">
    {[['总局', record.total], ['胜', record.wins], ['负', record.losses], ['和', record.draws]].map(([label, value]) => <span key={label}><b>{value}</b><small>{label}</small></span>)}
  </div>;
}

function Metrics({ record }) {
  return <div className="lp-metrics"><span className="lp-wins"><b>{record.wins}</b><small>胜局</small></span><span className="lp-rate"><b>{record.rate}<i>%</i></b><small>胜率</small></span></div>;
}

function Identity({ player }) {
  const slotRef = useRef(null);
  useLayoutEffect(() => {
    const slot = slotRef.current;
    const identity = slot.firstElementChild;
    if (!identity.classList.contains("has-nameplate") || typeof ResizeObserver === "undefined") return;
    let disposed = false;
    const fit = () => {
      if (!disposed) identity.style.zoom = String(Math.min(1, slot.clientWidth / Math.max(1, identity.scrollWidth)));
    };
    const observer = new ResizeObserver(fit);
    observer.observe(slot);
    observer.observe(identity);
    document.fonts?.ready.then(fit);
    fit();
    return () => { disposed = true; observer.disconnect(); identity.style.removeProperty("zoom"); };
  }, [player]);
  return <div className="lp-name" title={player.username} ref={slotRef}><UserIdentity user={player} compact/></div>;
}

function StandingRow({ entry, characters, capture, current, pinned = false }) {
  const { player, rank } = entry;
  return <article className={`lp-row${pinned ? " lp-pinned" : ""}`} data-rank={rank} data-current={current} aria-label={`第${rank}名 ${player.username}`}>
    <strong className="lp-position" aria-hidden="true">{rank}</strong>
    <div className="lp-player"><Portrait player={player} characters={characters} capture={capture} rank={rank}/><div className="lp-player-text"><Identity player={player}/><CompactRank player={player}/></div></div>
    <div className="lp-rank"><RankProgress {...player}/></div>
    {capture ? <b className="lp-captures" aria-label={`提子数 ${player.captures ?? 0}`}>{player.captures ?? 0}<small>子</small></b> : <><Record record={recordFor(player)}/><Metrics record={recordFor(player)}/></>}
  </article>;
}

function Podium({ entries, characters, capture, isCurrentUser }) {
  return <div className="lp-podium" aria-label="前三名" data-count={entries.length}>
    {entries.map(({ player, rank }) => <article className="lp-winner" key={player.id} data-rank={rank} data-current={isCurrentUser(player)} aria-label={`第${rank}名 ${player.username}`} style={{ gridColumn: ({ 1: 2, 2: 1, 3: 3 })[rank], gridRow: 1 }}>
      <strong className="lp-medal" aria-hidden="true">{rank}<small>名</small></strong>
      <Portrait player={player} characters={characters} capture={capture}/>
      <Identity player={player}/>
      <RankProgress {...player}/>
      {capture ? <b className="lp-captures" aria-label={`提子数 ${player.captures ?? 0}`}>{player.captures ?? 0}<small>子</small></b> : <><Metrics record={recordFor(player)}/><Record record={recordFor(player)}/></>}
    </article>)}
  </div>;
}

export default function LeaderboardStandings({ players, characters, capture, isCurrentUser }) {
  const entries = players.map((player, index) => ({ player, rank: index + 1 }));
  const winners = entries.slice(0, 3);
  const rest = entries.slice(3);
  const current = entries.find(entry => isCurrentUser(entry.player));
  return <div className={`lp-standings${capture ? " lp-capture" : ""}`}>
    <div className="lp-scroll" role="region" aria-label="排行榜名单">
      {winners.length > 0 && <Podium entries={winners} characters={characters} capture={capture} isCurrentUser={isCurrentUser}/>}
      {rest.length > 0 && <div className="lp-columns" aria-hidden="true"><span>排名</span><span>{capture ? "纪录角色 / 用户名" : "常用角色 / 用户名"}</span><span>段位</span>{capture ? <span>提子数</span> : <><span>总局 / 胜 / 负 / 和</span><span>胜率</span></>}</div>}
      {rest.map(entry => <StandingRow key={entry.player.id} entry={entry} characters={characters} capture={capture} current={isCurrentUser(entry.player)}/>)}
    </div>
    <footer className="lp-personal"><span className="lp-personal-label">我的排名</span>{current ? <StandingRow entry={current} characters={characters} capture={capture} current pinned/> : <span className="lp-unranked">未上榜</span>}</footer>
  </div>;
}
