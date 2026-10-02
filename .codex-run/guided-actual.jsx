import React from 'react';
import {createRoot} from 'react-dom/client';
import {TutorialChoiceActions} from '/src/tutorial/TutorialBattleScreen.jsx';
import {MessageCircle,Sparkles} from 'lucide-react';
import '/src/styles.css';
const choose=()=>{};
createRoot(document.getElementById('root')).render(<div className="app-shell player-theme-enabled theme-bright-school"><main style={{padding:24,width:'100%',maxWidth:780,margin:'auto'}}><section className="onboarding-story-actions" style={{marginBottom:32}}><div className="onboarding-story-options">{["你怎么知道的？", "我想再了解一下，你能不能详细说说接下来应该怎么做？", "好，我们继续吧。"].map(label=><button className="primary-action" key={label}><MessageCircle size={20} aria-hidden="true"/><span>{label}</span></button>)}</div></section><section className="mobile-room-screen" style={{width:'100%',minWidth:0}}><div id="mobile-room-panel-actions"><TutorialChoiceActions node={{id:'preview',options:[{label:'我想再了解一下，之后应该怎么做？'},{label:'原来如此，我们继续吧。'},{label:'能不能再详细介绍一下这次行动的规则，以及我们现在应该先做什么？'}]}} onChoice={choose}/><nav className="action-bar tutorial-action-bar"><button className="skill-action tutorial-highlight-action"><Sparkles size={20}/><span>释放技能</span></button></nav></div></section></main></div>);
