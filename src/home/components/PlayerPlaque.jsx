import { resolveCandyPortrait } from "../../shared/candyPortraits.js";
import CharacterChainBadge from "../../shared/CharacterChainBadge.jsx";
import UserIdentity from "../../shared/UserIdentity.jsx";
import { modeOrderedEntries } from "../../shared/gameModes.js";

export default function PlayerPlaque({ character, user, onOpenResume }) {
  const plaqueStyle = { "--plaque-color": character.palette ?? "#5d7fe8" };

  return (
    <section className="home-player-zone" aria-label="当前用户与在线状态">
      <div className="home-player-row tactical-id-row" style={plaqueStyle}>
        <button className="home-player-plaque tactical-id-card" data-ui-sound="none" type="button" onClick={onOpenResume} aria-label="打开履历">
          <span className="plaque-avatar">
            <img src={resolveCandyPortrait(character, user.itemEffects)} alt="当前出战角色" />
            <CharacterChainBadge user={user} characterId={character.id} />
          </span>
          <strong>
            <UserIdentity user={user} />
          </strong>
          <span className="plaque-stats" aria-label="对弈模式段位">
            {modeOrderedEntries().map((mode) => {
              const rank = plaqueModeRank(user, mode.id);
              const rankDisplay = plaqueModeRankDisplay(rank);
              return (
                <span className={`plaque-mode-stat plaque-mode-stat-${mode.id}`} key={mode.id} aria-label={`${mode.shortTitle} ${rank}`}>
                  <img className="plaque-mode-icon" src={mode.iconUrl} alt="" aria-hidden="true" decoding="async" />
                  <span className={`plaque-mode-rank plaque-mode-rank-${rankDisplay.tone}`} aria-hidden="true">{rankDisplay.value}</span>
                </span>
              );
            })}
          </span>
        </button>
      </div>
    </section>
  );
}

function plaqueModeRank(user, mode) {
  const stats = user.modeStats?.[mode];
  return stats?.rank ?? user.rank ?? "3段";
}

function plaqueModeRankDisplay(rank) {
  const rankText = String(rank ?? "3段");
  const value = rankText.match(/\d+/)?.[0] ?? rankText;
  const tone = rankText.includes("级") ? "kyu" : "dan";

  return { value, tone };
}
