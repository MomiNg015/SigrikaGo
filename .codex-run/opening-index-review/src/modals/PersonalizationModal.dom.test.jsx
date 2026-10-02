// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import PersonalizationModal from "./PersonalizationModal.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("distinguishes saved equipment from an unsaved preview and only persists on save", async () => {
  api.mockResolvedValueOnce({ assets: [{ id: "title-1", type: "title", name: "围棋部新星" }], equipment: {}, equipmentAssets: {} });
  render(<PersonalizationModal token="test" user={{ username: "部员" }} onClose={vi.fn()} />);
  await waitFor(() => expect(api).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getAllByText("样式选择")[0]);
  const picker = screen.getByRole("dialog", { name: "选择称号" });
  expect(within(picker).getByRole("button", { name: /默认\s*已装备/ }).getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(await within(picker).findByRole("button", { name: "围棋部新星" }));
  expect(screen.getByRole("img", { name: "试穿中" })).toBeTruthy();
  expect(api).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getAllByText("样式选择")[0]);
  const previewPicker = screen.getByRole("dialog", { name: "选择称号" });
  expect(within(previewPicker).getByRole("button", { name: /围棋部新星\s*试穿中/ }).getAttribute("aria-pressed")).toBe("true");
  expect(within(previewPicker).getByRole("button", { name: /默认\s*已装备/ }).getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(screen.getByRole("button", { name: "关闭样式选择窗口" }));
  api.mockResolvedValueOnce({ equipment: { titleAssetId: "title-1" }, equipmentAssets: {} });
  fireEvent.click(screen.getByRole("button", { name: "保存" }));
  await waitFor(() => expect(screen.queryByRole("img", { name: "试穿中" })).toBeNull());
  expect(api).toHaveBeenLastCalledWith("/api/me/achievement-equipment", expect.objectContaining({ method: "PATCH", body: expect.objectContaining({ titleAssetId: "title-1" }) }));
});
