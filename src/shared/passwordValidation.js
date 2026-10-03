export const PASSWORD_MIN_LENGTH = 6;
export const NEW_PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const PASSWORD_MAX_BYTES = 72;
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/;
export function validateLoginPassword(input) {
  return validatePasswordWithMinimum(input, PASSWORD_MIN_LENGTH, "密码长度不正确");
}
export function validateNewPassword(input) {
  return validatePasswordWithMinimum(input, NEW_PASSWORD_MIN_LENGTH, "新密码需为 8-64 位");
}
function validatePasswordWithMinimum(input, minimum, error) {
  const value = String(input ?? "");
  if ([...value].length < minimum || [...value].length > PASSWORD_MAX_LENGTH) return { ok: false, error };
  if (new TextEncoder().encode(value).length > PASSWORD_MAX_BYTES) return { ok: false, error: "密码太长，请缩短后重试" };
  if (CONTROL_CHARS.test(value)) return { ok: false, error: "密码包含不支持的字符" };
  return { ok: true, value };
}
