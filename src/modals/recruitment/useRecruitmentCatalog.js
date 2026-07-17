import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client.js";
import {
  AEMEATH_RECRUITMENT_TIMING,
  cinematicPresentationReadyAt,
  recruitmentReadyDelayMs
} from "../../shared/recruitment.js";

export function useRecruitmentCatalog({ token, user, onNotice, onUserChange, onStatusChange }) {
  const canFastForward =
    import.meta.env.DEV ||
    import.meta.env.MODE === "development" ||
    import.meta.env.VITE_ENABLE_TEST_TOOLS === "true";
  const [items, setItems] = useState([]);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItemType, setSelectedItemType] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [cinematicPlaybackTaskId, setCinematicPlaybackTaskId] = useState("");
  const [cinematicCompletedTaskId, setCinematicCompletedTaskId] = useState("");
  const [presentationReadyAt, setPresentationReadyAt] = useState("");
  const [, setTick] = useState(0);

  async function refresh() {
    if (!token || !user) return;
    const data = await api("/api/recruitment", { token });
    setItems(data.items ?? []);
    let nextTask = data.task ?? null;
    if (nextTask?.status === "pending" && nextTask.cinematic) {
      try {
        const interrupted = await api("/api/recruitment/interrupt-cinematic", { method: "POST", token });
        nextTask = interrupted.task ?? nextTask;
      } catch {
        // Keep the fetched task visible; the recovery effect retries interruption immediately.
      }
    }
    setTask(nextTask);
    setPresentationReadyAt((current) => nextTask?.status === "pending" ? current : "");
    onStatusChange?.(nextTask);
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
    if (presentationReadyAt) {
      const remainingMs = Math.max(0, new Date(presentationReadyAt).getTime() - Date.now());
      const timeout = window.setTimeout(() => {
        const readyTask = presentationReadyRecruitmentTask(task);
        setTask(readyTask);
        setPresentationReadyAt("");
        onStatusChange?.(readyTask);
      }, remainingMs);
      return () => window.clearTimeout(timeout);
    }
    const timeout = window.setTimeout(
      () => refresh().catch(() => {}),
      recruitmentReadyDelayMs(task)
    );
    return () => window.clearTimeout(timeout);
  }, [presentationReadyAt, task?.id, task?.readyAt, task?.status]);

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
      const nextTask = data.task ?? null;
      setTask(nextTask);
      setResult(null);
      setCinematicCompletedTaskId("");
      setCinematicPlaybackTaskId(nextTask?.cinematic ? nextTask.id : "");
      setPresentationReadyAt(cinematicPresentationReadyAt(nextTask));
      onUserChange?.(data.user);
      onStatusChange?.(nextTask);
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

  async function fastForward() {
    setBusy(true);
    try {
      const data = await api("/api/recruitment/fast-forward", { method: "POST", token });
      setTask(data.task ?? null);
      onStatusChange?.(data.task ?? null);
      onNotice?.("已将招新倒计时缩短到 5 秒", "success");
      await refresh();
    } catch (error) {
      onNotice?.(error.message, "danger");
    } finally {
      setBusy(false);
    }
  }

  function clearResult() {
    setResult(null);
    setTask(null);
    setCinematicCompletedTaskId("");
    setPresentationReadyAt("");
    refresh().catch(() => {});
  }

  const finishCinematic = useCallback(() => {
    setCinematicCompletedTaskId(task?.id ?? "");
    setCinematicPlaybackTaskId("");
  }, [task?.id]);

  const interruptCinematic = useCallback(async ({ keepalive = false } = {}) => {
    setCinematicCompletedTaskId("");
    setCinematicPlaybackTaskId("");
    setPresentationReadyAt("");
    try {
      const data = await api("/api/recruitment/interrupt-cinematic", {
        method: "POST",
        token,
        keepalive
      });
      setTask(data.task ?? null);
      onStatusChange?.(data.task ?? null);
    } catch {
      // A visible/online recovery event retries this request; the server timer remains authoritative.
    }
  }, [onStatusChange, token]);

  useEffect(() => {
    if (!shouldRecoverInterruptedCinematic({
      task,
      cinematicPlaybackTaskId,
      cinematicCompletedTaskId
    })) return undefined;
    const recover = () => {
      if (document.visibilityState !== "hidden") interruptCinematic();
    };
    recover();
    window.addEventListener("online", recover);
    window.addEventListener("pageshow", recover);
    document.addEventListener("visibilitychange", recover);
    return () => {
      window.removeEventListener("online", recover);
      window.removeEventListener("pageshow", recover);
      document.removeEventListener("visibilitychange", recover);
    };
  }, [cinematicCompletedTaskId, cinematicPlaybackTaskId, interruptCinematic, task]);

  return {
    busy,
    canFastForward,
    cinematicPlaybackTaskId,
    clearResult,
    fastForward,
    finishCinematic,
    interruptCinematic,
    claim,
    items,
    loading,
    presentationReadyAt,
    result,
    selectedItem,
    selectedItemType,
    setSelectedItemType,
    start,
    task
  };
}

export function shouldRecoverInterruptedCinematic({
  task,
  cinematicPlaybackTaskId = "",
  cinematicCompletedTaskId = ""
}) {
  return Boolean(
    task?.cinematic
    && task.status === "pending"
    && cinematicPlaybackTaskId !== task.id
    && cinematicCompletedTaskId !== task.id
  );
}

export function presentationReadyRecruitmentTask(task) {
  if (!task?.cinematic || task.status !== "pending") return task;
  return { ...task, status: "ready", remainingMs: 0 };
}

export function formatRecruitmentCountdown(task, cinematicElapsedMs = null, presentationReadyAt = "") {
  const theatricalCountdownMs = Number(task?.cinematic?.theatricalCountdownMs ?? 0);
  const useTheatricalCountdown = Number.isFinite(cinematicElapsedMs)
    && cinematicElapsedMs < AEMEATH_RECRUITMENT_TIMING.concealedSwapAtMs
    && theatricalCountdownMs > 0;
  const remaining = useTheatricalCountdown
    ? Math.max(0, theatricalCountdownMs - cinematicElapsedMs)
    : Math.max(0, new Date(presentationReadyAt || task?.readyAt || 0).getTime() - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
