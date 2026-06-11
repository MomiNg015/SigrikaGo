import { useCallback, useState } from "react";

export function useCurrentUser() {
  const [user, setUser] = useState(null);

  const updateUser = useCallback((nextUserOrUpdater) => {
    setUser((current) => {
      return typeof nextUserOrUpdater === "function" ? nextUserOrUpdater(current) : nextUserOrUpdater;
    });
  }, []);

  return { setUser, updateUser, user };
}
