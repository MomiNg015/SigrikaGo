import { resolveCandyPortrait } from "../../shared/candyPortraits.js";

export default function PlayerPlaque({ character, user, onOpenResume }) {
  const plaqueStyle = { "--plaque-color": character.palette ?? "#5d7fe8" };

  return (
    <section className="home-player-zone" aria-label="当前用户与在线状态">
      <div className="home-player-row tactical-id-row" style={plaqueStyle}>
        <button className="home-player-plaque tactical-id-card" type="button" onClick={onOpenResume} aria-label="打开履历">
          <span className="plaque-avatar">
            <img src={resolveCandyPortrait(character, user.itemEffects)} alt="当前出战角色" />
          </span>
          <strong>{user.username}</strong>
          <span className="plaque-stats">
            <span>{user.rank}</span>
            <span>{user.rating}分</span>
          </span>
        </button>
      </div>
    </section>
  );
}
