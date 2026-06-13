export default function RecentResultMarkers({ results = [], className = "" }) {
  const normalized = normalizeResults(results);
  return (
    <span className={`recent-result-markers ${className}`.trim()} aria-label="最近胜负">
      {normalized.length === 0 && <span className="recent-result-empty">暂无</span>}
      {normalized.map((result, index) => (
        <span className={`recent-result-marker recent-result-marker-${result}`} key={`${result}-${index}`}>
          {result === "win" ? "胜" : "负"}
        </span>
      ))}
    </span>
  );
}

function normalizeResults(results) {
  return (Array.isArray(results) ? results : [])
    .map((result) => String(result ?? "").trim().toLowerCase())
    .filter((result) => result === "win" || result === "loss");
}
