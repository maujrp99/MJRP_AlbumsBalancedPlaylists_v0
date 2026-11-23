/** account - how the menu names the person who is signed in: the name, and its first letter (what the account button shows on the computer and on the phone alike, F88). */
import { t } from '../i18n/t.js'
import type { ShellUser } from './context'

export const accountName = (user: ShellUser | null): string => user?.displayName || user?.email || t('shell.account.user')
/** The first letter of the person's name. */
export const accountInitial = (user: ShellUser | null): string => accountName(user).trim().charAt(0).toUpperCase() || 'U'
