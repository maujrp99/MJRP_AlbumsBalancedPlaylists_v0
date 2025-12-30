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

export async function showViewAlbumModal(albumInput) {
  // Hydrate Album Model if needed
  const rawData = albumInput.albumData || albumInput
  const album = rawData instanceof Album ? rawData : new Album(rawData)

  // -- 1. Header Section --
  const coverEl = createCoverElement(album)
  const detailsEl = createDetailsElement(album)
  const closeBtn = createCloseButton()

  const headerEl = SafeDOM.div({
    className: 'modal-header p-6 border-b border-surface-light flex items-start gap-6 bg-surface-darker/50 backdrop-blur-md'
  }, [coverEl, detailsEl, closeBtn])

  // -- 2. Notes Section --
  let notesEl = null
  if (album.notes) {
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
      }, `"${album.notes}"`)
    ])
  }

  // -- 3. Content Section (Ranking) --
  const rankingContainer = SafeDOM.div({ id: 'modal-ranking-container' })
  const contentEl = SafeDOM.div({
    className: 'modal-content flex-1 overflow-hidden bg-surface-dark/30 relative'
  }, [
    SafeDOM.div({
      className: 'absolute inset-0 overflow-y-auto custom-scrollbar p-6'
    }, rankingContainer)
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
  const children = [headerEl]
  if (notesEl) children.push(notesEl)
  children.push(contentEl, footerEl)
  children.forEach(c => containerEl.appendChild(c))


  const modalOverlay = SafeDOM.div({
    className: 'modal-overlay',
    onClick: (e) => {
      if (e.target === modalOverlay) handleClose()
    }
  }, containerEl)

  // -- 6. Logic & Mounting --

  function handleClose() {
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
  document.body.appendChild(modalOverlay)
  document.addEventListener('keydown', handleEscape)

  // Close Button Action
  closeBtn.addEventListener('click', handleClose)

  // Initialize Comparison Component
  const comparison = new TracksRankingComparison({ album })

  // Defer mount slightly to ensure DOM checks work inside sub-components
  setTimeout(() => {
    comparison.mount(rankingContainer)
    comparison.updateUI()
  }, 0)

  return modalOverlay
}

// --- Helpers ---

function createCoverElement(album) {
  const wrapper = SafeDOM.div({
    className: 'w-24 h-24 md:w-32 md:h-32 bg-surface-dark rounded-xl shadow-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative group'
  })

  if (album.coverUrl) {
    wrapper.appendChild(SafeDOM.img({
      src: album.coverUrl,
      alt: album.title,
      className: 'w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
    }))
    wrapper.appendChild(SafeDOM.div({
      className: 'absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors'
    }))
  } else {
    const iconContainer = SafeDOM.div({ className: 'text-gray-600' })
    iconContainer.appendChild(SafeDOM.fromHTML(getIcon('Disc', 'w-12 h-12')))
    wrapper.appendChild(iconContainer)
  }
  return wrapper
}

function createDetailsElement(album) {
  const title = SafeDOM.h2({
    className: 'text-2xl md:text-3xl font-bold truncate text-white leading-tight',
  }, album.title)

  const artist = SafeDOM.p({
    className: 'text-xl text-accent-primary font-medium mb-2'
  }, album.artist)

  // Badges
  const badges = []
  if (album.year) badges.push(createBadge(album.year, 'px-2 py-0.5 bg-surface-light rounded-md border border-white/5'))
  if (album.format) badges.push(createBadge(album.format, 'badge badge-neutral uppercase text-xs tracking-wider'))

  badges.push(
    album.owned !== false
      ? createBadge('OWNED', 'badge badge-success')
      : createBadge('WISHLIST', 'badge badge-neutral')
  )

  const badgeContainer = SafeDOM.div({
    className: 'flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-400'
  }, badges)

  // Metadata Grid
  const metaItems = []
  if (album.purchasePrice) {
    metaItems.push(createMetaItem('Price:', formatCurrency(album.purchasePrice, album.currency)))
  }
  if (album.condition) {
    metaItems.push(createMetaItem('Cond:', album.condition))
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
  if (currency === 'BRL') {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

