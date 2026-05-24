import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const sourcePath = new URL("../docs/system-design.md", import.meta.url);
const outputPath = new URL("../docs/system-design.html", import.meta.url);

if (isDirectRun()) {
  const markdown = await readFile(sourcePath, "utf8");
  await writeFile(outputPath, renderSystemDesignHtml(markdown), "utf8");
}

export function renderSystemDesignHtml(markdown) {
  const body = renderMarkdown(markdown);

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SigrikaGo System Design</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0 auto;
    max-width: 980px;
    color: #202124;
    background: #fff;
    font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", Arial, sans-serif;
    font-size: 14px;
    line-height: 1.68;
    padding: 32px 24px 48px;
  }
  h1 { font-size: 30px; margin: 0 0 18px; }
  h2 { font-size: 21px; margin: 30px 0 12px; padding-bottom: 5px; border-bottom: 1px solid #dde3ea; }
  h3 { font-size: 17px; margin: 20px 0 8px; }
  h4 { font-size: 15px; margin: 16px 0 6px; }
  p { margin: 8px 0; }
  ul, ol { padding-left: 24px; margin: 8px 0; }
  li { margin: 4px 0; }
  code {
    font-family: Consolas, "Courier New", monospace;
    background: #f4f6f8;
    padding: 1px 4px;
    border-radius: 4px;
    font-size: 0.92em;
  }
  pre {
    background: #f6f8fa;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
    page-break-inside: avoid;
  }
  pre code { background: transparent; padding: 0; }
  a { color: #315fce; text-decoration: none; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; }
  blockquote { margin: 10px 0; padding-left: 14px; border-left: 3px solid #d7dce3; color: #555; }
  @media print {
    body { max-width: none; padding: 0; }
    a { color: inherit; }
  }
</style>
</head>
<body>
${body}
</body>
</html>
`;
}

function renderMarkdown(input) {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  const listStack = [];
  let paragraph = [];
  let inCode = false;
  let codeLines = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const closeListsTo = (targetDepth = -1) => {
    while (listStack.length && listStack[listStack.length - 1] >= targetDepth) {
      html.push("</ul>");
      listStack.pop();
    }
  };

  const closeAll = () => {
    flushParagraph();
    closeListsTo(0);
  };

  for (const line of lines) {
    const codeFence = line.match(/^```/);
    if (codeFence) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        closeAll();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeListsTo(0);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeAll();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const blockquote = line.match(/^>\s+(.+)$/);
    if (blockquote) {
      closeAll();
      html.push(`<blockquote>${renderInline(blockquote[1])}</blockquote>`);
      continue;
    }

    const listItem = line.match(/^(\s*)-\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      const depth = Math.floor(listItem[1].length / 2);
      while (listStack.length && listStack[listStack.length - 1] >= depth) {
        html.push("</ul>");
        listStack.pop();
      }
      html.push("<ul>");
      listStack.push(depth);
      html.push(`<li>${renderInline(listItem[2])}</li>`);
      continue;
    }

    closeListsTo(0);
    paragraph.push(line.trim());
  }

  if (inCode) {
    html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }
  closeAll();
  return html.join("\n");
}

function renderInline(text) {
  const placeholders = [];
  let escaped = escapeHtml(text);

  escaped = escaped.replace(/`([^`]+)`/g, (_, code) => {
    const token = `\u0000${placeholders.length}\u0000`;
    placeholders.push(`<code>${code}</code>`);
    return token;
  });

  escaped = escaped
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  return placeholders.reduce((result, value, index) => result.replace(`\u0000${index}\u0000`, value), escaped);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isDirectRun() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}
