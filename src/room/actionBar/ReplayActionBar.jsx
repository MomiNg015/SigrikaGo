import { MonitorPlay, SkipBack, SkipForward, StepBack, StepForward } from "lucide-react";

export default function ReplayActionBar({ replayStep = 0, replayMax = 0, mode = "replay", onReplayStep }) {
  const isSpectator = mode === "spectator";
  const isFollowingLive = replayStep >= replayMax;
  const stepLabel = isSpectator
    ? isFollowingLive ? `实时 · ${replayMax}手` : `回看 ${replayStep}/${replayMax}`
    : `${replayStep}/${replayMax}`;

  return (
    <nav className={`action-bar replay-bar ${isSpectator ? "spectator-replay-bar" : "record-replay-bar"}`} aria-label={isSpectator ? "观战进度" : "棋谱回放进度"}>
      <button type="button" title="回到第 0 手" aria-label="回到第 0 手" onClick={() => onReplayStep?.(0)} disabled={!onReplayStep || replayStep <= 0}>
        <SkipBack size={20} aria-hidden="true" />
      </button>
      <button type="button" title="上一手" aria-label="上一手" onClick={() => onReplayStep?.(Math.max(0, replayStep - 1))} disabled={!onReplayStep || replayStep <= 0}>
        <StepBack size={20} aria-hidden="true" />
      </button>
      <span className="replay-step-indicator" aria-live="polite"><MonitorPlay size={16} aria-hidden="true" />{stepLabel}</span>
      <button type="button" title="下一手" aria-label="下一手" onClick={() => onReplayStep?.(Math.min(replayMax, replayStep + 1))} disabled={!onReplayStep || replayStep >= replayMax}>
        <StepForward size={20} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={isSpectator ? "replay-return-live" : undefined}
        title={isSpectator ? "回到实时" : "跳到最新一手"}
        aria-label={isSpectator ? "回到实时" : "跳到最新一手"}
        onClick={() => onReplayStep?.(replayMax)}
        disabled={!onReplayStep || replayStep >= replayMax}
      >
        <SkipForward size={20} aria-hidden="true" />
        {isSpectator && !isFollowingLive && <span className="replay-return-live-label">回到实时</span>}
      </button>
    </nav>
  );
}
