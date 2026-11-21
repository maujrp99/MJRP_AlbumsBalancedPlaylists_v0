// @vitest-environment node
/**
 * Fitness function of F83 (risk R12): one React in the repository. The site (root package.json) and the app (app/) use the
 * same version, pinned by the root `overrides`; the lock file holds one copy of `react` and one of `react-dom`. Updating
 * React is a change of the site and of the app together.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const json = (file) => JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8'))

/** What is not one React, given the manifests and the lock: one line per finding. */
export function notOneReact({ root, app, lock }) {
    const out = []
    const version = root.dependencies?.react
    if (!version) out.push('the site does not depend on react')
    if (root.dependencies?.['react-dom'] !== version) out.push(`react-dom (${root.dependencies?.['react-dom']}) is not react (${version})`)
    if (root.overrides?.react !== version) out.push(`the root overrides pin react at ${root.overrides?.react}, not ${version}`)
    if (app.dependencies?.react !== version) out.push(`the app uses react ${app.dependencies?.react}, not ${version}`)
    for (const name of ['react', 'react-dom']) {
        const copies = Object.keys(lock.packages).filter(key => key === `node_modules/${name}` || key.endsWith(`/node_modules/${name}`))
        if (copies.length !== 1) out.push(`the lock holds ${copies.length} copies of ${name}: ${copies.join(', ')}`)
        else if (lock.packages[copies[0]].version !== version) out.push(`the lock has ${name} ${lock.packages[copies[0]].version}, not ${version}`)
    }
    return out
}

describe('one React for the site and the app (F83)', () => {
    it('the manifests and the lock agree', () => {
        expect(notOneReact({ root: json('package.json'), app: json('app/package.json'), lock: json('package-lock.json') })).toEqual([])
    })

    it('the wrong examples are accused', () => {
        const lock = { packages: { 'node_modules/react': { version: '19.3.0' }, 'node_modules/react-dom': { version: '19.3.0' } } }
        const good = { root: { dependencies: { react: '19.3.0', 'react-dom': '19.3.0' }, overrides: { react: '19.3.0' } }, app: { dependencies: { react: '19.3.0' } }, lock }
        expect(notOneReact(good)).toEqual([])
        expect(notOneReact({ ...good, app: { dependencies: { react: '19.2.0' } } })).toHaveLength(1)
        expect(notOneReact({ ...good, root: { ...good.root, overrides: { react: '19.2.0' } } })).toHaveLength(1)
        expect(notOneReact({ ...good, root: { ...good.root, dependencies: { react: '19.3.0', 'react-dom': '19.3.1' } } })).toHaveLength(1)
        const twice = { packages: { ...lock.packages, 'app/node_modules/react': { version: '19.3.0' } } }
        expect(notOneReact({ ...good, lock: twice })).toHaveLength(1)
    })
})
