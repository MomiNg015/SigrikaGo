import React from 'react';
import {MonitorPlay} from 'lucide-react';
import {createRoot} from 'react-dom/client';
import ProfileResumeView from '/src/modals/ProfileResumeView.jsx';
import '/src/styles.css';
const context=new URLSearchParams(location.search).get('context')||'self';
createRoot(document.getElementById('root')).render(<div className="app-shell player-theme-enabled theme-bright-school"><div style={{padding:20}}><section className={context==='self'?'house-modal resume-modal profile-dossier-modal':'user-profile-modal profile-dossier-modal'} style={{maxWidth:1200,margin:'auto'}}><ProfileResumeView context={context} user={{username:'测试部员',characterId:'sigrika',rank:'18级'}} characters={[]} mode="spark" stats={{rating:1000}} recentAction={<button className="profile-replay-button" aria-label="回放"><MonitorPlay size={18}/></button>} /></section></div></div>);
