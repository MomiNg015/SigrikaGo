import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play, Pause, RotateCcw } from "lucide-react";
import { characterChibiSource } from "../../../src/shared/characterChibiPortraits.js";

const tracks = [ {id:"master",label:"主音量",value:80}, {id:"bgm",label:"背景音乐",value:50}, {id:"sfx",label:"提示声",value:75}, {id:"voice",label:"角色语音",value:80} ];
const defaults = Object.fromEntries(tracks.map(t => [t.id,t.value]));

export default function AudioStation() {
  const [levels, setLevels] = useState(defaults);
  const [muted, setMuted] = useState({});
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState("");
  const audio = useRef(null);
  useEffect(() => {
    const sound = new Audio("/assets/music/recruitment-open.ogg");
    sound.onended = () => { setPlaying(false); setNotice("试听结束"); };
    audio.current = sound;
    return () => { sound.pause(); sound.onended = null; sound.src = ""; };
  }, []);
  useEffect(() => {
    if (audio.current) audio.current.volume = muted.master || muted.sfx ? 0 : levels.master * levels.sfx / 10000;
  }, [levels, muted]);
  async function preview() {
    if (!audio.current) return;
    if (playing) { audio.current.pause(); setPlaying(false); setNotice("试听已暂停"); return; }
    audio.current.currentTime = 0;
    try { await audio.current.play(); setPlaying(true); setNotice("正在试听提示声"); }
    catch { setNotice("声音暂时无法播放，请重试"); }
  }
  return <div className="audio-station">
    <div className={`audio-scene ${playing ? "is-playing" : ""}`}>
      <div className="music-caption"><span className="sound-light"/> {playing ? "正在播放" : "放学后的社团时间"}</div>
      <div className="audio-character"><span className="music-staff" aria-hidden="true"/><img src={characterChibiSource("aemeath")} alt="爱弥斯"/><span className="voice-note">{muted.master ? "嘘……安静时间。" : "这个音量，刚刚好。"}</span></div>
      <button className="radio-player" aria-label={playing ? "停止试听" : "试听提示声"} onClick={preview}><img src="/assets/characters/bright-school-radio-player.png" alt=""/><span className="radio-play">{playing ? <Pause size={18}/> : <Play size={18}/>}</span><span className="radio-copy">{playing ? "听见了吗？" : "试听提示声"}</span></button>
    </div>
    <div className="mixing-desk">
      <div className="mixer-header"><h2>声音调节</h2><button className="text-action" onClick={() => {setLevels(defaults);setMuted({});setNotice("已恢复默认音量");}}><RotateCcw size={15}/>恢复默认</button></div>
      <div className="fader-bank">{tracks.map((track, index) => <div className={`fader-channel ${muted[track.id] ? "is-muted" : ""}`} key={track.id} style={{"--channel-color":["var(--pink)","var(--blue)","var(--mint)","#fff0a6"][index]}}>
        <output htmlFor={`level-${track.id}`}>{muted[track.id] ? "—" : levels[track.id]}</output>
        <div className="fader-well" style={{"--level":`${levels[track.id]}%`}}><span className="fader-ticks" aria-hidden="true"/><input id={`level-${track.id}`} type="range" aria-label={track.label} min="0" max="100" value={levels[track.id]} onChange={e => {setLevels({...levels,[track.id]:Number(e.target.value)});setMuted({...muted,[track.id]:false});setNotice("");}}/></div>
        <label htmlFor={`level-${track.id}`}>{track.label}</label>
        <button className="mute-key" aria-label={`${track.label}${muted[track.id] ? "取消静音" : "静音"}`} aria-pressed={Boolean(muted[track.id])} onClick={() => setMuted({...muted,[track.id]:!muted[track.id]})}>{muted[track.id] ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button>
      </div>)}</div>
      <footer className="mixer-footer"><span role="status">{notice || "拖动拨杆，让声音停在喜欢的位置。"}</span><span className="pencil-mark" aria-hidden="true">♪</span></footer>
    </div>
  </div>;
}
