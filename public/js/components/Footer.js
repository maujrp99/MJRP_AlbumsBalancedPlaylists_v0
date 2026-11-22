const CLEARED_TEXT = 'Cache Cleared!'
const FAILED_TEXT = 'Could not clear the cache'

/**
 * What the app has to say while it shows data of Discogs (F75, REQ-06; Discogs API Terms of Use):
 * that it uses the API and is not affiliated. It is in the footer of every screen, hidden until
 * the server says the Discogs values are on, and hidden again when they are turned off.
 */
export const DISCOGS_NOTICE_ID = 'discogsApiNotice'
export const DISCOGS_NOTICE = "This application uses Discogs' API but is not affiliated with, sponsored or endorsed by Discogs. 'Discogs' is a trademark of Zink Media, LLC."

/** Show or hide the sentence about the Discogs API. With no footer on the page, it does nothing. */
export function showDiscogsNotice(on, doc = document) {
    const notice = doc.getElementById(DISCOGS_NOTICE_ID)
    if (notice) notice.hidden = !on
}

export class Footer {
    /**
     * @param {Object} deps
     * @param {Function} deps.clearCaches - () => Promise: forgets what the browser keeps about albums
     * @param {Function} [deps.reload] - reloads the page, so the albums in memory go too
     * @param {number} [deps.reloadDelayMs] - how long the "cleared" notice stays before the reload
     */
    constructor({ clearCaches, reload = () => location.reload(), reloadDelayMs = 1000 } = {}) {
        this.clearCaches = clearCaches
        this.reload = reload
        this.reloadDelayMs = reloadDelayMs
    }

    render() {
        const lastUpdate = new Date().toLocaleString()

        return `
      <footer class="site-footer container mx-auto px-6 py-12 mt-auto border-t border-white/5">
        <div class="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <!-- Sitemap -->
          <div class="footer-links flex gap-6 text-sm text-muted items-center">
            <a href="/start" class="hover:text-white transition-colors" data-link>Create</a>
            <a href="/albums" class="hover:text-white transition-colors" data-link>Albums</a>
            <a href="/playlists" class="hover:text-white transition-colors" data-link>Playlists</a>
            <div class="flex items-center gap-3">
                <button id="footerClearCache" class="hover:text-red-400 transition-colors text-left">Clear Cache</button>
                <span id="cacheClearedMsg" class="text-red-500 font-bold hidden animate-pulse" role="status">${CLEARED_TEXT}</span>
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
        <p id="${DISCOGS_NOTICE_ID}" class="text-xs text-muted text-center mt-6" hidden>${DISCOGS_NOTICE}</p>
      </footer>
    `
    }

    attachListeners() {
        const clearCacheBtn = document.getElementById('footerClearCache')
        const msg = document.getElementById('cacheClearedMsg')

        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', async () => {
                clearCacheBtn.disabled = true
                const say = (text) => {
                    if (!msg) return
                    msg.textContent = text
                    msg.classList.remove('hidden')
                }

                try {
                    // Only the album caches: localStorage as a whole stays (Spotify login, screen choices)
                    await this.clearCaches()
                } catch (error) {
                    console.error('[Footer] Clear Cache failed:', error)
                    say(FAILED_TEXT)
                    clearCacheBtn.disabled = false
                    return
                }

                say(CLEARED_TEXT)
                setTimeout(() => this.reload(), this.reloadDelayMs)
            })
        }
    }
}
