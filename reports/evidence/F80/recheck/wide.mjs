import { createRequire } from 'node:module';
const req = createRequire('/Users/maujrp/mjrp/projects/MJRPpersonal/noop.js');
const { chromium, webkit } = req('@playwright/test');
for (const [bn, bt] of [['chromium', chromium], ['webkit', webkit]]) {
 const b = await bt.launch();
 for (const url of ['http://127.0.0.1:5184/', 'http://127.0.0.1:5187/', 'http://127.0.0.1:5186/splash-crate-v2.html']) {
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, isMobile: bn === 'chromium', hasTouch: true });
  const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => { const out = []; for (const e of document.querySelectorAll('body *')) { const r = e.getBoundingClientRect(); if (r.right > 395 && r.width > 0) out.push([e.tagName, e.id, String(e.className).slice(0,40), Math.round(r.left), Math.round(r.right), (e.textContent||'').trim().slice(0,40)]); } return { sw: document.documentElement.scrollWidth, iw: innerWidth, out: out.slice(0, 12) }; });
  console.log(bn, url, JSON.stringify(r));
  await ctx.close();
 }
 await b.close();
}
