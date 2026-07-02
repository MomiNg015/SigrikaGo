import { AdminSectionHeader, AdminTableScroll } from "./adminComponents.jsx";
import { formatDateTime } from "./adminFormatters.js";

export default function AdminReports({ reports }) {
  return (
    <section className="admin-list-section">
      <AdminSectionHeader title="用户举报" meta={`${reports.length} 条最近举报`} />
      <AdminTableScroll>
        <table className="admin-table feedback-table user-report-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>举报者</th>
              <th>被举报者</th>
              <th>内容</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{formatDateTime(report.createdAt)}</td>
                <td>{report.reporterUsername}</td>
                <td>{report.reportedUsername}</td>
                <td>{report.content}</td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan="4">暂无用户举报</td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableScroll>
    </section>
  );
}
