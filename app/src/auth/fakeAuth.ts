/**
 * The fake account (F78): the account port with no provider behind it, for the tests and for the
 * skeleton's demo mode. Signing in gives the demo account at once; a test can make the next sign-in
 * fail or be cancelled, and can delay it to see the screen's «Signing in…» state.
 */
import { SignInCancelled } from './authPort'
import type { Account, AuthPort, Provider } from './authPort'

export interface FakeAuth extends AuthPort {
    /** the next sign-in fails with this error, or is cancelled */
    failNextSignIn(outcome: Error | 'cancelled'): void
}

export interface FakeAuthOptions {
    uid?: string
    providers?: Provider[]
    /** how long a sign-in takes, in milliseconds */
    delayMs?: number
}

export function createFakeAuth(options: FakeAuthOptions = {}): FakeAuth {
    let account: Account | null = null
    let nextFailure: Error | 'cancelled' | null = null
    const listeners = new Set<(account: Account | null) => void>()
    const announce = () => listeners.forEach(listener => listener(account))

    return {
        current: () => account,
        onChange(listener) {
            listeners.add(listener)
            listener(account)
            return () => { listeners.delete(listener) }
        },
        async signIn(provider) {
            if (options.delayMs) await new Promise(done => setTimeout(done, options.delayMs))
            const failure = nextFailure
            nextFailure = null
            if (failure === 'cancelled') throw new SignInCancelled()
            if (failure) throw failure
            account = { uid: options.uid ?? 'demo-user', displayName: 'Demo', provider }
            announce()
            return account
        },
        async signOut() {
            account = null
            announce()
        },
        providers: () => options.providers ?? ['apple', 'google'],
        failNextSignIn(outcome) {
            nextFailure = outcome
        }
    }
}
