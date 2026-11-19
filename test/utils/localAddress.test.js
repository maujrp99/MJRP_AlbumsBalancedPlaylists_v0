import { describe, it, expect } from 'vitest'
import { canonicalLocalUrl, LOCAL_HOST } from '../../public/js/utils/localAddress.js'

const at = (href) => new URL(href)

describe('canonicalLocalUrl — one local address (F50)', () => {
    it('sends localhost to 127.0.0.1, keeping port, path, query and hash', () => {
        expect(canonicalLocalUrl(at('http://localhost:5010/albums?x=1#top')))
            .toBe('http://127.0.0.1:5010/albums?x=1#top')
    })

    it('keeps the Spotify callback query intact', () => {
        expect(canonicalLocalUrl(at('http://localhost:5010/callback?code=abc&state=xyz')))
            .toBe('http://127.0.0.1:5010/callback?code=abc&state=xyz')
    })

    it('leaves 127.0.0.1 alone', () => {
        expect(canonicalLocalUrl(at('http://127.0.0.1:5010/albums'))).toBeNull()
    })

    it('leaves production alone', () => {
        expect(canonicalLocalUrl(at('https://mjrp-playlist-generator.web.app/albums'))).toBeNull()
    })

    it('answers null without a location', () => {
        expect(canonicalLocalUrl(null)).toBeNull()
    })

    it('names the one local host', () => {
        expect(LOCAL_HOST).toBe('127.0.0.1')
    })
})
