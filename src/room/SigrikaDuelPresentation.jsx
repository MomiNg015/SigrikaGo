import { createPortal } from "react-dom";
import { SIGRIKA_CORRUPTED_PORTRAIT_ASSET } from "../shared/characterPortraitAssetCatalog.js";

export default function SigrikaDuelPresentation({ presentation }) {
  const content = presentationContent(presentation);
  if (!content) return null;
  if (typeof document === "undefined") return content;
  const portalTarget = document.querySelector(".app-shell.is-sigrika-corrupted");
  return portalTarget ? createPortal(content, portalTarget) : content;
}

function presentationContent(presentation) {
  if (presentation?.type === "dialogue" && presentation.text) {
    return (
      <section className="sigrika-duel-presentation sigrika-duel-dialogue" role="status" aria-live="assertive">
        <img src={SIGRIKA_CORRUPTED_PORTRAIT_ASSET.url} alt="" aria-hidden="true" fetchPriority="high" />
        <div className="sigrika-duel-dialogue-copy">
          <strong>{presentation.speaker ?? "西格莉卡？"}</strong>
          <p>{presentation.text}</p>
        </div>
      </section>
    );
  }
  if (presentation?.type === "skill" && presentation.skillName) {
    return (
      <div className="skill-burst sigrika-duel-presentation sigrika-duel-skill-burst" role="status" aria-live="assertive">
        <span className="sigrika-duel-skill-portrait" aria-hidden="true">
          <img src={SIGRIKA_CORRUPTED_PORTRAIT_ASSET.url} alt="" />
        </span>
        <div className="sigrika-duel-skill-copy">
          <span>{presentation.speaker ?? "西格莉卡？"}发动技能</span>
          <strong>{presentation.skillName}</strong>
        </div>
      </div>
    );
  }
  return null;
}
