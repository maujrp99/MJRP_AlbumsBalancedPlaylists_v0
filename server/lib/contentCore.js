/**
 * The validators of the CMS content (F93, REQ-05) live in shared/content/, ES modules the Painel and
 * the site use too. The server is CommonJS, so it loads them once, on first use, the same way it
 * loads the other shared modules (lib/albumIdentity.js).
 *
 * const { validateSwitches, switchValue } = await loadSwitches()
 */
let loading = null

function loadSwitches () {
  if (!loading) {
    loading = import('../../shared/content/switches.js').catch(error => {
      loading = null // a failed load is asked again, not remembered
      throw error
    })
  }
  return loading
}

module.exports = { loadSwitches }
