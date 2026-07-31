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

  it("renders article headings, numbered lists, emphasis quotes, and dividers safely", () => {
    const value = [
      "## 调整内容",
      "1. 第一项",
      "2. 第二项",
      "",
      "> **本次重点**",
      "> 阅读结构保持一致。",
      "",
      "---",
      "",
      "### 补充说明"
    ].join("\n");
    const html = renderToStaticMarkup(createElement(MarkdownLiteContent, { value }));

    expect(markdownLiteBlocks(value)).toEqual([
      { type: "heading", level: 2, text: "调整内容" },
      { type: "ordered-list", items: ["第一项", "第二项"] },
      { type: "quote", lines: ["**本次重点**", "阅读结构保持一致。"] },
      { type: "divider" },
      { type: "heading", level: 3, text: "补充说明" }
    ]);
    expect(html).toContain("<h4>调整内容</h4>");
    expect(html).toContain("<ol>");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<strong>本次重点</strong>");
    expect(html).toContain("<hr/>");
    expect(html).toContain("<h5>补充说明</h5>");
  });
});
