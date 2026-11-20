// F79 · round 2 · the part the Transformar v2 prototype (and its colour previews) shares: every state of the chosen
// direction, the model of each one, the prototype's strip, the wireframe mode, the marks of the agent's decisions and the
// messages from the comparator. Data: window.DATA (capture.json, the real Home scanned for «Pink Floyd» on the local site
// on 2026-11-20). core.js (round 1) is left as it was, so home-*-v1.html rebuild identical.
(function () {
  const SCENARIOS = [
    ['empty', '1 · First visit'],
    ['typing', '2 · Typing an artist'],
    ['scanning', '3 · Searching'],
    ['results', '4 · Discography, type filters'],
    ['chosen1', '5 · One album chosen'],
    ['chosen', '6 · Several albums'],
    ['many', '7 · Many albums (13)'],
    ['reorder', '8 · Changing the order'],
    ['removed', '9 · Removed, with Undo'],
    ['paste', '10 · Pasting a list'],
    ['pastereport', '11 · List added, one line skipped'],
    ['notfound', '12 · Artist not found'],
    ['error', '13 · The catalog did not answer'],
    ['noname', '14 · Name missing on create'],
    ['creating', '15 · Creating'],
    ['created', '16 · Created: what comes next'],
    ['createfail', '17 · Could not save'],
    ['guest', '18 · Not signed in (guest)']
  ];
  const A = window.DATA.albums;
  const FOUR = [0, 2, 3, 5].map((i) => A[i].id); // the same four the capture of today chose
  const MANY = [0, 2, 3, 5, 1, 4, 6, 7, 8, 9, 10, 11, 12].map((i) => A[i].id);
  // Albums that come from a pasted list are not in the capture (only Pink Floyd was scanned): their covers are drawn as
  // placeholders, said on the screen as illustrative.
  const PASTED = [
    { id: 'x-hejira', title: 'Hejira', artist: 'Joni Mitchell', year: '1976', cover: '', pasted: true },
    { id: 'x-ctte', title: 'Close to the Edge', artist: 'Yes', year: '1972', cover: '', pasted: true }
  ];
  const PASTE = 'Joni Mitchell - Hejira\nYes - Close to the Edge\nRadiohead OK Computer\nCaravan - In the Land of Grey and Pinkk';
  const SUGGEST = 'Pink Floyd selection';
  function model(s) {
    const base = { s, mode: 'artist', query: '', scan: 'idle', chosen: [], name: '', named: 'none', paste: '', open: false,
      undo: null, create: 'idle', guest: false, moved: null, focus: false };
    const res = { ...base, query: 'Pink Floyd', scan: 'results' };
    const four = { ...res, chosen: FOUR.slice(), name: SUGGEST, named: 'suggested' };
    switch (s) {
      case 'typing': return { ...base, query: 'Pink Fl', focus: true };
      case 'scanning': return { ...base, query: 'Pink Floyd', scan: 'scanning' };
      case 'results': return res;
      case 'chosen1': return { ...res, chosen: [FOUR[0]], name: SUGGEST, named: 'suggested' };
      case 'chosen': return four;
      case 'many': return { ...res, chosen: MANY.slice(), name: 'Pink Floyd, the studio years', named: 'edited', undo: { kind: 'addall', n: 13 } };
      case 'reorder': return { ...four, chosen: [FOUR[0], FOUR[2], FOUR[1], FOUR[3]], open: true, moved: { id: FOUR[2], to: 2 } };
      case 'removed': return { ...four, chosen: [FOUR[0], FOUR[2], FOUR[3]], open: true, undo: { kind: 'remove', id: FOUR[1], at: 1 } };
      case 'paste': return { ...base, mode: 'paste', paste: PASTE, chosen: [], scan: 'idle' };
      case 'pastereport': return { ...base, mode: 'paste', paste: 'Caravan - In the Land of Grey and Pinkk', report: true,
        chosen: ['x-hejira', 'x-ctte'], name: 'Joni Mitchell and Yes', named: 'suggested', pastedAdded: 2 };
      case 'notfound': return { ...base, query: 'Pink Floydd Qxz', scan: 'notfound' };
      case 'error': return { ...four, scan: 'error' };
      case 'noname': return { ...four, name: '', named: 'empty', create: 'noname', open: F79.phone() };
      case 'creating': return { ...four, create: 'creating' };
      case 'created': return { ...four, create: 'created' };
      case 'createfail': return { ...four, create: 'failed' };
      case 'guest': return { ...base, guest: true };
      default: return base;
    }
  }
  const hash = () => Object.fromEntries(location.hash.slice(1).split('&').filter(Boolean).map((kv) => kv.split('=')));
  let current;
  const root = () => document.getElementById('f79-root');
  function draw() {
    window.LEVEL.render(current, root());
    document.querySelectorAll('#protoScenarios button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.s === current.s)));
  }
  window.F79 = {
    albums: A,
    pasted: PASTED,
    suggest: SUGGEST,
    byId: (id) => A.find((a) => a.id === id) || PASTED.find((a) => a.id === id),
    counts: window.DATA.counts,
    phone: () => window.innerWidth < 768,
    get model() { return current; },
    set(patch) { current = { ...current, ...patch }; draw(); },
    scenario(s) { current = model(s); draw(); window.scrollTo(0, 0); },
    esc: (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])),
    reduced: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    scenarios: SCENARIOS
  };
  window.__setScenario = (s) => F79.scenario(s);
  window.addEventListener('message', (e) => {
    if (!e.data) return;
    if ('marks' in e.data) document.body.classList.toggle('proto-marks', !!e.data.marks);
    if (e.data.scenario) F79.scenario(e.data.scenario);
  });
  document.addEventListener('DOMContentLoaded', () => {
    const h = hash();
    if (window.parent !== window) document.body.classList.add('framed');
    if ('wire' in h) document.body.classList.add('proto-wire');
    if ('marks' in h) document.body.classList.add('proto-marks');
    const bar = document.getElementById('protoScenarios');
    if (bar) {
      bar.innerHTML = SCENARIOS.map(([id, label]) => `<button type="button" data-s="${id}">${label}</button>`).join('') +
        '<label class="proto-marks-toggle"><input type="checkbox" id="protoMarks"> marcar as decisões do agente</label>';
      bar.addEventListener('click', (e) => { if (e.target.dataset.s) F79.scenario(e.target.dataset.s); });
      const mk = document.getElementById('protoMarks');
      mk.checked = document.body.classList.contains('proto-marks');
      mk.addEventListener('change', () => document.body.classList.toggle('proto-marks', mk.checked));
    }
    current = model(h.s || 'empty');
    draw();
    let w = window.innerWidth < 768;
    window.addEventListener('resize', () => { if ((window.innerWidth < 768) !== w) { w = !w; current = model(current.s); draw(); } });
  });
})();
