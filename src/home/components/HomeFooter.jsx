const LINK_PATTERN = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/gi;

export function parseFooterLine(line) {
  const source = String(line ?? "");
  const parts = [];
  let cursor = 0;

  for (const match of source.matchAll(LINK_PATTERN)) {
    if (match.index > cursor) {
      parts.push({ type: "text", text: source.slice(cursor, match.index) });
    }
    parts.push({ type: "link", text: match[1], href: match[2] });
    cursor = match.index + match[0].length;
  }

  if (cursor < source.length) {
    parts.push({ type: "text", text: source.slice(cursor) });
  }

  return parts.length ? parts : [{ type: "text", text: source }];
}

function defaultFooterText(siteTitle) {
  return `${siteTitle}\nCopyright ©KURO GAMES. ALL RIGHTS RESERVED.\n浙ICP备2026035038号`;
}

export default function HomeFooter({ footerText, siteTitle }) {
  const lines = String(footerText || defaultFooterText(siteTitle)).split(/\r?\n/);

  return (
    <footer className="home-footer-strip">
      {lines.map((line, lineIndex) => (
        <span className="home-footer-line" key={`${line}-${lineIndex}`}>
          {parseFooterLine(line).map((part, partIndex) => (
            part.type === "link"
              ? (
                <a href={part.href} key={`${part.href}-${partIndex}`} rel="noreferrer" target="_blank">
                  {part.text}
                </a>
              )
              : <span key={`${part.text}-${partIndex}`}>{part.text}</span>
          ))}
        </span>
      ))}
    </footer>
  );
}
