import { mkdir, readFile, rm } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { renderSystemDesignHtml } from "../scripts/render-system-design-html.mjs";
import { appendAfter, readUtf8Document, writeUtf8Document } from "../scripts/write-utf8-doc.mjs";

describe("system design html", () => {
  it("stays generated from the markdown source", async () => {
    const markdown = normalizeNewlines(await readFile("docs/system-design.md", "utf8"));
    const html = normalizeNewlines(await readFile("docs/system-design.html", "utf8"));

    expect(html).toBe(normalizeNewlines(renderSystemDesignHtml(markdown)));
  });

  it("keeps generated docs free of replacement-character encoding damage", async () => {
    const markdown = await readUtf8Document("docs/system-design.md");
    const html = await readUtf8Document("docs/system-design.html");

    expect(markdown).not.toContain("\uFFFD");
    expect(html).not.toContain("\uFFFD");
  });

  it("uses the UTF-8 doc writer for Chinese-safe document updates", async () => {
    const tempDir = new URL("../.tmp-doc-tests/", import.meta.url);
    const tempFile = new URL("utf8-doc.md", tempDir);

    await mkdir(tempDir, { recursive: true });
    try {
      await writeUtf8Document(tempFile, "# Temp\n");
      await appendAfter(tempFile, "", "## 编码测试\n\n- 明亮校园主题说明：中文不会被 PowerShell 重写成乱码。\n");
      const written = await readUtf8Document(tempFile);

      expect(written).toContain("明亮校园主题说明");
      expect(written).not.toContain("\uFFFD");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, "\n");
}
