import { RotateCcw, Shuffle, Timer } from "lucide-react";

export default function TestTools({ disabled, onRandomLayout, onRestoreSkill, onEnterByoYomi }) {
  return (
    <span className="test-tools" aria-label="测试工具">
      <button title="随机布局" onClick={onRandomLayout} disabled={disabled}>
        <Shuffle size={18} />随机布局
      </button>
      <button title="恢复技能" onClick={onRestoreSkill} disabled={disabled}>
        <RotateCcw size={18} />恢复技能
      </button>
      <button title="进入读秒" onClick={onEnterByoYomi} disabled={disabled}>
        <Timer size={18} />进入读秒
      </button>
    </span>
  );
}
