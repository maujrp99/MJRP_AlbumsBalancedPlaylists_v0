/**
 * F88 (REQ-02) - the menu shows the Apple Music connection, so MusicKit says whether the person is
 * connected, announces a change (`applemusic-auth-change`) and can disconnect.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MusicKitAuth } from '../../../public/js/services/musickit/MusicKitAuth.js'

describe('MusicKitAuth: the connection the menu shows (F88)', () => {
    let auth, heard

    beforeEach(() => {
        auth = new MusicKitAuth()
        auth.init = vi.fn(async () => auth.music)
        auth.music = { authorize: vi.fn(async () => 'user-token'), unauthorize: vi.fn(async () => { }), musicUserToken: 'user-token' }
        auth.isInitialized = true
        heard = vi.fn()
        window.addEventListener('applemusic-auth-change', heard)
        vi.spyOn(console, 'log').mockImplementation(() => { })
    })

    it('is not connected until the person authorizes, and says so after', async () => {
        expect(auth.isConnected()).toBe(false)
        await auth.authorize()
        expect(auth.isConnected()).toBe(true)
        expect(heard).toHaveBeenCalledTimes(1)
    })

    it('disconnects: MusicKit forgets the person, the state goes back, the change is announced', async () => {
        await auth.authorize()
        heard.mockClear()
        await auth.unauthorize()
        expect(auth.music.unauthorize).toHaveBeenCalledTimes(1)
        expect(auth.isConnected()).toBe(false)
        expect(heard).toHaveBeenCalledTimes(1)
    })

    it('a disconnect with MusicKit never started has nothing to do and does not fail', async () => {
        const fresh = new MusicKitAuth()
        await expect(fresh.unauthorize()).resolves.toBeUndefined()
        expect(fresh.isConnected()).toBe(false)
    })
})
