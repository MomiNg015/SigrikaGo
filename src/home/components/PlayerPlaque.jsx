import { resolveCandyPortrait } from "../../shared/candyPortraits.js";

export default function PlayerPlaque({ character, user }) {
  const plaqueStyle = { "--plaque-color": character.palette ?? "#5d7fe8" };

  return (
    <section className="home-player-zone" aria-label="当前用户与在线状态">
      <div className="home-player-row tactical-id-row" style={plaqueStyle}>
        <section className="home-player-plaque tactical-id-card" aria-label="当前用户铭牌">
          <div className="plaque-avatar">
            <img src={resolveCandyPortrait(character, user.itemEffects)} alt="当前出战角色" />
          </div>
          <strong>{user.username}</strong>
          <div className="plaque-stats">
            <span>{user.rank}</span>
            <span>{user.rating}分</span>
          </div>
        </section>
      </div>
    </section>
  );
}
