import React from "react";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import AdminAudit from "./AdminAudit.jsx";
import { readCssWithImports } from "../styles/cssTestUtils.js";

const adminCss = readCssWithImports(new URL("../styles/admin.css", import.meta.url));
const auditSource = readFileSync(new URL("./AdminAudit.jsx", import.meta.url), "utf8");

describe("AdminAudit", () => {
  it("uses the Phase 2 Tailwind pilot utilities for the audit table shell", () => {
    const html = renderToStaticMarkup(
      <AdminAudit
        logs={[{
          id: "audit-1",
          createdAt: "2026-07-01T12:00:00.000Z",
          adminUserId: "admin-1",
          action: "update",
          targetType: "site-setting",
          targetId: "home-title"
        }]}
      />
    );

    expect(html).toContain("tw:max-w-full");
    expect(html).toContain("tw:overflow-x-auto");
    expect(html).not.toContain("audit-table-wrap");
    expect(html).toContain("site-setting");
    expect(html).toContain("home-title");
  });

  it("consumes the admin table scroll wrapper instead of owning raw tw utility strings", () => {
    expect(auditSource).toContain("AdminTableScroll");
    expect(auditSource).not.toContain("ScrollArea");
    expect(auditSource).not.toContain("tw:max-w-full");
    expect(auditSource).not.toContain("tw:overflow-x-auto");
  });

  it("removes the old audit wrapper CSS while keeping the audit table width contract", () => {
    expect(adminCss).not.toContain(".audit-table-wrap");
    expect(adminCss).toContain(".audit-table");
    expect(adminCss).toContain("min-width: 680px;");
  });
});
