import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client.js";

export function useRecruitmentCatalog({ token, user, onNotice, onUserChange, onStatusChange }) {
  const [items, setItems] = useState([]);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItemType, setSelectedItemType] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [, setTick] = useState(0);

  async function refresh() {
    if (!token || !user) return;
    const data = await api("/api/recruitment", { token });
    setItems(data.items ?? []);
    setTask(data.task ?? null);
    onStatusChange?.(data.task ?? null);
    if (!selectedItemType && data.items?.[0]) setSelectedItemType(data.items[0].itemType);
    return data;
  }

  useEffect(() => {
    let alive = true;
    setLoading(true);
    refresh()
      .catch((error) => {
        if (alive) onNotice?.(error.message, "danger");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token, user?.id]);

  useEffect(() => {
    if (!task || task.status !== "pending") return undefined;
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [task?.id, task?.status]);

  useEffect(() => {
    if (!task || task.status !== "pending") return undefined;
    const remaining = Number(task.remainingMs ?? 0);
    if (remaining <= 0) {
      refresh().catch(() => {});
      return undefined;
    }
    const timeout = window.setTimeout(() => refresh().catch(() => {}), remaining + 400);
    return () => window.clearTimeout(timeout);
  }, [task?.id, task?.status, task?.remainingMs]);

  const selectedItem = useMemo(
    () => items.find((item) => item.itemType === selectedItemType) ?? items[0] ?? null,
    [items, selectedItemType]
  );

  async function start() {
    if (!selectedItem) return;
    setBusy(true);
    try {
      const data = await api("/api/recruitment/start", {
        method: "POST",
        token,
        body: { itemType: selectedItem.itemType }
      });
      setTask(data.task ?? null);
      setResult(null);
      onUserChange?.(data.user);
      onStatusChange?.(data.task ?? null);
      await refresh();
    } catch (error) {
      onNotice?.(error.message, "danger");
    } finally {
      setBusy(false);
    }
  }

  async function claim() {
    setBusy(true);
    try {
      const data = await api("/api/recruitment/claim", { method: "POST", token });
      setTask(data.task ?? null);
      setResult(data.task?.result ?? null);
      onUserChange?.(data.user);
      onStatusChange?.(data.task ?? null);
    } catch (error) {
      onNotice?.(error.message, "danger");
    } finally {
      setBusy(false);
    }
  }

  function clearResult() {
    setResult(null);
    setTask(null);
    refresh().catch(() => {});
  }

  return {
    busy,
    clearResult,
    claim,
    items,
    loading,
    result,
    selectedItem,
    selectedItemType,
    setSelectedItemType,
    start,
    task
  };
}

export function formatRecruitmentCountdown(task) {
  const remaining = Math.max(0, new Date(task?.readyAt ?? 0).getTime() - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
