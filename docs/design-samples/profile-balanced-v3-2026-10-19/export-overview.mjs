import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory=path.dirname(fileURLToPath(import.meta.url));
const base=`${process.env.SAMPLE_ORIGIN || 'http://127.0.0.1:5173'}/docs/design-samples/profile-balanced-v3-2026-10-19/`;
const designs=[
  ['mint','薄荷档案','角色优先 · 浅薄荷立绘区 + 暖纸资料','保留左图右资料的构图','角色占据主要视觉位置','手机两列角色战绩'],
  ['ink','墨纸分栏','主次分明 · 深墨身份栏 + 暖纸战绩','深色集中在身份和段位','桌面采用两列横向记录','手机先读身份与总战绩'],
  ['blue','晴蓝名片','紧凑易读 · 浅蓝身份横栏 + 战绩清单','身份收进顶部横栏','下方总览与角色分栏','手机保留紧凑记录行']
];
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
  const page=await browser.newPage({viewport:{width:1760,height:1280},deviceScaleFactor:1});
  await page.setContent(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>履历三版折中设计</title><style>
  :root{--paper:#fffbf2;--ink:#3d2b25;--muted:#6a554d;--line:color-mix(in srgb,var(--ink) 22%,var(--paper))}*{box-sizing:border-box}body{margin:0;padding:30px 32px 24px;background:var(--paper);color:var(--ink);font-family:'Microsoft YaHei',system-ui,sans-serif}header{display:flex;align-items:end;justify-content:space-between;padding-bottom:20px;border-bottom:1px solid var(--line)}h1{font-size:28px;font-weight:600;margin:0}header p{font-size:12px;color:var(--muted);margin:0}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}section{min-width:0}h2{font-size:23px;font-weight:600;margin:22px 0 8px}section>p{font-size:12px;color:var(--muted);margin:0 0 16px}.desktop{display:block;width:100%;aspect-ratio:1.6;object-fit:contain;object-position:top;border:1px solid var(--line)}.mobile-row{display:flex;align-items:start;gap:24px;margin-top:22px}.phone{display:block;width:182px;height:auto;flex-shrink:0;border:1px solid var(--line)}.notes{padding-top:14px;font-size:13px;line-height:2;color:var(--muted)}.notes strong{display:block;font-size:16px;color:var(--ink);font-weight:600;margin-bottom:12px}.notes span{display:block;margin-bottom:8px}.notes p{margin-top:30px;padding-top:17px;border-top:1px solid var(--line);font-size:12px;line-height:1.8}.swatches{display:flex;gap:6px;margin-top:20px}.swatches i{width:22px;height:22px;border:1px solid var(--line);border-radius:4px}footer{font-size:12px;color:var(--muted);padding-top:18px;margin-top:22px;border-top:1px solid var(--line)}
  </style></head><body><header><h1>履历 / 详细资料 · 三版折中设计</h1><p>项目原有内容 · 当前角色资源 · 左侧书签 · 桌面与手机竖屏</p></header><main>${designs.map(([id,title,description,...notes])=>`<section><h2>${title}</h2><p>${description}</p><img class="desktop" src="${base}${id}-desktop.png" alt="${title}桌面"><div class="mobile-row"><img class="phone" src="${base}${id}-mobile.png" alt="${title}390px完整手机页面"><div class="notes"><strong>390px · 手机竖屏</strong>${notes.map(note=>`<span>${note}</span>`).join('')}<p>三版共有<br>原有模式和玩法<br>身份、段位与战绩<br>当前 Q 版角色资源<br>成就 / 个性化 / 社交入口</p><div class="swatches" aria-label="项目色盘">${['#fffbf2','#3d2b25','#ff9ebb','#9ad3de','#bfe8dd'].map(color=>`<i style="background:${color}"></i>`).join('')}</div></div></div></section>`).join('')}</main><footer>实际浏览器截图 · 示例数据。比较页可操作三版样板，并切换本人 / 他人、空战绩、长用户名与 320px 窄屏。正式窗口尚未替换。</footer></body></html>`);
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode()));});
  await page.screenshot({path:path.join(directory,'overview.png'),fullPage:true});
} finally {await browser.close();}
