import { Redirect, useLocalSearchParams } from 'expo-router'
import { SignInScreen } from '../screens/SignInScreen'
import { useAccount, useServices } from '../ui/AppServicesContext'

/** albumblender://sign-in?as=apple signs in at once, in demo mode only (the fake account). */
export default function SignIn() {
    const account = useAccount()
    const { mode } = useServices()
    const { as } = useLocalSearchParams<{ as?: string }>()
    if (account) return <Redirect href="/albums" />
    const autoSignIn = mode === 'demo' && (as === 'apple' || as === 'google') ? as : undefined
    return <SignInScreen autoSignIn={autoSignIn} />
}
