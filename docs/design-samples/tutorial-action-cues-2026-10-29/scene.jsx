import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import TutorialBattleScreen from "../../../src/tutorial/TutorialBattleScreen.jsx";
import { CHARACTERS } from "../../../src/shared/characters.js";
import ActionCue from "./ActionCue.jsx";
import HomeScene from "./HomeScene.jsx";
import "../../../src/styles.css";
import "./scene.css";

const user = { id: "action-cue-preview", username: "星炬部员" };
const audioSettings = { master: 0, bgm: 0, sfx: 0, voice: 0 };
const noop = () => {};
const variants = ["focus", "halo", "hand"];
const targets = ["skill", "move", "counting", "home-handbook", "home-match", "home-mailbox", "home-details", "home-resume"];
const requested = new URLSearchParams(location.search);
function Scene() {
  const [variant, setVariant] = useState(variants.includes(requested.get("variant")) ? requested.get("variant") : "focus");
  const [target, setTarget] = useState(targets.includes(requested.get("target")) ? requested.get("target") : "skill");
  const [paused, setPaused] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const receive = event => {
      if (event.origin !== location.origin || event.source !== parent || event.data?.source !== "action-cue-review") return;
      if (variants.includes(event.data.variant)) setVariant(event.data.variant);
      if (targets.includes(event.data.target)) setTarget(event.data.target);
      setPaused(event.data.paused === true);
      if (event.data.action === "replay") setRevision(value => value + 1);
    };
    addEventListener("message", receive);
    return () => removeEventListener("message", receive);
  }, []);
  const session = useMemo(() => ({ script: {
    title: "操作引导 · 动效样板", startNodeId: target,
    initialBoard: { stones: [{ pointId: "5,5", color: "black" }, { pointId: "7,5", color: "white" }, { pointId: "5,7", color: "black" }, { pointId: "7,7", color: "white" }] },
    nodes: [
      { id: "skill", type: "player-skill", skillId: "sigrika", pointId: "6,6", color: "black", nextNodeId: "done" },
      { id: "move", type: "player-move", pointId: "6,6", color: "black", nextNodeId: "done" },
      { id: "counting", type: "counting-start", actor: "player", nextNodeId: "done" },
      { id: "done", type: "npc-dialogue", characterId: "denia", text: "对，就是这里！这一步完成啦。可以重试，或者换一种提示效果看看。", nextNodeId: target }
    ].map(node => ({ npcCharacterId: "denia", playerCharacterId: "", autoContinueEnabled: false, ...node }))
  } }), [target]);
  if (target.startsWith("home-")) return <HomeScene key={`${target}-${revision}`} target={target} variant={variant} paused={paused}/>;
  return <div className="action-cue-scene">
    <div className="app-shell player-theme-enabled theme-bright-school">
      <TutorialBattleScreen key={`${target}-${revision}`} characters={CHARACTERS} user={user} audioSettings={audioSettings} session={session} siteSettings={{ skillEffectsEnabled: false }} onToast={noop} onClose={noop}/>
    </div>
    <ActionCue key={`${target}-${revision}`} variant={variant} paused={paused}/>
  </div>;
}
createRoot(document.getElementById("root")).render(<Scene/>);
