/**
 * One contract says how a screen holds a store and lets it go (F73, UAT-215): the subscriptions
 * go into `this.subscriptions` of BaseView, and the router's `destroy()` drops them. A screen that
 * keeps its own handle (`this.unsubscribe = ...`) or waits for a call nobody makes (`onUnmount`)
 * goes on hearing the store after it was left, and draws itself over the next screen.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { listSourceFiles } from './support/parseSource.js'

const VIEWS = join(process.cwd(), 'public/js/views')
const viewFiles = readdirSync(VIEWS).filter(name => name.endsWith('View.js'))
const read = (name) => readFileSync(join(VIEWS, name), 'utf8')

describe('a screen that is left hears no store', () => {
    it('there are screens to check', () => {
        expect(viewFiles.length).toBeGreaterThan(3)
    })

    it('no screen waits for onUnmount, which the router never calls', () => {
        expect(viewFiles.filter(name => /\bonUnmount\s*\(/.test(read(name)))).toEqual([])
    })

    it('no screen keeps a subscription outside this.subscriptions', () => {
        const own = viewFiles.filter(name => /this\.unsubscribe\w*\s*=/.test(read(name)))
        expect(own).toEqual([])
    })

    it('every screen that subscribes puts it in this.subscriptions', () => {
        const subscribing = viewFiles.filter(name => /\.subscribe\(/.test(read(name)))
        expect(subscribing.filter(name => !/this\.subscriptions/.test(read(name)))).toEqual([])
    })

    // F83: the screens in React are left by unmounting the root (the router calls destroy(), the bridge unmounts):
    // they hold nothing by hand either. The same two slips, read in .ts and .tsx.
    describe('the screens in React (F83)', () => {
        const SLIPS = [
            ['waits for onUnmount, which nobody calls', /\bonUnmount\s*\(/],
            ['keeps its own handle to a store', /\bthis\.unsubscribe\w*\s*=/]
        ]
        const slipsIn = (root) => listSourceFiles(root).flatMap(file => {
            const text = readFileSync(join(root, file), 'utf8')
            return SLIPS.filter(([, pattern]) => pattern.test(text)).map(([why]) => `${file}: ${why}`)
        })

        it('a .tsx file with both slips is accused', () => {
            expect(slipsIn(join(process.cwd(), 'test/architecture/fixtures/typescript')))
                .toEqual(['ownSubscription.tsx: waits for onUnmount, which nobody calls', 'ownSubscription.tsx: keeps its own handle to a store'])
        })

        it('no screen of screens/ has them (no folder yet is no slip)', () => {
            expect(slipsIn(join(process.cwd(), 'public/js/screens'))).toEqual([])
        })
    })
})
