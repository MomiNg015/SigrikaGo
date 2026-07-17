import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";
import { closeOverlaySetters } from "./overlayRegistry.js";
import { AEMEATH_WELCOME_MAIL_TOAST } from "../shared/aemeathAcquisition.js";

const NO_SCRIPT_MESSAGE = "\u6682\u65e0\u5df2\u53d1\u5e03\u7684\u65b0\u624b\u5f15\u5bfc";

export function useOnboardingStory({
  openStoryPlayer,
  overlaySetters,
  showToast,
  token,
  user,
  view
}) {
  const [loading, setLoading] = useState(false);
  const touchedAutoUsersRef = useRef(new Set());

  const fetchStory = useCallback(async () => {
    if (!token) return { script: null, autoEligible: false };
    const data = await api("/api/onboarding-story", { token });
    return data;
  }, [token]);

  const markCompleted = useCallback(async () => {
    if (!token) return;
    await api("/api/onboarding-story/completed", { method: "POST", token });
  }, [token]);

  const markExited = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api("/api/onboarding-story/exited", { method: "POST", token });
      if (data.showNotice) showToast?.(AEMEATH_WELCOME_MAIL_TOAST);
    } catch {
      // The mailbox badge still exposes the mail if this informational toast cannot be recorded.
    }
  }, [showToast, token]);

  const openStory = useCallback(async ({ manual = false } = {}) => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchStory();
      if (!data.script) {
        if (manual) showToast?.(NO_SCRIPT_MESSAGE);
        return;
      }
      closeOverlaySetters(overlaySetters);
      openStoryPlayer?.(data.script, onboardingStoryLabels(), {
        onComplete: markCompleted,
        onExit: markExited
      });
      if (!manual && data.autoEligible && user?.id) {
        touchedAutoUsersRef.current.add(user.id);
        await api("/api/onboarding-story/auto-shown", { method: "POST", token });
      }
    } catch (error) {
      if (manual) showToast?.(error.message);
    } finally {
      setLoading(false);
    }
  }, [fetchStory, markCompleted, markExited, openStoryPlayer, overlaySetters, showToast, token, user?.id]);

  useEffect(() => {
    if (!token || !user?.id || view !== "home") return;
    if (touchedAutoUsersRef.current.has(user.id)) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchStory();
        if (cancelled || !data.script || !data.autoEligible) return;
        closeOverlaySetters(overlaySetters);
        openStoryPlayer?.(data.script, onboardingStoryLabels(), {
          onComplete: markCompleted,
          onExit: markExited
        });
        touchedAutoUsersRef.current.add(user.id);
        await api("/api/onboarding-story/auto-shown", { method: "POST", token });
      } catch {
        // Auto onboarding should never block the lobby.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchStory, markCompleted, markExited, openStoryPlayer, overlaySetters, token, user?.id, view]);

  return {
    loading,
    openOnboardingStory: () => openStory({ manual: true })
  };
}

function onboardingStoryLabels() {
  return {
    title: "新手引导",
    fastForward: "快进并跳过引导",
    skipTitle: "确认跳过引导？",
    skipMessage: "之后你仍可以在大厅右上角的“引导”里重新查看。",
    noScript: "暂无可播放的引导内容",
    close: "关闭新手引导",
    textLabel: "新手引导对话文本"
  };
}
