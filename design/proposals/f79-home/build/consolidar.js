// F79 · level «Consolidar»: the same screen, the same structure, the same components (the captured Home of today, state by
// state), with only what this level changes applied on top: the words (the console voice kept, made clear), the hierarchy
// of the step labels, the empty and error states that speak, the main action always in view, and the two phone defects
// the recheck found (N1: the filter strip floating over the covers; N10: the name far from «Create series»).
window.LEVEL = {
  name: 'Consolidar',
  render(m, root) {
    window.refHome(m, root);
    const $ = (s) => root.querySelector(s);
    const $$ = (s) => [...root.querySelectorAll(s)];
    const phone = F79.phone();
    const text = (el, t) => { if (el) el.textContent = t; };
    const inv = (el, id) => { if (el) el.setAttribute('data-inv', id); };
    root.classList.add('f79-c');

    // The panel's header: it repeated the brand of the top bar; it now says what the screen is for (HOME-01)
    const header = $('#home-header');
    if (header) {
      text(header.querySelector('h1'), 'Build a series');
      const p = header.querySelector('p');
      text(p, 'A series is the set of albums you want to hear together. The Blend turns it into playlists.');
      p.className = 'text-xs text-gray-400 mt-1 leading-snug f79-c-intro';
      inv(header, 'HOME-01');
    }
    // 01 · the name (HOME-02)
    const cfg = $('#home-series-config');
    if (cfg) {
      text(cfg.querySelector('label'), '01 // Name your series');
      text(cfg.querySelector('span'), 'You can rename it later in Music Series.');
      const input = $('#seriesNameInput'); if (input) input.placeholder = 'e.g. Floyd, the long ones';
      inv(cfg, 'HOME-02');
    }
    // 02 · find albums: by artist or by a pasted list (HOME-03, HOME-04, HOME-05)
    const tech = $('#home-tech-panel');
    if (tech) {
      text(tech.querySelector('.text-orange-500.uppercase'), '02 // Find albums');
      const visual = $('#btnModeVisual'), bulk = $('#btnModeBulk');
      text(visual, 'By artist'); text(bulk, 'Paste a list');
      [visual, bulk].forEach((b) => b && b.classList.add('f79-c-mode'));
      inv(visual?.parentElement, 'HOME-03');
      const info = [...tech.querySelectorAll('span')].find((s) => /Filtering by artist/.test(s.textContent));
      text(info, phone ? 'Scan an artist: their albums appear below, newest first.' : 'Scan an artist: their albums appear on the right, newest first.');
      const artist = $('#artistScanInput'); if (artist) artist.placeholder = 'Artist name';
      inv($('#visualInputs'), 'HOME-04');
      const area = $('#bulkPasteInput'); if (area) area.placeholder = 'One album per line:\nArtist - Album';
      text($('#btnProcessBulk span'), 'Add these albums');
      inv($('#bulkInputs'), 'HOME-05');
      if (m.s === 'paste') {
        const rep = $('#bulkPasteReport');
        if (rep) {
          rep.classList.remove('hidden');
          rep.innerHTML = '<p class="font-bold mb-1">1 line needs a fix before it can go in</p><ul class="space-y-1 list-disc pl-4"><li>Line 3: «Radiohead OK Computer» — write a « - » between the artist and the album.</li></ul>';
        }
        area?.classList.add('border-orange-500');
      }
    }
    // 02 · the discography: the strip of type filters and the status (HOME-06, HOME-08)
    const toolbar = $('#home-toolbar');
    if (toolbar) {
      const lab = toolbar.querySelector('.uppercase.tracking-widest');
      text(lab, phone ? '02 // Pick albums' : '02 // Pick albums from the discography');
      inv(toolbar, 'HOME-06');
      inv($('#statusArtistName'), 'HOME-08');
    }
    const other = $('#btnFilterUncategorized');
    if (other && !phone) {
      const count = other.querySelector('.filter-btn-count');
      [...other.childNodes].forEach((n) => { if (n.nodeType === 3 && n.textContent.trim() === '?') n.textContent = 'Other '; });
      if (!/Other/.test(other.textContent)) other.insertBefore(document.createTextNode('Other '), count);
    }
    // The grid's own panel: it says what to do and what still holds (HOME-13, HOME-14)
    const grid = $('#discographyGrid');
    inv(grid, m.scan === 'results' ? 'HOME-07' : (m.scan === 'idle' ? 'HOME-13' : 'HOME-14'));
    const panelText = grid ? [...grid.querySelectorAll('p, h3')] : [];
    const title = panelText[0], detail = panelText[1];
    if (m.scan === 'idle' && m.s !== 'paste') {
      text(title, 'Scan an artist to see their discography here.');
      if (detail) text(detail, 'Or choose «Paste a list» to add albums from many artists at once.');
      else title?.insertAdjacentHTML('afterend', '<p class="text-xs text-gray-500 mt-2">Or choose «Paste a list» to add albums from many artists at once.</p>');
    }
    if (m.scan === 'notfound') text(detail, 'Check the spelling, or paste the albums as a list.');
    if (m.scan === 'error' && grid && !grid.querySelector('.f79-c-retry')) {
      grid.querySelector('div')?.insertAdjacentHTML('beforeend', '<button type="button" class="f79-c-retry px-5 py-3 bg-flame-gradient rounded-lg text-white text-sm font-bold mt-4">Try again</button>');
    }
    // 03 · the series being built (HOME-09, HOME-10)
    const stage = $('#home-staging-area');
    if (stage) {
      text(stage.querySelector('label'), '03 // Your series');
      const n = m.s === 'paste' ? 4 : m.chosen.length;
      text($('#stagingCount'), n === 1 ? '1 album' : `${n} albums`);
      const empty = [...stage.querySelectorAll('div')].find((d) => /Stack Empty|No albums selected/.test(d.textContent) && d.children.length === 0);
      if (empty) { empty.innerHTML = 'No albums yet.<br>Click a cover to add it here; drag to change the order.'; empty.classList.add('f79-c-empty'); }
      inv(stage, 'HOME-09');
    }
    // The main action says what it does, and what comes next (HOME-11, HOME-12)
    const init = $('#btnInitializeLoad');
    if (init) {
      text(init.querySelector('span'), 'Create series');
      const n = m.s === 'paste' ? 4 : m.chosen.length;
      init.classList.toggle('f79-c-off', n === 0);
      init.insertAdjacentHTML('beforebegin', `<p class="f79-c-next">${n === 0 ? 'Pick at least one album to create the series.' : 'Next: open it in the Blend to make playlists.'}</p>`);
      inv(init.parentElement, 'HOME-11');
    }
    // The phone's bar: its texts already speak (F76); the name goes with it (N10)
    const bar = root.querySelector('.home-chosen-bar');
    if (bar) {
      inv(bar, 'HOME-17');
      const note = bar.querySelector('.home-chosen-count');
      if (note && m.chosen.length) note.insertAdjacentHTML('beforeend', `<span class="f79-c-barname">«${F79.esc(m.name || 'Pink Floyd selection')}» · tap to review or rename</span>`);
    }
  }
};
