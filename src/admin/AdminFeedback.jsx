import { AdminSectionHeader } from "./adminComponents.jsx";
import { formatDateTime } from "./adminFormatters.js";

export default function AdminFeedback({ messages }) {
  return (
    <section className="admin-list-section">
      <AdminSectionHeader title="留言反馈" meta={`${messages.length} 条最近反馈`} />
      <div className="admin-table-wrap">
        <table className="admin-table feedback-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>用户</th>
              <th>内容</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((message) => (
              <tr key={message.id}>
                <td>{formatDateTime(message.createdAt)}</td>
                <td>{message.username}</td>
                <td>{message.content}</td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr>
                <td colSpan="3">暂无留言反馈</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
