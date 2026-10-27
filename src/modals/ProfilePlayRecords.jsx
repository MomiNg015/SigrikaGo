import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { findCharacter } from "../shared/characterDisplay.js";
import { characterPortraitImageProps } from "../shared/characterPortraits.js";
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
  const loading = state.key !== key || state.loading;
  const character = state.record && findCharacter(characters, state.record.characterId);
  return <section className="profile-capture-record" aria-label="吃子挑战成绩" aria-busy={loading}>
    <h3>吃子挑战赛</h3>
    {loading ? <WindowLoadingState compact>正在读取挑战成绩…</WindowLoadingState>
      : state.error ? <div role="alert"><p>{state.error}</p><button type="button" onClick={() => setRetry(n => n + 1)}>重新加载</button></div>
      : !state.record ? <WindowEmptyState compact>暂无吃子挑战成绩</WindowEmptyState>
      : <>
    <dl><div><dt>最高提子</dt><dd>{state.record.captures}<small>子</small></dd></div><div><dt>当前排名</dt><dd>{state.record.ranking}<small>名</small></dd></div></dl>
    <div className="profile-capture-character">{character && <img {...characterPortraitImageProps(character, { variant: "avatar", costumeSnapshot: state.record.costumeSnapshot })} alt="" />}<div><span>最佳成绩使用角色</span><strong>{character?.name ?? state.record.characterId}</strong></div></div>
      </>}
  </section>;
}
