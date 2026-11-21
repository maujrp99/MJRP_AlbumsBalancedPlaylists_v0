// @vitest-environment node
/**
 * Fitness function of F59 slice E (UAT-199), sibling of outsideTextEscaped.test.js: an address that
 * is not written in the code becomes a link only through safeUrl (utils/safeUrl.js).
 *
 * What it reads, in every file of public/js: the places where an address is followed -
 *   - `href: x` in an object (SafeDOM.a({ href: x }));
 *   - `something.href = x`;
 *   - `window.open(x)`, `location.assign(x)`, `location.replace(x)`;
 *   - `href="${x}"` in an HTML template.
 *
 * What it accepts there: text written in the code ('/albums', a template or a sum that starts with
 * '/' or with 'https://host/'), safeUrl(...) (escaped or not), and a constant of the same file
 * whose value is one of those. Anything else is listed below with its reason, or it fails.
 *
 * What it does not read: img src (an image address does not run as code; the page's img-src policy
 * holds it) and addresses given to fetch (not followed by the person).
 *
 * The parser is espree, the one ESLint (a devDependency of this project) parses with.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { parseSource, listSourceFiles } from './support/parseSource.js'

const ROOT = path.resolve(process.cwd(), 'public/js')

/**
 * Addresses that are not text written at the sink, and still come from the code:
 * `file` -> the expressions, as written. This list can only shrink; a new entry needs the reason.
 */
const WRITTEN_IN_THE_CODE = {
    // the menu in React (F83 wave 3): every link of the bar and of the drawer is given a path written in the same file (TopNav.tsx)
    'shell/TopNav.tsx': ['to'],
    // the entity types of the menu of series, a list in the same file
    'shell/SeriesDropdown.tsx': ['entity.route'],
    // paths written in the same file, and the path of the page itself (it starts with '/')
    'components/Breadcrumb.js': ['escapeHtml(crumb.path)'],
    // the same trail in React: the paths are written in ui/Breadcrumb.tsx (playlistsTrail) and the callers
    'ui/Breadcrumb.tsx': ['crumb.path'],
    // an option given by the view, '/home' in the one caller
    'components/series/SeriesEmptyState.js': ['this.ctaHref'],
    // a blob: address made in the line above, for the download of the person's own playlists
    'views/playlists/PlaylistsExport.js': ['url'],
    // the page's own address with another host name (utils/localAddress.js)
    'app.js': ['localUrl']
}

const listJs = (dir = '') => listSourceFiles(ROOT, dir) // .js, .ts and .tsx (F83)

const FIXED_START = /^(\/(?!\/)|https:\/\/[a-z0-9.-]+\/)/i
const FOLLOWING_CALLS = new Set(['open', 'assign', 'replace'])
const HREF_IN_HTML = /\bhref\s*=\s*["']?$/

const startsFixed = (text) => typeof text === 'string' && FIXED_START.test(text)

const leftmost = (node) => (node.type === 'BinaryExpression' && node.operator === '+' ? leftmost(node.left) : node)

const isCallTo = (node, name) => node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === name

/** Text written in the code: a literal, or a template or a sum that starts with a fixed address. */
function writtenHere(node) {
    const first = leftmost(node)
    if (first.type === 'Literal') return first === node || startsFixed(first.value)
    if (first.type === 'TemplateLiteral') return first.expressions.length === 0 || startsFixed(first.quasis[0].value.cooked)
    return false
}

/** True when the address is written in the code or went through safeUrl. */
function isChecked(node, constants) {
    // a type assertion or a non-null mark says nothing about where the address came from (TypeScript)
    if (node.type === 'TSAsExpression' || node.type === 'TSNonNullExpression' || node.type === 'TSSatisfiesExpression') return isChecked(node.expression, constants)
    if (writtenHere(node) || isCallTo(node, 'safeUrl')) return true
    if (isCallTo(node, 'escapeHtml')) return isChecked(node.arguments[0], constants)
    if (node.type === 'LogicalExpression') return isChecked(node.left, constants) && isChecked(node.right, constants)
    if (node.type === 'ConditionalExpression') return isChecked(node.consequent, constants) && isChecked(node.alternate, constants)
    if (node.type === 'Identifier' && constants.has(node.name)) {
        return constants.get(node.name).every(init => init && isChecked(init, new Map()))
    }
    return false
}

const isLocationOrWindow = (node) => {
    const name = node.type === 'MemberExpression' ? node.property.name : node.name
    return name === 'window' || name === 'location'
}

/** One reader per place where an address is followed: each gives the addresses of a node of its kind. */
const FOLLOWED = {
    Property: (node) => (!node.computed && (node.key.name === 'href' || node.key.value === 'href') ? [node.value] : []),
    AssignmentExpression: (node) => (node.left.type === 'MemberExpression' && node.left.property.name === 'href' ? [node.right] : []),
    CallExpression: (node) => {
        const { callee } = node
        if (callee.type !== 'MemberExpression' || node.arguments.length === 0) return []
        return FOLLOWING_CALLS.has(callee.property.name) && isLocationOrWindow(callee.object) ? [node.arguments[0]] : []
    },
    // href={address} or href="/path" in JSX (F83)
    JSXAttribute: (node) => {
        if (node.name.name !== 'href' || !node.value) return []
        if (node.value.type === 'JSXExpressionContainer') return node.value.expression.type === 'JSXEmptyExpression' ? [] : [node.value.expression]
        return [node.value]
    },
    TemplateLiteral: (node) => node.expressions.filter((_, index) => HREF_IN_HTML.test(node.quasis[index].value.raw))
}

/** The addresses a node follows, when the node is one of the places listed at the top. */
const followedAddress = (node) => (FOLLOWED[node.type] ? FOLLOWED[node.type](node) : [])

const walk = (node, visit) => {
    if (!node || typeof node.type !== 'string') return
    visit(node)
    for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'range') continue
        const value = node[key]
        for (const child of Array.isArray(value) ? value : [value]) {
            if (child && typeof child === 'object') walk(child, visit)
        }
    }
}

/** Every followed address of one source that is neither written in the code nor checked: [{ line, code }]. */
export function uncheckedAddresses(source, file = 'file.js') {
    const ast = parseSource(source, file)

    const constants = new Map()
    walk(ast, node => {
        if (node.type !== 'VariableDeclarator' || node.id.type !== 'Identifier') return
        constants.set(node.id.name, [...(constants.get(node.id.name) || []), node.init])
    })

    const found = []
    walk(ast, node => {
        for (const address of followedAddress(node)) {
            if (!isChecked(address, constants)) found.push({ line: address.loc.start.line, code: source.slice(address.range[0], address.range[1]) })
        }
    })
    return found
}

describe('addresses from outside the code', () => {
    it('the reader finds an unchecked address in each place a link is followed', () => {
        const codes = (source) => uncheckedAddresses(source).map(item => item.code)

        expect(codes('SafeDOM.a({ href: track.url })')).toEqual(['track.url'])
        expect(codes('const link = entity.spotifyUrl || `https://open.spotify.com/album/${id}`; SafeDOM.a({ href: link })')).toEqual(['link'])
        expect(codes('a.href = album.url')).toEqual(['album.url'])
        expect(codes('window.open(this.createdPlaylistUrl, "_blank")')).toEqual(['this.createdPlaylistUrl'])
        expect(codes('window.location.assign(next)')).toEqual(['next'])
        expect(codes('const html = `<a href="${album.url}">x</a>`')).toEqual(['album.url'])
        expect(codes('const html = `<a href="${escapeHtml(album.url)}">x</a>`')).toEqual(['escapeHtml(album.url)'])
        // a template that starts with what came from outside is not written in the code
        expect(codes('SafeDOM.a({ href: `${base}/album/1` })')).toEqual(['`${base}/album/1`'])
        expect(codes('SafeDOM.a({ href: `//${host}/album/1` })')).toEqual(['`//${host}/album/1`'])
    })

    it('it reads TSX: an unchecked href={...} is accused, a written or safeUrl one is accepted (F83)', () => {
        const fixture = path.join(process.cwd(), 'test/architecture/fixtures/typescript/uncheckedLink.tsx')
        expect(uncheckedAddresses(fs.readFileSync(fixture, 'utf8'), fixture).map(item => item.code)).toEqual(['album.url'])
        for (const source of [
            'export const A = () => <a href="/albums">x</a>',
            'export const A = () => <a href={safeUrl(album.url)}>x</a>',
            'export const A = () => <a href={`/albums/${id}`}>x</a>',
            'export const A = () => <a href={(safeUrl(album.url) ?? "/albums") as string}>x</a>'
        ]) expect(uncheckedAddresses(source, 'x.tsx'), source).toEqual([])
        expect(uncheckedAddresses('window.open(link as string)', 'x.ts').map(item => item.code)).toEqual(['link as string'])
    })

    it('the reader accepts text written in the code and what went through safeUrl', () => {
        const accepted = [
            'SafeDOM.a({ href: "/playlists" })',
            'SafeDOM.a({ href: `https://www.besteveralbums.com/thechart.php?a=${id}` })',
            'SafeDOM.a({ href: safeUrl(track.url) })',
            'SafeDOM.a({ href: safeUrl(entity.spotifyUrl) || `https://open.spotify.com/album/${id}` })',
            'const sourceUrl = safeUrl(track.url); if (sourceUrl) SafeDOM.a({ href: sourceUrl })',
            'window.location.href = "https://accounts.spotify.com/authorize?" + args',
            'window.location.assign("/home")',
            'const html = `<a href="${escapeHtml(safeUrl(album.url))}">x</a><img src="${cover}">`',
            'list.replace(a, b); items.open(x)'
        ]
        for (const source of accepted) expect(uncheckedAddresses(source), source).toEqual([])
    })

    it('every followed address of public/js is written in the code or goes through safeUrl', () => {
        const offenders = listJs().flatMap(file => {
            const known = WRITTEN_IN_THE_CODE[file] || []
            return uncheckedAddresses(fs.readFileSync(path.join(ROOT, file), 'utf8'), file)
                .filter(item => !known.includes(item.code))
                .map(item => `${file}:${item.line} ${item.code} -> safeUrl(${item.code})`)
        })
        expect(offenders).toEqual([])
    })

    it('the list of addresses written in the code holds only what is still there', () => {
        const stale = Object.entries(WRITTEN_IN_THE_CODE).flatMap(([file, expressions]) => {
            const present = uncheckedAddresses(fs.readFileSync(path.join(ROOT, file), 'utf8'), file).map(item => item.code)
            return expressions.filter(expression => !present.includes(expression)).map(expression => `${file}: ${expression}`)
        })
        expect(stale).toEqual([])
    })
})
