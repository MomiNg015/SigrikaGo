import React from "react";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminAchievements from "./AdminAchievements.jsx";

describe("AdminAchievements", () => {
  it("renders achievement list without create or delete actions", () => {
    const html = renderToStaticMarkup(
      <AdminAchievements
        data={{
          achievements: [{
            id: "ach-1",
            key: "first-win",
            name: "初次胜利",
            content: "赢下一局游戏",
            conditionType: "wins",
            rewardAssetId: "",
            reward: null,
            enabled: true,
            achievedCount: 3,
            sortOrder: 1
          }],
          rewardAssets: []
        }}
        token="token"
        onSaved={vi.fn()}
        onNotice={vi.fn()}
      />
    );

    expect(html).toContain("成就管理");
    expect(html).toContain("初次胜利");
    expect(html).toContain("first-win");
    expect(html).toContain("admin-status-pill green tw:inline-flex tw:items-center tw:justify-center");
    expect(html).not.toContain("新增成就");
    expect(html).not.toContain("下线</button>");
  });

  it("uses the shared status pill primitive instead of raw badge class strings", () => {
    const source = readFileSync(new URL("./AdminAchievements.jsx", import.meta.url), "utf8");

    expect(source).toContain("AdminStatusPill");
    expect(source).not.toContain("className={`admin-status-pill");
  });

  it("keeps achievement writes limited to editable fields", () => {
    const source = readFileSync(new URL("./AdminAchievements.jsx", import.meta.url), "utf8");

    expect(source).toContain("function editableAchievementPayload");
    expect(source).toContain("method: \"PATCH\"");
    expect(source).not.toContain("adminApi(\"/achievements\"");
    expect(source).not.toContain("`/achievements/${achievement.id}`");
    expect(source).not.toContain("conditionParams");
    expect(source).not.toContain("setDraftAchievement({ ...draftAchievement, key");
    expect(source).not.toContain("setDraftAchievement({ ...draftAchievement, conditionType");
  });
});
