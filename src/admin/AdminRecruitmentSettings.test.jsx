// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { adminApi } from "../api/client.js";
import { DEFAULT_RECRUITMENT_CONFIG, RECRUITMENT_ITEM_TYPES } from "../shared/recruitment.js";
import AdminRecruitmentSettings from "./AdminRecruitmentSettings.jsx";

vi.mock("../api/client.js", () => ({ adminApi: vi.fn() }));

describe("AdminRecruitmentSettings", () => {
  afterEach(() => {
    cleanup();
    adminApi.mockReset();
  });

  it("loads, saves, and reloads the memorial-ticket copy", async () => {
    const itemType = RECRUITMENT_ITEM_TYPES.aemeathMemorialTicket;
    let storedConfig = structuredClone(DEFAULT_RECRUITMENT_CONFIG);
    adminApi.mockImplementation((_path, _token, options) => {
      if (options?.method === "PATCH") {
        storedConfig = structuredClone(options.body);
        return Promise.resolve({ config: storedConfig });
      }
      return Promise.resolve({ config: structuredClone(storedConfig) });
    });
    const onNotice = vi.fn();
    const user = userEvent.setup();
    const firstRender = render(<AdminRecruitmentSettings token="admin-token" onNotice={onNotice} />);

    const scopeField = await screen.findByLabelText("飞行雪绒纪念券招募说明");
    const resultField = screen.getByLabelText("爱弥斯招募台词");
    await user.clear(scopeField);
    await user.type(scopeField, "拿纪念券呼唤飞行雪绒");
    await user.clear(resultField);
    await user.type(resultField, "爱弥斯从舞台灯光中现身。");
    await user.click(screen.getByRole("button", { name: "保存招募配置" }));

    await waitFor(() => expect(adminApi).toHaveBeenCalledWith(
      "/recruitment-config",
      "admin-token",
      expect.objectContaining({
        method: "PATCH",
        body: expect.objectContaining({
          fixedItemTexts: {
            [itemType]: {
              scopeLabel: "拿纪念券呼唤飞行雪绒",
              resultText: "爱弥斯从舞台灯光中现身。"
            }
          }
        })
      })
    ));
    expect(onNotice).toHaveBeenCalledWith("招募配置已保存", "success");

    firstRender.unmount();
    render(<AdminRecruitmentSettings token="admin-token" onNotice={onNotice} />);
    expect(await screen.findByDisplayValue("拿纪念券呼唤飞行雪绒")).toBeTruthy();
    expect(screen.getByDisplayValue("爱弥斯从舞台灯光中现身。")).toBeTruthy();
  });
});
