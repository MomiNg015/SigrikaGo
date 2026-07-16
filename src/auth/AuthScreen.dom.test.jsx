// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import AuthScreen from "./AuthScreen.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));

afterEach(() => {
  cleanup();
  api.mockReset();
  vi.restoreAllMocks();
});

describe("AuthScreen DOM interaction", () => {
  it("focuses the first invalid field and does not duplicate field errors at form level", async () => {
    const user = userEvent.setup();
    const { container } = render(<AuthScreen initialMode="register" onAuth={() => {}} />);

    await user.click(screen.getByRole("button", { name: "登记入部信息" }));

    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: /\u7528\u6237\u540d/ }));
    expect(screen.getByText("\u8bf7\u8f93\u5165\u7528\u6237\u540d")).not.toBeNull();
    expect(container.querySelector(".form-error")).toBeNull();
    expect(api).not.toHaveBeenCalled();
  });

  it("preserves username, clears passwords on mode change, and exposes selected semantics", async () => {
    const user = userEvent.setup();
    render(<AuthScreen onAuth={() => {}} />);

    const username = screen.getByRole("textbox", { name: /\u7528\u6237\u540d/ });
    const password = screen.getByLabelText("\u5bc6\u7801");
    await user.type(username, "Alice_12");
    await user.type(password, "secret1");
    await user.click(screen.getByRole("button", { name: "\u6ce8\u518c" }));

    expect(username.value).toBe("Alice_12");
    expect(document.getElementById("auth-password").value).toBe("");
    expect(screen.getByRole("button", { name: "\u6ce8\u518c" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "\u767b\u5f55" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("toggles password visibility without losing pointer focus", async () => {
    const user = userEvent.setup();
    render(<AuthScreen onAuth={() => {}} />);
    const password = screen.getByLabelText("\u5bc6\u7801");
    const toggle = screen.getByRole("button", { name: "\u663e\u793a\u5bc6\u7801" });
    password.focus();

    await user.click(toggle);

    expect(password.getAttribute("type")).toBe("text");
    expect(document.activeElement).toBe(password);
    expect(screen.getByRole("button", { name: "\u9690\u85cf\u5bc6\u7801" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("allows only one in-flight request across repeated synchronous submits", async () => {
    let resolveRequest;
    api.mockImplementation(() => new Promise((resolve) => { resolveRequest = resolve; }));
    const onAuth = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<AuthScreen onAuth={onAuth} />);
    await user.type(screen.getByRole("textbox", { name: /\u7528\u6237\u540d/ }), "Alice_12");
    await user.type(screen.getByLabelText("\u5bc6\u7801"), "secret1");
    const form = container.querySelector("form");

    for (let index = 0; index < 10; index += 1) fireEvent.submit(form);

    expect(api).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "\u767b\u5f55\u4e2d\u2026" }).disabled).toBe(true);
    resolveRequest({ token: "token", user: { id: "user-1" } });
    await waitFor(() => expect(onAuth).toHaveBeenCalledTimes(1));
  });

  it("aborts an in-flight request on unmount and ignores its later result", async () => {
    let requestSignal;
    let resolveRequest;
    api.mockImplementation((_path, options) => {
      requestSignal = options.signal;
      return new Promise((resolve) => { resolveRequest = resolve; });
    });
    const onAuth = vi.fn();
    const user = userEvent.setup();
    const { unmount } = render(<AuthScreen onAuth={onAuth} />);
    await user.type(screen.getByRole("textbox", { name: /\u7528\u6237\u540d/ }), "Alice_12");
    await user.type(screen.getByLabelText("\u5bc6\u7801"), "secret1");
    await user.click(screen.getByRole("button", { name: "开门！" }));

    await waitFor(() => expect(api).toHaveBeenCalledTimes(1));
    expect(requestSignal.aborted).toBe(false);
    unmount();
    expect(requestSignal.aborted).toBe(true);

    resolveRequest({ token: "late-token", user: { id: "late-user" } });
    await Promise.resolve();
    expect(onAuth).not.toHaveBeenCalled();
  });

  it("accepts a successful response after the Strict Mode effect rehearsal", async () => {
    api.mockResolvedValue({ token: "token", user: { id: "user-1" } });
    const onAuth = vi.fn();
    const user = userEvent.setup();
    render(
      <StrictMode>
        <AuthScreen onAuth={onAuth} />
      </StrictMode>
    );
    await user.type(screen.getByRole("textbox", { name: /\u7528\u6237\u540d/ }), "Alice_12");
    await user.type(screen.getByLabelText("\u5bc6\u7801"), "secret1");
    await user.click(screen.getByRole("button", { name: "开门！" }));

    await waitFor(() => expect(onAuth).toHaveBeenCalledWith("token", { id: "user-1" }));
  });

  it("uses the accessible confirmation layer for active-session conflicts", async () => {
    const conflict = Object.assign(new Error("conflict"), { status: 409, code: "already_logged_in" });
    api.mockRejectedValueOnce(conflict).mockResolvedValueOnce({ token: "token", user: { id: "user-1" } });
    const confirmSpy = vi.spyOn(window, "confirm");
    const user = userEvent.setup();
    render(<AuthScreen onAuth={() => {}} />);
    await user.type(screen.getByRole("textbox", { name: /\u7528\u6237\u540d/ }), "Alice_12");
    await user.type(screen.getByLabelText("\u5bc6\u7801"), "secret1");
    await user.click(screen.getByRole("button", { name: "开门！" }));

    expect(await screen.findByRole("dialog", { name: "\u8d26\u53f7\u5df2\u5728\u7ebf" })).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "\u9000\u51fa\u5176\u4ed6\u4f1a\u8bdd\u5e76\u7ee7\u7eed" }));

    await waitFor(() => expect(api).toHaveBeenCalledTimes(2));
    expect(api.mock.calls[1][1].body).toMatchObject({ forceLogin: true });
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("turns Retry-After into one concise recovery message", async () => {
    api.mockRejectedValue(Object.assign(new Error("too many"), { status: 429, retryAfter: 75 }));
    const user = userEvent.setup();
    render(<AuthScreen onAuth={() => {}} />);
    await user.type(screen.getByRole("textbox", { name: /\u7528\u6237\u540d/ }), "Alice_12");
    await user.type(screen.getByLabelText("\u5bc6\u7801"), "secret1");
    await user.click(screen.getByRole("button", { name: "开门！" }));

    expect(await screen.findByText("\u8bf7\u6c42\u592a\u9891\u7e41\uff0c\u8bf7 2 \u5206\u949f\u540e\u518d\u8bd5")).not.toBeNull();
  });
});
