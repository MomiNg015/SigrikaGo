/* Independent sample: no production API, account state or preload navigation. */
(() => {
  const root = document.querySelector('.thinking-loading');
  const character = document.querySelector('#character');
  const bulb = document.querySelector('#bulb');
  const fill = document.querySelector('#fill-polygon');
  const slider = document.querySelector('#progress');
  const output = document.querySelector('#progress-output');
  const tip = document.querySelector('#tip');
  const tips = window.SigrikaLoadingTips || [];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const holdMs = 2000;
  let animation = 0;
  let completeTimer = 0;
  let progress = 0;
  let tipIndex = 1 % Math.max(1,tips.length);
  let puzzleUrl = '';
  const cloudAnimations = new Map();
  const cloudElements = [...document.querySelectorAll('.thought-cloud, .thought-link')];

  function floatCloud(element,index) {
    const range = index===0 ? 5 : 2;
    const point = () => `${(Math.random()-.5)*range*2}px ${(Math.random()-.5)*range*1.4}px`;
    const motion = element.animate([
      {translate:'0px 0px'}, {translate:point()},
      {translate:point()}, {translate:'0px 0px'}
    ],{duration:6000+Math.random()*3000,easing:'ease-in-out',fill:'both'});
    cloudAnimations.set(element,motion);
    motion.onfinish = () => {
      if (progress<100) floatCloud(element,index);
    };
  }

  function syncCloudMotion(next) {
    if (reducedMotion) return;
    if (next===100) {
      for (const motion of cloudAnimations.values()) motion.pause();
      return;
    }
    cloudElements.forEach((element,index) => {
      const motion = cloudAnimations.get(element);
      if (!motion || motion.playState==='finished') floatCloud(element,index);
      else if (motion.playState==='paused') motion.play();
    });
  }

  function showTip() {
    const text = String(tips[tipIndex] || '').trim().replace(/^Tip\s*[:：]\s*/i,'');
    tip.textContent = text ? `Tip：${text}` : '';
  }

  function setProgress(value) {
    const number = Number(value);
    const next = Number.isFinite(number) ? Math.max(0,Math.min(100,number)) : 0;
    const threshold = 100 - 2*next;
    fill.setAttribute('points',threshold>=0
      ? `0,${threshold} ${100-threshold},100 0,100`
      : `0,0 ${-threshold},0 100,${100+threshold} 100,100 0,100`);
    bulb.setAttribute('aria-valuenow',String(Math.round(next)));
    output.value = `${Math.round(next)}%`;
    slider.value = String(Math.round(next));
    root.classList.toggle('is-complete',next===100);
    syncCloudMotion(next);
    const image = next===100 ? './loading-page/assets/character-complete.png'
      : reducedMotion ? './loading-page/assets/character-open.png'
      : './loading-page/assets/loading-blink.webp';
    if (character.getAttribute('src')!==image) character.src=image;
    character.alt = next===100 ? '恍然大悟的角色' : '托着脸思考的角色';
    if (next===100 && progress<100) {
      root.dataset.completionState='holding';
      completeTimer=window.setTimeout(() => {
        root.dataset.completionState='ready';
        root.dispatchEvent(new CustomEvent('loading:complete',{detail:{holdMs},bubbles:true}));
      },holdMs);
    } else if (next<100) {
      window.clearTimeout(completeTimer);
      root.dataset.completionState='loading';
    }
    progress=next;
  }

  function stop() { window.cancelAnimationFrame(animation); animation=0; }
  function play() {
    stop();
    setProgress(0);
    const started=performance.now();
    function step(now) {
      const elapsed=(now-started)/12000;
      // Linear data progress keeps the diagonal fill direction obvious.
      setProgress(Math.min(100,elapsed*100));
      if (progress<100) animation=window.requestAnimationFrame(step);
    }
    animation=window.requestAnimationFrame(step);
  }

  document.querySelector('#replay').addEventListener('click',play);
  for (const button of document.querySelectorAll('[data-progress]')) {
    button.addEventListener('click',() => {stop();setProgress(button.dataset.progress);});
  }
  slider.addEventListener('input',() => {stop();setProgress(slider.value);});
  window.setInterval(() => {
    if (progress===100 || tips.length<2) return;
    tipIndex=(tipIndex+1)%tips.length;
    showTip();
  },10000);

  document.querySelector('#puzzle-input').addEventListener('change',(event) => {
    const file=event.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (puzzleUrl) URL.revokeObjectURL(puzzleUrl);
    puzzleUrl=URL.createObjectURL(file);
    const image=new Image();
    image.src=puzzleUrl;
    image.alt='围棋死活题';
    document.querySelector('#puzzle-slot').replaceChildren(image);
  });
  window.addEventListener('pagehide',() => {stop();window.clearTimeout(completeTimer);for(const motion of cloudAnimations.values())motion.cancel();if(puzzleUrl)URL.revokeObjectURL(puzzleUrl);});
  showTip();
  const requested=new URLSearchParams(location.search).get('progress');
  if (requested!==null) setProgress(requested); else play();
})();
