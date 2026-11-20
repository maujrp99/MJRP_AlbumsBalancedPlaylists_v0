
import { SpotifyAuthService } from '../services/SpotifyAuthService.js'
import { getIcon } from './Icons.js'
import { escapeHtml } from '../utils/stringUtils.js'
import toast from './Toast.js'
import { dialogService } from '../services/DialogService.js'
import { NAME_IN_THE_BAR } from './navigation/barName.js'

/**
 * SpotifyConnectButton Component
 * Renders a button that handles Spotify Login/Logout
 */
export class SpotifyConnectButton {
    constructor(containerId) {
        this.container = document.getElementById(containerId)
        this.userProfile = null
        this.isConnected = SpotifyAuthService.isAuthenticated()

        // Verify connection on init if token exists (to get username)
        if (this.isConnected) {
            this.fetchProfile()
        }

        // Listen for auth changes
        window.addEventListener('spotify-auth-change', () => {
            this.isConnected = SpotifyAuthService.isAuthenticated()
            if (!this.isConnected) this.userProfile = null
            this.render()
            if (this.isConnected && !this.userProfile) this.fetchProfile()
        })

        // Initial Render
        this.render()
    }

    async fetchProfile() {
        // One request at a time: a token refresh in the middle announces the session again.
        if (this._fetchingProfile) return
        this._fetchingProfile = true
        try {
            this.userProfile = await SpotifyAuthService.getUserProfile()
        } finally {
            this._fetchingProfile = false
        }
        this.render()
    }

    render() {
        if (!this.container) return

        if (this.isConnected) {
            this.renderConnected()
        } else {
            this.renderDisconnected()
        }

        this.attachListeners()
    }

    renderConnected() {
        const userName = this.userProfile ? this.userProfile.display_name : 'Spotify'

        this.container.innerHTML = `
      <div class="flex items-center gap-2 min-w-0 overflow-hidden bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-full pl-1 pr-3 py-1 transition-all group hover:bg-[#1DB954]/20" title="Spotify connected: ${escapeHtml(userName)}">
        <div class="w-6 h-6 shrink-0 rounded-full bg-[#1DB954] flex items-center justify-center text-black shadow-lg shadow-[#1DB954]/20">
           ${getIcon('SpotifyConfig', 'w-4 h-4')}
        </div>
        <div class="hidden xl:flex flex-col leading-none min-w-0">
           <span class="text-[10px] uppercase tracking-wider text-[#1DB954]/70 font-bold">Connected</span>
           <span class="text-xs font-bold text-[#1DB954] ${NAME_IN_THE_BAR}" data-spotify-name title="${escapeHtml(userName)}">${escapeHtml(userName)}</span>
        </div>
        <button id="spotifyLogoutBtn" class="ml-1 shrink-0 text-xs text-[#1DB954]/50 hover:text-white transition-colors" title="Disconnect">
          ${getIcon('X', 'w-3 h-3')}
        </button>
      </div>
    `
    }

    renderDisconnected() {
        // Elegant, small, standard Spotify pill
        this.container.innerHTML = `
      <button id="spotifyLoginBtn" class="flex items-center gap-2 bg-black hover:bg-[#1ed760] hover:text-black border border-[#1DB954] text-[#1DB954] px-3 py-1.5 rounded-full transition-all duration-300 transform hover:scale-105 group">
        ${getIcon('SpotifyConfig', 'w-4 h-4 fill-current')}
        <span class="text-xs font-bold tracking-wide">Connect</span>
      </button>
    `
    }

    attachListeners() {
        const loginBtn = this.container.querySelector('#spotifyLoginBtn')
        const logoutBtn = this.container.querySelector('#spotifyLogoutBtn')

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                SpotifyAuthService.login()
            })
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault()
                // The app's own dialog: the browser's native confirm() can be silenced, and then
                // the click did nothing (UAT-183).
                const confirmed = await dialogService.confirm({
                    title: 'Disconnect from Spotify?',
                    message: 'You can connect again at any time.',
                    confirmText: 'Disconnect'
                })
                if (confirmed) {
                    SpotifyAuthService.logout()
                    toast.info('Disconnected from Spotify')
                }
            })
        }
    }
}
