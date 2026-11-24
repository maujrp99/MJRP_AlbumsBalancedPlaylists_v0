/**
 * The crate the owner published, read by the entry page AFTER it has loaded (F82, REQ-03 and REQ-11; F95): the albums he
 * chose in the Painel («Caixa do The Album Blender») take the place of the fixed set, in the crate and in the phone's row.
 *
 * The page is written whole by the build with the fixed set (it reads without script and paints without waiting); this
 * runs later and only swaps. The fixed set STAYS when nothing is published, when the read fails or takes more than
 * READ_TIMEOUT_MS, and when what was published does not pass the check: nothing here ever throws to the page.
 *
 * The read is ONE request to the database's public address (Firestore's REST `documents:batchGet`, which answers 200 with
 * «missing» when there is no document, so nothing published is not an error in the console). No Firebase SDK: the entry
 * page stays its own small bundle. The page's content policy (public/splash.html) allows this one server for it.
 *
 * Every value is checked by the core's validator (shared/content/crate.js), the same the Painel uses, and every text is
 * written with `textContent` or as an attribute through the DOM, never as markup. A cover's address is made HERE, from the
 * album's artwork path, on the one image server the page's policy allows (Apple's); an album whose cover or link does not
 * pass is left out.
 */
import { validateCrate, readCrateDocument, flatCrate, coverUrl } from '@shared/content/crate.js'
import { t } from './copy.js'

/** The Firebase project of the site (the same as public/js/firebase-config.js; test/splash/publishedCrate.test.js compares them). */
export const FIRESTORE_PROJECT = 'mjrp-playlist-generator'
const DOCUMENTS = `projects/${FIRESTORE_PROJECT}/databases/(default)/documents`
export const CRATE_DOCUMENT = `${DOCUMENTS}/published/crate`
export const BATCH_GET_URL = `https://firestore.googleapis.com/v1/${DOCUMENTS}:batchGet`
export const READ_TIMEOUT_MS = 3000

/** The side of a sleeve's image and of a cover in the phone's row, as the build writes them (covers.js SIZE, SHELF_COVER). */
const SLEEVE = 360
const SHELF = 150
/** How long the swap waits for the new covers before it goes on without them. */
export const COVERS_TIMEOUT_MS = 4000

const own = (map, key) => Object.prototype.hasOwnProperty.call(map, key)

/** A value of Firestore's REST answer (`{ stringValue }`, `{ arrayValue }`, …) as plain data; an unknown type is null. */
export function plainOf(value) {
    if (!value || typeof value !== 'object') return null
    if (own(value, 'stringValue')) return String(value.stringValue)
    if (own(value, 'integerValue')) return Number(value.integerValue)
    if (own(value, 'doubleValue')) return Number(value.doubleValue)
    if (own(value, 'booleanValue')) return Boolean(value.booleanValue)
    if (own(value, 'arrayValue')) return (value.arrayValue?.values || []).map(plainOf)
    if (own(value, 'mapValue')) return fieldsOf(value.mapValue?.fields)
    return null
}

const fieldsOf = (fields) => Object.fromEntries(Object.entries(fields || {}).map(([key, inner]) => [key, plainOf(inner)]))

/**
 * What an answer of `documents:batchGet` says of the crate.
 * @param {*} answer - the body of the answer
 * @returns {{ state: 'published', sides: { a: Object[], b: Object[] }, rejected: number } | { state: 'none' } | { state: 'refused', reason: string }}
 *   `none`: nothing is published; `refused`: something is, and it does not pass the check (the fixed set stays)
 */
export function crateOfAnswer(answer) {
    const entry = Array.isArray(answer) ? answer.find(item => item && (item.found || item.missing)) : null
    if (!entry) return { state: 'refused', reason: 'bad_answer' }
    if (!entry.found) return { state: 'none' }
    const document = readCrateDocument(fieldsOf(entry.found.fields))
    if (!document.ok) return { state: 'refused', reason: document.reason }
    const checked = validateCrate({ sideA: document.sideA, sideB: document.sideB })
    if (!checked.ok) return { state: 'refused', reason: checked.reason }
    return { state: 'published', sides: checked.sides, rejected: checked.rejected.length }
}

/**
 * Reads the published crate. Never throws: a failure is an answer.
 * @param {Window} win
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<ReturnType<typeof crateOfAnswer> | { state: 'failed' | 'timeout' }>}
 */
export async function readPublishedCrate(win, { timeoutMs = READ_TIMEOUT_MS } = {}) {
    const controller = typeof win.AbortController === 'function' ? new win.AbortController() : null
    let late = false
    const timer = win.setTimeout(() => { late = true; if (controller) controller.abort() }, timeoutMs)
    try {
        const response = await win.fetch(BATCH_GET_URL, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documents: [CRATE_DOCUMENT] }),
            credentials: 'omit', signal: controller ? controller.signal : undefined
        })
        if (late) return { state: 'timeout' }
        if (!response.ok) return { state: 'failed' }
        return crateOfAnswer(await response.json())
    } catch {
        return { state: late ? 'timeout' : 'failed' }
    } finally {
        win.clearTimeout(timer)
    }
}

/** The page shows real albums (each sleeve carries its Apple Music address): only then does a published crate take their place. */
export const showsRealAlbums = (imgs) => imgs.length > 0 && imgs.every(img => Boolean(img.dataset.href))

/** This page, in this browser, will ask for the published crate. */
export const readsPublishedCrate = (win, imgs) => showsRealAlbums(imgs) && typeof win.fetch === 'function'

/** A sleeve of the crate for an album, as the build writes it (covers.js coverImagesHtml), made through the DOM. */
export function sleeveOf(D, album, i) {
    const img = D.createElement('img')
    img.className = `sl s${i}`
    img.style.setProperty('--p', String(i))
    Object.assign(img.dataset, { i: String(i), k: album.id, t: album.title, a: album.artist, y: String(album.year), href: album.href })
    img.alt = `${album.title} by ${album.artist} (${album.year}), album cover`
    img.width = SLEEVE; img.height = SLEEVE
    img.decoding = 'async'
    img.crossOrigin = 'anonymous'
    img.src = coverUrl(album.art, SLEEVE)
    return img
}

const spanOf = (D, { cls, key, text, lang, hidden }) => {
    const span = D.createElement('span')
    if (cls) span.className = cls
    if (hidden) span.setAttribute('aria-hidden', 'true')
    if (key) { span.setAttribute('data-i18n', key); span.textContent = t(key, lang) } else span.textContent = text
    return span
}

/** An album of the phone's row, as the build writes it (covers.js shelfHtml), made through the DOM. */
export function shelfItemOf(D, album, lang) {
    const item = D.createElement('li')
    item.className = 'al'
    const cover = D.createElement('img')
    cover.alt = ''
    cover.width = SHELF; cover.height = SHELF
    cover.loading = 'lazy'; cover.decoding = 'async'; cover.crossOrigin = 'anonymous'
    cover.src = coverUrl(album.art, SLEEVE)
    const name = D.createElement('b')
    name.textContent = album.title
    const link = D.createElement('a')
    link.className = 'am'
    link.href = album.href
    link.target = '_blank'
    link.rel = 'noopener'
    link.append(
        spanOf(D, { cls: 'mk', text: '♫', hidden: true }), spanOf(D, { key: 'c.listen', lang }),
        spanOf(D, { cls: 'sr', text: `: ${album.title}, ${album.artist}` }), spanOf(D, { cls: 'sr', key: 'c.newtab', lang })
    )
    item.append(cover, name, link)
    return item
}

/** The crate on the page now, as its ids in order, with the count of side B: to tell a published crate that changes nothing. */
const shown = (imgs, sideB) => `${imgs.map(img => `${img.dataset.k}|${img.dataset.t}|${img.dataset.a}|${img.dataset.y}|${img.dataset.href}|${img.getAttribute('src')}`).join('\n')}\n${sideB}`

/** Resolves when every image has arrived (or failed), or after `ms`: the swap never waits for ever. */
function arrived(win, imgs, ms) {
    const each = imgs.map(img => (typeof img.decode === 'function' ? img.decode().catch(() => {}) : Promise.resolve()))
    return Promise.race([Promise.all(each), new Promise(resolve => win.setTimeout(resolve, ms))])
}

/**
 * Reads the published crate after the page has loaded and, when there is one that passes the check and differs from what
 * the page shows, hands the new sleeves to `swap` once their images have arrived.
 * @param {Window} win
 * @param {{ imgs: HTMLImageElement[], sideB: number }} crate - what the page shows now
 * @param {(next: { imgs: HTMLImageElement[], row: Object[], sideB: number }) => void} swap
 * @returns {Promise<string>} how it ended: `not_real`, `no_fetch`, `none`, `refused`, `failed`, `timeout`, `same`, `swapped`
 */
export async function startPublishedCrate(win, crate, swap) {
    const D = win.document
    if (!showsRealAlbums(crate.imgs)) return 'not_real'
    if (!readsPublishedCrate(win, crate.imgs)) return 'no_fetch'
    if (D.readyState !== 'complete') await new Promise(resolve => win.addEventListener('load', resolve, { once: true }))
    const read = await readPublishedCrate(win)
    if (read.state !== 'published') return read.state
    const row = flatCrate(read.sides)
    const imgs = row.map((album, i) => sleeveOf(D, album, i))
    const sideB = read.sides.b.length
    if (shown(imgs, sideB) === shown(crate.imgs, crate.sideB)) return 'same'
    await arrived(win, imgs, COVERS_TIMEOUT_MS)
    swap({ imgs, row, sideB })
    return 'swapped'
}
