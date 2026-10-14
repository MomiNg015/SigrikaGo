import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Star, X } from 'lucide-react';
import LeaderboardModal from '../../../src/modals/LeaderboardModal.jsx';
import RankProgress from '../../../src/shared/RankProgress.jsx';
import { normalizeRankProgress, rankStarLimit } from '../../../src/shared/rankProgression.js';
import UserIdentity from '../../../src/shared/UserIdentity.jsx';
import { CHARACTERS } from '../../../src/shared/characters.js';
import { characterPortraitImageProps } from '../../../src/shared/characterPortraits.js';
import { modeOrderedEntries } from '../../../src/shared/gameModes.js';
import { CAPTURE_CHALLENGE_MODE } from '../../../src/shared/captureChallenge.js';
import './sample.css';
import './podium-mobile.css';

const params = new URLSearchParams(location.search);
const view = ['honor', 'podium', 'ledger', 'current'].includes(params.get('view')) ? params.get('view') : 'honor';
const state = params.get('state') || 'normal';
const modes = [...modeOrderedEntries(), { id: CAPTURE_CHALLENGE_MODE, shortTitle: '吃子赛' }];
const names = ['今天也要吃橘子', '雨天的棉花糖', '白昼漫游', '窗边的风', '薄荷汽水', '星星不打烊', '放学后的棋社', '晚风与纸飞机', '想再下一盘', '晨光收藏家', '猫猫睡着了', '月亮的留言'];
const characters = ['sigrika', 'denia', 'aemeath', 'lynae', 'mornye', 'chisa', 'qiuyuan', 'changli', 'nabomo'];
function getPlayers(mode) {
  if (state === 'empty') return [];
  const offset = modes.findIndex(entry => entry.id === mode);
  return names.slice(0, state === 'solo' ? 1 : state === 'duo' ? 2 : names.length).map((name, index) => {
    const scoreIndex = state === 'tie' && index < 5 ? 0 : index;
    const totalGames = 240 - scoreIndex * 11;
    const wins = 184 - scoreIndex * 10;
    const draws = 2 + scoreIndex % 3;
    return { id: `sample-${index}`, username: state === 'long' && index % 3 === 0 ? '每天放学以后都想和大家再下一盘棋' : name, ranking: index + 1, rank: scoreIndex < 3 ? '9段' : `${Math.max(1, 8 - Math.floor((scoreIndex - 3) / 2))}段`, rating: 2350 - scoreIndex * 75 - offset * 30, stars: 4 - scoreIndex % 4, totalGames, wins, losses: totalGames - wins - draws, draws, captures: 128 - scoreIndex * 7 + offset, commonCharacter: characters[(index + offset) % characters.length], recordCharacter: characters[(index + offset) % characters.length], itemEffects: {} };
  });
}
const user = { id: 'sample-6', username: names[6] };
if (view === 'current') {
  await import('../../../src/styles.css');
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (url, options) => {
    if (typeof url !== 'string' || !url.startsWith('/api/')) return nativeFetch(url, options);
    if (!url.startsWith('/api/leaderboard?') || options?.headers?.Authorization !== 'Bearer leaderboard-design-preview') throw new Error('Preview does not access account APIs');
    if (state === 'loading') return new Promise(() => {});
    if (state === 'error') return Response.json({ error: '排行榜加载失败，请稍后重试' }, { status: 503 });
    const players = getPlayers(new URL(url, location.origin).searchParams.get('mode'));
    if (state === 'decorated') for (const player of players) player.achievementEquipmentAssets = { title: { text: '棋社常客' }, nameplate: { id: 'reward-denia-spark-100-wins-nameplate', imageUrl: '/assets/achievements/denia-spark-100-wins-nameplate.png' }, badge: { text: '星' } };
    return Response.json({ players });
  };
}

function Portrait({ player, capture }) {
  const character = CHARACTERS[capture ? player.recordCharacter : player.commonCharacter];
  return <img className="lb-portrait" {...characterPortraitImageProps(character, { variant: 'avatar', user: player })} alt={`${capture ? '纪录角色' : '常用角色'}：${character.name}`} />;
}
function Identity({ player, capture }) {
  return <div className="lb-identity"><Portrait player={player} capture={capture}/><div className="lb-name" title={player.username}><UserIdentity user={player} compact/></div></div>;
}
function Record({ player }) {
  return <div className="lb-record"><span><b>{player.totalGames}</b><small>总局</small></span><span><b>{player.wins}</b><small>胜</small></span><span><b>{player.losses}</b><small>负</small></span><span><b>{player.draws}</b><small>和</small></span></div>;
}
function MobileRecord({ player }) {
  return <div className="lb-mobile-stats"><span><b>{player.wins}</b><small>胜局</small></span><span><b>{(player.wins / player.totalGames * 100).toFixed(1)}<i>%</i></b><small>胜率</small></span></div>;
}
function MobilePlayer({ player }) {
  const progress = normalizeRankProgress(player);
  const limit = rankStarLimit(progress.rank);
  return <div className="lb-mobile-player"><div className="lb-mobile-avatar"><Portrait player={player}/><b className="lb-avatar-place" aria-label={`第${player.ranking}名`}>{player.ranking}</b></div><div className="lb-mobile-player-text"><div className="lb-name" title={player.username}><UserIdentity user={player} compact/></div><div className="lb-compact-rank" aria-label={`${progress.rank} ${limit ? `${progress.stars}/${limit}星` : `${progress.rating}分`}`}><span>{progress.rank}</span><span>{limit ? <><Star aria-hidden="true"/>{progress.stars}/{limit}</> : `${progress.rating}分`}</span></div></div></div>;
}
function Row({ player, capture, pinned = false }) {
  const me = player.id === user.id && state !== 'unranked';
  return <article className={`lb-row place-${player.ranking <= 3 ? player.ranking : 'other'} ${me ? 'is-me' : ''} ${pinned ? 'pinned' : ''}`} aria-label={`第${player.ranking}名 ${player.username}`}>
    <strong className="lb-position">{player.ranking}<small>名</small></strong><Identity player={player} capture={capture}/>
    <div className="lb-rank"><RankProgress {...player}/></div>
    {view === 'podium' && !capture && <MobilePlayer player={player}/>}
    {capture ? <strong className="lb-score">{player.captures}<small>子</small></strong> : <><Record player={player}/><div className="lb-rate"><b>{(player.wins / player.totalGames * 100).toFixed(1)}<small>%</small></b><span>胜率</span></div>{view === 'podium' && <MobileRecord player={player}/>}</>}
  </article>;
}
function Podium({ players, capture }) {
  return <div className="lb-podium-group">{players.map(player => <article className={`lb-winner winner-${player.ranking}`} key={player.id}>
    <strong className="lb-medal">{player.ranking}<small>名</small></strong><Portrait player={player} capture={capture}/><div className="lb-name" title={player.username}><UserIdentity user={player} compact/></div><RankProgress {...player}/>
    {capture ? <strong className="lb-podium-score">{player.captures} 子</strong> : <><div className="lb-winner-rate">{(player.wins / player.totalGames * 100).toFixed(1)}%<small> 胜率</small></div><Record player={player}/><MobileRecord player={player}/></>}
  </article>)}</div>;
}
function Preview() {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const closeOnEscape = event => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);
  const [mode, setMode] = useState('spark');
  const [status, setStatus] = useState(state);
  const capture = mode === CAPTURE_CHALLENGE_MODE;
  const players = getPlayers(mode);
  const me = state === 'unranked' ? null : players.find(player => player.id === user.id);
  const top = players.filter(player => player.ranking <= 3);
  const rest = view === 'podium' ? players.filter(player => player.ranking > 3) : players;
  function tabKey(event, index) {
    let next;
    if (['ArrowDown', 'ArrowRight'].includes(event.key)) next = (index + 1) % modes.length;
    if (['ArrowUp', 'ArrowLeft'].includes(event.key)) next = (index + modes.length - 1) % modes.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = modes.length - 1;
    if (next !== undefined) { event.preventDefault(); setMode(modes[next].id); document.getElementById(`mode-${modes[next].id}`).focus(); }
  }
  if (view === 'current') return <div className="app-shell player-theme-enabled theme-bright-school lb-current-preview">{open ? <LeaderboardModal token="leaderboard-design-preview" characters={CHARACTERS} user={state === 'unranked' ? { id: 'absent', username: '未上榜玩家' } : user} onClose={() => setOpen(false)}/> : <button onClick={() => setOpen(true)}>打开排行榜</button>}</div>;
  return <div className={`lb-scene lb-${view}`}>{!open ? <button className="lb-reopen" onClick={() => setOpen(true)}>打开排行榜</button> : <div className="lb-backdrop">
    <section className="lb-window" aria-labelledby="lb-title">
      <header className="lb-header"><h1 id="lb-title"><img src="/assets/window-titles/leaderboard.webp" alt="排行榜"/></h1><button className="lb-close" aria-label="关闭排行榜" onClick={() => setOpen(false)}><X size={20}/></button></header>
      <div className="lb-tabs" role="tablist" aria-label="对弈模式" aria-orientation="vertical">{modes.map((entry, index) => <button id={`mode-${entry.id}`} key={entry.id} role="tab" aria-selected={mode === entry.id} aria-controls="lb-content" tabIndex={mode === entry.id ? 0 : -1} onClick={() => setMode(entry.id)} onKeyDown={event => tabKey(event, index)}>{entry.shortTitle}</button>)}</div>
      <div id="lb-content" className={`lb-content ${capture ? 'capture' : ''}`} role="tabpanel" aria-labelledby={`mode-${mode}`}>
        {status === 'loading' ? <div className="lb-message" role="status">加载中…<div className="lb-skeleton"/><div className="lb-skeleton"/><div className="lb-skeleton"/></div> : status === 'error' ? <div className="lb-message" role="alert"><p>排行榜加载失败</p><button onClick={() => setStatus('normal')}>重新加载</button></div> : !players.length ? <div className="lb-message">暂无排行</div> : <>
          <div className="lb-scroll" aria-label="排行榜名单">
            {view === 'podium' && <Podium players={top} capture={capture}/>}
            <div className="lb-columns" aria-hidden="true"><span>排名</span><span>{capture ? '纪录角色 / 用户名' : '常用角色 / 用户名'}</span><span>段位</span>{capture ? <span>提子数</span> : <><span>总局 / 胜 / 负 / 和</span><span>胜率</span></>}</div>
            {rest.map(player => <Row key={player.id} player={player} capture={capture}/>)}</div>
          <footer className="lb-personal"><span className="lb-personal-label">我的排名</span>{me ? <Row player={me} capture={capture} pinned/> : <span className="lb-unranked">未上榜</span>}</footer>
        </>}
      </div>
    </section>
  </div>}</div>;
}
createRoot(document.getElementById('root')).render(<Preview/>);
