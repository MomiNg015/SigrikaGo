// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import InformationCenterLayout from "./InformationCenterLayout.jsx";

describe("InformationCenterLayout mobile navigation", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("hides the inactive pane semantically and restores the list trigger on back", async () => {
    const user = userEvent.setup();
    const media = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };
    vi.stubGlobal("matchMedia", vi.fn(() => media));

    function Harness() {
      const [view, setView] = React.useState("list");
      return (
        <InformationCenterLayout
          title="信息中心"
          titleId="information-center-test-title"
          closeLabel="关闭"
          mobileView={view}
          onBack={view === "detail" ? () => setView("list") : undefined}
          onClose={() => {}}
          listLabel="内容列表"
          list={<button type="button" onClick={() => setView("detail")}>打开内容</button>}
          detailLabelledBy="detail-title"
          detail={<h3 id="detail-title">内容详情</h3>}
        />
      );
    }

    const React = await import("react");
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "打开内容" });
    const reservedBack = document.querySelector(".information-center-back-button");
    expect(reservedBack?.disabled).toBe(true);
    expect(reservedBack?.getAttribute("aria-hidden")).toBe("true");
    await user.click(trigger);

    const back = await screen.findByRole("button", { name: "返回列表" });
    expect(back.disabled).toBe(false);
    await waitFor(() => expect(document.querySelector(".information-center-master")?.getAttribute("aria-hidden")).toBe("true"));
    expect(document.activeElement).toBe(back);
    await user.click(back);
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(document.querySelector(".information-center-reader")?.getAttribute("aria-hidden")).toBe("true");
  });
});
