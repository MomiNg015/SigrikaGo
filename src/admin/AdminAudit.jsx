import { formatDateTime } from "./adminFormatters.js";
import { AdminTableScroll } from "./adminComponents.jsx";

export default function AdminAudit({ logs }) {
  return (
    <AdminTableScroll>
      <table className="admin-table audit-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>管理员</th>
            <th>动作</th>
            <th>目标</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{formatDateTime(log.createdAt)}</td>
              <td>{log.adminUserId ?? "-"}</td>
              <td>{log.action}</td>
              <td>{log.targetType ?? "-"} · {log.targetId ?? "-"}</td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan="4">暂无审计日志</td>
            </tr>
          )}
        </tbody>
      </table>
    </AdminTableScroll>
  );
}
