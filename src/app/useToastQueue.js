import { useCallback, useRef, useState } from "react";
import { limitToastQueue } from "../modals/FeedbackModals.jsx";

export function useToastQueue() {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const removeToast = useCallback((toastId) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const showToast = useCallback((message, tone = "danger") => {
    if (!message) return;
    const id = ++toastIdRef.current;
    setToasts((current) => limitToastQueue([{ id, text: message, tone }, ...current]));
  }, []);

  return { removeToast, showToast, toasts };
}
