// F92 judge: the eyes and hands — product (built dist) and prototype at the slider and at step 4, every non-loopback host aborted (shim).
import { chromium, webkit } from '/private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/f92judge/shim/node_modules/@playwright/test/index.mjs';
import { spawn } from 'node:child_process';
const OUT = '/Users/maujrp/mjrp/projects/MJRP_AlbumsBalancedPlaylists_v0/.claude/worktrees/f92-deep-cuts-judge/reports/evidence/F92/recheck/eyes';
const start = (cmd, args, re) => new Promise((ok) => { const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] }); const f = (d) => { const m = String(d).match(re); if (m) ok({ p, url: m[1] }); }; p.stdout.on('data', f); p.stderr.on('data', f); });
const prod = await start('node', ['/private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/f92judge/serve.mjs', '/Users/maujrp/mjrp/projects/MJRP_AlbumsBalancedPlaylists_v0/.claude/worktrees/f92-deep-cuts-judge/dist'], /(http:\/\/127\.0\.0\.1:\d+)/);
const proto = await start('python3', ['-u', '-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', '/private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/f92judge/proto'], /port (\d+)/);
const protoUrl = 'http://127.0.0.1:' + proto.url;
const out = {};
for (const [name, eng] of [['chromium', chromium], ['webkit', webkit]]) for (const w of [1440, 393]) {
  const phone = w === 393; const tag = name + '-' + w;
  const b = await eng.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: phone ? 852 : 900 }, ...(phone ? { hasTouch: true } : {}), locale: 'pt-BR', colorScheme: 'dark' });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
  await pg.goto(prod.url + '/start'); await pg.waitForFunction(() => window.router && window.albumSeriesStore && document.getElementById('app')?.children.length, null, { timeout: 40000 });
  await pg.addStyleTag({ content: '#toast-container{visibility:hidden!important}' });
  await pg.evaluate(() => { window.albumSeriesStore.setSeries([{ id: 'proof-series', name: 'Proof mix', albumQueries: [] }]); window.router.navigate('/blend?seriesId=proof-series'); });
  await pg.waitForSelector('#blend-recipe-cards [data-recipe-id]');
  const card = (id) => pg.locator('#blend-recipe-cards [data-recipe-id="' + id + '"]');
  await card('deep-cuts').click(); await pg.waitForSelector('#blend-skip-slider');
  const s = pg.locator('#blend-skip-slider'); await s.focus(); await pg.keyboard.press('ArrowRight'); await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(300);
  await s.scrollIntoViewIfNeeded(); await pg.evaluate(() => window.scrollBy(0, -120));
  await pg.screenshot({ path: OUT + '/product-' + tag + '-deep5-slider.png' });
  const r = {};
  r.ingredients = (await pg.locator('#blend-ingredients-panel').textContent()).replace(/\s+/g, ' ').slice(0, 500);
  r.generate = (await pg.locator('#blend-generate-section').textContent().catch(() => '')).replace(/\s+/g, ' ').slice(0, 300);
  r.bodyTail = await pg.evaluate(() => [...document.querySelectorAll('[class*=fixed]')].map((e) => e.innerText.replace(/\s+/g, ' ')).filter(Boolean).join(' | ').slice(0, 400));
  r.deepCard = (await card('deep-cuts').textContent()).replace(/\s+/g, ' '); r.leastCard = (await card('least-played').textContent()).replace(/\s+/g, ' ');
  r.cardClamp = await card('deep-cuts').evaluate((c) => { const p = c.querySelector('p'); return p ? { scrollH: p.scrollHeight, clientH: p.clientHeight } : null; });
  r.hscroll = await pg.evaluate(() => document.documentElement.scrollWidth > innerWidth + 0.5);
  await pg.locator('#blend-generate-section').scrollIntoViewIfNeeded().catch(() => {});
  await pg.screenshot({ path: OUT + '/product-' + tag + '-deep5-generate.png' });
  await card('least-played').click(); await pg.waitForTimeout(400); await card('least-played').scrollIntoViewIfNeeded();
  await pg.screenshot({ path: OUT + '/product-' + tag + '-least.png' });
  r.leastGenerate = (await pg.locator('#blend-generate-section').textContent().catch(() => '')).replace(/\s+/g, ' ').slice(0, 300);
  r.errors = errs; out[tag] = r;
  if (name === 'chromium') { // the prototype at the same places
    const pp = await ctx.newPage(); await pp.goto(protoUrl + '/prototype-v1.html'); await pp.waitForSelector('#stage');
    await pp.evaluate((ph) => { S.tab = ph ? 'blend-ph' : 'blend-pc'; S.view = 'prop'; S.state.blend = 'deep'; S.site = {}; render(); const i = document.getElementById(ph ? 'skip-ph' : 'skip-pc'); i.value = '5'; i.dispatchEvent(new Event('input', { bubbles: true })); }, phone);
    await pp.addStyleTag({ content: 'header.wrap.top,.tabs,#tools,#say{display:none!important}' });
    await pp.locator(phone ? '#skip-ph' : '#skip-pc').scrollIntoViewIfNeeded(); await pp.screenshot({ path: OUT + '/proto-' + tag + '-deep5-slider.png' });
    out[tag].protoSummary = await pp.evaluate(() => [...document.querySelectorAll('[data-inv="BLEND-R08"]')].map((e) => e.textContent.replace(/\s+/g, ' ')).join(' | '));
    out[tag].protoIngredients = await pp.evaluate(() => document.querySelector('[data-inv="BLEND-R05"]')?.parentElement.textContent.replace(/\s+/g, ' ').slice(0, 500));
  }
  out[tag].blocked = undefined; await b.close();
}
console.log(JSON.stringify(out, null, 1));
prod.p.kill(); proto.p.kill();
