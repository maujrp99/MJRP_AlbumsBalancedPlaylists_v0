/**
 * AuthNav.js
 *
 * The account on the right of the top menu (F88): one button that opens ONE panel with who is in
 * (or the way to sign in), the connections (Spotify, Apple Music), the cache and sign out.
 * Extracted from TopNav.js. Handles User Auth UI and its listeners.
 */
import { getIcon } from '../Icons.js';
import { escapeHtml } from '../../utils/stringUtils.js';
import { authService } from '../../services/auth/signIn.js';
import { showLoginModal } from '../LoginModal.js';
import toast from '../Toast.js';
import { SpotifyAuthService } from '../../services/SpotifyAuthService.js';
import { reloadApp } from '../../utils/reloadApp.js';
import { NAME_IN_THE_BAR } from './barName.js'
import { track } from '../../services/usage/track.js'
import { MENU_TEXT } from './menuText.js'
import { accountInitial } from './account.js'
import { mountConnections, realConnections } from './connections.js'
import { askToClearCache } from './clearCache.js'

/** Somebody signed in with an account of their own: a guest session is not one. */
export const isSignedIn = (user) => Boolean(user && !user.isAnonymous)

/**
 * Signs the person out of the app and of Spotify, says so, and loads a fresh page. One place for
 * every control that signs out: the account panel and the menu sheet of the phone (F76).
 */
export async function signOut() {
    try {
        await authService.logout();
        // The Spotify session belongs to the person who is leaving: it goes with them (F59, UAT-28)
        SpotifyAuthService.logout();
        track('sign_out');
        toast.success('Signed out successfully');
        // A fresh page: nothing of the person who left stays in memory or on screen
        reloadApp();
    } catch {
        toast.error('Sign out failed');
    }
}

export class AuthNav {
    /**
     * @param {Object} userState - the user store's state
     * @param {Object} [deps]
     * @param {Function} [deps.clearCaches] - () => Promise: forgets what the browser keeps about albums
     */
    constructor(userState, { clearCaches } = {}) {
        this.userState = userState;
        this.clearCaches = clearCaches;
        this.connections = null;
        // One listener of each kind for the whole life of the nav, however many times it is drawn
        this.onDocumentClick = (event) => this.handleDocumentClick(event);
        this.onDocumentKeydown = (event) => this.handleDocumentKeydown(event);
    }

    updateState(state) {
        this.userState = state;
    }

    /** The account on the right of the bar: «Sign In» for who is not in, and the button that opens the panel. */
    renderDesktop() {
        const { currentUser, loading } = this.userState;
        if (loading) return `<div class="w-8 h-8 rounded-full bg-white/10 animate-pulse"></div>`;
        const signedIn = isSignedIn(currentUser);
        const signIn = signedIn ? '' : `<button id="loginBtn" type="button" class="top-menu__signin">${MENU_TEXT.signIn}</button>`;
        return `${signIn}
            <div class="top-acct relative min-w-0" id="userMenuDropdownTrigger">
                <button id="userMenuBtn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="userMenu" aria-label="${signedIn ? MENU_TEXT.account : MENU_TEXT.connectionsOnly}" class="top-acct__btn min-w-0 max-w-full">
                    ${signedIn ? this.renderAvatar(currentUser) : getIcon('Music', 'w-5 h-5')}
                    ${signedIn ? this.renderName(currentUser) : ''}
                    <span class="top-acct__dots" data-connection-dots aria-hidden="true"></span>
                </button>
                ${this.renderPanel(currentUser, signedIn)}
            </div>`;
    }

    renderName(user) {
        return `<span class="hidden xl:block text-xs font-medium text-white/80 ${NAME_IN_THE_BAR}" data-account-name title="${escapeHtml(user.displayName || 'User')}">${escapeHtml(user.displayName || 'User')}</span>`;
    }

    /** The initial in orange, as on the phone and in the prototype: never a picture (F88). */
    renderAvatar(user) {
        return `<span class="top-acct__initial shrink-0" aria-hidden="true">${escapeHtml(accountInitial(user))}</span>`;
    }

    /** The one panel: who is in (or the way to sign in), the connections, the cache, sign out. */
    renderPanel(user, signedIn) {
        const who = signedIn
            ? `<p class="text-xs text-white/70">${MENU_TEXT.signedInAs}</p><p class="text-sm font-bold truncate">${escapeHtml(user.displayName || user.email)}</p>`
            : `<p class="text-sm text-white/70">${MENU_TEXT.signInHint}</p>`;
        const signOutRow = signedIn
            ? `<button id="logoutBtn" type="button" class="top-panel__row top-panel__row--danger">${getIcon('Logout', 'w-4 h-4')} ${MENU_TEXT.signOut}</button>`
            : '';
        return `
            <div id="userMenu" role="dialog" aria-label="${MENU_TEXT.account}" class="top-panel opacity-0 invisible">
                <div class="top-panel__who">${who}</div>
                <div class="top-panel__section">${MENU_TEXT.connectionsTitle}</div>
                <div id="accountConnections"></div>
                <div class="top-panel__rule"></div>
                <button id="panelClearCache" type="button" class="top-panel__row">${getIcon('Trash', 'w-4 h-4')} ${MENU_TEXT.clearCache}</button>
                ${signOutRow}
            </div>`;
    }

    attachListeners() {
        this.attachMenuListeners();
        document.getElementById('loginBtn')?.addEventListener('click', () => showLoginModal());
        document.getElementById('logoutBtn')?.addEventListener('click', signOut);
        document.getElementById('panelClearCache')?.addEventListener('click', () => this.askToClear());
        this.mountConnectionRows();
    }

    askToClear() {
        this.setMenuOpen(false);
        if (this.clearCaches) askToClearCache({ clearCaches: this.clearCaches });
    }

    /** Spotify and Apple Music in the panel; the dots on the button say who is connected. */
    mountConnectionRows() {
        this.connections?.destroy();
        this.connections = null;
        const box = document.getElementById('accountConnections');
        if (!box) return;
        this.connections = mountConnections(box, { ...realConnections(), onSummary: (summary) => this.showSummary(summary) });
    }

    /**
     * The dots and the label of the closed button say only what is known: `apple` is null while Apple Music
     * is still being asked (or could not be told), and then nothing is said of it, «Nothing connected» included.
     */
    showSummary({ spotify, apple }) {
        const dots = document.querySelector('[data-connection-dots]');
        const button = document.getElementById('userMenuBtn');
        const dot = (which, on) => (on ? `<b class="top-acct__dot top-acct__dot--${which}"></b>` : '');
        if (dots) dots.innerHTML = dot('spotify', spotify) + dot('apple', apple === true);
        if (!button) return;
        button.setAttribute('aria-label', this.summaryLabel(spotify, apple));
        button.dataset.apple = apple === null ? 'pending' : apple ? 'on' : 'off';
    }

    summaryLabel(spotify, apple) {
        const names = [spotify && 'Spotify', apple === true && 'Apple Music'].filter(Boolean);
        const base = isSignedIn(this.userState?.currentUser) ? MENU_TEXT.account : MENU_TEXT.connectionsOnly;
        const nothing = !spotify && apple === false;
        return names.length || nothing ? `${base}: ${MENU_TEXT.connectedSummary(names)}` : base;
    }

    // =========================================
    // THE PANEL (F63, UAT-13): opens with a tap, a click or the keyboard, never by hover alone
    // =========================================

    /** The panel is drawn closed each time; the listeners on the page are attached once. */
    attachMenuListeners() {
        this.detachListeners();
        document.addEventListener('click', this.onDocumentClick);
        document.addEventListener('keydown', this.onDocumentKeydown);
    }

    /** The nav is gone: nothing of it keeps listening to the page. */
    detachListeners() {
        document.removeEventListener('click', this.onDocumentClick);
        document.removeEventListener('keydown', this.onDocumentKeydown);
    }

    isMenuOpen() {
        return document.getElementById('userMenuBtn')?.getAttribute('aria-expanded') === 'true';
    }

    /**
     * @param {boolean} open
     * @returns {boolean} false when there is no panel on the page
     */
    setMenuOpen(open) {
        const trigger = document.getElementById('userMenuBtn');
        const menu = document.getElementById('userMenu');
        if (!trigger || !menu) return false;
        trigger.setAttribute('aria-expanded', String(open));
        menu.classList.toggle('opacity-0', !open);
        menu.classList.toggle('invisible', !open);
        if (open) this.connections?.check();
        return true;
    }

    /** A click on the button toggles; a click anywhere outside the panel closes. */
    handleDocumentClick(event) {
        const target = event.target instanceof Element ? event.target : null;
        if (target?.closest('#userMenuBtn')) {
            this.setMenuOpen(!this.isMenuOpen());
            return;
        }
        // A window the panel opened (the question before a disconnect) is not «outside»: the panel stays and shows the new state
        if (this.isMenuOpen() && !target?.closest('#userMenu, .app-modal')) this.setMenuOpen(false);
    }

    /** Escape closes and gives the focus back; Arrow Down on the button opens on the first control. */
    handleDocumentKeydown(event) {
        const trigger = document.getElementById('userMenuBtn');
        if (!trigger) return;

        if (event.key === 'Escape' && this.isMenuOpen()) {
            this.setMenuOpen(false);
            trigger.focus();
        } else if (event.key === 'ArrowDown' && document.activeElement === trigger) {
            event.preventDefault();
            this.setMenuOpen(true);
            document.querySelector('#userMenu button, #userMenu a')?.focus();
        }
    }
}
