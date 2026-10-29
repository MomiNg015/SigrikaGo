// This preview is a standalone local fixture. Keep all app API reads and writes
// in this document local; asset fetches still use the normal development server.
export function installHomeSampleApi() {
  const original = window.fetch;
  window.fetch = (input, init) => {
    const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith("/api/")) return original(input, init);
    const data = url.pathname.includes("mailbox") ? { messages: [], unreadCount: 0, badgeCount: 0 }
      : url.pathname.includes("recruitment") ? { items: [], utilities: [], task: null }
        : url.pathname.includes("profile") ? { profile: { username: "新部员", characterStats: [], rating: 1000 } }
          : { items: [] };
    return Promise.resolve(new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } }));
  };
  return () => { window.fetch = original; };
}
