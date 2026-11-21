/**
 * Signs the person out of the app and of Spotify, says so, and loads a fresh page. One place for every control that signs out: the account
 * menu, the drawer, and the menu sheet of the phone (F76).
 */
import { authService } from '../services/auth/signIn.js'
import { SpotifyAuthService } from '../services/SpotifyAuthService.js'
import { track } from '../services/usage/track.js'
import { reloadApp } from '../utils/reloadApp.js'
import toast from '../components/Toast.js'
import { t } from '../i18n/t.js'

export async function signOut(): Promise<void> {
    try {
        await authService.logout()
        // The Spotify session belongs to the person who is leaving: it goes with them (F59, UAT-28)
        SpotifyAuthService.logout()
        track('sign_out')
        toast.success(t('shell.account.signedOut'))
        // A fresh page: nothing of the person who left stays in memory or on screen
        reloadApp()
    } catch {
        toast.error(t('shell.account.signOutFailed'))
    }
}
