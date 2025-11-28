import { getIcon } from './Icons.js'

export class Footer {
    render() {
        const year = new Date().getFullYear()
        const lastUpdate = new Date().toLocaleString()

        return `
      <footer class="site-footer container mx-auto px-6 py-12 mt-auto border-t border-white/5">
        <div class="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <!-- Sitemap -->
          <div class="footer-links flex gap-6 text-sm text-muted items-center">
            <a href="/home" class="hover:text-white transition-colors" data-link>Home</a>
            <a href="/albums" class="hover:text-white transition-colors" data-link>Albums</a>
            <a href="/playlists" class="hover:text-white transition-colors" data-link>Playlists</a>
            <div class="flex items-center gap-3">
                <button id="footerClearCache" class="hover:text-red-400 transition-colors text-left">Clear Cache</button>
                <span id="cacheClearedMsg" class="text-red-500 font-bold hidden animate-pulse">Cache Cleared!</span>
            </div>
          </div>

          <!-- Branding -->
          <div class="footer-brand flex flex-col items-center md:items-end gap-2">
            <div class="powered-by flex items-center gap-2 text-sm text-muted">
              <span>Powered by</span>
              <div class="w-8 h-8 flex items-center justify-center">
                <img src="/assets/images/logo.png" alt="MJRP" class="w-full h-full object-contain">
              </div>
              <span class="font-bold text-white">MJRP Software</span>
            </div>
            <div class="last-update text-xs text-white/30">
              Last updated: ${lastUpdate}
            </div>
          </div>
          
        </div>
      </footer>
    `
    }

    attachListeners() {
        const clearCacheBtn = document.getElementById('footerClearCache')
        const msg = document.getElementById('cacheClearedMsg')

        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                localStorage.clear()

                if (msg) {
                    msg.classList.remove('hidden')
                }

                setTimeout(() => {
                    location.reload()
                }, 1000)
            })
        }
    }
}
