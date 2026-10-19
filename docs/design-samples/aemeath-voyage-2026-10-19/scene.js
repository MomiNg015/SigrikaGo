// Deterministic, dependency-free staging study. World units are independent of viewport.
const TAU = Math.PI * 2;
const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const mix = (a, b, t) => a + (b - a) * t;
const out = t => 1 - (1 - clamp(t)) ** 3;
const seed = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const stones = [[-6,-5,0],[-5,-5,1],[-5,-4,0],[-4,-5,1],[-4,-3,0],[-3,-3,1],[-4,-2,1],[-3,-1,0],[-2,-2,0],[-1,-2,1],[0,-2,0],[1,-1,1],[2,-2,0],[3,-2,1],[3,-3,0],[4,-4,1],[5,-4,0],[5,-3,1],[-5,3,0],[-4,3,1],[-3,3,0],[-3,4,1],[-2,4,0],[0,3,1],[1,3,0],[2,4,1],[3,4,0],[3,5,1],[4,5,0],[5,5,1],[5,4,0],[6,3,1]];
const cracks = Array.from({ length: 13 }, (_, i) => {
  const angle = i * TAU / 13 + seed(i) * .22;
  return Array.from({ length: 9 }, (_, j) => {
    const a = angle + (seed(i * 50 + j) - .5) * .25;
    const radius = j * (27 + seed(i + 60) * 11);
    return [Math.cos(a) * radius, Math.sin(a) * radius];
  });
});
const debris = Array.from({ length: 100 }, (_, i) => ({
  a: seed(i + 12) * TAU, speed: 70 + seed(i + 65) * 230,
  height: 75 + seed(i + 95) * 200, size: 2 + seed(i + 31) ** 2 * 17,
  spin: (seed(i + 75) - .5) * 8, delay: seed(i + 198) * .16,
}));
export const PRESETS = {
  weight: { label: '重剑撼地', description: '停顿更重 · 地块翻起 · 尘浪分层', power: 1, energy: .7, hold: .085, dust: 1 },
  burst: { label: '星辉爆裂', description: '裂隙更亮 · 能量喷发 · 更强冲击', power: 1.18, energy: 1.4, hold: .065, dust: .68 },
  readable: { label: '对局收敛', description: '缩小冲击范围 · 保留棋局可读性', power: .65, energy: .5, hold: .065, dust: .5 },
};

export function createScene(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let w = 1000, h = 760, scale = 1, ox = 0, oy = 0;
  let lean = .64;
  const smoke = document.createElement('canvas'); smoke.width=160;smoke.height=160;
  const sc=smoke.getContext('2d');
  for(let i=0;i<140;i++) {
    const a=seed(i+330)*TAU,r=seed(i+440)*49,x=80+Math.cos(a)*r,y=80+Math.sin(a)*r;
    const size=8+seed(i+550)*25,g=sc.createRadialGradient(x,y,0,x,y,size);
    g.addColorStop(0,`rgba(183,170,184,${.1+seed(i+660)*.2})`);g.addColorStop(1,'rgba(183,170,184,0)');sc.fillStyle=g;sc.fillRect(x-size,y-size,size*2,size*2);
  }
  const project = (x, z, y = 0) => [500 + x * .97 + z * .13, 470 + z * lean - y];
  const path = pts => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); };
  const poly = (pts, fill, stroke, width = 1) => { path(pts); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); } };
  const line = (pts, color, width = 1) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); };
  const glow = (x, y, r, color, alpha, ratio = 1) => {
    if (r <= 0 || alpha <= 0) return;
    ctx.save(); ctx.translate(x,y); ctx.scale(1,ratio); ctx.globalAlpha *= alpha;
    const g = ctx.createRadialGradient(0,0,0,0,0,r); g.addColorStop(0,color); g.addColorStop(.28,color); g.addColorStop(1,'transparent');
    ctx.fillStyle = g; ctx.fillRect(-r,-r,r*2,r*2); ctx.restore();
  };

  function board(time, impact, p, tx, tz, reduced) {
    const hit = Math.max(0, time - impact);
    const fade = clamp((hit - 2.4) / 1.3);
    const fracture = time >= impact ? out(hit * 4) * (1 - fade) : 0;
    const corners = [[-330,-330],[330,-330],[330,330],[-330,330]];
    poly(corners.map(([x,z]) => project(x,z,-15)), '#4c4045');
    poly([project(-330,330),project(330,330),project(330,330,-15),project(-330,330,-15)], '#675457', '#998280');
    const bg=ctx.createLinearGradient(0,220,0,700);bg.addColorStop(0,'#d5c5ac');bg.addColorStop(.5,'#bba98f');bg.addColorStop(1,'#9a856f');
    poly(corners.map(([x,z])=>project(x,z)),bg,'#e4d7c1',2);
    // Fine grain lives on the board plane, never on a full-screen white cover.
    ctx.save();path(corners.map(([x,z])=>project(x,z)));ctx.clip();
    for(let i=0;i<100;i++) { const z=-330+i*6.7;line([project(-340,z),project(340,z+Math.sin(i)*2)],`rgba(71,50,44,${.015+seed(i)*.045})`); }
    for(let i=-9;i<=9;i++) {
      line([project(i*33,-297),project(i*33,297)],'rgba(47,44,46,.52)',.85);
      line([project(-297,i*33),project(297,i*33)],'rgba(47,44,46,.52)',.85);
    }
    for(const x of [-6,0,6]) for(const z of [-6,0,6]) {const pt=project(x*33,z*33);ctx.beginPath();ctx.ellipse(...pt,3.5,2.4,0,0,TAU);ctx.fillStyle='#51464a';ctx.fill();}
    if (fracture) {
      const c=project(tx,tz);
      glow(...c,260*p.power,'#281826',.65*fracture,.65);
      ctx.globalAlpha=fracture;
      for(let i=0;i<cracks.length;i++) {
        const pts=cracks[i].map(([x,z])=>project(tx+x*p.power,tz+z*p.power));
        const end=clamp(hit*3.5)*8;const len=Math.floor(end);const partial=pts.slice(0,len+1);
        if(len<8)partial.push([mix(pts[len][0],pts[len+1][0],end-len),mix(pts[len][1],pts[len+1][1],end-len)]);
        const left=partial.map((pt,j)=>[pt[0]-(6-j*.55)*(1+seed(i*11+j)),pt[1]-1]);
        const right=[...partial].reverse().map((pt,j)=>[pt[0]+(1+j*.55),pt[1]+2]);
        poly([...left,...right],'#201a28');
        ctx.shadowBlur=9*p.energy;ctx.shadowColor='#e4a6ff';
        line(partial,`rgba(198,143,228,${.55*p.energy})`,2);
        line(partial,`rgba(248,211,255,${.64*p.energy})`,.7);
        ctx.shadowBlur=0;
        if (len>4) {const a=pts[4];line([a,[a[0]+(i%2?17:-23),a[1]+14], [a[0]+(i%2?30:-35),a[1]+38]],'#40303f',2);}
      }
      // Recessed impact core and a broken rim; no uniform decorative circle.
      const core=Array.from({length:24},(_,i)=>{const a=i*TAU/24;const r=35+seed(i+70)*17;return project(tx+Math.cos(a)*r,tz+Math.sin(a)*r);});
      poly(core,'#181523','#e2a2d5',2);
      ctx.globalAlpha=1;
    }
    for(const [x,z,white] of stones) {
      const dist=Math.hypot(x*33-tx,z*33-tz);
      const lift=reduced?0:Math.sin(clamp((hit-dist/900)*2.4)*Math.PI)*Math.max(0,1-dist/350)*24*p.power;
      const [sx,sy]=project(x*33,z*33,lift);
      ctx.globalAlpha=time>=impact && dist<65 ? 1-fracture : 1;
      ctx.beginPath();ctx.ellipse(sx+2,sy+5+lift,14,9,0,0,TAU);ctx.fillStyle='rgba(20,17,24,.28)';ctx.fill();
      const g=ctx.createRadialGradient(sx-5,sy-5,1,sx,sy,15);g.addColorStop(0,white?'#ffffff':'#636775');g.addColorStop(.5,white?'#e9e8e2':'#242b34');g.addColorStop(1,white?'#a9acb7':'#0b0e17');
      ctx.beginPath();ctx.ellipse(sx,sy,13.4,10.6,0,0,TAU);ctx.fillStyle=g;ctx.fill();
      ctx.globalAlpha=1;
    }
    ctx.restore();
  }

  function sword(t, hitAt, p, tx, tz) {
    if(t<hitAt-.65 || t>hitAt+3.25) return;
    const fall=clamp((t-(hitAt-.42))/.42)**3;
    const hit=t-hitAt;
    const fade=1-clamp((hit-1.65)/1.15);
    const altitude=hit<0?mix(820,0,fall):-Math.min(28,hit*160);
    const [x,base]=project(tx,tz,altitude);
    ctx.save();ctx.translate(x,base);ctx.rotate(-.035);
    ctx.globalAlpha=fade*clamp((t-hitAt+.65)/.16);
    // Deliberately abstract: a colossal tapered light blade, no invented weapon hardware.
    // The upper shaft leaves the frame, implying the absent giant's scale.
    const length=750,half=47;
    glow(0,-260,155,'#9984e4',.25*p.energy,2.2);
    glow(0,-260,80,'#cdefff',.38,3.2);
    const body=ctx.createLinearGradient(-half,0,half,0);
    body.addColorStop(0,'rgba(125,215,255,.1)');
    body.addColorStop(.08,'rgba(163,237,255,.86)');
    body.addColorStop(.25,'rgba(201,233,255,.24)');
    body.addColorStop(.43,'rgba(226,239,255,.5)');
    body.addColorStop(.5,'rgba(255,255,255,.95)');
    body.addColorStop(.57,'rgba(224,211,255,.48)');
    body.addColorStop(.82,'rgba(207,154,255,.24)');
    body.addColorStop(.94,'rgba(250,194,255,.9)');
    body.addColorStop(1,'rgba(193,125,255,.12)');
    poly([[0,12],[-half,-115],[-half*1.1,-length],[half*1.1,-length],[half,-115]],body);
    ctx.shadowBlur=16;ctx.shadowColor='#c2ddff';
    line([[0,8],[-half+5,-117],[-half*1.1+5,-length]],'#c7f0ff',2.2);
    ctx.shadowColor='#d4b3ff';
    line([[0,8],[half-5,-117],[half*1.1-5,-length]],'#edc9ff',2.2);
    ctx.shadowBlur=8;ctx.shadowColor='#ffffff';
    line([[0,-6],[0,-length]],'rgba(255,255,255,.85)',2.7);ctx.shadowBlur=0;
    if(hit<.16) {
      for(let i=0;i<12;i++) {
        const side=i%2?1:-1,px=side*(60+seed(i)*85);
        const tail=ctx.createLinearGradient(0,-length,0,-40);
        tail.addColorStop(0,'transparent');tail.addColorStop(.72,'rgba(203,201,255,.35)');tail.addColorStop(1,'transparent');
        line([[px,-length],[px*.75,-220],[px*.5,-40]],tail,1+seed(i)*3);
      }
    }
    if(hit>0)glow(0,-15,65,'#e8ddff',Math.max(0,.7-hit*.5),.65);
    if(fade<1) {
      for(let i=0;i<35;i++) {const px=(seed(i+30)-.5)*110,py=-seed(i+50)*650-(1-fade)*90;ctx.fillStyle=i%2?'#bfeaff':'#edc7ff';ctx.fillRect(px,py,1.6,4+seed(i)*8);}
    }
    ctx.restore();
  }

  function shards(hit,p,tx,tz,front,reduced) {
    if(hit<0 || hit>3.65) return;
    const time=hit;
    // Broad slabs lift after contact. Their dark sides create depth and weight.
    for(let i=0;i<16;i++) {
      const a=i*TAU/16;
      if ((Math.sin(a)>0)!==front) continue;
      const r=65+seed(i)*65;const local=Math.max(0,time-r/1500);
      const pop=reduced?0:Math.sin(clamp(local/.85)*Math.PI)*(23+seed(i+30)*40)*p.power;
      const fade=1-clamp((hit-2)/1.3);if(fade<=0)continue;
      const x=tx+Math.cos(a)*r*p.power, z=tz+Math.sin(a)*r*p.power;
      const s=19+seed(i+71)*32;
      const points=Array.from({length:5},(_,j)=>{const theta=a+j*TAU/5;const r=s*(.5+seed(i*19+j)*.7);return [x+Math.cos(theta)*r,z+Math.sin(theta)*r];});
      ctx.globalAlpha=out(local*15)*fade;
      const top=points.map(([px,pz])=>project(px,pz,pop+(px-x)*.25));
      const bottom=points.map(([px,pz])=>project(px,pz,pop-12));
      poly([top[2],top[3],top[4],bottom[4],bottom[3],bottom[2]],'#37313c','#514855');
      const shade=ctx.createLinearGradient(top[0][0],top[0][1],top[3][0],top[3][1]);shade.addColorStop(0,i%2?'#aa9b95':'#c7b5a6');shade.addColorStop(1,'#635d68');
      poly(top,shade,'#bdadb1',.5);
      line([top[0],top[1]],'#d5b6ec',1.1*p.energy);
      line([top[2],[(top[2][0]+top[0][0])*.5,(top[2][1]+top[0][1])*.5],top[4]],'rgba(40,33,43,.5)',.8);
      ctx.globalAlpha=1;
    }
    if (reduced) return;
    for(let i=0;i<debris.length;i++) {
      const d=debris[i];if((Math.sin(d.a)>0)!==front)continue;
      const t=time-d.delay;if(t<0)continue;
      const life=clamp(1-(t-1.05)/.85);if(!life)continue;
      const dist=35+d.speed*t*p.power;
      const height=Math.max(0,d.height*t-175*t*t)*p.power;
      const [x,y]=project(tx+Math.cos(d.a)*dist,tz+Math.sin(d.a)*dist,height);
      const s=d.size*(.5+.5*p.power);ctx.save();ctx.translate(x,y);ctx.rotate(d.spin*t);ctx.globalAlpha=life;
      poly([[-s,-s*.4],[s*.35,-s],[s,s*.5],[-s*.6,s]],i%4?'#5e5765':'#b1a39e','#aa97ae',.35);
      poly([[s*.35,-s],[s,s*.5],[0,0]],'#353347');ctx.restore();
    }
  }

  function atmosphere(hit,p,tx,tz,reduced) {
    const c=project(tx,tz);
    if(hit<0) {
      const charge=clamp((hit+1.15)/1.15);
      glow(...c,45+charge*80,'#c79cff',charge*.5,.7);
      if(!reduced)for(let i=0;i<25;i++){const a=i*2.399;const r=120*(1-charge)+seed(i)*90;const [x,y]=project(tx+Math.cos(a)*r,tz+Math.sin(a)*r,charge*60*seed(i+50));ctx.fillStyle=`rgba(223,214,255,${charge*.7})`;ctx.fillRect(x,y,1.5,5);}
      return;
    }
    const fade=1-clamp((hit-2.3)/1.3);
    glow(...c,125+hit*24,'#8c68c8',.25*p.energy*fade,.6);
    if(!reduced) {
      for(let j=0;j<3;j++) {
        const t=hit-j*.13;if(t<0||t>1.1)continue;
        const r=35+out(t/1.1)*470*p.power;
        for(let k=0;k<7;k++) {ctx.beginPath();ctx.ellipse(c[0],c[1],r,r*lean,0,k*TAU/7+.05,k*TAU/7+.6+seed(k)*.22);ctx.strokeStyle=`rgba(225,215,248,${(1-t/1.1)*(.25-j*.055)})`;ctx.lineWidth=1+(1-t)*2;ctx.stroke();}
      }
      for(let i=0;i<35;i++) {
        const a=i*2.399,delay=seed(i)*.14,t=hit-delay;
        if(t<=0||t>2.7)continue;
        const dist=(55+out(t/1.9)*(220+seed(i+30)*105))*p.power;
        const [x,y]=project(tx+Math.cos(a)*dist,tz+Math.sin(a)*dist,15+t*9);
        const opacity=Math.sin(clamp(t/2.7)*Math.PI)*.54*p.dust;
        const size=70+t*115;ctx.save();ctx.globalAlpha=opacity;ctx.translate(x,y);ctx.rotate(Math.sin(a)*.08);ctx.drawImage(smoke,-size/2,-size*.3,size,size*.6);ctx.restore();
      }
      for(let i=0;i<70;i++) {
        const d=debris[i],t=hit-d.delay;if(t<0||t>1.8)continue;
        const r=(30+t*d.speed*1.3)*p.power;const y=Math.max(0,t*d.height*1.2-t*t*145);
        const pt=project(tx+Math.cos(d.a)*r,tz+Math.sin(d.a)*r,y);
        line([pt,[pt[0]-Math.cos(d.a)*7,pt[1]+8]],`rgba(${i%2?'238,197,254':'176,224,255'},${(1-t/1.8)*.7*p.energy})`,i%6?1:2);
      }
    }
  }

  return {
    resize() {
      const box=canvas.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,1.65);
      w=Math.round(box.width*dpr);h=Math.round(box.height*dpr);canvas.width=w;canvas.height=h;
      scale=Math.min(w/1000,h/760);ox=(w-1000*scale)/2;oy=(h-760*scale)/2;
    },
    render(time,{impact=3.82,preset='weight',shake=true,reduced=false,target='center',flat=false}={}) {
      const p=PRESETS[preset];const hit=time-impact;lean=flat?.84:.64;
      const tx=target==='edge'?190:0,tz=target==='edge'?120:0;
      ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#12121c';ctx.fillRect(0,0,w,h);
      ctx.setTransform(scale,0,0,scale,ox,oy);
      const bg=ctx.createRadialGradient(500,400,40,500,390,600);bg.addColorStop(0,'#34313d');bg.addColorStop(.65,'#1c1a27');bg.addColorStop(1,'#101019');ctx.fillStyle=bg;ctx.fillRect(0,0,1000,760);
      glow(500,620,400,'#414251',.18,.22);
      ctx.save();
      const zoom=reduced?1:1+clamp((time-impact+1.1)/1.1)*.035*(1-clamp((hit-.8)/1.8));
      let sx=0,sy=0;
      if(shake&&!reduced&&hit>p.hold&&hit<1.3){const strength=Math.exp(-(hit-p.hold)*4.5)*13*p.power;sx=Math.sin(hit*103)*strength;sy=Math.cos(hit*87)*strength*.65;}
      ctx.translate(500+sx,440+sy);ctx.scale(zoom,zoom);ctx.translate(-500,-440);
      const physicalTime=hit>0?impact+Math.max(0,hit-p.hold):time;
      board(physicalTime,impact,p,tx,tz,reduced);
      // Hold the whole strike for a few frames before releasing the stored energy.
      const visualHit=hit>0?Math.max(0,hit-p.hold):hit;
      const dim=time<impact?clamp((time-impact+1.2)/1.2)*.45:(1-clamp(hit/1.7))*.45;
      ctx.fillStyle=`rgba(9,10,28,${dim})`;ctx.fillRect(0,0,1000,760);
      if(hit<0)atmosphere(visualHit,p,tx,tz,reduced);
      shards(visualHit,p,tx,tz,false,reduced);
      if(!reduced)sword(physicalTime,impact,p,tx,tz);
      else if(hit>=0&&hit<3.25) {ctx.save();ctx.globalAlpha=clamp(hit/.25)*(1-clamp((hit-2.5)/.75));sword(impact+.2,impact,p,tx,tz);ctx.restore();}
      shards(visualHit,p,tx,tz,true,reduced);
      if(hit>=0)atmosphere(visualHit,p,tx,tz,reduced);
      ctx.restore();
      if(!reduced&&hit>=0&&hit<.07) {ctx.fillStyle=`rgba(222,223,255,${.48*(1-hit/.07)})`;ctx.fillRect(0,0,1000,760);}
      const v=ctx.createRadialGradient(500,420,280,500,420,650);v.addColorStop(0,'transparent');v.addColorStop(1,'rgba(2,4,13,.65)');ctx.fillStyle=v;ctx.fillRect(0,0,1000,760);
    },
  };
}
