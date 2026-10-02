import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client.js";

const EMPTY_SUMMARY = Object.freeze({
  hasUnread: false,
  unreadByKind: Object.freeze({
    announcement: false,
    changelog: false
  }),
  unreadCounts: Object.freeze({
    announcement: 0,
    changelog: 0
  })
});

export function useAnnouncementSummary({ announcementOpen = false, token, user, view }) {
  const [announcementSummary, setAnnouncementSummary] = useState(EMPTY_SUMMARY);

  const refreshAnnouncementSummary = useCallback(async () => {
    if (!token || !user) {
      setAnnouncementSummary(EMPTY_SUMMARY);
      return EMPTY_SUMMARY;
    }
    const summary = await api("/api/announcements/summary", { token });
    setAnnouncementSummary(normalizeAnnouncementSummary(summary));
    return summary;
  }, [token, user?.id]);

  useEffect(() => {
    if (!token || !user) {
      setAnnouncementSummary(EMPTY_SUMMARY);
      return;
    }
    if (view !== "home" && !announcementOpen) return;
    refreshAnnouncementSummary().catch(() => {});
  }, [announcementOpen, refreshAnnouncementSummary, token, user, view]);

  return { announcementSummary, refreshAnnouncementSummary };
}

function normalizeAnnouncementSummary(summary) {
  return {
    hasUnread: Boolean(summary?.hasUnread),
    unreadByKind: {
      announcement: Boolean(summary?.unreadByKind?.announcement),
      changelog: Boolean(summary?.unreadByKind?.changelog)
    },
    unreadCounts: {
      announcement: Number(summary?.unreadCounts?.announcement ?? 0),
      changelog: Number(summary?.unreadCounts?.changelog ?? 0)
    }
  };
}
