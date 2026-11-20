// F79 · «Referência»: the Home of today, exactly as the app drew it in each captured state (no change). Two states were
// not captured as such and are derived from a captured one, said on the screen: «error» (the not-found capture with the
// texts the app shows on a failed scan, read from models/scanState.js) and, at 393 px, «scanning» (the empty capture
// with the scanning texts: the phone answered from the cache too fast to catch it).
window.REF_STATE = { empty: 'empty', scanning: 'scanning', results: 'results', chosen: 'chosen', paste: 'bulk', error: 'notfound', notfound: 'notfound' };
window.refHome = function (m, root) {
  const w = F79.phone() ? '393' : '1280';
  let s = REF_STATE[m.s];
  if (m.s === 'scanning' && w === '393') s = 'empty';
  root.innerHTML = window.DATA.refApp[s][w];
  const panel = root.querySelector('#discographyGrid');
  const swap = (title, detail) => {
    const ps = panel ? [...panel.querySelectorAll('p, h3, span')] : [];
    const t = ps.find((p) => /No albums found|Search for an artist/.test(p.textContent));
    if (t) t.textContent = title;
    const d = ps.find((p) => /Check the spelling/.test(p.textContent));
    if (d) d.textContent = detail;
  };
  if (m.s === 'error') {
    swap('The catalog did not answer in 15 seconds.', 'Nothing was changed. You can ask again.');
    const st = root.querySelector('#statusArtistName'); if (st) st.textContent = '→ Search failed';
    const input = root.querySelector('#artistScanInput'); if (input) input.value = 'Pink Floyd';
  }
  if (m.s === 'scanning' && w === '393') {
    swap('Searching the catalog for «Pink Floyd»…', 'The albums appear as soon as the catalog answers.');
    const input = root.querySelector('#artistScanInput'); if (input) input.setAttribute('value', 'Pink Floyd');
  }
  // What the person typed is not in the captured markup (a field's value is not an attribute): put it back
  const set = (sel, v) => { const e = root.querySelector(sel); if (e && v) e.value = v; };
  set('#artistScanInput', m.s === 'notfound' ? m.query : (m.query || (m.s === 'paste' ? 'Pink Floyd' : '')));
  set('#seriesNameInput', m.s === 'paste' ? 'Floyd, the long ones' : m.name);
  set('#bulkPasteInput', m.paste);
  return root;
};
window.LEVEL = { name: 'Referência', render: (m, root) => window.refHome(m, root) };
