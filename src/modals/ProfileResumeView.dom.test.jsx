// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ProfileResumeView from "./ProfileResumeView.jsx";

afterEach(cleanup);

describe("profile character record empty state", () => {
  it.each(["self", "social"])("collapses empty records and restores the table in %s profiles", (context) => {
    const props = { context, user: { username: "测试部员", characterId: "sigrika" }, characters: [], mode: "spark", stats: {} };
    const { rerender } = render(<ProfileResumeView {...props} />);
    const empty = screen.getByLabelText("角色战绩");
    expect(empty.textContent).toBe("暂无");
    expect(empty.querySelector(".recent-result-empty")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByLabelText("角色战绩列表")).toBeNull();
    rerender(<ProfileResumeView {...props} mode="standard" characterStats={[{ characterId: "sigrika", total: 2, wins: 1, losses: 1, draws: 0 }]} />);
    expect(screen.getByRole("table")).toBeTruthy();
    expect(within(screen.getByLabelText("角色战绩")).queryByText("暂无")).toBeNull();
    rerender(<ProfileResumeView {...props} />);
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByLabelText("角色战绩").textContent).toBe("暂无");
  });
});
