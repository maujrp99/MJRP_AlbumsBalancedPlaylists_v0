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

describe('a screen that is left hears no store', () => {
    // F83 wave 7b: the last hand-made screen (the Blend) went to React, so the four checks of the contract of `this.subscriptions` (no onUnmount, no
    // own handle, every subscription in the list of BaseView, and that there are views to check) have no view left to read. What replaced them: the
    // guard below (no hand-made screen is born again in views/: only BaseView.js is left, and it is the title of the tab until wave 8), and the React half
    // (which reads every file of screens/), with its own test per screen (test/screens/*/ calls the mold: everyScreenHasTheLeaveTest).
    it('no hand-made screen is left in views/: only BaseView.js (a new one would have to keep the contract of this.subscriptions, and is born in React)', () => {
        expect(viewFiles).toEqual(['BaseView.js'])
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
