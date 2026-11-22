/**
 * F59 slice E (UAT-199): an address that comes from a provider becomes a link only when it is a
 * web address. An address such as `javascript:...` never reaches href.
 * (F83 wave 6a: the badge is the one of the row of the inventory in React, screens/inventory/ItemRow.tsx; the old Card.renderRankingBadge is gone.)
 */
import { describe, it, expect, afterEach } from 'vitest'
import { createElement } from 'react'
import { RankingBadges } from '../../public/js/screens/inventory/ItemRow'
import { draw, undraw } from '../support/inventoryHost'

const CODE = 'javascript:window.__xss=1'

describe('the Spotify badge of a row of the inventory', () => {
    afterEach(async () => { await undraw() })
    const spotifyLink = async (entity) => [...(await draw(createElement(RankingBadges, { item: { id: 'a', ...entity } }))).querySelectorAll('a')].find(link => link.title === 'Spotify')

    it('links to the stored address when it is a web address', async () => {
        const link = await spotifyLink({ spotifyId: 'abc123', spotifyUrl: 'https://open.spotify.com/album/stored' })
        expect(link.getAttribute('href')).toBe('https://open.spotify.com/album/stored')
    })

    it('falls back to the address made from the Spotify id when the stored one is not a web address', async () => {
        const link = await spotifyLink({ spotifyId: 'abc123', spotifyUrl: CODE })
        expect(link.getAttribute('href')).toBe('https://open.spotify.com/album/abc123')
    })

    it('keeps an id from leaving the path of the Spotify address', async () => {
        const link = await spotifyLink({ spotifyId: '../x?y=1#z' })
        expect(link.getAttribute('href')).toBe('https://open.spotify.com/album/..%2Fx%3Fy%3D1%23z')
    })
})
