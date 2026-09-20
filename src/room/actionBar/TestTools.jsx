import { RotateCcw, Shuffle, Timer } from "lucide-react";

export default function TestTools({ disabled, onGameAction }) {
  return (
    <span className="test-tools room-header-test-tools" role="group" aria-label="测试工具">
      <button type="button" className="toggle" aria-label="随机布局" title="随机布局" onClick={() => onGameAction({ type: "test-random-layout" })} disabled={disabled}>
        <Shuffle size={18} aria-hidden="true" />
      </button>
      <button type="button" className="toggle" aria-label="恢复技能" title="恢复技能" onClick={() => onGameAction({ type: "test-restore-skill" })} disabled={disabled}>
        <RotateCcw size={18} aria-hidden="true" />
      </button>
      <button type="button" className="toggle" aria-label="进入读秒" title="进入读秒" onClick={() => onGameAction({ type: "test-enter-byo-yomi" })} disabled={disabled}>
        <Timer size={18} aria-hidden="true" />
      </button>
    </span>
  );
}
