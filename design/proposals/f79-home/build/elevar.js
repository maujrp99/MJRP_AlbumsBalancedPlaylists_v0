// F79 · level «Elevar»: the current system evolved. Same identity (black, glass panels, orange, the flame gradient on the
// main action, the equalizer), better flow: find first, name at the end; the series becomes a tray on the left with the
// covers numbered in order; the cards answer the click where the eye is; three steps named plainly, lit like an equalizer.
(function () {
  const E = F79.esc;
  const ICON = {
    search: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    up: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m6 15 6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };
  // The equalizer: five bars; `level` from 0 to 5 says how many are lit (the identity's equalizer, as a meter)
  const eq = (level, cls = '') => `<span class="e-eq ${cls}" aria-hidden="true">${[0.45, 0.8, 0.6, 1, 0.7].map((h, i) => `<i style="--h:${h}" class="${i < level ? 'on' : ''}"></i>`).join('')}</span>`;
  const FILTERS = [['Studio', 'Albums', true], ['EPs', 'EPs'], ['Singles', 'Singles'], ['Live', 'Live'], ['Compilations', 'Compilations'], ['Other', 'Uncategorized']];

  function steps(m) {
    const at = m.chosen.length ? 3 : (m.scan === 'results' ? 2 : 1);
    const S = [['Find albums', 'an artist, or a pasted list'], ['Pick', 'click the covers you want'], ['Create the series', 'then blend it into playlists']];
    return `<ol class="e-steps" data-inv="HOME-15">${S.map(([t, d], i) => `<li class="${i + 1 < at ? 'done' : i + 1 === at ? 'now' : ''}">${eq(i + 1 <= at ? 5 : 0, 'sm')}<span><b>${i + 1} · ${t}</b><em>${d}</em></span></li>`).join('')}</ol>`;
  }

  function search(m) {
    const paste = m.mode === 'paste';
    const lines = m.paste.split('\n');
    const bad = new Set(m.pasteReport.map((r) => r.line));
    return `<section class="e-search" aria-label="Find albums">
      <div class="e-seg" role="group" aria-label="How to find albums" data-inv="HOME-03">
        <button type="button" data-mode="artist" aria-pressed="${!paste}">By artist</button>
        <button type="button" data-mode="paste" aria-pressed="${paste}">Paste a list</button>
      </div>
      ${paste ? `<div class="e-paste" data-inv="HOME-05">
          <label class="e-label" for="ePaste">One album per line, as <b>Artist - Album</b></label>
          <div class="e-paste-box">${lines.map((l, i) => `<div class="e-line ${bad.has(i + 1) ? 'bad' : 'ok'}"><span class="n">${i + 1}</span><span class="t">${E(l)}</span><span class="v">${bad.has(i + 1) ? 'needs « - »' : 'ready'}</span></div>`).join('')}</div>
          ${m.pasteReport.length ? `<p class="e-warn" role="status">Line 3 needs a « - » between the artist and the album: «Radiohead - OK Computer». The other 2 lines are ready.</p>` : ''}
          <button type="button" class="e-btn flame">Add 2 albums</button>
        </div>` : `<div class="e-artist" data-inv="HOME-04">
          <label class="e-label" for="eArtist">Artist</label>
          <div class="e-row"><span class="e-field">${ICON.search}<input id="eArtist" type="text" value="${E(m.query)}" placeholder="e.g. Pink Floyd" autocomplete="off"></span>
          <button type="button" class="e-btn flame" data-scan ${m.scan === 'scanning' ? 'disabled aria-busy="true"' : ''}>${m.scan === 'scanning' ? 'Scanning…' : 'Scan'}</button></div>
        </div>`}
    </section>`;
  }

  function card(a, m) {
    const n = m.chosen.indexOf(a.id) + 1;
    return `<button type="button" class="e-card ${n ? 'is-chosen' : ''}" data-id="${a.id}" aria-pressed="${!!n}" aria-label="${E(a.title)}, ${a.year}${n ? `, number ${n} in your series` : ''}">
      <span class="e-cover"><img class="f79-cover-img" src="${a.cover}" alt="" loading="lazy">${a.badges.map((b) => `<span class="e-badge">${E(b)}</span>`).join('')}
        <span class="e-pick">${n ? `<b>${n}</b>` : ICON.plus}</span></span>
      <span class="e-title">${E(a.title)}</span><span class="e-year">${a.year}</span></button>`;
  }

  function discography(m) {
    if (m.mode === 'paste') return `<div class="e-panel" data-inv="HOME-13">${eq(3, 'lg')}<h3>Your list is checked line by line as you type.</h3><p>Lines that are ready go into your series when you press «Add 2 albums». Nothing is added before that.</p></div>`;
    if (m.scan === 'idle') return `<div class="e-panel" data-inv="HOME-13">${eq(5, 'lg idle')}<h3>Start with an artist</h3><p>Type a name and press Scan: the whole discography appears here, newest first, sorted by type. ${F79.phone() ? 'Tap' : 'Click'} a cover to add it to your series.</p><p class="e-sub">Albums from many artists? Choose «Paste a list».</p></div>`;
    if (m.scan === 'scanning') return `<div class="e-scanning" role="status" data-inv="HOME-08"><p>${eq(5, 'sm live')} Searching the catalog for «${E(m.query)}»… The covers appear as soon as it answers.</p><div class="e-grid">${Array.from({ length: 10 }, () => '<span class="e-skel"><i></i><b></b><em></em></span>').join('')}</div></div>`;
    if (m.scan === 'error') return `<div class="e-panel err" role="alert" data-inv="HOME-14"><h3>The catalog did not answer in 15 seconds.</h3><p>Nothing was changed: your series still has its albums. Try again in a moment.</p><button type="button" class="e-btn flame" data-scan>Try again</button></div>`;
    if (m.scan === 'notfound') return `<div class="e-panel" role="status" data-inv="HOME-14"><h3>No albums found for «${E(m.query)}».</h3><p>Check the spelling, or try the name as it appears on the cover. If the albums are from many artists, «Paste a list» finds each one.</p></div>`;
    const c = F79.counts;
    const chips = FILTERS.map(([label, key, on]) => `<button type="button" class="e-chip ${on ? 'on' : ''}" aria-pressed="${!!on}">${label}${c[key] ? ` <small>${c[key]}</small>` : ''}</button>`).join('');
    return `<div class="e-status" data-inv="HOME-08"><h2>Pink Floyd</h2><p>17 studio albums, newest first. ${F79.phone() ? 'Tap' : 'Click'} a cover to add it; ${F79.phone() ? 'tap' : 'click'} again to take it out.</p>
        <button type="button" class="e-link" data-inv="HOME-18">Add all 17</button></div>
      <div class="e-chips" role="group" aria-label="Album types" data-inv="HOME-06">${chips}</div>
      <div class="e-grid" data-inv="HOME-07">${F79.albums.map((a) => card(a, m)).join('')}</div>`;
  }

  function tray(m, sheet) {
    const rows = m.chosen.map((id, i) => {
      const a = F79.byId(id);
      return `<li class="e-row-item"><span class="e-num">${i + 1}</span><img class="f79-cover-img" src="${a.cover.replace('300x300', '100x100')}" alt=""><span class="e-ri"><b>${E(a.title)}</b><em>Pink Floyd · ${a.year}</em></span>
        <span class="e-acts" data-inv="${i === 0 ? 'HOME-19' : ''}"><button type="button" aria-label="Move up" data-move="-1" data-id="${id}" ${i === 0 ? 'disabled' : ''}>${ICON.up}</button><button type="button" aria-label="Move down" data-move="1" data-id="${id}" ${i === m.chosen.length - 1 ? 'disabled' : ''}>${ICON.down}</button><button type="button" aria-label="Remove ${E(a.title)}" data-remove="${id}">${ICON.x}</button></span></li>`;
    }).join('');
    const n = m.chosen.length;
    return `<aside class="e-tray ${sheet ? 'as-sheet' : ''}" aria-label="Your series" data-inv="HOME-09">
      <div class="e-tray-head">
        <p class="e-eyebrow">// Your series</p>
        <label class="e-label" for="eName">Name</label>
        <input id="eName" class="e-name" type="text" value="${E(m.name)}" placeholder="${n ? 'Pink Floyd selection' : 'Name your series'}" data-inv="HOME-02">
        <p class="e-def" data-inv="HOME-01">A series is the set of albums you want to hear together. The Blend turns it into balanced playlists.</p>
        <div class="e-count" data-inv="HOME-10">${eq(Math.min(5, n), 'sm')}<b>${n === 0 ? 'No albums yet' : n === 1 ? '1 album' : `${n} albums`}</b>${n ? '<span>· 1 artist</span>' : ''}</div>
      </div>
      ${n ? `<ol class="e-list">${rows}</ol>` : `<div class="e-empty"><p>Your albums will line up here, numbered in the order the Blend reads them.</p><ol><li>Find an artist, or paste a list.</li><li>${F79.phone() ? 'Tap' : 'Click'} the covers you want.</li><li>Create the series.</li></ol></div>`}
      <div class="e-tray-foot" data-inv="HOME-11">
        <p data-inv="HOME-12">${n ? 'Next: open it in the Blend to make playlists.' : 'Pick at least one album to create the series.'}</p>
        <button type="button" class="e-btn flame big" ${n ? '' : 'disabled'}>Create series ${ICON.arrow}</button>
      </div>
    </aside>`;
  }

  function phoneBar(m) {
    const n = m.chosen.length;
    return `<div class="e-bar" data-inv="HOME-17"><button type="button" class="e-bar-note" data-open ${n ? '' : 'disabled'}>
        <span class="e-stack">${m.chosen.slice(0, 3).map((id) => `<img class="f79-cover-img" src="${F79.byId(id).cover.replace('300x300', '100x100')}" alt="">`).join('')}</span>
        <span><b>${n ? `${n} albums · ${E(m.name || 'Pink Floyd selection')}` : 'No albums yet'}</b><em>${n ? 'Tap to review, reorder or rename' : 'Tap a cover to add it'}</em></span></button>
      <button type="button" class="e-btn flame" ${n ? '' : 'disabled'}>Create series</button></div>`;
  }

  window.LEVEL = {
    name: 'Elevar',
    render(m, root) {
      const phone = F79.phone();
      root.innerHTML = `<div class="e-wrap">
        ${phone ? '' : tray(m)}
        <main class="e-main">
          ${phone && m.s === 'empty' ? `<div class="e-intro" data-inv="HOME-01"><h1>Build a series</h1><p>A series is the set of albums you want to hear together. The Blend turns it into balanced playlists.</p></div>` : ''}
          ${phone ? '' : steps(m)}
          ${search(m)}
          ${discography(m)}
        </main>
        ${phone ? phoneBar(m) + (m.sheet ? `<div class="e-sheet-back" data-close></div>${tray(m, true)}` : '') : ''}
      </div>`;
      bind(m, root);
    }
  };

  function bind(m, root) {
    root.onclick = (e) => {
      const t = e.target.closest('button, [data-close]');
      if (!t) return;
      if (t.dataset.mode) return F79.set({ mode: t.dataset.mode, paste: t.dataset.mode === 'paste' ? (m.paste || 'Joni Mitchell - Hejira\nYes - Close to the Edge\nRadiohead OK Computer') : m.paste, pasteReport: t.dataset.mode === 'paste' ? [{ line: 3 }] : [] });
      if ('scan' in t.dataset) {
        const q = root.querySelector('#eArtist')?.value || 'Pink Floyd';
        F79.set({ scan: 'scanning', query: q, s: 'scanning' });
        setTimeout(() => F79.set({ scan: 'results', s: 'results' }), F79.reduced() ? 300 : 1400);
        return;
      }
      if (t.classList.contains('e-card')) {
        const id = t.dataset.id; const c = m.chosen.includes(id) ? m.chosen.filter((x) => x !== id) : [...m.chosen, id];
        return F79.set({ chosen: c, name: m.name || (c.length ? '' : m.name) });
      }
      if (t.dataset.remove) return F79.set({ chosen: m.chosen.filter((x) => x !== t.dataset.remove) });
      if (t.dataset.move) {
        const c = m.chosen.slice(); const i = c.indexOf(t.dataset.id); const j = i + Number(t.dataset.move);
        if (j >= 0 && j < c.length) { [c[i], c[j]] = [c[j], c[i]]; F79.set({ chosen: c }); }
        return;
      }
      if (t.classList.contains('e-link')) return F79.set({ chosen: F79.albums.map((a) => a.id) });
      if ('open' in t.dataset) return F79.set({ sheet: true });
      if ('close' in t.dataset) return F79.set({ sheet: false });
    };
    root.onchange = (e) => { if (e.target.id === 'eName') F79.model.name = e.target.value; };
  }
})();
