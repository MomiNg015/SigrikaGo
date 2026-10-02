import React from "react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readCssWithImports } from "../styles/cssTestUtils.js";
import { AdminTableScroll } from "./adminComponents.jsx";

const tableScrollConsumers = [
  "AdminAchievements.jsx",
  "AdminAudit.jsx",
  "AdminDecorations.jsx",
  "AdminFeedback.jsx",
  "AdminGachaPools.jsx",
  "AdminMailbox.jsx",
  "AdminMusicTracks.jsx",
  "AdminReports.jsx",
  "AdminShopItems.jsx",
  "AdminUsers.jsx"
];

describe("AdminTableScroll", () => {
  it("wraps the ScrollArea primitive for admin table shells", () => {
    const html = renderToStaticMarkup(
      <AdminTableScroll>
        <table className="admin-table">
          <tbody>
            <tr><td>row</td></tr>
          </tbody>
        </table>
      </AdminTableScroll>
    );

    expect(html).toContain("admin-table-wrap tw:max-w-full tw:overflow-x-auto");
    expect(html).toContain("admin-table");
  });

  it("keeps migrated admin table shells off direct wrapper classes and raw utilities", () => {
    for (const fileName of tableScrollConsumers) {
      const source = readFileSync(new URL(`./${fileName}`, import.meta.url), "utf8");

      expect(source).toContain("AdminTableScroll");
      expect(source).not.toContain('className="admin-table-wrap"');
      expect(source).not.toContain("tw:max-w-full");
      expect(source).not.toContain("tw:overflow-x-auto");
    }
  });

  it("keeps visual table shell CSS separate from primitive-owned overflow", () => {
    const adminCss = readCssWithImports(new URL("../styles/admin.css", import.meta.url));
    const tableWrapRule = adminCss.match(/\.admin-table-wrap\s*\{[^}]+\}/)?.[0] ?? "";

    expect(tableWrapRule).toContain("margin-top: 16px");
    expect(tableWrapRule).toContain("border: 1px solid #eaddea");
    expect(tableWrapRule).toContain("border-radius: 8px");
    expect(tableWrapRule).not.toContain("overflow-x");
  });
});
