import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({headless:true,channel:'msedge'});
try {
  for(const width of [320,360,390,412,1440]) {
    const p=await b.newPage({viewport:{width,height:width===320?640:900},reducedMotion:'reduce'});
    await p.goto('http://127.0.0.1:5173/.trellis/tasks/10-14-mobile-profile-readability/replay-preview.html');
    await p.locator('.replay-table-row').first().waitFor();
    await p.evaluate(()=>document.fonts.ready);
    await p.waitForTimeout(500);
    const layout=await p.evaluate(()=>{
      const row=document.querySelector('.replay-table-row');
      const rect=s=>row.querySelector(s).getBoundingClientRect().toJSON();
      const list=document.querySelector('.replay-dialog-list-scroll');
      return {overflow:document.documentElement.scrollWidth>innerWidth,listOverflow:list.scrollWidth>list.clientWidth,
        black:rect('.replay-player-black'),white:rect('.replay-player-white'),moves:rect('.replay-moves-cell'),
        grid:getComputedStyle(row).gridTemplateAreas,display:getComputedStyle(row.querySelector('.replay-move-placard')).display};
    });
    await p.screenshot({path:`.trellis/tasks/10-14-mobile-profile-readability/replay-${width}.png`}); console.log(width,layout); assert.equal(layout.overflow,false);
    assert.equal(layout.listOverflow,false);
    if(width<760){assert.ok(layout.white.top>=layout.black.bottom);assert.ok(layout.moves.left>=layout.black.right);assert.equal(layout.display,'flex');}
    else assert.equal(layout.display,'none');
    await p.screenshot({path:`.trellis/tasks/10-14-mobile-profile-readability/replay-${width}.png`});
    await p.locator('.replay-table-row').first().click();
    assert.equal(await p.evaluate(()=>window.openedReplay),'replay-0');
    await p.locator('.replay-table-row').nth(1).focus();
    await p.keyboard.press('Enter');
    assert.equal(await p.evaluate(()=>window.openedReplay),'replay-1');
    await p.locator('.replay-table-row').last().scrollIntoViewIfNeeded();
    const last=await p.locator('.replay-table-row').last().boundingBox();
    assert.ok(last.y>=0 && last.y+last.height<=(width===320?640:900));
    console.log(width,layout);await p.close();
  }
}finally{await b.close();}
