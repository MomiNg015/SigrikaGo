export const SEARCH_USERNAME_MAX_WIDTH = 10;
export const SEARCH_USERNAME_MAX_LENGTH = SEARCH_USERNAME_MAX_WIDTH;
export const SEARCH_USERNAME_DISALLOWED = /[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}A-Za-z0-9_]/gu;
const CJK_USERNAME_CHAR = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]$/u;

export function normalizeFriendSearchInput(value = "") {
  return truncateUsernameByDisplayWidth(value.replace(SEARCH_USERNAME_DISALLOWED, ""), SEARCH_USERNAME_MAX_WIDTH);
}

export function truncateUsernameByDisplayWidth(value = "", maxWidth = SEARCH_USERNAME_MAX_WIDTH) {
  let width = 0;
  let result = "";
  for (const char of String(value)) {
    const nextWidth = width + (CJK_USERNAME_CHAR.test(char) ? 2 : 1);
    if (nextWidth > maxWidth) break;
    width = nextWidth;
    result += char;
  }
  return result;
}
