import { useState } from "react";
import { api } from "../api/client.js";
import { CHARACTERS } from "../shared/characters.js";

export default function AuthScreen({ onAuth, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setConfirmPassword("");
    setFieldErrors({});
    setTouchedFields({});
  }

  function updateRegisterField(field, value) {
    if (field === "username") {
      const nextUsername = truncateUsernameInput(value);
      setUsername(nextUsername);
      setRegisterFieldError("username", value === nextUsername ? validateAuthField("username", nextUsername) : USERNAME_WIDTH_ERROR);
      return;
    }
    if (field === "password") {
      setPassword(value);
      setRegisterFieldError("password", validateAuthField("password", value));
      if (confirmPassword) {
        setRegisterFieldError("confirmPassword", validateAuthField("confirmPassword", confirmPassword, { password: value }));
      }
      return;
    }
    setConfirmPassword(value);
    setRegisterFieldError("confirmPassword", validateAuthField("confirmPassword", value, { password }));
  }

  function setRegisterFieldError(field, nextError) {
    setFieldErrors((current) => ({ ...current, [field]: nextError }));
  }

  function markRegisterFieldTouched(field) {
    setTouchedFields((current) => ({ ...current, [field]: true }));
    setRegisterFieldError(field, validateAuthField(field, fieldValue(field), { password }));
  }

  function fieldValue(field) {
    if (field === "username") return username;
    if (field === "password") return password;
    return confirmPassword;
  }

  async function submit(event, forceLogin = false) {
    event.preventDefault();
    setError("");
    const validation = validateAuthSubmit({ mode, username, password, confirmPassword });
    if (!validation.ok) {
      if (validation.fieldErrors) {
        setFieldErrors(validation.fieldErrors);
        setTouchedFields(Object.fromEntries(Object.keys(validation.fieldErrors).map((field) => [field, true])));
      }
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
      <section className={`auth-panel login-card-container ${mode === "register" ? "register-card-container" : ""}`}>
        <div className="brand-lockup">
          <img src={CHARACTERS.sigrika.portrait} alt="\u897f\u683c\u8389\u5361" />
          <div>
            <p>SigrikaGo</p>
            <h1 className="login-title-text">{"\u661f\u70ac\u5b66\u9662\u56f4\u68cb\u90e8"}</h1>
          </div>
        </div>
        <form onSubmit={submit} className="auth-form">
          <div className="segmented">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>{"\u767b\u5f55"}</button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>{"\u6ce8\u518c"}</button>
          </div>
          <label className={authFieldClassName("username", fieldErrors, touchedFields)}>
            {"\u7528\u6237\u540d"}
            <input
              value={username}
              autoComplete="username"
              placeholder={mode === "register" ? AUTH_REGISTER_HELP.username : undefined}
              aria-describedby={mode === "register" && fieldErrors.username ? "register-username-error" : undefined}
              aria-invalid={isFieldInvalid("username", fieldErrors, touchedFields) || undefined}
              onBlur={() => mode === "register" && markRegisterFieldTouched("username")}
              onChange={(event) => {
                if (mode === "register") {
                  updateRegisterField("username", event.target.value);
                  return;
                }
                setUsername(truncateUsernameInput(event.target.value));
              }}
            />
            {mode === "register" && <AuthFieldFeedback field="username" error={fieldErrors.username} touched={touchedFields.username} />}
          </label>
          <label className={authFieldClassName("password", fieldErrors, touchedFields)}>
            {"\u5bc6\u7801"}
            <input
              type="password"
              minLength={6}
              maxLength={14}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              placeholder={mode === "register" ? AUTH_REGISTER_HELP.password : undefined}
              aria-describedby={mode === "register" && fieldErrors.password ? "register-password-error" : undefined}
              aria-invalid={isFieldInvalid("password", fieldErrors, touchedFields) || undefined}
              onBlur={() => mode === "register" && markRegisterFieldTouched("password")}
              onChange={(event) => {
                if (mode === "register") {
                  updateRegisterField("password", event.target.value);
                  return;
                }
                setPassword(event.target.value);
              }}
            />
            {mode === "register" && <AuthFieldFeedback field="password" error={fieldErrors.password} touched={touchedFields.password} />}
          </label>
          {mode === "register" && (
            <label className={authFieldClassName("confirmPassword", fieldErrors, touchedFields)}>
              {"\u786e\u8ba4\u5bc6\u7801"}
              <input
                type="password"
                minLength={6}
                maxLength={14}
                autoComplete="new-password"
                value={confirmPassword}
                placeholder={AUTH_REGISTER_HELP.confirmPassword}
                aria-describedby={fieldErrors.confirmPassword ? "register-confirmPassword-error" : undefined}
                aria-invalid={isFieldInvalid("confirmPassword", fieldErrors, touchedFields) || undefined}
                onBlur={() => markRegisterFieldTouched("confirmPassword")}
                onChange={(event) => updateRegisterField("confirmPassword", event.target.value)}
              />
              <AuthFieldFeedback field="confirmPassword" error={fieldErrors.confirmPassword} touched={touchedFields.confirmPassword} />
            </label>
          )}
          {error && <p className="form-error">{error}</p>}
          <button className="primary-action login-submit-btn terminal-enter-btn" type="submit">{authSubmitText(mode)}</button>
        </form>
      </section>
    </main>
  );
}

export const AUTH_REGISTER_HELP = {
  username: "\u652f\u6301\u4e2d\u6587\u3001\u65e5\u6587\u3001\u97e9\u6587\u3001\u534a\u89d2\u82f1\u6587\u3001\u6570\u5b57\u548c\u4e0b\u5212\u7ebf\uff1b\u6700\u591a 5 \u4e2a\u4e2d\u65e5\u97e9\u5b57\u6216 10 \u4e2a\u534a\u89d2\u5b57\u7b26\u3002",
  password: "\u5bc6\u7801\u957f\u5ea6\u9700\u4e3a 6-14 \u4f4d\uff0c\u4e0d\u80fd\u5305\u542b\u63a7\u5236\u5b57\u7b26\u3002",
  confirmPassword: "\u8bf7\u518d\u8f93\u5165\u4e00\u6b21\u5bc6\u7801\uff0c\u9700\u8981\u548c\u4e0a\u65b9\u5bc6\u7801\u5b8c\u5168\u4e00\u81f4\u3002"
};

const USERNAME_MIN_WIDTH = 2;
const USERNAME_MAX_WIDTH = 10;
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 14;
const CJK_USERNAME_CHAR = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]$/u;
const USERNAME_PATTERN = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}A-Za-z0-9_]+$/u;
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/;
const USERNAME_WIDTH_ERROR = `\u7528\u6237\u540d\u9700\u4e3a ${USERNAME_MIN_WIDTH}-${USERNAME_MAX_WIDTH} \u4e2a\u534a\u89d2\u5b57\u7b26\u5bbd\u5ea6\uff0c\u6700\u591a 5 \u4e2a\u4e2d\u6587/\u65e5\u6587/\u97e9\u6587\u5b57\u6216 10 \u4e2a\u534a\u89d2\u82f1\u6587/\u6570\u5b57/\u4e0b\u5212\u7ebf`;
const USERNAME_PATTERN_ERROR = "\u7528\u6237\u540d\u4ec5\u652f\u6301\u4e2d\u6587\u3001\u65e5\u6587\u3001\u97e9\u6587\u3001\u534a\u89d2\u82f1\u6587\u3001\u6570\u5b57\u548c\u4e0b\u5212\u7ebf";
const PASSWORD_LENGTH_ERROR = `\u5bc6\u7801\u9700\u4e3a ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} \u4f4d`;
const PASSWORD_CONTROL_ERROR = "\u5bc6\u7801\u4e0d\u80fd\u5305\u542b\u63a7\u5236\u5b57\u7b26";
const CONFIRM_PASSWORD_ERROR = "\u4e24\u6b21\u8f93\u5165\u7684\u5bc6\u7801\u4e0d\u4e00\u81f4";

function AuthFieldFeedback({ field, error, touched }) {
  const visibleError = touched && error;
  return visibleError ? <small id={`register-${field}-error`} className="auth-field-error" role="alert">{error}</small> : null;
}

function authFieldClassName(field, fieldErrors, touchedFields) {
  return isFieldInvalid(field, fieldErrors, touchedFields) ? "auth-field invalid" : "auth-field";
}

function isFieldInvalid(field, fieldErrors, touchedFields) {
  return Boolean(touchedFields[field] && fieldErrors[field]);
}

export function usernameDisplayWidth(value = "") {
  return [...String(value)].reduce((width, char) => width + (CJK_USERNAME_CHAR.test(char) ? 2 : 1), 0);
}

export function truncateUsernameInput(value = "", maxWidth = USERNAME_MAX_WIDTH) {
  let width = 0;
  let result = "";
  for (const char of String(value)) {
    const nextWidth = width + (CJK_USERNAME_CHAR.test(char) ? 2 : 1);
    if (nextWidth > maxWidth) break;
    width = nextWidth;
    result += char;
  }
  return result;
}

export function validateAuthField(field, value, context = {}) {
  if (field === "username") {
    const username = String(value ?? "").trim();
    if (usernameDisplayWidth(username) < USERNAME_MIN_WIDTH || usernameDisplayWidth(username) > USERNAME_MAX_WIDTH) return USERNAME_WIDTH_ERROR;
    if (!USERNAME_PATTERN.test(username)) return USERNAME_PATTERN_ERROR;
    return "";
  }
  if (field === "password") {
    const passwordValue = String(value ?? "");
    if (passwordValue.length < PASSWORD_MIN_LENGTH || passwordValue.length > PASSWORD_MAX_LENGTH) return PASSWORD_LENGTH_ERROR;
    if (CONTROL_CHARS.test(passwordValue)) return PASSWORD_CONTROL_ERROR;
    return "";
  }
  if (field === "confirmPassword") {
    return String(value ?? "") === String(context.password ?? "") ? "" : CONFIRM_PASSWORD_ERROR;
  }
  return "";
}

export function validateAuthSubmit({ mode, username = "", password, confirmPassword }) {
  if (mode === "register") {
    const fieldErrors = {
      username: validateAuthField("username", username),
      password: validateAuthField("password", password),
      confirmPassword: validateAuthField("confirmPassword", confirmPassword, { password })
    };
    const firstError = Object.values(fieldErrors).find(Boolean);
    if (firstError) return { ok: false, error: firstError, fieldErrors };
  }
  return { ok: true };
}

export function authSubmitText(mode) {
  return mode === "login" ? "START CONNECTION!! >" : "\u521b\u5efa\u8d26\u53f7";
}

export function isAlreadyLoggedInError(error) {
  return error?.status === 409 && error?.code === "already_logged_in";
}
