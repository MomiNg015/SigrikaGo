import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";

export const REPLAY_LOAD_MORE_THRESHOLD_PX = 48;

export function useReplayPagination({ enabled, endpoint, token }) {
  const [records, setRecords] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestVersionRef = useRef(0);
  const loadingRef = useRef(false);

  const loadPage = useCallback(async (cursor = "", replace = false) => {
    if (!endpoint || loadingRef.current) return;
    const requestVersion = requestVersionRef.current;
    loadingRef.current = true;
    setLoading(true);
    setError("");
    try {
      const data = await api(replayPageUrl(endpoint, cursor), { token });
      if (requestVersion !== requestVersionRef.current) return;
      const incoming = Array.isArray(data.records) ? data.records : [];
      setRecords((current) => replace ? incoming : appendUniqueRecords(current, incoming));
      setNextCursor(data.nextCursor || null);
    } catch (loadError) {
      if (requestVersion === requestVersionRef.current) setError(loadError.message);
    } finally {
      if (requestVersion === requestVersionRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [endpoint, token]);

  useEffect(() => {
    requestVersionRef.current += 1;
    loadingRef.current = false;
    setRecords([]);
    setNextCursor(null);
    setLoading(false);
    setError("");
    if (enabled && endpoint) void loadPage("", true);
    return () => {
      requestVersionRef.current += 1;
      loadingRef.current = false;
    };
  }, [enabled, endpoint, loadPage]);

  const loadMore = useCallback(() => {
    if (!enabled || !nextCursor || loadingRef.current) return;
    void loadPage(nextCursor, false);
  }, [enabled, loadPage, nextCursor]);

  const onScroll = useCallback((event) => {
    if (shouldLoadMoreFromScroll(event.currentTarget)) loadMore();
  }, [loadMore]);

  const retry = useCallback(() => {
    void loadPage(records.length > 0 ? nextCursor : "", records.length === 0);
  }, [loadPage, nextCursor, records.length]);

  return {
    records,
    loading,
    error,
    hasMore: Boolean(nextCursor),
    loadMore,
    onScroll,
    retry
  };
}

export function replayPageUrl(endpoint, cursor = "") {
  if (!cursor) return endpoint;
  return `${endpoint}${endpoint.includes("?") ? "&" : "?"}cursor=${encodeURIComponent(cursor)}`;
}

export function shouldLoadMoreFromScroll(element, threshold = REPLAY_LOAD_MORE_THRESHOLD_PX) {
  if (!element) return false;
  return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
}

function appendUniqueRecords(current, incoming) {
  const seen = new Set(current.map((record) => record.id));
  return [...current, ...incoming.filter((record) => !seen.has(record.id))];
}
