// F92 judge (wip/f92-deep-cuts-judge): /blend with «Deep cuts» and «As menos ouvidas» vs design/proposals/f92-recipes/prototype-v1.html (main),
// tab «Site · Blend (ph)», view «Só a proposta». Product = the branch's built dist on 127.0.0.1; the shim aborts every other host.
const W = 'ph';
const TAB = W === 'pc' ? 'blend-pc' : 'blend-ph';
const proto = (state, skip) => ({ path: '/prototype-v1.html', eval: `(async () => { S.tab='${TAB}'; S.view='prop'; S.state.blend='${state}'; S.site={}; render(); ${skip ? `const i=document.getElementById('skip-${W}'); i.value='${skip}'; i.dispatchEvent(new Event('input',{bubbles:true}));` : ''} await new Promise(r=>setTimeout(r,300)); })()` });
const SEED = `(async () => { for (let i=0;i<200 && !(window.router && window.albumSeriesStore && document.getElementById('app')?.children.length);i++) await new Promise(r=>setTimeout(r,100));
  window.albumSeriesStore.setSeries([{ id: 'proof-series', name: 'Proof mix', albumQueries: [] }]); window.router.navigate('/blend?seriesId=proof-series');
  for (let i=0;i<200 && !document.querySelector('#blend-recipe-cards [data-recipe-id]');i++) await new Promise(r=>setTimeout(r,100)); })()`;
const pick = (id, skip) => `(async () => { document.querySelector('#blend-recipe-cards [data-recipe-id="${id}"]').click(); await new Promise(r=>setTimeout(r,500));
  ${skip ? `const i=document.getElementById('blend-skip-slider'); i.value='${skip}'; i.dispatchEvent(new Event('input',{bubbles:true})); await new Promise(r=>setTimeout(r,300));` : ''}
  const t=document.getElementById('blend-recipe-cards'); t && t.scrollIntoView({block:'start'}); window.scrollTo(0,0); document.getElementById('toast-container')?.style.setProperty('visibility','hidden'); })()`;
const product = (id, skip) => ({ path: '/start', actions: [{ eval: SEED }, { wait: 800 }, { eval: pick(id, skip) }, { wait: 800 }] });
export default {
  format: 1,
  name: 'F92 · Blend · Deep cuts e As menos ouvidas (' + W + ')',
  evidenceDir: '/Users/maujrp/mjrp/projects/MJRP_AlbumsBalancedPlaylists_v0/.claude/worktrees/f92-deep-cuts-judge/reports/evidence/F92/recheck/' + W,
  deps: '/private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/f92judge/shim',
  prototype: {
    server: { cmd: ['python3', '-u', '-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', '/private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/f92judge/proto'], cwd: '.', ready: 'port (\\d+)', url: 'http://127.0.0.1:$1' },
    ready: '#stage',
    hideCss: 'header.wrap.top, .tabs, #tools, #say { display: none !important; }',
    settleMs: 800,
  },
  product: {
    server: { cmd: ['node', '/private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/f92judge/serve.mjs', '/Users/maujrp/mjrp/projects/MJRP_AlbumsBalancedPlaylists_v0/.claude/worktrees/f92-deep-cuts-judge/dist'], cwd: '.', ready: '(http://127\\.0\\.0\\.1:\\d+)', url: '$1', timeoutMs: 60_000 },
    ready: 'body',
    settleMs: 800,
  },
  conditions: {
    browsers: ['chromium', 'webkit'], locale: 'pt-BR',
    viewports: W === 'pc' ? [{ id: 'w1440', width: 1440, height: 900 }] : [{ id: 'w393', width: 393, height: 852, isMobile: true }],
    palettes: [{ id: 'dark', colorScheme: 'dark' }],
  },
  scenarios: [
    { id: W + '-deep-3', title: 'Blend · Deep cuts escolhida, pulo 3', proto: proto('deep'), product: product('deep-cuts') },
    { id: W + '-deep-5', title: 'Blend · Deep cuts, pulo movido para 5', proto: proto('deep', 5), product: product('deep-cuts', 5) },
    { id: W + '-least', title: 'Blend · As menos ouvidas escolhida', proto: proto('least'), product: product('least-played') },
  ],
  facts: { root: 'body', roles: { h1: 'h1', h2: 'h2' } },
};
