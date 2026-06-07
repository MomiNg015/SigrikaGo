import { AdminStat } from "./adminComponents.jsx";

export default function AdminOverview({ summary }) {
  const cards = [
    ["用户", summary?.summary?.users ?? 0],
    ["封禁", summary?.summary?.bannedUsers ?? 0],
    ["角色", summary?.summary?.characters ?? 0],
    ["棋谱", summary?.summary?.gameRecords ?? 0]
  ];
  return (
    <div className="admin-grid">
      {cards.map(([label, value]) => <AdminStat key={label} label={label} value={value} />)}
    </div>
  );
}
