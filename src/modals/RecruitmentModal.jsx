import { useEffect, useRef } from "react";
import { ClipboardList, Clock, Radio, X } from "lucide-react";
import { playRecruitmentResultSound } from "../audio/playback.jsx";
import { formatRecruitmentCountdown, useRecruitmentCatalog } from "./recruitment/useRecruitmentCatalog.js";

export default function RecruitmentModal({
  audioSettings,
  characters = {},
  token,
  user,
  onUserChange,
  onNotice,
  onClose,
  onStatusChange
}) {
  const {
    busy,
    canFastForward,
    clearResult,
    claim,
    fastForward,
    items,
    loading,
    result,
    selectedItem,
    selectedItemType,
    setSelectedItemType,
    start,
    task
  } = useRecruitmentCatalog({ token, user, onNotice, onUserChange, onStatusChange });

  const phase = result ? "result" : task?.status === "ready" ? "ready" : task?.status === "pending" ? "pending" : "idle";
  const canUse = phase === "idle" && selectedItem && selectedItem.quantity > 0 && !busy;
  const playedResultSoundRef = useRef(null);

  useEffect(() => {
    if (!result) {
      playedResultSoundRef.current = null;
      return;
    }
    const soundKey = `${result.type}:${result.characterId ?? "miss"}:${result.text ?? ""}`;
    if (playedResultSoundRef.current === soundKey) return;
    playedResultSoundRef.current = soundKey;
    playRecruitmentResultSound(result.type, audioSettings);
  }, [audioSettings, result]);

  return (
    <div className="modal-backdrop recruitment-backdrop" onClick={onClose}>
      <section className={`recruitment-modal recruitment-phase-${phase} ${result?.type === "success" ? "recruitment-result-success-phase" : result ? "recruitment-result-miss-phase" : ""}`} onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose}><X size={20} /></button>
        <header className="recruitment-header">
          <div>
            <h2>部员招募栏</h2>
          </div>
        </header>

        <main className={`recruitment-board recruitment-board-${phase}`}>
          {loading && <p className="quiet-text">加载招新公示中...</p>}
          {!loading && phase === "idle" && <IdleBoard selectedItem={selectedItem} />}
          {!loading && phase === "pending" && <PendingBoard task={task} busy={busy} canFastForward={canFastForward} onFastForward={fastForward} />}
          {!loading && phase === "ready" && <ReadyBoard task={task} busy={busy} onClaim={claim} />}
          {!loading && phase === "result" && <ResultBoard result={result} task={task} characters={characters} />}
        </main>

        {phase === "idle" && (
          <footer className="recruitment-actions">
            <div className="recruitment-item-strip" role="tablist" aria-label="招募道具">
              {items.map((item) => (
                <button
                  key={item.itemType}
                  className={`recruitment-item-button ${selectedItemType === item.itemType ? "active" : ""}`}
                  type="button"
                  onClick={() => setSelectedItemType(item.itemType)}
                >
                  <RecruitmentItemIcon item={item} />
                  <span>{item.name}</span>
                  <b>x{item.quantity}</b>
                </button>
              ))}
            </div>
            <button className="primary-action recruitment-use-button" type="button" disabled={!canUse} onClick={start}>
              {busy ? "张贴中" : canUse ? "使用" : "不可用"}
            </button>
          </footer>
        )}
        {phase === "result" && (
          <footer className="recruitment-actions recruitment-result-actions">
            <button className="primary-action recruitment-use-button" type="button" onClick={clearResult}>
              {result?.type === "success" ? "欢迎新部员！" : "收回道具"}
            </button>
          </footer>
        )}
      </section>
    </div>
  );
}

function IdleBoard({ selectedItem }) {
  if (!selectedItem) {
    return (
      <section className="recruitment-empty-board">
        <strong>今日招新公示</strong>
        <span>选择一个招募道具后，这里会贴上本次招新说明。</span>
      </section>
    );
  }
  return (
    <section className="recruitment-selection-card">
      <RecruitmentItemIcon item={selectedItem} large />
      <div>
        <strong>{selectedItem.name}</strong>
        <span>{selectedItem.scopeLabel}</span>
        <p>{selectedItem.confidenceText}</p>
      </div>
    </section>
  );
}

function PendingBoard({ task, busy, canFastForward, onFastForward }) {
  return (
    <section className="recruitment-status-card">
      <RecruitmentItemIcon item={task} large />
      <div>
        <strong>{task.itemName}</strong>
        <div className={`recruitment-countdown-row ${canFastForward ? "has-fast-forward" : ""}`}>
          <b>{formatRecruitmentCountdown(task)}</b>
          {canFastForward && (
            <button
              className="recruitment-fast-forward-button"
              type="button"
              disabled={busy}
              onClick={onFastForward}
              title="快速计时到 5 秒"
              aria-label="快速计时到 5 秒"
            >
              <Clock size={20} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function ReadyBoard({ task, busy, onClaim }) {
  return (
    <section className="recruitment-status-card">
      <RecruitmentItemIcon item={task} large />
      <div>
        <strong>{task.itemName}</strong>
        <button className="primary-action" type="button" disabled={busy} onClick={onClaim}>
          查看招新回应
        </button>
      </div>
    </section>
  );
}

function ResultBoard({ result, task, characters }) {
  const character = result?.characterId ? characters[result.characterId] : null;
  if (result?.type !== "success") {
    return (
      <section className="recruitment-result-card recruitment-result-miss">
        <RecruitmentItemIcon item={task} large />
        <div>
          <p>{result?.text}</p>
        </div>
      </section>
    );
  }
  return (
    <section className="recruitment-result-card recruitment-result-success">
      {character?.portrait ? <img src={character.portrait} alt={character.name} /> : <RecruitmentItemIcon item={task} large />}
      <div>
        <strong>{character?.name ?? result.characterId}</strong>
        <p>{result.text}</p>
      </div>
    </section>
  );
}

function RecruitmentItemIcon({ item, large = false }) {
  const isRadio = String(item?.itemType ?? "").includes("radio");
  const className = `recruitment-item-icon ${large ? "large" : ""}`;
  if (item?.imageUrl) return <img className={className} src={item.imageUrl} alt="" loading="lazy" decoding="async" />;
  return <span className={className} aria-hidden="true">{isRadio ? <Radio size={large ? 36 : 22} /> : <ClipboardList size={large ? 36 : 22} />}</span>;
}
