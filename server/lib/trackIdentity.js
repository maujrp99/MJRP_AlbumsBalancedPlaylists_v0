/**
 * The one rule of "is this the same track" (F74) lives in shared/trackIdentity.js, an ES module
 * the app uses too. The server is CommonJS, so it loads the rule once, on first use, the same way
 * it loads the album rule (lib/albumIdentity.js).
 *
 * const { matchTracks, TRACK_IDENTITY_RULE_VERSION } = await loadTrackIdentity()
 */
let loading = null

function loadTrackIdentity () {
  if (!loading) {
    loading = import('../../shared/trackIdentity.js').catch(error => {
      loading = null // a failed load is asked again, not remembered
      throw error
    })
  }
  return loading
}

module.exports = { loadTrackIdentity }
