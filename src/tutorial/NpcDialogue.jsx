import { TypewriterText } from "./TypewriterText.jsx";
import "../styles/room/tutorial-battle-screen.css";

export default function NpcDialogue({ bubble, revealAll = false }) {
  if (!bubble) return null;
  return (
    <section className={`tutorial-battle-dialogue ${bubble.closing ? "closing" : ""}`}
      style={bubble.palette ? { "--tutorial-npc-color": bubble.palette } : undefined}>
      {bubble.portrait && <img src={bubble.portrait} alt="" aria-hidden="true" fetchPriority="high" />}
      <div>
        <strong>{bubble.speakerName}</strong>
        <p><TypewriterText key={bubble.id} revealAll={revealAll} text={bubble.text} /></p>
      </div>
    </section>
  );
}
