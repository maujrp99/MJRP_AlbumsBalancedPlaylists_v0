/**
 * AuthNav.js
 * 
 * Extracted from TopNav.js
 * Handles User Auth UI and specific listeners.
 */
import { getIcon } from '../Icons.js';
import { escapeHtml } from '../../utils/stringUtils.js';
import { authService } from '@shared/services/AuthService.js';
import { showLoginModal } from '../LoginModal.js';
import toast from '../Toast.js';
import { SpotifyAuthService } from '../../services/SpotifyAuthService.js';
import { reloadApp } from '../../utils/reloadApp.js';
import { NAME_IN_THE_BAR } from './barName.js'
import { track } from '../../services/usage/track.js'

/** Somebody signed in with an account of their own: a guest session is not one. */
export const isSignedIn = (user) => Boolean(user && !user.isAnonymous)

/**
 * Signs the person out of the app and of Spotify, says so, and loads a fresh page. One place for
 * every control that signs out: the account menu, the drawer, and the menu sheet of the phone (F76).
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
    constructor(userState) {
        this.userState = userState;
        // One listener of each kind for the whole life of the nav, however many times it is drawn
        this.onDocumentClick = (event) => this.handleDocumentClick(event);
        this.onDocumentKeydown = (event) => this.handleDocumentKeydown(event);
    }

    updateState(state) {
        this.userState = state;
    }

    renderDesktop() {
        const { currentUser, loading } = this.userState;

        if (loading) {
            return `<div class="w-8 h-8 rounded-full bg-white/10 animate-pulse"></div>`;
        }

        if (currentUser && !currentUser.isAnonymous) {
            const isAppleProvider = currentUser.providerData?.some(p => p.providerId === 'apple.com');
            const avatarContent = isAppleProvider
                ? `<div class="w-8 h-8 shrink-0 rounded-full bg-gray-800 border border-white/20 flex items-center justify-center">${getIcon('Apple', 'w-5 h-5 text-white')}</div>`
                : `<img src="${escapeHtml(currentUser.photoURL || '/assets/images/logo.png')}" class="w-8 h-8 shrink-0 rounded-full border border-white/20" alt="User">`;

            return `
                <div class="relative min-w-0" id="userMenuDropdownTrigger">
                    <button id="userMenuBtn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="userMenu" aria-label="Account menu" class="flex items-center gap-2 p-1 max-w-full rounded-full hover:bg-white/5 transition-colors">
                        ${avatarContent}
                         <span class="hidden xl:block text-xs font-medium text-white/80 ${NAME_IN_THE_BAR}" data-account-name title="${escapeHtml(currentUser.displayName || 'User')}">${escapeHtml(currentUser.displayName || 'User')}</span>
                    </button>
                    
                    <div id="userMenu" role="menu" aria-labelledby="userMenuBtn" class="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl opacity-0 invisible transition-all duration-200 z-50">
                        <div class="p-3 border-b border-white/10">
                            <p class="text-xs text-white/50">Signed in as</p>
                            <p class="text-sm font-bold truncate">${escapeHtml(currentUser.displayName || currentUser.email)}</p>
                        </div>
                        <button id="logoutBtn" role="menuitem" class="w-full text-left px-4 py-3 text-sm hover:bg-white/5 text-red-400 flex items-center gap-2">
                             ${getIcon('Logout', 'w-4 h-4')} Sign Out
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <button id="loginBtn" class="btn btn-sm btn-primary">
                Sign In
            </button>
        `;
    }

    renderMobile() {
        const { currentUser } = this.userState;
        if (currentUser && !currentUser.isAnonymous) {
            return `
                <div class="flex flex-col gap-3">
                    <div class="flex items-center gap-3 justify-center mb-2">
                        <img src="${escapeHtml(currentUser.photoURL || '/assets/images/logo.png')}" class="w-8 h-8 rounded-full">
                        <span class="text-sm font-bold">${escapeHtml(currentUser.displayName || 'User')}</span>
                    </div>
                     <button id="mobileLogoutBtn" class="btn btn-sm btn-secondary w-full">Sign Out</button>
                </div>
            `;
        }
        return `<button id="mobileLoginBtn" class="btn btn-sm btn-primary w-full">Sign In to Sync</button>`;
    }

    attachListeners() {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

        const openLogin = () => showLoginModal();
        const doLogout = signOut;

        this.attachMenuListeners();

        loginBtn?.addEventListener('click', openLogin);
        mobileLoginBtn?.addEventListener('click', openLogin);
        logoutBtn?.addEventListener('click', doLogout);
        mobileLogoutBtn?.addEventListener('click', doLogout);
    }

    // =========================================
    // ACCOUNT MENU (F63, UAT-13): opens with a tap, a click or the keyboard, never by hover alone
    // =========================================

    /** The menu is drawn closed each time; the listeners on the page are attached once. */
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
     * @returns {boolean} false when there is no menu on the page (nobody signed in)
     */
    setMenuOpen(open) {
        const trigger = document.getElementById('userMenuBtn');
        const menu = document.getElementById('userMenu');
        if (!trigger || !menu) return false;
        trigger.setAttribute('aria-expanded', String(open));
        menu.classList.toggle('opacity-0', !open);
        menu.classList.toggle('invisible', !open);
        return true;
    }

    /** A click on the avatar toggles; a click anywhere outside the menu closes. */
    handleDocumentClick(event) {
        const target = event.target instanceof Element ? event.target : null;
        if (target?.closest('#userMenuBtn')) {
            this.setMenuOpen(!this.isMenuOpen());
            return;
        }
        if (this.isMenuOpen() && !target?.closest('#userMenu')) this.setMenuOpen(false);
    }

    /** Escape closes and gives the focus back; Arrow Down on the avatar opens on the first item. */
    handleDocumentKeydown(event) {
        const trigger = document.getElementById('userMenuBtn');
        if (!trigger) return;

        if (event.key === 'Escape' && this.isMenuOpen()) {
            this.setMenuOpen(false);
            trigger.focus();
        } else if (event.key === 'ArrowDown' && document.activeElement === trigger) {
            event.preventDefault();
            this.setMenuOpen(true);
            document.querySelector('#userMenu [role="menuitem"]')?.focus();
        }
    }
}
