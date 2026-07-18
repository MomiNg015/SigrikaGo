import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import AuthScreen from "./AuthScreen.jsx";
import { AUTH_REGISTER_LABEL_NOTES, authSubmitText, isAlreadyLoggedInError, usernameDisplayWidth, validateAuthField, validateAuthSubmit } from "./AuthScreen.jsx";
import { readCssWithImports } from "../styles/cssTestUtils.js";

describe("AuthScreen submit validation", () => {
  it("allows login without a password confirmation", () => {
    expect(validateAuthSubmit({ mode: "login", username: "Alice_12", password: "secret1", confirmPassword: "" })).toEqual({ ok: true });
  });

  it("rejects registration when password confirmation does not match", () => {
    expect(validateAuthSubmit({
      mode: "register",
      username: "Alice_12",
      password: "secret12",
      confirmPassword: "secret21"
    })).toEqual({
      ok: false,
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
      password: "secret12",
      confirmPassword: "secret12"
    })).toEqual({ ok: true });
  });

  it("validates registration fields with the same username and password limits as the server", () => {
    expect(usernameDisplayWidth("Alice_12")).toBe(8);
    expect(validateAuthField("username", "Alice_12")).toBe("");
    expect(validateAuthField("username", "Alice_123")).toContain("\u6700\u591a 4 \u4e2a");
    expect(validateAuthField("username", "bad-name")).toBe("\u7528\u6237\u540d\u4ec5\u652f\u6301\u4e2d\u6587\u3001\u65e5\u6587\u3001\u97e9\u6587\u3001\u534a\u89d2\u82f1\u6587\u3001\u6570\u5b57\u548c\u4e0b\u5212\u7ebf");
    expect(validateAuthField("password", "1234567", { mode: "register" })).toBe("\u65b0\u5bc6\u7801\u9700\u4e3a 8-64 \u4f4d");
    expect(validateAuthField("password", "1234567", { mode: "login" })).toBe("");
    expect(validateAuthField("password", "x".repeat(65), { mode: "register" })).toBe("\u65b0\u5bc6\u7801\u9700\u4e3a 8-64 \u4f4d");
    expect(validateAuthField("confirmPassword", "secret2", { password: "secret1" })).toBe("\u4e24\u6b21\u8f93\u5165\u7684\u5bc6\u7801\u4e0d\u4e00\u81f4");
  });

  it("returns field errors when registration submit values are invalid", () => {
    expect(validateAuthSubmit({
      mode: "register",
      username: "bad-name",
      password: "1234567",
      confirmPassword: "123456"
    })).toEqual({
      ok: false,
      fieldErrors: {
        username: "\u7528\u6237\u540d\u4ec5\u652f\u6301\u4e2d\u6587\u3001\u65e5\u6587\u3001\u97e9\u6587\u3001\u534a\u89d2\u82f1\u6587\u3001\u6570\u5b57\u548c\u4e0b\u5212\u7ebf",
        password: "\u65b0\u5bc6\u7801\u9700\u4e3a 8-64 \u4f4d",
        confirmPassword: "\u4e24\u6b21\u8f93\u5165\u7684\u5bc6\u7801\u4e0d\u4e00\u81f4"
      }
    });
  });

  it("detects already logged in responses", () => {
    expect(isAlreadyLoggedInError({ status: 409, code: "already_logged_in" })).toBe(true);
    expect(isAlreadyLoggedInError({ status: 401, code: "already_logged_in" })).toBe(false);
  });

  it("uses direct Chinese copy for the primary actions", () => {
    expect(authSubmitText("login")).toBe("开门！");
    expect(authSubmitText("register")).toBe("登记入部信息");
  });

  it("reports overlong usernames instead of truncating them", () => {
    expect(validateAuthField("username", "\u4e00\u4e8c\u4e09\u56db\u4e94")).toContain("\u6700\u591a 4 \u4e2a");
    expect(validateAuthField("username", "Alice_123")).toContain("\u6700\u591a 4 \u4e2a");
  });

  it("renders tactical terminal class hooks without changing the auth form", () => {
    const html = renderToStaticMarkup(createElement(AuthScreen, { onAuth: () => {} }));

    expect(html).toContain("login-card-container");
    expect(html).toContain('class="login-title-mascot"');
    expect(html).toContain('class="login-title-text text-window-title"');
    expect(html).toContain("login-submit-btn");
    expect(html).toContain("terminal-enter-btn");
    expect(html).toContain('src="/assets/login-sigrika-mascot.webp"');
    expect(html).not.toContain('src="/assets/sigrika_centered.webp"');
    expect(html).toContain('<p class="text-display-accent">SigrikaGo</p>');
    expect(html).toContain("autoComplete=\"username\"");
    expect(html).toContain("name=\"username\"");
    expect(html).toContain("type=\"password\"");
    expect(html).toContain("aria-pressed=\"true\"");
    expect(html).toContain("aria-label=\"\u663e\u793a\u5bc6\u7801\"");
    expect(html).toContain("alt=\"\"");
    expect(html).not.toContain("\\u897f\\u683c\\u8389\\u5361");
  });

  it("ships the login-only mascot as a compressed WebP with its PNG source", () => {
    const png = readFileSync(new URL("../../public/assets/login-sigrika-mascot.png", import.meta.url));
    const webp = readFileSync(new URL("../../public/assets/login-sigrika-mascot.webp", import.meta.url));

    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(webp.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(webp.subarray(8, 12).toString("ascii")).toBe("WEBP");
    expect(webp.byteLength).toBeLessThan(png.byteLength);
  });

  it("pins the login mascot above the card without stretching it and uses the window-title font", () => {
    const baseCss = readCssWithImports(new URL("../styles/base.css", import.meta.url));
    const mobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const desktopBrandBlock = baseCss.match(/\.brand-lockup\s*\{[^}]+\}/)?.[0] ?? "";
    const desktopMascotBlock = baseCss.match(/\.brand-lockup \.login-title-mascot\s*\{[^}]+\}/)?.[0] ?? "";
    const mobileMascotBlock = mobileCss.match(/\.theme-bright-school\.theme-bright-school \.auth-panel \.brand-lockup \.login-title-mascot\s*\{[^}]+\}/)?.[0] ?? "";

    expect(desktopBrandBlock).toContain("padding-left: 112px");
    expect(desktopMascotBlock).toContain("position: absolute");
    expect(desktopMascotBlock).toContain("width: 240px");
    expect(desktopMascotBlock).toContain("height: 240px");
    expect(desktopMascotBlock).toContain("transform: rotate(-6deg)");
    expect(mobileMascotBlock).toContain("width: clamp(140px, 39vw, 148px) !important");
    expect(mobileMascotBlock).toContain("height: clamp(140px, 39vw, 148px) !important");
    expect(mobileMascotBlock).toContain("transform: rotate(-6deg) !important");
    expect(mobileCss).toContain(".text-window-title");
    expect(mobileCss).toContain("font-family: var(--font-window-title), var(--font-ui-default) !important");
  });

  it("keeps registration guidance short and outside placeholders", () => {
    const html = renderToStaticMarkup(createElement(AuthScreen, { onAuth: () => {}, initialMode: "register" }));

    expect(html).not.toContain("auth-field-hint");
    expect(html).toContain(AUTH_REGISTER_LABEL_NOTES.username);
    expect(html).toContain(AUTH_REGISTER_LABEL_NOTES.password);
    expect(html).not.toContain("placeholder=");
    expect(html).not.toContain("\u8bf7\u518d\u8f93\u5165\u4e00\u6b21\u5bc6\u7801");
  });

  it("styles registration placeholders and invalid inputs", () => {
    const css = readCssWithImports(new URL("../styles/base.css", import.meta.url));
    const themeCss = readCssWithImports(new URL("../styles/themes/bright-school.css", import.meta.url));

    expect(css).toContain(".auth-form input::placeholder");
    expect(css).toContain(".auth-field-error");
    expect(css).toContain(".auth-field.invalid input");
    expect(css).toContain(".auth-password-toggle");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(themeCss).toContain(".auth-form input::placeholder");
    expect(themeCss).toContain(".auth-field.invalid input");
    expect(themeCss).toContain("border-color: #c0182d !important");
    expect(themeCss).toContain(".auth-password-toggle:hover");
    expect(themeCss).toContain(".auth-password-toggle:disabled");
    expect(themeCss).toContain("background: transparent !important");
    expect(themeCss).toContain("color: #d8507a !important");
    expect(themeCss).toContain("transform: translateY(-50%) !important");
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
