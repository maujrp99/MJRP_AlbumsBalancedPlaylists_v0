// is the seeded person really signed in? (asked of the branch's build and of main's)
import { webkit, devices } from '@playwright/test'
const API_KEY = 'AIzaSyA8x-II628CK3qQmmfr-WJE13LXdu7nAxs'
for (const base of process.argv.slice(2)) {
    const b = await webkit.launch()
    const c = await b.newContext({ ...devices['iPhone 14'], viewport: { width: 393, height: 852 }, reducedMotion: 'reduce' })
    const p = await c.newPage()
    await p.route(/identitytoolkit|securetoken|firestore\.googleapis|firebaseinstallations/, r => r.abort())
    await p.route(/mzstatic\.com/, r => r.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"/>' }))
    await p.route(/\/api\/musickit-token/, r => r.fulfill({ contentType: 'application/json', body: '{"token":"t"}' }))
    await p.route(/js-cdn\.music\.apple\.com/, r => r.fulfill({ contentType: 'application/javascript', body: 'window.MusicKit={configure:async()=>{},getInstance:()=>({storefrontId:"us",api:{music:async(path)=>/search$/.test(path)?{data:{results:{artists:{data:[{id:"x"}]}}}}:{data:{data:[{id:"a1",attributes:{name:"One",artistName:"Pink Floyd",releaseDate:"1970-01-01",artwork:{url:"https://is1-ssl.mzstatic.com/{w}x{h}.jpg"}}}]}}}})}' }))
    await p.addInitScript((apiKey) => {
        const user = { uid: 'proof-user', email: 'proof@example.test', emailVerified: true, displayName: 'Proof', isAnonymous: false, providerData: [{ providerId: 'google.com', uid: 'proof', displayName: 'Proof', email: 'proof@example.test', phoneNumber: null, photoURL: null }], stsTokenManager: { refreshToken: 'r', accessToken: 'a', expirationTime: Date.now() + 3600e3 }, createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey, appName: '[DEFAULT]' }
        const open = indexedDB.open('firebaseLocalStorageDb', 1)
        open.onupgradeneeded = () => { open.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' }) }
        open.onsuccess = () => { const tx = open.result.transaction('firebaseLocalStorage', 'readwrite'); tx.objectStore('firebaseLocalStorage').put({ fbase_key: `firebase:authUser:${apiKey}:[DEFAULT]`, value: user }) }
    }, API_KEY)
    await p.goto(base + '/start'); await p.waitForTimeout(3000)
    await p.fill('#artistScanInput', 'Pink Floyd'); await p.keyboard.press('Enter'); await p.waitForTimeout(1200)
    await p.click('#discographyGrid [data-action="pick-album"]'); await p.waitForTimeout(600)
    console.log(base, JSON.stringify(await p.evaluate(() => ({ guestHidden: document.querySelector('#homeGuestStage')?.hidden, guest: document.querySelector('#homeGuestStage')?.innerText, bar: !!document.querySelector('.home-dock.phone-action-bar'), signedMenu: document.body.innerText.includes('Sign in') }))))
    await b.close()
}
