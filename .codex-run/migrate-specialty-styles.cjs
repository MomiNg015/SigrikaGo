const fs=require('fs');const postcss=require('postcss');
const statesPath='src/styles/themes/bright-school/quality-base/button-color-states.css';let state=fs.readFileSync(statesPath,'utf8');const end=state.indexOf(' {');
const root='.app-shell.player-theme-enabled.theme-bright-school.theme-bright-school:not(.is-sigrika-corrupted)';
state=state.slice(0,end)+`,\n${root} :is(.profile-dossier-modal, .profile-report-dialog, .profile-blacklist-dialog, .shop-modal, .shop-item-detail-modal, .costume-equip-prompt-modal, .recruitment-modal) button[data-button-role]:not(:where(.sigrika-duel-confirm-modal *, .sigrika-candy-duel-room *))`+state.slice(end);fs.writeFileSync(statesPath,state);
for(const path of ['src/modals/ShopModal.jsx','src/modals/shop/CostumeStorePanel.jsx']){let s=fs.readFileSync(path,'utf8').replace('<button data-button-role="tool" className="shop-switch-button','<button className="shop-switch-button');fs.writeFileSync(path,s);}
const plans=[
['quality-base/profile-dossier/action-controls.css',s=>!s.includes('svg')],
['modals/selected-actions.css',s=>/achievement-entry-action|profile-personalization-button|resume-replay-action/.test(s)],
['component-repairs/profile-actions.css',()=>true],
['commerce/shop/window-redesign.css',s=>/shop-(refresh|close)-button/.test(s)],
['commerce/shop/costume-store.css',s=>s.includes('costume-detail-purchase-button')],
['commerce/recruitment.css',s=>/recruitment-(use|fast-forward)-button/.test(s)],
];
const paint=new Set(['background','background-color','background-image','color','border-color','box-shadow','filter','text-shadow','transform','transition','opacity','outline','outline-offset','cursor']);
function strip(path,predicate){const original=fs.readFileSync(path,'utf8');const tree=postcss.parse(original);tree.walkRules(rule=>{if(!predicate(rule.selector)||/::/.test(rule.selector))return;rule.walkDecls(d=>{if(paint.has(d.prop))d.remove();else if(d.prop==='border'){const m=d.value.match(/^(\S+)\s+(solid|dashed)\s+/);if(m){d.cloneBefore({prop:'border-width',value:m[1]});d.cloneBefore({prop:'border-style',value:m[2]});d.remove();}}});if(!rule.nodes.length)rule.remove();});tree.walkAtRules(a=>{if(a.nodes&&!a.nodes.length)a.remove();});fs.writeFileSync(path,tree.toString());}
for(const [rel,pred]of plans)strip('src/styles/themes/bright-school/'+rel,pred);
strip('src/styles/mobile-adaptive/phone-recruitment.css',s=>/recruitment-use-button/.test(s));
