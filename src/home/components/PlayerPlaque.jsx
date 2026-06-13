import { resolveCandyPortrait } from "../../shared/candyPortraits.js";
import CharacterChainBadge from "../../shared/CharacterChainBadge.jsx";
import { modeOrderedEntries } from "../../shared/gameModes.js";

export default function PlayerPlaque({ character, user, onOpenResume }) {
  const plaqueStyle = { "--plaque-color": character.palette ?? "#5d7fe8" };

  return (
    <section className="home-player-zone" aria-label="当前用户与在线状态">
      <div className="home-player-row tactical-id-row" style={plaqueStyle}>
        <button className="home-player-plaque tactical-id-card" type="button" onClick={onOpenResume} aria-label="打开履历">
          <span className="plaque-avatar">
            <img src={resolveCandyPortrait(character, user.itemEffects)} alt="当前出战角色" />
            <CharacterChainBadge user={user} characterId={character.id} />
          </span>
          <strong>{user.username}</strong>
          <span className="plaque-stats" aria-label="对弈模式段位积分">
            {modeOrderedEntries().map((mode) => {
              const stats = plaqueModeStats(user, mode.id);
              return (
                <span className={`plaque-mode-stat plaque-mode-stat-${mode.id}`} key={mode.id}>
                  <span className="plaque-mode-name">{mode.shortTitle}</span>
                  <span className="plaque-mode-rank">{stats.rank}</span>
                  <span className="plaque-mode-rating">{stats.rating}分</span>
                </span>
              );
            })}
          </span>
        </button>
      </div>
    </section>
  );
}

function plaqueModeStats(user, mode) {
  const stats = user.modeStats?.[mode];
  const fallbackRating = mode === "spark" ? user.rating : 1000;
  const rating = normalizeRating(stats?.rating ?? fallbackRating);
  return {
    rating,
    rank: stats?.rank ?? user.rank ?? "3段",
  };
}

function normalizeRating(value) {
  const rating = Number(value);
  return Number.isFinite(rating) ? rating : 1000;
}
