import { describe, expect, it } from "vitest";
import { authSubmitText, isAlreadyLoggedInError, validateAuthSubmit } from "./AuthScreen.jsx";

describe("AuthScreen submit validation", () => {
  it("allows login without a password confirmation", () => {
    expect(validateAuthSubmit({ mode: "login", password: "secret1", confirmPassword: "" })).toEqual({ ok: true });
  });

  it("rejects registration when password confirmation does not match", () => {
    expect(validateAuthSubmit({
      mode: "register",
      password: "secret1",
      confirmPassword: "secret2"
    })).toEqual({
      ok: false,
      error: "\u4e24\u6b21\u8f93\u5165\u7684\u5bc6\u7801\u4e0d\u4e00\u81f4"
    });
  });

  it("allows registration when password confirmation matches", () => {
    expect(validateAuthSubmit({
      mode: "register",
      password: "secret1",
      confirmPassword: "secret1"
    })).toEqual({ ok: true });
  });

  it("detects already logged in responses", () => {
    expect(isAlreadyLoggedInError({ status: 409, code: "already_logged_in" })).toBe(true);
    expect(isAlreadyLoggedInError({ status: 401, code: "already_logged_in" })).toBe(false);
  });

  it("uses the go club copy for login submit", () => {
    expect(authSubmitText("login")).toBe("\u8fdb\u5165\u56f4\u68cb\u90e8");
    expect(authSubmitText("register")).toBe("\u521b\u5efa\u8d26\u53f7");
  });
});
