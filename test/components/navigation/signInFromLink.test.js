/**
 * F80 (REQ-03) - «Sign in» on the entry page leads to /home?signin: the app opens the sign-in window
 * for whoever has not signed in with an account, and takes `signin` out of the address (a reload or
 * a shared link does not open it again).
 */
import { describe, it, expect, vi } from 'vitest'
import { signInAsked, addressWithoutSignIn, openSignInWhenAsked } from '../../../public/js/components/navigation/signInFromLink.js'

const at = (pathname, search = '', hash = '') => ({ pathname, search, hash })

describe('the link that asks for the sign-in window', () => {
    it('is ?signin, with or without a value, among other parameters', () => {
        expect(signInAsked('?signin')).toBe(true)
        expect(signInAsked('?signin=1')).toBe(true)
        expect(signInAsked('?x=1&signin')).toBe(true)
        expect(signInAsked('')).toBe(false)
        expect(signInAsked('?signing=1')).toBe(false)
    })

    it('the address loses only `signin`', () => {
        expect(addressWithoutSignIn(at('/home', '?signin'))).toBe('/home')
        expect(addressWithoutSignIn(at('/home', '?x=1&signin', '#top'))).toBe('/home?x=1#top')
    })
})

describe('opening it', () => {
    it('a guest arriving from the entry page gets the window, and the address is cleaned', () => {
        const openSignIn = vi.fn(), setAddress = vi.fn()
        expect(openSignInWhenAsked({ location: at('/home', '?signin'), signedIn: false, openSignIn, setAddress })).toBe(true)
        expect(openSignIn).toHaveBeenCalledTimes(1)
        expect(setAddress).toHaveBeenCalledWith('/home')
    })

    it('someone already signed in only gets the address cleaned', () => {
        const openSignIn = vi.fn(), setAddress = vi.fn()
        expect(openSignInWhenAsked({ location: at('/home', '?signin'), signedIn: true, openSignIn, setAddress })).toBe(false)
        expect(openSignIn).not.toHaveBeenCalled()
        expect(setAddress).toHaveBeenCalledWith('/home')
    })

    it('without the link nothing happens', () => {
        const openSignIn = vi.fn(), setAddress = vi.fn()
        expect(openSignInWhenAsked({ location: at('/albums/abc'), signedIn: false, openSignIn, setAddress })).toBe(false)
        expect(openSignIn).not.toHaveBeenCalled()
        expect(setAddress).not.toHaveBeenCalled()
    })
})
