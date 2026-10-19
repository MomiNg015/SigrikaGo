import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import SkillBanner from '/src/modals/SkillBanner.jsx';
import { CHARACTERS } from '/src/shared/characters.js';
import { AEMEATH_BANNER_DURATION_MS } from '/src/shared/aemeathSkillForm.js';
import { createScene, PRESETS } from './scene.js';
import { SampleAudio } from './audio.js';
import '/src/styles.css';
import './preview.css';

const BANNER_END=AEMEATH_BANNER_DURATION_MS/1000;
const SILENT={master:0,voice:0,bgm:0,sfx:0};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

function Preview() {
  const canvas=useRef(null),scene=useRef(null),audio=useRef(null),transport=useRef({time:0,playing:false,full:false,rate:1,generation:0});
  const [time,setTime]=useState(0),[playing,setPlaying]=useState(false),[loading,setLoading]=useState(false),[cast,setCast]=useState(null);
  const [preset,setPreset]=useState('weight'),[impact,setImpact]=useState(3.82),[offset,setOffset]=useState(0),[rate,setRate]=useState(1);
  const [music,setMusic]=useState(.55),[voice,setVoice]=useState(true),[sfx,setSfx]=useState(true),[shake,setShake]=useState(true);
  const [target,setTarget]=useState('center'),[flat,setFlat]=useState(false),[reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [message,setMessage]=useState('点击「完整播放」，试听原横幅、变身、语音与技能音乐。');
  const config=useRef({});config.current={preset,impact,offset,rate,music,voice,sfx,shake,target,flat,reduced};
  const total=impact+4.2;
  const inBanner=playing&&time<BANNER_END;

  useEffect(()=>{
    scene.current=createScene(canvas.current);audio.current=new SampleAudio();
    const resize=()=>{scene.current.resize();scene.current.render(transport.current.time,config.current);};
    const observer=new ResizeObserver(resize);observer.observe(canvas.current);resize();
    let frame=0,lastUi=0;
    const tick=stamp=>{
      const state=transport.current;
      if(state.playing){
        state.time=audio.current.time();
        if(state.time>=BANNER_END&&state.full){state.full=false;setCast(null);}
        if(state.time>=config.current.impact+4.2){state.time=config.current.impact+4.2;state.playing=false;audio.current.stop();setPlaying(false);setTime(state.time);setMessage('演出结束。可调节落剑卡点，再完整重播试听。');}
        scene.current.render(state.time,config.current);
        if(stamp-lastUi>40){setTime(state.time);lastUi=stamp;}
      }
      window.__ready=true;frame=requestAnimationFrame(tick);
    };
    const onHidden=()=>{if(document.hidden){transport.current.generation++;transport.current.playing=false;audio.current.stop();setPlaying(false);setLoading(false);setCast(null);setMessage('已暂停；回到页面后可继续落剑段或完整重播。');}};
    const media=matchMedia('(prefers-reduced-motion: reduce)'),motion=()=>setReduced(media.matches);
    media.addEventListener('change',motion);document.addEventListener('visibilitychange',onHidden);
    frame=requestAnimationFrame(tick);
    // Diagnostic/recording seam: same deterministic renderer used by the slider.
    window.__seek=t=>{transport.current.generation++;transport.current.playing=false;audio.current.stop();setPlaying(false);setLoading(false);setCast(null);transport.current.time=clamp(t,0,config.current.impact+4.2);setTime(transport.current.time);scene.current.render(transport.current.time,config.current);};
    return()=>{cancelAnimationFrame(frame);observer.disconnect();media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',onHidden);transport.current.generation++;audio.current.close();delete window.__seek;};
  },[]);

  useEffect(()=>{if(!transport.current.playing)scene.current?.render(transport.current.time,config.current);},[preset,impact,shake,target,flat,reduced]);

  async function play(full=false) {
    const generation=++transport.current.generation;
    transport.current.playing=false;audio.current.stop();setPlaying(false);setCast(null);setLoading(true);
    try {
      await audio.current.prepare();
      if(generation!==transport.current.generation)return;
      const start=full?0:clamp(transport.current.time>=total?BANNER_END:transport.current.time,BANNER_END,total);
      const actualRate=full?1:rate;
      audio.current.play(start,{...config.current,rate:actualRate,sfx:sfx?.48:0});
      transport.current={time:start,playing:true,full,rate:actualRate,generation};
      setTime(start);setPlaying(true);
      if(full)setCast({id:`voyage-sample-${generation}`,characterId:'aemeath',color:'black',effectType:'voyage-star',skillName:'远航星',bannerDurationMs:AEMEATH_BANNER_DURATION_MS,effectsEnabled:!reduced});
      setMessage(full?'完整演出 · 原横幅与原音乐从头播放':'落剑段试听 · 音乐随慢放同步变速');
    } catch(error) {if(generation===transport.current.generation)setMessage(error.message||'音频暂时不可用，请重试。');}
    finally {if(generation===transport.current.generation)setLoading(false);}
  }
  function pause(){transport.current.generation++;transport.current.playing=false;audio.current.stop();setPlaying(false);setLoading(false);setCast(null);setMessage('已暂停。拖动时间轴可以逐段检查地裂。');}
  function seek(t){pause();transport.current.time=t;setTime(t);scene.current.render(t,config.current);}
  function changeImpact(value){pause();setImpact(value);}
  function stop(){pause();seek(0);setMessage('已停止。');}
  const phase=time===0?'待机':time<BANNER_END?'原技能横幅 / 变身':time<impact-.42?'蓄势':time<impact?'巨剑下坠':time<impact+.085?'触地停顿':time<impact+.8?'地裂 / 碎石':time<impact+2.5?'尘浪 / 余震':'恢复棋局';

  return <div className="voyage-lab" data-reduced={reduced}>
    <header className="lab-header"><div><span className="eyebrow">SIGRIKAGO · 演出研究</span><h1>远航星<span>落剑，撼地。</span></h1></div><a href="https://www.bilibili.com/video/BV1qZ6yBXEVv" target="_blank" rel="noreferrer">官方战斗演示 ↗</a></header>
    <main className="lab-layout">
      <section className="stage-column" aria-label="演出预览">
        <div className="scene-wrap"><canvas ref={canvas} aria-label="巨剑刺入围棋棋盘，放射裂缝与碎石的演出样板"/><div className="stage-top"><span>爱弥斯 / 远航星</span><span>19 路 · 演出样板</span></div><div className="stage-bottom"><span>{phase}</span><span>{time.toFixed(2)} s</span></div></div>
        <div className="playback"><button className="play-primary" onClick={()=>play(true)} disabled={loading}>完整播放 · 含横幅与音乐</button><button onClick={()=>playing?pause():play()} disabled={loading||inBanner}>{playing?'暂停':'继续落剑段'}</button><button onClick={stop}>停止</button></div>
        <div className="timeline"><label htmlFor="timeline">落剑段</label><input id="timeline" type="range" min={BANNER_END} max={total} step=".01" value={Math.max(BANNER_END,time)} onChange={e=>seek(Number(e.target.value))} disabled={inBanner||loading}/><span>{total.toFixed(1)} s</span></div>
        <p className="transport-status" role="status">{loading?'正在准备原技能音频…':message}</p>
      </section>
      <aside className="director-controls">
        <h2>先看重量，再听卡点</h2>
        <p className="intro">抽象巨型光剑，触地顿帧与地块翻起。机甲留在画外。</p>
        <fieldset disabled={loading||playing}><legend>演出方向</legend><div className="presets">{Object.entries(PRESETS).map(([id,p])=><button key={id} aria-pressed={preset===id} onClick={()=>setPreset(id)}><strong>{p.label}</strong><small>{p.description}</small></button>)}</div></fieldset>
        <fieldset disabled={loading||playing}><legend>音乐卡点</legend>
          <label className="range-label" htmlFor="impact">落剑时刻 <output>{impact.toFixed(2)} s</output></label><input id="impact" type="range" min="3.7" max="6.5" step=".01" value={impact} onChange={e=>changeImpact(Number(e.target.value))}/>
          <div className="nudge"><button onClick={()=>changeImpact(clamp(impact-.05,3.7,6.5))}>提前 0.05 s</button><button onClick={()=>changeImpact(clamp(impact+.05,3.7,6.5))}>延后 0.05 s</button></div>
          <label className="range-label" htmlFor="offset">音乐起播位置 <output>{offset.toFixed(2)} s</output></label><input id="offset" type="range" min="0" max="12" step=".05" value={offset} onChange={e=>setOffset(Number(e.target.value))}/>
          <p className="field-note">当前落剑对应乐曲 {(offset+impact).toFixed(2)} 秒。完整演出保持原速；慢放仅用于落剑段。</p>
          <label className="select-row">落剑段速度<select value={rate} onChange={e=>setRate(Number(e.target.value))}><option value="1">1 × 原速</option><option value="0.5">0.5 × 慢放</option><option value="0.25">0.25 × 逐拍</option></select></label>
        </fieldset>
        <fieldset disabled={loading||playing}><legend>声音与镜头</legend>
          <label className="range-label" htmlFor="music">原技能 BGM <output>{Math.round(music*100)}%</output></label><input id="music" type="range" min="0" max="1" step=".01" value={music} onChange={e=>setMusic(Number(e.target.value))}/>
          <div className="checks"><label><input type="checkbox" checked={voice} onChange={e=>setVoice(e.target.checked)}/>原施法语音</label><label><input type="checkbox" checked={sfx} onChange={e=>setSfx(e.target.checked)}/>冲击音效</label><label><input type="checkbox" checked={shake} onChange={e=>setShake(e.target.checked)}/>镜头震动</label><label><input type="checkbox" checked={reduced} onChange={e=>setReduced(e.target.checked)}/>减少动态效果</label><label><input type="checkbox" checked={flat} onChange={e=>setFlat(e.target.checked)}/>提高俯视角</label></div>
          <label className="select-row">落点<select value={target} onChange={e=>setTarget(e.target.value)}><option value="center">棋盘中央</option><option value="edge">棋盘边缘</option></select></label>
        </fieldset>
        <p className="footnote">原横幅与变身直接复用项目组件。地裂为视觉演出样板；棋子只做受力反馈，不改变棋局。</p>
      </aside>
    </main>
    {cast&&<div className="app-shell player-theme-enabled theme-bright-school"><SkillBanner banner={cast} characters={CHARACTERS} audioSettings={SILENT}/></div>}
  </div>;
}
createRoot(document.getElementById('root')).render(<Preview/>);
