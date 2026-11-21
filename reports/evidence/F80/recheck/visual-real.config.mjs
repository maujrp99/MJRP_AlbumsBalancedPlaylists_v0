const to = (id) => "document.getElementById('" + id + "').scrollIntoView({block:'start'}); window.dispatchEvent(new Event('scroll'));";
const sc = (id, title) => ({ id, title, proto: { path: '?fire=soft' }, product: { path: '' }, actions: [{ eval: to(id) }, { wait: 1800 }] });
export default {
  format: 1,
  name: 'F80 Caixote v2 (fogo brando) — capas real',
  evidenceDir: '/Users/maujrp/mjrp/projects/MJRP_AlbumsBalancedPlaylists_v0/.claude/worktrees/agent-a4806cd05ee3c9cc0/reports/evidence/F80/recheck-real',
  deps: '/Users/maujrp/mjrp/projects/MJRPpersonal',
  prototype: { url: 'http://127.0.0.1:5186/splash-crate-v2.html', ready: '#h1',
               hideCss: '.proto-strip, .proto-notes, footer a[href="#privacy"] { display: none !important; }', settleMs: 1500 },
  product: { url: 'http://127.0.0.1:5184/', ready: '#h1', settleMs: 1500 },
  conditions: { browsers: ['chromium', 'webkit'], locale: 'en-US',
    viewports: [{ id: 'w1280', width: 1280, height: 800 }, { id: 'w393', width: 393, height: 852, isMobile: true }],
    palettes: [{ id: 'dark', colorScheme: 'dark' }] },
  scenarios: [
    { id: 'hero', title: 'Lado A · 1 (primeira tela)', proto: { path: '?fire=soft' }, product: { path: '' }, actions: [{ wait: 1500 }] },
    sc('a2', 'Lado A · 2 — Series'), sc('a3', 'Lado A · 3 — Ranking'), sc('a5', 'Lado A · 5 — Your shelf'),
    sc('flip', 'Flip the record'), sc('b1', 'Lado B · 1'), sc('b2', 'Lado B · 2 — o convite'),
  ],
  facts: { regions: { header: 'header', main: 'main', footer: 'footer' },
           roles: { h1: 'h1', h2: 'main h2', cta: '.hero a, .final a', caption: '#caption' } },
};
