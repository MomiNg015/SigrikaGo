import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, Check, Package, RotateCcw, X } from 'lucide-react';
import WindowTitleSticker from '../../../src/modals/WindowTitleSticker.jsx';
import { useWarehouseListRows } from '../../../src/modals/warehouse/useWarehouseListRows.js';
import '../../../src/styles.css';
import './sample.css';

// Local quantities demonstrate the layout; no account or API data is read.
const catalog = [
  { id:'candy', name:'彩虹豆豆跳跳糖', art:'rainbow-bean-candy.webp', quantity:12, category:'消耗品', description:'给部员尝一颗，开启一段意想不到的故事。' },
  { id:'poster', name:'招募海报', art:'recruitment-poster.webp', quantity:128, category:'招募', description:'张贴一份海报，邀请新的伙伴加入社团。' },
  { id:'radio', name:'电台招募券', art:'radio-recruitment-ticket.webp', quantity:9, category:'招募', description:'通过电台发出邀请，等待远方伙伴的回应。' },
  { id:'ticket', name:'飞行雪纪念票', art:'aemeath-flight-snow-memorial-ticket.webp', quantity:1, category:'招募', description:'珍藏这张纪念票，在招募时使用。' },
  { id:'clock', name:'魔法时钟', art:'magic-clock.svg', quantity:3, category:'特殊道具', description:'留在仓库中的特殊道具。', action:false },
  { id:'coins', name:'金币袋', art:'gacha-coin-bag.svg', quantity:18, category:'消耗品', description:'打开金币袋，收下为社团准备的金币。' }
];
const params=new URLSearchParams(location.search);
function initialItems(){return params.has('empty')?[]:catalog.map((item,index)=>({...item,quantity:params.has('large')?[9999,128,99,1,1000,12][index]:item.quantity,name:params.has('long')?`${item.name}特别珍藏纪念版`:item.name}));}
function Art({item}){const [failed,setFailed]=useState('');return item?.art&&failed!==item.art?<img src={`/assets/items/${item.art}`} alt="" onError={()=>setFailed(item.art)}/>:<Package aria-hidden="true"/>;}
function Quantity({value}){return <span className="wt-quantity" aria-label={`持有 ${value}`}><span>持有</span><strong>{value}</strong></span>;}
function Confirm({item,onClose,onConfirm}){
  const ref=useRef(null);
  useEffect(()=>{ref.current.showModal();},[]);
  return <dialog ref={ref} className="wt-confirm" onCancel={event=>{event.preventDefault();onClose();}}>
    <h2>使用{item.name}</h2><p>使用 1 件，剩余 {item.quantity-1} 件。</p>
    <footer><button type="button" onClick={onClose}>取消</button><button type="button" onClick={onConfirm}>确认使用</button></footer>
  </dialog>;
}
function Sample(){
  const [items,setItems]=useState(initialItems),[selected,setSelected]=useState('candy');
  const [open,setOpen]=useState(true),[confirm,setConfirm]=useState(null),[notice,setNotice]=useState('');
  const listRef=useWarehouseListRows(open);
  const item=items.find(entry=>entry.id===selected)??items[0];
  const reset=()=>{setItems(initialItems());setSelected('candy');setNotice('');setOpen(true);};
  function use(){if(!item||item.quantity<=0)return;if(item.category==='招募'){setNotice('招募入口预览 · 当前数量保持不变');return;}setConfirm(item);}
  function consume(){setItems(current=>current.map(entry=>entry.id===confirm.id?{...entry,quantity:entry.quantity-1}:entry));setNotice(`已使用 1 件${confirm.name}`);setConfirm(null);}
  return <div className="app-shell player-theme-enabled theme-bright-school wt-scene">
    <aside className="wt-demo-note">示例库存 · 仅供视觉预览 <button type="button" onClick={reset}><RotateCcw size={13}/>重置</button></aside>
    {open?<div className="modal-backdrop warehouse-guide-backdrop"><section className="warehouse-modal warehouse-field-guide warehouse-template window-sticker-host" role="dialog" aria-modal="true" aria-label="仓库模板">
      <button className="close-button" type="button" aria-label="关闭仓库" onClick={()=>setOpen(false)}><X size={20}/></button>
      <header className="warehouse-header window-sticker-header"><WindowTitleSticker titleKey="warehouse"/></header>
      <div className="wt-body"><section ref={listRef} className="wt-list" aria-label="道具目录">
        {items.map(entry=><button type="button" key={entry.id} className="wt-card" aria-label={`选择${entry.name}，持有 ${entry.quantity}`} aria-pressed={entry.id===item?.id} onClick={()=>{setSelected(entry.id);setNotice('');}}>
          <span className="wt-art"><Art item={entry}/></span><span className="wt-card-name">{entry.name}</span><Quantity value={entry.quantity}/><Check className="wt-selected-mark" size={15} aria-hidden="true"/>
        </button>)}
        {!items.length&&<div className="wt-empty"><Package size={34}/><p>暂无道具</p></div>}
      </section>
      <section className="wt-detail" aria-label="所选道具详情">
        <div className="wt-hero"><span className="wt-orbit" aria-hidden="true"/><Art item={item}/></div>
        <div className="wt-copy"><h3>{item?.name??'暂无道具'}</h3><p>{item?.description??'获得的道具会收纳在这里。'}</p></div>
        <div className="wt-action-row"><Quantity value={item?.quantity??0}/>{item?.action!==false&&<button className="wt-use" type="button" disabled={!item||item.quantity<=0} onClick={use}>{item?.quantity===0?'已用完':item?.category==='招募'?'前去招募':'使用'}<ArrowRight size={18}/></button>}</div>
      </section></div>
    </section></div>:<button className="wt-reopen" type="button" onClick={()=>setOpen(true)}>打开仓库模板</button>}
    {notice&&<div className="wt-notice" role="status">{notice}</div>}
    {confirm&&<Confirm item={confirm} onClose={()=>setConfirm(null)} onConfirm={consume}/>}
  </div>;
}
createRoot(document.getElementById('root')).render(<Sample/>);
