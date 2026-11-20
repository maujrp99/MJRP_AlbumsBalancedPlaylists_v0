/**
 * Reads the `catch` blocks of JavaScript files (F52, slice 5), with ESLint's own parser.
 *
 * `catchBlocksIn(file)` returns one row per place where a failure is caught:
 *   { file, line, kind, empty, onlyLogs }
 *     kind      'catch' (try { } catch { }) or 'promise' (something.catch(function))
 *     empty     the block has no statement (a comment is not a statement)
 *     onlyLogs  every statement of the block is a call to the console or to a logger, so the code
 *               after the block goes on as if nothing had failed
 * `file` is relative to the repository root.
 */
import * as espree from 'espree'
import fs from 'node:fs'
import path from 'node:path'
import { ROOT } from './measureComplexity.js'

const LOGGERS = new Set(['console', 'logger'])

/** `console.warn(...)`, `logger.info(...)`, `this.logger.warn(...)`: the object the method is called on. */
function calledOn (callee) {
    if (!callee || callee.type !== 'MemberExpression') return null
    const object = callee.object
    if (object.type === 'Identifier') return object.name
    if (object.type === 'MemberExpression' && object.property.type === 'Identifier') return object.property.name
    return null
}

/** A statement that only writes to the log; `a && a.warn && a.warn(...)` counts: its last part is the call. */
function isLogStatement (statement) {
    if (statement.type !== 'ExpressionStatement') return false
    let expression = statement.expression
    while (expression.type === 'LogicalExpression') expression = expression.right
    return expression.type === 'CallExpression' && LOGGERS.has(calledOn(expression.callee))
}

const describeBlock = (statements) => ({
    empty: statements.length === 0,
    onlyLogs: statements.length > 0 && statements.every(isLogStatement)
})

/** The statements of the function handed to `.catch(...)`; an arrow with an expression is one statement. */
function handlerStatements (handler) {
    if (!handler || !/Function/.test(handler.type)) return null
    if (handler.body.type === 'BlockStatement') return handler.body.body
    return [{ type: 'ExpressionStatement', expression: handler.body }]
}

function rowOf (node) {
    if (node.type === 'CatchClause') return { kind: 'catch', ...describeBlock(node.body.body) }
    const isPromiseCatch = node.type === 'CallExpression' && node.callee.type === 'MemberExpression' &&
        node.callee.property.type === 'Identifier' && node.callee.property.name === 'catch'
    const statements = isPromiseCatch ? handlerStatements(node.arguments[0]) : null
    return statements ? { kind: 'promise', ...describeBlock(statements) } : null
}

function walk (node, visit) {
    if (!node || typeof node.type !== 'string') return
    visit(node)
    for (const key of Object.keys(node)) {
        const child = node[key]
        if (Array.isArray(child)) child.forEach(item => walk(item, visit))
        else if (child && typeof child === 'object') walk(child, visit)
    }
}

function parse (code) {
    const options = { ecmaVersion: 'latest', loc: true }
    try {
        return espree.parse(code, { ...options, sourceType: 'module' })
    } catch {
        // A CommonJS file may use what a module forbids (`await` as a name, a `return` at the top)
        return espree.parse(code, { ...options, sourceType: 'commonjs' })
    }
}

export function catchBlocksIn (file) {
    const rows = []
    walk(parse(fs.readFileSync(path.join(ROOT, file), 'utf8')), node => {
        const row = rowOf(node)
        if (row) rows.push({ file, line: node.loc.start.line, ...row })
    })
    return rows.sort((a, b) => a.line - b.line)
}

/** Every .js file under the folders (or the files) given, relative to the root, skipping `skip` prefixes. */
export function jsFilesUnder (targets, skip = []) {
    const files = []
    const visit = (relative) => {
        if (skip.some(prefix => relative === prefix || relative.startsWith(`${prefix}/`))) return
        const absolute = path.join(ROOT, relative)
        if (fs.statSync(absolute).isDirectory()) {
            fs.readdirSync(absolute).sort().forEach(name => visit(`${relative}/${name}`))
        } else if (relative.endsWith('.js')) {
            files.push(relative)
        }
    }
    targets.forEach(visit)
    return files
}
