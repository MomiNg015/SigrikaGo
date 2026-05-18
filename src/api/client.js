const API_BASE = "";

export async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    const isHtml = text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html");
    throw new Error(isHtml ? "接口返回了前端页面而不是 JSON，请刷新页面并确认后端服务已启动。" : "接口返回格式不是 JSON。");
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "请求失败");
  return data;
}

export async function adminApi(path, token, options = {}) {
  return api(`/api/admin${path}`, { ...options, token });
}

export async function uploadPortrait(file, token) {
  const form = new FormData();
  form.append("portrait", file);
  const response = await fetch(`${API_BASE}/api/admin/uploads/character-portrait`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "上传失败");
  return data.url;
}
