// F79 · Transformar v2 (round 2, after the owner chose this direction). Same form as v1 — one stage, one field for an
// artist or a pasted list, the series as a dock of covers fixed at the bottom, fire and equalizer at the centre, plain
// voice — plus what v1 left open: the dock opens to reorder and remove (↑ ↓ ✕, 44 px, no dragging needed, Undo after a
// removal), the name suggested from the artist as real text, «Add all N», the paste report, name missing, creating,
// created (Blend it now / Open the series), could not save, guest. Every text is the agent's proposal (copy table in
// proposal.md § Rodada 2). Elements with data-dec carry a default the agent took: «decidido pelo agente — revisável».
(function () {
  const E = F79.esc;
  const ph = () => F79.phone();
  const tap = () => (ph() ? 'Tap' : 'Click');
  const icon = {
    plus: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    up: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>'
  };
  // The equalizer: still = ready; moving = waiting for an answer (the catalog, the save); flat = no answer came.
  const eq = (state, n = 48, inv = 'HOME-16') => `<div class="t-eq ${state}" aria-hidden="true" data-inv="${inv}" data-dec="D6 · o que o equalizador quer dizer">${Array.from({ length: n }, (_, i) => `<i style="--h:${(0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.37))).toFixed(2)};--d:${(i % 7) * -0.13}s"></i>`).join('')}</div>`;
  const cover = (a, size = '100x100') => a.cover
    ? `<img class="f79-cover-img" src="${a.cover.replace('300x300', size)}" alt="">`
    : `<span class="t-phcv" aria-hidden="true"><b>${E(a.title.split(' ').map((w) => w[0]).join('').slice(0, 2))}</b></span>`;
  const anyResults = (m) => m.scan === 'results' || m.scan === 'error';

  function stage(m) {
    const big = !anyResults(m) && m.scan !== 'scanning' && !(m.mode === 'paste' && (m.report || ph()));
    const paste = m.mode === 'paste';
    // One fire at a time: «Search» is the flame only while it is the next thing to do (nothing found yet, nothing chosen)
    const searchFlame = !m.chosen.length && !anyResults(m);
    let field;
    if (paste) {
      const lines = m.paste.split('\n');
      const read = (l) => (/ - /.test(l) ? 'ok' : 'bad');
      const ok = lines.filter((l) => read(l) === 'ok').length;
      field = `<div class="t-field t-paste" data-inv="HOME-05">
        <label class="t-paste-lbl" for="tPaste">Your list · one album per line, as Artist - Album</label>
        <div class="t-lines" id="tPaste" role="list">${lines.map((l, i) => {
          const r = m.report ? 'skip' : read(l);
          const tag = r === 'ok' ? `<em class="ok">${icon.check} ready</em>` : r === 'bad' ? '<em class="bad">add « - » between artist and album</em>' : '<em class="bad">not found in the catalog: fix the spelling here</em>';
          const tx = r === 'skip' ? `<input class="tx t-fix" type="text" value="${E(l)}" aria-label="Line ${i + 1}, not found in the catalog: fix the spelling">` : `<span class="tx">${E(l)}</span>`;
          return `<div role="listitem" class="${r}"><span class="n">${i + 1}</span>${tx}${tag}</div>`;
        }).join('')}</div>
        <div class="t-paste-foot">${m.report
          ? `<span role="status"><b>Added 2 albums.</b> 1 line was skipped and is still here to fix.</span><button type="button" class="t-btn" data-addlist>Add this line</button>`
          : `<span>${lines.length} lines: ${ok} ready, ${lines.length - ok} to fix. Lines to fix are skipped; the rest go in.</span><button type="button" class="t-btn flame" data-addlist>Add ${ok} albums</button>`}</div></div>`;
    } else {
      const busy = m.scan === 'scanning';
      field = `<div class="t-field ${m.focus ? 'focus' : ''}" data-inv="HOME-04">${icon.search}
        <input id="tQuery" type="text" value="${E(m.query)}" placeholder="An artist, or paste a list of albums" autocomplete="off" aria-label="Search an artist, or paste a list of albums">
        ${m.focus ? '<span class="t-caret" aria-hidden="true"></span>' : ''}
        <button type="button" class="t-btn ${searchFlame ? 'flame' : ''}" data-scan data-dec="D8 · um fogo por vez" ${busy ? 'disabled aria-busy="true"' : ''}>${busy ? 'Searching…' : 'Search'}</button></div>`;
    }
    const hint = paste
      ? `Paste or type one album per line. <button type="button" data-mode="artist">Search an artist instead</button>`
      : m.focus ? 'Press Enter or Search to see their albums. A list with one album per line works too.'
        : `Type an artist to see their albums, or <button type="button" data-mode="paste">paste a list</button> of albums from many artists.`;
    const eqState = m.scan === 'scanning' ? 'live' : m.scan === 'error' ? 'flat' : 'still';
    return `<section class="t-stage ${big ? 'big' : 'small'}">
      ${big ? `<div class="t-hero" data-inv="HOME-01"><h1><span class="l1">Pick the albums.</span> <span class="l2">We blend the playlists.</span></h1>
        <p>A series is the set of albums you want to hear together, from one artist or many: the Blend turns it into balanced playlists.</p></div>` : ''}
      ${field}
      <p class="t-hint" data-inv="HOME-03">${hint}</p>
      ${m.guest && ph() ? `<p class="t-guest" data-inv="HOME-23" data-dec="D7 · o aviso de visitante">You're not signed in: the series is saved to this browser only. <button type="button">Sign in</button> to keep it on every device.</p>` : ''}
      ${eq(eqState, ph() ? 32 : 48)}
    </section>`;
  }

  function results(m) {
    if (m.mode === 'paste') {
      return m.report ? `<p class="t-note-ill">The two albums from the list are in your series below. Their covers here are placeholders: the prototype has only the Pink Floyd covers.</p>` : '';
    }
    if (m.scan === 'idle') return `<ol class="t-how" data-inv="HOME-13"><li><b>1</b><span><strong>Find</strong>an artist, or paste a list</span></li><li><b>2</b><span><strong>Add</strong>the albums you want, in the order you want</span></li><li><b>3</b><span><strong>Create</strong>the series, then blend it</span></li></ol>`;
    if (m.scan === 'scanning') return `<p class="t-wait" role="status" data-inv="HOME-08">Looking for «${E(m.query)}» in the catalog… the covers appear as soon as it answers.</p><div class="t-grid">${Array.from({ length: ph() ? 4 : 12 }, () => '<span class="t-skel"></span>').join('')}</div>`;
    if (m.scan === 'notfound') return `<div class="t-msg" role="status" data-inv="HOME-14"><b>No albums found for «${E(m.query)}».</b><span>Check the spelling, or paste the albums as a list: one per line, Artist - Album.</span><button type="button" class="t-btn" data-mode="paste">Paste a list</button></div>`;
    if (m.scan === 'error') return `<div class="t-msg err" role="alert" data-inv="HOME-14"><b>The catalog did not answer in 15 seconds.</b><span>Your series still has its ${m.chosen.length} albums. Try again in a moment.</span><button type="button" class="t-btn" data-scan>Try again</button></div>`;
    const c = F79.counts;
    const chips = [['Studio', c.Albums, 1], ['EPs', c.EPs], ['Singles', c.Singles], ['Live', c.Live], ['Compendiums', c.Compilations, 0, 'D4'], ['Other', c.Uncategorized]]
      .map(([l, n, on, d]) => `<button type="button" class="t-chip ${on ? 'on' : ''}" aria-pressed="${!!on}" ${d ? 'data-dec="D4 · «Compendiums», a palavra do MJRP"' : ''}>${l}${n ? ` · ${n}` : ''}</button>`).join('');
    const all = F79.albums.filter((a) => !m.chosen.includes(a.id)).length;
    const created = m.create === 'created';
    return `${created ? `<p class="t-after" role="status" data-inv="HOME-22">«${E(m.name)}» is saved and won't change here. ${tap()} a cover to start another series.</p>` : ''}<header class="t-artist" data-inv="HOME-08"><div class="t-artist-t"><h2>Pink Floyd</h2><span>17 studio albums · newest first</span></div>
        <div class="t-chips" role="group" aria-label="Album types" data-inv="HOME-06">${chips}</div>
        ${all && !created ? `<button type="button" class="t-btn ghost t-addall" data-addall data-inv="HOME-18" data-dec="D3 · «Add all» existe e só põe o que o filtro mostra">${icon.plus} ${all === 17 ? 'Add all 17 studio albums' : `Add the other ${all}`}</button>` : ''}</header>
      <div class="t-grid" data-inv="HOME-07">${F79.albums.map((a) => {
        const n = created ? 0 : m.chosen.indexOf(a.id) + 1;
        return `<button type="button" class="t-card ${n ? 'in' : ''}" data-id="${a.id}" aria-pressed="${!!n}" aria-label="${E(a.title)}, ${a.year}${n ? `, number ${n} in your series. ${tap()} to take it out` : `. ${tap()} to add it`}"><span class="t-cv"><img class="f79-cover-img" src="${a.cover}" alt="" loading="lazy"><span class="t-mark">${n || icon.plus}</span></span><span class="t-tt">${E(a.title)}</span><span class="t-yy">${a.year}${a.badges.length ? ` · ${E(a.badges.join(', '))}` : ''}</span></button>`;
      }).join('')}</div>`;
  }

  // The name: suggested from the artist as real text (not a placeholder), editable; never a silent «New Album Series»
  function nameField(m) {
    const empty = m.named === 'empty';
    return `<div class="t-namebox ${empty ? 'need' : ''}" data-inv="HOME-02" data-dec="D1 · o nome sugerido pelo artista">
      <label class="t-name-lbl" for="tName">Series name${m.named === 'suggested' ? ' <span class="t-sugg">suggested · edit it</span>' : ''}</label>
      <input class="t-name" id="tName" type="text" value="${E(m.name)}" ${empty ? 'aria-invalid="true" aria-describedby="tNameErr"' : ''} autocomplete="off">
      ${empty ? `<p class="t-name-err" id="tNameErr" role="alert">Give the series a name first. <button type="button" data-usename>Use «${E(F79.suggest)}»</button></p>` : ''}
    </div>`;
  }

  function rows(m) {
    return `<ol class="t-rows">${m.chosen.map((id, i) => {
      const a = F79.byId(id); const last = i === m.chosen.length - 1;
      const moved = m.moved && m.moved.id === id;
      return `<li class="${moved ? 'moved' : ''}"><span class="t-num">${i + 1}</span><span class="t-rcv">${cover(a)}</span>
        <span class="t-rt"><b>${E(a.title)}</b><small>${E(a.artist || 'Pink Floyd')} · ${a.year}${moved ? ' · moved up' : ''}</small></span>
        <span class="t-rbtn"><button type="button" data-up="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Move «${E(a.title)}» up">${icon.up}</button><button type="button" data-down="${i}" ${last ? 'disabled' : ''} aria-label="Move «${E(a.title)}» down">${icon.down}</button><button type="button" data-rm="${i}" aria-label="Remove «${E(a.title)}» from the series">${icon.x}</button></span></li>`;
    }).join('')}</ol>`;
  }

  function undoBar(m) {
    if (!m.undo) return '';
    const text = m.undo.kind === 'remove' ? `Removed «${E(F79.byId(m.undo.id).title)}».` : `Added ${m.undo.n} albums.`;
    return `<div class="t-undo" role="status" data-inv="HOME-21" data-dec="D9 · Undo por 8 segundos, na base"><span>${text}</span><button type="button" data-undo>Undo</button></div>`;
  }

  // The series panel: opens above the dock on the computer, as a full sheet on the phone (it holds a text field)
  function panel(m) {
    if (!m.open) return '';
    const sheet = ph();
    return `<div class="t-panel ${sheet ? 'sheet' : ''}" role="dialog" aria-modal="${sheet}" aria-label="Your series" data-inv="HOME-20">
      <div class="t-panel-h"><h3>Your series <span>${m.chosen.length} album${m.chosen.length > 1 ? 's' : ''}</span></h3><button type="button" class="t-btn ghost" data-close>Done</button></div>
      ${sheet ? nameField(m) : ''}
      <p class="t-order" data-inv="HOME-19">The order counts: the Blend reads the albums in this order when it spreads their tracks over the playlists. Use ↑ ↓ to change it.</p>
      ${rows(m)}
      ${sheet ? `<div class="t-panel-f">${undoBar(m)}${createBtn(m)}</div>` : ''}
    </div>`;
  }

  function createBtn(m) {
    const n = m.chosen.length;
    if (m.create === 'creating') return `<button type="button" class="t-btn flame big" disabled aria-busy="true">Creating…</button>`;
    if (m.create === 'created') return '';
    return `<button type="button" class="t-btn ${n ? 'flame' : ''} big" data-create ${n ? '' : 'disabled'} data-inv="HOME-11">${m.create === 'failed' ? 'Try again' : 'Create series'} ${ph() ? '' : icon.arrow}</button>`;
  }

  function dock(m) {
    const n = m.chosen.length;
    const max = ph() ? 3 : 7;
    const covers = m.chosen.slice(0, max).map((id, i) => `<span class="t-dcv" style="--i:${i}">${cover(F79.byId(id))}<span class="t-dn">${i + 1}</span></span>`).join('') +
      (n > max ? `<span class="t-more">+${n - max}</span>` : '');
    const guest = m.guest && !ph() ? `<p class="t-guest" data-inv="HOME-23" data-dec="D7 · o aviso de visitante">You're not signed in: the series is saved to this browser only. <button type="button">Sign in</button> to keep it on every device.</p>` : '';
    let meta, note, actions;
    if (m.create === 'created') {
      meta = `<b class="t-saved">${icon.check} «${E(m.name)}» is saved</b><span>${n} albums · ${ph() ? 'in Albums' : 'find it any time in Music Series'}.</span>`;
      actions = `<div class="t-go t-go-row" data-inv="HOME-22" data-dec="D2 · depois de criar, «Blend it now» primeiro"><button type="button" class="t-btn ghost">Open the series</button><button type="button" class="t-btn flame big">Blend it now ${ph() ? '' : icon.arrow}</button></div>`;
      note = `<button type="button" class="t-link t-restart" data-restart>Start another series</button>`;
    } else if (!n) {
      meta = ph() ? `<b>No albums yet</b><span>${anyResults(m) ? 'Tap a cover to add it' : 'Search, then tap a cover'}</span>` : `<b>Your series is empty</b><span>${anyResults(m) ? 'Click a cover to add it.' : 'Search an artist, then click a cover to add it.'} You name the series at the end.</span>`;
      actions = `<div class="t-go"><small data-inv="HOME-12">Add one album to create the series</small>${createBtn(m)}</div>`;
      note = '';
    } else {
      const status = m.create === 'creating' ? `<span class="t-busy">${eq('live', 5, 'HOME-16')} Saving your series…</span>`
        : m.create === 'failed' ? `<span class="t-fail" role="alert">${ph() ? 'Not saved: the connection dropped' : 'The series was not saved: the connection dropped. Your albums are still here.'}</span>`
          : `<span>${n} album${n > 1 ? 's' : ''}${m.chosen.some((id) => id.startsWith('x-')) ? ' from 2 artists' : ' from 1 artist'} · the order counts</span>`;
      if (ph()) {
        meta = `<button type="button" class="t-dock-open" data-open aria-label="Your series: ${n} albums, ${E(m.name || 'no name yet')}. ${tap()} to edit"><b>${E(m.name || 'No name yet')}</b>${status}<small>${tap()} to edit or reorder</small></button>`;
      } else {
        meta = `${nameField(m)}${status}`;
      }
      actions = `<div class="t-go">${ph() ? '' : `<button type="button" class="t-btn ghost" data-open data-inv="HOME-19">${m.open ? 'Done' : 'Edit order'}</button>`}${createBtn(m)}</div>`;
      note = ph() ? '' : `<small class="t-next" data-inv="HOME-12">Next: the Blend turns the series into playlists.</small>`;
    }
    return `<div class="t-dockwrap">${m.open && !ph() ? panel(m) : ''}${m.open && ph() ? '' : undoBar(m)}
      <div class="t-dock ${n ? 'full' : ''} ${m.create === 'created' ? 'done' : ''}" role="region" aria-label="Your series" data-inv="HOME-09">
        ${guest}
        <div class="t-dock-row">
          <div class="t-pile" data-inv="HOME-10" data-n="${n}" ${ph() && n ? 'data-open' : ''}>${n ? covers : '<span class="t-slot"></span><span class="t-slot"></span><span class="t-slot"></span>'}</div>
          <div class="t-meta">${meta}</div>
          ${actions}
        </div>
        ${note}
      </div></div>${m.open && ph() ? `<div class="t-scrim"></div>${panel(m)}` : ''}`;
  }

  window.LEVEL = {
    name: 'Transformar v2',
    render(m, root) {
      document.body.classList.toggle('t-sheet-open', !!(m.open && ph()));
      root.innerHTML = `<div class="t-wrap ${m.chosen.length > 7 ? 'many' : ''}">${stage(m)}<section class="t-results">${results(m)}</section>${dock(m)}</div>`;
      root.onclick = (e) => {
        const t = e.target.closest('button,[data-open]'); if (!t) return;
        const d = t.dataset; const ch = m.chosen.slice();
        if (d.mode) return F79.set({ mode: d.mode, report: false, paste: 'Joni Mitchell - Hejira\nYes - Close to the Edge\nRadiohead OK Computer\nCaravan - In the Land of Grey and Pinkk', scan: 'idle' });
        if ('scan' in d) {
          F79.set({ scan: 'scanning', query: root.querySelector('#tQuery')?.value || 'Pink Floyd', mode: 'artist', focus: false });
          return setTimeout(() => F79.set({ scan: 'results' }), F79.reduced() ? 300 : 1400);
        }
        if ('addlist' in d) return F79.scenario('pastereport');
        if ('addall' in d) { const add = F79.albums.map((a) => a.id).filter((id) => !ch.includes(id)); return F79.set({ chosen: [...ch, ...add], undo: { kind: 'addall', n: add.length, before: ch }, name: m.name || F79.suggest, named: m.named === 'none' ? 'suggested' : m.named }); }
        if ('undo' in d) {
          if (m.undo.kind === 'remove') { ch.splice(m.undo.at, 0, m.undo.id); return F79.set({ chosen: ch, undo: null }); }
          return F79.set({ chosen: m.undo.before || ch.slice(0, ch.length - m.undo.n), undo: null });
        }
        if ('open' in d) return F79.set({ open: !m.open, moved: null });
        if ('close' in d) return F79.set({ open: false, moved: null });
        if (d.up) { const i = +d.up; [ch[i - 1], ch[i]] = [ch[i], ch[i - 1]]; return F79.set({ chosen: ch, moved: { id: ch[i - 1], to: i } }); }
        if (d.down) { const i = +d.down; [ch[i + 1], ch[i]] = [ch[i], ch[i + 1]]; return F79.set({ chosen: ch, moved: null }); }
        if (d.rm) { const i = +d.rm; const id = ch.splice(i, 1)[0]; return F79.set({ chosen: ch, undo: { kind: 'remove', id, at: i }, moved: null }); }
        if ('usename' in d) return F79.set({ name: F79.suggest, named: 'suggested', create: 'idle' });
        if ('create' in d) {
          const name = root.querySelector('#tName')?.value ?? m.name;
          if (!name.trim()) return F79.set({ name: '', named: 'empty', create: 'noname', open: ph() });
          F79.set({ create: 'creating', open: false, undo: null, name });
          return setTimeout(() => F79.set({ create: 'created' }), F79.reduced() ? 300 : 1400);
        }
        if ('restart' in d) return F79.scenario('results');
        if (d.id && m.create === 'created') return F79.set({ chosen: [d.id], create: 'idle', name: F79.suggest, named: 'suggested', undo: null });
        if (d.id) {
          const id = d.id; const i = ch.indexOf(id);
          if (i >= 0) { ch.splice(i, 1); return F79.set({ chosen: ch, undo: { kind: 'remove', id, at: i } }); }
          return F79.set({ chosen: [...ch, id], undo: null, name: m.name || F79.suggest, named: m.named === 'none' ? 'suggested' : m.named, create: 'idle' });
        }
      };
      root.oninput = (e) => { if (e.target.id === 'tName') { m.name = e.target.value; m.named = 'edited'; } };
    }
  };
})();
