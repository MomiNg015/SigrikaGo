import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import AuthScreen from "./AuthScreen.jsx";
import { AUTH_REGISTER_HELP, authSubmitText, isAlreadyLoggedInError, truncateUsernameInput, usernameDisplayWidth, validateAuthField, validateAuthSubmit } from "./AuthScreen.jsx";
import { readCssWithImports } from "../styles/cssTestUtils.js";

describe("AuthScreen submit validation", () => {
  it("allows login without a password confirmation", () => {
    expect(validateAuthSubmit({ mode: "login", password: "secret1", confirmPassword: "" })).toEqual({ ok: true });
  });

  it("rejects registration when password confirmation does not match", () => {
    expect(validateAuthSubmit({
      mode: "register",
      username: "Alice_12",
      password: "secret1",
      confirmPassword: "secret2"
    })).toEqual({
      ok: false,
      error: "\u4e24\u6b21\u8f93\u5165\u7684\u5bc6\u7801\u4e0d\u4e00\u81f4",
      fieldErrors: {
        username: "",
        password: "",
        confirmPassword: "\u4e24\u6b21\u8f93\u5165\u7684\u5bc6\u7801\u4e0d\u4e00\u81f4"
      }
    });
  });

  it("allows registration when password confirmation matches", () => {
    expect(validateAuthSubmit({
      mode: "register",
      username: "Alice_12",
      password: "secret1",
      confirmPassword: "secret1"
    })).toEqual({ ok: true });
  });

  it("validates registration fields with the same username and password limits as the server", () => {
    expect(usernameDisplayWidth("Alice_12")).toBe(8);
    expect(validateAuthField("username", "Alice_12")).toBe("");
    expect(validateAuthField("username", "Alice_123")).toContain("2-8");
    expect(validateAuthField("username", "bad-name")).toBe("\u7528\u6237\u540d\u4ec5\u652f\u6301\u4e2d\u6587\u3001\u65e5\u6587\u3001\u97e9\u6587\u3001\u534a\u89d2\u82f1\u6587\u3001\u6570\u5b57\u548c\u4e0b\u5212\u7ebf");
    expect(validateAuthField("password", "12345")).toBe("\u5bc6\u7801\u9700\u4e3a 6-14 \u4f4d");
    expect(validateAuthField("password", "123456789012345")).toBe("\u5bc6\u7801\u9700\u4e3a 6-14 \u4f4d");
    expect(validateAuthField("confirmPassword", "secret2", { password: "secret1" })).toBe("\u4e24\u6b21\u8f93\u5165\u7684\u5bc6\u7801\u4e0d\u4e00\u81f4");
  });

  it("returns field errors when registration submit values are invalid", () => {
    expect(validateAuthSubmit({
      mode: "register",
      username: "bad-name",
      password: "12345",
      confirmPassword: "123456"
    })).toEqual({
      ok: false,
      error: "\u7528\u6237\u540d\u4ec5\u652f\u6301\u4e2d\u6587\u3001\u65e5\u6587\u3001\u97e9\u6587\u3001\u534a\u89d2\u82f1\u6587\u3001\u6570\u5b57\u548c\u4e0b\u5212\u7ebf",
      fieldErrors: {
        username: "\u7528\u6237\u540d\u4ec5\u652f\u6301\u4e2d\u6587\u3001\u65e5\u6587\u3001\u97e9\u6587\u3001\u534a\u89d2\u82f1\u6587\u3001\u6570\u5b57\u548c\u4e0b\u5212\u7ebf",
        password: "\u5bc6\u7801\u9700\u4e3a 6-14 \u4f4d",
        confirmPassword: "\u4e24\u6b21\u8f93\u5165\u7684\u5bc6\u7801\u4e0d\u4e00\u81f4"
      }
    });
  });

  it("detects already logged in responses", () => {
    expect(isAlreadyLoggedInError({ status: 409, code: "already_logged_in" })).toBe(true);
    expect(isAlreadyLoggedInError({ status: 401, code: "already_logged_in" })).toBe(false);
  });

  it("uses the pop-tech connection copy for login submit", () => {
    expect(authSubmitText("login")).toBe("START CONNECTION!! >");
    expect(authSubmitText("register")).toBe("\u521b\u5efa\u8d26\u53f7");
  });

  it("truncates username input by CJK and half-width display width", () => {
    expect(truncateUsernameInput("\u4e00\u4e8c\u4e09\u56db\u4e94")).toBe("\u4e00\u4e8c\u4e09\u56db");
    expect(truncateUsernameInput("Alice_123")).toBe("Alice_12");
    expect(truncateUsernameInput("\u9732\u9732A_123")).toBe("\u9732\u9732A_12");
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

  it("renders registration input guidance as field placeholders", () => {
    const html = renderToStaticMarkup(createElement(AuthScreen, { onAuth: () => {}, initialMode: "register" }));

    expect(html).not.toContain("auth-field-hint");
    expect(html).toContain(AUTH_REGISTER_HELP.username);
    expect(html).toContain(AUTH_REGISTER_HELP.password);
    expect(html).toContain(AUTH_REGISTER_HELP.confirmPassword);
    expect(html).toContain(`placeholder="${AUTH_REGISTER_HELP.username}"`);
    expect(html).toContain(`placeholder="${AUTH_REGISTER_HELP.password}"`);
    expect(html).toContain(`placeholder="${AUTH_REGISTER_HELP.confirmPassword}"`);
    expect(html).not.toContain("register-username-hint");
    expect(html).not.toContain("register-password-hint");
    expect(html).not.toContain("register-confirmPassword-hint");
  });

  it("styles registration placeholders and invalid inputs", () => {
    const css = readCssWithImports(new URL("../styles/base.css", import.meta.url));
    const themeCss = readCssWithImports(new URL("../styles/themes/bright-school.css", import.meta.url));

    expect(css).toContain(".auth-form input::placeholder");
    expect(css).toContain(".auth-field-error");
    expect(css).toContain(".auth-field.invalid input");
    expect(themeCss).toContain(".auth-form input::placeholder");
    expect(themeCss).toContain(".auth-field.invalid input");
    expect(themeCss).toContain("border-color: #c0182d !important");
  });

  it("keeps the Bright School mobile auth title single-line without tinted blocks", () => {
    const css = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));

    expect(css).toContain(".auth-panel .brand-lockup");
    expect(css).toContain("background: transparent !important");
    expect(css).toContain("background-image: none !important");
    expect(css).toContain(".auth-panel .segmented");
    expect(css).toContain(".login-title-text");
    expect(css).toContain("font-size: clamp(22px, 6.7vw, 30px) !important");
    expect(css).toContain("white-space: nowrap !important");
  });

  it("keeps Bright School auth chrome paper-flat except for the outer card shadow", () => {
    const themeCss = readCssWithImports(new URL("../styles/themes/bright-school.css", import.meta.url));
    const mobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const authPanelBlock = themeCss.match(/\.theme-bright-school\.theme-bright-school \.auth-screen \.auth-panel\.login-card-container\.login-card-container\s*\{[^}]+\}/)?.[0] ?? "";
    const brandBlock = themeCss.match(/\.theme-bright-school\.theme-bright-school \.auth-panel \.brand-lockup\s*\{[^}]+\}/)?.[0] ?? "";
    const segmentedBlock = themeCss.match(/\.theme-bright-school\.theme-bright-school \.auth-panel \.segmented\s*\{[^}]+\}/)?.[0] ?? "";
    const mobileBrandBlock = mobileCss.match(/\.theme-bright-school\.theme-bright-school \.auth-panel \.brand-lockup\s*\{[^}]+\}/)?.[0] ?? "";
    const mobilePanelBlock = mobileCss.match(/\.theme-bright-school\.theme-bright-school \.auth-screen \.auth-panel\.login-card-container\.login-card-container\s*\{[^}]+\}/)?.[0] ?? "";

    expect(authPanelBlock).toContain("box-shadow: 6px 6px 0 var(--bright-border) !important");
    expect(brandBlock).toContain("background: transparent !important");
    expect(brandBlock).toContain("background-image: none !important");
    expect(brandBlock).toContain("border: 0 !important");
    expect(brandBlock).toContain("box-shadow: none !important");
    expect(segmentedBlock).toContain("background: transparent !important");
    expect(segmentedBlock).toContain("background-image: none !important");
    expect(mobileBrandBlock).toContain("border: 0 !important");
    expect(mobilePanelBlock).toContain("box-shadow: 6px 6px 0 var(--bright-border) !important");
  });
});
