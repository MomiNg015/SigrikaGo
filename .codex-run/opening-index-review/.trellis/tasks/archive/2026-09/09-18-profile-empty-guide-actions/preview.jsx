import React from 'react';
import {createRoot} from 'react-dom/client';
import ProfileResumeView from '/src/modals/ProfileResumeView.jsx';
import '/src/styles.css';
import '/src/styles/room/tutorial-battle-screen.css';
const guide=new URLSearchParams(location.search).has('guide');
const context=new URLSearchParams(location.search).get('context') || 'self';
createRoot(document.getElementById('root')).render(<div className="app-shell player-theme-enabled theme-bright-school"><div style={{padding:20}}>{!guide && <section className={context==='self'?'house-modal resume-modal profile-dossier-modal':'user-profile-modal profile-dossier-modal'} style={{maxWidth:850,margin:'auto'}}><ProfileResumeView context={context} user={{username:'测试部员',characterId:'sigrika',rank:'18级'}} characters={[]} mode="spark" stats={{}} /></section>}<section className="onboarding-story-actions" style={{padding:20,display:'flex',gap:20}}><button className="primary-action">继续</button><button disabled>等待中</button></section><section className="mobile-room-screen"><div id="mobile-room-panel-actions"><nav className="action-bar tutorial-action-bar tutorial-choice-actions"><button>这是较长的剧情选项，用于检查手机换行之后彩色外圈是否仍完整包围按钮。</button><button>第二个选项</button></nav><nav className="action-bar tutorial-action-bar"><button className="skill-action tutorial-highlight-action">释放技能</button></nav></div></section></div></div>);
