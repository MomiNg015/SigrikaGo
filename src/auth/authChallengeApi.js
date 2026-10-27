import { api } from "../api/client.js";

export function loadAuthChallenge(purpose, signal) {
  return api(`/api/auth/challenge?purpose=${encodeURIComponent(purpose)}`, { signal });
}
