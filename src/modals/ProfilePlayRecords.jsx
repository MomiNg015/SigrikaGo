import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { findCharacter } from "../shared/characterDisplay.js";
import { characterPortraitImageProps } from "../shared/characterPortraits.js";
import { replayOutcomeForUser } from "./ReplayList.jsx";
import { useReplayPagination } from "./useReplayPagination.js";
import WindowEmptyState from "./WindowEmptyState.jsx";
import WindowLoadingState from "./WindowLoadingState.jsx";

export function ProfileCaptureRecord({ user, token, characters }) {
  const [state, setState] = useState({ key: "", loading: true, record: null, error: "" });
  const [retry, setRetry] = useState(0);
  const key = `${user.id}:${token}`;
  useEffect(() => {
    let active = true;
    setState({ key, loading: true, record: null, error: "" });
    if (!token || !user.id) {
      setState({ key, loading: false, record: null, error: "暂时无法读取挑战成绩" });
      return undefined;
    }
    api(`/api/users/${user.id}/capture-record`, { token })
      .then(({ record }) => { if (active) setState({ key, record, loading: false, error: "" }); })
      .catch((error) => { if (active) setState({ key, record: null, loading: false, error: error.message }); });
    return () => { active = false; };
  }, [key, retry, token, user.id]);
  if (state.key !== key || state.loading) return <WindowLoadingState compact>正在读取挑战成绩…</WindowLoadingState>;
  if (state.error) return <div role="alert"><p>{state.error}</p><button type="button" onClick={() => setRetry(n => n + 1)}>重新加载</button></div>;
  if (!state.record) return <WindowEmptyState compact>暂无吃子挑战成绩</WindowEmptyState>;
  const character = findCharacter(characters, state.record.characterId);
  return <section className="profile-capture-record" aria-label="吃子挑战成绩">
    <h3>吃子挑战赛</h3>
    <dl><div><dt>最高提子</dt><dd>{state.record.captures}<small>子</small></dd></div><div><dt>当前排名</dt><dd>{state.record.ranking}<small>名</small></dd></div></dl>
    <div className="profile-capture-character">{character && <img {...characterPortraitImageProps(character, { variant: "avatar", costumeSnapshot: state.record.costumeSnapshot })} alt="" />}<div><span>最佳成绩使用角色</span><strong>{character?.name ?? state.record.characterId}</strong></div></div>
  </section>;
}

export function ProfileTeamRecords({ user, token, characters, onOpenReplay, replayDisabled }) {
  const pagination = useReplayPagination({ enabled: Boolean(token && user.id) && !replayDisabled, endpoint: `/api/users/${user.id}/replays?mode=team`, token });
  if (replayDisabled) return <WindowEmptyState compact>当前不可查看对局记录</WindowEmptyState>;
  if (!token || !user.id) return <WindowEmptyState compact>暂时无法读取对局记录</WindowEmptyState>;
  return <section className="profile-team-records" aria-label="队际赛记录">
    <h3>队际赛记录</h3>
    {!pagination.loading && !pagination.error && !pagination.records.length && <WindowEmptyState compact>暂无队际赛记录</WindowEmptyState>}
    {pagination.records.map(record => <article key={record.id} className="profile-team-record" data-outcome={replayOutcomeForUser(record, user)}>
      <header><strong>{({ win: "胜", loss: "负", draw: "和" })[replayOutcomeForUser(record, user)] ?? record.resultText}</strong><span>{record.resultText}</span><span>{record.moveCount}手</span></header>
      <div className="profile-team-lineups">{["black", "white"].map(color => <div key={color}><b>{record[`${color}Name`]}</b><span>{(record.teamLineups?.[color]?.length ? record.teamLineups[color] : [{ characterId: record[`${color}Character`] }]).map((entry, index) => {
        const character = findCharacter(characters, entry.characterId);
        return <span className="profile-team-member" key={`${index}:${entry.characterId}`} title={`${index + 1}号 ${character?.name ?? entry.characterId}`}>{character && <img {...characterPortraitImageProps(character, { variant: "avatar", costumeSnapshot: entry.costumeSnapshot })} alt={character.name} />}<small>{index + 1}</small></span>;
      })}</span></div>)}</div>
      <footer><time>{new Date(record.createdAt).toLocaleDateString("zh-CN")}</time><button data-button-role="tool" type="button" disabled={!onOpenReplay} onClick={() => onOpenReplay?.(record.id)}>对局回放</button></footer>
    </article>)}
    {pagination.loading && <WindowLoadingState compact>正在读取对局记录…</WindowLoadingState>}
    {pagination.error && <div role="alert"><p>{pagination.error}</p><button type="button" onClick={pagination.retry}>重新加载</button></div>}
    {pagination.hasMore && !pagination.error && <button type="button" disabled={pagination.loading} onClick={pagination.loadMore}>加载更多</button>}
  </section>;
}
