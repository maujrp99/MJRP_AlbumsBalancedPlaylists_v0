// UAT-235/236 recheck: the entry page of main (baseline, as «prototype») against the branch fix/f80-uat-entry-page, real covers.
// The crate is expected to differ (the change itself); everything else should be the same.
const to = (id) => "document.getElementById('" + id + "').scrollIntoView({block:'start'}); window.dispatchEvent(new Event('scroll'));";
const sc = (id, title) => ({ id, title, proto: { path: '' }, product: { path: '' }, actions: [{ eval: to(id) }, { wait: 1800 }] });
export default {
  format: 1,
  name: 'F80 UAT-235/236 — main vs fix/f80-uat-entry-page (capas reais)',
  evidenceDir: '/Users/maujrp/mjrp/projects/MJRP_AlbumsBalancedPlaylists_v0/.claude/worktrees/f80-uat-entry-page-1b5c47/reports/evidence/F80/recheck-uat235/sensor',
  deps: '/Users/maujrp/mjrp/projects/MJRPpersonal',
  prototype: { url: 'http://127.0.0.1:5193/', ready: '#h1', settleMs: 1500 },
  product: { url: 'http://127.0.0.1:5191/', ready: '#h1', settleMs: 1500 },
  conditions: { browsers: ['chromium'], locale: 'en-US',
    viewports: [{ id: 'w1440', width: 1440, height: 900 }, { id: 'w1280', width: 1280, height: 800 }, { id: 'w393', width: 393, height: 852, isMobile: true }],
    palettes: [{ id: 'dark', colorScheme: 'dark' }] },
  scenarios: [
    { id: 'hero', title: 'Lado A · 1 (primeira tela)', proto: { path: '' }, product: { path: '' }, actions: [{ wait: 1500 }] },
    sc('a3', 'Lado A · 3 — Ranking'), sc('flip', 'Flip the record'), sc('b1', 'Lado B · 1'), sc('b2', 'Lado B · 2 — o convite'),
  ],
  facts: { regions: { header: 'header', main: 'main', footer: 'footer' },
           roles: { h1: 'h1', h2: 'main h2', cta: '.hero a, .final a', caption: '#caption' } },
};
