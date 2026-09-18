import React from 'react';
import {createRoot} from 'react-dom/client';
import WatchModal from '/src/modals/WatchModal.jsx';
import '/src/styles.css';
createRoot(document.getElementById('root')).render(<div className="app-shell player-theme-enabled theme-bright-school"><WatchModal token="preview" characters={{}} onJoinRoom={()=>{}} onClose={()=>{}} /></div>);

