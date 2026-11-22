/**
 * The states of the panel «Reconfigure your Music Playlist Blend» (the panel to generate again, on the playlists screen) that F83 wave 7a
 * checks, written once so the panel as it was (hand-made: components/playlists/RegeneratePanel.js with the recipe cards and the
 * ingredients panel of the Blend) and the panel as it is (React: ui/recipe/ and screens/playlists/RegeneratePanel.tsx) are asked the
 * same thing: the same playlists on screen, the same clicks, and what stands in the panel (`#regeneratePanelMount`) after each step, the
 * configuration the panel handed to the controller when «Regenerate Playlists» was pressed, the focus, and where the phone scrolled.
 *
 * `normalize` is the proof's, as in wave 1 (the elements, the attributes in alphabetical order, the classes as a set, the style as the
 * browser writes it, the white space collapsed), with two things more: the white space at the two ends of an element is not compared (a
 * browser does not draw it inside a block, a flex item or an inline block, and the hand-made HTML had it where a template was broken
 * in lines), and two text nodes side by side are marked (`¦`), because the old HTML had ONE text node where the React piece must have
 * one: the Chromium shapes each node apart (wave 4, lesson 1).
 *
 * Used by: reports/evidence/F83/wave-7a/capture-before.test.js (run once, on the hand-made panel, before it was touched; it wrote
 * test/fixtures/regenerateBeforeF83.json) and test/screens/playlists/RegeneratePanel.sameAsBefore.test.tsx (the React panel, against that file).
 * No import from the app that the doubles of the world outside would load: only the stand-ins of the playlists screen's own scenarios.
 */
import { generated } from './playlistsScenarios.js'

/** The value of an attribute as the proof compares it: the style as the browser writes it, the classes as a set (their order is not drawn). */
const valueOf = (element, name, value) => {
    if (name === 'style') return element.style.cssText
    if (name === 'class') return value.split(/\s+/).filter(Boolean).sort().join(' ')
    return value
}

const attributesOf = (element) => [...element.attributes]
    .map(({ name, value }) => [name, valueOf(element, name, value)])
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ` ${name}="${value}"`)
    .join('')

/** A short fingerprint of a drawing (FNV-1a): an icon is kept as its class and the fingerprint of every shape inside it. */
const fingerprint = (text) => {
    let hash = 2166136261
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
    return (hash >>> 0).toString(36)
}

/** One node as text: elements with sorted attributes, text with white space collapsed and cut at the two ends of its element. */
function describe(node) {
    if (node.nodeType === 3) return node.textContent.replace(/\s+/g, ' ')
    if (node.nodeType !== 1) return ''
    const tag = node.tagName.toLowerCase()
    // a comment is not drawn, and a text of white space only between two tags is not compared (wave 0: `>\s+<`)
    const kids = [...node.childNodes].filter(child => child.nodeType === 1 || (child.nodeType === 3 && /\S/.test(child.textContent)))
    const parts = kids.map(describe)
    if (kids.length && kids[0].nodeType === 3) parts[0] = parts[0].replace(/^\s+/, '')
    if (kids.length && kids[kids.length - 1].nodeType === 3) parts[kids.length - 1] = parts[kids.length - 1].replace(/\s+$/, '')
    // two text nodes side by side: the old HTML never had them
    const inner = parts.map((part, i) => (i > 0 && kids[i].nodeType === 3 && kids[i - 1].nodeType === 3 ? `¦${part}` : part)).join('')
    const whole = `<${tag}${attributesOf(node)}>${inner}</${tag}>`
    return tag === 'svg' ? `<svg class="${node.getAttribute('class')}" shape="${fingerprint(whole)}"/>` : whole
}

/** A piece of the page as the proof compares it. It reads a COPY: the proof must not touch the live page. */
export function normalize(element) {
    if (!element) return null
    const copy = element.cloneNode(true)
    const live = element.querySelectorAll('input')
    // what a field holds now (the property), never how it was written (the attribute)
    copy.querySelectorAll('input').forEach((input, i) => input.setAttribute('value', live[i].value))
    return describe(copy).replace(/>\s+</g, '><').trim()
}

/** What has the focus, in words. */
export const focusMark = () => {
    const active = document.activeElement
    if (!active || active === document.body) return 'body'
    return `${active.tagName.toLowerCase()} ${active.id || active.dataset?.action || active.dataset?.recipeId || active.className}`
}

const PANEL = '#regeneratePanelMount'
const REGENERATE = '[data-action="regenerate-playlists"]'
const TOGGLE = '[data-action="toggle-regenerate-panel"]'

/** Playlists as the blend made them, with the recipe they remember. */
const madeWith = (meta, extra = {}) => generated().map(p => ({ ...p, ...extra, _meta: { ...meta } }))

const BALANCED = { algorithmId: 'mjrp-balanced-cascade', rankingId: 'balanced', targetDuration: 75 * 60 }
const POPULAR = { algorithmId: 'top-n-popular', rankingId: 'spotify', trackCount: 4, outputMode: 'multiple', groupingStrategy: 'flat_ranked', targetDuration: 50 * 60 }
const ACCLAIMED = { algorithmId: 'top-n-acclaimed', rankingId: 'bea', trackCount: 6, outputMode: 'single', groupingStrategy: 'shuffle' }
const USER = { algorithmId: 'top-n-user', rankingId: 'user', trackCount: 5, outputMode: 'auto', groupingStrategy: 'artist_rank', targetDuration: 45 * 60 }

/** Every card of the recipes, by the id the algorithms give them. */
const RECIPES = ['mjrp-balanced-cascade', 'top-n-popular', 'top-n-acclaimed', 'top-n-user']

/** Presses a control that holds the focus, then says where the focus is. */
const press = async (h, selector, label) => {
    document.querySelector(selector)?.focus()
    await h.click(selector)
    h.note(label, focusMark())
}

/**
 * Each scenario: a name, whether it is the phone, what is on screen (`playlists`), how the controller answers «Regenerate» (`answer`:
 * `ok`, `follows` (the playlists on screen are the ones it made) or `fails`), and what it does once the screen is mounted.
 * `h.snap(label)` writes down the panel (or the first element that matches a selector); `h.config(label)` presses «Regenerate Playlists»
 * and writes down the configuration the panel handed to the controller; `h.note(label, text)` writes down a text.
 */
export const SCENARIOS = [
    {
        name: 'closed', run: async (h) => { h.snap('closed') }
    },
    {
        name: 'open and closed again', run: async (h) => {
            await press(h, TOGGLE, 'focus after opening')
            h.snap('open')
            await press(h, TOGGLE, 'focus after closing')
            h.snap('closed again')
            await h.click(TOGGLE)
            h.snap('open a second time')
        }
    },
    {
        name: 'opened on the recipe of the balanced playlists', playlists: madeWith(BALANCED), run: async (h) => {
            await h.click(TOGGLE)
            h.snap('open')
            await h.config('what a press of Regenerate hands over')
        }
    },
    {
        name: 'opened on the recipe of the Spotify popularity playlists', playlists: madeWith(POPULAR), run: async (h) => {
            await h.click(TOGGLE)
            h.snap('open')
            await h.config('what a press of Regenerate hands over')
        }
    },
    {
        name: 'opened on the recipe of the acclaimed playlists', playlists: madeWith(ACCLAIMED), run: async (h) => {
            await h.click(TOGGLE)
            h.snap('open')
            await h.config('what a press of Regenerate hands over')
        }
    },
    {
        name: 'opened on the recipe of the own ranking playlists', playlists: madeWith(USER), run: async (h) => {
            await h.click(TOGGLE)
            h.snap('open')
            await h.config('what a press of Regenerate hands over')
        }
    },
    {
        name: 'playlists saved before F62 do not say their recipe: the recommended one', playlists: generated().map(({ _meta, ...rest }) => rest), run: async (h) => {
            await h.click(TOGGLE)
            h.snap('open')
            await h.config('what a press of Regenerate hands over')
        }
    },
    {
        name: 'a recipe the registry does not know opens on the first one', playlists: madeWith({ algorithmId: 'gone-recipe', rankingId: 'bea', trackCount: 2 }), run: async (h) => {
            await h.click(TOGGLE)
            h.snap('open')
            await h.config('what a press of Regenerate hands over')
        }
    },
    {
        name: 'each recipe chosen', run: async (h) => {
            await h.click(TOGGLE)
            for (const id of RECIPES) {
                await h.click(`[data-recipe-id="${id}"]`)
                h.snap(`${id} chosen`)
                h.note(`focus after ${id}`, focusMark())
            }
            await h.config('what a press of Regenerate hands over')
        }
    },
    {
        name: 'each ingredient of a Top N recipe', playlists: madeWith(USER), run: async (h) => {
            await h.click(TOGGLE)
            for (const n of [1, 5, 10]) {
                await press(h, `.blend-track-count-btn[data-count="${n}"]`, `focus after Top ${n}`)
                h.snap(`Top ${n}`)
            }
            for (const value of ['by_album', 'flat_ranked', 'artist_rank', 'ranked_interleave', 'shuffle']) {
                await press(h, `.blend-grouping-btn[data-grouping="${value}"]`, `focus after ${value}`)
                h.snap(value)
            }
            for (const value of ['single', 'multiple', 'auto']) {
                await press(h, `.blend-output-btn[data-output="${value}"]`, `focus after ${value}`)
                h.snap(`structure ${value}`)
            }
            await h.config('what a press of Regenerate hands over')
        }
    },
    {
        name: 'the ranking source of the balanced recipe', playlists: madeWith(BALANCED), run: async (h) => {
            await h.click(TOGGLE)
            for (const value of ['spotify', 'bea', 'combined']) {
                await press(h, `.blend-ranking-btn[data-ranking="${value}"]`, `focus after ${value}`)
                h.snap(value)
            }
            await h.config('what a press of Regenerate hands over')
        }
    },
    {
        name: 'the slider of the duration', playlists: madeWith(BALANCED), run: async (h) => {
            await h.click(TOGGLE)
            document.querySelector('#blend-duration-slider').focus()
            await h.slide('#blend-duration-slider', 90)
            h.snap('the slider at 90')
            h.note('focus after the slider', focusMark())
            await h.config('what a press of Regenerate hands over')
            await h.click('.blend-ranking-btn[data-ranking="bea"]')
            h.snap('a button drew the ingredients again: the slider keeps its place')
            await h.slide('#blend-duration-slider', 30)
            await h.slide('#blend-duration-slider', 180)
            h.snap('the slider at 180')
            await h.config('what a press of Regenerate hands over, the slider at 180')
        }
    },
    {
        name: 'the duration shows where it changes the result', playlists: madeWith(POPULAR), run: async (h) => {
            await h.click(TOGGLE)
            h.snap('Multiple: the duration is shown')
            await h.click('.blend-output-btn[data-output="single"]')
            h.snap('Single: no duration')
            await h.click('.blend-output-btn[data-output="auto"]')
            h.snap('Auto: the duration is shown')
        }
    },
    {
        name: 'a change is kept through a redraw of the screen', playlists: madeWith(POPULAR), run: async (h) => {
            await h.click(TOGGLE)
            await h.click('.blend-track-count-btn[data-count="8"]')
            await h.click('.blend-output-btn[data-output="single"]')
            await h.click('[data-recipe-id="top-n-acclaimed"]')
            await h.type('#batchNameInput', 'Road trip')
            h.snap('after a letter typed in the field of the name: the panel is not drawn again')
            await h.nameBatch('Road trip')
            h.snap('after the batch got a name in the playlists: the panel is made again from what it remembers')
            h.note('the name of the batch', document.querySelector(PANEL + ' .regenerate-panel').dataset.batchName)
            await h.config('what a press of Regenerate hands over')
        }
    },
    {
        name: 'an option chosen on one recipe and hidden on the next still goes to the generation', playlists: madeWith(POPULAR), run: async (h) => {
            await h.click(TOGGLE)
            await h.click('.blend-track-count-btn[data-count="7"]')
            await h.click('.blend-grouping-btn[data-grouping="artist_rank"]')
            await h.click('.blend-output-btn[data-output="single"]')
            await h.click('[data-recipe-id="mjrp-balanced-cascade"]')
            h.snap('the balanced recipe: no Top #, no grouping, no structure')
            await h.config('what a press of Regenerate hands over')
        }
    },
    {
        name: 'Regenerate Playlists', playlists: madeWith(ACCLAIMED), run: async (h) => {
            await h.click(TOGGLE)
            document.querySelector(REGENERATE).focus()
            await h.config('the first press')
            h.note('focus after the press', focusMark())
            h.snap('after the press')
            await h.click('[data-recipe-id="top-n-popular"]')
            await h.config('the press after another recipe')
        }
    },
    {
        name: 'after generating, the panel follows the new playlists', playlists: madeWith(POPULAR), answer: 'follows', run: async (h) => {
            await h.click(TOGGLE)
            await h.click('[data-recipe-id="top-n-acclaimed"]')
            await h.click('.blend-track-count-btn[data-count="4"]')
            await h.config('the press')
            h.snap('the panel after the new playlists came')
            await h.nameBatch('Next')
            h.snap('the panel made again: it follows the playlists, not what was chosen before them')
        }
    },
    {
        name: 'a generation that fails keeps what was chosen', playlists: madeWith(POPULAR), answer: 'fails', run: async (h) => {
            await h.click(TOGGLE)
            await h.click('.blend-track-count-btn[data-count="2"]')
            await h.config('the press')
            await h.nameBatch('Again')
            h.snap('after the failure and a redraw: what was chosen is still there')
        }
    },
    {
        name: 'the screen opened again forgets what was chosen', playlists: madeWith(POPULAR), run: async (h) => {
            await h.click(TOGGLE)
            await h.click('.blend-track-count-btn[data-count="2"]')
            await h.click('[data-recipe-id="top-n-user"]')
            await h.reopen()
            h.snap('closed on the screen opened again')
            await h.click(TOGGLE)
            h.snap('open on the recipe of the playlists')
        }
    },
    {
        name: 'one playlist and a name with an ampersand and a quote', playlists: [{ ...madeWith(BALANCED)[0], batchName: "Rock & Roll's best" }], run: async (h) => {
            h.snap('closed')
            h.note('the attributes', JSON.stringify(Object.fromEntries(Object.entries(document.querySelector(PANEL + ' .regenerate-panel').dataset))))
        }
    },
    {
        name: 'the phone: Reconfigure and regenerate opens the panel and scrolls to it', phone: true, playlists: madeWith(USER), run: async (h) => {
            h.snap('closed')
            await h.click('[data-phone-action="playlist-options"]')
            await h.clickWhere('.phone-sheet-action', 'Reconfigure and regenerate')
            h.snap('open')
            h.note('where the phone scrolled', h.scrolled())
            await h.click('.blend-track-count-btn[data-count="2"]')
            await h.click('[data-phone-action="playlist-options"]')
            await h.clickWhere('.phone-sheet-action', 'Reconfigure and regenerate')
            h.snap('asked again while open: it stays open, with what was chosen')
            h.note('where the phone scrolled the second time', h.scrolled())
            await h.config('what a press of Regenerate hands over')
        }
    },
    {
        name: 'the phone: the recipe cards in the narrow column', phone: true, playlists: madeWith(BALANCED), run: async (h) => {
            await h.click(TOGGLE)
            h.snap('open')
            await h.click('[data-recipe-id="top-n-popular"]')
            h.snap('Top N chosen')
        }
    }
]

export const keyOf = (scenario) => `${scenario.phone ? 'phone' : 'computer'} · ${scenario.name}`
