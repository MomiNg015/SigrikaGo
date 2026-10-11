import { ArrowDownRight, ArrowUpRight, Minus, Plus, Star } from "lucide-react";
import RankProgress from "../../shared/RankProgress.jsx";
import { normalizeRankProgress, rankStarLimit, rankToStep } from "../../shared/rankProgression.js";
import { resultRankDeltaText } from "./lifecycleHelpers.js";

function RankNumber({ rank }) {
  const parts = String(rank).match(/^(\d+)(段|级)$/u);
  return <span className="result-rank-number"><b>{parts?.[1]}</b><small>{parts?.[2]}</small></span>;
}

export default function ResultRankProgress({ reward, rank, stars, rating }) {
  if (!/^(\d+)(段|级)$/u.test(String(rank ?? ""))) {
    return <><strong>段位</strong><RankProgress rank={rank} stars={stars} rating={rating} /></>;
  }
  const state = normalizeRankProgress({ rank, stars, rating });
  const capacity = rankStarLimit(state.rank);
  const rankDelta = Number(reward?.rank) || 0;
  const starDelta = Number(reward?.stars) || 0;
  const pointDelta = Number(reward?.rating) || 0;
  const delta = rankDelta || (capacity ? starDelta : pointDelta);
  const beforeStep = rankToStep(state.rank) - rankDelta;
  const beforeRank = beforeStep > 0 ? `${beforeStep}段` : `${Math.abs(beforeStep)}级`;
  const beforeStars = Math.max(0, Math.min(capacity, state.stars - starDelta));
  const beforePoints = Math.max(0, state.rating - pointDelta);
  const loss = delta < 0;
  const Direction = loss ? ArrowDownRight : ArrowUpRight;
  const changeText = resultRankDeltaText(reward);
  const label = `当前${state.rank}，${capacity ? `${state.stars}星` : `${state.rating}分`}${changeText ? `，本局${changeText}` : ""}`;
  return <span className={`result-rank-trail${loss ? " is-loss" : ""}`} role="img" aria-label={label}>
    <span className="result-rank-caption" aria-hidden="true">段位</span>
    <span className="result-rank-route" aria-hidden="true">
      {rankDelta !== 0 && beforeStep !== 0 && <span className="result-rank-before"><RankNumber rank={beforeRank} /></span>}
      {rankDelta !== 0 && <Direction />}
      <span className={rankDelta ? "result-rank-next" : "result-rank-current"}><RankNumber rank={state.rank} /></span>
      {!rankDelta && delta !== 0 && <Direction />}
    </span>
    {capacity ? <span className="result-rank-slots" data-capacity={capacity} aria-hidden="true">
      {Array.from({ length: capacity }, (_, index) => {
        const changed = !rankDelta && starDelta !== 0 && index >= Math.min(beforeStars, state.stars) && index < Math.max(beforeStars, state.stars);
        return <span key={index} className={`result-rank-slot${index < state.stars ? " is-filled" : ""}${changed ? ` is-changed ${loss ? "is-removed" : "is-added"}` : ""}`}>
          <Star strokeWidth={1.7} />
          {changed && <span className="result-star-sign">{loss ? <Minus /> : <Plus />}</span>}
        </span>;
      })}
    </span> : <span className="result-rank-points" aria-hidden="true">
      {!rankDelta && pointDelta !== 0 && <><span>{beforePoints}</span><Direction /></>}
      <b className="text-rating-value">{state.rating}<small>分</small></b>
    </span>}
  </span>;
}
