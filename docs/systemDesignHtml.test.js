import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { renderSystemDesignHtml } from "../scripts/render-system-design-html.mjs";

describe("system design html", () => {
  it("stays generated from the markdown source", async () => {
    const markdown = await readFile("docs/system-design.md", "utf8");
    const html = await readFile("docs/system-design.html", "utf8");

    expect(html).toBe(renderSystemDesignHtml(markdown));
  });
});
