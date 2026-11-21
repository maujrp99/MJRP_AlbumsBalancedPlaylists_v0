import { createRequire } from 'node:module';
const req = createRequire('/Users/maujrp/mjrp/projects/MJRPpersonal/noop.js');
const { chromium, webkit } = req('@playwright/test');
const OUT = process.argv[2];
const sides = {
  proto: 'http://127.0.0.1:5186/splash-crate-v2.html?fire=soft',
  real: 'http://127.0.0.1:5184/',
  fict: 'http://127.0.0.1:5187/',
};
const hide = '.proto-strip, .proto-notes { display: none !important; }';
const vps = { w1280: { width: 1280, height: 800 }, w393: { width: 393, height: 852, isMobile: true, hasTouch: true } };
const ONLY = process.argv[3];
const modes = {
  reduced: { ctx: { reducedMotion: 'reduce' }, q: '' },
  nogl: { ctx: {}, q: 'nogl' },
  nojs: { ctx: { javaScriptEnabled: false }, q: '' },
  plain: { ctx: {}, q: '' },
};
const results = {};
const require_skip = (vid, mid) => vid === 'w1280' && (mid === 'reduced' || mid === 'nogl');
const b = await chromium.launch();
for (const [vid, vp] of Object.entries(vps)) for (const [mid, m] of Object.entries(modes)) for (const [sid, url] of Object.entries(sides)) {
  if (require_skip(vid, mid)) continue;
  const { isMobile, hasTouch, ...viewport } = vp;
  const ctx = await b.newContext({ viewport, isMobile: !!isMobile, hasTouch: !!hasTouch, deviceScaleFactor: 1, colorScheme: 'dark', ...m.ctx });
  const p = await ctx.newPage();
  const reqs = [];
  p.on('request', (r) => reqs.push(r.url()));
  let u = url;
  if (m.q) u += (u.includes('?') ? '&' : '?') + m.q;
  await p.goto(u, { waitUntil: mid === 'nojs' ? 'domcontentloaded' : 'load', timeout: 20000 }).catch((e) => console.error('goto', vid, mid, sid, String(e).slice(0,80)));
  if (sid === 'proto' && mid !== 'nojs') await p.addStyleTag({ content: hide }).catch(() => {});
  await p.waitForTimeout(2500);
  let info = {};
  if (mid !== 'nojs') {
    info = await p.evaluate(() => {
      const st = document.getElementById('stage'); const css = document.getElementById('crate-css'); const mo = document.getElementById('motion');
      const fam = [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight);
      return { html: document.documentElement.className, stage: st && st.className, cssOpacity: css && getComputedStyle(css).opacity,
        cssVis: css && getComputedStyle(css).visibility, motionVisible: mo ? getComputedStyle(mo).display !== 'none' && mo.offsetParent !== null : null,
        motionText: mo && mo.textContent, fonts: fam, scrollW: document.documentElement.scrollWidth, h1: getComputedStyle(document.getElementById('h1')).fontFamily,
        bodyBg: getComputedStyle(document.body).backgroundColor, accent: getComputedStyle(document.querySelector('.btn-primary')).backgroundImage.slice(0, 120) };
    });
  } else {
    info.text = 'see screenshot';
  }
  info.three = reqs.some((r) => /three/.test(r));
  results[`${vid}.${mid}.${sid}`] = info;
  await p.screenshot({ path: `${OUT}/${vid}-${mid}-${sid}.png`, fullPage: mid === 'nojs', timeout: 30000 }).catch((e) => console.error('shot', vid, mid, sid, String(e).slice(0,120)));
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(results, null, 1));
