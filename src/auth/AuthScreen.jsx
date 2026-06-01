import { useState } from "react";
import { api } from "../api/client.js";
import { CHARACTERS } from "../shared/characters.js";

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setConfirmPassword("");
  }

  async function submit(event, forceLogin = false) {
    event.preventDefault();
    setError("");
    const validation = validateAuthSubmit({ mode, password, confirmPassword });
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    try {
      const body = mode === "login"
        ? { username, password, forceLogin }
        : { username, password };
      const data = await api(`/api/auth/${mode}`, {
        method: "POST",
        body
      });
      onAuth(data.token, data.user);
    } catch (err) {
      if (mode === "login" && isAlreadyLoggedInError(err) && window.confirm(err.message)) {
        submit({ preventDefault: () => {} }, true);
        return;
      }
      setError(err.message);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="brand-lockup">
          <img src={CHARACTERS.sigrika.portrait} alt="\u897f\u683c\u8389\u5361" />
          <div>
            <p>SigrikaGo</p>
            <h1>{"\u661f\u70ac\u5b66\u9662\u56f4\u68cb\u90e8"}</h1>
          </div>
        </div>
        <form onSubmit={submit} className="auth-form">
          <div className="segmented">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>{"\u767b\u5f55"}</button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>{"\u6ce8\u518c"}</button>
          </div>
          <label>{"\u7528\u6237\u540d"}<input value={username} maxLength={16} autoComplete="username" onChange={(event) => setUsername(event.target.value)} /></label>
          <label>{"\u5bc6\u7801"}<input type="password" minLength={6} maxLength={14} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {mode === "register" && (
            <label>{"\u786e\u8ba4\u5bc6\u7801"}<input type="password" minLength={6} maxLength={14} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          )}
          {error && <p className="form-error">{error}</p>}
          <button className="primary-action" type="submit">{authSubmitText(mode)}</button>
        </form>
      </section>
    </main>
  );
}

export function validateAuthSubmit({ mode, password, confirmPassword }) {
  if (mode === "register" && password !== confirmPassword) {
    return { ok: false, error: "\u4e24\u6b21\u8f93\u5165\u7684\u5bc6\u7801\u4e0d\u4e00\u81f4" };
  }
  return { ok: true };
}

export function authSubmitText(mode) {
  return mode === "login" ? "\u8fdb\u5165\u56f4\u68cb\u90e8" : "\u521b\u5efa\u8d26\u53f7";
}

export function isAlreadyLoggedInError(error) {
  return error?.status === 409 && error?.code === "already_logged_in";
}
