const API_BASE = "";
const DEFAULT_REQUEST_TIMEOUT_MS = 8000;
let authRefreshHandler = null;

export function configureAuthRefresh(handler) {
  authRefreshHandler = handler;
}

export async function api(path, options = {}) {
  const response = await fetchWithTimeout(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    keepalive: options.keepalive
  }, options.requestTimeoutMs);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    const isHtml = text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html");
    throw new Error(isHtml
      ? "\u63a5\u53e3\u8fd4\u56de\u4e86\u524d\u7aef\u9875\u9762\u800c\u4e0d\u662f JSON\uff0c\u8bf7\u5237\u65b0\u9875\u9762\u5e76\u786e\u8ba4\u540e\u7aef\u670d\u52a1\u5df2\u542f\u52a8\u3002"
      : "\u63a5\u53e3\u8fd4\u56de\u683c\u5f0f\u4e0d\u662f JSON\u3002");
  }
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && options.token && !options.skipAuthRefresh && authRefreshHandler) {
      const refreshed = await authRefreshHandler();
      if (refreshed?.token) {
        return api(path, {
          ...options,
          token: refreshed.token,
          skipAuthRefresh: true
        });
      }
    }
    const error = new Error(data.error ?? "\u8bf7\u6c42\u5931\u8d25");
    error.status = response.status;
    error.code = data.code;
    error.data = data;
    error.retryAfter = parseRetryAfter(response.headers.get("retry-after"));
    throw error;
  }
  return data;
}

export async function adminApi(path, token, options = {}) {
  return api(`/api/admin${path}`, { ...options, token });
}

export async function uploadPortrait(file, token) {
  return uploadPortraitWithToken(file, token);
}

async function uploadPortraitWithToken(file, token, { skipAuthRefresh = false } = {}) {
  const form = new FormData();
  form.append("portrait", file);
  const response = await fetchWithTimeout(`${API_BASE}/api/admin/uploads/character-portrait`, {
    method: "POST",
    credentials: "same-origin",
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  const data = await response.json();
  if (response.status === 401 && token && !skipAuthRefresh && authRefreshHandler) {
    const refreshed = await authRefreshHandler();
    if (refreshed?.token) {
      return uploadPortraitWithToken(file, refreshed.token, { skipAuthRefresh: true });
    }
  }
  if (!response.ok) throw new Error(data.error ?? "\u4e0a\u4f20\u5931\u8d25");
  return data.url;
}

async function fetchWithTimeout(url, init, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
  const timeout = Number(timeoutMs);
  if (!Number.isFinite(timeout) || timeout <= 0) return fetch(url, init);

  const controller = new AbortController();
  const externalSignal = init.signal;
  let timedOut = false;
  const abortFromExternalSignal = () => controller.abort(externalSignal?.reason);
  if (externalSignal?.aborted) abortFromExternalSignal();
  else externalSignal?.addEventListener("abort", abortFromExternalSignal, { once: true });
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeout);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } catch (error) {
    if (timedOut) {
      throw new Error("\u8bf7\u6c42\u8d85\u65f6\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", abortFromExternalSignal);
  }
}

function parseRetryAfter(value) {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) return undefined;
  const seconds = Number(rawValue);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds;
  const retryAt = Date.parse(rawValue);
  if (!Number.isFinite(retryAt)) return undefined;
  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
}
