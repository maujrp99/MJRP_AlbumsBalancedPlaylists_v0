// F79 · the part every prototype of the Home shares: the scenarios (the states on view), the model of each one, the
// prototype's strip, the wireframe mode and the messages from the comparator. Data: window.DATA (capture.json, the real
// Home scanned for «Pink Floyd» on the local site on 2026-11-20). Each level defines window.LEVEL = { name, render(model, root) }.
(function () {
  const SCENARIOS = [
    ['empty', '1 · Empty: first visit'],
    ['scanning', '2 · Searching an artist'],
    ['results', '3 · Discography on screen'],
    ['chosen', '4 · Albums chosen'],
    ['paste', '5 · Paste a list'],
    ['error', '6 · Error: the catalog did not answer'],
    ['notfound', '7 · Artist not found']
  ];
  const A = window.DATA.albums;
  const CHOSEN = [0, 2, 3, 5].map((i) => A[i].id); // the same four the capture of today chose
  const PASTE = 'Joni Mitchell - Hejira\nYes - Close to the Edge\nRadiohead OK Computer';
  function model(s) {
    const base = { s, mode: 'artist', query: '', scan: 'idle', chosen: [], name: '', paste: '', pasteReport: [] };
    if (s === 'scanning') return { ...base, query: 'Pink Floyd', scan: 'scanning' };
    if (s === 'results') return { ...base, query: 'Pink Floyd', scan: 'results' };
    if (s === 'chosen') return { ...base, query: 'Pink Floyd', scan: 'results', chosen: CHOSEN.slice(), name: 'Floyd, the long ones' };
    if (s === 'paste') return { ...base, mode: 'paste', paste: PASTE, pasteReport: [{ line: 3, text: 'Radiohead OK Computer', why: 'no " - " between the artist and the album' }] };
    if (s === 'error') return { ...base, query: 'Pink Floyd', scan: 'error' };
    if (s === 'notfound') return { ...base, query: 'Pink Floydd Qxz', scan: 'notfound' };
    return base;
  }
  const hash = () => Object.fromEntries(location.hash.slice(1).split('&').filter(Boolean).map((kv) => kv.split('=')));
  let current = model(hash().s || 'empty');
  const root = () => document.getElementById('f79-root');
  function draw() {
    window.LEVEL.render(current, root());
    document.querySelectorAll('#protoScenarios button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.s === current.s)));
  }
  window.F79 = {
    albums: A,
    byId: (id) => A.find((a) => a.id === id),
    counts: window.DATA.counts,
    phone: () => window.innerWidth < 768,
    get model() { return current; },
    set(patch) { current = { ...current, ...patch }; draw(); },
    scenario(s) { current = model(s); draw(); window.scrollTo(0, 0); },
    esc: (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])),
    reduced: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };
  window.__setScenario = (s) => F79.scenario(s);
  window.addEventListener('message', (e) => { if (e.data && e.data.scenario) F79.scenario(e.data.scenario); });
  document.addEventListener('DOMContentLoaded', () => {
    if (window.parent !== window) document.body.classList.add('framed');
    if ('wire' in hash()) document.body.classList.add('proto-wire');
    const bar = document.getElementById('protoScenarios');
    if (bar) {
      bar.innerHTML = SCENARIOS.map(([id, label]) => `<button type="button" data-s="${id}">${label}</button>`).join('');
      bar.addEventListener('click', (e) => { if (e.target.dataset.s) F79.scenario(e.target.dataset.s); });
    }
    draw();
    let w = window.innerWidth < 768;
    window.addEventListener('resize', () => { if ((window.innerWidth < 768) !== w) { w = !w; draw(); } });
  });
})();
