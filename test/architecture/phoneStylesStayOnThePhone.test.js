// @vitest-environment node
/**
 * Fitness function of F76 (REQ-12): the redesign of the phone does not touch the computer.
 *
 * Every rule of the phone's stylesheets - public/css/mobile.css, the base, and one file per screen
 * under public/css/mobile/ - is written inside `@media (max-width: 899px)`. A rule outside it
 * would act on the computer's screen too, and nothing else would warn. `@supports`, `@keyframes`
 * and other media queries are fine INSIDE that one.
 *
 * Two files are not rules of the phone and have their own, narrower, contract:
 *   public/css/mobile/screens.css  only brings the screens' files in (`@import`), all of them;
 *   public/css/safe-area.css       one rule, for a touch screen lying down, that only writes the
 *                                  size of the safe areas (zero where a screen has none).
 *
 * The same line is drawn in JavaScript by public/js/utils/isPhone.js: the two must say the same.
 *
 * What it does not prove: that the computer's screen looks the same. Only the comparison of
 * screenshots shows that (reports/evidence/F76).
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'
import { PHONE_QUERY } from '../../public/js/utils/isPhone.js'

const CSS = path.resolve(process.cwd(), 'public/css')
const BASE = 'mobile.css'
const SCREENS_DIR = 'mobile'
const SCREENS_INDEX = 'mobile/screens.css'
const SAFE_AREA = 'safe-area.css'
const SAFE_AREA_QUERY = '(hover: none) and (pointer: coarse) and (max-height: 500px)'

const read = (file) => fs.readFileSync(path.join(CSS, file), 'utf8')
const screenFiles = () => fs.readdirSync(path.join(CSS, SCREENS_DIR))
    .filter(file => file.endsWith('.css'))
    .map(file => `${SCREENS_DIR}/${file}`)
    .filter(file => file !== SCREENS_INDEX)
    .sort()

const isPhoneQuery = (node) => node.type === 'atrule' && node.name === 'media' && node.params.trim() === PHONE_QUERY
const describeNode = (node) => (node.type === 'rule' ? node.selector : `@${node.name} ${node.params}`).replace(/\s+/g, ' ').slice(0, 80)

/** What a stylesheet of the phone has outside the phone's media query (comments left out). */
export function outsideThePhone(css) {
    return postcss.parse(css).nodes
        .filter(node => node.type !== 'comment' && !isPhoneQuery(node))
        .map(describeNode)
}

describe('the styles of the phone stay on the phone (F76, REQ-12)', () => {
    it('the phone is the same screen for the stylesheets and for the code', () => {
        expect(PHONE_QUERY).toBe('(max-width: 899px)')
    })

    it('Tailwind\'s md breakpoint is the first screen that is not a phone, so a screen never mixes the two (judge P2-2, F88)', async () => {
        const { default: config } = await import('../../tailwind.config.js')
        expect(config.theme.extend.screens.md).toBe('900px')
        expect(PHONE_QUERY).toBe('(max-width: 899px)')
    })

    it('the check sees a rule written outside the media query, and lets pass what is inside', () => {
        expect(outsideThePhone('.a { color: red } @media (max-width: 899px) { .b { color: red } }')).toEqual(['.a'])
        expect(outsideThePhone('@media (max-width: 900px) { .b { color: red } }')).toEqual(['@media (max-width: 900px)'])
        expect(outsideThePhone('@keyframes x { from { opacity: 0 } }')).toEqual(['@keyframes x'])
        const inside = '/* note */ @media (max-width: 899px) { .b { color: red } @supports (x: y) { .c { color: red } } @keyframes x { from { opacity: 0 } } }'
        expect(outsideThePhone(inside)).toEqual([])
    })

    it('mobile.css has no rule outside the media query of the phone', () => {
        expect(outsideThePhone(read(BASE))).toEqual([])
    })

    it('no file of a screen has a rule outside the media query of the phone', () => {
        const files = screenFiles()
        expect(files.length).toBeGreaterThan(0)
        const offenders = files.flatMap(file => outsideThePhone(read(file)).map(what => `${file}: ${what}`))
        expect(offenders).toEqual([])
    })

    it('screens.css only brings the files of the screens in, and brings all of them', () => {
        const nodes = postcss.parse(read(SCREENS_INDEX)).nodes.filter(node => node.type !== 'comment')
        expect(nodes.filter(node => !(node.type === 'atrule' && node.name === 'import')).map(describeNode)).toEqual([])
        const brought = nodes.map(node => `${SCREENS_DIR}/${node.params.replace(/['"]/g, '').replace(/^\.\//, '')}`).sort()
        expect(brought).toEqual(screenFiles())
    })

    it('safe-area.css is one rule for a touch screen lying down, and writes only the safe areas', () => {
        const nodes = postcss.parse(read(SAFE_AREA)).nodes.filter(node => node.type !== 'comment')
        expect(nodes.map(describeNode)).toEqual([`@media ${SAFE_AREA_QUERY}`])
        const declarations = []
        nodes[0].walkDecls(decl => declarations.push(`${decl.parent.selector} ${decl.prop}: ${decl.value}`))
        expect(declarations).toEqual([
            'body padding-left: env(safe-area-inset-left, 0px)',
            'body padding-right: env(safe-area-inset-right, 0px)'
        ])
    })

    it('the app loads the base before the screens, after its other styles', () => {
        const app = fs.readFileSync(path.resolve(process.cwd(), 'public/js/app.js'), 'utf8')
        const order = ['../css/index.css', '../css/tailwind.css', '../css/mobile.css', '../css/mobile/screens.css']
            .map(file => app.indexOf(`import '${file}'`))
        expect(order.every(index => index >= 0)).toBe(true)
        expect([...order].sort((a, b) => a - b)).toEqual(order)
    })
})
