/**
 * One contract says how a screen holds a store and lets it go (F73, UAT-215): the subscriptions
 * go into `this.subscriptions` of BaseView, and the router's `destroy()` drops them. A screen that
 * keeps its own handle (`this.unsubscribe = ...`) or waits for a call nobody makes (`onUnmount`)
 * goes on hearing the store after it was left, and draws itself over the next screen.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const VIEWS = join(process.cwd(), 'public/js/views')
const viewFiles = readdirSync(VIEWS).filter(name => name.endsWith('View.js'))
const read = (name) => readFileSync(join(VIEWS, name), 'utf8')

describe('a screen that is left hears no store', () => {
    it('there are screens to check', () => {
        expect(viewFiles.length).toBeGreaterThan(4)
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
})
