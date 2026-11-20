/**
 * UNPROVED — the real account adapter (F78, REQ-12): Sign in with Apple and Google Sign-In give a
 * credential, React Native Firebase Auth turns it into the Firebase user whose id owns the series.
 *
 * Written against the documented API (https://rnfirebase.io/auth/social-auth: `appleAuth.performRequest`
 * then `new OAuthProvider('apple.com').credential({ idToken, rawNonce })`; `GoogleSignin.signIn()` then
 * `GoogleAuthProvider.credential(idToken)`; `signInWithCredential(getAuth(), credential)`;
 * `onAuthStateChanged`) and checked here only by the TypeScript compiler and by Metro resolving it.
 *
 * What it still needs before it can run, and what proves it (tasks.md TASK-10 spike S2, TASK-19):
 *   - the Apple developer account (the Sign in with Apple capability, the Team ID);
 *   - the Firebase iOS and Android app registrations and their configuration files
 *     (GoogleService-Info.plist, google-services.json; app.json `ios.googleServicesFile`,
 *     `android.googleServicesFile`) and the Google web client id for `GoogleSignin.configure`;
 *   - a development build (the Xcode licence accepted, a simulator or the iPhone).
 * Never against the production Firebase project from an agent.
 *
 * The only file of the app that imports these three packages
 * (src/data/__tests__/nativePackagesStayInTheirAdapters.test.ts). Loaded lazily by the composition root.
 */
import { getAuth, onAuthStateChanged, signInWithCredential, signOut, OAuthProvider, GoogleAuthProvider } from '@react-native-firebase/auth'
import { appleAuth } from '@invertase/react-native-apple-authentication'
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin'
import { Platform } from 'react-native'
import { SignInCancelled } from './authPort'
import type { Account, AuthPort, Provider } from './authPort'

type FirebaseUser = { uid: string; displayName: string | null; providerData: { providerId: string }[] }

const accountOf = (user: FirebaseUser | null): Account | null => user
    ? { uid: user.uid, displayName: user.displayName, provider: user.providerData.some(p => p.providerId === 'apple.com') ? 'apple' : 'google' }
    : null

async function appleCredential() {
    const response = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL]
    })
    if (!response.identityToken) throw new Error('Sign in with Apple returned no identity token')
    return new OAuthProvider('apple.com').credential({ idToken: response.identityToken, rawNonce: response.nonce })
}

async function googleCredential() {
    await GoogleSignin.hasPlayServices()
    const response = await GoogleSignin.signIn()
    if (!isSuccessResponse(response)) throw new SignInCancelled()
    if (!response.data.idToken) throw new Error('Google Sign-In returned no id token')
    return GoogleAuthProvider.credential(response.data.idToken)
}

/** @param googleWebClientId - the OAuth web client id of the Firebase project (public, not a secret) */
export function createNativeAuth(googleWebClientId: string): AuthPort {
    GoogleSignin.configure({ webClientId: googleWebClientId })
    const auth = getAuth()
    return {
        current: () => accountOf(auth.currentUser as FirebaseUser | null),
        onChange: (listener) => onAuthStateChanged(auth, (user) => listener(accountOf(user as FirebaseUser | null))),
        async signIn(provider: Provider) {
            const credential = provider === 'apple' ? await appleCredential() : await googleCredential()
            const result = await signInWithCredential(auth, credential)
            const account = accountOf(result.user as FirebaseUser)
            if (!account) throw new Error('Firebase returned no user')
            return { ...account, provider }
        },
        async signOut() {
            await signOut(auth)
        },
        providers: () => (Platform.OS === 'ios' ? ['apple', 'google'] : ['google'])
    }
}
