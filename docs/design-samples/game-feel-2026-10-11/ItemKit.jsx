import { useState } from "react";
import { Check, ArrowRight, X } from "lucide-react";
import { characterChibiSource } from "../../../src/shared/characterChibiPortraits.js";

const items = [
  {id:"candy",name:"彩虹豆豆跳跳糖",short:"跳跳糖",type:"消耗品",image:"rainbow-bean-candy.webp",quantity:3,description:"一颗装着彩虹的糖果。选一位部员，看看会发生什么。",action:"给部员尝尝",character:"sigrika"},
  {id:"poster",name:"招募海报",short:"招募海报",type:"招募",image:"recruitment-poster.webp",quantity:5,description:"把招新消息贴上社团公告栏，等待新部员的到来。",action:"带去招募栏",character:"sigrika"},
  {id:"ticket",name:"电台招募券",short:"电台招募券",type:"招募",image:"radio-recruitment-ticket.webp",quantity:2,description:"一张来自校园电台的特别招募券。",action:"带去招募栏",character:"denia"},
  {id:"memorial",name:"飞行雪纪念票",short:"纪念票",type:"招募",image:"aemeath-flight-snow-memorial-ticket.webp",quantity:1,description:"把这张小小的纪念票收好，下一次相遇也许就在转角。",action:"带去招募栏",character:"aemeath"},
  {id:"clock",name:"魔法时钟",short:"魔法时钟",type:"消耗品",image:"magic-clock.svg",quantity:2,description:"让等待的时间走快一些。可在招募时使用。",action:"带去招募栏",character:"denia"},
  {id:"bag",name:"金币袋",short:"金币袋",type:"消耗品",image:"gacha-coin-bag.svg",quantity:1,description:"沉甸甸的小袋子，打开来看看。",action:"打开金币袋",character:"sigrika"},
];
export default function ItemKit() {
  const [filter,setFilter]=useState("全部");
  const [selected,setSelected]=useState("candy");
  const [quantities,setQuantities]=useState(Object.fromEntries(items.map(i=>[i.id,i.quantity])));
  const [choosing,setChoosing]=useState(false);
  const [notice,setNotice]=useState("");
  const [recipient,setRecipient]=useState("sigrika");
  const item=items.find(i=>i.id===selected);
  const visible=items.filter(i=>filter==="全部"||i.type===filter);
  function pick(id){setSelected(id);setChoosing(false);setNotice("");}
  function act(){
    if(item.id==="candy"){setChoosing(true);return;}
    if(item.id==="bag"){setQuantities({...quantities,bag:0});setNotice("金币袋已打开 · 本地演示");return;}
    setNotice("已选择招募道具 · 本地演示");
  }
  function useCandy(){setQuantities({...quantities,candy:Math.max(0,quantities.candy-1)});setChoosing(false);setNotice(`${({sigrika:"西格莉卡",denia:"达妮娅",aemeath:"爱弥斯"})[recipient]}收到了糖果 · 本地演示`);}
  return <div className="item-kit">
    <div className="kit-storage"><nav className="paper-tabs" aria-label="道具分类">{["全部","消耗品","招募"].map(f=><button key={f} aria-pressed={filter===f} onClick={()=>{setFilter(f);pick(items.find(i=>f==="全部"||i.type===f).id);}}>{f}</button>)}</nav>
      <div className="item-tray">{visible.map((i,index)=><button className={`kit-item ${selected===i.id?"selected":""}`} key={i.id} onClick={()=>pick(i.id)} aria-pressed={selected===i.id} aria-label={`${i.name}，数量${quantities[i.id]}`} style={{"--tilt":`${[-7,5,-3,6,-5,3][index]}deg`}}><span className="item-drawing"><img src={`/assets/items/${i.image}`} alt=""/><span className="item-count">×{quantities[i.id]}</span></span><span className="item-name">{i.short}</span>{selected===i.id&&<Check className="item-check" size={19}/>}</button>)}</div>
      <div className="kit-lip" aria-hidden="true"><span>星炬学院 · 围棋部</span><i/><i/></div>
    </div>
    <div className="item-inspector" key={item.id}>
      <div className="item-hero"><img className="item-hero-art" src={`/assets/items/${item.image}`} alt={item.name}/><span className="item-paper-tag">{item.type}</span></div>
      <div className="item-description"><h2>{item.name}</h2><p>{item.description}</p></div>
      {choosing ? <div className="recipient-picker"><div className="recipient-heading"><b>给谁尝尝？</b><button className="icon-action" aria-label="取消选择部员" onClick={()=>setChoosing(false)}><X size={17}/></button></div><div className="recipient-options">{[["sigrika","西格莉卡"],["denia","达妮娅"],["aemeath","爱弥斯"]].map(([id,name])=><button key={id} aria-pressed={recipient===id} onClick={()=>setRecipient(id)}><img src={characterChibiSource(id,"avatar")} alt=""/><span>{name}</span></button>)}</div><button className="game-button primary" disabled={!quantities.candy} onClick={useCandy}>确认送出 <ArrowRight size={17}/></button></div> : <div className="item-bottom"><img className="item-companion" src={characterChibiSource(item.id==="candy"?recipient:item.character)} alt=""/><button className="game-button primary" disabled={!quantities[item.id]} onClick={act}>{quantities[item.id]?item.action:"已经用完啦"}<ArrowRight size={17}/></button></div>}
      <p className="item-feedback" role="status">{notice}</p>
    </div>
  </div>;
}
