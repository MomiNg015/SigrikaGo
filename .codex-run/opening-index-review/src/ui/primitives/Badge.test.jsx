import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Badge, { BADGE_TW_CLASSES } from "./Badge.jsx";

describe("Badge", () => {
  it("centralizes the low-risk badge layout utility classes", () => {
    const html = renderToStaticMarkup(
      <Badge className="admin-status-pill" tone="green">
        Active
      </Badge>
    );

    expect(BADGE_TW_CLASSES).toEqual(["tw:inline-flex", "tw:items-center", "tw:justify-center"]);
    expect(html).toContain(
      'class="admin-status-pill green tw:inline-flex tw:items-center tw:justify-center"'
    );
    expect(html).toContain("Active");
  });

  it("can render as a semantic owner element without changing the class contract", () => {
    const html = renderToStaticMarkup(
      <Badge as="strong" className={["admin-status-pill", "admin-role-pill"]} tone="blue">
        Admin
      </Badge>
    );

    expect(html).toContain("<strong");
    expect(html).toContain(
      'class="admin-status-pill admin-role-pill blue tw:inline-flex tw:items-center tw:justify-center"'
    );
  });
});
