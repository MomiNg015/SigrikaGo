import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import EmptyState, { EMPTY_STATE_TW_CLASSES } from "./EmptyState.jsx";

describe("EmptyState", () => {
  it("centralizes the low-risk empty-state spacing and alignment utilities", () => {
    const html = renderToStaticMarkup(
      <EmptyState className="admin-table-empty">
        No rows
      </EmptyState>
    );

    expect(EMPTY_STATE_TW_CLASSES).toEqual(["tw:text-center", "tw:px-3", "tw:py-6"]);
    expect(html).toContain('class="admin-table-empty tw:text-center tw:px-3 tw:py-6"');
    expect(html).toContain("No rows");
  });

  it("can render as a table cell without losing semantic props", () => {
    const html = renderToStaticMarkup(
      <EmptyState as="td" className="admin-table-empty" colSpan={6}>
        Empty table
      </EmptyState>
    );

    expect(html).toContain("<td");
    expect(html).toContain('colSpan="6"');
    expect(html).toContain('class="admin-table-empty tw:text-center tw:px-3 tw:py-6"');
  });
});
