import React from "react";
import { createRoot } from "react-dom/client";
import { TutorialChoiceActions } from "/src/tutorial/TutorialBattleScreen.jsx";
import "/src/styles.css";
createRoot(document.getElementById("root")).render(<div className="app-shell player-theme-enabled theme-bright-school"><div className="mobile-room-screen"><div className="mobile-tab-panel" id="mobile-room-panel-actions"><TutorialChoiceActions node={{id:"height-check",options:[{label:"我明白了"},{label:"先判断左上角黑棋有没有逃跑空间，再比较右下角白棋是否已经形成完整的两个眼位。我们应该先观察周围棋子的连接情况，再决定下一手应该下在哪里。"}]}} onChoice={() => {}} /></div></div></div>);
