import { FALLBACK_CHARACTERS } from '/src/shared/characterFallback.js';
import { characterChibiSource } from '/src/shared/characterChibiPortraits.js';

const stage = document.querySelector('.stage');
const status = document.querySelector('#status');
const portrait = document.querySelector('#portrait');
const palettes = {
  sigrika: ['#8660ba', '#eee7f8', '#413159'],
  changli: ['#df7165', '#fae8df', '#713b43'],
  qiuyuan: ['#67988d', '#e4f0e9', '#2c514d'],
};
let timer;
let selection = 0;
function freeze() {
  clearTimeout(timer);
  stage.classList.remove('is-playing');
  status.textContent = '定格 · 查看完整构图';
}
function replay() {
  freeze();
  void stage.offsetWidth;
  stage.classList.add('is-playing');
  status.textContent = '演出中 · 2 秒';
  timer = setTimeout(() => {
    freeze();
    status.textContent = '演出结束 · 已返回定格';
  }, 2200);
}
document.querySelector('#replay').addEventListener('click', replay);
document.querySelector('#freeze').addEventListener('click', freeze);
document.querySelector('#character').addEventListener('change', async (event) => {
  const id = event.target.value;
  const token = ++selection;
  const character = FALLBACK_CHARACTERS[id];
  const src = characterChibiSource(id, 'full');
  const image = new Image();
  image.src = src;
  try { await image.decode(); } catch {
    if (token === selection) status.textContent = '立绘加载失败，请重新选择';
    return;
  }
  if (token !== selection) return;
  const [accent, light, deep] = palettes[id];
  for (const [key, value] of Object.entries({accent, light, deep, art: `url('${src}')`})) stage.style.setProperty(`--${key}`, value);
  portrait.src = src;
  portrait.alt = `${character.name}全身立绘`;
  document.querySelector('.name').textContent = character.name;
  document.querySelector('.skill-name').textContent = character.skill.name;
  document.querySelector('.cutin').setAttribute('aria-label', `${character.name}发动${character.skill.name}`);
  replay();
});
for (const mode of ['desktop', 'phone']) {
  document.querySelector(`#${mode}`).addEventListener('click', () => {
    stage.classList.toggle('is-phone', mode === 'phone');
    for (const id of ['desktop', 'phone']) document.querySelector(`#${id}`).setAttribute('aria-pressed', String(id === mode));
    freeze();
  });
}
const stones = [[3,3],[4,3],[4,4],[5,4],[6,5],[5,6],[7,7],[8,7],[8,8],[9,8],[3,9],[9,3],[6,6],[7,5]];
stones.forEach(([x,y],index) => {
  const stone = document.createElement('i');
  stone.className = `stone ${index % 2 ? 'white' : 'black'}`;
  stone.style.left = `${x / 12 * 100}%`;
  stone.style.top = `${y / 12 * 100}%`;
  document.querySelector('.grid').append(stone);
});
