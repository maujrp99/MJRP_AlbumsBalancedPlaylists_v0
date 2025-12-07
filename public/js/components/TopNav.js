import { getIcon } from './Icons.js'
import { router } from '../router.js'
import { albumSeriesStore } from '../stores/albumSeries.js'

export class TopNav {
  constructor() {
    this.isMenuOpen = false
  }

  /**
   * Get the albums link with active series ID if available
   */
  getAlbumsSeriesLink() {
    const activeSeries = albumSeriesStore.getActiveSeries()
    if (activeSeries?.id) {
      return `/albums?seriesId=${activeSeries.id}`
    }
    // Fallback: use last series if available
    const series = albumSeriesStore.getSeries()
    if (series.length > 0) {
      return `/albums?seriesId=${series[0].id}`
    }
    return '/album-series' // Fallback to series list if no series exists
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
          <div class="logo-icon w-12 h-12 md:w-16 md:h-16 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <img src="/assets/images/logo.png" alt="MJRP Logo" class="w-full h-full object-contain">
          </div>
          <span class="hidden sm:inline font-syne font-bold text-lg md:text-xl tracking-tight">The Album Playlist Synthesizer</span>
        </a>

        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center gap-8">
          ${this.renderNavLink('/home', 'Home', currentPath)}
          ${this.renderNavLink(albumsSeriesLink, 'Albums', currentPath)}
          ${this.renderNavLink('/album-series', 'Album Series', currentPath)}
          ${this.renderNavLink('/playlist-series', 'Playlist Series', currentPath)}
          ${this.renderNavLink('/inventory', 'Inventory', currentPath)}
        </div>


        <!-- Mobile Menu Overlay (Background) -->
        <div id="mobileMenuOverlay" class="fixed inset-0 z-40 bg-black/50 opacity-0 pointer-events-none transition-opacity duration-300"></div>
        
        <!-- Mobile Menu Drawer (Left Side) -->
        <div 
          id="mobileMenu" 
          class="fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] max-w-[80vw] transition-transform duration-300 transform -translate-x-full"
          style="background: #0d0d12; border-right: 1px solid rgba(255, 136, 0, 0.2); box-shadow: 4px 0 40px rgba(0,0,0,0.8);"
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-5 border-b border-white/10">
            <div class="flex items-center gap-3">
              <img src="/assets/images/logo.png" alt="MJRP" class="w-10 h-10">
              <span class="text-sm font-bold text-white/80">Menu</span>
            </div>
            <button id="closeMenuBtn" class="btn-icon p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              ${getIcon('X', 'w-5 h-5 text-white/70')}
            </button>
          </div>
          
          <!-- Navigation Links -->
          <nav class="flex flex-col p-4 gap-1 flex-1">
            ${this.renderMobileNavLink('/home', 'Home', 'Rocket', currentPath)}
            ${this.renderMobileNavLink(albumsSeriesLink, 'Albums', 'Music', currentPath)}
            ${this.renderMobileNavLink('/album-series', 'Album Series', 'Layers', currentPath)}
            ${this.renderMobileNavLink('/playlist-series', 'Playlist Series', 'List', currentPath)}
            ${this.renderMobileNavLink('/inventory', 'Inventory', 'Archive', currentPath)}
          </nav>
          
          <!-- Footer -->
          <div class="p-4 border-t border-white/10 text-center">
            <p class="text-xs text-gray-500">MJRP Playlist Synthesizer</p>
          </div>
        </div>
      </nav>
    `
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
    const baseClass = isMobile ? 'text-2xl font-bold' : 'text-sm font-medium uppercase tracking-wider hover:text-accent-primary transition-colors'
    const activeClass = isActive ? 'text-accent-primary' : 'text-muted'

    return `
      <a href="${path}" class="${baseClass} ${activeClass}" data-link>
        ${label}
      </a>
    `
  }

  attachListeners() {
    const mobileBtn = document.getElementById('mobileMenuBtn')
    const closeBtn = document.getElementById('closeMenuBtn')
    const mobileMenu = document.getElementById('mobileMenu')
    const mobileOverlay = document.getElementById('mobileMenuOverlay')
    const links = mobileMenu?.querySelectorAll('a')

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
      link.addEventListener('click', () => toggleMenu(false))
    })
  }
}
