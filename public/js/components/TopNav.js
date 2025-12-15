import { getIcon } from './Icons.js'
import { router } from '../router.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { userStore } from '../stores/UserStore.js'
import { authService } from '@shared/services/AuthService.js'
import { showLoginModal } from './LoginModal.js'
import toast from './Toast.js'
import { db } from '../app.js'
import { CacheManager } from '../cache/CacheManager.js'
import { MigrationUtility } from '../migration/MigrationUtility.js'

export class TopNav {
  constructor() {
    this.isMenuOpen = false
    this.userState = userStore.getState()
    this.migrationUtility = new MigrationUtility(db, new CacheManager())

    // Subscribe to auth changes
    userStore.subscribe(this.handleAuthChange.bind(this))
  }

  /**
   * Check if migration is needed
   */
  needsMigration() {
    return !this.migrationUtility.isMigrationComplete() && this.migrationUtility.hasLocalStorageData()
  }

  handleAuthChange(state) {
    this.userState = state
    // Re-render only if mounted
    const container = document.getElementById('header-container')
    if (container) {
      container.innerHTML = this.render()
      this.attachListeners()
    }
  }

  /**
   * Get the albums link with active series ID if available
   */
  getAlbumsSeriesLink() {
    // FIX: Default to "All Series" view when clicking Albums nav
    // This ensures consistent navigation behavior (User Defect Fix)
    return '/albums'
  }

  render() {
    const currentPath = window.location.pathname
    const albumsSeriesLink = this.getAlbumsSeriesLink()

    return `
      <nav class="top-nav glass-panel mx-auto max-w-[1200px] mt-4 mb-8 px-3 py-1 flex justify-between items-center sticky top-4 z-50">
        <!-- Mobile Menu Button (LEFT) -->
        <button id="mobileMenuBtn" class="md:hidden btn-icon p-2 mr-2">
          ${getIcon('Menu', 'w-6 h-6')}
        </button>

        <!-- Logo -->
        <a href="/home" class="nav-logo flex items-center gap-3 group flex-1 md:flex-none" data-link>
          <div class="logo-icon w-12 h-12 md:w-16 md:h-16 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0">
            <img src="/assets/images/logo.png" alt="MJRP Logo" class="w-full h-full object-contain">
          </div>
          <img 
            src="/assets/images/TheAlbumPlaylistSynth.png" 
            alt="The Album Blender"
            class="block h-6 sm:h-10 md:h-12 w-auto object-contain hover:opacity-80 transition-opacity"
            loading="lazy"
          >
        </a>

        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center gap-6">
          ${this.renderNavLink('/home', 'Home', currentPath)}
          ${this.renderNavLink(albumsSeriesLink, 'Albums', currentPath)}
          ${this.renderNavLink('/album-series', 'Series', currentPath)}
          ${this.renderNavLink('/playlist-series', 'Playlists', currentPath)}
          ${this.renderNavLink('/inventory', 'Inventory', currentPath)}
          ${this.renderNavLink('/save-all', 'Save All', currentPath)}
        </div>

        <!-- User Section (Right) -->
        <div class="flex items-center gap-2 ml-4">
             ${this.renderUserSection()}
        </div>

        <!-- Mobile Menu Overlay (Background) -->
        <div id="mobileMenuOverlay" class="fixed inset-0 z-40 bg-black/50 opacity-0 pointer-events-none transition-opacity duration-300 md:hidden"></div>
        
        <!-- Mobile Menu Drawer (Left Side) -->
        <div 
          id="mobileMenu" 
          class="mobile-drawer fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] max-w-[80vw] transition-transform duration-300 transform -translate-x-full border-r border-orange-500/20 bg-brand-dark md:hidden"
          style="box-shadow: 4px 0 40px rgba(0,0,0,0.9);"
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-5 border-b border-white/10 bg-brand-dark">
            <div class="flex items-center gap-3">
              <img src="/assets/images/logo.png" alt="MJRP" class="w-10 h-10">
              <span class="text-sm font-bold text-white/80">Menu</span>
            </div>
            <button id="closeMenuBtn" class="btn-icon p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              ${getIcon('X', 'w-5 h-5 text-white/70')}
            </button>
          </div>
          
          <!-- Navigation Links -->
          <nav class="flex flex-col p-4 gap-1 flex-1 bg-brand-dark">
            ${this.renderMobileNavLink('/home', 'Home', 'Rocket', currentPath)}
            ${this.renderMobileNavLink(albumsSeriesLink, 'Albums', 'Music', currentPath)}
            ${this.renderMobileNavLink('/album-series', 'Series', 'Layers', currentPath)}
            ${this.renderMobileNavLink('/playlist-series', 'Playlists', 'List', currentPath)}
            ${this.renderMobileNavLink('/inventory', 'Inventory', 'Archive', currentPath)}
            ${this.renderMobileNavLink('/save-all', 'Save All', 'Database', currentPath)}
          </nav>
          
          <!-- Mobile Footer / Auth -->
          <div class="p-4 border-t border-white/10 text-center bg-brand-dark">
             ${this.renderMobileAuth()}
          </div>
        </div>
      </nav>
    `
  }

  renderUserSection() {
    const { currentUser, loading } = this.userState

    if (loading) {
      return `<div class="w-8 h-8 rounded-full bg-white/10 animate-pulse"></div>`
    }

    if (currentUser && !currentUser.isAnonymous) {
      // Check if user logged in via Apple
      const isAppleProvider = currentUser.providerData?.some(p => p.providerId === 'apple.com')

      // Use Apple icon for Apple login, otherwise photo or MJRP logo
      const avatarContent = isAppleProvider
        ? `<div class="w-8 h-8 rounded-full bg-gray-800 border border-white/20 flex items-center justify-center">${getIcon('Apple', 'w-5 h-5 text-white')}</div>`
        : `<img src="${currentUser.photoURL || '/assets/images/logo.png'}" class="w-8 h-8 rounded-full border border-white/20" alt="User">`

      return `
            <div class="relative group" id="userMenuDropdownTrigger">
                <button class="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-colors">
                    ${avatarContent}
                     <span class="hidden lg:block text-sm font-medium text-white/80 max-w-[100px] truncate">${currentUser.displayName || 'User'}</span>
                </button>
                
                <!-- Dropdown -->
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
        `
    } else {
      // Guest or Anonymous
      return `
            <button id="loginBtn" class="btn btn-sm btn-primary">
                Sign In
            </button>
        `
    }
  }

  renderMobileAuth() {
    const { currentUser } = this.userState
    if (currentUser && !currentUser.isAnonymous) {
      return `
            <div class="flex flex-col gap-3">
                <div class="flex items-center gap-3 justify-center mb-2">
                    <img src="${currentUser.photoURL || '/assets/images/logo.png'}" class="w-8 h-8 rounded-full">
                    <span class="text-sm font-bold">${currentUser.displayName || 'User'}</span>
                </div>
                 <button id="mobileLogoutBtn" class="btn btn-sm btn-secondary w-full">Sign Out</button>
            </div>
        `
    }
    return `<button id="mobileLoginBtn" class="btn btn-sm btn-primary w-full">Sign In to Sync</button>`
  }

  renderMobileNavLink(path, label, iconName, currentPath) {
    const isActive = currentPath === path || (path !== '/home' && currentPath.startsWith(path))
    return `
      <a 
        href="${path}" 
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-accent-primary/20 text-accent-primary' : 'text-white/70 hover:bg-white/5 hover:text-white'}" 
        data-link
      >
        ${getIcon(iconName, 'w-5 h-5')}
        <span class="font-medium">${label}</span>
      </a>
    `
  }

  renderNavLink(path, label, currentPath, isMobile = false) {
    const isActive = currentPath === path || (path !== '/home' && currentPath.startsWith(path))
    const baseClass = isMobile
      ? 'text-2xl font-bold'
      : 'text-sm font-medium uppercase tracking-wider px-3 py-1.5 rounded-lg hover:backdrop-blur-md hover:bg-white/10 hover:text-accent-primary transition-all duration-200'
    const activeClass = isActive ? 'text-accent-primary bg-white/5' : 'text-muted'

    return `
      <a href="${path}" class="${baseClass} ${activeClass}" data-link>
        ${label}
      </a>
    `
  }

  /**
   * Render Data Sync link for desktop nav
   */
  renderDataSyncLink() {
    return `
      <button id="dataSyncBtn" class="flex items-center gap-2 text-sm font-medium uppercase tracking-wider px-3 py-1.5 rounded-lg hover:backdrop-blur-md hover:bg-orange-500/10 text-orange-400 transition-all duration-200 border border-orange-500/30">
        ${getIcon('Database', 'w-4 h-4')}
        Data Sync
      </button>
    `
  }

  async handleDataSync() {
    try {
      toast.info('Starting data migration...')
      await this.migrationUtility.migrate()
      toast.success('Data migration complete!')
      // Re-render to hide Data Sync button
      const container = document.getElementById('header-container')
      if (container) {
        container.innerHTML = this.render()
        this.attachListeners()
      }
    } catch (err) {
      console.error('Migration failed:', err)
      toast.error('Migration failed: ' + err.message)
    }
  }

  attachListeners() {
    const mobileBtn = document.getElementById('mobileMenuBtn')
    const closeBtn = document.getElementById('closeMenuBtn')
    const mobileMenu = document.getElementById('mobileMenu')
    const mobileOverlay = document.getElementById('mobileMenuOverlay')
    const links = mobileMenu?.querySelectorAll('a')

    // Auth Listeners
    const loginBtn = document.getElementById('loginBtn')
    const logoutBtn = document.getElementById('logoutBtn')
    const mobileLoginBtn = document.getElementById('mobileLoginBtn')
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn')

    const openLogin = () => showLoginModal()
    const doLogout = async () => {
      try {
        await authService.logout()
        toast.success('Signed out successfully')
      } catch (err) {
        toast.error('Sign out failed')
      }
    }

    loginBtn?.addEventListener('click', openLogin)
    mobileLoginBtn?.addEventListener('click', openLogin)

    logoutBtn?.addEventListener('click', doLogout)
    mobileLogoutBtn?.addEventListener('click', doLogout)

    // Data Sync handlers
    const dataSyncBtn = document.getElementById('dataSyncBtn')
    const mobileDataSyncBtn = document.getElementById('mobileDataSyncBtn')

    dataSyncBtn?.addEventListener('click', () => this.handleDataSync())
    mobileDataSyncBtn?.addEventListener('click', () => {
      toggleMenu(false)
      this.handleDataSync()
    })

    const toggleMenu = (show) => {
      this.isMenuOpen = show
      if (mobileMenu && mobileOverlay) {
        if (show) {
          mobileMenu.classList.remove('-translate-x-full')
          mobileOverlay.classList.remove('opacity-0', 'pointer-events-none')
          document.body.style.overflow = 'hidden'
        } else {
          mobileMenu.classList.add('-translate-x-full')
          mobileOverlay.classList.add('opacity-0', 'pointer-events-none')
          document.body.style.overflow = ''
        }
      }
    }

    mobileBtn?.addEventListener('click', () => toggleMenu(true))
    closeBtn?.addEventListener('click', () => toggleMenu(false))
    mobileOverlay?.addEventListener('click', () => toggleMenu(false))

    // Close menu when clicking a link
    links?.forEach(link => {
      link.addEventListener('click', (e) => {
        toggleMenu(false)
      }, true)
    })

    // Fallback: Close menu on any navigation
    window.addEventListener('popstate', () => toggleMenu(false))

    // Fix: Auto-close menu on resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768 && this.isMenuOpen) {
        toggleMenu(false)
      }
    })
  }
}

