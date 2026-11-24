import { Archive, Check } from "lucide-react";

export default function InformationCardBadges({ isRead, attachmentState }) {
  return (
    <span className="information-card-badges" aria-hidden="true">
      <span className="information-card-badge" data-state={isRead ? "read" : "unread"} title={isRead ? "已读" : "未读"}>
        {isRead && <Check size={12} strokeWidth={3} />}
      </span>
      {attachmentState && (
        <span className="information-card-badge" data-state={attachmentState} title={attachmentState === "claimable" ? "附件待领取" : "附件已领取"}>
          <Archive size={11} strokeWidth={2.4} />
        </span>
      )}
    </span>
  );
}
