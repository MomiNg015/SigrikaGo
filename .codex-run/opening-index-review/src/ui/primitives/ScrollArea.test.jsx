import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ScrollArea, { SCROLL_AREA_TW_CLASSES } from "./ScrollArea.jsx";

describe("ScrollArea", () => {
  it("centralizes the Tailwind overflow shell utility classes", () => {
    const html = renderToStaticMarkup(<ScrollArea className="admin-table-wrap">content</ScrollArea>);

    expect(SCROLL_AREA_TW_CLASSES).toEqual(["tw:max-w-full", "tw:overflow-x-auto"]);
    expect(html).toContain('class="admin-table-wrap tw:max-w-full tw:overflow-x-auto"');
    expect(html).toContain("content");
  });

  it("can render as a semantic owner element without changing the class contract", () => {
    const html = renderToStaticMarkup(
      <ScrollArea as="section" aria-label="Audit table">
        content
      </ScrollArea>
    );

    expect(html).toContain("<section");
    expect(html).toContain('aria-label="Audit table"');
    expect(html).toContain('class="tw:max-w-full tw:overflow-x-auto"');
  });
});
