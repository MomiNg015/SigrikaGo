import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MarkdownLiteContent, { markdownLiteBlocks } from "./MarkdownLiteContent.jsx";

describe("MarkdownLiteContent", () => {
  it("renders paragraphs, preserved line breaks, lists, bold text, and http links without raw html", () => {
    const html = renderToStaticMarkup(createElement(MarkdownLiteContent, {
      value: "Hello **world**\nline two\n\n- item\n- [site](https://example.com)\n\n<script>alert(1)</script>"
    }));

    expect(html).toContain("<strong>world</strong>");
    expect(html).toContain("<br/>");
    expect(html).toContain("<ul>");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("splits markdown-lite content into stable block types", () => {
    expect(markdownLiteBlocks("A\n\n- B\n- C\n\nD")).toEqual([
      { type: "paragraph", lines: ["A"] },
      { type: "list", items: ["B", "C"] },
      { type: "paragraph", lines: ["D"] }
    ]);
  });
});
