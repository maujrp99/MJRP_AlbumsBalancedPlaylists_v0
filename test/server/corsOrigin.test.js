/**
 * F87 - in production the server accepts the origins of its list, no Origin header at all, and the
 * preview channels of its own Hosting site (https://<site>--<channel>-<hash>.web.app). Anything
 * else is refused, and a refusal leaks nothing.
 */
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { isOriginAllowed, hostingSiteId } = require('../../server/lib/corsOrigin.js')
const { errorResponder } = require('../../server/lib/asyncRoute.js')

const SITE = 'https://mjrp-playlist-generator.web.app'
const LIST = [SITE]

describe('isOriginAllowed (F87)', () => {
    it.each([
        SITE,
        'https://mjrp-playlist-generator--staging-2nu8kutx.web.app',
        'https://mjrp-playlist-generator--feat-new-menu-a1b2c3d4.web.app',
        'https://mjrp-playlist-generator--pr42-9z.web.app'
    ])('accepts %s', (origin) => {
        expect(isOriginAllowed(origin, LIST)).toBe(true)
    })

    it('accepts a request with no Origin header', () => {
        expect(isOriginAllowed(undefined, LIST)).toBe(true)
        expect(isOriginAllowed('', LIST)).toBe(true)
    })

    it('keeps the explicit list working, any address on it', () => {
        expect(isOriginAllowed('https://example.org', ['https://example.org', SITE])).toBe(true)
        expect(isOriginAllowed('https://example.org', LIST)).toBe(false)
    })

    it.each([
        ['plain http', 'http://mjrp-playlist-generator--staging-2nu8kutx.web.app'],
        ['another suffix', 'https://mjrp-playlist-generator--staging-2nu8kutx.web.app.evil.com'],
        ['the same text before another host', 'https://evil.com/https://mjrp-playlist-generator--staging-2nu8kutx.web.app'],
        ['another site', 'https://othersite--staging-2nu8kutx.web.app'],
        ['a site that only ends like ours', 'https://xmjrp-playlist-generator--staging-2nu8kutx.web.app'],
        ['upper case', 'https://mjrp-playlist-generator--Staging-2NU8KUTX.web.app'],
        ['upper case host', 'HTTPS://MJRP-PLAYLIST-GENERATOR--STAGING-2NU8KUTX.WEB.APP'],
        ['credentials', 'https://user:pass@mjrp-playlist-generator--staging-2nu8kutx.web.app'],
        ['credentials that point elsewhere', 'https://mjrp-playlist-generator--staging-2nu8kutx.web.app@evil.com'],
        ['a port', 'https://mjrp-playlist-generator--staging-2nu8kutx.web.app:8443'],
        ['a path', 'https://mjrp-playlist-generator--staging-2nu8kutx.web.app/'],
        ['a trailing newline', 'https://mjrp-playlist-generator--staging-2nu8kutx.web.app\n'],
        ['no hash', 'https://mjrp-playlist-generator--staging.web.app'],
        ['an empty channel', 'https://mjrp-playlist-generator---abc.web.app'],
        ['firebaseapp.com', 'https://mjrp-playlist-generator--staging-2nu8kutx.firebaseapp.com'],
        ['a dot in the channel', 'https://mjrp-playlist-generator--a.b-abc.web.app'],
        ['the site id itself with a dot before the dashes', 'https://mjrp-playlist-generator.x--staging-abc.web.app']
    ])('refuses %s', (_name, origin) => {
        expect(isOriginAllowed(origin, LIST)).toBe(false)
    })

    it('has no previews when the first origin is not a <site>.web.app address', () => {
        expect(hostingSiteId(['https://example.org'])).toBe('')
        expect(isOriginAllowed('https://example--staging-abc.web.app', ['https://example.org'])).toBe(false)
        expect(isOriginAllowed('https://x--staging-abc.web.app', [])).toBe(false)
    })

    it('takes the site id from the first listed origin', () => {
        expect(hostingSiteId(['https://my-site.web.app', 'https://other.web.app'])).toBe('my-site')
        expect(isOriginAllowed('https://my-site--qa-abc123.web.app', ['https://my-site.web.app'])).toBe(true)
    })
})

describe('what a refused origin answers (F87)', () => {
    // The server's check hands `new Error('CORS origin not allowed')` to the closing responder
    it('is a plain 500 with no message and no stack', () => {
        const sent = {}
        const res = {
            headersSent: false,
            status (code) { sent.status = code; return this },
            json (body) { sent.body = JSON.stringify(body); return this },
            send (body) { sent.body = JSON.stringify(body); return this },
            set () { return this },
            type () { return this }
        }
        errorResponder({ error () {} })(new Error('CORS origin not allowed'), { method: 'POST', path: '/api/x' }, res, () => {})
        expect(sent.status).toBe(500)
        expect(sent.body).not.toMatch(/CORS|origin|at .*\(|\.js:\d+|node_modules/i)
    })
})
