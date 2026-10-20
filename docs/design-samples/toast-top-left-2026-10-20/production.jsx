import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { ToastStack } from "../../../src/modals/FeedbackModals.jsx";
import { useToastQueue } from "../../../src/app/useToastQueue.js";
import "../../../src/styles.css";

function Preview() {
  const { toasts, showToast, removeToast } = useToastQueue();
  useEffect(() => { showToast("设置已保存，可以继续对弈啦。", "success"); }, [showToast]);
  return (
    <main className="app-shell player-theme-enabled theme-bright-school" style={{ minHeight: "100dvh", padding: "180px 24px 24px" }}>
      <ToastStack toasts={toasts} onClose={removeToast} />
      <section style={{ maxWidth: 600, margin: "auto", fontFamily: '"Sigrika Window Title", sans-serif' }}>
        <h1>清爽抽屉条</h1>
        <p>正式 Toast 组件 · 霞鹜漫黑 · 左上推进 / 原路收回</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <button onClick={() => showToast("设置已保存，可以继续对弈啦。", "success")}>成功</button>
          <button onClick={() => showToast("房间已满，换个房间试试吧。", "error")}>失败</button>
          <button onClick={() => showToast("本机陪练引擎加载失败，请检查网络后重试，或使用新版浏览器。", "warning")}>长文案</button>
          <button onClick={() => showToast("有一封新邮件，记得去看看。", "mail")}>来信</button>
          <button onClick={() => showToast("第一场胜利，值得好好纪念。", "achievement")}>成就</button>
          <button onClick={() => showToast("长离 · 谋定后动：第 1 / 2 手。", "info")}>信息</button>
        </div>
        <p>悬停或聚焦提示可暂停计时。此页面只使用本地示例消息。</p>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<Preview />);
