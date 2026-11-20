/**
 * F64 (UAT-20) - the regular expressions of the server that the lint gate made us rewrite
 * (`no-useless-escape`: an escape that changes nothing was removed). Each case below was written
 * and run BEFORE the expression was touched, and passes the same after: the meaning did not change.
 *
 *   server/lib/normalize.js             toCore, toFuzzyCore, normalizeFuzzy (what is between
 *                                       parentheses or brackets leaves the title) and the numbered
 *                                       list read from a plain-text answer of the AI
 *   server/lib/scrapers/besteveralbums.js  the number in front of a track title on a chart page
 *
 * Some of what is pinned is odd ("3 - Gamma" keeps its dash, "12 Monkeys" loses its number): it
 * is what the code does today, written down so that a change of it is a decision, not an accident.
 */
import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'node:module'
import { JSDOM } from 'jsdom'
import { fakeHttp } from './helpers/fakes.js'

const require = createRequire(import.meta.url)
const { toCore, toFuzzyCore, normalizeFuzzy, extractRankingEntries } = require('../../server/lib/normalize.js')
const { createBestEverScraper } = require('../../server/lib/scrapers/besteveralbums.js')

describe('server/lib/normalize.js: what is between parentheses or brackets leaves the title', () => {
    const CASES = [
        // title, toCore, toFuzzyCore, normalizeFuzzy
        ['Lemonade (Deluxe Edition) [2016 Remaster]', 'lemonade', 'lemonad', 'lemonade'],
        ['The Wall [Live] (Disc 1)', 'thewall', 'wall', 'wall'],
        ['Blonde', 'blonde', 'blond', 'blonde'],
        ['Unreal Unearth: Unheard', 'unrealunearthunheard', 'unrealunearth', 'unreal unearth unheard'],
        ['Nevermind (Remastered) by Nirvana', 'nevermindbynirvana', 'nevermind', 'nevermind by nirvana'],
        ['Abbey Road (2019 Mix)', 'abbeyroad', 'abbeyroad', 'abbey road 2019 mix'],
        ['Sgt. Pepper (50th Anniversary Edition)', 'sgtpepper', 'sgtpepper', 'sgt pepper'],
        // a bracket inside a parenthesis, a parenthesis inside a bracket, one that never closes, one that never opened
        ['A (B [C] D)', 'ad', 'ad', 'a b c d'],
        ['A [B (C) D]', 'abd', 'abd', 'a b c d'],
        ['A (B', 'ab', 'ab', 'a b'],
        ['Purple Rain ) x', 'purplerainx', 'purplerainx', 'purple rain x'],
        // the characters the expressions name, each alone
        ['One [Two] Three', 'onethree', 'onethre', 'one two three'],
        ['One (Two] Three', 'onethree', 'onethre', 'one two three'],
        ['One [Two) Three', 'onethree', 'onethre', 'one two three'],
        ['One \\(Two\\) Three', 'onethree', 'onethre', 'one two three']
    ]

    it.each(CASES)('%s', (title, core, fuzzyCore, fuzzy) => {
        expect([toCore(title), toFuzzyCore(title), normalizeFuzzy(title)]).toEqual([core, fuzzyCore, fuzzy])
    })

    it('an edition note is dropped by normalizeFuzzy only when it names an edition', () => {
        expect(normalizeFuzzy('Album [Expanded Version]')).toBe('album')
        expect(normalizeFuzzy('Album (Live at Leeds)')).toBe('album')
        expect(normalizeFuzzy('Album (Part Two)')).toBe('album part two')
    })
})

describe('server/lib/normalize.js: a numbered list in a plain-text answer', () => {
    const titlesOf = (text) => extractRankingEntries({ data: { text } }).map(entry => [entry.position, entry.trackTitle])

    it('reads "1. Title", "1) Title", "#1 Title", "1: Title", "1.Title" and "1- Title"', () => {
        const text = 'Here is the list:\n1. Alpha\n2) Beta (Live)\n#4 Delta\n5: Epsilon\n6.Zeta\n7- Eta\nno number'

        expect(titlesOf(text)).toEqual([[1, 'Alpha'], [2, 'Beta (Live)'], [3, 'Delta'], [4, 'Epsilon'], [5, 'Zeta'], [6, 'Eta']])
    })

    it('as it is today: "3 - Gamma" keeps the dash, and a title that starts with a number loses it', () => {
        expect(titlesOf('3 - Gamma\n12 Monkeys')).toEqual([[1, '- Gamma'], [2, 'Monkeys']])
    })

    it('a backslash is not one of the separators', () => {
        expect(titlesOf('1\\ Alpha')).toEqual([[1, '\\ Alpha']])
    })
})

/**
 * A reader of HTML over jsdom with the part of the cheerio API the chart page parser uses
 * (cheerio is a dependency of server/, not of the root): index access, each, map + get, first,
 * find, filter, siblings, text.
 */
const loadHtml = (html) => {
    const { document } = new JSDOM(String(html)).window
    const wrap = (elements) => Object.assign([...elements], {
        each (fn) { elements.every((el, i) => fn(i, el) !== false); return this },
        map: (fn) => ({ get: () => elements.map((el, i) => fn(i, el)) }),
        first: () => wrap(elements.slice(0, 1)),
        find: (selector) => wrap(elements.flatMap(el => Array.from(el.querySelectorAll(selector)))),
        filter: (fn) => wrap(elements.filter((el, i) => fn(i, el))),
        siblings: (selector) => wrap(elements.flatMap(el => Array.from(el.parentElement.children)
            .filter(other => other !== el && (!selector || other.matches(selector))))),
        text: () => elements.map(el => el.textContent).join('')
    })
    return (target) => wrap(typeof target === 'string' ? Array.from(document.querySelectorAll(target)) : [target])
}

describe('server/lib/scrapers/besteveralbums.js: the number in front of a track title', () => {
    const quiet = { log: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const titlesFrom = async (html) => {
        const scraper = createBestEverScraper({ http: fakeHttp([['thechart.php', html]]), loadHtml, logger: quiet })
        const ranking = await scraper.getRankingFromUrl('https://www.besteveralbums.com/thechart.php?a=1')
        return ranking.evidence.map(row => row.trackTitle)
    }
    const table = (titles) => `<html><body><table><tr><th>Track</th><th>Rating</th></tr>
${titles.map(title => `<tr><td>${title}</td><td>80 (10 votes)</td></tr>`).join('\n')}</table></body></html>`
    const grid = (titles) => `<html><body>
${titles.map(title => `<div><div class="track-list-track"><span class="nav2emph">${title}</span></div><div class="track-list-rating">80 (10 votes)</div></div>`).join('\n')}</body></html>`

    it('"1. ", "2) ", "3: " and "4 - " leave the title; a number that is part of the title stays', async () => {
        const titles = await titlesFrom(table(['1. Enter Sandman', '2) Sad but True', '3: Holier Than Thou', '4 - The Unforgiven', '72 Seasons', '5.Nothing Else Matters', '  6.  Of Wolf and Man']))

        expect(titles).toEqual(['Enter Sandman', 'Sad but True', 'Holier Than Thou', 'The Unforgiven', '72 Seasons', 'Nothing Else Matters', 'Of Wolf and Man'])
    })

    it('as it is today: a title whose number ends in a dot loses it ("10.000 Days"), and "7-Up" and "8\\ Mile" keep theirs', async () => {
        expect(await titlesFrom(table(['10.000 Days', '7-Up', '8\\ Mile']))).toEqual(['000 Days', '7-Up', '8\\ Mile'])
    })

    it('"Track 5. ", "Track 6) - " and "track 7" leave the title on the grid page', async () => {
        const titles = await titlesFrom(grid(['Track 5. Lux Aeterna', 'Track 6) - Inamorata', 'track 7 Shadows Follow', 'Track 8\\ Too Far Gone', 'Tracks of My Tears']))

        expect(titles).toEqual(['Lux Aeterna', 'Inamorata', 'Shadows Follow', '\\ Too Far Gone', 'Tracks of My Tears'])
    })
})
