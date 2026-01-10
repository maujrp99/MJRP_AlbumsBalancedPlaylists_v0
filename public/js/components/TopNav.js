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
import { SeriesDropdown } from './navigation/SeriesDropdown.js'
import { AuthNav } from './navigation/AuthNav.js'

export class TopNav {
  constructor() {
    this.isMenuOpen = false
    this.userState = userStore.getState()
    this.migrationUtility = new MigrationUtility(db, new CacheManager())
    this.seriesDropdown = null
    this.authNav = new AuthNav(this.userState)

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
    if (this.authNav) this.authNav.updateState(state)
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
            src="/assets/images/TheAlbumBlender.png" 
            alt="The Album Blender"
            class="block h-8 sm:h-12 md:h-14 w-auto object-contain hover:opacity-80 transition-opacity"
            loading="lazy"
          >
        </a>

        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center gap-6">
          ${this.renderNavLink('/home', 'Home', currentPath)}
          ${this.renderSeriesDropdown(currentPath)}
          ${this.renderNavLink('/blend', 'The Blending Menu', currentPath)}
          ${this.renderNavLink('/saved-playlists', 'Playlists', currentPath)}
          ${this.renderNavLink('/inventory', 'Inventory', currentPath)}
          <!-- Spotify Connect (Phase 1) -->
          <div id="spotify-connect-desktop"></div>
        </div>

        <!-- User Section (Right) -->
        <div class="flex items-center gap-2 ml-4">
             ${this.authNav.renderDesktop()}
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
            
            <!-- Series Expandable Section -->
            <div class="mobile-series-section">
              <button id="mobileSeriesToggle" class="flex items-center justify-between w-full px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 transition-all">
                <div class="flex items-center gap-3">
                  ${getIcon('Music', 'w-5 h-5')}
                  <span class="font-medium">Music Series</span>
                </div>
                ${getIcon('ChevronDown', 'w-4 h-4 transition-transform duration-200')}
              </button>
              <div id="mobileSeriesItems" class="hidden pl-8 space-y-1 mt-1">
                ${this.renderMobileNavLink('/albums', 'By Album', 'Disc', currentPath)}
                ${this.renderMobileNavLink('/artists', 'By Artist', 'User', currentPath)}
                ${this.renderMobileNavLink('/genres', 'By Genre', 'Tag', currentPath)}
                ${this.renderMobileNavLink('/tracks', 'By Track', 'Music', currentPath)}
                <div class="border-t border-white/10 my-1"></div>
                ${this.renderMobileNavLink('/playlist-series', 'Playlists', 'List', currentPath)}
              </div>
            </div>
            
            ${this.renderMobileNavLink('/blend', 'The Blending Menu', 'Sliders', currentPath)}
            ${this.renderMobileNavLink('/saved-playlists', 'Playlists', 'List', currentPath)}
            ${this.renderMobileNavLink('/inventory', 'Inventory', 'Archive', currentPath)}
            <div class="px-4 py-2">
               <div id="spotify-connect-mobile"></div>
            </div>
          </nav>
          
          <!-- Mobile Footer / Auth -->
          <div class="p-4 border-t border-white/10 text-center bg-brand-dark">
             ${this.authNav.renderMobile()}
          </div>
        </div>
      </nav>
    `
  }

  renderMobileAuth() {
    // Moved to AuthNav
  }

  renderMobileNavLink(path, label, iconName, currentPath) {
    const isActive = currentPath === path || (path !== '/' && currentPath.startsWith(path + '/'))
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
    // FIX: Strict prefix matching to avoid "Album Series" (/albums) matching "/" incorrectly?
    // Actually, logic was: path !== '/home' && currentPath.startsWith(path)
    // If path is '/albums', it matches '/albums/series/5'. 
    // If currentPath is '/home', it shouldn't match. 
    // Let's make it stricter: exact match OR path + '/' prefix match
    const isActive = currentPath === path || (path !== '/' && currentPath.startsWith(path + '/'))

    // Fallback for "Home" if it's implicitly active due to root? 
    // If path is '/home' and currentPath is '/', let's assume Redirect handled it?
    // But strictly speaking, highlights should match URL.

    const baseClass = isMobile
      ? 'text-2xl font-bold'
      : 'nav-link-glow text-xs font-semibold uppercase tracking-wide px-2.5 py-1.5 rounded-lg transition-all duration-300 text-center whitespace-nowrap'
    const activeClass = isActive ? 'text-accent-primary bg-white/5' : 'text-muted'

    return `
      <a href="${path}" class="${baseClass} ${activeClass}" data-link>
        ${label}
      </a>
    `
  }

  /**
   * Render Series Dropdown (TopNav v2)
   */
  renderSeriesDropdown(currentPath) {
    // Create dropdown instance for rendering
    const dropdown = new SeriesDropdown({ currentPath })
    return dropdown.render()
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

  async attachListeners() {
    // TopNav v2: Initialize SeriesDropdown
    this.seriesDropdown = new SeriesDropdown({ currentPath: window.location.pathname })
    this.seriesDropdown.attachListeners()

    // Auth Listeners delegate
    this.authNav.attachListeners()

    const mobileBtn = document.getElementById('mobileMenuBtn')
    const closeBtn = document.getElementById('closeMenuBtn')
    const mobileMenu = document.getElementById('mobileMenu')
    const mobileOverlay = document.getElementById('mobileMenuOverlay')
    const links = mobileMenu?.querySelectorAll('a')

    // Auth handlers moved to AuthNav

    // Data Sync handlers
    const dataSyncBtn = document.getElementById('dataSyncBtn')
    const mobileDataSyncBtn = document.getElementById('mobileDataSyncBtn')

    dataSyncBtn?.addEventListener('click', () => this.handleDataSync())
    mobileDataSyncBtn?.addEventListener('click', () => {
      toggleMenu(false)
      this.handleDataSync()
    })

    // Mobile Series Section Toggle
    const mobileSeriesToggle = document.getElementById('mobileSeriesToggle')
    const mobileSeriesItems = document.getElementById('mobileSeriesItems')

    mobileSeriesToggle?.addEventListener('click', () => {
      const isExpanded = !mobileSeriesItems?.classList.contains('hidden')
      if (mobileSeriesItems) {
        mobileSeriesItems.classList.toggle('hidden', isExpanded)
      }
      // Rotate chevron
      const chevron = mobileSeriesToggle.querySelector('svg:last-of-type')
      if (chevron) {
        chevron.classList.toggle('rotate-180', !isExpanded)
      }
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

    // Initialize Spotify Connect Button
    try {
      const { SpotifyConnectButton } = await import('./SpotifyConnectButton.js')

      if (document.getElementById('spotify-connect-desktop')) {
        new SpotifyConnectButton('spotify-connect-desktop')
      }

      if (document.getElementById('spotify-connect-mobile')) {
        new SpotifyConnectButton('spotify-connect-mobile')
      }
    } catch (err) {
      console.error('[TopNav] Error initializing Spotify Button:', err)
    }
  }
}

