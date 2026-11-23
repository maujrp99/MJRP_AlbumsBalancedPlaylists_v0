/**
 * F83 TASK-06 (REQ-02, REQ-05; proposal § 4.4, risk R20): the icon in React gives the HTML of today, with no raw HTML.
 *
 * The icons are data (utils/iconShapes.js) that two readers draw: `getIcon()` (text, the yardstick in test/support/iconMarkup.js; the
 * hand-made screens that used it are gone) and `<Icon>` (elements, for the React screens). The proof, for every icon the site has, with and without a class: the text is the string
 * the site had before (the fixture holds those strings, copied before the change), and the DOM React makes is the DOM the
 * browser makes from that string. One exception, with its reason: MJRPLogo (used by no screen) lost its comments and the line breaks and
 * indentation between its elements, which are not drawn.
 */
import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { Icon } from '../../public/js/ui/Icon'
import { getIcon, Icons } from '../support/iconMarkup.js'
import fs from 'node:fs'
import path from 'node:path'
import before from '../fixtures/iconMarkupBeforeF83.json'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const BEFORE = before as Record<string, string>
const NAMES = Object.keys(BEFORE)

/** The one icon whose text is not byte for byte the one of before, and why. */
const EXCEPTION = { name: 'MJRPLogo', why: 'no screen uses it; its comments and the white space between its elements are not drawn' }
const withoutSpaceAndComments = (markup: string) => markup.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s+$/g, '')

/** What the browser makes of a string of HTML. */
const domOfString = (markup: string) => {
    const host = document.createElement('div')
    host.innerHTML = markup
    return host.innerHTML
}

async function domOfReact(name: string, className?: string) {
    const host = document.createElement('div')
    const root = createRoot(host)
    await act(async () => { root.render(<Icon name={name} className={className} />) })
    const html = host.innerHTML
    await act(async () => { root.unmount() })
    return html
}

describe('getIcon: the text the hand-made screens have always had', () => {
    it('there are as many icons as before, none lost and none added', () => {
        expect(Object.keys(Icons).sort()).toEqual([...NAMES].sort())
        expect(NAMES.length).toBe(65)
    })

    it('every icon is the string of before, byte for byte, with and without a class', () => {
        const different = NAMES.filter(name => name !== EXCEPTION.name).filter(name =>
            getIcon(name) !== BEFORE[name] || getIcon(name, 'w-4 h-4 text-orange-400') !== BEFORE[name].replace('<svg', '<svg class="w-4 h-4 text-orange-400"'))
        expect(different).toEqual([])
    })

    it(`the exception, MJRPLogo (${EXCEPTION.why}): the same but for the space between the elements`, () => {
        expect(getIcon(EXCEPTION.name)).toBe(withoutSpaceAndComments(BEFORE[EXCEPTION.name]))
        expect(domOfString(getIcon(EXCEPTION.name))).toBe(domOfString(withoutSpaceAndComments(BEFORE[EXCEPTION.name])))
    })

    it('a name that is not an icon gives an empty text, as before; an empty class adds no attribute', () => {
        expect(getIcon('NoSuchIcon')).toBe('')
        expect(getIcon('Undo', '')).toBe(BEFORE.Undo)
    })
})

describe('the registry (F64 UAT-20, carried from test/components/Icons.test.js)', () => {
    it('Plus is the drawing the app has always shown: a vertical and a horizontal line', () => {
        expect(Icons.Plus).toContain('<line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>')
        expect(Icons.Plus).not.toContain('<path')
    })

    it('getIcon puts the classes asked for on the drawing', () => {
        const drawn = getIcon('Plus', 'w-4 h-4')

        expect(drawn).toContain('w-4 h-4')
        expect(drawn).toContain('<line x1="12" x2="12" y1="5" y2="19"/>')
    })

    it('no icon is written twice in the data', () => {
        const source = fs.readFileSync(path.resolve(process.cwd(), 'public/js/utils/iconShapes.js'), 'utf8')
        const names = [...source.matchAll(/^ {4}([A-Za-z0-9_]+): \{"a":/gm)].map(match => match[1])
        const twice = names.filter((name, index) => names.indexOf(name) !== index)

        expect(names.length).toBeGreaterThan(30)
        expect(twice).toEqual([])
    })
})

describe('<Icon>: the same HTML in React', () => {
    it('every icon draws the DOM the browser makes from the string of before, with no class and with one', async () => {
        const different: string[] = []
        for (const name of NAMES.filter(icon => icon !== EXCEPTION.name)) {
            const plain = await domOfReact(name)
            const classed = await domOfReact(name, 'w-5 h-5 text-orange-400')
            if (plain !== domOfString(BEFORE[name])) different.push(name)
            if (classed !== domOfString(BEFORE[name].replace('<svg', '<svg class="w-5 h-5 text-orange-400"'))) different.push(`${name}+class`)
        }
        expect(different).toEqual([])
    })

    it('the exception draws the same elements, in the same order, with the attributes of before', async () => {
        expect(await domOfReact(EXCEPTION.name)).toBe(domOfString(withoutSpaceAndComments(BEFORE[EXCEPTION.name])))
    })

    it('a name that is not an icon draws nothing', async () => {
        expect(await domOfReact('NoSuchIcon')).toBe('')
    })

    it('draws elements, not text: no HTML is injected', async () => {
        const host = document.createElement('div')
        const root = createRoot(host)
        await act(async () => { root.render(<Icon name="Search" className="w-4 h-4" />) })
        const svg = host.querySelector('svg')!
        expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg')
        expect(svg.getAttribute('class')).toBe('w-4 h-4')
        expect(svg.querySelectorAll('circle, path')).toHaveLength(2)
        await act(async () => { root.unmount() })
    })
})
