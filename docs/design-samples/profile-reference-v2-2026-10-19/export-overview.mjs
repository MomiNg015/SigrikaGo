import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory=path.dirname(fileURLToPath(import.meta.url));
const base=`${process.env.SAMPLE_ORIGIN || 'http://127.0.0.1:5173'}/docs/design-samples/profile-reference-v2-2026-10-19/`;
const designs=[['arknights','方舟档案','参考 1：贯穿立绘 / 青色标签 / 黑色资料区'],['endfield','终末地名片','参考 2：上深下浅 / 左侧身份 / 右侧陈列'],['hybrid','融合档案','大立绘 + 明暗分区 / 成就与战绩并置']];
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
  const page=await browser.newPage({viewport:{width:1600,height:1080},deviceScaleFactor:1});
  await page.setContent(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>三版设计总览</title><style>*{box-sizing:border-box}body{margin:0;padding:32px;background:#18191a;color:#eee;font-family:system-ui,'Microsoft YaHei',sans-serif}header{display:flex;align-items:end;justify-content:space-between;padding:0 0 24px;border-bottom:1px solid #505050}h1{font-size:27px;font-weight:500;margin:0}header p{font-size:12px;color:#bbb;margin:0}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}section{min-width:0}h2{font-size:21px;font-weight:500;margin:22px 0 5px}section>p{font-size:11px;color:#bbb;margin:0 0 16px}.desktop{display:block;width:100%;height:316px;object-fit:contain;object-position:top;background:#101010}.mobile-row{display:flex;align-items:start;gap:22px;margin-top:22px}.phone{width:180px;height:390px;object-fit:cover;object-position:top;flex-shrink:0;border:1px solid #555}.notes{padding-top:12px;font-size:12px;line-height:2.2;color:#bbb}.notes strong{display:block;font-size:14px;color:#eee;font-weight:500;margin-bottom:12px}.notes span{display:block}footer{font-size:11px;color:#999;padding-top:23px;margin-top:22px;border-top:1px solid #444}</style></head><body><header><h1>履历 / 详细资料 · 三版重设计</h1><p>当前项目角色资源 · 原有左侧书签保留 · 桌面与手机竖屏</p></header><main>${designs.map(([id,title,description])=>`<section><h2>${title}</h2><p>${description}</p><img class="desktop" src="${base}${id}-desktop.png" alt="${title}桌面"><div class="mobile-row"><img class="phone" src="${base}${id}-mobile.png" alt="${title}手机首屏"><div class="notes"><strong>手机 / 390px 首屏</strong><span>左侧竖排书签</span><span>完整头部头像</span><span>身份与操作独立</span><span>战绩自然向下滚动</span><span>角色记录改为两列</span></div></div></section>`).join('')}</main><footer>实际浏览器截图；数据为示例。比较页可切换完整交互样板、查看原图，并测试 320px 窄屏。正式窗口尚未替换。</footer></body></html>`);
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode()));});
  await page.screenshot({path:path.join(directory,'overview.png'),fullPage:true});
} finally {await browser.close();}
