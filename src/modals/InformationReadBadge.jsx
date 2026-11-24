import { Check } from "lucide-react";

export default function InformationReadBadge({ isRead }) {
  return (
    <span className="information-card-badge" data-state={isRead ? "read" : "unread"} title={isRead ? "已读" : "未读"} aria-hidden="true">
      {isRead && <Check size={10} strokeWidth={2.25} />}
    </span>
  );
}
