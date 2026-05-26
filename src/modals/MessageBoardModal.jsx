import { useState } from "react";
import { Send, X } from "lucide-react";
import { api } from "../api/client.js";

const FEEDBACK_MAX_LENGTH = 400;

export default function MessageBoardModal({ token, onSubmitted, onClose }) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submitFeedback(event) {
    event.preventDefault();
    const normalized = content.trim();
    if (!normalized) {
      setError("反馈内容不能为空");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api("/api/feedback", {
        method: "POST",
        token,
        body: { content: normalized }
      });
      setContent("");
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="message-board-modal" onSubmit={submitFeedback} onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" onClick={onClose}><X size={20} /></button>
        <h2>留言板</h2>
        <textarea
          maxLength={FEEDBACK_MAX_LENGTH}
          value={content}
          onChange={(event) => {
            setError("");
            setContent(event.target.value);
          }}
          placeholder="Bug、问题反馈和意见都可以在这里提交哦"
        />
        <div className="message-board-counter">还可以输入 {FEEDBACK_MAX_LENGTH - content.length} 个字符</div>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-action" type="submit" disabled={submitting}>
          <Send size={18} />{submitting ? "提交中" : "提交"}
        </button>
      </form>
    </div>
  );
}
