/**
 * The account port of the app (F78, REQ-12; proposal § 4.3, «Conta»): sign in with Apple or with
 * Google — no guest in the app — sign out, and who is signed in. The screens talk to this port only.
 *
 *   fakeAuth.ts    for the tests and the demo mode. PROVED here.
 *   nativeAuth.ts  Sign in with Apple, Google Sign-In and React Native Firebase Auth. UNPROVED until
 *                  a device, the Apple developer account and the Firebase app configuration exist
 *                  (spike S2, tasks.md TASK-10; TASK-19).
 */

/** The two ways in; the stores require Sign in with Apple when another social sign-in is offered. */
export type Provider = 'apple' | 'google'

export interface Account {
    /** the Firebase user id: the series live under it (shared/data/SeriesRepository.js) */
    uid: string
    /** what the screens may show of the person: the name the provider gave, or nothing */
    displayName: string | null
    provider: Provider
}

/** The person closed the provider's sheet: not a failure, the screen goes back to idle. */
export class SignInCancelled extends Error {
    constructor() {
        super('Sign-in cancelled')
        this.name = 'SignInCancelled'
    }
}

export interface AuthPort {
    /** who is signed in now, or null */
    current(): Account | null
    /** called with the account (or null) at once and on every change; returns the unsubscribe */
    onChange(listener: (account: Account | null) => void): () => void
    /** resolves with the account; rejects with SignInCancelled, or with any other error on failure */
    signIn(provider: Provider): Promise<Account>
    signOut(): Promise<void>
    /** which providers this platform offers (Sign in with Apple has no button on Android today) */
    providers(): Provider[]
}
