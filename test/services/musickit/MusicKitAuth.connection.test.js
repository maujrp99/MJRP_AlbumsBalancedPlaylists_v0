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

    it('asks MusicKit whether the person authorized on an earlier visit (it keeps the authorization), starting it only now', async () => {
        const fresh = new MusicKitAuth()
        fresh.init = vi.fn(async () => { fresh.music = { isAuthorized: true }; return fresh.music })
        expect(fresh.isConnected()).toBe(false)
        await expect(fresh.checkConnection()).resolves.toBe(true)
        expect(fresh.init).toHaveBeenCalledTimes(1)
        expect(fresh.isConnected()).toBe(true)
        expect(heard).toHaveBeenCalledTimes(1)
    })

    it('says not connected when MusicKit holds no authorization, and lets a failed start through', async () => {
        const fresh = new MusicKitAuth()
        fresh.init = vi.fn(async () => { fresh.music = { isAuthorized: false }; return fresh.music })
        await expect(fresh.checkConnection()).resolves.toBe(false)
        const broken = new MusicKitAuth()
        broken.init = vi.fn(async () => { throw new Error('no token') })
        await expect(broken.checkConnection()).rejects.toThrow('no token')
    })
})
