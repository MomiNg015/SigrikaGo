import { useCallback, useState } from "react";
import { buildStatChangeToasts } from "./statChangeToast.js";

export function useCurrentUser(showToast) {
  const [user, setUser] = useState(null);

  const updateUser = useCallback((nextUserOrUpdater, { notifyStats = true } = {}) => {
    setUser((current) => {
      const nextUser = typeof nextUserOrUpdater === "function" ? nextUserOrUpdater(current) : nextUserOrUpdater;
      const notices = notifyStats ? buildStatChangeToasts(current, nextUser) : [];
      for (const notice of notices) {
        setTimeout(() => showToast(notice.text, notice.tone), 0);
      }
      return nextUser;
    });
  }, [showToast]);

  return { setUser, updateUser, user };
}
