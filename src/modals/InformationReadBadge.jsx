export default function InformationReadBadge({ isRead }) {
  return (
    <span className="information-card-badge" data-state={isRead ? "read" : "unread"} title={isRead ? "已读" : "未读"} aria-hidden="true" />
  );
}
