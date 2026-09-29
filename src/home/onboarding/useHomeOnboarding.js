import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../api/client.js";
import { closeOverlaySetters } from "../../app/overlayRegistry.js";

export function useHomeOnboarding({ token, userId, available, overlaysOpen, overlaySetters, refreshMailboxSummary, showToast }) {
  const [session, setSession] = useState(null);
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const identity = `${userId ?? ""}:${token ?? ""}`;
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const pendingExit = useRef(null);
  const finishing = useRef(false);
  const finishedIdentity = useRef(null);
  const active = Boolean(session === identity && userId && available);

  const onStoryExited = useCallback(() => {
    pendingExit.current = identity;
    setRevision((value) => value + 1);
  }, [identity]);

  useEffect(() => {
    if (!token || !userId || !available || overlaysOpen || session === identity || finishedIdentity.current === identity) return;
    let cancelled = false;
    let timer;
    const probe = async () => {
      try {
        if (pendingExit.current === identity) {
          await api("/api/onboarding-story/exited", { method: "POST", token });
          if (cancelled) return;
          pendingExit.current = null;
        }
        const state = await api("/api/home-onboarding", { token });
        if (cancelled) return;
        if (["completed", "skipped"].includes(state.status)) {
          finishedIdentity.current = identity;
          return;
        }
        if (state.eligible) {
          const started = await api("/api/home-onboarding/start", { method: "POST", token });
          if (cancelled) return;
          if (started.status === "active") {
            closeOverlaySetters(overlaySetters);
            setError("");
            setSession(identity);
            return;
          }
        }
      } catch {
        // A transient API failure never disables the lobby or consumes the tour.
      }
      if (!cancelled) timer = window.setTimeout(probe, 5000);
    };
    probe();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [available, identity, overlaySetters, overlaysOpen, revision, session, token, userId]);

  useEffect(() => {
    if (!available || session !== identity) {
      setSession(null);
      setSaving(false);
      finishing.current = false;
      setError("");
    }
  }, [available, identity, session]);

  const finish = useCallback(async (outcome) => {
    if (finishing.current || !active) return;
    finishing.current = true;
    setSaving(true);
    setError("");
    try {
      await api("/api/home-onboarding/finish", { method: "POST", token, body: { outcome } });
      if (identityRef.current !== identity) return;
      finishedIdentity.current = identity;
      setSession(null);
      await refreshMailboxSummary();
      if (identityRef.current === identity) showToast("你有收到新的邮件！", "mail");
    } catch (failure) {
      if (identityRef.current === identity) setError(failure.message || "暂时无法保存，请重试。");
    } finally {
      if (identityRef.current === identity) {
        finishing.current = false;
        setSaving(false);
      }
    }
  }, [active, identity, refreshMailboxSummary, showToast, token]);

  return { active, saving, error, finish, onStoryExited };
}
