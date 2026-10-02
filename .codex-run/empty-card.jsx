import React from 'react';
import {createRoot} from 'react-dom/client';
import ProfileResumeView from '/src/modals/ProfileResumeView.jsx';
import '/src/styles.css';
const context=new URLSearchParams(location.search).get('context')||'self';
createRoot(document.getElementById('root')).render(<div className="app-shell player-theme-enabled theme-bright-school"><div style={{padding:20}}><section className={context==='self'?'house-modal resume-modal profile-dossier-modal':'user-profile-modal profile-dossier-modal'} style={{maxWidth:850,margin:'auto'}}><ProfileResumeView context={context} user={{username:'测试部员',characterId:'sigrika',rank:'18级'}} characters={[]} mode="spark" stats={{}} /></section></div></div>);
