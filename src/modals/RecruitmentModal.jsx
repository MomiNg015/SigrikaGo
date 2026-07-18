import { useEffect, useRef, useState } from "react";
import { ClipboardList, Clock, Radio, Ticket, X } from "lucide-react";
import { playRecruitmentResultSound } from "../audio/playback.jsx";
import { RECRUITMENT_ITEM_TYPES } from "../shared/recruitment.js";
import { ModalDialog } from "./modalComponents.jsx";
import RecruitmentCinematicOverlay from "./recruitment/RecruitmentCinematicOverlay.jsx";
import { formatRecruitmentCountdown, useRecruitmentCatalog } from "./recruitment/useRecruitmentCatalog.js";

export default function RecruitmentModal({
  audioSettings,
  characters = {},
  token,
  user,
  onUserChange,
  onNotice,
  onClose,
  onStatusChange,
  onInteractionLockChange
}) {
  const {
    busy,
    canFastForward,
    cinematicPlaybackTaskId,
    clearResult,
    claim,
    fastForward,
    finishCinematic,
    interruptCinematic,
    items,
    loading,
    presentationReadyAt,
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
  const countdownRef = useRef(null);
  const [cinematicElapsedMs, setCinematicElapsedMs] = useState(null);
  const cinematicPlaying = phase === "pending"
    && Boolean(task?.cinematic)
    && cinematicPlaybackTaskId === task.id;

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

  useEffect(() => {
    if (!cinematicPlaying) setCinematicElapsedMs(null);
  }, [cinematicPlaying]);

  const closeModal = cinematicPlaying ? undefined : onClose;

  return (
    <div className={`modal-backdrop recruitment-backdrop ${cinematicPlaying ? "is-cinematic-locked" : ""}`} onClick={closeModal}>
      <ModalDialog
        className={`recruitment-modal recruitment-phase-${phase} ${cinematicPlaying ? "recruitment-cinematic-playing" : ""} ${result?.type === "success" ? "recruitment-result-success-phase" : result ? "recruitment-result-miss-phase" : ""}`}
        ariaLabelledBy="recruitment-modal-title"
        onClose={closeModal}
        onClick={(event) => event.stopPropagation()}
      >
        {!cinematicPlaying && <button className="close-button" type="button" onClick={onClose}><X size={20} /></button>}
        <header className="recruitment-header">
          <div>
            <h2 id="recruitment-modal-title">部员招募栏</h2>
          </div>
        </header>

        <main className={`recruitment-board recruitment-board-${phase}`}>
          {loading && <p className="quiet-text">加载招新公示中...</p>}
          {!loading && phase === "idle" && <IdleBoard selectedItem={selectedItem} />}
          {!loading && phase === "pending" && (
            <PendingBoard
              task={task}
              busy={busy}
              canFastForward={canFastForward && !task.cinematic}
              cinematicElapsedMs={cinematicPlaying ? cinematicElapsedMs : null}
              presentationReadyAt={presentationReadyAt}
              countdownRef={countdownRef}
              onFastForward={fastForward}
            />
          )}
          {!loading && phase === "ready" && <ReadyBoard task={task} busy={busy} onClaim={claim} />}
          {!loading && phase === "result" && <ResultBoard result={result} task={task} characters={characters} />}
        </main>

        {phase === "idle" && (
          <footer className="recruitment-actions">
            <div
              className="recruitment-item-strip"
              role="tablist"
              aria-label="招募道具"
              style={{ "--recruitment-item-count": items.length }}
            >
              {items.map((item) => (
                <button
                  key={item.itemType}
                  className={`recruitment-item-button ${item.appearanceId ? `recruitment-item-${item.appearanceId}` : ""} ${selectedItemType === item.itemType ? "active" : ""}`}
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
              {busy ? "张贴中" : canUse ? "使用" : "数量不足"}
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
      </ModalDialog>
      {cinematicPlaying && (
        <RecruitmentCinematicOverlay
          audioSettings={audioSettings}
          task={task}
          targetRef={countdownRef}
          onComplete={finishCinematic}
          onElapsedChange={setCinematicElapsedMs}
          onInteractionLockChange={onInteractionLockChange}
          onInterrupt={interruptCinematic}
        />
      )}
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
      <RecruitmentItemWatermark item={selectedItem} />
      <div>
        <strong>{selectedItem.name}</strong>
        {selectedItem.scopeLabel !== selectedItem.confidenceText && <span>{selectedItem.scopeLabel}</span>}
        <p>{selectedItem.confidenceText}</p>
      </div>
    </section>
  );
}

function PendingBoard({ task, busy, canFastForward, cinematicElapsedMs, presentationReadyAt, countdownRef, onFastForward }) {
  return (
    <section className="recruitment-pending-panel">
      <RecruitmentItemWatermark item={task} />
      <div>
        <strong>{task.itemName}</strong>
        <div className={`recruitment-countdown-row ${canFastForward ? "has-fast-forward" : ""}`}>
          <b ref={countdownRef}>{formatRecruitmentCountdown(task, cinematicElapsedMs, presentationReadyAt)}</b>
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
    <section className="recruitment-status-card recruitment-ready-card">
      <RecruitmentItemWatermark item={task} />
      <div>
        <button className="primary-action" type="button" disabled={busy} onClick={onClaim}>
          瞧瞧有没有新部员！
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
  const isAemeathTicket = item?.itemType === RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket;
  const className = `recruitment-item-icon ${large ? "large" : ""}`;
  const imageUrl = recruitmentItemImageUrl(item);
  if (imageUrl) return <img className={className} src={imageUrl} alt="" loading="lazy" decoding="async" />;
  return (
    <span className={className} aria-hidden="true">
      {isAemeathTicket
        ? <Ticket size={large ? 36 : 22} />
        : isRadio ? <Radio size={large ? 36 : 22} /> : <ClipboardList size={large ? 36 : 22} />}
    </span>
  );
}

function RecruitmentItemWatermark({ item }) {
  const imageUrl = recruitmentItemImageUrl(item);
  if (!imageUrl) return null;
  return (
    <span className="recruitment-item-watermark" aria-hidden="true">
      <img className="recruitment-item-watermark-art" src={imageUrl} alt="" loading="lazy" decoding="async" />
    </span>
  );
}

function recruitmentItemImageUrl(item) {
  return String(item?.imageUrl || item?.itemImageUrl || "").trim();
}
