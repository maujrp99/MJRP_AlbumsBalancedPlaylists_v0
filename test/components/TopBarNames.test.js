/**
 * F63 (UAT-211) - the top bar shows the person's name and the Spotify name whole when the screen
 * is wide, and always says the whole name on hover; and the title picture has no box behind it.
 */
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { inflateSync } from 'node:zlib'

vi.mock('@shared/services/AuthService.js', () => ({ authService: { logout: vi.fn(async () => { }) } }))
vi.mock('../../public/js/services/SpotifyAuthService.js', () => ({ SpotifyAuthService: { logout: vi.fn() } }))
vi.mock('../../public/js/components/LoginModal.js', () => ({ showLoginModal: vi.fn() }))
vi.mock('../../public/js/components/Toast.js', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../../public/js/components/Icons.js', () => ({ getIcon: () => '' }))
vi.mock('../../public/js/utils/reloadApp.js', () => ({ reloadApp: vi.fn() }))

import { AuthNav } from '../../public/js/components/navigation/AuthNav.js'
import { NAME_IN_THE_BAR } from '../../public/js/components/navigation/barName.js'

const NAME = 'Maurício Pedroso da Silva'

describe('top bar: names are not cut at 80 px (UAT-211)', () => {
    it('the rule: narrow by default, wide on a wide screen, the tail cut with "…"', () => {
        expect(NAME_IN_THE_BAR).toContain('truncate')
        expect(NAME_IN_THE_BAR).toContain('xl:max-w-[220px]')
        expect(NAME_IN_THE_BAR).not.toMatch(/(^| )max-w-\[80px\]( |$)/)
    })

    it('the account name uses the rule and says the whole name on hover', () => {
        const nav = new AuthNav({ currentUser: { isAnonymous: false, displayName: NAME, email: 'm@example.test', photoURL: '/a.png' }, loading: false })
        document.body.innerHTML = nav.renderDesktop()
        const name = document.querySelector('[data-account-name]')
        expect(name.textContent).toBe(NAME)
        expect(name.getAttribute('title')).toBe(NAME)
        NAME_IN_THE_BAR.split(' ').forEach(cls => expect(name.classList.contains(cls)).toBe(true))
    })

    it('the Spotify name uses the same rule (read from the source: the button draws from a live session)', () => {
        const source = readFileSync(resolve(process.cwd(), 'public/js/components/SpotifyConnectButton.js'), 'utf8')
        expect(source).toContain('NAME_IN_THE_BAR')
        expect(source).not.toContain('max-w-[80px]')
        expect(source).toMatch(/data-spotify-name[^>]*title="\$\{escapeHtml\(userName\)\}"/)
    })
})

describe('top bar: the title picture has no box behind it (UAT-211)', () => {
    it('the first pixel of the PNG is transparent (it used to be solid black)', () => {
        const png = readFileSync(resolve(process.cwd(), 'public/assets/images/TheAlbumBlender.png'))
        expect(png[25]).toBe(6) // colour type RGBA
        // every IDAT chunk, inflated: the first row starts with its filter byte, then R, G, B, A
        const data = []
        for (let at = 8; at < png.length;) {
            const size = png.readUInt32BE(at)
            if (png.toString('latin1', at + 4, at + 8) === 'IDAT') data.push(png.subarray(at + 8, at + 8 + size))
            at += 12 + size
        }
        const firstRow = inflateSync(Buffer.concat(data))
        expect(firstRow[4]).toBe(0)
    })
})
