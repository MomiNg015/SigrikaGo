import { Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";
import { ConfirmModal } from "../modals/FeedbackModals.jsx";

export default function AuthScreen({ onAuth, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSessionConflict, setShowSessionConflict] = useState(false);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const submitLockRef = useRef(false);
  const requestControllerRef = useRef(null);
  const requestVersionRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestVersionRef.current += 1;
      requestControllerRef.current?.abort();
    };
  }, []);

  function switchMode(nextMode) {
    if (submitting || nextMode === mode) return;
    requestVersionRef.current += 1;
    requestControllerRef.current?.abort();
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError("");
    setFieldErrors({});
    setTouchedFields({});
    setShowSessionConflict(false);
  }

  function updateField(field, value) {
    if (field === "username") setUsername(value);
    if (field === "password") setPassword(value);
    if (field === "confirmPassword") setConfirmPassword(value);

    if (touchedFields[field]) {
      const nextPassword = field === "password" ? value : password;
      setFieldErrors((current) => ({
        ...current,
        [field]: validateAuthField(field, value, { mode, password: nextPassword })
      }));
    }
    if (field === "password" && touchedFields.confirmPassword) {
      setFieldErrors((current) => ({
        ...current,
        confirmPassword: validateAuthField("confirmPassword", confirmPassword, { mode, password: value })
      }));
    }
  }

  function markFieldTouched(field) {
    const value = field === "username" ? username : field === "password" ? password : confirmPassword;
    setTouchedFields((current) => ({ ...current, [field]: true }));
    setFieldErrors((current) => ({
      ...current,
      [field]: validateAuthField(field, value, { mode, password })
    }));
  }

  function submit(event) {
    event.preventDefault();
    void performSubmit(false);
  }

  async function performSubmit(forceLogin) {
    if (submitLockRef.current) return;
    setError("");
    const snapshot = { mode, username, password, confirmPassword };
    const validation = validateAuthSubmit(snapshot);
    if (!validation.ok) {
      const invalidFields = Object.fromEntries(
        Object.entries(validation.fieldErrors).map(([field, fieldError]) => [field, Boolean(fieldError)])
      );
      setFieldErrors(validation.fieldErrors);
      setTouchedFields(invalidFields);
      focusFirstInvalidField(validation.fieldErrors, { usernameRef, passwordRef, confirmPasswordRef });
      return;
    }

    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    const controller = new AbortController();
    requestControllerRef.current = controller;
    submitLockRef.current = true;
    setSubmitting(true);

    try {
      const body = mode === "login"
        ? { username: username.trim(), password, forceLogin }
        : { username: username.trim(), password };
      const data = await api(`/api/auth/${mode}`, {
        method: "POST",
        body,
        signal: controller.signal
      });
      if (!mountedRef.current || requestVersionRef.current !== requestVersion) return;
      onAuth(data.token, data.user);
    } catch (caught) {
      if (!mountedRef.current || requestVersionRef.current !== requestVersion || isAbortError(caught)) return;
      if (mode === "login" && !forceLogin && isAlreadyLoggedInError(caught)) {
        setShowSessionConflict(true);
      } else {
        setError(authErrorMessage(caught));
      }
    } finally {
      if (requestControllerRef.current === controller) requestControllerRef.current = null;
      submitLockRef.current = false;
      if (mountedRef.current && requestVersionRef.current === requestVersion) setSubmitting(false);
    }
  }

  function confirmForcedLogin() {
    setShowSessionConflict(false);
    void performSubmit(true);
  }

  const passwordErrorId = visibleFieldError("password", fieldErrors, touchedFields) ? "auth-password-error" : undefined;
  const confirmPasswordErrorId = visibleFieldError("confirmPassword", fieldErrors, touchedFields) ? "auth-confirm-password-error" : undefined;

  return (
    <>
      <main className="auth-screen">
        <section className={`auth-panel login-card-container ${mode === "register" ? "register-card-container" : ""}`}>
          <div className="brand-lockup">
            <img className="login-title-mascot" src="/assets/login-sigrika-mascot.webp" alt="" aria-hidden="true" />
            <div>
              <p className="text-display-accent">SigrikaGo</p>
              <h1 className="login-title-text text-window-title">星炬学院围棋部</h1>
            </div>
          </div>
          <form onSubmit={submit} className="auth-form" noValidate aria-busy={submitting || undefined}>
            <div className="segmented" role="group" aria-label="账号操作">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                aria-pressed={mode === "login"}
                disabled={submitting}
                onClick={() => switchMode("login")}
              >登录</button>
              <button
                type="button"
                className={mode === "register" ? "active" : ""}
                aria-pressed={mode === "register"}
                disabled={submitting}
                onClick={() => switchMode("register")}
              >注册</button>
            </div>

            <div className={authFieldClassName("username", fieldErrors, touchedFields)}>
              <label className="auth-label-row" htmlFor="auth-username">
                <span>用户名</span>
                {mode === "register" && <small>{AUTH_REGISTER_LABEL_NOTES.username}</small>}
              </label>
              <input
                ref={usernameRef}
                id="auth-username"
                name="username"
                value={username}
                required
                autoCapitalize="none"
                spellCheck="false"
                autoComplete="username"
                aria-describedby={visibleFieldError("username", fieldErrors, touchedFields) ? "auth-username-error" : undefined}
                aria-invalid={isFieldInvalid("username", fieldErrors, touchedFields) || undefined}
                disabled={submitting}
                onBlur={() => markFieldTouched("username")}
                onChange={(event) => updateField("username", event.target.value)}
              />
              <AuthFieldFeedback id="auth-username-error" error={fieldErrors.username} touched={touchedFields.username} />
            </div>

            <div className={authFieldClassName("password", fieldErrors, touchedFields)}>
              <label className="auth-label-row" htmlFor="auth-password">
                <span>密码</span>
                {mode === "register" && <small>{AUTH_REGISTER_LABEL_NOTES.password}</small>}
              </label>
              <div className="auth-input-shell">
                <input
                  ref={passwordRef}
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  minLength={mode === "register" ? REGISTER_PASSWORD_MIN_LENGTH : LOGIN_PASSWORD_MIN_LENGTH}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  aria-describedby={passwordErrorId}
                  aria-invalid={isFieldInvalid("password", fieldErrors, touchedFields) || undefined}
                  disabled={submitting}
                  onBlur={() => markFieldTouched("password")}
                  onChange={(event) => updateField("password", event.target.value)}
                />
                <PasswordVisibilityButton
                  visible={showPassword}
                  inputRef={passwordRef}
                  controls="auth-password"
                  disabled={submitting}
                  onToggle={() => setShowPassword((current) => !current)}
                />
              </div>
              <AuthFieldFeedback id="auth-password-error" error={fieldErrors.password} touched={touchedFields.password} />
            </div>

            {mode === "register" && (
              <div className={authFieldClassName("confirmPassword", fieldErrors, touchedFields)}>
                <label className="auth-label-row" htmlFor="auth-confirm-password"><span>确认密码</span></label>
                <div className="auth-input-shell">
                  <input
                    ref={confirmPasswordRef}
                    id="auth-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    minLength={REGISTER_PASSWORD_MIN_LENGTH}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    aria-describedby={confirmPasswordErrorId}
                    aria-invalid={isFieldInvalid("confirmPassword", fieldErrors, touchedFields) || undefined}
                    disabled={submitting}
                    onBlur={() => markFieldTouched("confirmPassword")}
                    onChange={(event) => updateField("confirmPassword", event.target.value)}
                  />
                  <PasswordVisibilityButton
                    visible={showConfirmPassword}
                    inputRef={confirmPasswordRef}
                    controls="auth-confirm-password"
                    disabled={submitting}
                    onToggle={() => setShowConfirmPassword((current) => !current)}
                  />
                </div>
                <AuthFieldFeedback id="auth-confirm-password-error" error={fieldErrors.confirmPassword} touched={touchedFields.confirmPassword} />
              </div>
            )}

            {error && <p className="form-error" role="alert">{error}</p>}
            <p className="auth-live-region" aria-live="polite" aria-atomic="true">
              {submitting ? authPendingText(mode) : ""}
            </p>
            <button
              className="primary-action login-submit-btn terminal-enter-btn"
              type="submit"
              disabled={submitting}
              aria-busy={submitting || undefined}
            >{submitting ? authPendingText(mode) : authSubmitText(mode)}</button>
          </form>
        </section>
      </main>
      {showSessionConflict && (
        <ConfirmModal
          title="账号已在线"
          message="要退出其他在线会话并继续登录吗？"
          confirmText="退出其他会话并继续"
          onConfirm={confirmForcedLogin}
          onCancel={() => setShowSessionConflict(false)}
        />
      )}
    </>
  );
}

export const AUTH_REGISTER_LABEL_NOTES = {
  username: "最多 4 个中日韩文字 / 8 个半角字符",
  password: "8-64 位"
};

const USERNAME_MIN_WIDTH = 2;
const USERNAME_MAX_WIDTH = 8;
const LOGIN_PASSWORD_MIN_LENGTH = 6;
const REGISTER_PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;
const PASSWORD_MAX_BYTES = 72;
const CJK_USERNAME_CHAR = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]$/u;
const USERNAME_PATTERN = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}A-Za-z0-9_]+$/u;
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/;
const USERNAME_PATTERN_ERROR = "用户名仅支持中文、日文、韩文、半角英文、数字和下划线";
const CONFIRM_PASSWORD_ERROR = "两次输入的密码不一致";

function PasswordVisibilityButton({ visible, inputRef, controls, disabled, onToggle }) {
  const label = visible ? "隐藏密码" : "显示密码";
  const Icon = visible ? EyeOff : Eye;
  return (
    <button
      className="auth-password-toggle"
      type="button"
      aria-label={label}
      aria-controls={controls}
      aria-pressed={visible}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        onToggle();
        if (event.detail > 0) inputRef.current?.focus({ preventScroll: true });
      }}
    >
      <Icon size={20} aria-hidden="true" />
    </button>
  );
}

function AuthFieldFeedback({ id, error, touched }) {
  return touched && error ? <small id={id} className="auth-field-error" role="alert">{error}</small> : null;
}

function authFieldClassName(field, fieldErrors, touchedFields) {
  return isFieldInvalid(field, fieldErrors, touchedFields) ? "auth-field invalid" : "auth-field";
}

function isFieldInvalid(field, fieldErrors, touchedFields) {
  return Boolean(touchedFields[field] && fieldErrors[field]);
}

function visibleFieldError(field, fieldErrors, touchedFields) {
  return isFieldInvalid(field, fieldErrors, touchedFields);
}

function focusFirstInvalidField(fieldErrors, refs) {
  const firstInvalidField = ["username", "password", "confirmPassword"].find((field) => fieldErrors[field]);
  refs[`${firstInvalidField}Ref`]?.current?.focus({ preventScroll: true });
}

export function usernameDisplayWidth(value = "") {
  return [...String(value)].reduce((width, char) => width + (CJK_USERNAME_CHAR.test(char) ? 2 : 1), 0);
}

export function validateAuthField(field, value, context = {}) {
  if (field === "username") {
    const username = String(value ?? "").trim();
    const width = usernameDisplayWidth(username);
    if (!username) return "请输入用户名";
    if (width < USERNAME_MIN_WIDTH) return "用户名太短";
    if (width > USERNAME_MAX_WIDTH) return "用户名最多 4 个中日韩文字或 8 个半角字符";
    if (!USERNAME_PATTERN.test(username)) return USERNAME_PATTERN_ERROR;
    return "";
  }
  if (field === "password") {
    const passwordValue = String(value ?? "");
    const minimum = context.mode === "register" ? REGISTER_PASSWORD_MIN_LENGTH : LOGIN_PASSWORD_MIN_LENGTH;
    if (!passwordValue) return "请输入密码";
    if ([...passwordValue].length < minimum || [...passwordValue].length > PASSWORD_MAX_LENGTH) {
      return context.mode === "register" ? "新密码需为 8-64 位" : "密码长度不正确";
    }
    if (new TextEncoder().encode(passwordValue).length > PASSWORD_MAX_BYTES) return "密码太长，请缩短后重试";
    if (CONTROL_CHARS.test(passwordValue)) return "密码包含不支持的字符";
    return "";
  }
  if (field === "confirmPassword") {
    if (!String(value ?? "")) return "请再次输入密码";
    return String(value) === String(context.password ?? "") ? "" : CONFIRM_PASSWORD_ERROR;
  }
  return "";
}

export function validateAuthSubmit({ mode, username = "", password = "", confirmPassword = "" }) {
  const fieldErrors = {
    username: validateAuthField("username", username, { mode }),
    password: validateAuthField("password", password, { mode })
  };
  if (mode === "register") {
    fieldErrors.confirmPassword = validateAuthField("confirmPassword", confirmPassword, { mode, password });
  }
  return Object.values(fieldErrors).some(Boolean) ? { ok: false, fieldErrors } : { ok: true };
}

export function authSubmitText(mode) {
  return mode === "login" ? "开门！" : "登记入部信息";
}

export function authPendingText(mode) {
  return mode === "login" ? "登录中…" : "创建中…";
}

export function authErrorMessage(error) {
  if (error?.status === 429) {
    const seconds = Number(error.retryAfter);
    if (Number.isFinite(seconds) && seconds > 0) {
      const waitText = seconds >= 60 ? `${Math.ceil(seconds / 60)} 分钟` : `${Math.ceil(seconds)} 秒`;
      return `请求太频繁，请 ${waitText}后再试`;
    }
    return "请求太频繁，请稍后再试";
  }
  if (error instanceof TypeError || /failed to fetch|network/i.test(String(error?.message ?? ""))) {
    return "网络连接失败，请检查网络后重试";
  }
  return String(error?.message || "请求失败，请稍后重试");
}

export function isAlreadyLoggedInError(error) {
  return error?.status === 409 && error?.code === "already_logged_in";
}

function isAbortError(error) {
  return error?.name === "AbortError";
}
