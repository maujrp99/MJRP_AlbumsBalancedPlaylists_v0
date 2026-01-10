/**
 * AuthNav.js
 * 
 * Extracted from TopNav.js
 * Handles User Auth UI and specific listeners.
 */
import { getIcon } from '../Icons.js';
import { authService } from '@shared/services/AuthService.js';
import { showLoginModal } from '../LoginModal.js';
import toast from '../Toast.js';

export class AuthNav {
    constructor(userState) {
        this.userState = userState;
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
                ? `<div class="w-8 h-8 rounded-full bg-gray-800 border border-white/20 flex items-center justify-center">${getIcon('Apple', 'w-5 h-5 text-white')}</div>`
                : `<img src="${currentUser.photoURL || '/assets/images/logo.png'}" class="w-8 h-8 rounded-full border border-white/20" alt="User">`;

            return `
                <div class="relative group" id="userMenuDropdownTrigger">
                    <button class="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-colors">
                        ${avatarContent}
                         <span class="hidden lg:block text-xs font-medium text-white/80 max-w-[80px] truncate">${currentUser.displayName || 'User'}</span>
                    </button>
                    
                    <div class="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div class="p-3 border-b border-white/10">
                            <p class="text-xs text-white/50">Signed in as</p>
                            <p class="text-sm font-bold truncate">${currentUser.displayName || currentUser.email}</p>
                        </div>
                        <button id="logoutBtn" class="w-full text-left px-4 py-3 text-sm hover:bg-white/5 text-red-400 flex items-center gap-2">
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
                        <img src="${currentUser.photoURL || '/assets/images/logo.png'}" class="w-8 h-8 rounded-full">
                        <span class="text-sm font-bold">${currentUser.displayName || 'User'}</span>
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
        const doLogout = async () => {
            try {
                await authService.logout();
                toast.success('Signed out successfully');
            } catch (err) {
                toast.error('Sign out failed');
            }
        };

        loginBtn?.addEventListener('click', openLogin);
        mobileLoginBtn?.addEventListener('click', openLogin);
        logoutBtn?.addEventListener('click', doLogout);
        mobileLogoutBtn?.addEventListener('click', doLogout);
    }
}
