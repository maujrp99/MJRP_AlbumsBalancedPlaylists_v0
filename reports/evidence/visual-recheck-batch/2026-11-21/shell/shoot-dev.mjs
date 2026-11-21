// States B, C, D, E on the DEV server (http://127.0.0.1:5404): Chrome headless over the DevTools protocol.
// The seam (stub.mjs) is only the raw catalog call; the real AlbumSearchService and classifier do the rest.
// Nothing is written: no series is created, Save is never clicked, and the signed-in pass blocks Firestore.
//   node shoot-dev.mjs visitor    (B, C, D, E as a visitor)
//   node shoot-dev.mjs signedin   (D, E with a stand-in account, shell only)
import { openPage, SIZES, sleep, saveMeasures } from './lib.mjs'
import { startStates, windowStates, barStates } from './states.mjs'
import { SITE, J, load } from './stub.mjs'
const mode = process.argv[2] || 'visitor'
const page = await openPage()
async function visitorPass() {
  const sizes = SIZES
  for (const size of sizes) {
    const tag = size.tag
    await page.setSize(size)
    await startStates(page, size)
    await windowStates(page, size)
    await barStates(page, size, 'visitor')
  }
  saveMeasures('measures-dev-visitor.json')
}
const WRITE_ACCOUNT = `(async () => {
  const apiKey = (window.__firebase_config && window.__firebase_config.apiKey) || 'API_KEY_PLACEHOLDER'
  const exp = Date.now() + 36e5 * 24 * 365
  const sts = { refreshToken: 'fake-refresh', accessToken: 'fake.access.token', expirationTime: exp }
  const user = { uid: 'test-uid-visual-recheck', email: 'tester@example.invalid', emailVerified: true, displayName: 'Test Account', isAnonymous: false, photoURL: null, providerData: [], apiKey: apiKey, appName: '[DEFAULT]', stsTokenManager: sts, createdAt: String(Date.now()), lastLoginAt: String(Date.now()) }
  const db = await new Promise((res, rej) => {
    const q = indexedDB.open('firebaseLocalStorageDb', 1)
    q.onupgradeneeded = () => { if (q.result.objectStoreNames.contains('firebaseLocalStorage') === false) q.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' }) }
    q.onsuccess = () => res(q.result)
    q.onerror = () => rej(q.error)
  })
  const fbase_key = 'firebase:authUser:' + apiKey + ':[DEFAULT]'
  await new Promise((res, rej) => {
    const tx = db.transaction('firebaseLocalStorage', 'readwrite')
    tx.objectStore('firebaseLocalStorage').put({ fbase_key: fbase_key, value: user })
    tx.oncomplete = res
    tx.onerror = () => rej(tx.error)
  })
  db.close()
  return fbase_key
})()`
const HOSTS = ['firestore', 'identitytoolkit', 'securetoken']
const blocked = HOSTS.map((h) => String.fromCharCode(42) + h + '.googleapis.com' + String.fromCharCode(42))
async function signedInPass() {
  const first = SIZES[0]
  await page.send('Network.enable')
  await page.send('Network.setBlockedURLs', { urls: blocked })
  await page.setSize(first)
  await load(page, 'start')
  const key = await page.run(WRITE_ACCOUNT)
  console.log('stand-in account written, key ' + key)
  for (const size of SIZES) {
    const tag = size.tag
    await page.setSize(size)
    await barStates(page, size, 'account')
  }
  saveMeasures('measures-dev-account.json')
}
if (mode === 'visitor') await visitorPass()
if (mode === 'account') await signedInPass()
page.close()
