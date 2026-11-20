/**
 * Checks a Firebase login (ID token) without the Admin SDK (F59, slice C).
 *
 * A Firebase ID token is a JWT signed by Google with RS256. It is accepted only when:
 *   - its signature checks against one of Google's public keys for Firebase logins;
 *   - it was issued for THIS project (`aud`) by Firebase for this project (`iss`);
 *   - it is not expired, and was not issued in the future (60 s of clock difference allowed there);
 *   - it names a person (`sub`).
 * The keys are fetched through `fetchKeys` (injected, so this file has no network of its own) and
 * kept for as long as Google says they are valid. A token that names a key not yet known makes
 * one new fetch: Google rotates the keys.
 *
 * verify(token) -> Promise<{ uid, anonymous }>, or throws AuthError:
 *   code 'invalid'      the token is missing, malformed, not ours, expired or badly signed
 *   code 'unavailable'  the keys could not be fetched: nobody is let in
 */
const crypto = require('crypto')

const CLOCK_SKEW_SECONDS = 60

class AuthError extends Error {
  constructor (code, message) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

function decodePart (text) {
  try {
    return JSON.parse(Buffer.from(text, 'base64url').toString('utf8'))
  } catch {
    throw new AuthError('invalid', 'token part is not readable')
  }
}

function createIdTokenVerifier ({ projectId, fetchKeys, now = () => Date.now() }) {
  if (!projectId) throw new Error('createIdTokenVerifier needs the projectId')
  let known = { keys: {}, validUntil: 0 }

  async function loadKeys (force) {
    if (!force && now() < known.validUntil) return known.keys
    let fetched
    try {
      fetched = await fetchKeys()
    } catch {
      throw new AuthError('unavailable', 'the keys that check a login could not be fetched')
    }
    const maxAgeSeconds = Number(fetched && fetched.maxAgeSeconds) > 0 ? Number(fetched.maxAgeSeconds) : 300
    known = { keys: (fetched && fetched.keys) || {}, validUntil: now() + maxAgeSeconds * 1000 }
    return known.keys
  }

  async function keyFor (kid) {
    let keys = await loadKeys(false)
    if (!keys[kid]) keys = await loadKeys(true)
    if (!keys[kid]) throw new AuthError('invalid', 'the token names a key that is not known')
    return keys[kid]
  }

  async function verify (token) {
    if (typeof token !== 'string' || token.split('.').length !== 3) {
      throw new AuthError('invalid', 'not a token')
    }
    const [headText, bodyText, signatureText] = token.split('.')
    const head = decodePart(headText)
    const claims = decodePart(bodyText)

    if (head.alg !== 'RS256' || !head.kid) throw new AuthError('invalid', 'not signed the way Firebase signs')
    const pem = await keyFor(head.kid)

    let signed = false
    try {
      signed = crypto.verify(
        'RSA-SHA256',
        Buffer.from(`${headText}.${bodyText}`),
        crypto.createPublicKey(pem),
        Buffer.from(signatureText, 'base64url')
      )
    } catch {
      signed = false
    }
    if (!signed) throw new AuthError('invalid', 'bad signature')

    const nowSeconds = Math.floor(now() / 1000)
    if (claims.aud !== projectId) throw new AuthError('invalid', 'issued for another project')
    if (claims.iss !== `https://securetoken.google.com/${projectId}`) throw new AuthError('invalid', 'issued by someone else')
    if (!(Number(claims.exp) > nowSeconds)) throw new AuthError('invalid', 'expired')
    if (!(Number(claims.iat) <= nowSeconds + CLOCK_SKEW_SECONDS)) throw new AuthError('invalid', 'issued in the future')
    if (typeof claims.sub !== 'string' || claims.sub.length === 0) throw new AuthError('invalid', 'names nobody')

    const provider = claims.firebase && claims.firebase.sign_in_provider
    return { uid: claims.sub, anonymous: provider === 'anonymous' }
  }

  return { verify }
}

module.exports = { createIdTokenVerifier, AuthError }
