export const SEARCH_USERNAME_MAX_LENGTH = 16;
export const SEARCH_USERNAME_DISALLOWED = /[^\p{Script=Han}A-Za-z0-9_]/gu;

export function normalizeFriendSearchInput(value = "") {
  return value.replace(SEARCH_USERNAME_DISALLOWED, "").slice(0, SEARCH_USERNAME_MAX_LENGTH);
}
