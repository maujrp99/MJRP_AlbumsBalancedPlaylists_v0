/**
 * Doubles for the server tests: an Express-like response, an HTTP client that answers from a
 * table (no network), and a small HTML reader over jsdom with the part of the cheerio API the
 * BestEverAlbums search paths use (cheerio itself is a dependency of server/, not of the root).
 */
import { vi } from 'vitest'
import { JSDOM } from 'jsdom'

export const fakeResponse = () => {
    const res = { headersSent: false }
    res.status = vi.fn(() => res)
    res.json = vi.fn(() => res)
    res.set = vi.fn(() => res)
    return res
}

/** What the answer said: { status, body, headers }. */
export const answerOf = (res) => ({
    status: res.status.mock.calls.at(-1)?.[0],
    body: res.json.mock.calls.at(-1)?.[0],
    headers: Object.fromEntries(res.set.mock.calls)
})

/** Errors shaped like the ones axios throws. */
export const httpError = (status, data = {}) => Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true, response: { status, data }
})
export const timeoutError = () => Object.assign(new Error('timeout of 30000ms exceeded'), { isAxiosError: true, code: 'ECONNABORTED' })
export const networkError = () => Object.assign(new Error('getaddrinfo ENOTFOUND host'), { isAxiosError: true, code: 'ENOTFOUND', request: {} })

/**
 * @param {Array<[string|RegExp, any|Error|Function]>} routes - the first route whose pattern is in the URL answers;
 *        an Error is thrown, a function is called with the URL, anything else is the body
 */
export const fakeHttp = (routes) => {
    const get = vi.fn(async (url) => {
        const route = routes.find(([pattern]) => (pattern instanceof RegExp ? pattern.test(url) : url.includes(pattern)))
        if (!route) throw new Error(`fakeHttp: no route for ${url}`)
        const answer = typeof route[1] === 'function' ? route[1](url) : route[1]
        if (answer instanceof Error) throw answer
        return { status: 200, data: answer }
    })
    return { get }
}

/** loadHtml(html) -> $ with: $(selector | element), .each, .first, .find, .text, .attr, .length */
export const loadHtml = (html) => {
    const { document } = new JSDOM(String(html)).window
    const wrap = (elements) => ({
        length: elements.length,
        each (fn) { elements.every((el, i) => fn(i, el) !== false); return this },
        first: () => wrap(elements.slice(0, 1)),
        find: (selector) => wrap(elements.flatMap(el => Array.from(el.querySelectorAll(selector)))),
        text: () => elements.map(el => el.textContent).join(''),
        attr: (name) => (elements[0] ? elements[0].getAttribute(name) ?? undefined : undefined)
    })
    return (target) => wrap(typeof target === 'string' ? Array.from(document.querySelectorAll(target)) : [target])
}
