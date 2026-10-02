const INLINE_TOKEN = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))/g;
const LIST_LINE = /^\s*[-*]\s+(.+)$/;
const ORDERED_LIST_LINE = /^\s*\d+\.\s+(.+)$/;
const HEADING_LINE = /^(#{2,3})\s+(.+)$/;
const QUOTE_LINE = /^\s*>\s?(.+)$/;
const DIVIDER_LINE = /^\s*(?:-{3,}|\*{3,})\s*$/;

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
        if (block.type === "ordered-list") {
          return (
            <ol key={`ordered-list-${blockIndex}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`ordered-list-${blockIndex}-${itemIndex}`}>
                  {renderInlineMarkdownLite(item, `ol-${blockIndex}-${itemIndex}`)}
                </li>
              ))}
            </ol>
          );
        }
        if (block.type === "heading") {
          const HeadingTag = block.level === 2 ? "h4" : "h5";
          return (
            <HeadingTag key={`heading-${blockIndex}`}>
              {renderInlineMarkdownLite(block.text, `heading-${blockIndex}`)}
            </HeadingTag>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote key={`quote-${blockIndex}`}>
              <p>
                {block.lines.map((line, lineIndex) => (
                  <span key={`quote-${blockIndex}-${lineIndex}`}>
                    {renderInlineMarkdownLite(line, `quote-${blockIndex}-${lineIndex}`)}
                    {lineIndex < block.lines.length - 1 && <br />}
                  </span>
                ))}
              </p>
            </blockquote>
          );
        }
        if (block.type === "divider") return <hr key={`divider-${blockIndex}`} />;
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
  let orderedList = [];
  let quote = [];

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
  const flushOrderedList = () => {
    if (!orderedList.length) return;
    blocks.push({ type: "ordered-list", items: orderedList });
    orderedList = [];
  };
  const flushQuote = () => {
    if (!quote.length) return;
    blocks.push({ type: "quote", lines: quote });
    quote = [];
  };
  const flushOpenBlocks = () => {
    flushParagraph();
    flushList();
    flushOrderedList();
    flushQuote();
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const listMatch = line.match(LIST_LINE);
    const orderedListMatch = line.match(ORDERED_LIST_LINE);
    const headingMatch = line.match(HEADING_LINE);
    const quoteMatch = line.match(QUOTE_LINE);
    if (!line.trim()) {
      flushOpenBlocks();
      continue;
    }
    if (DIVIDER_LINE.test(line)) {
      flushOpenBlocks();
      blocks.push({ type: "divider" });
      continue;
    }
    if (headingMatch) {
      flushOpenBlocks();
      blocks.push({ type: "heading", level: headingMatch[1].length, text: headingMatch[2].trim() });
      continue;
    }
    if (listMatch) {
      flushParagraph();
      flushOrderedList();
      flushQuote();
      list.push(listMatch[1].trim());
      continue;
    }
    if (orderedListMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      orderedList.push(orderedListMatch[1].trim());
      continue;
    }
    if (quoteMatch) {
      flushParagraph();
      flushList();
      flushOrderedList();
      quote.push(quoteMatch[1].trim());
      continue;
    }
    flushList();
    flushOrderedList();
    flushQuote();
    paragraph.push(line);
  }
  flushOpenBlocks();
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
