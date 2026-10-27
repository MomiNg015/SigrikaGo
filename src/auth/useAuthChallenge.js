import { useEffect, useRef, useState } from "react";
import { loadAuthChallenge } from "./authChallengeApi.js";

export function useAuthChallenge(enabled, purpose) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({});
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const key = `${purpose}:${revision}`;

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    let active = true;
    loadAuthChallenge(purpose, controller.signal).then((challenge) => {
      if (!active) return;
      if (!challenge?.id || !String(challenge.image).startsWith("data:image/png;base64,")) throw new Error("验证码加载失败");
      setState({ key, challenge });
    }).catch((caught) => {
      if (active) setState({ key, loadError: caught?.status === 429 ? "获取过于频繁，请稍后刷新" : "验证码加载失败，请刷新" });
    });
    return () => { active = false; controller.abort(); };
  }, [enabled, purpose, key]);

  const current = enabled && state.key === key ? state : {};
  function refresh() {
    setAnswer("");
    setError("");
    setRevision((value) => value + 1);
  }
  function validate() {
    if (!enabled) return true;
    let message = "";
    if (!current.challenge) message = current.loadError || "验证码加载中，请稍候";
    else if (current.challenge.expiresAt <= Date.now()) { refresh(); message = "验证码已失效，请重新输入"; }
    else if (!/^[A-Za-z2-9]{6}$/.test(answer.trim())) message = "请输入图片中的 6 位字符";
    setError(message);
    if (message) inputRef.current?.focus();
    return !message;
  }
  return {
    enabled, inputRef, answer, error: error || current.loadError || "",
    image: current.challenge?.image,
    loading: enabled && !current.challenge && !current.loadError,
    proof: current.challenge ? { id: current.challenge.id, answer: answer.trim() } : undefined,
    setAnswer: (value) => { setAnswer(value); setError(""); },
    refresh, validate
  };
}
