import { Redirect } from 'expo-router'
import { SignInScreen } from '../screens/SignInScreen'
import { useAccount } from '../ui/AppServicesContext'

export default function SignIn() {
    const account = useAccount()
    if (account) return <Redirect href="/albums" />
    return <SignInScreen />
}
