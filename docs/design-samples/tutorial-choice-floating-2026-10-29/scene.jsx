import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import TutorialBattleScreen from "../../../src/tutorial/TutorialBattleScreen.jsx";
import { CHARACTERS } from "../../../src/shared/characters.js";
import "../../../src/styles.css";
import "./scene.css";

const scenarios = {
  normal: ["先连接自己的棋子，稳住局面。", "试着靠近白棋，看看能不能进攻。", "我想再观察一下。"],
  long: ["先把右侧的两颗黑棋连接起来，避免被白棋从中间切断。", "尝试向中央跳出，让这块棋有更多活动空间，也给下一步留条退路。", "白棋附近好像有机会，我想先试一试进攻，再看看对方会怎么回应。", "我还没看清这几颗棋子的关系，可以再讲一下吗？"],
  many: ["先补上右侧的断点，让两边的黑棋连在一起，再考虑接下来的进攻方向。", "我想先看清白棋剩下几口气，然后尝试从外侧压缩它的活动范围。", "向中央跳出，给自己的棋子留出空间，也避免一直被对方追着走。", "先守住角上的实地，等局面稳定以后，再想办法和外面的黑棋取得联系。", "这里也许可以使用技能，不过我想先确认技能会影响哪些棋子，以及后续的变化。", "这些选择我还没有完全理解，可以把连接、逃跑和进攻之间的区别再讲一次吗？"],
  single: ["明白了，我想试着自己判断下一步。"]
};

const user = { id: "floating-choice-preview", username: "星炬部员" };
const audioSettings = { master: 0, bgm: 0, sfx: 0, voice: 0 };
const noop = () => {};
function ChoiceSample() {
  const requested = new URLSearchParams(location.search).get("scenario");
  const [scenario, setScenario] = useState(scenarios[requested] || ["quiz", "continue"].includes(requested) ? requested : "normal");
  const [revision, setRevision] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const receive = event => {
      if (event.origin !== location.origin || event.source !== parent || event.data?.source !== "choice-review") return;
      if (scenarios[event.data.scenario]) setScenario(event.data.scenario);
      if (["scenario", "replay"].includes(event.data.action)) setRevision(value => value + 1);
      setVisible(event.data.action !== "hide");
    };
    addEventListener("message", receive);
    return () => removeEventListener("message", receive);
  }, []);
  const session = useMemo(() => ({ script: {
    title: "对弈引导 · 正式选项预览", startNodeId: "question",
    initialBoard: { stones: [{ pointId: "5,5", color: "black" }, { pointId: "7,5", color: "white" }, { pointId: "5,7", color: "black" }, { pointId: "7,7", color: "white" }] },
    nodes: [
      { id: "question", type: "npc-dialogue", characterId: "denia", npcCharacterId: "denia", playerCharacterId: "", text: "先看看棋盘。接下来，你想怎么走？", autoContinueEnabled: true, autoContinueDelaySeconds: 0,
        options: (scenario === "continue" ? ["继续"] : scenario === "quiz" ? ["连接自己的棋子", "先随便下一步"] : scenarios[scenario]).map((label, index) => ({ label, nextNodeId: scenario === "quiz" && index === 1 ? "wrong" : "done", autoContinueDelaySeconds: 0 })) },
      { id: "wrong", type: "npc-dialogue", characterId: "denia", text: "再看看连接的方向。", autoContinueEnabled: true, autoContinueDelaySeconds: 0, nextNodeId: "question" },
      { id: "done", type: "npc-dialogue", characterId: "denia", text: "这一步完成了。", autoContinueEnabled: true, autoContinueDelaySeconds: 0, options: [{ label: "继续", nextNodeId: "question", autoContinueDelaySeconds: 0 }] }
    ]
  } }), [scenario]);
  return <div className={`choice-sample-scene${visible ? "" : " sample-hide-choices"}`}>
    <div className="app-shell player-theme-enabled theme-bright-school">
      <TutorialBattleScreen key={`${scenario}-${revision}`} characters={CHARACTERS} user={user} audioSettings={audioSettings} session={session} siteSettings={{ skillEffectsEnabled: false }} onToast={noop} onClose={noop}/>
    </div>
  </div>;
}
createRoot(document.getElementById("root")).render(<ChoiceSample/>);
