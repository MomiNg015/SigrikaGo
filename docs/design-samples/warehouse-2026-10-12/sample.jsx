import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, ArrowRight, Check, RotateCcw, X, Smartphone, Monitor } from "lucide-react";
import "./sample.css";

const items = [
  { id: "candy", name: "彩虹豆豆跳跳糖", short: "跳跳糖", type: "消耗品", image: "rainbow-bean-candy.webp", count: 3, desc: "给部员尝一颗，开启一段意想不到的故事。", action: "选择部员" },
  { id: "poster", name: "招募海报", short: "招募海报", type: "招募", image: "recruitment-poster.webp", count: 5, desc: "贴上招新海报，迎接下一位围棋部成员。", action: "前往招募" },
  { id: "ticket", name: "电台招募券", short: "电台招募券", type: "招募", image: "radio-recruitment-ticket.webp", count: 2, desc: "通过校园电台，发出一份特别的入部邀请。", action: "前往招募" },
  { id: "memorial", name: "飞行雪纪念票", short: "飞行雪纪念票", type: "招募", image: "aemeath-flight-snow-memorial-ticket.webp", count: 1, desc: "珍藏这张纪念票，等待与爱弥斯的相遇。", action: "前往招募" },
  { id: "clock", name: "魔法时钟", short: "魔法时钟", type: "消耗品", image: "magic-clock.svg", count: 2, desc: "拨动时针，让招募的等待走得更快一些。", action: "前往招募" },
  { id: "bag", name: "金币袋", short: "金币袋", type: "消耗品", image: "gacha-coin-bag.svg", count: 1, desc: "一袋沉甸甸的金币，打开便可收入囊中。", action: "打开金币袋" },
];
const directions = [{ id: "case", name: "社团补给箱" }, { id: "book", name: "道具图鉴" }, { id: "arcade", name: "街机背包" }];
const initialCounts = () => Object.fromEntries(items.map(item => [item.id, item.count]));
const art = item => `/assets/items/${item.image}`;
const portraits = [{ id: "sigrika", name: "西格莉卡" }, { id: "denia", name: "达妮娅" }, { id: "aemeath", name: "爱弥斯" }];
const params = new URLSearchParams(window.location.search);
const embedded = params.has("embed");

function Sample() {
  const [variant, setVariant] = useState(directions.some(d => d.id === params.get("view")) ? params.get("view") : "case");
  const [phone, setPhone] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [filter, setFilter] = useState("全部");
  const [selected, setSelected] = useState("candy");
  const [counts, setCounts] = useState(initialCounts);
  const [closed, setClosed] = useState(false);
  const [notice, setNotice] = useState("");
  const [recipient, setRecipient] = useState("sigrika");
  const dialogRef = useRef(null);
  const item = items.find(i => i.id === selected);
  const visible = items.filter(i => filter === "全部" || i.type === filter);
  const index = items.indexOf(item);
  function choose(id) { setSelected(id); setNotice(""); }
  function reset() { setCounts(initialCounts()); setFilter("全部"); setSelected("candy"); setNotice(""); setClosed(false); setResetKey(k => k + 1); }
  function act() {
    if (counts[item.id] <= 0) return;
    if (item.id === "candy") { dialogRef.current.showModal(); return; }
    if (item.id === "bag") { setCounts(c => ({ ...c, bag: c.bag - 1 })); setNotice("金币袋已打开"); return; }
    setNotice("已选好道具，准备前往招募");
  }
  function give() {
    if (counts.candy <= 0) return;
    setCounts(c => ({ ...c, candy: c.candy - 1 }));
    setNotice(`${portraits.find(p => p.id === recipient).name}收到了跳跳糖`);
    dialogRef.current.close();
  }
  const tabs = <nav className="filters" aria-label="道具分类">{["全部", "消耗品", "招募"].map(f => <button key={f} aria-pressed={filter === f} onClick={() => { setFilter(f); choose(items.find(i => f === "全部" || i.type === f).id); }}>{f}</button>)}</nav>;
  const collection = <div className="collection">{visible.map(i => <button key={i.id} className={`item ${selected === i.id ? "selected" : ""}`} aria-pressed={selected === i.id} aria-label={`${i.name}，数量 ${counts[i.id]}`} onClick={() => choose(i.id)}>
    <span className="item-number" aria-hidden="true">{String(items.indexOf(i) + 1).padStart(2, "0")}</span><span className="item-art"><img src={art(i)} alt="" /></span><span className="item-label">{i.short}</span><span className="quantity">×{counts[i.id]}</span><Check className="selected-check" size={16} aria-hidden="true" />
  </button>)}</div>;
  const hero = <div className="hero-art" key={item.id}><span className="orbit" aria-hidden="true"/><span className="spark one" aria-hidden="true">✦</span><span className="spark two" aria-hidden="true">✧</span><img src={art(item)} alt={item.name}/><span className="hero-count">×{counts[item.id]}</span></div>;
  const detail = <div className="detail-copy"><span className="type-label">{item.type}</span><h2>{item.name}</h2><p>{item.desc}</p><div className="action-row"><span className="owned">持有 <b>{counts[item.id]}</b></span><button className="primary" onClick={act} disabled={counts[item.id] <= 0}>{counts[item.id] <= 0 ? "已用完" : item.action}<ArrowRight size={18}/></button></div><div className="notice" role="status">{notice}</div></div>;
  return <>
    {!embedded && <header className="toolbar"><span className="toolbar-title">仓库 <small>样板</small></span><nav aria-label="样板切换">{directions.map((d, n) => <button key={d.id} aria-pressed={variant === d.id} onClick={() => { setVariant(d.id); const url = new URL(window.location); url.searchParams.set("view", d.id); window.history.replaceState({}, "", url); }}><em>0{n + 1}</em>{d.name}</button>)}</nav><div className="tools"><button aria-label="桌面预览" aria-pressed={!phone} onClick={() => setPhone(false)}><Monitor size={19}/></button><button aria-label="手机预览" aria-pressed={phone} onClick={() => setPhone(true)}><Smartphone size={19}/></button><button aria-label="重置样板" onClick={reset}><RotateCcw size={18}/></button></div></header>}
    {phone && !embedded ? <div className="phone-stage"><iframe title="手机竖屏样板" key={`${variant}-${resetKey}`} src={`?embed=1&view=${variant}`}/></div> : <main className={`stage ${variant} ${embedded ? "embedded" : ""}`}>
      {closed ? <button className="reopen primary" onClick={() => setClosed(false)}>打开仓库<ArrowRight size={18}/></button> : <section className="warehouse" aria-label="仓库">
        <header className="warehouse-heading"><div className="heading-group"><span className="heading-mark" aria-hidden="true">✦</span><div><span className="club">星炬学院 · 围棋部</span><h1>仓库<span className="title-trail" aria-hidden="true"> / {variant === "case" ? "补给箱" : variant === "book" ? "收藏图鉴" : "随身道具"}</span></h1></div></div><button className="close" aria-label="关闭仓库" onClick={() => setClosed(true)}><X size={23}/></button></header>
        <div className="warehouse-body">
          <section className="storage">{tabs}{collection}<div className="storage-footer"><span>{visible.length} 种道具</span><span className="footer-star" aria-hidden="true">✦</span></div></section>
          <section className="inspector" aria-label="所选道具详情">{variant === "book" && <div className="book-page"><span>道具档案</span><b>{String(index + 1).padStart(2, "0")}</b></div>}{hero}{detail}{variant === "book" && <div className="page-turn"><button aria-label="上一件道具" onClick={() => {setFilter("全部");choose(items[(index + items.length - 1) % items.length].id);}}><ArrowLeft size={18}/></button><span>{index + 1} / {items.length}</span><button aria-label="下一件道具" onClick={() => {setFilter("全部");choose(items[(index + 1) % items.length].id);}}><ArrowRight size={18}/></button></div>}</section>
        </div>
        <div className="case-clasp clasp-left" aria-hidden="true"/><div className="case-clasp clasp-right" aria-hidden="true"/>
      </section>}
    </main>}
    <dialog ref={dialogRef} className="recipient-dialog"><header><h2>给谁尝一颗？</h2><button className="close" aria-label="取消选择部员" onClick={() => dialogRef.current.close()}><X size={22}/></button></header><div className="recipients">{portraits.map(p => <button key={p.id} aria-pressed={recipient === p.id} onClick={() => setRecipient(p.id)}><img src={`/assets/characters/handbook-chibi-sprites/${p.id}.webp`} alt=""/><span>{p.name}</span>{recipient === p.id && <Check size={18}/>}</button>)}</div><button className="primary" onClick={give} disabled={counts.candy <= 0}>给她跳跳糖<ArrowRight size={18}/></button></dialog>
  </>;
}

createRoot(document.getElementById("root")).render(<Sample/>);
