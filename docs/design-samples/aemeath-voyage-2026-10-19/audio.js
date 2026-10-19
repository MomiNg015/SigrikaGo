import { MUSIC_TRACKS } from '/src/shared/musicLibrary.js';
import { resolveSystemVoice, SYSTEM_VOICE_EVENTS } from '/src/shared/systemVoices.js';
import { CHARACTERS } from '/src/shared/characters.js';

export const TRACK = MUSIC_TRACKS['aemeath-voyage-star-default'];
const VOICE = resolveSystemVoice(SYSTEM_VOICE_EVENTS.skillCast, { character: CHARACTERS.aemeath, params: { effectType: 'voyage-star' } });

// The AudioContext is the transport clock. All sources, including the impact,
// share its origin; replay/seek destroys old sources rather than stacking them.
export class SampleAudio {
  context = null;
  buffers = null;
  loading = null;
  nodes = [];
  bus = null;
  origin = 0;
  startAt = 0;
  rate = 1;
  capture = null;
  captureDone = null;
  async prepare() {
    this.context ??= new AudioContext();
    await this.context.resume();
    this.loading ??= Promise.all([TRACK.playback.introSrc, TRACK.playback.loopSrc, VOICE.src || '/assets/voice/aemeath_skill_cast_voyage.ogg'].map(async url => {
      const res = await fetch(url); if (!res.ok) throw new Error(`音频加载失败：${url}`);
      return this.context.decodeAudioData(await res.arrayBuffer());
    })).catch(error => { this.loading = null; throw error; });
    this.buffers = await this.loading;
    return this.buffers;
  }
  stop() {
    if(this.capture?.state==='recording')this.capture.stop();
    for (const node of this.nodes) { try { node.stop(); } catch { /* Already ended. */ } node.disconnect(); }
    this.nodes = [];this.bus?.disconnect();this.bus=null;
  }
  play(t, options) {
    this.stop();
    const ctx = this.context; this.rate=options.rate;this.startAt=t;this.origin=ctx.currentTime+.025;
    this.bus=ctx.createGain();this.bus.gain.value=1;this.bus.connect(ctx.destination);
    if(window.__recording) {
      const destination=ctx.createMediaStreamDestination();this.bus.connect(destination);
      const chunks=[];const recorder=new MediaRecorder(destination.stream,{mimeType:'audio/webm;codecs=opus'});
      this.capture=recorder;
      this.captureDone=new Promise(resolve=>{recorder.ondataavailable=event=>chunks.push(event.data);recorder.onstop=async()=>{
        const bytes=new Uint8Array(await new Blob(chunks,{type:'audio/webm'}).arrayBuffer());
        let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
        destination.stream.getTracks().forEach(track=>track.stop());resolve(btoa(binary));
      };});
      window.__audioCapture=this.captureDone;window.__recordingStarted=performance.now();recorder.start();
      window.dispatchEvent(new Event('sample-recording-start'));
    }
    const source=(buffer,at,offset,gain,loop=false)=>{
      const node=ctx.createBufferSource();node.buffer=buffer;node.loop=loop;node.playbackRate.value=this.rate;
      const level=ctx.createGain();level.gain.value=gain;node.connect(level);level.connect(this.bus);
      node.start(this.origin+Math.max(0,at)/this.rate,offset);this.nodes.push(node);
    };
    const [intro,loop,voice]=this.buffers;
    const musicAt=Math.max(0,t+options.offset);
    const volume=options.music;
    if(musicAt<intro.duration) {source(intro,0,musicAt,volume);source(loop,intro.duration-musicAt,0,volume,true);}
    else source(loop,0,(musicAt-intro.duration)%loop.duration,volume,true);
    if(options.voice&&t<voice.duration)source(voice,0,t,.8);
    if(options.sfx&&t<=options.impact) this.impact(this.origin+(options.impact-t)/this.rate,options.sfx);
  }
  impact(at,volume) {
    const ctx=this.context;const len=ctx.sampleRate*1.3;
    const buffer=ctx.createBuffer(1,len,ctx.sampleRate), data=buffer.getChannelData(0);
    let last=0;
    for(let i=0;i<len;i++){const r=Math.sin(i*12.9898)*43758.5453;const n=(r-Math.floor(r))*2-1;last=last*.76+n*.24;data[i]=last*Math.exp(-i/ctx.sampleRate*4.5);}
    const noise=ctx.createBufferSource();noise.buffer=buffer;noise.playbackRate.value=this.rate;
    const gain=ctx.createGain();gain.gain.value=volume*.85;noise.connect(gain);gain.connect(this.bus);noise.start(at);this.nodes.push(noise);
    const osc=ctx.createOscillator(),level=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(110,at);osc.frequency.exponentialRampToValueAtTime(30,at+.38/this.rate);
    level.gain.setValueAtTime(.001,at);level.gain.linearRampToValueAtTime(volume*.7,at+.009);level.gain.exponentialRampToValueAtTime(.001,at+.75/this.rate);
    osc.connect(level);level.connect(this.bus);osc.start(at);osc.stop(at+1/this.rate);this.nodes.push(osc);
  }
  time() { return this.startAt + Math.max(0,this.context.currentTime-this.origin)*this.rate; }
  async close() {this.stop();if(this.context&&this.context.state!=='closed')await this.context.close();}
}
