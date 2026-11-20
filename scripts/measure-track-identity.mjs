#!/usr/bin/env node
/**
 * The measure of F74: for the albums of test/fixtures/trackIdentity/measuredAlbums.json (the track
 * titles Apple Music writes and the track list of the BestEverAlbums page, read on the date the
 * file says), how many tracks get a rating by the comparison of before F74 and by the one rule of
 * today (shared/trackIdentity.js). No network: it reads the fixture.
 *
 *   node scripts/measure-track-identity.mjs            the table, as Markdown
 *   node scripts/measure-track-identity.mjs --tracks   every track of every album, before and after
 *
 * "Before" is a frozen copy of what the server did until F74 (shared/normalize.js `normalizeKey`,
 * then server/lib/normalize.js `toFuzzyCore`): it lives here only, to be measured against.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { matchTracks, TRACK_IDENTITY_RULE_VERSION } from '../shared/trackIdentity.js'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const { albums, readAt } = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/fixtures/trackIdentity/measuredAlbums.json'), 'utf8'))

// ---- the comparison of before F74, frozen ---------------------------------------------------------
const keyBefore = (text) => String(text || '').toLowerCase()
    .replace(/\s*\(.*?\)/g, '').replace(/\s*\[.*?\]/g, '').replace(/\s*\{.*?\}/g, '')
    .replace(/\s*-\s*.*?remaster.*/g, '').replace(/\s*-\s*.*?mix.*/g, '')
    .replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
function fuzzyBefore(text) {
    let core = String(text || '').toLowerCase().split(' by ')[0].split(':')[0].split(' - ')[0]
    core = core.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s*[([][^()]*?[)\]]/g, '').replace(/[^a-z0-9]/g, '').trim()
    if (core.startsWith('the')) core = core.substring(3)
    return core.endsWith('e') && core.length > 4 ? core.slice(0, -1) : core
}
function matchedBefore(tracks, page) {
    const rated = page.filter(entry => entry.rating !== null)
    const byKey = new Map(rated.map(entry => [keyBefore(entry.trackTitle), entry]))
    return tracks.map(title => {
        const entry = byKey.get(keyBefore(title)) || page.find(one => fuzzyBefore(one.trackTitle) === fuzzyBefore(title))
        return entry && entry.rating !== null ? { entry } : null
    })
}

// ---- the measure ----------------------------------------------------------------------------------
const rated = (match) => Boolean(match && match.entry.rating !== null)

/**
 * A rating that went to a track it is not of: the entry was already given to an earlier track of
 * the album (one rating on two tracks), read with the rule of today as the judge of "the same track".
 */
function wrongOnes(matches) {
    const seen = new Set()
    return matches.filter(match => {
        if (!rated(match)) return false
        const again = seen.has(match.entry)
        seen.add(match.entry)
        return again
    }).length
}

export function measure() {
    return albums.map(({ album, artist, tracks, page, pageOfTheEdition }) => {
        const before = matchedBefore(tracks, page)
        // After F74 the server reads the page of the edition when the first page is of another one
        const after = matchTracks(tracks, (pageOfTheEdition || { page }).page)
        return {
            album,
            artist,
            tracks: tracks.length,
            onThePage: (pageOfTheEdition || { page }).page.filter(entry => entry.rating !== null).length,
            before: before.filter(rated).length,
            sharedBefore: wrongOnes(before),
            after: after.filter(rated).length,
            rows: tracks.map((title, index) => ({ title, before: before[index], after: after[index] }))
        }
    })
}

function table(results) {
    const lines = [
        `Rule version ${TRACK_IDENTITY_RULE_VERSION}; pages read on ${readAt}.`,
        '',
        '| Album | Tracks | Rated on the page | Before | of which one rating on two tracks | After |',
        '|---|---|---|---|---|---|',
        ...results.map(r => `| ${r.artist} «${r.album}» | ${r.tracks} | ${r.onThePage} | ${r.before} | ${r.sharedBefore} | ${r.after} |`)
    ]
    const sum = (field) => results.reduce((total, r) => total + r[field], 0)
    lines.push(`| **Total** | ${sum('tracks')} | ${sum('onThePage')} | ${sum('before')} | ${sum('sharedBefore')} | ${sum('after')} |`)
    return lines.join('\n')
}

function everyTrack(results) {
    const cell = (match) => (rated(match) ? String(match.entry.rating).padStart(3) : '  -')
    return results.map(r => [
        `\n${r.artist} «${r.album}»`,
        ...r.rows.map((row, index) => `  ${String(index + 1).padStart(2)}  ${cell(row.before)} -> ${cell(row.after)}  ${row.title}${row.after ? `   [${row.after.reason}: ${row.after.entry.trackTitle}]` : ''}`)
    ].join('\n')).join('\n')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const results = measure()
    console.log(process.argv.includes('--tracks') ? everyTrack(results) : table(results))
}
