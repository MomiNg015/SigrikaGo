import React from "react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminActionButton } from "./adminComponents.jsx";

const actionButtonConsumers = [
  "AdminMailbox.jsx",
  "AdminRecruitmentSettings.jsx",
  "AdminSiteSettings.jsx",
  "AdminUsers.jsx"
];

describe("AdminActionButton", () => {
  it("maps semantic admin variants onto existing visual action classes", () => {
    const html = renderToStaticMarkup(
      <>
        <AdminActionButton variant="primary" type="submit">保存</AdminActionButton>
        <AdminActionButton variant="secondary" type="button">取消</AdminActionButton>
        <AdminActionButton variant="danger" type="button">删除</AdminActionButton>
      </>
    );

    expect(html).toContain("primary-action tw:inline-flex tw:items-center tw:justify-center tw:gap-2");
    expect(html).toContain("secondary-action tw:inline-flex tw:items-center tw:justify-center tw:gap-2");
    expect(html).toContain("danger-action tw:inline-flex tw:items-center tw:justify-center tw:gap-2");
  });

  it("keeps selected admin consumers off raw action class strings", () => {
    for (const fileName of actionButtonConsumers) {
      const source = readFileSync(new URL(`./${fileName}`, import.meta.url), "utf8");

      expect(source).toContain("AdminActionButton");
      expect(source).not.toContain('className="primary-action"');
      expect(source).not.toContain('className="secondary-action"');
      expect(source).not.toContain('className="danger-action"');
    }
  });
});
