import { Send, X } from "lucide-react";

export default function MessageBoardModal({ onClose }) {
  return (
    <div className="modal-backdrop">
      <section className="message-board-modal">
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <h2>留言板</h2>
        <textarea placeholder="写下想给棋舍留下的话" />
        <button className="primary-action" type="button">
          <Send size={18} />提交
        </button>
      </section>
    </div>
  );
}
