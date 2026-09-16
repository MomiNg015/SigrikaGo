import { characterPortraitImageProps } from "../../shared/characterPortraits.js";

export default function PlayerPlaque({ character, user, onOpenResume, disabled = false }) {
  return (
    <section className="home-player-zone home-student-id-zone" aria-label="当前用户学生证">
      <span className="home-student-id-pin" aria-hidden="true" />
      <button className="home-student-id" data-ui-sound="none" type="button" onClick={onOpenResume} aria-label="打开履历" disabled={disabled}>
        <picture>
          <source srcSet="/assets/home/student-id-hanging.webp" type="image/webp" />
          <img className="home-student-id-shell" src="/assets/home/student-id-hanging.png" alt="" aria-hidden="true" />
        </picture>
        <span className="home-student-id-portrait">
          <img {...characterPortraitImageProps(character, { itemEffects: user.itemEffects, user })} alt="当前出战角色" />
        </span>
        <span className="home-student-id-name" data-long-name={Array.from(user.username ?? "").length > 8 || undefined} title={user.username}>{user.username}</span>
      </button>
    </section>
  );
}
