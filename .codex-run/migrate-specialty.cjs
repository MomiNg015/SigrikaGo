const fs = require('fs'); const {parse} = require('@babel/parser');
const files=['ResumeModal.jsx','UserProfileCard.jsx','ShopModal.jsx','RecruitmentModal.jsx','shop/ShopItemCard.jsx','shop/ShopItemDetailDialog.jsx','shop/CostumeDetailDialog.jsx','shop/CostumeStorePanel.jsx'];
for(const file of files){const path='src/modals/'+file;let s=fs.readFileSync(path,'utf8');const ast=parse(s,{sourceType:'module',plugins:['jsx']});const edits=[];
 function walk(n){if(!n||typeof n!=='object')return;if(n.type==='JSXOpeningElement'&&['button','ModalActionButton'].includes(n.name?.name)){
 const attrs=n.attributes.filter(a=>a.type==='JSXAttribute'); const cl=attrs.find(a=>a.name.name==='className');const raw=cl?s.slice(cl.start,cl.end):'';let role='';
 if(/primary-action/.test(raw))role='primary';
 if(/danger-action|profile-(blacklist|report)-button/.test(raw))role='danger';
 if(/achievement-entry-action|profile-(personalization|replay|retry|like)-button|shop-(refresh|switch)-button|recruitment-fast-forward-button/.test(raw))role='tool';
 if(/profile-friend-button/.test(raw))role='primary';
 if(/close-button/.test(raw))role='secondary';
 const source=s.slice(n.start,n.end);if(file==='RecruitmentModal.jsx'&&source.includes('onClick={onClaim}'))role='success';if(source.includes('onClick={clearResult}'))role='secondary';
 if(n.name.name==='ModalActionButton'){role=attrs.find(a=>a.name.name==='variant')?.value?.value||'primary';}
 if(file==='UserProfileCard.jsx'&&source.includes('onClick={onCancel}'))role='secondary';
 if(role&&!attrs.some(a=>a.name.name==='data-button-role'))edits.push([n.start+1+n.name.name.length,` data-button-role="${role}"`]);
 }for(const [k,v]of Object.entries(n)){if(['start','end','loc'].includes(k))continue;if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}}
 walk(ast);for(const [at,insert]of edits.reverse())s=s.slice(0,at)+insert+s.slice(at);fs.writeFileSync(path,s);console.log(file,edits.length);
}
