const INLINE_TOKEN = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))/g;
const LIST_LINE = /^\s*[-*]\s+(.+)$/;

export default function MarkdownLiteContent({ value, className = "" }) {
  const blocks = markdownLiteBlocks(value);
  return (
    <div className={`markdown-lite-content ${className}`.trim()}>
      {blocks.map((block, blockIndex) => {
        if (block.type === "list") {
          return (
            <ul key={`list-${blockIndex}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`list-${blockIndex}-${itemIndex}`}>{renderInlineMarkdownLite(item, `li-${blockIndex}-${itemIndex}`)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={`paragraph-${blockIndex}`}>
            {block.lines.map((line, lineIndex) => (
              <span key={`line-${blockIndex}-${lineIndex}`}>
                {renderInlineMarkdownLite(line, `p-${blockIndex}-${lineIndex}`)}
                {lineIndex < block.lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function markdownLiteBlocks(value) {
  const lines = String(value ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: "paragraph", lines: paragraph });
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    blocks.push({ type: "list", items: list });
    list = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const listMatch = line.match(LIST_LINE);
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    if (listMatch) {
      flushParagraph();
      list.push(listMatch[1].trim());
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

export function renderInlineMarkdownLite(text, keyPrefix = "inline") {
  const nodes = [];
  let lastIndex = 0;
  let matchIndex = 0;
  const source = String(text ?? "");
  for (const match of source.matchAll(INLINE_TOKEN)) {
    if (match.index > lastIndex) nodes.push(source.slice(lastIndex, match.index));
    if (match[2]) {
      nodes.push(<strong key={`${keyPrefix}-strong-${matchIndex}`}>{match[2]}</strong>);
    } else if (match[3] && match[4]) {
      nodes.push(
        <a key={`${keyPrefix}-link-${matchIndex}`} href={match[4]} target="_blank" rel="noreferrer">
          {match[3]}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
    matchIndex += 1;
  }
  if (lastIndex < source.length) nodes.push(source.slice(lastIndex));
  return nodes.length ? nodes : source;
}
