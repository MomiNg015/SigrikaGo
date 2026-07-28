// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminApi } from "../api/client.js";
import AdminIrisSettings, { IrisLinksEditor } from "./AdminIrisSettings.jsx";

vi.mock("../api/client.js", () => ({
  adminApi: vi.fn()
}));

const persistedSettings = {
  irisGreeting: "欢迎回来。",
  irisLinks: JSON.stringify([
    { title: "棋谱站", description: "公开棋谱", href: "https://example.com/kifu" }
  ])
};

describe("AdminIrisSettings", () => {
  beforeEach(() => {
    adminApi.mockReset();
    adminApi.mockResolvedValue({ settings: persistedSettings });
  });

  afterEach(cleanup);

  it("keeps an edited field when parent callbacks change and focus moves", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <AdminIrisSettings token="token" onNotice={vi.fn()} />
    );
    const titleInput = await screen.findByDisplayValue("棋谱站");

    await user.clear(titleInput);
    await user.type(titleInput, "新棋谱站");
    rerender(<AdminIrisSettings token="token" onNotice={vi.fn()} />);
    await user.click(screen.getByDisplayValue("公开棋谱"));

    expect(titleInput.value).toBe("新棋谱站");
    expect(adminApi).toHaveBeenCalledTimes(1);
  });

  it("saves only the IRIS catalog and adopts the persisted response", async () => {
    const user = userEvent.setup();
    adminApi
      .mockResolvedValueOnce({ settings: persistedSettings })
      .mockResolvedValueOnce({
        settings: {
          irisGreeting: "今天也要认真复盘。",
          irisLinks: JSON.stringify([
            { title: "新棋谱站", description: "公开棋谱", href: "https://example.com/kifu" }
          ])
        }
      });

    render(<AdminIrisSettings token="token" onNotice={vi.fn()} />);
    const greetingInput = await screen.findByDisplayValue("欢迎回来。");
    await user.clear(greetingInput);
    await user.type(greetingInput, "今天也要认真复盘。");
    const titleInput = await screen.findByDisplayValue("棋谱站");
    await user.clear(titleInput);
    await user.type(titleInput, "新棋谱站");
    await user.click(screen.getByRole("button", { name: "保存 IRIS 资料" }));

    await waitFor(() => expect(adminApi).toHaveBeenCalledTimes(2));
    expect(adminApi).toHaveBeenLastCalledWith("/site-settings", "token", {
      method: "PATCH",
      body: {
        irisGreeting: "今天也要认真复盘。",
        irisLinks: expect.stringContaining('"title": "新棋谱站"')
      }
    });
    expect(greetingInput.value).toBe("今天也要认真复盘。");
    expect(titleInput.value).toBe("新棋谱站");
  });

  it("adds and removes editable link rows", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const value = [
      { title: "棋谱站", description: "公开棋谱", href: "https://example.com/kifu" }
    ];
    const { rerender } = render(<IrisLinksEditor value={value} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "添加资料链接" }));
    expect(onChange).toHaveBeenLastCalledWith([
      ...value,
      { title: "", description: "", href: "" }
    ]);

    rerender(<IrisLinksEditor value={value} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "删除条目" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
