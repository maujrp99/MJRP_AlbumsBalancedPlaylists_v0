// F82 browser proof of the Painel's Texts section on the BUILT site: F82_SOURCE=<repo> node proof.mjs <dist> <evidence-dir> [port]
// Firebase hosts are stubbed at the network layer (a fake administrator, fake published/* documents); every other outside
// host is aborted, the music hosts first of all. Nothing here opens or controls an app of this Mac, and no link that leaves
// the site is clicked (the moves of the app are asked of its own router).
import fs from 'node:fs'
import path from 'node:path'
import { serve, pw, writeAccount } from '../create-lean-computer/harness.mjs'
import { firestoreStub } from './firestoreStub.mjs'

const [dist, out, portArg] = process.argv.slice(2)
const port = Number(portArg ?? 4391)
const origin = `http://127.0.0.1:${port}`
const SOURCE = process.env.F82_SOURCE
fs.mkdirSync(out, { recursive: true })

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const now = Math.floor(Date.now() / 1000)
const tokenOf = (uid, provider) => `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({ iss: 'https://securetoken.google.com/x', aud: 'x', auth_time: now, user_id: uid, sub: uid, iat: now, exp: now + 86400, firebase: { sign_in_provider: provider } })}.sig`
const ID_TOKEN = tokenOf('preview-uid', 'password')
const ANON_TOKEN = tokenOf('guest-uid', 'anonymous')
const NEVER = /music\.apple\.com|itunes\.apple\.com|geo\.music\.apple\.com|open\.spotify\.com|accounts\.spotify\.com|^music:|^itms:|^spotify:/

const assets = fs.readdirSync(path.join(dist, 'assets'))
const adminFiles = assets.filter((name) => /\.(js|css)$/.test(name) && /cms-rail|ak-rt-bar/.test(fs.readFileSync(path.join(dist, 'assets', name), 'utf8')))
const results = []
const say = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`) }

/** The nine names of a failed translation, as the route gives them, and a piece of the plain words the Painel must say. */
const FAILURES = [
  [401, 'session-expired', /session is over/], [403, 'not-an-administrator', /not an administrator/], [503, 'translation-not-configured', /not configured on the server yet/],
  [402, 'credit-exhausted', /credit is over/], [503, 'service-unavailable', /did not answer/], [413, 'text-too-long', /too long/],
  [429, 'too-many-requests', /too many translations/], [400, 'invalid-request', /did not accept this request/], [502, 'translation-unusable', /thrown away/],
]

async function context(browser, viewport, { account = false, record, delayMs = 0 } = {}) {
  const stub = firestoreStub({
    ...(record ? { 'cmsAdmins/preview-uid': record } : {}),
    'published/texts_en': { _schemaVersion: 1, rev: 2, texts: { 'albums.gone.key': 'An orphan text' } },
    'published/texts_pt': { _schemaVersion: 1, rev: 4, texts: {} },
    'published/site': { _schemaVersion: 1, rev: 1, switches: { discogsValues: true } },
  })
  const state = { translate: FAILURES[2], dialog: 'dismiss', dialogs: [] }
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce', deviceScaleFactor: 1 })
  const requests = []
  const errors = []
  const aborted = []
  await ctx.addInitScript(() => { window.MusicKit = { configure: async () => {}, getInstance: () => ({ isAuthorized: false, api: { music: async () => ({ data: { data: [] } }) } }) } })
  await ctx.route('**/*', async (route) => {
    const url = route.request().url()
    requests.push(url)
    if (NEVER.test(url)) return route.abort('blockedbyclient')
    if (url.startsWith(origin + '/api/admin/translate')) {
      const [status, reason] = state.translate
      return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: { code: 'X', retryable: false, reason } }) })
    }
    if (url.startsWith(origin + '/api/')) return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"fixture"}' })
    // the build made for the budget does not carry public/assets/data (the publication copies it): the search worker's list comes from the source
    if (url.startsWith(origin + '/assets/data/')) return route.fulfill({ status: 200, contentType: 'application/json', body: fs.readFileSync(path.join(SOURCE, 'public', new URL(url).pathname)) })
    if (url.startsWith(origin) || url.startsWith('data:')) return route.continue()
    if (url.includes('firestore.googleapis.com')) {
      if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs))
      return stub.handle(route).catch(() => {})
    }
    // a visitor is the guest the app signs in by itself: a stand-in anonymous account
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
    aborted.push(url.slice(0, 110))
    return route.abort('blockedbyclient')
  })
  const page = await ctx.newPage()
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push('pageerror: ' + error.message))
  page.on('dialog', (dialog) => { state.dialogs.push(dialog.message()); return state.dialog === 'accept' ? dialog.accept() : dialog.dismiss() })
  if (account) {
    // the first page signs a guest in by itself: let that request end before the stand-in account is written and the page is left
    const guest = page.waitForResponse((response) => response.url().includes('accounts:signUp'), { timeout: 8000 }).catch(() => {})
    await page.goto(origin + '/start', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__firebase_config)
    await guest
    await page.waitForTimeout(500)
    await writeAccount(page)
  }
  return { ctx, page, stub, requests, errors, state, aborted }
}

const noScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
const shot = (page, selector, name) => page.locator(selector).first().screenshot({ path: path.join(out, name) })
const view = (page, name) => page.screenshot({ path: path.join(out, name) })
/** The console errors that are the blocked outside hosts themselves (the proof aborts them on purpose). */
const real = (errors) => errors.filter((text) => !/ERR_BLOCKED_BY_CLIENT|Failed to load resource|ERR_FAILED/.test(text))
const askedFor = (requests) => requests.filter((url) => adminFiles.some((name) => url.endsWith(name)))
const barText = (page) => page.locator('.cms-bar-info b').innerText()
/** What is at the centre of a button: the button itself, or whatever covers it. */
const onTop = (page, selector) => page.evaluate((query) => {
  const button = document.querySelector(query)
  const box = button.getBoundingClientRect()
  const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
  return { reached: hit === button || button.contains(hit), top: Math.round(box.top), hit: hit?.className ?? '' }
}, selector)

async function scrolledBar(page, tag, key) {
  // P1-1: the save bar after scrolling the longest screen (Albums) to the middle and to the end
  const row = page.locator(`.cms-row[data-key="${key}"]`)
  await row.locator('[data-act="edit"]').click()
  await row.locator('[data-lang="en"] input.ak-input').fill('A change to save or discard')
  await row.locator('[data-act="edit"]').click()
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2))
  await page.waitForTimeout(150)
  const middle = await onTop(page, '[data-act="save"]')
  say(`${tag} scrolled to the middle (${Math.round(height / 2)} of ${height} px): nothing covers «Save»`, middle.reached, JSON.stringify(middle))
  await view(page, `${tag}-02-save-bar-after-scrolling-to-the-middle.png`)
  await page.locator('[data-act="save"]').click({ timeout: 5000 })
  await page.waitForSelector('[data-state="confirm"]')
  say(`${tag} scrolled to the middle: «Save» is clicked and asks to confirm`, true, await page.locator('[data-state="confirm"] b').innerText())
  await page.locator('[data-act="save-back"]').click({ timeout: 5000 })
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForTimeout(150)
  const end = await onTop(page, '[data-act="discard"]')
  say(`${tag} scrolled to the end: nothing covers «Discard»`, end.reached, JSON.stringify(end))
  await view(page, `${tag}-03-save-bar-after-scrolling-to-the-end.png`)
  await page.locator('[data-act="discard"]').click({ timeout: 5000 })
  say(`${tag} scrolled to the end: «Discard» is clicked and the change is gone`, (await barText(page)) === 'All saved')
  await page.evaluate(() => window.scrollTo(0, 0))
}

async function validator(page, tag, stub, key) {
  // the check of a text, in the browser, with the site's real validator: nothing bad is saved
  const row = page.locator(`.cms-row[data-key="${key}"]`)
  await row.locator('[data-act="edit"]').click()
  const field = row.locator('[data-lang="en"] input.ak-input')
  const reasons = []
  for (const [text, reason] of [['<b>bold</b>', 'markup'], ['   ', 'empty'], ['x'.repeat(400), 'too_long'], ['with a {hole}', 'placeholders']]) {
    await field.fill(text)
    reasons.push(await row.locator(`[data-lang="en"] [data-invalid="${reason}"]`).count() === 1 ? reason : `missing:${reason}`)
  }
  say(`${tag} the validator names each bad text (markup, empty, too long, a {placeholder} the English has not)`, reasons.join(',') === 'markup,empty,too_long,placeholders', reasons.join(','))
  await shot(page, '.cms-row.is-edit', `${tag}-04-text-refused-by-the-check.png`)
  const before = stub.get('published/texts_en').rev
  await page.locator('[data-act="save"]').click()
  await page.locator('[data-act="save-confirm"]').click()
  await page.waitForSelector('[data-state="invalid"]')
  say(`${tag} a text that fails the check is not saved, and the bar says why`, stub.get('published/texts_en').rev === before, await page.locator('[data-state="invalid"]').innerText())
  await page.locator('[data-act="discard"]').click()
  await row.locator('[data-act="edit"]').click()
}

async function failureNames(page, tag, state, key) {
  const row = page.locator(`.cms-row[data-key="${key}"]`)
  await row.locator('[data-act="edit"]').click()
  const before = await row.locator('[data-lang="pt"] input.ak-input').inputValue()
  const said = []
  for (const failure of FAILURES) {
    state.translate = failure
    const again = row.locator('[data-lang="pt"] .ak-tr-fail button')
    await ((await again.count()) ? again : row.locator('[data-lang="pt"] .ak-tr-btn')).click()
    await page.waitForFunction(([selector, words]) => new RegExp(words).test(document.querySelector(selector)?.textContent ?? ''), [`.cms-row[data-key="${key}"] [data-lang="pt"] .ak-tr-fail span`, failure[2].source], { timeout: 5000 }).catch(() => {})
    const words = await row.locator('[data-lang="pt"] .ak-tr-fail span').innerText().catch(() => '')
    said.push(failure[2].test(words) ? 'ok' : `${failure[1]}: «${words}»`)
    if (failure[1] === 'translation-not-configured') await shot(page, '.cms-row.is-edit', `${tag}-05-translate-not-configured.png`)
  }
  say(`${tag} each of the nine failure names of the translation is said in plain words`, said.every((item) => item === 'ok'), said.filter((item) => item !== 'ok').join(' ¦ ') || FAILURES.map((failure) => failure[1]).join(', '))
  say(`${tag} the field did not change on any failure`, before === await row.locator('[data-lang="pt"] input.ak-input').inputValue())
  await row.locator('[data-act="edit"]').click()
}

async function leaving(page, tag, state, key) {
  const row = page.locator(`.cms-row[data-key="${key}"]`)
  await row.locator('[data-act="edit"]').click()
  await row.locator('[data-lang="en"] input.ak-input').fill('Not saved yet')
  state.dialog = 'dismiss'
  state.dialogs.length = 0
  await page.evaluate(() => window.router.navigate('/albums'))
  await page.waitForTimeout(300)
  say(`${tag} leaving with a change not saved asks, and «cancel» keeps the person and the change`, state.dialogs.length === 1 && new URL(page.url()).pathname.startsWith('/admin') && (await barText(page)).startsWith('1 '), state.dialogs[0] ?? 'no question')
  await page.goBack().catch(() => {})
  await page.waitForTimeout(400)
  say(`${tag} the browser's back button asks too, and «cancel» keeps the Painel and the change`, state.dialogs.length === 2 && new URL(page.url()).pathname.startsWith('/admin') && await row.locator('[data-lang="en"] input.ak-input').inputValue() === 'Not saved yet', `${state.dialogs.length} questions · ${new URL(page.url()).pathname}`)
  await page.locator('[data-screen="blend"]').click()
  await page.locator('[data-screen="albums"]').click()
  say(`${tag} moving between the screens of the Painel neither asks nor loses the change`, state.dialogs.length === 2 && (await barText(page)).startsWith('1 '))
  state.dialog = 'accept'
  await page.evaluate(() => window.router.navigate('/albums'))
  await page.waitForFunction(() => window.location.pathname === '/albums', null, { timeout: 5000 }).catch(() => {})
  say(`${tag} «leave» leaves`, new URL(page.url()).pathname === '/albums')
}

async function asAdministrator(browser, width, height) {
  const tag = `${width}`
  const { ctx, page, stub, requests, errors, state } = await context(browser, { width, height }, { account: true, record: { role: 'super' } })
  await page.goto(origin + '/admin', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.cms-row', { timeout: 20000 })
  say(`${tag} administrator: /admin opens the Painel`, true, `${await page.locator('.cms-row').count()} texts of the first screen`)
  say(`${tag} the Painel's files were asked for`, adminFiles.every((name) => requests.some((url) => url.endsWith(name))), adminFiles.join(', '))
  say(`${tag} the Painel's own words are not in the list, and no text is a rich one yet`, await page.locator('[data-screen="admin"]').count() === 0 && await page.locator('.cms-row .ak-rt-bar').count() === 0)
  say(`${tag} the line about the site says what it shows`, /published|copy|code/.test(await page.locator('.cms-site').innerText()), (await page.locator('.cms-site').innerText()).replace(/\n/g, ' '))
  await shot(page, '.cms', `${tag}-01-texts.png`)

  const key = await page.locator('.cms-row').first().getAttribute('data-key')
  await scrolledBar(page, tag, key)
  await validator(page, tag, stub, key)
  await failureNames(page, tag, state, key)

  // a plain text
  const first = page.locator(`.cms-row[data-key="${key}"]`)
  await first.locator('[data-act="edit"]').click()
  const field = first.locator('[data-lang="en"] input.ak-input')
  say(`${tag} a label is a plain one-line field`, await field.count() === 1 && await first.locator('.ak-rt-bar').count() === 0, key)
  await field.fill('Edited in the proof')
  say(`${tag} the bar counts 1 change not saved`, (await barText(page)).startsWith('1 '))
  await shot(page, '.cms-row.is-edit', `${tag}-06-plain-text-edited.png`)
  await first.locator('[data-act="edit"]').click()

  // approve a Portuguese text
  const waiting = page.locator('.cms-row:has([data-tag="pending"])').nth(1)
  const approvedKey = await waiting.getAttribute('data-key')
  await waiting.locator('[data-act="approve"]').click()
  await page.waitForSelector('[data-state="saved"]', { timeout: 8000 }).catch(async () => { console.log('DEBUG bar:', (await page.locator('.cms-bar').innerText()).replace(/\n/g, ' | '), '· errors:', errors.slice(-3).join(' ¦ '), '· log:', JSON.stringify(stub.log.slice(-3))) })
  say(`${tag} approving a Portuguese text saves the approval`, (stub.get('cmsWork/approved_pt')?.keys ?? []).includes(approvedKey), `${approvedKey} · ${await page.locator('[data-state="saved"]').innerText()}`)
  await shot(page, '.cms-bar', `${tag}-07-approved.png`)

  // save: the confirmation, then live
  await page.locator('[data-act="save"]').click()
  await page.waitForSelector('[data-state="confirm"]')
  await shot(page, '.cms-bar', `${tag}-08-confirm-what-goes-live.png`)
  await page.locator('[data-act="save-confirm"]').click()
  await page.waitForSelector('[data-state="saved"]', { timeout: 8000 }).catch(async () => { console.log('DEBUG bar:', (await page.locator('.cms-bar').innerText()).replace(/\n/g, ' | '), '· errors:', errors.slice(-3).join(' ¦ '), '· log:', JSON.stringify(stub.log.slice(-3)), '· reads:', stub.reads.slice(-4).join(',')) })
  const live = stub.get('published/texts_en')
  say(`${tag} save writes the texts with rev + 1 and the previous value`, live.rev === 3 && live.texts[key] === 'Edited in the proof' && key in (live.previous ?? {}), JSON.stringify({ rev: live.rev, text: live.texts[key], previous: live.previous }))
  say(`${tag} who saved is kept in the work area`, stub.get('cmsWork/save_texts_en')?.updatedBy === 'preview-uid')
  await shot(page, '.cms-bar', `${tag}-09-saved-and-live.png`)

  // the conflict between two devices: the other one saves the same key right before this one reads to save
  await first.locator('[data-act="edit"]').click()
  await first.locator('[data-lang="en"] input.ak-input').fill('Mine, from this device')
  stub.beforeNextRead('published/texts_en', (other) => {
    const doc = other.get('published/texts_en')
    other.set('published/texts_en', { ...doc, rev: doc.rev + 1, texts: { ...doc.texts, [key]: 'Theirs, from the other device' } })
  })
  await page.locator('[data-act="save"]').click()
  await page.locator('[data-act="save-confirm"]').click()
  await page.waitForSelector('[data-state="conflict"]')
  const cells = await page.locator('.cms-conflict-grid > div').allInnerTexts()
  say(`${tag} the conflict shows as it was, the other and yours`, cells.length === 3 && /Edited in the proof/.test(cells[0]) && /Theirs/.test(cells[1]) && /Mine/.test(cells[2]), cells.join(' | ').replace(/\n/g, ' '))
  say(`${tag} nothing was written over the other device's save`, stub.get('published/texts_en').texts[key] === 'Theirs, from the other device')
  await shot(page, '.cms-bar', `${tag}-10-conflict.png`)
  await page.locator('[data-act="conflict-theirs"]').click()
  await page.waitForFunction(() => !document.querySelector('[data-state="conflict"]'))
  say(`${tag} «Keep the other» shows what is live`, (await first.locator('[data-cell="en"] .cms-text').innerText()) === 'Theirs, from the other device')
  await first.locator('[data-act="edit"]').click()

  say(`${tag} an orphan text is marked`, await page.locator('[data-tag="orphan"]').count() === 1)
  say(`${tag} no horizontal scroll`, await noScroll(page))
  await leaving(page, tag, state, key)
  say(`${tag} no console errors`, real(errors).length === 0, real(errors).slice(0, 3).join(' ¦ '))
  const unhandled = stub.log.filter((entry) => entry.unhandled)
  say(`${tag} every database request was answered by the stand-in`, unhandled.length === 0, JSON.stringify(unhandled.slice(0, 3)))
  await ctx.close()
}

async function asSomebodyElse(browser, width, height, who, options) {
  const tag = `${width}`
  const { ctx, page, requests, errors, aborted } = await context(browser, { width, height }, options)
  await page.goto(origin + '/admin', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-screen="not-found"]', { timeout: 20000 })
  await page.waitForTimeout(1200)
  say(`${tag} ${who}: /admin says «Page not found»`, /Page not found/.test(await page.locator('[data-screen="not-found"]').innerText()))
  say(`${tag} ${who}: the Painel's files are never requested`, adminFiles.length > 0 && askedFor(requests).length === 0, `asked: ${askedFor(requests).length}`)
  say(`${tag} ${who}: no horizontal scroll, no console errors`, await noScroll(page) && real(errors).length === 0, real(errors).length ? real(errors).slice(0, 2).join(' ¦ ').slice(0, 160) + ' · aborted: ' + [...new Set(aborted)].join(' , ') : '')
  if (who === 'visitor') await shot(page, '#app', `${tag}-11-visitor-not-found.png`)
  await ctx.close()
}

async function withTheDatabaseSlow(browser, width, height) {
  const tag = `${width}`
  const { ctx, page, requests } = await context(browser, { width, height }, { account: true, record: { role: 'super' }, delayMs: 6000 })
  const started = Date.now()
  await page.goto(origin + '/admin', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-screen="could-not-check"]', { timeout: 15000 })
  const waited = Date.now() - started
  say(`${tag} the database slow (6 s per answer): «Could not check right now» after the 3 s deadline, not a long blank`, waited < 6000, `${waited} ms · ${(await page.locator('[data-screen="could-not-check"]').innerText()).replace(/\n+/g, ' · ')}`)
  say(`${tag} the database slow: the Painel's files are not requested`, askedFor(requests).length === 0)
  await shot(page, '#app', `${tag}-12-could-not-check.png`)
  await ctx.close()
}

const html = fs.readFileSync(path.join(dist, 'app.html'), 'utf8')
say('the Painel is not in the page\'s preload', adminFiles.length > 0 && adminFiles.every((name) => !html.includes(name)), adminFiles.join(', '))
const main = assets.find((name) => /^main-.*\.js$/.test(name))
say('the main script carries neither the Painel nor the check of the administrator', !/cms-rail|could-not-check/.test(fs.readFileSync(path.join(dist, 'assets', main), 'utf8')), main)

const server = await serve(path.resolve(dist), port)
const browser = await pw.chromium.launch()
try {
  for (const [width, height] of [[1440, 900], [393, 852]]) {
    await asAdministrator(browser, width, height)
    await asSomebodyElse(browser, width, height, 'visitor', {})
    await asSomebodyElse(browser, width, height, 'an account with no record', { account: true })
    await asSomebodyElse(browser, width, height, 'an account whose role is «editor»', { account: true, record: { role: 'editor' } })
    await asSomebodyElse(browser, width, height, 'an account whose role is «Super» (not «super»)', { account: true, record: { role: 'Super' } })
    await withTheDatabaseSlow(browser, width, height)
  }
} catch (error) {
  say('the proof ran to its end', false, String(error?.stack ?? error).slice(0, 700))
} finally {
  await browser.close()
  server.close()
}
const failed = results.filter((result) => !result.ok)
fs.writeFileSync(path.join(out, 'browser-proof.txt'), results.map((result) => `${result.ok ? 'PASS' : 'FAIL'} ${result.name}${result.detail ? ' — ' + result.detail : ''}`).join('\n') + `\n\n${results.length - failed.length} of ${results.length} passed\n`)
console.log(`${results.length - failed.length} of ${results.length} passed`)
process.exit(failed.length ? 1 : 0)
