import { getIcon } from './Icons.js'
import { router } from '../router.js'

export class TopNav {
  constructor() {
    this.isMenuOpen = false
  }

  render() {
    const currentPath = window.location.pathname

    return `
      <nav class="top-nav glass-panel mx-auto max-w-[1200px] mt-4 mb-8 px-3 py-1 flex justify-between items-center sticky top-4 z-50">
        <!-- Logo -->
        <a href="/home" class="nav-logo flex items-center gap-3 group" data-link>
          <div class="logo-icon w-12 h-12 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <img src="/assets/images/logo.png" alt="MJRP" class="w-full h-full object-contain">
          </div>
          <img 
            src="/assets/images/TheAlbumPlaylistSynth.png" 
            alt="The Album Playlist Synthesizer"
            class="h-6 md:h-8 w-auto object-contain hover:opacity-80 transition-opacity"
            loading="lazy"
          >
        </a>

        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center gap-8">
          ${this.renderNavLink('/home', 'Home', currentPath)}
          ${this.renderNavLink('/albums', 'Albums', currentPath)}
          ${this.renderNavLink('/playlists', 'Playlist Series', currentPath)}
          <span class="text-muted cursor-not-allowed" title="Coming Soon">Inventory</span>
        </div>

        <!-- Mobile Menu Button -->
        <button id="mobileMenuBtn" class="md:hidden btn-icon p-2">
          ${getIcon('Menu', 'w-6 h-6')}
        </button>

        <!-- Mobile Menu Overlay -->
        <div id="mobileMenu" class="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center gap-8 transition-opacity duration-300 opacity-0 pointer-events-none">
          <button id="closeMenuBtn" class="absolute top-6 right-6 btn-icon p-2">
            ${getIcon('X', 'w-8 h-8')}
          </button>
          
          ${this.renderNavLink('/home', 'Home', currentPath, true)}
          ${this.renderNavLink('/albums', 'Albums', currentPath, true)}
          ${this.renderNavLink('/playlists', 'Playlist Series', currentPath, true)}
          <span class="text-muted text-2xl font-bold opacity-50">Inventory</span>
        </div>
      </nav>
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
    const links = mobileMenu?.querySelectorAll('a')

    const toggleMenu = (show) => {
      this.isMenuOpen = show
      if (mobileMenu) {
        if (show) {
          mobileMenu.classList.remove('opacity-0', 'pointer-events-none')
          document.body.style.overflow = 'hidden'
        } else {
          mobileMenu.classList.add('opacity-0', 'pointer-events-none')
          document.body.style.overflow = ''
        }
      }
    }

    mobileBtn?.addEventListener('click', () => toggleMenu(true))
    closeBtn?.addEventListener('click', () => toggleMenu(false))

    // Close menu when clicking a link
    links?.forEach(link => {
      link.addEventListener('click', () => toggleMenu(false))
    })
  }
}
