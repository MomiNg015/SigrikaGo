import { createRoot } from "react-dom/client";
import "../../../src/styles.css";
import "../../../src/styles/admin.css";
import InteractionFeedback from "../../../src/app/InteractionFeedback.jsx";
import ResumeModal from "../../../src/modals/ResumeModal.jsx";
import ActionBar from "../../../src/room/ActionBar.jsx";
import { CHARACTERS } from "../../../src/shared/characters.js";

window.feedbackActions = 0;
const action = () => window.feedbackActions++;
const user = { id: "feedback", username: "星炬同学", characterId: "sigrika", selectedCharacter: "sigrika", ownedCharacters: ["sigrika"], coins: 0 };
const surface = new URLSearchParams(location.search).get("surface");
const playerRole = "player";
createRoot(document.getElementById("root")).render(<>
  <InteractionFeedback audioSettings={{ master: 50, sfx: 50 }} />
  {surface === "resume" ? <ResumeModal user={user} characterListView={Object.values(CHARACTERS)} onClose={action} onOpenAchievements={action} onOpenPersonalization={action} /> : <>
    <div className="room-screen" style={{ padding: 30 }}>
      <ActionBar role={playerRole} mode="spark" phase="finished" isMyTurn={false} skillUses={0} onPass={action} onCountingRequest={action} onDrawRequest={action} onResign={action} setPendingSkill={action} />
    </div>
    <div className="admin-screen" style={{ padding: 30 }}><button disabled className="primary-action" data-ui-sound="none" onClick={action}>后台保存</button></div>
    <button aria-disabled="true" onClick={action} onKeyDown={action}>ARIA 禁用</button>
  </>}
</>);
