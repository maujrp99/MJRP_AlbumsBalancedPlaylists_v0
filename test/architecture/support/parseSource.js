/**
 * One reader for the source files the architecture tests watch (F83, TASK-02): JavaScript by espree
 * (the parser ESLint uses), TypeScript and TSX by typescript-estree (the one typescript-eslint uses).
 * Both give an ESTree tree with `loc` and `range`, so a rule written over the tree reads either;
 * TSX adds the JSX nodes (JSXAttribute, JSXExpressionContainer, JSXText) and TypeScript adds the
 * type nodes, which a rule that does not ask for them never meets.
 */
import * as espree from 'espree'
import { parse as parseWithTypeScript } from '@typescript-eslint/typescript-estree'
import fs from 'node:fs'
import path from 'node:path'

const TS_FILE = /\.(ts|tsx)$/

/** A TypeScript source (not a declaration file). */
export const isTypeScript = (file) => TS_FILE.test(file) && !file.endsWith('.d.ts')

/** A source file of the site: JavaScript, TypeScript or TSX. */
export const isSourceFile = (file) => /\.(js|ts|tsx)$/.test(file) && !file.endsWith('.d.ts')

/**
 * The syntax tree of a source.
 * @param {string} source
 * @param {string} [file] - the name decides the parser: `.ts` and `.tsx` are TypeScript
 * @param {{ tokens?: boolean }} [options]
 */
export function parseSource(source, file = 'file.js', { tokens = false } = {}) {
    if (isTypeScript(file)) {
        return parseWithTypeScript(source, { jsx: file.endsWith('.tsx'), loc: true, range: true, tokens, comment: false })
    }
    return espree.parse(source, { ecmaVersion: 'latest', sourceType: 'module', loc: true, range: true, tokens })
}

/** The tokens of a source, the way espree names them (String, Template, JSXText...). */
export const tokensOf = (source, file = 'file.js') => parseSource(source, file, { tokens: true }).tokens

/**
 * Every source file under a folder, relative to it (the code of others in `vendor` left out).
 * @param {string} root - absolute folder
 * @param {string} [dir] - sub-folder, relative to root
 */
export function listSourceFiles(root, dir = '') {
    const here = path.join(root, dir)
    if (!fs.existsSync(here)) return []
    return fs.readdirSync(here, { withFileTypes: true }).flatMap(entry => {
        const child = path.join(dir, entry.name)
        if (entry.isDirectory()) return entry.name === 'vendor' || entry.name === 'node_modules' ? [] : listSourceFiles(root, child)
        return isSourceFile(entry.name) ? [child] : []
    })
}
