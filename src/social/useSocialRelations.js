import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client.js";

export function useSocialRelations({ token, onError } = {}) {
  const [friends, setFriends] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const onErrorRef = useRef(onError);
  const friendIds = useMemo(() => new Set(friends.map((row) => row.id)), [friends]);
  const blacklistIds = useMemo(() => new Set(blacklist.map((row) => row.id)), [blacklist]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const applySocialData = useCallback((data = {}) => {
    setFriends(data.friends ?? []);
    setBlacklist(data.blacklist ?? []);
  }, []);

  const refreshSocial = useCallback(async () => {
    if (!token) return null;
    try {
      const data = await api("/api/social", { token });
      applySocialData(data);
      return data;
    } catch (error) {
      onErrorRef.current?.(error);
      return null;
    }
  }, [applySocialData, token]);

  const updateFriend = useCallback(async (userId, method) => {
    const data = await api(`/api/social/friends/${userId}`, { method, token });
    applySocialData(data);
    return data;
  }, [applySocialData, token]);

  const updateBlacklist = useCallback(async (userId, method) => {
    const data = await api(`/api/social/blacklist/${userId}`, { method, token });
    applySocialData(data);
    return data;
  }, [applySocialData, token]);

  const loadProfile = useCallback(async (userId) => {
    const data = await api(`/api/users/${userId}/profile`, { token });
    return data.profile;
  }, [token]);

  return {
    applySocialData,
    blacklist,
    blacklistIds,
    friendIds,
    friends,
    loadProfile,
    refreshSocial,
    updateBlacklist,
    updateFriend
  };
}
