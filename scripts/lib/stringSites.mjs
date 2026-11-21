/**
 * stringSites - counts the places where a visible text is written by hand (F83 TASK-09; the method of the measurement spike,
 * `wip/react-measurement-spike`, reports/evidence/F83/count-string-sites.mjs, which sized the extraction of F81).
 *
 * A "string site" is one place in the source where a visible text is written, so it is one edit when the text moves to a
 * dictionary. The method reads the syntax tree (espree for JavaScript, typescript-estree for TSX); it is a heuristic, not a
 * proof: it does not see a text that arrives by a variable, a ternary or an object, and the count is good to about ten per
 * cent. It never counts: imports, console.*, thrown Errors, object keys, comparisons, selectors, event names, storage keys,
 * router paths, CSS class lists and ids. The kinds:
 *   text-prop, text-assign, safedom-child, html-text, html-attr, notice, sentence (see the spike's script for each).
 * In TSX, `jsx-text` (a text between tags) and `jsx-attr` (aria-label, title, placeholder, alt written as a literal): a React
 * screen made right has none, because its texts come from the dictionary.
 */
/* eslint-disable no-control-regex -- the NUL character marks where an interpolation was cut out of a template: it is how the counter reads the static text around it */
import * as espree from 'espree'
import { parse as parseWithTypeScript } from '@typescript-eslint/typescript-estree'


const TEXT_KEYS = new Set([
    'label', 'title', 'message', 'placeholder', 'ariaLabel', 'aria-label', 'confirmText', 'cancelText',
    'text', 'alt', 'tooltip', 'heading', 'subtitle', 'description', 'emptyText', 'emptyMessage', 'hint',
    'caption', 'body', 'reload', 'done', 'helper', 'helperText', 'buttonText', 'actionLabel', 'cta',
    'okText', 'confirmLabel', 'cancelLabel', 'textContent', 'innerText', 'detail', 'note', 'prompt',
    'question', 'answer', 'lead', 'summary', 'subtext', 'headline', 'name_label', 'unit', 'suffix', 'prefix'
])
const NON_TEXT_KEYS = new Set([
    'className', 'class', 'id', 'type', 'name', 'role', 'variant', 'value', 'icon', 'href', 'src', 'key',
    'dataset', 'style', 'width', 'height', 'path', 'route', 'action', 'event', 'mode', 'status', 'size',
    'color', 'target', 'rel', 'for', 'htmlFor', 'method', 'lang', 'sort', 'field', 'kind', 'place', 'tag'
])
const TEXT_PROPS_ASSIGN = new Set(['textContent', 'innerText', 'placeholder', 'title', 'ariaLabel', 'alt'])
const TEXT_ATTRS = new Set(['aria-label', 'title', 'placeholder', 'alt'])
const SELECTOR_CALLS = new Set([
    'querySelector', 'querySelectorAll', 'getElementById', 'closest', 'matches', 'add', 'remove', 'toggle',
    'contains', 'addEventListener', 'removeEventListener', 'dispatchEvent', 'getItem', 'setItem',
    'removeItem', 'navigate', 'redirect', 'setAddress', 'track', 'getIcon', 'createElement', 'getAttribute',
    'hasAttribute', 'removeAttribute', 'startsWith', 'endsWith', 'includes', 'split', 'replace', 'join',
    'indexOf', 'get', 'set', 'has', 'delete', 'emit', 'on', 'off', 'subscribe', 'import', 'register',
    'fetch', 'post', 'require', 'Event', 'CustomEvent', 'matchMedia', 'insertAdjacentHTML', 'replaceAll',
    'padStart', 'localeCompare', 'toLocaleDateString', 'toLocaleTimeString', 'Intl', 'format', 'test',
    'match', 'search', 'assign', 'open', 'setProperty', 'getPropertyValue', 'filterUseOf', 'warn', 'log'
])
const NOTICE_OBJECTS = new Set(['toast', 'toastService', 'notifications'])
const NOTICE_FUNCS = new Set(['alert', 'confirm', 'showToast', 'showError', 'showSuccess', 'showMessage', 'notify'])

/** A list of CSS classes, an id, a path, a URL, a selector, a mime, a date format... not a text. */
function looksTechnical(text) {
    const s = text.trim()
    if (!s) return true
    if (!/[A-Za-zÀ-ÿ]/.test(s)) return true
    if (/^(https?:|mailto:|data:|\/|\.\/|\.\.\/|#|\.|\[|@)/.test(s)) return true
    if (/^[a-z0-9_$-]+$/i.test(s) && !/^[A-Z][a-z]+$/.test(s)) return true // identifier, key, single lowercase word
    // every token is a CSS class / utility (lowercase, -, :, /, [ ], %, .) -> a class list
    if (s.split(/\s+/).every(tok => /^[a-z0-9!:_\-/[\]%.#()=,>+~*&]+$/.test(tok) && !/^[a-z]+[.!?]$/.test(tok))) return true
    if (/^[a-z]+\/[a-z0-9.+-]+$/i.test(s)) return true // mime
    return false
}

/** The text segments of an HTML template: text nodes and visible attributes, static parts only. */
function htmlSites(quasisText) {
    const sites = []
    // visible attributes with a static value
    const attrRe = /\b(aria-label|title|placeholder|alt)\s*=\s*"([^"]*)"/g
    let m
    while ((m = attrRe.exec(quasisText)) !== null) {
        const value = m[2].replace(/\u0000/g, '').trim()
        if (/[A-Za-zÀ-ÿ]/.test(value)) sites.push({ kind: 'html-attr', text: m[2] })
    }
    // text nodes: what lies between > and <, with interpolations replaced by \u0000
    const textRe = />([^<>]*)</g
    while ((m = textRe.exec(quasisText)) !== null) {
        const raw = m[1].replace(/\u0000/g, ' ').replace(/&[a-z]+;|&#\d+;/g, ' ').trim()
        if (raw && /[A-Za-zÀ-ÿ]{2,}/.test(raw) && !/^[\s\W\d]*$/.test(raw)) sites.push({ kind: 'html-text', text: m[1].trim() })
    }
    return sites
}

const isHtml = (s) => /<\/?[a-z][a-z0-9-]*(\s|>|\/)/i.test(s)

function calleeName(node) {
    if (!node) return null
    if (node.type === 'Identifier') return node.name
    if (node.type === 'MemberExpression' && !node.computed) return node.property.name
    return null
}
function calleeObject(node) {
    if (node?.type === 'MemberExpression' && node.object.type === 'Identifier') return node.object.name
    if (node?.type === 'MemberExpression' && node.object.type === 'MemberExpression') return calleeName(node.object)
    return null
}
function propKey(prop) {
    if (!prop || prop.type !== 'Property') return null
    if (prop.key.type === 'Identifier') return prop.key.name
    if (prop.key.type === 'Literal') return String(prop.key.value)
    return null
}

function stringOf(node) {
    if (node.type === 'Literal' && typeof node.value === 'string') return node.value
    if (node.type === 'TemplateLiteral') return node.quasis.map(q => q.value.cooked ?? q.value.raw).join('\u0000')
    return null
}

/** Counts the places of a JavaScript source where a visible text is written by hand: [{ kind, line, text }]. */
export function countJs(source, file = 'file.js') {
    let ast
    try {
        ast = espree.parse(source, { ecmaVersion: 'latest', sourceType: 'module', loc: true })
    } catch (error) {
        throw new Error(`${file} does not parse: ${error.message}`)
    }
    const sites = []
    const add = (kind, node, text) => sites.push({ kind, line: node.loc.start.line, text: String(text).replace(/\u0000/g, '${…}').replace(/\s+/g, ' ').trim().slice(0, 90) })

    /** Classify a string node given its ancestors (nearest first). */
    function classify(node, ancestors) {
        const text = stringOf(node)
        if (text == null) return
        // a string that is part of a bigger template/concat is judged with it
        const parent = ancestors[0]
        if (parent?.type === 'TemplateLiteral') return

        // contexts that never hold a visible text
        for (const anc of ancestors) {
            if (anc.type === 'ImportDeclaration' || anc.type === 'ImportExpression' || anc.type === 'ExportAllDeclaration' || anc.type === 'ExportNamedDeclaration' && anc.source) return
            if (anc.type === 'ThrowStatement') return
            if (anc.type === 'NewExpression' && /Error$/.test(calleeName(anc.callee) || '')) return
            if (anc.type === 'CallExpression' && calleeObject(anc.callee) === 'console') return
            if (anc.type === 'SwitchCase') return
            if (anc.type === 'BinaryExpression' && ['===', '!==', '==', '!='].includes(anc.operator)) return
            if (anc.type === 'MemberExpression' && anc.computed) return
        }

        // HTML templates: their text nodes and attributes
        if (isHtml(text)) {
            htmlSites(text).forEach(site => add(site.kind, node, site.text))
            return
        }

        // object property value
        if (parent?.type === 'Property' && parent.value === node) {
            const key = propKey(parent)
            if (key && TEXT_KEYS.has(key)) { if (/[A-Za-zÀ-ÿ]/.test(text)) add('text-prop', node, text); return }
            if (key && NON_TEXT_KEYS.has(key)) return
            if (!looksTechnical(text)) add('sentence', node, text)
            return
        }
        if (parent?.type === 'Property' && parent.key === node) return

        // assignment to a visible property
        if (parent?.type === 'AssignmentExpression' && parent.right === node && parent.left.type === 'MemberExpression') {
            const prop = calleeName(parent.left)
            if (TEXT_PROPS_ASSIGN.has(prop)) { if (/[A-Za-zÀ-ÿ]/.test(text)) add('text-assign', node, text); return }
            if (['className', 'id', 'href', 'src', 'value', 'type'].includes(prop)) return
        }

        // a string inside a conditional / logical that is itself the value of something: climb
        let holder = node
        let up = 0
        while (ancestors[up] && ['ConditionalExpression', 'LogicalExpression'].includes(ancestors[up].type)) {
            if (ancestors[up].type === 'ConditionalExpression' && ancestors[up].test === holder) return
            holder = ancestors[up]; up++
        }
        const ctx = ancestors[up]
        if (up > 0 && ctx?.type === 'Property' && ctx.value === holder) {
            const key = propKey(ctx)
            if (key && TEXT_KEYS.has(key)) { if (/[A-Za-zÀ-ÿ]/.test(text)) add('text-prop', node, text); return }
            if (key && NON_TEXT_KEYS.has(key)) return
        }
        if (up > 0 && ctx?.type === 'AssignmentExpression' && ctx.left.type === 'MemberExpression' && TEXT_PROPS_ASSIGN.has(calleeName(ctx.left))) {
            if (/[A-Za-zÀ-ÿ]/.test(text)) add('text-assign', node, text); return
        }

        // call arguments
        const call = ctx?.type === 'ArrayExpression' && ancestors[up + 1]?.type === 'CallExpression' ? ancestors[up + 1] : ctx
        if (call?.type === 'CallExpression' || call?.type === 'NewExpression') {
            const name = calleeName(call.callee)
            const obj = calleeObject(call.callee)
            if (name === 'setAttribute') {
                const attr = call.arguments[0]
                if (attr?.type === 'Literal' && TEXT_ATTRS.has(attr.value) && call.arguments[1] === holder) add('text-assign', node, text)
                return
            }
            if (obj === 'SafeDOM' && name !== 'fromHTML') {
                // child argument (2nd) or an element of the children array
                const isChild = call.arguments.indexOf(holder) >= 1 || (ctx?.type === 'ArrayExpression' && call.arguments.indexOf(ctx) >= 1)
                if (isChild && /[A-Za-zÀ-ÿ]/.test(text)) add('safedom-child', node, text)
                return
            }
            if ((obj && NOTICE_OBJECTS.has(obj)) || NOTICE_FUNCS.has(name)) {
                if (/[A-Za-zÀ-ÿ]/.test(text)) add('notice', node, text)
                return
            }
            if (SELECTOR_CALLS.has(name)) return
        }

        // a sentence: has a space, or is one word that ends like a sentence ('Updating...', 'Done!')
        if (!looksTechnical(text) && (/\s/.test(text.trim()) || /[A-Za-zÀ-ÿ](\.\.\.|…|[.!?:])$/.test(text.trim()))) add('sentence', node, text)
    }

    function walk(node, ancestors) {
        if (!node || typeof node.type !== 'string') return
        if ((node.type === 'Literal' && typeof node.value === 'string') || node.type === 'TemplateLiteral') {
            classify(node, ancestors)
        }
        for (const key of Object.keys(node)) {
            if (key === 'loc' || key === 'range' || key === 'parent') continue
            const child = node[key]
            if (Array.isArray(child)) child.forEach(c => walk(c, [node, ...ancestors]))
            else if (child && typeof child.type === 'string') walk(child, [node, ...ancestors])
        }
    }
    walk(ast, [])
    return sites
}

const JSX_ATTRS = new Set(['aria-label', 'title', 'placeholder', 'alt'])

function walkTree(node, visit) {
    if (!node || typeof node.type !== 'string') return
    visit(node)
    for (const key of Object.keys(node)) {
        if (key === 'loc' || key === 'range') continue
        const value = node[key]
        for (const child of Array.isArray(value) ? value : [value]) {
            if (child && typeof child === 'object') walkTree(child, visit)
        }
    }
}

/** The loose texts of a TSX source: the text between tags and the visible attributes written as literals: [{ kind, line, text }]. */
export function countTsx(source, file = 'file.tsx') {
    const sites = []
    const ast = parseWithTypeScript(source, { jsx: file.endsWith('.tsx'), loc: true, range: true })
    walkTree(ast, node => {
        if (node.type === 'JSXText' && /[A-Za-zÀ-ÿ]{2,}/.test(node.value)) {
            sites.push({ kind: 'jsx-text', line: node.loc.start.line, text: node.value.replace(/\s+/g, ' ').trim().slice(0, 90) })
        } else if (node.type === 'JSXAttribute' && JSX_ATTRS.has(node.name.name) && node.value?.type === 'Literal' && /[A-Za-zÀ-ÿ]/.test(String(node.value.value))) {
            sites.push({ kind: 'jsx-attr', line: node.loc.start.line, text: String(node.value.value).slice(0, 90) })
        }
    })
    return sites
}

/** The sites of a source, by its file name. */
export const countSites = (source, file) => (/\.(ts|tsx)$/.test(file) ? countTsx(source, file) : countJs(source, file))
