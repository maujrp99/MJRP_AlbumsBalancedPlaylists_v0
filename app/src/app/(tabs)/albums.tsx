import { useRouter } from 'expo-router'
import { AlbumsScreen } from '../../screens/AlbumsScreen'
import { useAccount } from '../../ui/AppServicesContext'

export default function Albums() {
    const account = useAccount()
    const router = useRouter()
    if (!account) return null // the tab layout sends whoever is not signed in to the sign-in screen
    return <AlbumsScreen userId={account.uid} onOpenDiagnostics={() => router.push('/diagnostics')} />
}
