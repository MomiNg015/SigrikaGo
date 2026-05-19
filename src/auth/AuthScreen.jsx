import { useState } from "react";
import { api } from "../api/client.js";
import { CHARACTERS } from "../shared/characters.js";

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await api(`/api/auth/${mode}`, {
        method: "POST",
        body: { username, password }
      });
      onAuth(data.token, data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="brand-lockup">
          <img src={CHARACTERS.sigrika.portrait} alt="西格莉卡" />
          <div>
            <p>SigrikaGo</p>
            <h1>星炬学院围棋部</h1>
          </div>
        </div>
        <form onSubmit={submit} className="auth-form">
          <div className="segmented">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>登录</button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>注册</button>
          </div>
          <label>用户名<input value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          <label>密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-action" type="submit">{mode === "login" ? "进入棋舍" : "创建账号"}</button>
        </form>
      </section>
    </main>
  );
}
