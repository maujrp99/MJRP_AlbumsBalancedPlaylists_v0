/**
 * «Sign in» from the entry page (F80, REQ-03): the page links to /start?signin. The app opens the
 * sign-in window for whoever has not signed in with an account, and takes `signin` out of the
 * address in place (a reload, the back button or a shared link does not open it again).
 */

const PARAM = 'signin'

/** The address asks for the sign-in window. */
export const signInAsked = (search) => new URLSearchParams(search || '').has(PARAM)

/** The same address without `signin`: path, the other parameters, the hash. */
export function addressWithoutSignIn({ pathname, search, hash }) {
    const params = new URLSearchParams(search || '')
    params.delete(PARAM)
    const rest = params.toString().replace(/=(?=&|$)/g, '')
    return `${pathname}${rest ? `?${rest}` : ''}${hash || ''}`
}

/**
 * @param {{ location: {pathname, search, hash}, signedIn: boolean, openSignIn: Function, setAddress: Function }} deps
 * @returns {boolean} whether the window was opened
 */
export function openSignInWhenAsked({ location, signedIn, openSignIn, setAddress }) {
    if (!signInAsked(location.search)) return false
    setAddress(addressWithoutSignIn(location))
    if (signedIn) return false
    openSignIn()
    return true
}
