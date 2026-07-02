import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AdminTableEmpty } from "./adminComponents.jsx";

const tableEmptyConsumers = [
  "AdminDecorations.jsx",
  "AdminGachaPools.jsx",
  "AdminMusicTracks.jsx",
  "AdminShopItems.jsx",
  "AdminUsers.jsx"
];

describe("AdminTableEmpty", () => {
  it("wraps the EmptyState primitive for admin table cells", () => {
    const html = renderToStaticMarkup(
      <table>
        <tbody>
          <tr>
            <AdminTableEmpty colSpan={4}>暂无数据</AdminTableEmpty>
          </tr>
        </tbody>
      </table>
    );

    expect(html).toContain("<td");
    expect(html).toContain('colSpan="4"');
    expect(html).toContain("admin-table-empty tw:text-center tw:px-3 tw:py-6");
    expect(html).toContain("暂无数据");
  });

  it("keeps migrated admin table empty states off raw class strings", () => {
    for (const fileName of tableEmptyConsumers) {
      const source = readFileSync(new URL(`./${fileName}`, import.meta.url), "utf8");

      expect(source).toContain("AdminTableEmpty");
      expect(source).not.toContain('className="admin-table-empty"');
    }
  });
});
