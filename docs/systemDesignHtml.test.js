import { mkdir, readFile, rm } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  readSystemDesignMarkdown,
  renderSystemDesignHtml,
  SYSTEM_DESIGN_SOURCE_PATHS
} from "../scripts/render-system-design-html.mjs";
import { appendAfter, readUtf8Document, writeUtf8Document } from "../scripts/write-utf8-doc.mjs";

const COMMON_MOJIBAKE_PATTERN = /(\u7f02\u682b\u721c|\u93c4\u5e9d\u5bd2|\u6d93\u5a5a|\u951b|\u947e|\u93b4|\u95ab)/;

describe("system design html", () => {
  it("stays generated from the markdown source set", async () => {
    const markdown = normalizeNewlines(await readSystemDesignMarkdown());
    const html = normalizeNewlines(await readFile("docs/system-design.html", "utf8"));

    expect(html).toBe(normalizeNewlines(renderSystemDesignHtml(markdown)));
  });

  it("keeps generated docs free of encoding damage", async () => {
    const markdownParts = await Promise.all(
      SYSTEM_DESIGN_SOURCE_PATHS.map((filePath) => readUtf8Document(filePath))
    );
    const html = await readUtf8Document("docs/system-design.html");

    for (const markdown of markdownParts) {
      expect(markdown).not.toContain("\uFFFD");
      expect(markdown).not.toMatch(COMMON_MOJIBAKE_PATTERN);
    }
    expect(html).not.toContain("\uFFFD");
    expect(html).not.toMatch(COMMON_MOJIBAKE_PATTERN);
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
      expect(written).not.toMatch(COMMON_MOJIBAKE_PATTERN);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

function normalizeNewlines(text) {
  return text.replace(/\r\n/g, "\n");
}
