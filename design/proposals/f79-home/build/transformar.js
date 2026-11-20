// F79 · level «Transformar»: a new approach to the same task, still this product. One stage instead of two panels: a
// question and one search field that takes an artist or a pasted list; the discography as the stage; the series as a
// dock of covers fixed at the bottom, named in place, with «Create series» beside it. The fire (the flame gradient, the
// logo) and the equalizer (a live bar under the field) are the centre of the screen. The console voice gives way to plain words.
(function () {
  const E = F79.esc;
  const plus = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  const arrow = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const eqLine = (live, n = 48) => `<div class="t-eq ${live ? 'live' : ''}" aria-hidden="true" data-inv="HOME-16">${Array.from({ length: n }, (_, i) => `<i style="--h:${(0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.37))).toFixed(2)};--d:${(i % 7) * -0.13}s"></i>`).join('')}</div>`;

  function stage(m) {
    const big = m.scan !== 'results' && m.scan !== 'scanning';
    const paste = m.mode === 'paste';
    const field = paste
      ? `<div class="t-field t-paste" data-inv="HOME-05"><div class="t-lines">${m.paste.split('\n').map((l, i) => `<div class="${i === 2 ? 'bad' : ''}"><span>${E(l)}</span>${i === 2 ? '<em>add « - » between artist and album</em>' : '<em class="ok">ready</em>'}</div>`).join('')}</div>
         <div class="t-paste-foot"><span>We read this as a list: 3 lines, 2 albums ready, 1 to fix.</span><button type="button" class="t-btn flame">Add 2 albums</button></div></div>`
      : `<div class="t-field" data-inv="HOME-04"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
         <input id="tQuery" type="text" value="${E(m.query)}" placeholder="An artist, or paste a list of albums" autocomplete="off" aria-label="Search an artist, or paste a list of albums">
         <button type="button" class="t-btn flame" data-scan ${m.scan === 'scanning' ? 'disabled aria-busy="true"' : ''}>${m.scan === 'scanning' ? 'Searching…' : 'Search'}</button></div>`;
    return `<section class="t-stage ${big ? 'big' : 'small'}">
      ${big ? `<div class="t-hero" data-inv="HOME-01"><h1>Pick the albums.<br><span>We blend the playlists.</span></h1>
        <p>A series is the set of albums you want to hear together, from one artist or many. Build it here; the Blend turns it into balanced playlists.</p></div>` : ''}
      ${field}
      <p class="t-hint" data-inv="HOME-03">${paste ? 'One album per line, as Artist - Album. <button type="button" data-mode="artist">Search an artist instead</button>' : `Type an artist to see the discography, or <button type="button" data-mode="paste">paste a list</button> of albums from many artists.`}</p>
      ${eqLine(m.scan === 'scanning')}
    </section>`;
  }

  function results(m) {
    if (m.mode === 'paste' || m.scan === 'idle') return `<ol class="t-how" data-inv="HOME-13"><li><b>1</b><span><strong>Find</strong>an artist, or paste a list</span></li><li><b>2</b><span><strong>Drop in</strong>the albums you want, in order</span></li><li><b>3</b><span><strong>Create</strong>the series, then blend it</span></li></ol>`;
    if (m.scan === 'scanning') return `<p class="t-wait" role="status" data-inv="HOME-08">Looking for «${E(m.query)}» in the catalog… the covers appear as soon as it answers.</p><div class="t-grid">${Array.from({ length: 12 }, () => '<span class="t-skel"></span>').join('')}</div>`;
    if (m.scan === 'error') return `<div class="t-msg err" role="alert" data-inv="HOME-14"><b>The catalog did not answer in 15 seconds.</b><span>Nothing in your series changed. Try again in a moment.</span><button type="button" class="t-btn flame" data-scan>Try again</button></div>`;
    if (m.scan === 'notfound') return `<div class="t-msg" role="status" data-inv="HOME-14"><b>No albums found for «${E(m.query)}».</b><span>Check the spelling, or paste the albums as a list: one per line, Artist - Album.</span></div>`;
    const c = F79.counts;
    const chips = [['Studio', c.Albums, 1], ['EPs', c.EPs], ['Singles', c.Singles], ['Live', c.Live], ['Compilations', c.Compilations], ['Other', c.Uncategorized]]
      .map(([l, n, on]) => `<button type="button" class="t-chip ${on ? 'on' : ''}" aria-pressed="${!!on}">${l}${n ? ` · ${n}` : ''}</button>`).join('');
    return `<header class="t-artist" data-inv="HOME-08"><h2>Pink Floyd</h2><span>17 studio albums · newest first</span><div class="t-chips" role="group" aria-label="Album types" data-inv="HOME-06">${chips}</div></header>
      <div class="t-grid" data-inv="HOME-07">${F79.albums.map((a) => {
        const n = m.chosen.indexOf(a.id) + 1;
        return `<button type="button" class="t-card ${n ? 'in' : ''}" data-id="${a.id}" aria-pressed="${!!n}" aria-label="${E(a.title)}, ${a.year}${n ? `, number ${n} in the series` : ''}"><span class="t-cv"><img class="f79-cover-img" src="${a.cover}" alt="" loading="lazy"><span class="t-mark">${n || plus}</span></span><span class="t-tt">${E(a.title)}</span><span class="t-yy">${a.year}${a.badges.length ? ` · ${E(a.badges.join(', '))}` : ''}</span></button>`;
      }).join('')}</div>`;
  }

  function dock(m) {
    const n = m.chosen.length;
    const covers = m.chosen.map((id, i) => `<img class="f79-cover-img" style="--i:${i}" src="${F79.byId(id).cover.replace('300x300', '100x100')}" alt="${E(F79.byId(id).title)}">`).join('');
    return `<div class="t-dock ${n ? 'full' : ''}" role="region" aria-label="Your series" data-inv="HOME-09">
      <div class="t-pile" data-inv="HOME-10">${n ? covers : '<span class="t-slot"></span><span class="t-slot"></span><span class="t-slot"></span>'}</div>
      <div class="t-meta">
        ${n ? `<input class="t-name" type="text" value="${E(m.name)}" placeholder="Pink Floyd selection" aria-label="Series name" data-inv="HOME-02"><span>${n} album${n > 1 ? 's' : ''} from 1 artist · <button type="button" data-inv="HOME-19">change the order</button></span>`
            : `<b>Your series is empty</b><span>${F79.phone() ? 'Tap' : 'Click'} a cover to drop it in. You name it at the end.</span>`}
      </div>
      <div class="t-go" data-inv="HOME-11"><small data-inv="HOME-12">${n ? 'Next: the Blend makes the playlists' : 'One album is enough to start'}</small><button type="button" class="t-btn flame big" ${n ? '' : 'disabled'}>Create series ${arrow}</button></div>
    </div>`;
  }

  window.LEVEL = {
    name: 'Transformar',
    render(m, root) {
      root.innerHTML = `<div class="t-wrap">${stage(m)}<section class="t-results">${results(m)}</section>${dock(m)}</div>`;
      root.onclick = (e) => {
        const t = e.target.closest('button'); if (!t) return;
        if (t.dataset.mode) return F79.set({ mode: t.dataset.mode, paste: 'Joni Mitchell - Hejira\nYes - Close to the Edge\nRadiohead OK Computer' });
        if ('scan' in t.dataset) {
          F79.set({ scan: 'scanning', query: root.querySelector('#tQuery')?.value || 'Pink Floyd', s: 'scanning', mode: 'artist' });
          return setTimeout(() => F79.set({ scan: 'results', s: 'results' }), F79.reduced() ? 300 : 1400);
        }
        if (t.dataset.id) { const id = t.dataset.id; F79.set({ chosen: m.chosen.includes(id) ? m.chosen.filter((x) => x !== id) : [...m.chosen, id] }); }
      };
    }
  };
})();
