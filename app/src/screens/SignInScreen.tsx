/**
 * Sign in (F78 skeleton, REQ-12): Apple or Google, no guest. States: idle (the buttons the platform
 * offers), signing in (buttons off, «Signing in…»), failed («Couldn't sign in. Try again.», the
 * text of REQ-12), and cancelled (back to idle, nothing said). In demo mode the screen says that no
 * account is used.
 */
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useServices } from '../ui/AppServicesContext'
import { SignInCancelled } from '../auth/authPort'
import type { Provider } from '../auth/authPort'
import { CenteredState, PrimaryButton, TopBar, styles as parts } from '../ui/parts'
import { colors, size, type } from '../ui/theme'

const LABEL: Record<Provider, string> = { apple: 'Sign in with Apple', google: 'Sign in with Google' }

type State = { kind: 'idle' } | { kind: 'signingIn'; provider: Provider } | { kind: 'failed' }

export function SignInScreen() {
    const { auth, usage, mode } = useServices()
    const [state, setState] = useState<State>({ kind: 'idle' })

    const signIn = async (provider: Provider) => {
        setState({ kind: 'signingIn', provider })
        try {
            await auth.signIn(provider)
            usage.track('sign_in', { provider })
            setState({ kind: 'idle' })
        } catch (error) {
            setState(error instanceof SignInCancelled ? { kind: 'idle' } : { kind: 'failed' })
        }
    }

    const busy = state.kind === 'signingIn'
    return (
        <View style={parts.screen}>
            <TopBar title="Sign in" />
            <CenteredState
                title="The Album Blender"
                detail="Sign in to see your series, the same ones as on the site."
                testID="sign-in"
            >
                {auth.providers().map(provider => (
                    <PrimaryButton key={provider} label={LABEL[provider]} onPress={() => void signIn(provider)} disabled={busy} />
                ))}
                {busy ? <Text style={styles.note} accessibilityLiveRegion="polite">Signing in…</Text> : null}
                {state.kind === 'failed' ? <Text style={styles.error} accessibilityLiveRegion="assertive">Couldn&apos;t sign in. Try again.</Text> : null}
                {mode === 'demo' ? <Text style={styles.note}>Demo mode: no account is used, and the series are examples.</Text> : null}
            </CenteredState>
        </View>
    )
}

const styles = StyleSheet.create({
    note: { ...type.secondary, color: colors.textSecondary, textAlign: 'center', minHeight: size.target / 2 },
    error: { ...type.secondary, color: colors.danger, textAlign: 'center' }
})
