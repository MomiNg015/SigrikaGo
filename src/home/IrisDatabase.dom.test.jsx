// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_IRIS_LINKS } from "../shared/irisLinks.js";
import { playUiIrisDatabaseOpenSound } from "../audio/playback.jsx";
import IrisDatabase from "./IrisDatabase.jsx";

vi.mock("../audio/playback.jsx", () => ({
  playUiIrisDatabaseOpenSound: vi.fn()
}));

describe("IRIS Database home interaction", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("opens an image-free database dialog and restores focus on Escape", async () => {
    const user = userEvent.setup();
    const audioSettings = { master: 80, sfx: 35 };
    const { container } = render(<IrisDatabase audioSettings={audioSettings} />);
    const entry = screen.getByRole("button", { name: "打开 IRIS 数据库" });

    expect(entry.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(container.querySelector("img")).toBeNull();

    await user.click(entry);

    expect(playUiIrisDatabaseOpenSound).toHaveBeenCalledWith(audioSettings);
    const dialog = screen.getByRole("dialog", { name: "围棋资料索引" });
    const close = screen.getByRole("button", { name: "关闭 IRIS 数据库" });
    expect(entry.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(close);
    expect(dialog.querySelector("img")).toBeNull();
    expect(container.querySelectorAll(".iris-entry-portrait-slot, .iris-database-portrait-slot")).toHaveLength(2);
    expect(screen.getByLabelText("IRIS 人物立绘预留区域，当前为空")).toBeTruthy();
    expect(screen.queryByText(/常用围棋资料已经重新编入目录/)).toBeNull();
    expect(screen.queryByText(/你昨天漏看的那盘棋/)).toBeNull();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(DEFAULT_IRIS_LINKS.length);
    for (const link of links) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noreferrer");
    }

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(entry);
    expect(entry.getAttribute("aria-expanded")).toBe("false");
  });

  it("renders the configured link list instead of a frontend constant", async () => {
    const user = userEvent.setup();
    render(<IrisDatabase links={JSON.stringify([
      { title: "自定义棋谱站", description: "后台配置", href: "https://example.com/kifu" }
    ])} />);

    await user.click(screen.getByRole("button", { name: "打开 IRIS 数据库" }));

    expect(screen.getByRole("link", { name: /自定义棋谱站/ })).toBeTruthy();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("keeps the configured greeting expanded above the empty portrait slot", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <IrisDatabase greeting="今天也要认真复盘。" />
    );

    await user.click(screen.getByRole("button", { name: "打开 IRIS 数据库" }));

    const panel = container.querySelector(".iris-database-portrait-panel");
    const greeting = container.querySelector(".iris-database-greeting");
    const portrait = container.querySelector(".iris-database-portrait-slot");
    expect(panel.contains(greeting)).toBe(true);
    expect(greeting.compareDocumentPosition(portrait) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("今天也要认真复盘。")).toBeTruthy();
    expect(greeting.classList.contains("is-collapsed")).toBe(false);
    expect(screen.queryByRole("button", { name: /IRIS 问候语/ })).toBeNull();
  });

  it("selects a new configured greeting each time the database opens", async () => {
    const user = userEvent.setup();
    const random = vi.spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.999);
    render(<IrisDatabase greeting={JSON.stringify(["第一句问候语", "第二句问候语"])} />);
    const entry = screen.getByRole("button", { name: "打开 IRIS 数据库" });

    await user.click(entry);
    expect(screen.getByText("第一句问候语")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "关闭 IRIS 数据库" }));
    await user.click(entry);
    expect(screen.getByText("第二句问候语")).toBeTruthy();

    random.mockRestore();
  });

  it("closes when the backdrop is activated", async () => {
    const user = userEvent.setup();
    const { container } = render(<IrisDatabase />);

    await user.click(screen.getByRole("button", { name: "打开 IRIS 数据库" }));
    await user.click(container.querySelector(".iris-database-backdrop"));

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
