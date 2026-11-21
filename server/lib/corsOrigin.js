// Who may call the server from a browser, in production (F87).
// The explicit list (ALLOWED_ORIGIN) stays the rule. On top of it, the preview channels of the
// SAME Firebase Hosting site are accepted: https://<site>--<channel>-<hash>.web.app, where <site>
// is the site id of the first listed origin. Anchored at both ends, https only, lower case only.

const HOSTING_ORIGIN = /^https:\/\/([a-z0-9][a-z0-9-]*)\.web\.app$/

function escapeRegExp (text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// The Hosting site id of the first listed origin, or '' when it is not a <site>.web.app address
function hostingSiteId (allowed) {
  const match = HOSTING_ORIGIN.exec((allowed && allowed[0]) || '')
  return match ? match[1] : ''
}

// The pattern of a preview channel's address for that site; null when there is no site
function previewOriginPattern (siteId) {
  if (!siteId) return null
  return new RegExp('^https://' + escapeRegExp(siteId) + '--[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]+\\.web\\.app$')
}

// Pure: is this Origin header accepted? No header at all (curl, server to server) passes.
function isOriginAllowed (origin, allowed) {
  if (!origin) return true
  if ((allowed || []).includes(origin)) return true
  const pattern = previewOriginPattern(hostingSiteId(allowed))
  return Boolean(pattern && pattern.test(origin))
}

module.exports = { isOriginAllowed, hostingSiteId, previewOriginPattern }
