// SQLite permits one writer at a time. A host-sized pool lets concurrent
// transactions hold read locks while competing for that writer, causing P1008.
// Keep an operator's explicit pool choice, and preserve the database path bytes.
export function sqliteClientOptions(env = process.env) {
  const url = env.DATABASE_URL;
  if (!url?.startsWith("file:")) return {};
  const question = url.indexOf("?");
  const query = new URLSearchParams(question < 0 ? "" : url.slice(question + 1));
  if (query.has("connection_limit")) return { datasources: { db: { url } } };
  const separator = question < 0 ? "?" : url.endsWith("?") || url.endsWith("&") ? "" : "&";
  return { datasources: { db: { url: `${url}${separator}connection_limit=1` } } };
}
