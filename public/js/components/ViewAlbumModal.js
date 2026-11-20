/**
 * ViewAlbumModal Component
 * Shows album details including tracks, format, condition, notes
 * MODERNIZED: Uses TracksRankingComparison to match Expanded View UX
 * REFACTORED: SafeDOM implementation (Sprint 15 Phase 4.3)
 */

import { getIcon } from './Icons.js'
import { TracksRankingComparison } from './ranking/TracksRankingComparison.js'
import { Album } from '../models/Album.js'
import { SafeDOM } from '../utils/SafeDOM.js'
import { coverImage } from './ui/coverImage.js'
import { InventoryStatus, statusLabel, statusOf } from '../models/inventoryStatus.js'
import { roundToCents } from '../models/inventoryValue.js'
import { createBuyLinksSection, createPhoneBuyLinks, createValueSection, phoneValueFold } from './InventoryValueSection.js'
import { isPhone } from '../utils/isPhone.js'

/** The colour of the status badge of an inventory item. */
const STATUS_BADGE = Object.freeze({
  [InventoryStatus.OWNED]: 'badge badge-success',
  [InventoryStatus.NOT_OWNED]: 'badge badge-neutral',
  [InventoryStatus.WISHLIST]: 'badge badge-neutral'
})

/** What the window says in the place of the tracks, when it has none to show. */
export const TRACKS_TEXT = Object.freeze({
  loading: 'Loading the tracks of this album…',
  notLoaded: 'The tracks of this album could not be loaded. Close this window and open it again to try once more.',
  none: 'No tracks are kept for this album.'
})

const asAlbum = (data) => (data instanceof Album ? data : new Album(data))
const hasTracks = (album) => album.getTracks('original').length > 0 || album.getTracks('acclaim').length > 0

/**
 * @param {Object} albumInput - a loaded album, or an inventory item (it holds its album in
 *   `albumData`, and its own status, format, price and notes)
 * @param {Object} [options]
 * @param {Function} [options.loadAlbum] - (signal) => Promise<Album|null>: the album as the album
 *   load has it now. The inventory gives it (F71, UAT-220): an item keeps no tracks, or the ones of
 *   the day it was added, so the window shows what it has, asks, and shows the album that comes.
 *   The ask is dropped when the window closes.
 * @param {Object} [options.value] - the host of the «Estimated value» section (F75): { view, onWrite,
 *   onForget, onRead } (components/InventoryValueSection.js). The inventory gives it; with it the
 *   window also shows «Where to buy». The window returned has `redrawValue()` to draw it again.
 */
export async function showViewAlbumModal(albumInput, { loadAlbum = null, value } = {}) {
  // Hydrate Album Model if needed
  const item = albumInput.albumData ? albumInput : null
  const rawData = albumInput.albumData || albumInput
  const album = asAlbum(rawData)
  // What the person wrote about the album is the item's; a loaded album has none of it
  const kept = item || {}

  // -- 1. Header Section --
  const coverEl = createCoverElement(album)
  const detailsEl = createDetailsElement(album, item)
  const closeBtn = createCloseButton()

  const headerEl = SafeDOM.div({
    className: 'modal-header p-6 border-b border-surface-light flex items-start gap-6 bg-surface-darker/50 backdrop-blur-md'
  }, [coverEl, detailsEl, closeBtn])

  // -- 2. Notes Section --
  let notesEl = null
  if (kept.notes) {
    notesEl = SafeDOM.div({
      className: 'px-6 py-4 bg-yellow-500/5 border-b border-white/5'
    }, [
      SafeDOM.h3({
        className: 'text-xs font-bold text-yellow-500/80 uppercase tracking-widest mb-1 flex items-center gap-2'
      }, [
        SafeDOM.fromHTML(getIcon('FileText', 'w-3 h-3')),
        SafeDOM.text(' Notes')
      ]),
      SafeDOM.p({
        className: 'text-sm text-yellow-100/80 italic leading-relaxed'
      }, `"${kept.notes}"`)
    ])
  }

  // -- 3. Content Section (Ranking) --
  const rankingContainer = SafeDOM.div({ id: 'modal-ranking-container' })
  // The value of the item and where to buy it come before the tracks (F75); only for an inventory item
  const { valueSection, aboveTheTracks } = sectionsOfAnItem(item, value)
  const contentEl = SafeDOM.div({
    className: 'modal-content flex-1 overflow-hidden bg-surface-dark/30 relative'
  }, [
    SafeDOM.div({
      className: 'absolute inset-0 overflow-y-auto custom-scrollbar p-6'
    }, [...aboveTheTracks, rankingContainer])
  ])

  // -- 4. Footer Section --
  const footerCloseBtn = SafeDOM.button({
    className: 'btn btn-secondary px-6',
    textContent: 'Close',
    onClick: handleClose
  })
  const footerEl = SafeDOM.div({
    className: 'modal-footer p-4 border-t border-surface-light bg-surface-darker flex justify-end gap-3'
  }, footerCloseBtn)

  // -- 5. Main Modal Assembly --
  const containerEl = SafeDOM.div({
    className: 'modal-container glass-panel max-w-5xl w-full mx-4 max-h-[95vh] min-h-[75vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in-up'
  }, [
    headerEl,
    notesEl, // can be null, SafeDOM usually handles arrays, but create handles singular node.
    // SafeDOM.div children must be array? SafeDOM.js: "const kids = Array.isArray(children) ? children : [children]"
    // If notesEl is null, [headerEl, null, contentEl] might break if SafeDOM doesn't filter.
    // Let's rely on SafeDOM.div([ ... ]) filtering or construct array cleanly.
    contentEl,
    footerEl
  ])

  // Handle null notesEl
  if (notesEl) {
    SafeDOM.clear(containerEl) // Wait, SafeDOM doesn't have insertAfter. Re-assemble:
    // Better way:
    // containerEl children were props.
  }
  // Let's reconstruct the children array explicitly to be safe
  SafeDOM.clear(containerEl)
  // The phone (F76, REQ-06): a bar that stays on top with close, and the cover behind the header
  const closing = new AbortController()
  const phone = phonePartsOf({ album, headerEl, scroller: containerEl, title: detailsEl.firstChild, onClose: handleClose, closed: closing.signal })
  const children = [phone.bar, headerEl].filter(Boolean)
  if (notesEl) children.push(notesEl)
  children.push(contentEl, footerEl)
  children.forEach(c => containerEl.appendChild(c))


  const modalOverlay = SafeDOM.div({
    className: 'modal-overlay album-window', // album-window: the whole screen on the phone (F76, css/mobile.css)
    onClick: (e) => {
      if (e.target === modalOverlay) handleClose()
    }
  }, containerEl)

  // -- 6. Logic & Mounting --

  function handleClose() {
    closing.abort()
    containerEl.classList.add('animate-fade-out-down')
    modalOverlay.classList.remove('animate-fade-in') // Optional: fade out overlay too
    modalOverlay.style.opacity = '0'
    modalOverlay.style.transition = 'opacity 0.2s'

    setTimeout(() => {
      if (modalOverlay.parentNode) modalOverlay.remove()
    }, 200)
    document.removeEventListener('keydown', handleEscape)
  }

  function handleEscape(e) {
    if (e.key === 'Escape') handleClose()
  }

  // Mount logic
  modalOverlay.redrawValue = redrawOf(valueSection, closing.signal)
  document.body.appendChild(modalOverlay)
  document.addEventListener('keydown', handleEscape)

  // Close Button Action
  closeBtn.addEventListener('click', handleClose)

  /** The comparison of the tracks of an album, or one line when there is nothing to compare. */
  const showTracks = (shown, emptyText) => {
    SafeDOM.clear(rankingContainer)
    if (!hasTracks(shown)) {
      rankingContainer.appendChild(SafeDOM.p({ className: 'text-gray-400 text-center py-12', dataset: { role: 'no-tracks' } }, emptyText))
      return
    }
    // A host of its own: a comparison that was replaced still draws, later, into the host it knew
    const host = SafeDOM.div({})
    rankingContainer.appendChild(host)
    const comparison = new TracksRankingComparison({ album: shown })
    comparison.mount(host)
    comparison.updateUI()
  }

  if (!loadAlbum) {
    showTracks(album, TRACKS_TEXT.none)
    return modalOverlay
  }

  // What the item keeps is shown at once; the album of now takes its place when it comes
  showTracks(album, TRACKS_TEXT.loading)
  loadAlbum(closing.signal)
    .then(given => {
      if (closing.signal.aborted) return
      const loaded = given ? asAlbum(given) : null
      // An item with no cover of its own shows the cover of the album that came (UAT-222)
      if (loaded?.coverUrl && !album.coverUrl) {
        coverEl.replaceWith(createCoverElement(loaded))
        phone.setCover(loaded.coverUrl)
      }
      if (loaded && hasTracks(loaded)) showTracks(loaded, TRACKS_TEXT.none)
      else if (!hasTracks(album)) showTracks(album, TRACKS_TEXT.notLoaded)
    })
    .catch(error => {
      console.error('[ViewAlbumModal] The album could not be loaded:', error)
      if (!closing.signal.aborted && !hasTracks(album)) showTracks(album, TRACKS_TEXT.notLoaded)
    })

  return modalOverlay
}

// --- Helpers ---

/**
 * What the album window has only on the phone (F76): the bar, the blurred cover, the title that
 * comes to the bar. On the computer: nothing (`bar` is null, `setCover` does nothing).
 */
function phonePartsOf({ album, headerEl, scroller, title, onClose, closed }) {
  if (!isPhone()) return { bar: null, setCover: () => { } }
  setGlow(headerEl, album.coverUrl)
  watchTheTitle(scroller, title, closed)
  return { bar: createPhoneBar(album, onClose), setCover: (url) => setGlow(headerEl, url) }
}

/**
 * The bar of the album window on the phone (F76): close, always in view, and the title of the
 * album, which shows once the header has scrolled away. `md:hidden`: never on the computer.
 */
function createPhoneBar(album, onClose) {
  const close = SafeDOM.button({ className: 'album-window__close', 'aria-label': 'Close', onClick: onClose })
  close.appendChild(SafeDOM.fromHTML(getIcon('X', 'w-6 h-6')))
  return SafeDOM.div({ className: 'album-window__bar md:hidden' }, [
    SafeDOM.span({ className: 'album-window__bar-title', 'aria-hidden': 'true' }, album.title),
    close
  ])
}

/** The cover, blurred, behind the header of the album window on the phone; none without a cover. */
function setGlow(headerEl, coverUrl) {
  headerEl.querySelector('.album-window__glow')?.remove()
  if (!coverUrl) return
  const glow = SafeDOM.div({ className: 'album-window__glow md:hidden', 'aria-hidden': 'true' },
    SafeDOM.img({ src: coverUrl, alt: '', loading: 'lazy', decoding: 'async' }))
  headerEl.appendChild(glow)
}

/** The bar shows the title of the album while the title of the header is out of view. */
function watchTheTitle(scroller, title, closed) {
  if (typeof IntersectionObserver !== 'function' || !title) return
  const observer = new IntersectionObserver(([entry]) => {
    scroller.parentElement?.classList.toggle('album-window--scrolled', !entry.isIntersecting)
  }, { root: scroller, rootMargin: '-56px 0px 0px 0px' })
  observer.observe(title)
  closed.addEventListener('abort', () => observer.disconnect(), { once: true })
}

/** The sections an inventory item shows above its tracks (F75): its value, and where to buy it. */
function sectionsOfAnItem(item, value) {
  if (!item || !value) return { valueSection: null, aboveTheTracks: [] }
  if (!isPhone()) {
    const valueSection = createValueSection(value)
    return { valueSection, aboveTheTracks: [valueSection, createBuyLinksSection(item)] }
  }
  // The phone (F76, recheck N7): both folded to one line each, so the tracks start on the first screen
  let fold = null
  const valueSection = createValueSection({ ...value, onDrawn: () => fold?.drawLine() })
  fold = phoneValueFold(valueSection, value.view)
  return { valueSection, aboveTheTracks: [fold, createPhoneBuyLinks(item)] }
}

/** Draws the value section again, while the window is open and has one. */
const redrawOf = (valueSection, closed) => () => {
  if (valueSection && !closed.aborted) valueSection.draw()
}

function createCoverElement(album) {
  const wrapper = SafeDOM.div({
    className: 'w-24 h-24 md:w-32 md:h-32 bg-surface-dark rounded-xl shadow-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative group'
  })

  // With no address, or one that fails to load, the stand-in (ui/coverImage.js, F70)
  wrapper.appendChild(coverImage({
    src: album.coverUrl,
    alt: album.title,
    className: 'w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
  }))
  wrapper.appendChild(SafeDOM.div({
    className: 'absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors'
  }))
  return wrapper
}

/**
 * @param {Album} album
 * @param {Object|null} item - the inventory item that holds the album, when the window was opened from the inventory
 */
function createDetailsElement(album, item) {
  const kept = item || {}
  const title = SafeDOM.h2({
    className: 'text-2xl md:text-3xl font-bold truncate text-white leading-tight',
  }, album.title)

  const artist = SafeDOM.p({
    className: 'text-xl text-accent-primary font-medium mb-2'
  }, album.artist)

  // Badges
  const badges = []
  if (album.year) badges.push(createBadge(album.year, 'px-2 py-0.5 bg-surface-light rounded-md border border-white/5'))
  if (kept.format) badges.push(createBadge(kept.format, 'badge badge-neutral uppercase text-xs tracking-wider'))

  // The status is the inventory's: an album that is not an inventory item has none to show
  if (item) {
    const status = statusOf(item)
    badges.push(createBadge(statusLabel(status).toUpperCase(), STATUS_BADGE[status]))
  }

  const badgeContainer = SafeDOM.div({
    className: 'flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-400'
  }, badges)

  // Metadata Grid
  const metaItems = []
  if (kept.purchasePrice) {
    // what the person paid: another number than what the album is worth (the «Estimated value» section)
    metaItems.push(createMetaItem('Paid:', formatCurrency(kept.purchasePrice, kept.currency || 'USD')))
  }
  if (kept.condition) {
    metaItems.push(createMetaItem('Cond:', kept.condition))
  }

  const metaContainer = SafeDOM.div({
    className: 'flex flex-wrap gap-4 mt-4 text-xs text-gray-500 font-mono opacity-80'
  }, metaItems)

  return SafeDOM.div({ className: 'flex-1 min-w-0 pt-1' }, [
    title, artist, badgeContainer, metaContainer
  ])
}

function createBadge(text, className) {
  return SafeDOM.span({ className }, text)
}

function createMetaItem(label, value) {
  return SafeDOM.div({ className: 'flex items-center gap-1' }, [
    SafeDOM.span({ className: 'text-gray-600' }, label),
    SafeDOM.span({ className: 'text-gray-300' }, value)
  ])
}

function createCloseButton() {
  const btn = SafeDOM.button({
    className: 'btn btn-ghost btn-circle hover:bg-white/10 text-gray-400 hover:text-white transition-all',
    dataset: { action: 'close' } // legacy data attr support
  })
  btn.appendChild(SafeDOM.fromHTML(getIcon('X', 'w-8 h-8')))
  return btn
}

function formatCurrency(value, currency = 'USD') {
  if (!value) return currency === 'USD' ? '$0.00' : 'R$ 0,00'
  const cents = roundToCents(value) // to cents first: engines round the half differently (F78)
  if (currency === 'BRL') {
    return `R$ ${cents.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `$${cents.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

