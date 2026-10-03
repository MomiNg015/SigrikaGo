// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import IrisDatabase, { IRIS_FRIENDLY_LINKS } from "./IrisDatabase.jsx";

describe("IRIS Database home interaction", () => {
  afterEach(cleanup);

  it("opens an image-free database dialog and restores focus on Escape", async () => {
    const user = userEvent.setup();
    const { container } = render(<IrisDatabase />);
    const entry = screen.getByRole("button", { name: "打开 IRIS 数据库" });

    expect(entry.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(container.querySelector("img")).toBeNull();

    await user.click(entry);

    const dialog = screen.getByRole("dialog", { name: "围棋资料索引" });
    const close = screen.getByRole("button", { name: "关闭 IRIS 数据库" });
    expect(entry.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(close);
    expect(dialog.querySelector("img")).toBeNull();
    expect(container.querySelectorAll(".iris-entry-portrait-slot, .iris-database-portrait-slot")).toHaveLength(2);
    expect(screen.getByLabelText("IRIS 人物立绘预留区域，当前为空")).toBeTruthy();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(IRIS_FRIENDLY_LINKS.length);
    for (const link of links) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noreferrer");
    }

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(entry);
    expect(entry.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes when the backdrop is activated", async () => {
    const user = userEvent.setup();
    const { container } = render(<IrisDatabase />);

    await user.click(screen.getByRole("button", { name: "打开 IRIS 数据库" }));
    await user.click(container.querySelector(".iris-database-backdrop"));

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
