import { useCallback, useRef, useState } from "react";
import { limitToastQueue } from "../modals/FeedbackModals.jsx";
import { PROFILE_CUSTOMIZATION_ENABLED } from "../shared/profileFeatures.js";

export function useToastQueue() {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const removeToast = useCallback((toastId) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const showToast = useCallback((message, tone = "danger") => {
    if (!message) return;
    if (tone === "achievement" && !PROFILE_CUSTOMIZATION_ENABLED) return;
    const id = ++toastIdRef.current;
    setToasts((current) => limitToastQueue([{ id, text: message, tone }, ...current]));
  }, []);

  return { removeToast, showToast, toasts };
}
