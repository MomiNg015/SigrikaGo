import { validateLoginPassword, validateNewPassword, PASSWORD_MIN_LENGTH as LOGIN_PASSWORD_MIN_LENGTH, NEW_PASSWORD_MIN_LENGTH as REGISTER_PASSWORD_MIN_LENGTH } from "../shared/passwordValidation.js";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { version as packageVersion } from "../../package.json";
import { api } from "../api/client.js";
import { prewarmAuthPortraits } from "../app/authPortraitPrewarm.js";
import { ConfirmModal } from "../modals/FeedbackModals.jsx";
import AuthChallenge from "./AuthChallenge.jsx";
import { useAuthChallenge } from "./useAuthChallenge.js";

export const APP_VERSION_LABEL = `v${packageVersion}`;

export default function AuthScreen({ onAuth, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const fieldErrors = { ...validationErrors, ...serverFieldErrors };
  const [touchedFields, setTouchedFields] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSessionConflict, setShowSessionConflict] = useState(false);
  const [loginChallengeRequired, setLoginChallengeRequired] = useState(false);
  const challenge = useAuthChallenge(mode === "register" || loginChallengeRequired, mode);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const submitLockRef = useRef(false);
  const requestControllerRef = useRef(null);
  const requestVersionRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    void prewarmAuthPortraits();
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
    setValidationErrors({});
    setServerFieldErrors({});
    setTouchedFields({});
    setShowSessionConflict(false);
    setLoginChallengeRequired(false);
    challenge.refresh();
  }

  function updateField(field, value) {
    setError("");
    setServerFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (field === "username") setUsername(value);
    if (field === "password") setPassword(value);
    if (field === "confirmPassword") setConfirmPassword(value);

    if (touchedFields[field]) {
      const nextPassword = field === "password" ? value : password;
      setValidationErrors((current) => ({
        ...current,
        [field]: validateAuthField(field, value, { mode, password: nextPassword })
      }));
    }
    if (field === "password" && touchedFields.confirmPassword) {
      setValidationErrors((current) => ({
        ...current,
        confirmPassword: validateAuthField("confirmPassword", confirmPassword, { mode, password: value })
      }));
    }
  }

  function markFieldTouched(field) {
    const value = field === "username" ? username : field === "password" ? password : confirmPassword;
    setTouchedFields((current) => ({ ...current, [field]: true }));
    setValidationErrors((current) => ({
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
    setServerFieldErrors({});
    const snapshot = { mode, username, password, confirmPassword };
    const validation = validateAuthSubmit(snapshot);
    if (!validation.ok) {
      const invalidFields = Object.fromEntries(
        Object.entries(validation.fieldErrors).map(([field, fieldError]) => [field, Boolean(fieldError)])
      );
      setValidationErrors(validation.fieldErrors);
      setTouchedFields(invalidFields);
      focusFirstInvalidField(validation.fieldErrors, { usernameRef, passwordRef, confirmPasswordRef });
      return;
    }

    if (!challenge.validate()) return;

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
      if (challenge.enabled) body.challenge = challenge.proof;
      const data = await api(`/api/auth/${mode}`, {
        method: "POST",
        body,
        signal: controller.signal
      });
      if (!mountedRef.current || requestVersionRef.current !== requestVersion) return;
      onAuth(data.token, data.user);
    } catch (caught) {
      if (!mountedRef.current || requestVersionRef.current !== requestVersion || isAbortError(caught)) return;
      if (challenge.enabled) challenge.refresh();
      if (caught?.code === "captcha_required") {
        setLoginChallengeRequired(true);
        setError("请完成图片验证后重试");
      } else if (mode === "login" && !forceLogin && isAlreadyLoggedInError(caught)) {
        setLoginChallengeRequired(false);
        setShowSessionConflict(true);
      } else if (mode === "register" && caught?.status === 409 && caught.message === "用户名已存在") {
        setServerFieldErrors({ username: caught.message });
        setTouchedFields((current) => ({ ...current, username: true }));
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
        <div className="auth-composition">
          <section className={`auth-panel login-card-container ${mode === "register" ? "register-card-container" : ""}`}>
            <header className="auth-panel-header">
              <div className="brand-lockup">
                <img className="login-title-mascot" src="/assets/login-sigrika-mascot.webp" alt="" aria-hidden="true" />
                <div>
                  <p className="text-display-accent">SigrikaGo</p>
                  <h1 className="login-title-text text-window-title">星炬学院围棋部</h1>
                  <p className="auth-version text-display-accent">{APP_VERSION_LABEL}</p>
                </div>
              </div>
            </header>
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
                <AuthFieldFeedback id="auth-username-error" error={fieldErrors.username} touched={touchedFields.username} note={mode === "register" ? AUTH_REGISTER_LABEL_NOTES.username : undefined} />
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
            </div>

            <div className={authFieldClassName("password", fieldErrors, touchedFields)}>
              <label className="auth-label-row" htmlFor="auth-password">
                <span>密码</span>
                <AuthFieldFeedback id="auth-password-error" error={fieldErrors.password} touched={touchedFields.password} note={mode === "register" ? AUTH_REGISTER_LABEL_NOTES.password : undefined} />
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
            </div>

            {mode === "register" && (
              <div className={authFieldClassName("confirmPassword", fieldErrors, touchedFields)}>
                <label className="auth-label-row" htmlFor="auth-confirm-password">
                  <span>确认密码</span>
                  <AuthFieldFeedback id="auth-confirm-password-error" error={fieldErrors.confirmPassword} touched={touchedFields.confirmPassword} />
                </label>
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
              </div>
            )}

            <AuthChallenge challenge={challenge} disabled={submitting} />
            <div className="auth-form-feedback" role={error ? "region" : undefined} aria-label={error ? "请求错误" : undefined} tabIndex={error ? 0 : undefined}>
              {error && <p className="form-error" role="alert">{error}</p>}
            </div>
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
        </div>
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
const CJK_USERNAME_CHAR = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]$/u;
const USERNAME_PATTERN = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}A-Za-z0-9_]+$/u;
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

function AuthFieldFeedback({ id, error, touched, note }) {
  return touched && error ? <small id={id} className="auth-field-error" role="alert">{error}</small> : note ? <small>{note}</small> : null;
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
    if (!passwordValue) return "请输入密码";
    const result = (context.mode === "register" ? validateNewPassword : validateLoginPassword)(passwordValue);
    return result.ok ? "" : result.error;
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
