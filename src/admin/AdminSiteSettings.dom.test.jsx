// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminApi } from "../api/client.js";
import AdminSiteSettings from "./AdminSiteSettings.jsx";

vi.mock("../api/client.js", () => ({ adminApi: vi.fn() }));

function deferred() {
  let resolve, reject;
  const promise = new Promise((accept, fail) => { resolve = accept; reject = fail; });
  return { promise, resolve, reject };
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("AdminSiteSettings loading and editing", () => {
  it("waits for the real settings before exposing edits and saves the edited server draft", async () => {
    const initial = deferred(), save = deferred();
    adminApi.mockReturnValueOnce(initial.promise).mockReturnValueOnce(save.promise);
    const onSaved = vi.fn();
    const view = render(<AdminSiteSettings token="admin" onSaved={onSaved} />);
    expect(screen.getByRole("status").textContent).toContain("正在加载系统设置");
    expect(screen.queryByLabelText(/大厅标题/)).toBeNull();
    expect(screen.queryByRole("button", { name: "保存", exact: true })).toBeNull();
    await act(async () => initial.resolve({ settings: { homeTitle: "服务器学园", homeVersion: "v2", aboutText: "服务器说明" } }));
    const title = screen.getByLabelText(/大厅标题/);
    expect(title.value).toBe("服务器学园");
    fireEvent.change(title, { target: { value: "全量验收学园" } });
    view.rerender(<AdminSiteSettings token="admin" onSaved={onSaved} onNotice={vi.fn()} />);
    expect(title.value).toBe("全量验收学园");
    expect(adminApi).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "保存", exact: true }));
    const options = adminApi.mock.calls[1][2];
    expect(options).toMatchObject({ method: "PATCH", body: { homeTitle: "全量验收学园", homeVersion: "v2", aboutText: "服务器说明" } });
    expect(screen.getByRole("button", { name: "保存中", exact: true }).disabled).toBe(true);
    await act(async () => save.resolve({ settings: options.body }));
    expect(onSaved).toHaveBeenCalledWith(options.body);
    expect(title.value).toBe("全量验收学园");
    expect(screen.getByRole("button", { name: "保存", exact: true }).disabled).toBe(false);
  });

  it("keeps a failed initial load safe and retries before enabling the form", async () => {
    const initial = deferred(), retry = deferred();
    adminApi.mockReturnValueOnce(initial.promise).mockReturnValueOnce(retry.promise);
    const onNotice = vi.fn();
    render(<AdminSiteSettings token="admin" onNotice={onNotice} />);
    await act(async () => initial.reject(new Error("网络不可用")));
    expect(screen.getByRole("alert").textContent).toContain("网络不可用");
    expect(screen.queryByLabelText(/大厅标题/)).toBeNull();
    expect(screen.queryByRole("button", { name: "保存", exact: true })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "重试", exact: true }));
    expect(screen.getByRole("status")).not.toBeNull();
    expect(adminApi).toHaveBeenCalledTimes(2);
    await act(async () => retry.resolve({ settings: { homeTitle: "重试后学园" } }));
    expect(screen.getByLabelText(/大厅标题/).value).toBe("重试后学园");
    expect(onNotice).toHaveBeenCalledExactlyOnceWith("网络不可用", "danger");
  });

  it("ignores an older load after the token changes instead of overwriting current edits", async () => {
    const older = deferred(), current = deferred();
    adminApi.mockReturnValueOnce(older.promise).mockReturnValueOnce(current.promise);
    const view = render(<AdminSiteSettings token="older" />);
    view.rerender(<AdminSiteSettings token="current" />);
    await act(async () => current.resolve({ settings: { homeTitle: "当前学园" } }));
    fireEvent.change(screen.getByLabelText(/大厅标题/), { target: { value: "当前编辑" } });
    await act(async () => older.resolve({ settings: { homeTitle: "过期学园" } }));
    expect(screen.getByLabelText(/大厅标题/).value).toBe("当前编辑");
    expect(adminApi.mock.calls.map(call => call[1])).toEqual(["older", "current"]);
  });

  it("ignores an initial-load failure after leaving the settings page", async () => {
    const initial = deferred();
    adminApi.mockReturnValueOnce(initial.promise);
    const onNotice = vi.fn();
    const view = render(<AdminSiteSettings token="admin" onNotice={onNotice} />);
    view.unmount();
    await act(async () => initial.reject(new Error("过期请求失败")));
    expect(onNotice).not.toHaveBeenCalled();
  });
});
