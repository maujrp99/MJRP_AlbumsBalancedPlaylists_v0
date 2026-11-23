/**
 * menuText - every text the top menu writes that is not the name of a destination (those are in phoneTabs.ts), in ONE place (F88; F83 sync of
 * main: the same words, now read from the dictionary when they are drawn, so that the work on languages, F81, finds them with the others).
 * Each one is a getter: read at the moment it is used, never kept.
 */
import { t } from '../i18n/t.js'

export const MENU_TEXT = {
    get flipMark() { return t('shell.m.flipMark') },
    get account() { return t('shell.m.account') },
    get connectionsOnly() { return t('shell.m.connectionsOnly') },
    get connectionsTitle() { return t('shell.m.connectionsTitle') },
    get notConnected() { return t('shell.m.notConnected') },
    get connecting() { return t('shell.m.connecting') },
    get checking() { return t('shell.m.checking') },
    get failed() { return t('shell.m.failed') },
    get connected() { return t('shell.m.connected') },
    get connect() { return t('shell.m.connect') },
    get tryAgain() { return t('shell.m.tryAgain') },
    get disconnect() { return t('shell.m.disconnect') },
    connectedAs: (name: string): string => t('shell.m.connectedAs', { name }),
    disconnectAsk: (name: string) => ({ title: t('shell.m.disconnectTitle', { name }), message: t('shell.m.disconnectMessage'), confirmText: t('shell.m.disconnect') }),
    disconnectedToast: (name: string): string => t('shell.m.disconnectedToast', { name }),
    connectedSummary: (names: string[]): string => (names.length ? t('shell.m.connectedSummary', { names: names.join(t('shell.m.and')) }) : t('shell.m.nothingConnected'))
}
