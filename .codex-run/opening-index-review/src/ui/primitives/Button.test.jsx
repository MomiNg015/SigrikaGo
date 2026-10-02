import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Button, { BUTTON_TW_CLASSES } from "./Button.jsx";

describe("Button", () => {
  it("centralizes low-risk flex alignment utilities while preserving visual classes", () => {
    const html = renderToStaticMarkup(
      <Button className="primary-action">
        <span>保存</span>
      </Button>
    );

    expect(BUTTON_TW_CLASSES).toEqual([
      "tw:inline-flex",
      "tw:items-center",
      "tw:justify-center",
      "tw:gap-2"
    ]);
    expect(html).toContain(
      'class="primary-action tw:inline-flex tw:items-center tw:justify-center tw:gap-2"'
    );
  });

  it("keeps native button attributes instead of inventing interaction semantics", () => {
    const html = renderToStaticMarkup(
      <Button className="secondary-action" type="submit" disabled>
        保存
      </Button>
    );

    expect(html).toContain('type="submit"');
    expect(html).toContain("disabled");
    expect(html).toContain("secondary-action");
  });
});
