import { DoorOpen, MonitorPlay, SkipBack, SkipForward, StepBack, StepForward } from "lucide-react";

export default function ReplayActionBar({ replayStep = 0, replayMax = 0, onReplayStep, onBack }) {
  return (
    <nav className="action-bar replay-bar">
      <button title="回到第 0 手" onClick={() => onReplayStep?.(0)} disabled={!onReplayStep || replayStep <= 0}>
        <SkipBack size={20} />
      </button>
      <button title="上一手" onClick={() => onReplayStep?.(Math.max(0, replayStep - 1))} disabled={!onReplayStep || replayStep <= 0}>
        <StepBack size={20} />
      </button>
      <span className="replay-step-indicator"><MonitorPlay size={16} />{replayStep}/{replayMax}</span>
      <button title="下一手" onClick={() => onReplayStep?.(Math.min(replayMax, replayStep + 1))} disabled={!onReplayStep || replayStep >= replayMax}>
        <StepForward size={20} />
      </button>
      <button title="跳到最新一手" onClick={() => onReplayStep?.(replayMax)} disabled={!onReplayStep || replayStep >= replayMax}>
        <SkipForward size={20} />
      </button>
      <button className="exit-action" onClick={onBack}><DoorOpen size={18} /><span className="action-label">退出房间</span></button>
    </nav>
  );
}
