import { createRoot } from "react-dom/client";
import { useState } from "react";
import "../../../src/styles.css";
import TutorialSessionModal from "../../../src/tutorial/TutorialSessionModal.jsx";
import TutorialBattleScreen from "../../../src/tutorial/TutorialBattleScreen.jsx";
import { CHARACTERS } from "../../../src/shared/characters.js";
import { ADMIN_DEFAULT_CONFIG } from "../../../server/adminDefaultSnapshot.js";
import { applyAuthoredGuideExpressions } from "../../../src/shared/authoredGuideExpressions.js";

const record = ADMIN_DEFAULT_CONFIG.storyScripts.find((entry) => entry.key === "onboarding.default");
const query = new URLSearchParams(window.location.search);
const script = {
  key: record.key,
  startNodeId: query.get("node") || record.publishedStartNodeId,
  nodes: applyAuthoredGuideExpressions(JSON.parse(record.publishedNodesJson), record.key).map((node) => ({ ...node, text: node.text.replaceAll("{username}", "新同学") }))
};
const user = { id: "sprite-review", username: "新同学", characterId: "sigrika", ownedCharacters: Object.keys(CHARACTERS) };

function SpriteReview() {
  const [battle, setBattle] = useState(query.get("battle") === "1" ? { script, startNodeId: script.startNodeId } : null);
  const [complete, setComplete] = useState(false);
  return <div className="app-shell player-theme-enabled theme-bright-school">
    <div className="home-screen"><h1>星炬学院围棋部</h1></div>
    {complete ? <p>引导已结束</p> : battle
      ? <TutorialBattleScreen session={battle} characters={CHARACTERS} user={user} audioSettings={{ muted: true }} siteSettings={{}} previewControlsEnabled onClose={() => setComplete(true)} onComplete={() => setComplete(true)} onExitToStory={(next) => { script.startNodeId = next.script.startNodeId; setBattle(null); }} />
      : <TutorialSessionModal script={script} characters={CHARACTERS} user={user} onEnterBattle={setBattle} onClose={() => setComplete(true)} typewriterDisabled={query.get("instant") === "1"} previewControlsEnabled />}
  </div>;
}
createRoot(document.getElementById("root")).render(<SpriteReview />);
