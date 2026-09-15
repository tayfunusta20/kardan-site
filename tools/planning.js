const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
const OUT='/Users/tayfunusta/Documents/Projects/kardan-site/screenshots';
const shoot=require('./shoot-lib.js');
(async () => {
  const token=fs.readFileSync(path.join(__dirname,'.token'),'utf8').trim(), user=fs.readFileSync(path.join(__dirname,'.user'),'utf8').trim();
  const tokens = await shoot.names(token, true);
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:2, locale:'tr-TR' });
  await ctx.addInitScript(([t,u])=>{localStorage.setItem('kardan_token',t);localStorage.setItem('kardan_user',u);},[token,user]);
  const p = await ctx.newPage(); await p.goto('http://localhost:3000/',{waitUntil:'networkidle'});
  const settle = async () => { await p.waitForLoadState('networkidle'); await p.waitForTimeout(1200); await p.locator('[role="progressbar"]').first().waitFor({state:'detached',timeout:90000}).catch(()=>{}); await p.waitForLoadState('networkidle'); await p.waitForTimeout(1500); };
  await p.getByText('Aylık Planlama',{exact:true}).first().click(); await settle();
  // next month
  const nxt=p.locator('button:has(svg[data-testid="ChevronRightIcon"]), button:has(svg[data-testid="KeyboardArrowRightIcon"]), button:has(svg[data-testid="NavigateNextIcon"])').first(); if (await nxt.count()) await nxt.click(); else await p.mouse.click(845,375); await settle();
  console.log('month label:', await p.getByText(/Ekim 2026/).first().innerText().catch(()=>'?'));
  await p.evaluate(shoot.blurInPage, tokens);
  await p.screenshot({path:path.join(OUT,'planning-month.png')});
  // pick a weekday with lessons, then daily view
  const day = process.argv[2] || '6';
  await p.locator('text=/^'+day+'$/').first().click().catch(()=>{});
  await settle();
  await p.getByText('Gün',{exact:true}).first().click(); await settle();
  await p.evaluate(shoot.blurInPage, tokens);
  await p.mouse.wheel(0, 460); await p.waitForTimeout(800); await p.screenshot({path:path.join(OUT,'planning.png')});
  console.log('done');
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
