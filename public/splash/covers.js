/**
 * The covers of the entry page (F80, REQ-06): ONE data file, two sets, one build-time switch.
 *
 *   real       the 14 records of the approved prototype (design/inception/splash-crate-v2.html), plus
 *              the owner's banana cover in front (2026-11-21): 15.
 *              The image is Apple Music artwork, served by Apple's image CDN (is1-ssl.mzstatic.com,
 *              which answers with `access-control-allow-origin: *`, so WebGL may use it); nothing of
 *              it is kept in this repository. The rights belong to the artists and labels, and
 *              Apple's terms (DPLA 3.3.6(D), App Review 4.5.2(ii)) tie artwork to playback or
 *              playlists: showing them on a public page is the owner's decision.
 *   fictional  14 invented albums with original art, drawn here as SVG, in the manner of the v1
 *              (design/inception/splash-crate-v1.html). The default.
 *
 * `VITE_SPLASH_COVERS=real` at build time chooses the real set; anything else is fictional. The
 * Vite plugin `entryPage` (vite.config.js) writes the chosen set into public/splash.html, in the
 * build and in the dev server. Pure: no browser API; its only import is the dictionary (copy.js).
 *
 * Order matters: the last seven records are side B of the crate (the last in front when the crate is
 * turned), every one before them side A (0 in front): 7 + 7 in the fictional set, 8 + 7 in the real
 * one. The page pulls 2, 3, 5, 6 on side A and the fourth from the back on side B (splash.js TRACKS,
 * framing.js recordAt). Harvest went to the back of side A so the pulled records stayed the same.
 */

import { t } from './copy.js'

export const COVER_SWITCH = 'VITE_SPLASH_COVERS'

const APPLE_ART = 'https://is1-ssl.mzstatic.com/image/thumb/'
const SIZE = 360

/** Real records: title, artist, year, the artwork path on Apple's CDN, the Apple Music page. */
const REAL = [
    // the first record of side A, the owner's (2026-11-21): «a capa da banana»; King Crimson stays, second
    ['vu-nico', 'The Velvet Underground & Nico', 'The Velvet Underground & Nico', 1967, 'Music112/v4/92/93/39/9293397f-a707-237e-ec7e-0ca613a67e3c/06UMGIM04143.rgb.jpg', 'https://music.apple.com/us/album/the-velvet-underground-nico-45th-anniversary-edition/1440851613'],
    ['crimson', 'In the Court of the Crimson King', 'King Crimson', 1969, 'Music5/v4/2f/c7/19/2fc71988-6871-be2c-6731-a3d0f2a6b232/Court_2500px.jpg', 'https://music.apple.com/us/album/in-the-court-of-the-crimson-king-expanded-edition/918534711'],
    // This one and Homogenic pointed to an Apple Music search; since 2026-11-23 (the owner: «1.sim») each has the album's own address: the edition whose
    // artwork is the very file shown here (iTunes lookup by the barcode in the artwork path: 886445635829 and 081227607364)
    ['dsotm', 'The Dark Side of the Moon', 'Pink Floyd', 1973, 'Music221/v4/3e/76/b0/3e76b0e3-762b-2286-a019-8afb19cee541/886445635829.jpg', 'https://music.apple.com/us/album/the-dark-side-of-the-moon/1065973699'],
    ['low', 'Low', 'David Bowie', 1977, 'Music124/v4/f7/49/2d/f7492da6-164e-b023-4b17-937329c35458/190295842895.jpg', 'https://music.apple.com/us/album/low-2017-remaster/1347895593'],
    ['pcl', 'Power, Corruption & Lies', 'New Order', 1983, 'Music115/v4/d2/3f/c8/d23fc8e7-3baa-eae3-7301-7a868d00ab09/825646053803.jpg', 'https://music.apple.com/us/album/power-corruption-lies/1040981945'],
    ['dummy', 'Dummy', 'Portishead', 1994, 'Music115/v4/c1/71/93/c1719342-df7d-e9c5-c87c-53dae5afb289/00042282855329.rgb.jpg', 'https://music.apple.com/us/album/dummy/1440653096'],
    ['illmatic', 'Illmatic', 'Nas', 1994, 'Music125/v4/e8/13/50/e813500d-51cd-6c37-c405-53a668cbde97/886444072496.jpg', 'https://music.apple.com/us/album/illmatic/856131729'],
    ['harvest', 'Harvest', 'Neil Young', 1972, 'Music115/v4/e0/4b/c4/e04bc4e6-9d3a-0bab-c953-f139c72fd337/093624924722.jpg', 'https://music.apple.com/us/album/harvest/1015739190'],
    ['edge', 'Close to the Edge', 'Yes', 1972, 'Music6/v4/94/d8/a2/94d8a2bf-797b-c9d2-1602-671c0b79a765/603497886074.jpg', 'https://music.apple.com/us/album/close-to-the-edge/1049014094'],
    ['homogenic', 'Homogenic', 'Björk', 1997, 'Music126/v4/7f/bd/d0/7fbdd0e0-c588-ef4b-a6dd-4dca21f8b41f/081227607364.jpg', 'https://music.apple.com/us/album/homogenic/20833577'],
    ['mezzanine', 'Mezzanine', 'Massive Attack', 1998, 'Music115/v4/0a/98/55/0a98555b-8d9d-3b46-660a-b91261557d17/00724384559953.rgb.jpg', 'https://music.apple.com/us/album/mezzanine/724466069'],
    ['aeroplane', 'In the Aeroplane Over the Sea', 'Neutral Milk Hotel', 1998, 'Music221/v4/12/e3/5c/12e35c39-de5c-b501-3ef0-00f19fb3d513/56627.jpg', 'https://music.apple.com/us/album/in-the-aeroplane-over-the-sea/1839077554'],
    ['pitty', 'Admirável Chip Novo', 'Pitty', 2003, 'Music116/v4/1c/e5/2b/1ce52bf3-3cec-1281-a15a-bddbc46bd6dc/7898324300288.jpg', 'https://music.apple.com/us/album/admir%C3%A1vel-chip-novo/977428211'],
    ['desire', 'Desire, I Want to Turn Into You', 'Caroline Polachek', 2023, 'Music116/v4/10/51/f2/1051f2cc-195f-ddb6-2d9e-26c74f0387fd/197187988518.jpg', 'https://music.apple.com/us/album/desire-i-want-to-turn-into-you/1669095245'],
    ['tpab', 'To Pimp a Butterfly', 'Kendrick Lamar', 2015, 'Music112/v4/0d/ae/61/0dae6140-d4af-d0df-eae0-3c92eb392a33/15UMGIM11922.rgb.jpg', 'https://music.apple.com/us/album/to-pimp-a-butterfly/1440871877']
]

/** Fictional records: title, artist, the pattern of the sleeve and its three colours (v1's, plus five more). */
const FICTIONAL = [
    ['copper-year', 'Copper Year', 'North Atlas', 'sun', ['#fbbf24', '#f97316', '#7c2d12']],
    ['night-ferry', 'Night Ferry', 'Ilse & the Harbour', 'stripes', ['#dc2626', '#f97316', '#fbbf24']],
    ['lantern-hymnal', 'Lantern Hymnal', 'The Hollow Lanterns', 'rings', ['#0b0b0b', '#fbbf24', '#f97316']],
    ['glass-orchard', 'Glass Orchard', 'Velvet Meridian', 'split', ['#1c1917', '#ea580c', '#fff7ed']],
    ['static-bloom', 'Static Bloom', 'Juno Reyes', 'fan', ['#fbbf24', '#dc2626', '#450a0a']],
    ['ember-suite', 'Ember Suite', 'Kofi Arden Trio', 'eq', ['#0b0b0b', '#f97316', '#dc2626']],
    ['second-side', 'Second Side', 'The Long Players', 'grid', ['#fff7ed', '#dc2626', '#0b0b0b']],
    ['slow-burn-atlas', 'Slow Burn Atlas', 'Mara Quell', 'wave', ['#450a0a', '#f97316', '#fbbf24']],
    ['lamplit-pier', 'Lamplit Pier', 'Odile Vance', 'moon', ['#111827', '#fde68a', '#f97316']],
    ['paper-satellites', 'Paper Satellites', 'The Quiet Cartographers', 'rings', ['#1c1917', '#fde68a', '#dc2626']],
    ['harbour-static', 'Harbour Static', 'Nadia Morrow', 'stripes', ['#0b0b0b', '#dc2626', '#fde68a']],
    ['low-tide-choir', 'Low Tide Choir', 'Saltmarsh', 'wave', ['#0b0b0b', '#fbbf24', '#dc2626']],
    ['signal-fires', 'Signal Fires', 'Amara Lund', 'fan', ['#450a0a', '#f97316', '#fde68a']],
    ['midnight-orchard', 'Midnight Orchard', 'The Fennel Brothers', 'moon', ['#0b0b0b', '#f97316', '#fbbf24']]
]

const freezeAll = (list) => Object.freeze(list.map(item => Object.freeze(item)))

export const COVER_SETS = Object.freeze({
    real: freezeAll(REAL.map(([k, t, a, y, art, href]) => ({ k, t, a, y, art, href, kind: 'real' }))),
    fictional: freezeAll(FICTIONAL.map(([k, t, a, p, c]) => ({ k, t, a, y: null, p, c: Object.freeze(c), href: '', kind: 'fictional' })))
})

/** The set the build asked for: "real" only when it says so; anything else is the fictional set. */
export function chooseCoverSet(value) {
    return String(value ?? '').trim().toLowerCase() === 'real' ? 'real' : 'fictional'
}

/** The records of a set, as the page reads them. */
export const albumsOf = (setName) => COVER_SETS[chooseCoverSet(setName)]

const escapeHtml = (text) => String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const n = (value) => Number(value.toFixed(1))

/** The background art of a fictional sleeve, by pattern (the v1's canvas drawing, as SVG). */
const PATTERNS = {
    sun: (S, [c0, c1, c2]) => {
        let out = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c0}"/><stop offset=".5" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>`
        out += `<rect width="${S}" height="${S}" fill="url(#g)"/><circle cx="${n(S * 0.7)}" cy="${n(S * 0.3)}" r="${n(S * 0.12)}" fill="#fde68a"/>`
        for (let y = S * 0.45; y < S; y += S * 0.05) out += `<rect y="${n(y)}" width="${S}" height="${n(S * 0.012)}" fill="rgba(0,0,0,.28)"/>`
        return out
    },
    stripes: (S, c) => {
        let out = ''
        for (let i = 0; i < 12; i++) out += `<rect x="${n(i * S / 12)}" width="${n(S / 12)}" height="${S}" fill="${c[i % 3]}"/>`
        return out
    },
    rings: (S, [c0, c1, c2]) => {
        let out = ''
        const step = S * 0.045
        for (let r = S * 0.5; r > 0; r -= step) {
            const k = Math.round(r / step) % 3
            out += `<circle cx="${n(S / 2)}" cy="${n(S * 0.45)}" r="${n(r)}" fill="${k === 0 ? c1 : k === 1 ? c2 : c0}"/>`
        }
        return out
    },
    split: (S, [, c1, c2]) => `<path d="M0 ${n(S * 0.62)}L${S} ${n(S * 0.38)}L${S} ${S}L0 ${S}Z" fill="${c1}"/><circle cx="${n(S * 0.3)}" cy="${n(S * 0.3)}" r="${n(S * 0.07)}" fill="${c2}"/>`,
    fan: (S, c) => {
        let out = ''
        const cx = S * 0.5, cy = S, R = S * 1.2
        for (let i = 0; i < 18; i++) {
            const a0 = Math.PI + i * Math.PI / 18, a1 = Math.PI + (i + 1) * Math.PI / 18
            out += `<path d="M${n(cx)} ${n(cy)}L${n(cx + R * Math.cos(a0))} ${n(cy + R * Math.sin(a0))}A${n(R)} ${n(R)} 0 0 1 ${n(cx + R * Math.cos(a1))} ${n(cy + R * Math.sin(a1))}Z" fill="${c[i % 3]}"/>`
        }
        return out
    },
    eq: (S, [, c1, c2]) => {
        let out = `<defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${c2}"/><stop offset="1" stop-color="${c1}"/></linearGradient></defs>`
        for (let i = 0; i < 14; i++) {
            const h = S * (0.2 + 0.6 * Math.abs(Math.sin(i * 1.7)))
            out += `<rect x="${n(S * 0.08 + i * S * 0.06)}" y="${n(S * 0.82 - h)}" width="${n(S * 0.04)}" height="${n(h)}" fill="url(#g)"/>`
        }
        return out
    },
    grid: (S, [, c1]) => {
        let out = ''
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) out += `<circle cx="${n(S * 0.1 + i * S * 0.115)}" cy="${n(S * 0.1 + j * S * 0.09)}" r="${n(S * 0.02 * (1 + ((i + j) % 4)))}" fill="${c1}"/>`
        }
        return out
    },
    wave: (S, [, c1, c2]) => {
        let out = ''
        for (let k = 0; k < 9; k++) {
            const points = []
            for (let x = 0; x <= S; x += 12) points.push(`${x},${n(S * 0.25 + k * S * 0.06 + Math.sin(x / S * 7 + k * 0.6) * S * 0.06)}`)
            out += `<polyline points="${points.join(' ')}" fill="none" stroke="${k % 2 ? c1 : c2}" stroke-width="${n(S * 0.018)}"/>`
        }
        return out
    },
    moon: (S, [c0, c1, c2]) => `<circle cx="${n(S * 0.5)}" cy="${n(S * 0.42)}" r="${n(S * 0.24)}" fill="${c1}"/><circle cx="${n(S * 0.6)}" cy="${n(S * 0.36)}" r="${n(S * 0.22)}" fill="${c0}"/><rect y="${n(S * 0.7)}" width="${S}" height="${n(S * 0.012)}" fill="${c2}"/>`
}

const DARK_GROUNDS = ['#0b0b0b', '#1c1917', '#111827', '#450a0a']

/** A fictional sleeve, 360 px, as an SVG document: the art, the title, the artist and the «FICTIONAL» tag (v1's drawSleeve). */
export function fictionalCoverSvg(album, S = SIZE) {
    const { t, a, p, c } = album
    const dark = DARK_GROUNDS.includes(c[0]) && p !== 'sun' && p !== 'fan'
    const ink = (p === 'stripes' || p === 'split' || dark) ? '#ffffff' : '#0b0b0b'
    // the title shrinks to fit 86% of the width (about 0.62 em per character of a heavy face)
    const titleSize = n(Math.min(S * 0.085, (S * 0.86) / (t.length * 0.62)))
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">`
        + `<rect width="${S}" height="${S}" fill="${c[0]}"/>`
        + PATTERNS[p](S, c)
        + `<g fill="${ink}" font-family="Syne, Arial Black, Arial, Helvetica, sans-serif">`
        + `<text x="${n(S * 0.07)}" y="${n(S * 0.88)}" font-size="${titleSize}" font-weight="800">${escapeHtml(t)}</text>`
        + `<text x="${n(S * 0.07)}" y="${n(S * 0.94)}" font-size="${n(S * 0.038)}" font-weight="700" font-family="Arial, Helvetica, sans-serif">${escapeHtml(a.toUpperCase())}</text></g>`
        + `<rect x="${n(S * 0.06)}" y="${n(S * 0.05)}" width="${n(S * 0.27)}" height="${n(S * 0.06)}" fill="rgba(0,0,0,.55)"/>`
        + `<text x="${n(S * 0.08)}" y="${n(S * 0.093)}" font-size="${n(S * 0.03)}" font-weight="700" font-family="Arial, Helvetica, sans-serif" fill="#fde7c8">FICTIONAL</text>`
        + '</svg>'
}

/** An SVG as a data: URL that survives an HTML attribute: double quotes become single, the rest is escaped. */
const svgDataUrl = (svg) => 'data:image/svg+xml,' + svg.replace(/"/g, "'").replace(/[%#&<>{}|\\^`[\]\n]/g, encodeURIComponent)

/** Where the page gets a record's image. */
export function coverSrc(album) {
    return album.kind === 'real' ? `${APPLE_ART}${album.art}/${SIZE}x${SIZE}bb.webp` : svgDataUrl(fictionalCoverSvg(album))
}

const altOf = (album) => album.kind === 'real'
    ? `${album.t} by ${album.a} (${album.y}), album cover`
    : `${album.t} by ${album.a}, a fictional album with original artwork`

/** The sleeves of the crate, as the page's CSS crate and the 3D crate read them (data-* carry the caption). */
export function coverImagesHtml(setName) {
    return albumsOf(setName).map((album, i) => '<img'
        + ` class="sl s${i}" style="--p:${i}" data-i="${i}" data-k="${album.k}"`
        + ` data-t="${escapeHtml(album.t)}" data-a="${escapeHtml(album.a)}" data-y="${album.y ?? ''}" data-href="${escapeHtml(album.href)}"`
        + ` alt="${escapeHtml(altOf(album))}" width="${SIZE}" height="${SIZE}" decoding="async" crossorigin="anonymous"`
        + ` src="${coverSrc(album)}">`).join('\n        ')
}

/** "Artist · Year", or "Artist · fictional album": the line under the title in the caption (the fictional tag in the page's language). */
export const captionLine = (album, lang = 'pt') => album.kind === 'real' ? `${album.a} · ${album.y}` : `${album.a} · ${t('c.fictional', lang)}`

/** The caption of the stage, written for the front record (the page changes it as the record plays). Its texts are filled from copy.js by the build. */
export function captionHtml(setName) {
    const album = albumsOf(setName)[0]
    const who = `<span class="who"><span id="who"><b>${escapeHtml(album.t)}</b>${escapeHtml(captionLine(album))}</span>`
    if (album.kind !== 'real') {
        return `${who}<span class="src" data-i18n="c.src.fict"></span></span>`
            + '<a class="am" id="am" hidden></a>'
    }
    return `${who}<span class="src" data-i18n="c.src"></span></span>`
        + `<a class="am" id="am" href="${escapeHtml(album.href)}" target="_blank" rel="noopener"><span class="mk" aria-hidden="true">♫</span><span data-i18n="c.listen"></span><span class="sr" data-i18n="c.newtab"></span></a>`
}

/** The footer line about the covers: what they are and whose they are. */
export function creditHtml(setName) {
    return `<p data-i18n="${chooseCoverSet(setName) === 'real' ? 'credit.real' : 'credit.fict'}"></p>`
}

/** Over invented covers the stage says so, in words, not only inside the art. */
export function stageTagHtml(setName) {
    return chooseCoverSet(setName) === 'real' ? '' : '<span class="credit-tag" data-i18n="tag.fict"></span>'
}
