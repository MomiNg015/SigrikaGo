import { useState } from "react";
import { TypewriterText } from "./TypewriterText.jsx";
import "../styles/room/tutorial-battle-screen.css";

export function NpcDialoguePortrait({ bubble }) {
  const [failedSource, setFailedSource] = useState("");
  // A failure belongs to the current source; revisiting it later should retry.
  if (failedSource && failedSource !== bubble.portrait) setFailedSource("");
  const failed = failedSource === bubble.portrait;
  const standard = bubble.standardPortrait && !failed;
  return (
    <span className={`tutorial-npc-portrait-slot${standard ? " standard-npc-slot" : ""}`} aria-hidden="true">
      <span className={`tutorial-npc-portrait-frame${standard ? " standard-npc-sprite" : ""}`} data-story-appearance={bubble.appearanceId || undefined}>
        <img className={standard ? "story-character-sprite" : undefined} src={failed ? bubble.fallbackPortrait : bubble.portrait} alt="" aria-hidden="true" fetchPriority="high" onError={() => {
          if (bubble.fallbackPortrait && bubble.fallbackPortrait !== bubble.portrait) setFailedSource(bubble.portrait);
        }} />
      </span>
    </span>
  );
}

export default function NpcDialogue({ bubble, revealAll = false, portraitDetached = false }) {
  if (!bubble) return null;
  return (
    <section className={`tutorial-battle-dialogue ${bubble.closing ? "closing" : ""}`}
      data-story-appearance={bubble.appearanceId || undefined}
      data-story-expression={bubble.expressionId || undefined}
      style={bubble.palette ? { "--tutorial-npc-color": bubble.palette } : undefined}>
      {bubble.portrait && (portraitDetached
        ? <span className="tutorial-npc-portrait-slot standard-npc-slot" aria-hidden="true" />
        : <NpcDialoguePortrait bubble={bubble} />)}
      <div className="tutorial-npc-copy">
        <strong>{bubble.speakerName}</strong>
        <p><TypewriterText key={bubble.id} revealAll={revealAll} text={bubble.text} /></p>
      </div>
    </section>
  );
}
