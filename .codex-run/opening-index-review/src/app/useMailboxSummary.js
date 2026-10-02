import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client.js";

export const EMPTY_MAILBOX_SUMMARY = Object.freeze({ unreadCount: 0, claimableCount: 0, badgeCount: 0 });

export function normalizeMailboxSummary(summary = {}) {
  return {
    unreadCount: Number(summary.unreadCount ?? 0),
    claimableCount: Number(summary.claimableCount ?? 0),
    badgeCount: Number(summary.badgeCount ?? 0)
  };
}

export function useMailboxSummary({ mailboxOpen, token, user }) {
  const [mailboxSummary, setMailboxSummary] = useState(EMPTY_MAILBOX_SUMMARY);

  const refreshMailboxSummary = useCallback(async () => {
    if (!token || !user) {
      setMailboxSummary(EMPTY_MAILBOX_SUMMARY);
      return;
    }
    try {
      const summary = await api("/api/mailbox/summary", { token });
      setMailboxSummary(normalizeMailboxSummary(summary));
    } catch {
      setMailboxSummary(EMPTY_MAILBOX_SUMMARY);
    }
  }, [token, user?.id]);

  useEffect(() => {
    if (!token || !user) {
      setMailboxSummary(EMPTY_MAILBOX_SUMMARY);
      return undefined;
    }
    refreshMailboxSummary();
    const timer = window.setInterval(refreshMailboxSummary, 30000);
    return () => window.clearInterval(timer);
  }, [refreshMailboxSummary, token, user?.id]);

  useEffect(() => {
    if (!mailboxOpen) return;
    refreshMailboxSummary();
  }, [mailboxOpen, refreshMailboxSummary]);

  return { mailboxSummary, refreshMailboxSummary };
}
