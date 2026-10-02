export function splitMatchModeRules(rulesText) {
  const parts = String(rulesText ?? "")
    .split(" · ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 3) return { primary: String(rulesText ?? ""), secondary: "" };

  return {
    primary: `${parts[0]} · ${parts[1]}`,
    secondary: parts.slice(2).join(" · ")
  };
}

export default function MatchModeRuleText({ rulesText }) {
  const { primary, secondary } = splitMatchModeRules(rulesText);

  return (
    <small className="match-mode-rules">
      <span className="match-mode-rule-line">{primary}</span>
      {secondary && <span className="match-mode-rule-line">{secondary}</span>}
    </small>
  );
}
