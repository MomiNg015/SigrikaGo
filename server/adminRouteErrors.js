export function routeError(status, message, details = null) {
  const error = new Error(message);
  error.status = status;
  if (details && typeof details === "object") error.details = details;
  return error;
}
