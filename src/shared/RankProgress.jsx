import { Star } from "lucide-react";
import { normalizeRankProgress, rankStarLimit, rankMatchStatus } from "./rankProgression.js";

export default function RankProgress({ rank, stars, rating, showStatus = false }) {
  if (!/^(\d+)(段|级)$/u.test(String(rank ?? ""))) return <span>{rank ?? "未定段"}</span>;
  const state = normalizeRankProgress({ rank, stars, rating });
  const limit = rankStarLimit(state.rank);
  const status = rankMatchStatus(state);
  const statusText = status === "promotion" ? "晋级赛" : status === "demotion" ? "降级赛" : "";
  const label = `${state.rank} ${limit ? `${state.stars}/${limit}星` : `${state.rating}分`}${statusText ? ` · ${statusText}` : ""}`;
  return <span className="rank-progress" aria-label={label} title={label}>
    <span className="rank-progress-name" aria-hidden="true">{state.rank}</span>
    {limit ? <span className="rank-progress-stars" data-capacity={limit} aria-hidden="true">
      {Array.from({ length: limit }, (_, index) => <Star key={index} className={index < state.stars ? "rank-star is-earned" : "rank-star"} />)}
    </span> : <span className="rank-progress-points text-rating-value" aria-hidden="true">{state.rating}分</span>}
    {showStatus && statusText && <small className="rank-progress-status" aria-hidden="true">{statusText}</small>}
  </span>;
}
