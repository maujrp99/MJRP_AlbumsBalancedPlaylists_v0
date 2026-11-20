/**
 * The one rule of "is this the album asked for" (F55) lives in shared/albumIdentity.js, an ES
 * module the app uses too. The server is CommonJS, so it loads the rule once, on first use, the
 * same way it loads the other shared modules (shared/normalize.js).
 *
 * const { pickAlbum, compareAlbumIdentity, albumFromLabel, sameArtist } = await loadAlbumIdentity()
 */
let loading = null

function loadAlbumIdentity () {
  if (!loading) {
    loading = import('../../shared/albumIdentity.js').catch(error => {
      loading = null // a failed load is asked again, not remembered
      throw error
    })
  }
  return loading
}

module.exports = { loadAlbumIdentity }
