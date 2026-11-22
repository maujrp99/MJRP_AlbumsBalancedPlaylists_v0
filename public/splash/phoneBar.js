/**
 * phoneBar - the icon above each label of the phone's bottom menu (F88): ONE small module of the site, drawn from by the
 * home (menu.js) and by the app (components/navigation/barMenu.js), so that the bottom menu is the same component in both and
 * the passage from the home to the app does not jolt (the owner, on his iPhone, 2026-11-21: «Os menus não eram pra ser
 * iguais?»). The look is public/splash/bar-menu.css, rules scoped by `.pbar`. Lucide-style strokes, drawn in the colour of the label.
 */

/** The icon is this many pixels square (bar-menu.css draws the same). */
export const STOP_ICON_SIZE = 24

const ICON_BODY = Object.freeze({
    // Create is where a series begins (search an artist, paste a list; its address is still /start). The owner's choice (2026-11-22:
    // «E ao invés de um ícone de go seja algo relacionado a adição?», «confirmo, ajuste e já pode publicar»): a plus, the same two strokes
    // as the app's Plus icon (components/Icons.js), drawn in outline strokes like the other four. A picture, not a text: it is in no dictionary.
    start: '<line x1="12" x2="12" y1="4" y2="20"/><line x1="4" x2="20" y1="12" y2="12"/>',
    albums: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>',
    blend: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
    playlists: '<path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/>',
    inventory: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>'
})

/** The app calls its first stop «home»; the home's menu calls it «start»: the same stop. */
const ALIAS = Object.freeze({ home: 'start' })

/**
 * @param {string} id - the stop: start (or home), albums, blend, playlists, inventory
 * @returns {string} the icon as one `<svg class="ic">`; empty for an id no stop has
 */
export function stopIcon(id) {
    const body = ICON_BODY[ALIAS[id] || id]
    if (!body) return ''
    return `<svg class="ic" xmlns="http://www.w3.org/2000/svg" width="${STOP_ICON_SIZE}" height="${STOP_ICON_SIZE}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`
}
