/**
 * The validators of the CMS content (F93, REQ-05; F82, REQ-03) live in shared/content/, ES modules the Painel and
 * the site use too. The server is CommonJS, so it loads them once, on first use, the same way it
 * loads the other shared modules (lib/albumIdentity.js).
 *
 * const { validateSwitches, switchValue } = await loadSwitches()
 * const { validateAlbum, artPathOf } = await loadCrate()
 */
const loading = {}

/** One module of shared/content, loaded once; a failed load is asked again, not remembered. */
function load (name, importIt) {
  if (!loading[name]) {
    loading[name] = importIt().catch(error => {
      loading[name] = null
      throw error
    })
  }
  return loading[name]
}

const loadSwitches = () => load('switches', () => import('../../shared/content/switches.js'))
const loadCrate = () => load('crate', () => import('../../shared/content/crate.js'))

module.exports = { loadSwitches, loadCrate }
