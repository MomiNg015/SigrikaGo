import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client.js";
import { recruitmentReadyDelayMs } from "../shared/recruitment.js";

export { recruitmentReadyDelayMs } from "../shared/recruitment.js";

export function recruitmentReadyFromTask(task) {
  return task?.status === "ready";
}

export function useRecruitmentReadyState({ token, user }) {
  const [recruitmentReady, setRecruitmentReady] = useState(false);
  const [recruitmentBadgeTask, setRecruitmentBadgeTask] = useState(null);

  const applyRecruitmentTask = useCallback((task) => {
    setRecruitmentReady(recruitmentReadyFromTask(task));
    setRecruitmentBadgeTask(task ?? null);
  }, []);

  const refreshRecruitmentBadge = useCallback(async () => {
    try {
      const data = await api("/api/recruitment", { token });
      applyRecruitmentTask(data.task);
    } catch {
      applyRecruitmentTask(null);
    }
  }, [applyRecruitmentTask, token]);

  const handleRecruitmentStatusChange = useCallback((task) => {
    applyRecruitmentTask(task);
  }, [applyRecruitmentTask]);

  useEffect(() => {
    if (!token || !user) {
      applyRecruitmentTask(null);
      return undefined;
    }
    let alive = true;
    const refresh = async () => {
      try {
        const data = await api("/api/recruitment", { token });
        if (alive) applyRecruitmentTask(data.task);
      } catch {
        if (alive) applyRecruitmentTask(null);
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [applyRecruitmentTask, token, user?.id]);

  useEffect(() => {
    if (!token || !user || !recruitmentBadgeTask || recruitmentBadgeTask.status !== "pending") return undefined;
    const timer = window.setTimeout(refreshRecruitmentBadge, recruitmentReadyDelayMs(recruitmentBadgeTask));
    return () => window.clearTimeout(timer);
  }, [
    refreshRecruitmentBadge,
    recruitmentBadgeTask?.id,
    recruitmentBadgeTask?.readyAt,
    recruitmentBadgeTask?.status,
    token,
    user?.id
  ]);

  return { recruitmentReady, handleRecruitmentStatusChange };
}
