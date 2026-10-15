import { useState } from "react";
import { Search, ArrowUpRight, Flag, UserRound, ArrowLeft, Check } from "lucide-react";
import { characterChibiSource } from "../../../src/shared/characterChibiPortraits.js";

const members=[
  {id:"sigrika",name:"星炬同学",status:"在线",rank:"3段",tag:"准备好，再来一盘！"},
  {id:"denia",name:"泡泡汽水",status:"对局中",rank:"4段",tag:"棋盘上的胜负，还没有揭晓。"},
  {id:"aemeath",name:"放学后见",status:"在线",rank:"3段",tag:"社团的下一盘棋，等你一起。"},
  {id:"lynae",name:"薄荷晴天",status:"离线",rank:"2段",tag:"今天的棋谱，下次见面再聊。"},
  {id:"changli",name:"落子无悔",status:"离线",rank:"5段",tag:"把下一次相遇，留在棋盘上。"},
];
export default function ContactBook(){
  const [query,setQuery]=useState("");const [filter,setFilter]=useState("全部");const [selected,setSelected]=useState("sigrika");const [notice,setNotice]=useState("");const [profile,setProfile]=useState(false);const [invited,setInvited]=useState([]);
  const visible=members.filter(m=>(filter!=="在线"||m.status!=="离线")&&m.name.includes(query.trim()));
  const member=members.find(m=>m.id===selected);
  function choose(id){setSelected(id);setNotice("");setProfile(false);}
  return <div className="contact-book">
    <aside className="contact-index"><div className="contact-tools"><label className="contact-search"><Search size={17}/><input aria-label="查找部员" placeholder="查找部员" value={query} onChange={e=>setQuery(e.target.value)}/></label><nav className="contact-filter" aria-label="好友状态筛选">{["全部","在线"].map(f=><button key={f} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f}</button>)}</nav></div>
      <div className="contact-list">{visible.map(m=><button key={m.id} className={`contact-entry ${selected===m.id?"selected":""} ${m.status==="离线"?"offline":""}`} aria-pressed={selected===m.id} onClick={()=>choose(m.id)}><span className="contact-avatar"><img src={characterChibiSource(m.id,"avatar")} alt=""/></span><span className="contact-name"><b>{m.name}</b><small><i className={`presence ${m.status==="在线"?"online":m.status==="对局中"?"playing":"offline"}`}/>{m.status}</small></span><span className="contact-arrow"><ArrowUpRight size={20}/></span></button>)}{!visible.length&&<div className="contact-empty">没有找到这位部员。<button className="text-action" onClick={()=>{setQuery("");setFilter("全部");}}>查看全部好友</button></div>}</div>
      <span className="book-footnote">部员联络册</span>
    </aside>
    <article className={`contact-scene ${profile?"show-profile":""}`} key={selected}>
      <div className="contact-page-title"><span className="name-tape">{member.name}</span><span className="contact-rank">{member.rank}</span></div>
      <div className="contact-portrait"><span className="portrait-halo" aria-hidden="true"/><img src={characterChibiSource(member.id)} alt={`${member.name}的角色形象`}/><span className={`contact-stamp ${member.status==="在线"?"ready":""}`}>{member.status==="在线"?"可以约一局":member.status==="对局中"?"正在对弈":"暂时离开"}</span></div>
      <div className="contact-caption"><p>{profile ? `${member.name} · ${member.rank}` : member.tag}</p>{profile&&<span>当前角色：{({sigrika:"西格莉卡",denia:"达妮娅",aemeath:"爱弥斯",lynae:"琳奈",changli:"长离"})[member.id]}</span>}</div>
      <div className="contact-actions"><button className="game-button" onClick={()=>setProfile(!profile)}>{profile?<ArrowLeft size={17}/>:<UserRound size={17}/>} {profile?"返回联络册":"查看资料"}</button><button className="game-button primary" disabled={member.status==="离线"||invited.includes(member.id)} onClick={()=>{setInvited([...invited,member.id]);setNotice(member.status==="对局中"?"观战入口已选中 · 本地演示":"约局邀请已送出 · 本地演示");}}>{invited.includes(member.id)?<Check size={17}/>:<Flag size={17}/>} {invited.includes(member.id)?"已完成":member.status==="对局中"?"去观战":member.status==="离线"?"暂时不在线":"约一局"}</button></div>
      <p className="contact-feedback" role="status">{notice}</p>
    </article>
  </div>;
}
