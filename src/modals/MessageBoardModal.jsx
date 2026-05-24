import { Send, X } from "lucide-react";

export default function MessageBoardModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="message-board-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <h2>留言板</h2>
        <textarea placeholder="Bug、问题反馈和意见都可以在这里提交哦" />
        <button className="primary-action" type="button">
          <Send size={18} />提交
        </button>
      </section>
    </div>
  );
}
