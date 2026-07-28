// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminApi } from "../api/client.js";
import { irisGreetingsSettingJson } from "../shared/irisGreeting.js";
import {
  DEFAULT_SHOP_MASCOT_DIALOGUES,
  shopMascotDialoguesSettingJson
} from "../shared/shopMascotDialogues.js";
import AdminMascotSettings, {
  DialoguePoolEditor,
  IrisLinksEditor
} from "./AdminMascotSettings.jsx";

vi.mock("../api/client.js", () => ({
  adminApi: vi.fn()
}));

const persistedDialogues = {
  ...DEFAULT_SHOP_MASCOT_DIALOGUES,
  zahira: {
    ...DEFAULT_SHOP_MASCOT_DIALOGUES.zahira,
    greetingLines: ["扎希拉欢迎。", "今天想看看什么？"]
  },
  nabomo: {
    ...DEFAULT_SHOP_MASCOT_DIALOGUES.nabomo,
    thanksLine: "娜波摩谢谢你。"
  }
};

const persistedSettings = {
  shopMascotDialogues: shopMascotDialoguesSettingJson(persistedDialogues),
  irisGreeting: irisGreetingsSettingJson(["IRIS 欢迎回来。"]),
  irisLinks: JSON.stringify([
    { title: "棋谱站", description: "公开棋谱", href: "https://example.com/kifu" }
  ])
};

describe("AdminMascotSettings", () => {
  beforeEach(() => {
    adminApi.mockReset();
    adminApi.mockResolvedValue({ settings: persistedSettings });
  });

  afterEach(cleanup);

  it("renders all three mascot editors from one admin destination", async () => {
    render(<AdminMascotSettings token="token" onNotice={vi.fn()} />);

    expect(await screen.findByText("扎希拉 · 扎希拉商铺")).toBeTruthy();
    expect(screen.getByText("娜波摩 · 残星会商店")).toBeTruthy();
    expect(screen.getByText("IRIS · IRIS 数据库")).toBeTruthy();
    expect(screen.getByRole("button", { name: "保存看板娘配置" })).toBeTruthy();
  });

  it("keeps edited fields when parent callbacks change and focus moves", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <AdminMascotSettings token="token" onNotice={vi.fn()} />
    );
    const zahiraInput = await screen.findByDisplayValue("扎希拉欢迎。");

    await user.clear(zahiraInput);
    await user.type(zahiraInput, "新的扎希拉台词");
    rerender(<AdminMascotSettings token="token" onNotice={vi.fn()} />);
    await user.click(screen.getByDisplayValue("娜波摩谢谢你。"));

    expect(zahiraInput.value).toBe("新的扎希拉台词");
    expect(adminApi).toHaveBeenCalledTimes(1);
  });

  it("saves shop dialogue pools, IRIS greeting, and IRIS links together", async () => {
    const user = userEvent.setup();
    adminApi
      .mockResolvedValueOnce({ settings: persistedSettings })
      .mockResolvedValueOnce({
        settings: {
          ...persistedSettings,
          shopMascotDialogues: shopMascotDialoguesSettingJson({
            ...persistedDialogues,
            zahira: {
              ...persistedDialogues.zahira,
              greetingLines: ["新的扎希拉台词", "今天想看看什么？"]
            }
          }),
          irisGreeting: irisGreetingsSettingJson(["今天也要认真复盘。"]),
          irisLinks: JSON.stringify([
            { title: "新棋谱站", description: "公开棋谱", href: "https://example.com/kifu" }
          ])
        }
      });

    render(<AdminMascotSettings token="token" onNotice={vi.fn()} />);
    const zahiraInput = await screen.findByDisplayValue("扎希拉欢迎。");
    await user.clear(zahiraInput);
    await user.type(zahiraInput, "新的扎希拉台词");
    const greetingInput = screen.getByDisplayValue("IRIS 欢迎回来。");
    await user.clear(greetingInput);
    await user.type(greetingInput, "今天也要认真复盘。");
    const titleInput = screen.getByDisplayValue("棋谱站");
    await user.clear(titleInput);
    await user.type(titleInput, "新棋谱站");
    await user.click(screen.getByRole("button", { name: "保存看板娘配置" }));

    await waitFor(() => expect(adminApi).toHaveBeenCalledTimes(2));
    expect(adminApi).toHaveBeenLastCalledWith("/site-settings", "token", {
      method: "PATCH",
      body: {
        shopMascotDialogues: expect.stringContaining("新的扎希拉台词"),
        irisGreeting: irisGreetingsSettingJson(["今天也要认真复盘。"]),
        irisLinks: expect.stringContaining('"title": "新棋谱站"')
      }
    });
  });

  it("adds and removes random dialogue and IRIS link rows", async () => {
    const user = userEvent.setup();
    const onDialogueChange = vi.fn();
    const { rerender } = render(
      <DialoguePoolEditor
        label="进入时随机台词"
        tip="测试"
        value={["第一句"]}
        onChange={onDialogueChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "添加进入时随机台词" }));
    expect(onDialogueChange).toHaveBeenLastCalledWith(["第一句", ""]);

    rerender(
      <DialoguePoolEditor
        label="进入时随机台词"
        tip="测试"
        value={["第一句", "第二句"]}
        onChange={onDialogueChange}
      />
    );
    await user.click(screen.getAllByRole("button", { name: "删除台词" })[0]);
    expect(onDialogueChange).toHaveBeenLastCalledWith(["第二句"]);

    rerender(
      <DialoguePoolEditor
        label="问候语"
        tip="测试"
        value={["第一句 IRIS 问候语"]}
        onChange={onDialogueChange}
      />
    );
    await user.click(screen.getByRole("button", { name: "添加问候语" }));
    expect(onDialogueChange).toHaveBeenLastCalledWith(["第一句 IRIS 问候语", ""]);

    const onLinksChange = vi.fn();
    rerender(
      <IrisLinksEditor
        value={[{ title: "棋谱站", description: "公开棋谱", href: "https://example.com/kifu" }]}
        onChange={onLinksChange}
      />
    );
    await user.click(screen.getByRole("button", { name: "添加资料链接" }));
    expect(onLinksChange).toHaveBeenLastCalledWith([
      { title: "棋谱站", description: "公开棋谱", href: "https://example.com/kifu" },
      { title: "", description: "", href: "" }
    ]);
  });
});
