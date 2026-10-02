import { TypewriterText } from "./TypewriterText.jsx";
import "../styles/room/tutorial-battle-screen.css";

export default function NpcDialogue({ bubble, revealAll = false }) {
  if (!bubble) return null;
  return (
    <section className={`tutorial-battle-dialogue ${bubble.closing ? "closing" : ""}`}
      data-story-appearance={bubble.appearanceId || undefined}
      data-story-expression={bubble.expressionId || undefined}
      style={bubble.palette ? { "--tutorial-npc-color": bubble.palette } : undefined}>
      {bubble.portrait && <img src={bubble.portrait} alt="" aria-hidden="true" fetchPriority="high" onError={(event) => {
        if (bubble.fallbackPortrait && event.currentTarget.getAttribute("src") !== bubble.fallbackPortrait) event.currentTarget.src = bubble.fallbackPortrait;
      }} />}
      <div>
        <strong>{bubble.speakerName}</strong>
        <p><TypewriterText key={bubble.id} revealAll={revealAll} text={bubble.text} /></p>
      </div>
    </section>
  );
}
