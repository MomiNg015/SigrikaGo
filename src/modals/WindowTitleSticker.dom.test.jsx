// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import WindowTitleSticker from "./WindowTitleSticker.jsx";

describe("campus window title artwork", () => {
  it("keeps one accessible heading through image loading and failure", () => {
    const { container } = render(<WindowTitleSticker titleKey="handbook" id="handbook-title" />);
    const heading = screen.getByRole("heading", { name: "部员手册" });
    const art = container.querySelector("img");
    expect(heading.id).toBe("handbook-title");
    expect(art.getAttribute("aria-hidden")).toBe("true");
    expect(heading.classList.contains("has-loaded-art")).toBe(false);
    fireEvent.load(art);
    expect(heading.classList.contains("has-loaded-art")).toBe(true);
    expect(screen.getAllByRole("heading", { name: "部员手册" })).toHaveLength(1);
    fireEvent.error(art);
    expect(heading.classList.contains("has-loaded-art")).toBe(false);
    expect(heading.textContent).toBe("部员手册");
  });

  it("preserves the original heading markup when artwork is not enabled", () => {
    const { container } = render(<WindowTitleSticker titleKey="replays" as="h3" id="replay-title" enabled={false} />);
    expect(container.innerHTML).toBe('<h3 id="replay-title">对局回放</h3>');
  });

  it("does not reuse a loaded state when a nested picker changes title", () => {
    const { container, rerender } = render(<WindowTitleSticker titleKey="picker-title" as="h3" />);
    fireEvent.load(container.querySelector("img"));
    rerender(<WindowTitleSticker titleKey="picker-nameplate" as="h3" />);
    const heading = screen.getByRole("heading", { name: "选择用户名背景" });
    expect(heading.classList.contains("has-loaded-art")).toBe(false);
    expect(container.querySelector("img").getAttribute("src")).toContain("picker-nameplate.webp");
  });
});
