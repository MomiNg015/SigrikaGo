import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import AuthScreen from "./AuthScreen.jsx";
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

  it("uses the pop-tech connection copy for login submit", () => {
    expect(authSubmitText("login")).toBe("START CONNECTION!! >");
    expect(authSubmitText("register")).toBe("\u521b\u5efa\u8d26\u53f7");
  });

  it("renders tactical terminal class hooks without changing the auth form", () => {
    const html = renderToStaticMarkup(createElement(AuthScreen, { onAuth: () => {} }));

    expect(html).toContain("login-card-container");
    expect(html).toContain("login-title-text");
    expect(html).toContain("login-submit-btn");
    expect(html).toContain("terminal-enter-btn");
    expect(html).toContain("autoComplete=\"username\"");
    expect(html).toContain("type=\"password\"");
  });

  it("keeps the Bright School mobile auth title single-line without tinted blocks", () => {
    const css = readFileSync(new URL("../styles/mobile-adaptive.css", import.meta.url), "utf8");

    expect(css).toContain(".auth-panel .brand-lockup");
    expect(css).toContain("background: transparent !important");
    expect(css).toContain("background-image: none !important");
    expect(css).toContain(".auth-panel .segmented");
    expect(css).toContain(".login-title-text");
    expect(css).toContain("font-size: clamp(22px, 6.7vw, 30px) !important");
    expect(css).toContain("white-space: nowrap !important");
  });
});
