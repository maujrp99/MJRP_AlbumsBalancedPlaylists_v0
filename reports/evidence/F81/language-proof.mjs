// F81 (TASK-02, TASK-03) browser proof of the language of the app on the BUILT site, in Chromium and WebKit, at 1280 and 390, as a visitor and signed in:
//
//   BASE=http://127.0.0.1:<port> node reports/evidence/F81/language-proof.mjs        (the site: `vite build`, then `vite preview`)
//
// The country: Firebase Hosting answers /country.json by the visitor's country (dist/geo/ALL_br/country.json to Brazil, dist/country.json to everybody
// else). `vite preview` does not do that swap, so the proof does it at the network layer: «br» answers with the very file of dist/geo/ALL_br, «other» lets
// the preview answer with dist/country.json, «unreadable» aborts the request. The swap itself, on Firebase Hosting, is NOT proved here.
//
// HOSTING=1 BASE=http://127.0.0.1:<port> runs a second, short proof against the Firebase Hosting EMULATOR serving dist/ with this firebase.json
// (`firebase emulators:start --only hosting --project demo-…`, no account, nothing published): there the swap is done by Firebase's own code, and the
// country is told with the cookie Firebase documents for testing, `firebase-country-override`. Its results go to hosting-emulator-proof.json.
//
// Firebase is a stand-in at the network layer (a fake account, a fake administrator record, fake published/* documents); every other outside host is
// aborted, the music hosts first of all. Nothing here opens or controls an app of this Mac, no link that leaves the site is clicked, no password is typed.
import fs from 'node:fs'
import path from 'node:path'
import { chromium, webkit } from '@playwright/test'
import { firestoreStub } from '../F82/texts-panel/firestoreStub.mjs'
import { pt } from '../../../public/js/i18n/pt/index.js'
import { en } from '../../../public/js/i18n/en/index.js'

const HERE = path.dirname(new URL(import.meta.url).pathname)
const ROOT = path.resolve(HERE, '../../..')
const OUT = path.join(HERE, 'raw')
fs.mkdirSync(OUT, { recursive: true })
const origin = process.env.BASE
if (!origin) throw new Error('BASE=http://127.0.0.1:<port> is needed')
const BRAZIL = fs.readFileSync(path.join(ROOT, 'dist/geo/ALL_br/country.json'), 'utf8')
const LANG_KEY = 'albumblender:lang'

const NEVER = /music\.apple\.com|itunes\.apple\.com|geo\.music\.apple\.com|open\.spotify\.com|accounts\.spotify\.com|^music:|^itms:|^spotify:/
const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const now = Math.floor(Date.now() / 1000)
const tokenOf = (uid, provider) => `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({ iss: 'https://securetoken.google.com/x', aud: 'x', auth_time: now, user_id: uid, sub: uid, iat: now, exp: now + 86400, firebase: { sign_in_provider: provider } })}.sig`
const ID_TOKEN = tokenOf('preview-uid', 'password')
const ANON_TOKEN = tokenOf('guest-uid', 'anonymous')

const results = []
const say = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`) }

// What the page ever showed, frame by frame, of a few words of each language: the proof that the other language never flashed.
const WATCH = `(() => {
  const words = { en: ['Loading...', 'Create', 'Sign In', 'Inventory', 'Language'], pt: ['Carregando...', 'Criar', 'Entrar', 'Acervo', 'Idioma'] }
  window.__seen = { en: [], pt: [] }
  const look = () => {
    const text = document.body ? document.body.innerText : ''
    for (const lang of ['en', 'pt']) for (const word of words[lang]) if (!window.__seen[lang].includes(word) && new RegExp('(^|[^A-Za-zÀ-ÿ])' + word.replace(/\\./g, '\\\\.') + '($|[^A-Za-zÀ-ÿ])').test(text)) window.__seen[lang].push(word)
    requestAnimationFrame(look)
  }
  look()
})()`

async function world(browser, { width, account, locale }) {
  const stub = firestoreStub({
    'cmsAdmins/preview-uid': { role: 'super' },
    'published/texts_en': { _schemaVersion: 1, rev: 1, texts: {} },
    'published/texts_pt': { _schemaVersion: 1, rev: 1, texts: {} },
    'published/site': { _schemaVersion: 1, rev: 1, switches: {} },
  })
  const state = { country: 'other', asked: 0 }
  const errors = []
  const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, hasTouch: width < 600, reducedMotion: 'reduce', deviceScaleFactor: 1, locale })
  await ctx.addInitScript(() => { window.MusicKit = { configure: async () => {}, getInstance: () => ({ isAuthorized: false, api: { music: async () => ({ data: { data: [] } }) } }) } })
  await ctx.addInitScript(WATCH)
  await ctx.route('**/*', async (route) => {
    const url = route.request().url()
    if (NEVER.test(url)) return route.abort('blockedbyclient')
    if (url.split('?')[0] === origin + '/country.json') {
      state.asked += 1
      if (process.env.HOSTING) return route.continue() // the emulator of Firebase Hosting answers by the cookie
      if (state.country === 'br') return route.fulfill({ status: 200, contentType: 'application/json', body: BRAZIL })
      if (state.country === 'unreadable') return route.abort('failed')
      return route.continue()
    }
    if (url.startsWith(origin + '/api/')) return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"fixture"}' })
    if (url.startsWith(origin + '/assets/data/')) return route.fulfill({ status: 200, contentType: 'application/json', body: fs.readFileSync(path.join(ROOT, 'public', new URL(url).pathname)) })
    if (url.startsWith(origin) || url.startsWith('data:')) return route.continue()
    if (url.includes('firestore.googleapis.com')) return stub.handle(route).catch(() => {})
    if (url.includes('identitytoolkit.googleapis.com') && url.includes('accounts:signUp')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ idToken: ANON_TOKEN, refreshToken: 'fixture', expiresIn: '3600', localId: 'guest-uid' }) })
    if (url.includes('identitytoolkit.googleapis.com') && url.includes('accounts:lookup')) {
      const user = account
        ? { localId: 'preview-uid', email: 'preview@example.invalid', displayName: 'Admin', emailVerified: true, providerUserInfo: [{ providerId: 'password', federatedId: 'preview@example.invalid', email: 'preview@example.invalid' }] }
        : { localId: 'guest-uid' }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ users: [{ ...user, lastLoginAt: String(Date.now()), createdAt: String(Date.now()) }] }) })
    }
    if (url.includes('securetoken.googleapis.com')) {
      const token = account ? ID_TOKEN : ANON_TOKEN
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ access_token: token, id_token: token, expires_in: '3600', token_type: 'Bearer', refresh_token: 'fixture', user_id: account ? 'preview-uid' : 'guest-uid', project_id: 'x' }) })
    }
    return route.abort('blockedbyclient')
  })
  const page = await ctx.newPage()
  page.on('pageerror', (error) => errors.push('pageerror: ' + error.message))
  if (account) {
    // the first page signs a guest in by itself: that request ends before the stand-in account is written
    const guest = page.waitForResponse((response) => response.url().includes('accounts:signUp'), { timeout: 8000 }).catch(() => {})
    await page.goto(origin + '/start', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__firebase_config)
    await guest
    await page.waitForTimeout(500)
    await page.evaluate(async (token) => {
      const apiKey = window.__firebase_config.apiKey
      const user = { uid: 'preview-uid', email: 'preview@example.invalid', emailVerified: true, displayName: 'Admin', isAnonymous: false, photoURL: null, providerData: [{ providerId: 'password', uid: 'preview@example.invalid', displayName: 'Admin', email: 'preview@example.invalid', phoneNumber: null, photoURL: null }], apiKey, appName: '[DEFAULT]', stsTokenManager: { refreshToken: 'fixture', accessToken: token, expirationTime: Date.now() + 36e5 * 24 }, createdAt: String(Date.now()), lastLoginAt: String(Date.now()) }
      const db = await new Promise((res, rej) => { const q = indexedDB.open('firebaseLocalStorageDb', 1); q.onupgradeneeded = () => { if (!q.result.objectStoreNames.contains('firebaseLocalStorage')) q.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' }) }; q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error) })
      await new Promise((res, rej) => { const tx = db.transaction('firebaseLocalStorage', 'readwrite'); tx.objectStore('firebaseLocalStorage').put({ fbase_key: 'firebase:authUser:' + apiKey + ':[DEFAULT]', value: user }); tx.oncomplete = res; tx.onerror = () => rej(tx.error) })
      db.close()
    }, ID_TOKEN)
  }
  return { ctx, page, state, errors }
}

const phoneOf = (width) => width < 600
/** Opens a page of the app and waits for the shell to be drawn. */
async function open(page, width, address = '/start') {
  await page.goto(origin + address, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector(phoneOf(width) ? '#phone-tabbar a' : '#top-menu-bar a', { timeout: 20000 })
  await page.waitForTimeout(900)
}
const facts = (page, width) => page.evaluate(({ phone, key }) => ({
  lang: document.documentElement.lang,
  create: (phone ? document.querySelector('#phone-tabbar a[href="/start"]') : document.querySelector('#top-menu-bar a[href="/start"]'))?.textContent.trim(),
  seen: window.__seen,
  choice: window.localStorage.getItem(key),
  wide: document.documentElement.scrollWidth > window.innerWidth + 1,
}), { phone: phoneOf(width), key: LANG_KEY })
const menuOf = (width) => (phoneOf(width) ? '#phone-menu' : '#userMenu')
async function openMenu(page, width) {
  if (phoneOf(width)) await page.locator('#phoneMenuBtn').tap()
  else await page.locator('#userMenuBtn').click()
  await page.locator(`${menuOf(width)} [data-language-picker] button[data-lang="pt"]`).waitFor({ state: 'visible', timeout: 5000 })
  await page.waitForTimeout(300)
}
const picker = (page, width) => page.evaluate((menu) => {
  const group = document.querySelector(`${menu} [data-language-picker]`)
  const rows = [...group.querySelectorAll('button[data-lang]')]
  const box = (el) => { const r = el.getBoundingClientRect(); return { height: Math.round(r.height), inside: r.left >= 0 && r.right <= window.innerWidth + 1 && r.width > 0 } }
  return {
    role: group.getAttribute('role'),
    label: document.getElementById(group.getAttribute('aria-labelledby'))?.textContent,
    rows: rows.map(row => ({ lang: row.dataset.lang, htmlLang: row.getAttribute('lang'), name: row.querySelector('.lang-row__name').textContent, pressed: row.getAttribute('aria-pressed'), ...box(row), font: getComputedStyle(row).fontFamily.split(',')[0].replace(/"/g, ''), check: getComputedStyle(row.querySelector('.lang-row__check')).visibility, checkColor: getComputedStyle(row.querySelector('.lang-row__check')).color })),
    focus: document.activeElement?.dataset?.lang ?? document.activeElement?.tagName,
  }
}, menuOf(width))
const pick = async (page, width, lang) => {
  const row = page.locator(`${menuOf(width)} [data-language-picker] button[data-lang="${lang}"]`)
  if (phoneOf(width)) await row.tap()
  else await row.click()
  await page.waitForTimeout(700)
}

async function run(type, browserName, width, account) {
  const tag = `[${browserName} ${width} ${account ? 'signed in' : 'visitor'}]`
  const file = (name) => path.join(OUT, `${browserName}-${width}-${account ? 'signed-in' : 'visitor'}-${name}.png`)
  const browser = await type.launch()
  try {
    const { ctx, page, state, errors } = await world(browser, { width, account, locale: 'en-US' })

    // 1. first visit from Brazil (the browser speaks English): Portuguese, and English never shown
    state.country = 'br'; state.asked = 0
    await open(page, width)
    let f = await facts(page, width)
    say(`${tag} first visit, the hosting answers Brazil: the app opens in Portuguese, <html lang="pt-BR">`, f.lang === 'pt-BR' && f.create === 'Criar' && state.asked === 1, `lang ${f.lang} · «${f.create}» · country asked ${state.asked}x`)
    say(`${tag} first visit from Brazil: no English word was ever on the page (no flash), and nothing was kept as a choice`, f.seen.en.length === 0 && f.choice === null && f.seen.pt.includes('Criar'), `English seen: ${JSON.stringify(f.seen.en)} · Portuguese seen: ${JSON.stringify(f.seen.pt)} · choice ${f.choice}`)
    say(`${tag} Portuguese fits the screen (no sideways scroll)`, !f.wide)
    await page.screenshot({ path: file('01-first-visit-brazil') })

    // 2. the hint cannot be read, the browser speaks English: English
    state.country = 'unreadable'
    await open(page, width)
    f = await facts(page, width)
    say(`${tag} the country could not be read and the browser speaks English: English`, f.lang === 'en' && f.create === 'Create' && f.seen.pt.length === 0, `lang ${f.lang} · «${f.create}» · Portuguese seen: ${JSON.stringify(f.seen.pt)}`)

    // 3. first visit from another country: English, Portuguese never shown
    state.country = 'other'; state.asked = 0
    await open(page, width)
    f = await facts(page, width)
    say(`${tag} first visit from another country: English, <html lang="en">, no Portuguese word ever on the page`, f.lang === 'en' && f.create === 'Create' && f.seen.pt.length === 0 && state.asked === 1, `lang ${f.lang} · «${f.create}» · Portuguese seen: ${JSON.stringify(f.seen.pt)}`)
    await page.screenshot({ path: file('02-first-visit-elsewhere') })

    // 4. the selector: work in progress, then the switch on the screen
    const field = page.locator('#app input[type="text"], #app input:not([type]), #app input[type="search"]').first()
    const hasField = await field.count() > 0 && await field.isVisible().catch(() => false)
    if (hasField) await field.fill('Work in progress 1973')
    await page.evaluate(() => { window.__sameVisit = 'yes' })
    await openMenu(page, width)
    let p = await picker(page, width)
    say(`${tag} the selector is a named group of two buttons, each in its own language, English marked as the one spoken`, p.role === 'group' && p.label === 'Language' && p.rows.map(r => `${r.lang}:${r.htmlLang}:${r.name}:${r.pressed}`).join(' ') === 'pt:pt-BR:Português:false en:en:English:true', JSON.stringify(p.rows.map(r => `${r.name} ${r.pressed}`)))
    say(`${tag} its rows are inside the screen, at least 44 px tall, in the menu's own type, and the mark of the current one is the orange`, p.rows.every(r => r.inside && r.height >= 44) && p.rows[1].check === 'visible' && p.rows[0].check === 'hidden' && p.rows[1].checkColor === 'rgb(249, 115, 22)', `heights ${p.rows.map(r => r.height).join('/')} · font ${p.rows[0].font} · mark ${p.rows[1].checkColor}`)
    await page.screenshot({ path: file('03-selector-english') })
    await pick(page, width, 'pt')
    f = await facts(page, width)
    p = await picker(page, width)
    const kept = await page.evaluate(() => window.__sameVisit)
    const value = hasField ? await field.inputValue() : null
    say(`${tag} picking «Português» changes the whole screen with no reload: the bar, the menu, <html lang>, the mark`, f.lang === 'pt-BR' && f.create === 'Criar' && p.label === 'Idioma' && p.rows[0].pressed === 'true' && p.rows[1].pressed === 'false' && kept === 'yes', `lang ${f.lang} · «${f.create}» · title «${p.label}» · same visit: ${kept}`)
    say(`${tag} the work in progress is kept (what was typed on the screen is still there)`, hasField ? value === 'Work in progress 1973' : false, hasField ? `field: «${value}»` : 'no field found on /start')
    say(`${tag} the focus is on the language picked, and the choice is kept on the device under the entry page's key`, p.focus === 'pt' && f.choice === 'pt', `focus on ${p.focus} · ${LANG_KEY} = ${f.choice}`)
    await page.screenshot({ path: file('04-selector-portuguese') })
    if (!phoneOf(width)) {
      // the judge's P2-4: the date of the footer follows the language of the app, in a browser that speaks English (en-US)
      const stamp = await page.locator('#footer-container .last-update').innerText()
      say(`${tag} in Portuguese the footer writes the date the Brazilian way, though the browser speaks English`, /\d{2}\/\d{2}\/\d{4},? \d{2}:\d{2}:\d{2}/.test(stamp) && !/AM|PM/.test(stamp), stamp.trim())
    }

    // 5. by the keyboard alone (the computer)
    if (!phoneOf(width)) {
      await page.keyboard.press('Escape')
      await page.locator('#userMenuBtn').focus()
      await page.keyboard.press('Enter')
      let reached = false
      for (let step = 0; step < 25 && !reached; step++) {
        await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab') // Safari walks the buttons with Option+Tab
        reached = await page.evaluate(() => document.activeElement?.dataset?.lang === 'en')
      }
      if (reached) await page.keyboard.press('Enter')
      await page.waitForTimeout(700)
      f = await facts(page, width)
      p = await picker(page, width)
      say(`${tag} by the keyboard alone: Enter opens the panel, Tab reaches «English», Enter picks it, the focus stays on it`, reached && f.lang === 'en' && f.create === 'Create' && p.focus === 'en' && f.choice === 'en', `reached ${reached} · lang ${f.lang} · focus ${p.focus}`)
      await pick(page, width, 'pt')
    }

    // 6. the choice survives a reload and beats the country; the country is not even asked
    state.country = 'other'; state.asked = 0
    await open(page, width)
    f = await facts(page, width)
    say(`${tag} reload from another country with «Português» chosen: Portuguese, no English word ever on the page, the country not asked`, f.lang === 'pt-BR' && f.create === 'Criar' && f.seen.en.length === 0 && state.asked === 0, `lang ${f.lang} · «${f.create}» · English seen: ${JSON.stringify(f.seen.en)} · country asked ${state.asked}x`)

    // 7. the Painel (/admin) follows
    await page.goto(origin + '/admin', { waitUntil: 'domcontentloaded' })
    if (account) {
      await page.waitForSelector('.cms-chip[data-screen="albums"]', { timeout: 20000 })
      const chips = () => page.evaluate(() => ['albums', 'blend', 'inventory', 'start'].map(id => document.querySelector(`.cms-chip[data-screen="${id}"]`)?.textContent.trim().replace(/\s*\d+$/, ''))) // the chip also carries the count of its texts
      let names = await chips()
      say(`${tag} /admin opens in Portuguese, and its four chips say what the menu says`, names.join('|') === 'Álbuns|Mistura|Acervo|Criar' && (await facts(page, width)).lang === 'pt-BR', names.join(' · '))
      await page.screenshot({ path: file('05-admin-portuguese') })
      await page.evaluate(() => { window.__sameVisit = 'admin' })
      await openMenu(page, width)
      await pick(page, width, 'en')
      names = await chips()
      say(`${tag} on /admin, picking «English» changes the Painel with no reload`, names.join('|') === 'Albums|Blend|Inventory|Create' && await page.evaluate(() => window.__sameVisit) === 'admin', names.join(' · '))
    } else {
      await page.waitForSelector('[data-screen="not-found"]', { timeout: 20000 })
      const title = () => page.locator('[data-screen="not-found"] div').first().innerText()
      say(`${tag} /admin, for who is not the administrator, says «page not found» in Portuguese`, await title() === pt['notices.router.notFoundTitle'], await title())
      // the judge's P1-1: the way back names the stop as the Portuguese menu does
      const back = (await page.locator('[data-screen="not-found"] a').innerText()).trim()
      say(`${tag} and its button says where it goes with the menu's own word, «${pt['shell.phone.tabStart']}»`, back === pt['notices.router.notFoundBack'] && back.endsWith(pt['shell.phone.tabStart']) && !back.includes(en['shell.phone.tabStart']), back)
      await openMenu(page, width)
      await pick(page, width, 'en')
      say(`${tag} and in English after «English» is picked there, with no reload`, await title() === en['notices.router.notFoundTitle'], await title())
    }

    // 8. «English» chosen beats Brazil
    state.country = 'br'; state.asked = 0
    await open(page, width)
    f = await facts(page, width)
    say(`${tag} reload from Brazil with «English» chosen: English, no Portuguese word ever on the page, the country not asked`, f.lang === 'en' && f.create === 'Create' && f.seen.pt.length === 0 && state.asked === 0, `lang ${f.lang} · «${f.create}» · Portuguese seen: ${JSON.stringify(f.seen.pt)} · country asked ${state.asked}x`)
    say(`${tag} no error of the page in the whole visit`, errors.length === 0, errors.slice(0, 2).join(' ¦ '))
    await ctx.close()

    // 9. a browser that speaks Portuguese (a visitor): the country still decides; only without the country does the browser decide
    if (!account) {
      const other = await world(browser, { width, account: false, locale: 'pt-BR' })
      other.state.country = 'other'
      await open(other.page, width)
      f = await facts(other.page, width)
      say(`${tag} a browser in Portuguese, from another country: English (the country wins over the browser)`, f.lang === 'en' && f.create === 'Create' && f.seen.pt.length === 0, `lang ${f.lang} · «${f.create}»`)
      other.state.country = 'unreadable'
      await open(other.page, width)
      f = await facts(other.page, width)
      say(`${tag} a browser in Portuguese, the country could not be read: Portuguese (the browser's language, the owner's rule for «country unknown»)`, f.lang === 'pt-BR' && f.create === 'Criar' && f.seen.en.length === 0, `lang ${f.lang} · «${f.create}»`)
      await other.ctx.close()
    }
  } catch (error) {
    say(`${tag} the visit ran to the end`, false, String(error.message).split('\n')[0].slice(0, 220))
  } finally {
    await browser.close()
  }
}

/** The same site behind the emulator of Firebase Hosting: the country comes from Firebase's own swap of /country.json, told by its test cookie. */
async function onHosting(type, browserName, width) {
  const tag = `[hosting emulator · ${browserName} ${width}]`
  const browser = await type.launch()
  try {
    for (const [cookie, lang, create] of [['br', 'pt-BR', 'Criar'], ['us', 'en', 'Create'], [null, 'en', 'Create']]) {
      const { ctx, page, state } = await world(browser, { width, account: false, locale: 'en-US' })
      if (cookie) await ctx.addCookies([{ name: 'firebase-country-override', value: cookie, url: origin }])
      state.asked = 0
      await open(page, width)
      const f = await facts(page, width)
      const body = await page.evaluate(() => fetch('/country.json', { cache: 'no-store' }).then(r => r.text()))
      const other = lang === 'en' ? f.seen.pt : f.seen.en
      say(`${tag} ${cookie ? `country «${cookie}»` : 'no country'}: Firebase answers ${body.trim()} and the app opens in ${lang === 'en' ? 'English' : 'Portuguese'}, the other language never on the page`, f.lang === lang && f.create === create && other.length === 0 && state.asked >= 1, `lang ${f.lang} · «${f.create}» · other language seen: ${JSON.stringify(other)}`)
      if (cookie === 'br') await page.screenshot({ path: path.join(OUT, `hosting-emulator-${browserName}-${width}-brazil.png`) })
      await ctx.close()
    }
  } catch (error) {
    say(`${tag} the visit ran to the end`, false, String(error.message).split('\n')[0].slice(0, 220))
  } finally {
    await browser.close()
  }
}

if (process.env.HOSTING) {
  for (const [type, name] of [[chromium, 'chromium'], [webkit, 'webkit']]) for (const width of [1280, 390]) await onHosting(type, name, width)
} else {
  for (const [type, name] of [[chromium, 'chromium'], [webkit, 'webkit']]) {
    for (const width of [1280, 390]) {
      for (const account of [false, true]) await run(type, name, width, account)
    }
  }
}

const failed = results.filter((r) => !r.ok)
fs.writeFileSync(path.join(HERE, process.env.HOSTING ? 'hosting-emulator-proof.json' : 'language-proof.json'), JSON.stringify({ base: process.env.HOSTING ? 'the built site behind the Firebase Hosting emulator (firebase emulators:start --only hosting, a demo project)' : 'the built site (vite build + vite preview)', passed: results.length - failed.length, failed: failed.length, results }, null, 1))
console.log(`\n${results.length - failed.length} PASS, ${failed.length} FAIL`)
process.exit(failed.length ? 1 : 0)
