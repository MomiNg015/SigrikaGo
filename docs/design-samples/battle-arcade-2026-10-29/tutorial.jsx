import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import TutorialBattleScreen from "../../../src/tutorial/TutorialBattleScreen.jsx";
import { CHARACTERS } from "../../../src/shared/characters.js";
import "../../../src/styles.css";
import "./production.css";
import "./tutorial.css";

const user = { id: "tutorial-player", username: "星炬部员" };
const audioSettings = { master: 0, bgm: 0, sfx: 0, voice: 0 };
const states = {
  dialogue: { label: "讲解 / 继续", description: "讲解结束后显示单个「继续」键，画面不压暗。", node: { type: "npc-dialogue", characterId: "denia", text: "先看看棋盘。准备好后，点击下方的「继续」，就轮到你落子啦。", nextNodeId: "move" } },
  choices: { label: "回答选项", description: "功能区变为回答列表；周围压暗，选项保持原亮度。", node: { type: "player-choice", autoContinueEnabled: true, autoContinueDelaySeconds: 0, options: [{ label: "准备好了，开始落子", nextNodeId: "move" }, { label: "再讲解一下", nextNodeId: "dialogue" }] } },
  move: { label: "等待落子", description: "操作条留空，棋盘目标落点高亮。点击亮点可继续。", node: { type: "player-move", pointId: "6,6", color: "black", nextNodeId: "done" } },
  skill: { label: "使用技能", description: "只显示当前技能键。点击后操作条留空，转为棋盘选点；当前引导没有彩虹键或次数窗。", node: { type: "player-skill", skillId: "sigrika", pointId: "6,6", color: "black", nextNodeId: "done" } },
  counting: { label: "数目操作", description: "只显示当前步骤的「数目」键，周围压暗。", node: { type: "counting-start", actor: "player", nextNodeId: "done" } },
  resign: { label: "认输操作", description: "只显示当前步骤的「认输」键，周围压暗。", node: { type: "resign", actor: "player", color: "black", nextNodeId: "done" } }
};
const requestedState = new URLSearchParams(location.search).get("state");

function TutorialPreview() {
  const [state, setState] = useState(states[requestedState] ? requestedState : "skill");
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const session = useMemo(() => ({ script: {
    title: "对弈引导功能区示意",
    startNodeId: state,
    initialBoard: { stones: [
      { pointId: "5,5", color: "black" }, { pointId: "7,5", color: "white" },
      { pointId: "5,7", color: "black" }, { pointId: "7,7", color: "white" }
    ] },
    nodes: [
      ...Object.entries(states).map(([id, { node }]) => ({
        id, playerCharacterId: "sigrika", npcCharacterId: "denia", autoContinueEnabled: false, ...node
      })),
      { id: "done", type: "npc-dialogue", characterId: "denia", text: "这一步完成啦！可以切换上方的预览状态，看看其他教学步骤。", autoContinueEnabled: false, nextNodeId: "choices" }
    ]
  } }), [state]);
  return <>
    <aside className="arcade-preview-toolbar tutorial-preview-toolbar" aria-label="引导预览控制">
      <div className="tutorial-preview-controls">
        <a href="./production.html">正式对弈</a>
        <label>引导步骤<select value={state} onChange={event => { setState(event.target.value); setNotice(""); }}>
          {Object.entries(states).map(([id, entry]) => <option key={id} value={id}>{entry.label}</option>)}
        </select></label>
        <button type="button" onClick={() => { setRevision(value => value + 1); setNotice(""); }}>重置此步</button>
      </div>
      <p>{states[state].description}</p>
      <small role="status">{notice || "当前真实引导组件 · 本地示意"}</small>
    </aside>
    <div className="app-shell player-theme-enabled theme-bright-school">
      <TutorialBattleScreen key={`${state}-${revision}`} characters={CHARACTERS} user={user}
        audioSettings={audioSettings} session={session} siteSettings={{ skillEffectsEnabled: false }}
        onToast={setNotice} onClose={() => setNotice("本地教学演示已结束，可重置或切换步骤。")}/>
    </div>
  </>;
}

createRoot(document.getElementById("root")).render(<TutorialPreview/>);
