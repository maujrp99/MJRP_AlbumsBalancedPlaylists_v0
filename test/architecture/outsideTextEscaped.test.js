// @vitest-environment node
/**
 * Fitness function of F59 slice E (UAT-199): text from outside the code goes into an HTML string
 * only through escapeHtml (utils/stringUtils.js).
 *
 * What it reads: every template string of public/js that is HTML - it has a tag in it, or it is
 * given to innerHTML, outerHTML, insertAdjacentHTML or SafeDOM.fromHTML - and the strings nested in
 * one. In those, an interpolation that is DIRECTLY a field or a variable whose name means text from
 * outside (title, name, artist, message...) must be wrapped: ${escapeHtml(album.title)}.
 *
 * What it leaves alone, so that it does not cry wolf: numbers, counts, class names, ids, calls
 * (getIcon(...), a render function, formatDuration(...)) and every name outside the list below.
 * It is a net for the common slip, not a proof: a field with another name passes.
 *
 * The parser is espree, the one ESLint (a devDependency of this project) parses with.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { parseSource, listSourceFiles } from './support/parseSource.js'

const ROOT = path.resolve(process.cwd(), 'public/js')

/** Names that hold text written by a person or sent by a provider. */
const OUTSIDE_NAMES = new Set([
    'title', 'name', 'artist', 'album', 'artistName', 'albumTitle', 'albumName', 'trackName',
    'batchName', 'seriesName', 'playlistName', 'playlistTitle', 'displayName', 'userName', 'email',
    'notes', 'note', 'message', 'stack', 'query', 'titleToShow',
    'coverUrl', 'photoURL', 'artworkUrl', 'imageUrl'
])

/**
 * Interpolations with one of those names whose value is written in the code, not outside:
 * `file` -> the expressions, as written. This list can only shrink; a new entry needs the reason.
 */
const WRITTEN_IN_THE_CODE = {
    // the registry of algorithms and of ranking strategies (public/js/algorithms, public/js/ranking)
    // the recipes of the blending menu, a list in the same file
    'components/blend/BlendRecipeCard.js': ['recipe.name'],
    // the three "coming soon" features, an object in the same function
    'views/ComingSoonView.js': ['feature.name']
}

const listJs = (dir = '') => listSourceFiles(ROOT, dir) // .js, .ts and .tsx (F83)

const HTML_TAG = /<\/?[a-zA-Z]/
const HTML_PROPERTIES = new Set(['innerHTML', 'outerHTML'])
const HTML_FUNCTIONS = new Set(['insertAdjacentHTML', 'fromHTML'])

const calleeName = (node) => node.callee.type === 'MemberExpression' ? node.callee.property.name : node.callee.name

/** The parts of an interpolation that end up in the string as they are. */
function directParts(node) {
    if (node.type === 'ConditionalExpression') return [...directParts(node.consequent), ...directParts(node.alternate)]
    if (node.type === 'LogicalExpression') return [...directParts(node.left), ...directParts(node.right)]
    if (node.type === 'BinaryExpression' && node.operator === '+') return [...directParts(node.left), ...directParts(node.right)]
    return [node]
}

const outsideName = (node) => {
    if (node.type === 'Identifier') return OUTSIDE_NAMES.has(node.name) ? node.name : null
    if (node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier') {
        return OUTSIDE_NAMES.has(node.property.name) ? node.property.name : null
    }
    return null
}

/** Every unescaped interpolation of outside text of one source: [{ line, code }]. */
export function unescapedOutsideText(source, file = 'file.js') {
    const ast = parseSource(source, file)
    const found = []

    const visit = (node, insideHtml, htmlSink) => {
        if (!node || typeof node.type !== 'string') return
        let inside = insideHtml

        if (node.type === 'TemplateLiteral') {
            inside = insideHtml || htmlSink || HTML_TAG.test(node.quasis.map(quasi => quasi.value.raw).join(' '))
            if (inside) {
                for (const expression of node.expressions) {
                    for (const part of directParts(expression)) {
                        if (outsideName(part)) found.push({ line: part.loc.start.line, code: source.slice(part.range[0], part.range[1]) })
                    }
                }
            }
        }

        for (const key of Object.keys(node)) {
            if (key === 'loc' || key === 'range') continue
            const value = node[key]
            // A template handed straight to an HTML sink is HTML even with no tag in it
            const sink = (node.type === 'AssignmentExpression' && key === 'right' &&
                node.left.type === 'MemberExpression' && HTML_PROPERTIES.has(node.left.property.name)) ||
                (node.type === 'CallExpression' && key === 'arguments' && HTML_FUNCTIONS.has(calleeName(node)))
            // What is inside a call is the call's business (escapeHtml(x), getIcon(x), format(x))
            const nextInside = node.type === 'CallExpression' && key === 'arguments' ? false : inside
            const children = Array.isArray(value) ? value : [value]
            for (const child of children) {
                if (child && typeof child === 'object') visit(child, nextInside, sink)
            }
        }
    }

    visit(ast, false, false)
    return found
}

describe('outside text in HTML strings', () => {
    it('the reader finds an unescaped name and accepts an escaped one', () => {
        const bad = unescapedOutsideText('const html = `<h3 title="${album.title}">${album.title || fallback}</h3>`')
        expect(bad.map(item => item.code)).toEqual(['album.title', 'album.title'])

        expect(unescapedOutsideText('el.innerHTML = `Exporting ${playlistTitle}...`').map(item => item.code)).toEqual(['playlistTitle'])
        expect(unescapedOutsideText('const html = `<li>${show ? `<b>${track.artist}</b>` : ""}</li>`').map(item => item.code)).toEqual(['track.artist'])

        expect(unescapedOutsideText('const html = `<h3 title="${escapeHtml(album.title)}">${escapeHtml(album.title)}</h3>`')).toEqual([])
        expect(unescapedOutsideText('const html = `<i>${getIcon(step.name)}</i><b>${tracks.length}</b>`')).toEqual([])
        // not HTML: a message, a key, a log line
        expect(unescapedOutsideText('toast.error(`Could not save ${album.title}`); const key = `${artist}_${album}`')).toEqual([])
    })

    it('it reads TypeScript: an unescaped name in an HTML string of a .ts file is accused (F83)', () => {
        const fixture = path.join(process.cwd(), 'test/architecture/fixtures/typescript/unescapedText.ts')
        const bad = unescapedOutsideText(fs.readFileSync(fixture, 'utf8'), fixture)
        expect(bad.map(item => item.code)).toEqual(['album.title'])
        expect(unescapedOutsideText('const row = (a: { title: string }): string => `<li>${escapeHtml(a.title)}</li>`', 'x.ts')).toEqual([])
        expect(unescapedOutsideText('export const C = () => <p>{album.title}</p>', 'x.tsx')).toEqual([]) // React escapes the text it draws
    })

    it('every HTML template of public/js escapes the outside text it carries', () => {
        const offenders = listJs().flatMap(file => {
            const known = WRITTEN_IN_THE_CODE[file] || []
            return unescapedOutsideText(fs.readFileSync(path.join(ROOT, file), 'utf8'))
                .filter(item => !known.includes(item.code))
                .map(item => `${file}:${item.line} \${${item.code}} -> \${escapeHtml(${item.code})}`)
        })
        expect(offenders).toEqual([])
    })

    it('the list of text written in the code holds only what is still there', () => {
        const stale = Object.entries(WRITTEN_IN_THE_CODE).flatMap(([file, expressions]) => {
            const present = unescapedOutsideText(fs.readFileSync(path.join(ROOT, file), 'utf8')).map(item => item.code)
            return expressions.filter(expression => !present.includes(expression)).map(expression => `${file}: ${expression}`)
        })
        expect(stale).toEqual([])
    })
})
