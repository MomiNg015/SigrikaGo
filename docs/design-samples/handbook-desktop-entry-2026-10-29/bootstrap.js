// This standalone review page must never mutate a real account.
const fetchAssets = window.fetch.bind(window);
window.fetch = (input, init) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url, location.href);
  if (url.pathname.startsWith("/api/")) {
    return Promise.resolve(new Response(JSON.stringify({ error: "动效样板不保存数据" }), {
      status: 403, headers: { "Content-Type": "application/json" }
    }));
  }
  return fetchAssets(input, init);
};
await import("./preview.jsx");
