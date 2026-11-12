import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const origin = process.env.PREVIEW_URL || 'http://127.0.0.1:8123';
const ids = ['blocks','match3','solitaire','word','mines','game2048','snake','sudoku','reversi','checkers','chess','pinball'];
const selectors = {
  blocks: '#board',
  match3: '#board .gem',
  solitaire: '#tableau .tableau-col',
  word: '#game .word-board',
  mines: '#game .mine-grid',
  game2048: '#game .number-grid',
  snake: '#game .snake-stage',
  sudoku: '#game .sudoku-grid',
  reversi: '#game .disc-grid',
  checkers: '#game .checker-grid',
  chess: '#game .chess-grid',
  pinball: '#game .pinball-stage',
};
const browser = await chromium.launch({headless:true, args:['--no-sandbox']});
let failures = [];
for (const [name, viewport] of [
  ['iphone', {width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}],
  ['android', {width:412,height:915,deviceScaleFactor:2,isMobile:true,hasTouch:true}]
]) {
  const context = await browser.newContext({viewport:{width:viewport.width,height:viewport.height},
    deviceScaleFactor:viewport.deviceScaleFactor,isMobile:viewport.isMobile,hasTouch:viewport.hasTouch});
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror', e => errors.push(e.message));
  const shots='qa/screenshots/'+name;
  await mkdir(shots,{recursive:true});
  try {
    await page.goto(origin+'/catalog/', {waitUntil:'domcontentloaded',timeout:20000});
    await page.locator('[data-game]').first().waitFor();
    assert.equal(await page.locator('.game-card.compact-card[data-game]').count(),12,'all games must use compact cards');
    for (const id of ids) assert.equal(await page.locator('.game-card[data-game="'+id+'"]').count(),1,'game card '+id);
    const icon=page.locator('.blocks-card-icon');
    await icon.waitFor();
    const iconDetails=await icon.evaluate(el=>({naturalWidth:el.naturalWidth,displayWidth:el.getBoundingClientRect().width}));
    assert.ok(iconDetails.naturalWidth>0&&iconDetails.displayWidth>=90,'Blocks icon must render at readable size');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert.ok(overflow<=2,'catalog has horizontal overflow '+overflow);
    await page.screenshot({path:shots+'/catalog.png',fullPage:true});
    for(const id of ids){
      await page.locator('[data-game="'+id+'"]').click();
      const iframe=await page.$('#game-frame');
      assert.ok(iframe,'game iframe exists');
      const frame=await iframe.contentFrame();
      assert.ok(frame,'game iframe navigation works: '+id);
      await frame.waitForSelector(selectors[id],{timeout:10000});
      await page.screenshot({path:shots+'/'+id+'.png',fullPage:false});
      const gameOverflow=await frame.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
      assert.ok(gameOverflow<=3,id+' has horizontal overflow '+gameOverflow);
      await page.locator('#back-to-games').click();
      await page.locator('#catalog-view').waitFor({state:'visible'});
      assert.equal(await page.locator('#player-view').isVisible(),false,id+' returned on first tap');
    }
    assert.deepEqual(errors,[],'No uncaught JavaScript errors');
    console.log('PASS '+name+': 12 cards, icon, game launch, return, screenshots');
  } catch(err) {
    failures.push(name+': '+err.message);
    console.error('FAIL '+name+': '+err.stack);
    await page.screenshot({path:shots+'/failure.png',fullPage:false}).catch(()=>{});
  } finally {
    await context.close();
  }
}
await browser.close();
if(failures.length) {
  console.error(failures.join('\n'));
  process.exitCode=1;
}
