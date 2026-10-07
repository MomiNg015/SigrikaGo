import WindowTitleSticker from "./WindowTitleSticker.jsx";
import { useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { api } from "../api/client.js";
import { ModalActionButton, ModalDialog } from "./modalComponents.jsx";

const FEEDBACK_MAX_LENGTH = 400;

export default function MessageBoardModal({ token, onSubmitted, onClose }) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submissionPendingRef = useRef(false);

  async function submitFeedback(event) {
    event.preventDefault();
    if (submissionPendingRef.current) return;
    const normalized = content.trim();
    if (!normalized) {
      setError("反馈内容不能为空");
      return;
    }
    submissionPendingRef.current = true;
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
      submissionPendingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <ModalDialog as="form" className="message-board-modal window-sticker-host" ariaLabelledBy="message-board-title" onClose={onClose} onSubmit={submitFeedback} onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" aria-label="关闭反馈窗口" onClick={onClose}><X size={20} /></button>
        <WindowTitleSticker titleKey="message-board" id="message-board-title" />
        <textarea
          className="message-board-input"
          aria-label="反馈内容"
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
        <ModalActionButton variant="primary" type="submit" disabled={submitting}>
          <Send size={18} />{submitting ? "提交中" : "提交"}
        </ModalActionButton>
      </ModalDialog>
    </div>
  );
}
