// public/js/app.js
// App entrypoint module extracted from hybrid-curator.html
/* global alert */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js'
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js'
import { getFirestore, doc, setDoc, onSnapshot, setLogLevel } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'

import { fetchAlbumMetadata, fetchMultipleAlbumMetadata } from './api.js'
import { CurationEngine } from './curation.js'
import { normalizeKey } from './shared/normalize.js'

const firebaseConfig = window.__firebase_config
const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id'

let app, auth, db
let userId

let albumsDocRef
let playlistsDocRef

let currentAlbums = []
let currentPlaylists = []
let currentRankingSummary = {}
let currentRankingSources = []
let currentRankingAcclaim = []
let isAlbumsView = true
const sortableInstances = []
let unsubscribeAlbums = null
let unsubscribePlaylists = null
// Footer log elements
let footerLastUpdateEl, footerLogToggleEl, footerLogEl

function addFooterLog(message) {
  try {
    const when = new Date().toLocaleString()
    const li = document.createElement('div')
    li.className = 'footer-log-entry text-xs text-spotify-lightgray border-t border-spotify-gray py-1 px-2'
    li.textContent = `${when} — ${message}`
    if (footerLogEl) footerLogEl.prepend(li)
    if (footerLastUpdateEl) footerLastUpdateEl.textContent = when
  } catch (e) { console.debug('addFooterLog error', e) }
}

// UI elements
let mainContent, loadingSpinner, albumsView, playlistsView, albumsGrid, playlistsGrid
let toggleViewBtn, generateBtn, generateQuickBtn, saveBtn
let albumsSummary, playlistsSummary
let loadDataBtn, dataModal, closeModalBtn, cancelModalBtn, processJsonBtn, jsonInput, jsonError, emptyStateCta, emptyStateBtn
let updateAcclaimBtn
let rankingPanel, rankingSourcesList, rankingSummaryList, rankingAcclaimList

function formatDuration(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

function calculateTotalDuration(tracks) {
  return (tracks || []).reduce((s, x) => s + (x.duration || 0), 0)
}

function collectRankingAcclaim(albums) {
  if (!Array.isArray(albums)) return []
  const seen = new Set()
  const entries = []
  albums.forEach(album => {
    if (!album) return
    const baseTitle = album.title || 'Álbum Desconhecido'
    const baseArtist = album.artist || 'Artista Desconhecido'
    const acclaimList = Array.isArray(album.rankingAcclaim) ? album.rankingAcclaim : []
    acclaimList.forEach((entry, index) => {
      if (!entry || !entry.provider) return
      const position = Number(entry.position || entry.rank || index + 1) || null
      const trackTitle = entry.trackTitle || entry.title || entry.track || entry.name || ''
      // Build a dedupe key that includes provider, album identifier and track title
      const albumId = album.id || album.bestEverAlbumId || String(baseTitle + '::' + baseArtist)
      const key = `${entry.provider}::${albumId}::${(trackTitle || '').toString().trim().toLowerCase()}::${position || '0'}::${entry.referenceUrl || ''}`
      if (seen.has(key)) return
      seen.add(key)
      entries.push({
        provider: entry.provider,
        position,
        trackTitle: trackTitle || null,
        rating: entry.rating || entry.score || entry.value || null,
        summary: entry.summary || entry.description || '',
        referenceUrl: entry.referenceUrl || entry.url || entry.sourceUrl || '',
        albumTitle: baseTitle,
        albumArtist: baseArtist,
        albumId
      })
    })
  })
  return entries.sort((a, b) => (a.position || 999) - (b.position || 999))
}

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

function escapeHtml(value) {
  if (value === undefined || value === null) return ''
  return String(value).replace(/[&<>"']/g, char => ESCAPE_MAP[char] || char)
}

async function processAndSaveJSON() {
  // originalBtnText not used; we avoid unused var
  processJsonBtn.disabled = true
  processJsonBtn.classList.add('opacity-50', 'cursor-not-allowed')
  jsonError.textContent = ''

  try {
    const lines = (jsonInput.value || '').split(/\n+/).map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) throw new Error('Nenhuma linha válida fornecida.')

    const newAlbums = []
    const errors = []

    for (let i = 0; i < lines.length; i++) {
      const query = lines[i]
      processJsonBtn.textContent = `Buscando ${i + 1}/${lines.length}...`
      jsonError.textContent = `Processando: "${query}"...`
      try {
        const albumData = await fetchAlbumMetadata(query)
        if (albumData) newAlbums.push(albumData)
        else errors.push(`Não encontrado: ${query}`)
      } catch (err) {
        console.error(`Erro ao buscar "${query}":`, err)
        errors.push(`Erro em "${query}": ${err.message}`)
      }
    }

    if (newAlbums.length === 0) {
      // Não fechamos o modal — mostramos o erro para o usuário e mantemos o input disponível
      const msg = `Nenhum álbum foi encontrado. Falhas:\n${errors.join('\n')}`
      console.warn('processAndSaveJSON:', msg)
      jsonError.classList.remove('text-yellow-400')
      jsonError.classList.add('text-red-400')
      jsonError.textContent = msg
      return
    }

    await saveDataToFirestore(newAlbums, currentPlaylists, currentRankingSummary, currentRankingSources)
    closeDataModal()

    if (errors.length > 0) alert(`Importação concluída com ${newAlbums.length} álbuns.\n\nFalhas:\n${errors.join('\n')}`)
  } catch (error) {
    console.error('Erro no processo:', error)
    jsonError.classList.remove('text-yellow-400')
    jsonError.classList.add('text-red-400')
    jsonError.textContent = `Erro: ${error.message}`
  } finally {
    processJsonBtn.disabled = false
    processJsonBtn.classList.remove('opacity-50', 'cursor-not-allowed')
    processJsonBtn.textContent = 'Buscar Metadados e Salvar'
  }
}

function renderAlbumsView(albums) {
  updateEmptyStateVisibility(albums)
  albumsGrid.innerHTML = ''
  if (!albums || albums.length === 0) {
    renderAlbumSkeletons(3)
    albumsSummary.innerHTML = '<p class="text-center text-spotify-lightgray">Nenhum dado de origem.</p>'
    return
  }

  let totalTracks = 0
  let totalDuration = 0

  albums.forEach(album => {
    if (!album) return
    // Attempt to preserve the album's original track order even if the stored
    // `album.tracks` array was previously reordered (for example, by `rank`).
    // Heuristics: prefer explicit `trackNumber`/`position` fields, then try to
    // parse a numeric suffix from the `id` (eg. `okc_track_1`). If none apply,
    // fall back to the array order as stored.
    const albumTracksRaw = album.tracks || []
    const inferOriginalOrder = (tracks) => {
      if (!Array.isArray(tracks) || tracks.length === 0) return tracks || []
      // check for explicit numeric fields
      const hasNumberField = tracks.every(t => t && (t.trackNumber !== undefined || t.number !== undefined || t.position !== undefined))
      if (hasNumberField) {
        return tracks.slice().sort((a, b) => (Number(a.trackNumber ?? a.number ?? a.position) || 0) - (Number(b.trackNumber ?? b.number ?? b.position) || 0))
      }

      // try to parse trailing number from id
      const idNumber = (t) => {
        if (!t || !t.id) return null
        const m = String(t.id).match(/(\d+)\s*$/)
        return m ? Number(m[1]) : null
      }
      const allHaveIdNumber = tracks.every(t => idNumber(t) !== null)
      if (allHaveIdNumber) {
        return tracks.slice().sort((a, b) => (idNumber(a) || 0) - (idNumber(b) || 0))
      }

      // fallback: preserve stored order
      return tracks
    }
    const albumTracks = inferOriginalOrder(albumTracksRaw)
    const albumDuration = calculateTotalDuration(albumTracks)
    totalTracks += albumTracks.length
    totalDuration += albumDuration

    const albumCard = document.createElement('div')
    albumCard.className = 'album-card card-base'
    albumCard.innerHTML = `
            <div class="flex items-center mb-4">
                <img src="${album.cover || 'https://placehold.co/100x100/333/888?text=Capa'}" alt="Capa do ${album.title}" class="w-20 h-20 rounded-md mr-4 object-cover" onerror="this.src='https://placehold.co/100x100/333/888?text=Capa'">
                <div>
            <h3 class="text-xl font-bold text-white">${album.title || 'Título Desconhecido'}</h3>
            <p class="text-sm text-muted">${album.artist || 'Artista Desconhecido'} • ${album.year || '----'}</p>
                </div>
            </div>
            <div class="border-t border-spotify-gray pt-2">
                <div class="flex justify-between text-sm text-spotify-lightgray mb-2 px-2">
                    <span class="font-semibold">#</span>
                    <span class="flex-1 ml-4 font-semibold">Faixa</span>
                    <span class="font-semibold">Duração</span>
                </div>
                <ul class="space-y-1">
                  ${albumTracks.map((track, idx) => `
                    <li class="flex justify-between items-center p-2 rounded-md hover:bg-spotify-gray">
                      <span class="text-spotify-lightgray w-6 text-center">${idx + 1}</span>
                      <span class="flex-1 ml-2 text-white truncate" title="${track.title}">${track.title || 'Faixa Desconhecida'}</span>
                      <span class="text-spotify-lightgray text-sm">${formatDuration(track.duration)}</span>
                    </li>
                  `).join('')}
                </ul>
            </div>
            <div class="border-t border-spotify-gray mt-2 pt-2 text-right">
                <span class="text-sm font-semibold text-spotify-lightgray">Total: ${albumTracks.length} faixas, ${formatDuration(albumDuration)}</span>
            </div>
        `
    albumsGrid.appendChild(albumCard)
  })

  albumsSummary.innerHTML = `
    <div class="card-content">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">Resumo</h3>
        <span class="text-sm text-accent">${albums.length} álbuns</span>
      </div>
      <div class="grid grid-cols-3 gap-3 text-center">
        <div>
          <p class="text-xs uppercase tracking-wider text-muted">Faixas</p>
          <p class="text-2xl font-bold text-white">${totalTracks}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wider text-muted">Minutos</p>
          <p class="text-2xl font-bold text-white">${Math.floor(totalDuration / 60)}</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-wider text-muted">Dur.</p>
          <p class="text-2xl font-bold text-white">${formatDuration(totalDuration)}</p>
        </div>
      </div>
    </div>
  `
}

function setGenerateButtonsState(enabled) {
  ;[generateBtn, generateQuickBtn].forEach(btn => {
    if (!btn) return
    btn.disabled = !enabled
    btn.setAttribute('aria-disabled', String(!enabled))
  })
}

function updateEmptyStateVisibility(albums) {
  const hasAlbums = Array.isArray(albums) && albums.length > 0
  if (emptyStateCta) emptyStateCta.classList.toggle('hidden', hasAlbums)
  setGenerateButtonsState(hasAlbums)
}

function renderAlbumSkeletons(count = 3) {
  albumsGrid.innerHTML = ''
  const fragment = document.createDocumentFragment()
  for (let i = 0; i < count; i++) {
    const skeletonCard = document.createElement('div')
    skeletonCard.className = 'skeleton-card'
    fragment.appendChild(skeletonCard)
  }
  albumsGrid.appendChild(fragment)
}

function refreshToggleViewButtonState() {
  if (!toggleViewBtn) return
  if (isAlbumsView) {
    toggleViewBtn.textContent = 'Ver Playlists'
    toggleViewBtn.setAttribute('aria-label', 'Mostrar playlists geradas')
    toggleViewBtn.setAttribute('aria-pressed', 'false')
  } else {
    toggleViewBtn.textContent = 'Ver Álbuns'
    toggleViewBtn.setAttribute('aria-label', 'Voltar para os álbuns de origem')
    toggleViewBtn.setAttribute('aria-pressed', 'true')
  }
}

/**
 * Helper para renderizar um item de faixa (usado no Sortable)
 */
function renderTrackItem(track) {
  // Encontra o álbum original da faixa
  const originAlbum = (track && track.originAlbumId)
    ? currentAlbums.find(a => a.id === track.originAlbumId)
    : currentAlbums.find(a => a.tracks && a.tracks.some(t => t.id === track.id))
  const albumTitle = originAlbum ? originAlbum.title : 'N/A'
  const rankValue = track && (track.rank !== undefined && track.rank !== null) ? track.rank : '-'
  const canonicalBadge = (track && track.canonicalRank !== undefined && track.canonicalRank !== null && track.canonicalRank !== rankValue)
    ? ` (Canon: ${track.canonicalRank})`
    : ''

  return `
        <li class="track-item flex justify-between items-center p-2 rounded-md hover:bg-spotify-gray" data-track-id="${track.id}">
            <div class="flex-1 truncate mr-2">
                <p class="text-white truncate" title="${track.title}">${track.title || 'Faixa Desconhecida'}</p>
                <p class="text-xs text-spotify-lightgray">Rank: ${rankValue}${canonicalBadge}</p>
            </div>
            <span class="text-spotify-lightgray text-sm w-16 truncate text-center" title="${albumTitle}">${albumTitle}</span>
            <span class="text-spotify-lightgray text-sm w-12 text-right">${formatDuration(track.duration)}</span>
        </li>
    `
}

/**
 * Renderiza as playlists na UI (inclui inicialização do Sortable)
 */
function renderPlaylistsView(playlists) {
  playlistsGrid.innerHTML = ''
  if (!playlists || playlists.length === 0) {
    playlistsGrid.innerHTML = '<p class="text-spotify-lightgray col-span-full text-center">Nenhuma playlist gerada.</p>'
    playlistsSummary.innerHTML = '<p class="text-center text-spotify-lightgray">Nenhuma playlist para resumir.</p>'
    return
  }
  // Section title is defined statically in the HTML; no dynamic injection needed.
  let totalTracks = 0
  let totalDuration = 0

  playlists.forEach(playlist => {
    if (!playlist) return
    const playlistTracks = playlist.tracks || []
    const playlistDuration = calculateTotalDuration(playlistTracks)
    totalTracks += playlistTracks.length
    totalDuration += playlistDuration

    const playlistCard = document.createElement('div')
    playlistCard.className = 'playlist-card card-base'
    playlistCard.innerHTML = `
            <div class="mb-4">
                <h3 class="text-xl font-bold text-white">${playlist.title || 'Playlist Sem Título'}</h3>
                <p class="text-sm text-spotify-lightgray">${playlist.subtitle || ' '}</p>
            </div>
            <div class="border-t border-spotify-gray pt-2 flex-1">
                <div class="flex justify-between text-sm text-spotify-lightgray mb-2 px-2">
                    <span class="flex-1 font-semibold">Faixa (Rank)</span>
                    <span class="font-semibold">Álbum</span>
                    <span class="font-semibold">Duração</span>
                </div>
                <ul id="playlist-${playlist.id}" data-playlist-id="${playlist.id}" class="space-y-1 h-full min-h-[150px]">
                    ${playlistTracks.map(track => renderTrackItem(track)).join('')}
                </ul>
            </div>
            <div class="border-t border-spotify-gray mt-2 pt-2 text-right">
                <span class="text-sm font-semibold text-spotify-lightgray">Total: ${playlistTracks.length} faixas, ${formatDuration(playlistDuration)}</span>
            </div>
        `
    playlistsGrid.appendChild(playlistCard)
  })

  renderPlaylistsSummary(playlists, totalTracks, totalDuration)
  renderRankingPanel()
  initSortable()
}

function renderPlaylistsSummary(playlists, totalTracks, totalDuration) {
  let originTotalTracks = 0
  let originTotalDuration = 0
  if (currentAlbums && currentAlbums.length > 0) {
    currentAlbums.forEach(album => {
      if (album && album.tracks) {
        originTotalTracks += album.tracks.length
        originTotalDuration += calculateTotalDuration(album.tracks)
      }
    })
  }

  const tracksMatch = originTotalTracks === totalTracks
  const durationMatch = originTotalDuration === totalDuration
  const isOk = tracksMatch && durationMatch

  // Instead of a prominent verification panel, move verification results to footer log
  playlistsSummary.innerHTML = `
      <h3 class="text-lg font-semibold text-white mb-2">Resumo das Playlists (Resultado)</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-4">
        <div>
          <p class="text-sm text-spotify-lightgray">Total de Playlists:</p>
          <p class="text-2xl font-bold text-white">${playlists.length}</p>
        </div>
        <div>
          <p class="text-sm text-spotify-lightgray">Total de Faixas:</p>
          <p class="text-2xl font-bold text-white">${totalTracks}</p>
        </div>
        <div>
          <p class="text-sm text-spotify-lightgray">Duração Total:</p>
          <p class="text-2xl font-bold text-white">${formatDuration(totalDuration)}</p>
        </div>
      </div>
    `

  // Log verification summary to footer (compact)
  try {
    if (isOk) addFooterLog('Verificação: OK - Totais batem (origem = resultado)')
    else addFooterLog(`Verificação: ERRO - Totais divergentes. Origem: ${originTotalTracks} faixas / ${formatDuration(originTotalDuration)} · Resultado: ${totalTracks} faixas / ${formatDuration(totalDuration)}`)
  } catch (e) { console.debug('footer log error', e) }
}

function renderRankingPanel() {
  if (!rankingPanel) return
  const entries = currentRankingSummary && Object.values(currentRankingSummary)
  const hasSummary = entries && entries.length > 0
  const hasSources = currentRankingSources && currentRankingSources.length > 0
  const hasAcclaim = currentRankingAcclaim && currentRankingAcclaim.length > 0
  if (!hasSummary && !hasSources && !hasAcclaim) {
    rankingPanel.classList.add('hidden')
    return
  }
  rankingPanel.classList.remove('hidden')
  // Log a compact summary to the footer log (UI traceability moved to log)
  try {
    const now = new Date().toLocaleString()
    const acclaimCount = (currentRankingAcclaim && currentRankingAcclaim.length) || 0
    const summaryCount = (entries && entries.length) || 0
    addFooterLog(`Ranking updated — acclaim:${acclaimCount} • summary:${summaryCount}`)
  } catch (e) { console.debug('ranking panel log error', e) }
  renderRankingSources()
  // Render only the per-album consolidated ranking summary
  renderRankingSummaryList()
}

function renderRankingSources() {
  if (!rankingSourcesList) return
  if (!currentRankingSources || currentRankingSources.length === 0) {
    rankingSourcesList.innerHTML = '<p class="text-sm text-spotify-lightgray">Nenhuma fonte documentada ainda.</p>'
    return
  }
  // Show BestEverAlbums (deterministic scraper) first when present
  const isBestEverSource = s => (s && ((s.provider && String(s.provider).toLowerCase().includes('bestever')) || (s.name && String(s.name).toLowerCase().includes('bestever')) || (s.referenceUrl && String(s.referenceUrl).toLowerCase().includes('bestever'))))
  const sorted = currentRankingSources.slice().sort((a, b) => {
    const aBest = isBestEverSource(a) ? 0 : 1
    const bBest = isBestEverSource(b) ? 0 : 1
    return aBest - bBest
  })

  rankingSourcesList.innerHTML = sorted.map(source => {
    const displayName = source.name || source.provider || 'Fonte'
    const displayType = source.type || source.providerType || ''
    const isBest = isBestEverSource(source)
    const secureBadge = isBest ? '<span class="ranking-source-secure" aria-label="Fonte verificada">BestEver</span>' : (source.secure ? '<span class="ranking-source-secure" aria-label="Fonte segura">secure</span>' : '')
    return `
      <span class="ranking-source-chip">
        <strong class="tracking-[0.3em] text-[10px] uppercase text-white">${escapeHtml(displayName)}</strong>
        <span class="text-[11px] text-spotify-lightgray">${escapeHtml(displayType)}</span>
        ${secureBadge}
      </span>
    `
  }).join('')
}

function renderRankingAcclaimList(entries) {
  if (!rankingAcclaimList) return
  if (!entries || entries.length === 0) {
    rankingAcclaimList.innerHTML = '<p class="text-sm text-spotify-lightgray">Nenhum ranking de aclamação registrado.</p>'
    return
  }
  // Group entries by album (albumTitle • albumArtist) so the UI shows per-album acclaim lists
  const grouped = {}
  entries.forEach(entry => {
    const title = entry && entry.albumTitle ? String(entry.albumTitle) : 'Álbum desconhecido'
    const artist = entry && entry.albumArtist ? String(entry.albumArtist) : ''
    const key = artist ? `${title} • ${artist}` : title
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(entry)
  })

  // Render each album block: album header + tracks sorted by rating desc (when available) otherwise position asc
  rankingAcclaimList.innerHTML = Object.keys(grouped).map(albumKey => {
    const list = grouped[albumKey].slice().sort((a, b) => {
      const ra = Number(a.rating || 0) || 0
      const rb = Number(b.rating || 0) || 0
      if (ra !== rb) return rb - ra
      return (Number(a.position) || 999) - (Number(b.position) || 999)
    })
    const rows = list.map(entry => {
      const pos = (entry.position !== undefined && entry.position !== null) ? `Posição ${escapeHtml(entry.position)}` : 'Posição não especificada'
      const summaryText = entry.summary || 'Resumo não enviado'
      const sourceLink = entry.referenceUrl ? `<a href="${escapeHtml(entry.referenceUrl)}" target="_blank" rel="noreferrer">Ver fonte</a>` : ''
      const isBestEver = (entry && ((entry.provider && String(entry.provider).toLowerCase().includes('bestever')) || (entry.referenceUrl && String(entry.referenceUrl).toLowerCase().includes('bestever'))))
      const verifiedBadge = isBestEver ? ' <span class="text-xs text-green-400 font-semibold">(BestEver verificado)</span>' : ''
      return `
        <div class="ranking-acclaim-entry">
          <div class="flex items-baseline justify-between gap-3">
            <p class="text-sm font-semibold text-white truncate">${escapeHtml(entry.trackTitle || 'Faixa desconhecida')}</p>
            <span class="text-xs uppercase text-spotify-lightgray">${pos}</span>
          </div>
          <p class="text-[11px] text-spotify-lightgray mt-1 truncate">${escapeHtml(summaryText)}</p>
          <div class="mt-2 text-[10px] tracking-wide text-right">${sourceLink}${verifiedBadge}</div>
        </div>
      `
    }).join('')
    return `
      <div class="ranking-album-block">
        <h5 class="text-sm font-semibold text-white mb-2">${escapeHtml(albumKey)}</h5>
        <div class="space-y-2">${rows}</div>
      </div>
    `
  }).join('')
}

function renderRankingSummaryList() {
  if (!rankingSummaryList) return
  if (!currentAlbums || currentAlbums.length === 0) {
    rankingSummaryList.innerHTML = '<p class="text-sm text-spotify-lightgray">Nenhum álbum para exibir.</p>'
    return
  }

  // For each album, prefer `rankingConsolidated` ordering (server-side consolidation, prefers BestEver evidence).
  const html = currentAlbums.map(album => {
    if (!album) return ''
    const albumTitle = album.title || 'Álbum Desconhecido'
    const albumArtist = album.artist || ''
    // attempt to find BestEver album URL from album.rankingSources, album.bestEverUrl, or global currentRankingSources
    const findBestEverUrl = (sources) => {
      if (!Array.isArray(sources)) return null
      for (const s of sources) {
        if (!s) continue
        const name = String(s.provider || s.name || '').toLowerCase()
        const url = s.referenceUrl || s.albumUrl || s.url || null
        if (name.includes('bestever') && url) return url
        if (url && String(url).toLowerCase().includes('besteveralbums.com')) return url
      }
      return null
    }

    let bestEverUrl = album.bestEverUrl || findBestEverUrl(album.rankingSources) || findBestEverUrl(currentRankingSources)
    // fallback: build canonical URL from album.bestEverAlbumId when present
    if (!bestEverUrl && album.bestEverAlbumId) bestEverUrl = `https://www.besteveralbums.com/thechart.php?a=${encodeURIComponent(String(album.bestEverAlbumId))}#tracks`

    // Determine track list: prefer server-provided `tracksByAcclaim` (deterministic acclaim order),
    // otherwise fall back to `rankingConsolidated` (consolidated entries), then album.tracks.
    let tracks = []
    if (Array.isArray(album.tracksByAcclaim) && album.tracksByAcclaim.length > 0) {
      // `tracksByAcclaim` is expected to be an array of track objects with `.title` and `.rank`.
      // We will preserve the `rank` values for numbering, but if ratings are available
      // prefer ordering by rating desc (so UI shows highest-rated tracks first while
      // still displaying the deterministic rank number next to each track).
      const normalizeKey = s => (s || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '')

      // Build initial tracks array and enrich ratings from consolidated evidence if present
      tracks = album.tracksByAcclaim.map(t => ({
        title: t.title || t.trackTitle || t.name || 'Faixa desconhecida',
        rank: t.rank || null,
        duration: t.duration || null,
        rating: (t.rating !== undefined && t.rating !== null) ? t.rating : null
      }))

      // Try to enrich missing ratings from album.rankingConsolidated, album.bestEverEvidence or album.rankingAcclaim
      const consolidatedIndex = Array.isArray(album.rankingConsolidated)
        ? new Map(album.rankingConsolidated.map(c => [normalizeKey(c.trackTitle || c.title || ''), c]))
        : new Map()
      const bestEverIndex = Array.isArray(album.bestEverEvidence)
        ? new Map(album.bestEverEvidence.map(b => [normalizeKey(b.trackTitle || b.title || ''), b]))
        : new Map()
      const acclaimIndex = Array.isArray(album.rankingAcclaim)
        ? new Map(album.rankingAcclaim.map(a => [normalizeKey(a.trackTitle || a.title || ''), a]))
        : new Map()

      tracks.forEach(tr => {
        if (tr.rating !== null && tr.rating !== undefined) return
        const key = normalizeKey(tr.title || '')
        const c = consolidatedIndex.get(key)
        if (c && (c.rating !== undefined && c.rating !== null)) { tr.rating = c.rating; return }
        const b = bestEverIndex.get(key)
        if (b && (b.rating !== undefined && b.rating !== null)) { tr.rating = b.rating; return }
        const r = acclaimIndex.get(key)
        if (r && (r.rating !== undefined && r.rating !== null)) { tr.rating = r.rating; return }
      })

      const hasRatings = tracks.some(t => t.rating !== null && t.rating !== undefined)
      if (hasRatings) tracks.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
      else tracks.sort((a, b) => (Number(a.rank) || 999) - (Number(b.rank) || 999))
    } else if (Array.isArray(album.rankingConsolidated) && album.rankingConsolidated.length > 0) {
      // rankingConsolidated entries include finalPosition
      const normalizeKey = s => (s || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '')
      tracks = album.rankingConsolidated.map(t => ({
        title: t.trackTitle || t.title || t.name || 'Faixa desconhecida',
        rank: t.finalPosition || t.position || null,
        duration: (album.tracks || []).find(x => ((x.title || x.name || x.trackTitle) && String(x.title || x.name || x.trackTitle).toLowerCase() === String(t.trackTitle || '').toLowerCase()))?.duration || null,
        rating: (function findRating() {
          // prefer explicit rating on consolidated entry
          if (t.rating) return t.rating
          // try evidence attached to the consolidated entry
          if (t.evidence && Array.isArray(t.evidence)) {
            const be = t.evidence.find(e => e && String(e.provider || '').toLowerCase().includes('bestever') && (e.rating || e.score || e.value))
            if (be) return be.rating || be.score || be.value
          }
          // check album.bestEverEvidence (server-provided array of {trackTitle, rating}) using normalized match
          if (Array.isArray(album.bestEverEvidence)) {
            const key = normalizeKey(t.trackTitle || t.title || '')
            const m = album.bestEverEvidence.find(b => normalizeKey(b.trackTitle) === key)
            if (m && (m.rating || m.score)) return m.rating || m.score
          }
          // check album.rankingAcclaim entries for rating
          if (Array.isArray(album.rankingAcclaim)) {
            const key = normalizeKey(t.trackTitle || t.title || '')
            const m2 = album.rankingAcclaim.find(r => normalizeKey(r.trackTitle || r.title || '') === key)
            if (m2 && (m2.rating || m2.score)) return m2.rating || m2.score
          }
          return null
        })()
      }))
      // if BestEver ratings are present, prefer ordering by rating desc; otherwise order by rank asc
      const hasRatings = tracks.some(t => t.rating !== null && t.rating !== undefined)
      if (hasRatings) tracks.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
      else tracks.sort((a, b) => (Number(a.rank) || 999) - (Number(b.rank) || 999))
    } else {
      // fallback to album.tracks ordering (use available rank if present)
      tracks = (album.tracks || []).map(t => ({ title: t.title || t.name || t.trackTitle || 'Faixa desconhecida', rank: t.rank || null, duration: t.duration || null, rating: t.rating || t.bestEverRating || null }))
      tracks.sort((a, b) => (Number(a.rank) || 999) - (Number(b.rank) || 999))
    }

    const albumDuration = calculateTotalDuration(album.tracks || [])

    const rowsHtml = tracks.map((track, idx) => {
      // displayIndex: visual numbering after sorting (1..N)
      const displayIndex = idx + 1
      const dur = track.duration ? formatDuration(track.duration) : '--:--'
      const ratingLabel = track.rating ? `<span class="text-xs text-spotify-lightgray"> • Rating: ${escapeHtml(String(track.rating))}</span>` : ''
      // If the canonical rank exists and differs from the visual index, show a small badge
      const canonicalBadge = (track.rank !== undefined && track.rank !== null && Number(track.rank) !== displayIndex)
        ? `<span class="text-[11px] text-spotify-lightgray ml-2">(Canon: ${escapeHtml(String(track.rank))})</span>`
        : ''
      return `
        <div class="flex items-center justify-between p-2 rounded-md hover:bg-spotify-gray">
          <div class="flex items-center gap-3">
            <span class="w-6 text-spotify-lightgray text-sm text-center">${displayIndex}</span>
            <span class="text-white truncate">${escapeHtml(track.title)} ${canonicalBadge}</span>
          </div>
          <div class="text-right text-spotify-lightgray text-sm">${escapeHtml(dur)}${ratingLabel}</div>
        </div>
      `
    }).join('')

    const sourceHtml = bestEverUrl ? `<a href="${escapeHtml(bestEverUrl)}" target="_blank" rel="noreferrer" class="text-xs text-spotify-lightgray">Fonte: BestEverAlbums</a>` : ''

    return `
      <div class="card-base mb-3">
        <div class="p-3 border-b border-spotify-gray">
          <div class="flex items-baseline justify-between">
            <h4 class="text-sm font-semibold text-white">${escapeHtml(albumTitle)} • ${escapeHtml(albumArtist)}</h4>
            <div class="text-xs text-spotify-lightgray">Total: ${formatDuration(albumDuration)}</div>
          </div>
          <div class="mt-2">${sourceHtml}</div>
        </div>
        <div class="p-3 space-y-1">${rowsHtml}</div>
      </div>
    `
  }).join('')

  rankingSummaryList.innerHTML = html
}

function renderRankingTrackRow(track) {
  const reasons = (track.rankingInfo || []).map(info => {
    const positionLabel = info.metadata && info.metadata.position ? ` · Pos ${escapeHtml(info.metadata.position)}` : ''
    return `${escapeHtml(info.reason)} · ${escapeHtml(info.source)}${positionLabel}`
  }).join(' | ')
  const rankLabel = track.rank !== undefined && track.rank !== null ? ` · Rank ${escapeHtml(track.rank)}` : ''
  return `
      <div class="ranking-track-row">
        <div class="flex items-baseline justify-between gap-3">
          <p class="text-sm font-semibold text-white truncate">${escapeHtml(track.title)}${rankLabel}</p>
          <span class="text-[10px] text-spotify-lightgray">${escapeHtml(track.playlistTitle || track.playlistId || 'sem playlist')}</span>
        </div>
        <p class="text-[11px] text-spotify-lightgray">${reasons || 'Sem justificativa detalhada'}</p>
      </div>
    `
}

function toggleView() {
  isAlbumsView = !isAlbumsView
  if (isAlbumsView) {
    albumsView.classList.remove('hidden')
    playlistsView.classList.add('hidden')
  } else {
    albumsView.classList.add('hidden')
    playlistsView.classList.remove('hidden')
    renderPlaylistsView(currentPlaylists)
  }
  refreshToggleViewButtonState()
}

function initSortable() {
  const lists = document.querySelectorAll('#playlists-grid ul')
  lists.forEach(list => {
    const sortable = new window.Sortable(list, {
      group: 'playlists',
      animation: 150,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      onEnd: handleDragEnd
    })
    sortableInstances.push(sortable)
  })
}

function handleDragEnd(evt) {
  const trackId = evt.item.dataset.trackId
  const fromListId = evt.from.dataset.playlistId
  const toListId = evt.to.dataset.playlistId
  if (fromListId === toListId) updateTrackOrder(toListId, evt.newIndex, trackId)
  else moveTrackBetweenPlaylists(fromListId, toListId, evt.oldIndex, evt.newIndex, trackId)
  resetSaveButton && resetSaveButton()
}

function updateTrackOrder(playlistId, newIndex, trackId) {
  const playlist = currentPlaylists.find(p => p.id === playlistId)
  if (!playlist) return
  const track = playlist.tracks.find(t => t.id === trackId)
  playlist.tracks = playlist.tracks.filter(t => t.id !== trackId)
  if (track) playlist.tracks.splice(newIndex, 0, track)
  renderPlaylistsView(currentPlaylists)
}

function moveTrackBetweenPlaylists(fromListId, toListId, oldIndex, newIndex, trackId) {
  const fromPlaylist = currentPlaylists.find(p => p.id === fromListId)
  const toPlaylist = currentPlaylists.find(p => p.id === toListId)
  if (!fromPlaylist || !toPlaylist) return
  const trackIndex = fromPlaylist.tracks.findIndex(t => t.id === trackId)
  if (trackIndex > -1) {
    const [trackToMove] = fromPlaylist.tracks.splice(trackIndex, 1)
    toPlaylist.tracks.splice(newIndex, 0, trackToMove)
  }
  renderPlaylistsView(currentPlaylists)
}

function normalizeTrackKeyForCuration(value) {
  return normalizeKey(value)
}

function buildTracksForCurationInput(album) {
  if (!album) return []
  const normalizeKey = normalizeTrackKeyForCuration
  const consolidatedIndex = new Map()
  if (Array.isArray(album.rankingConsolidated)) {
    album.rankingConsolidated.forEach(entry => {
      const key = normalizeKey(entry && (entry.trackTitle || entry.title || ''))
      if (key) consolidatedIndex.set(key, entry)
    })
  }
  const bestEverIndex = new Map()
  if (Array.isArray(album.bestEverEvidence)) {
    album.bestEverEvidence.forEach(entry => {
      const key = normalizeKey(entry && (entry.trackTitle || entry.title || ''))
      if (key) bestEverIndex.set(key, entry)
    })
  }
  const acclaimIndex = new Map()
  if (Array.isArray(album.rankingAcclaim)) {
    album.rankingAcclaim.forEach(entry => {
      const key = normalizeKey(entry && (entry.trackTitle || entry.title || ''))
      if (key) acclaimIndex.set(key, entry)
    })
  }
  const durationIndex = new Map()
  if (Array.isArray(album.tracks)) {
    album.tracks.forEach(track => {
      const key = normalizeKey(track && (track.title || track.trackTitle || track.name || ''))
      if (key && track) durationIndex.set(key, track.duration || null)
    })
  }

  function enrichTrack(track, idx) {
    const copy = { ...track }
    const title = copy.title || copy.trackTitle || copy.name || `Faixa ${idx + 1}`
    copy.title = title
    const key = normalizeKey(title)
    const consolidatedEntry = key ? consolidatedIndex.get(key) : null
    const canonicalRank = (() => {
      if (copy.canonicalRank !== undefined && copy.canonicalRank !== null) return Number(copy.canonicalRank)
      if (copy.rank !== undefined && copy.rank !== null) return Number(copy.rank)
      if (consolidatedEntry && (consolidatedEntry.finalPosition !== undefined && consolidatedEntry.finalPosition !== null)) return Number(consolidatedEntry.finalPosition)
      return null
    })()
    const rating = (() => {
      if (copy.rating !== undefined && copy.rating !== null) return Number(copy.rating)
      if (consolidatedEntry && (consolidatedEntry.rating !== undefined && consolidatedEntry.rating !== null)) return Number(consolidatedEntry.rating)
      const be = key ? bestEverIndex.get(key) : null
      if (be && (be.rating !== undefined && be.rating !== null)) return Number(be.rating)
      const ac = key ? acclaimIndex.get(key) : null
      if (ac && (ac.rating !== undefined && ac.rating !== null)) return Number(ac.rating)
      return null
    })()
    const normalizedScore = (() => {
      if (copy.acclaimScore !== undefined && copy.acclaimScore !== null) return Number(copy.acclaimScore)
      if (copy.normalizedScore !== undefined && copy.normalizedScore !== null) return Number(copy.normalizedScore)
      if (consolidatedEntry && (consolidatedEntry.normalizedScore !== undefined && consolidatedEntry.normalizedScore !== null)) return Number(consolidatedEntry.normalizedScore)
      if (rating !== null) return Number(rating)
      return null
    })()
    const acclaimRank = (() => {
      if (copy.acclaimRank !== undefined && copy.acclaimRank !== null) return Number(copy.acclaimRank)
      if (copy.rank !== undefined && copy.rank !== null) return Number(copy.rank)
      if (consolidatedEntry && (consolidatedEntry.finalPosition !== undefined && consolidatedEntry.finalPosition !== null)) return Number(consolidatedEntry.finalPosition)
      return idx + 1
    })()
    const durationFromIndex = key && durationIndex.has(key) ? durationIndex.get(key) : null
    copy.id = copy.id || `track_${album.id || 'album'}_${idx + 1}`
    copy.originAlbumId = copy.originAlbumId || album.id || null
    copy.duration = copy.duration !== undefined && copy.duration !== null ? copy.duration : durationFromIndex
    copy.rating = rating
    copy.acclaimScore = normalizedScore
    copy.acclaimRank = acclaimRank
    copy.canonicalRank = canonicalRank
    return copy
  }

  const baseTracks = (() => {
    if (Array.isArray(album.tracksByAcclaim) && album.tracksByAcclaim.length > 0) {
      return album.tracksByAcclaim.map(track => ({ ...track }))
    }
    if (Array.isArray(album.rankingConsolidated) && album.rankingConsolidated.length > 0) {
      return album.rankingConsolidated
        .slice()
        .sort((a, b) => (Number(a.finalPosition || a.position || 0) - Number(b.finalPosition || b.position || 0)))
        .map((entry, idx) => {
          const title = entry.trackTitle || entry.title || `Faixa ${idx + 1}`
          const key = normalizeKey(title)
          const duration = key && durationIndex.has(key) ? durationIndex.get(key) : null
          return {
            id: entry.id || `consolidated_${album.id || 'album'}_${idx + 1}`,
            title,
            rank: entry.finalPosition || entry.position || null,
            rating: entry.rating !== undefined ? entry.rating : null,
            normalizedScore: entry.normalizedScore !== undefined ? entry.normalizedScore : null,
            duration,
            originAlbumId: album.id || null
          }
        })
    }
    return Array.isArray(album.tracks) ? album.tracks.map(track => ({ ...track })) : []
  })()

  const enrichedTracks = baseTracks.map((track, idx) => enrichTrack(track, idx))
  const sortedTracks = enrichedTracks.slice()
  const getScore = (track) => {
    if (!track) return { rating: null, score: null }
    const rating = (track.rating !== undefined && track.rating !== null) ? Number(track.rating) : null
    const score = (track.acclaimScore !== undefined && track.acclaimScore !== null) ? Number(track.acclaimScore) : null
    return { rating, score }
  }
  sortedTracks.sort((a, b) => {
    const { rating: ra, score: sa } = getScore(a)
    const { rating: rb, score: sb } = getScore(b)
    if (rb !== null && ra !== null && rb !== ra) return rb - ra
    if (sb !== null && sa !== null && sb !== sa) return sb - sa
    const rankA = (a && a.rank !== undefined && a.rank !== null) ? Number(a.rank) : Number.POSITIVE_INFINITY
    const rankB = (b && b.rank !== undefined && b.rank !== null) ? Number(b.rank) : Number.POSITIVE_INFINITY
    if (rankA !== rankB) return rankA - rankB
    return (a && a.title ? a.title.localeCompare(b && b.title ? b.title : '') : 0)
  })
  sortedTracks.forEach((track, idx) => {
    if (!track) return
    track.acclaimRank = idx + 1
    if (track.canonicalRank === undefined || track.canonicalRank === null) {
      track.canonicalRank = (track.rank !== undefined && track.rank !== null) ? Number(track.rank) : null
    }
    track.rank = track.acclaimRank
  })
  return sortedTracks
}

/**
 * Utility: reset save button state (called after user changes)
 */
function resetSaveButton() {
  if (!saveBtn) return
  saveBtn.disabled = false
  saveBtn.classList.remove('opacity-50', 'cursor-not-allowed')
}

async function runHybridCuration() {
  if (!currentAlbums || currentAlbums.length === 0) {
    alert('Nenhum álbum carregado para processar.')
    return
  }
  try {
    const albumsForCuration = currentAlbums.map(album => ({
      ...album,
      tracks: buildTracksForCurationInput(album)
    }))
    const engine = new CurationEngine({ targetSeconds: 45 * 60 })
    const {
      playlists: newPlaylists,
      rankingSummary,
      rankingSources
    } = engine.curate(albumsForCuration)
    currentPlaylists = newPlaylists
    currentRankingSummary = rankingSummary || {}
    currentRankingSources = rankingSources || []
    await saveDataToFirestore(currentAlbums, newPlaylists, currentRankingSummary, currentRankingSources)
    if (isAlbumsView) toggleView(); else renderPlaylistsView(currentPlaylists)
  } catch (err) {
    console.error('Erro ao rodar curadoria:', err)
    alert('Erro ao processar curadoria: ' + (err && err.message ? err.message : String(err)))
  }
}

async function updateAllAcclaim() {
  if (!currentAlbums || currentAlbums.length === 0) {
    alert('Nenhum álbum carregado para atualizar aclamação.')
    return
  }
  if (!confirm(`Atualizar aclamação para todos os ${currentAlbums.length} álbuns? Isso fará chamadas ao serviço de IA.`)) return

  // Disable button while running
  if (updateAcclaimBtn) {
    updateAcclaimBtn.disabled = true
    updateAcclaimBtn.classList.add('opacity-50', 'cursor-not-allowed')
    updateAcclaimBtn.textContent = 'Atualizando...'
  }

  try {
    const queries = currentAlbums.map(a => `${a.artist || ''} - ${a.title || ''}`)
    const results = await fetchMultipleAlbumMetadata(queries, {
      concurrency: 2,
      retries: 2,
      backoffMs: 800,
      onProgress: (index, success, payload) => {
        // update footer log with live progress
        try { addFooterLog(`Atualizando aclamação — progresso: ${index + 1}/${queries.length}`) } catch (e) { console.debug('progress log error', e) }
      }
    })

    // Merge results into currentAlbums
    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (r && r.success && r.data) {
        // find album by title/artist and replace rankingAcclaim + rankingConsolidated
        const returned = r.data
        const idx = currentAlbums.findIndex(al => (al.id && al.id === returned.id) || ((al.title === returned.title) && (al.artist === returned.artist)))
        if (idx > -1) {
          currentAlbums[idx].rankingAcclaim = returned.rankingAcclaim || []
          currentAlbums[idx].rankingSources = returned.rankingSources || []
          // also copy consolidated if present
          currentAlbums[idx].rankingConsolidated = returned.rankingConsolidated || []
        } else {
          // fallback: update by position
          currentAlbums[i].rankingAcclaim = returned.rankingAcclaim || []
          currentAlbums[i].rankingSources = returned.rankingSources || []
          currentAlbums[i].rankingConsolidated = returned.rankingConsolidated || []
        }
      }
    }

    // Recompute client-side aggregates and save
    currentRankingAcclaim = collectRankingAcclaim(currentAlbums)
    resetSaveButton && resetSaveButton()

    const engine = new CurationEngine()
    const result = engine.curate(currentAlbums)
    currentPlaylists = result.playlists
    currentRankingSummary = result.rankingSummary
    currentRankingSources = result.rankingSources

    renderPlaylistsView(currentPlaylists)
    toggleView()
    alert('Atualização de aclamação concluída. Firestore atualizado.')
  } catch (err) {
    console.error('Erro ao atualizar aclamação:', err)
    alert('Erro ao atualizar aclamação: ' + (err && err.message ? err.message : String(err)))
  } finally {
    if (updateAcclaimBtn) {
      updateAcclaimBtn.disabled = false
      updateAcclaimBtn.classList.remove('opacity-50', 'cursor-not-allowed')
      updateAcclaimBtn.textContent = 'Atualizar Aclamação'
    }
  }
}

async function saveDataToFirestore(albums, playlists, rankingSummary = {}, rankingSources = []) {
  if (!userId) return console.error('Usuário não autenticado.')
  try {
    const albumsData = { data: JSON.parse(JSON.stringify(albums)) }
    const playlistsData = {
      data: JSON.parse(JSON.stringify(playlists)),
      rankingSummary: JSON.parse(JSON.stringify(rankingSummary)),
      rankingSources: JSON.parse(JSON.stringify(rankingSources))
    }
    await setDoc(albumsDocRef, albumsData)
    await setDoc(playlistsDocRef, playlistsData)
  } catch (err) { console.error('Erro ao salvar:', err) }
}

function loadData() {
  albumsDocRef = doc(db, `artifacts/${appId}/users/${userId}/curator/albums`)
  playlistsDocRef = doc(db, `artifacts/${appId}/users/${userId}/curator/playlists`)

  if (unsubscribeAlbums) unsubscribeAlbums()
  unsubscribeAlbums = onSnapshot(albumsDocRef, (docSnap) => {
    loadingSpinner.classList.add('hidden')
    // Handle both cases: doc missing OR doc exists but contains empty data array
    if (docSnap.exists()) {
      const payload = docSnap.data() || {}
      const albumsFromDoc = Array.isArray(payload.data) ? payload.data : []
      currentAlbums = albumsFromDoc
      currentRankingAcclaim = collectRankingAcclaim(currentAlbums)
      if (!albumsFromDoc || albumsFromDoc.length === 0) {
        console.log('loadData: document exists but no albums; opening input modal')
        openDataModal()
      }
    } else {
      currentAlbums = []
      currentRankingAcclaim = []
      console.log('loadData: no albums document found; opening input modal')
      openDataModal()
    }
    renderAlbumsView(currentAlbums)
  }, (error) => { console.error('Erro ao carregar álbuns:', error); alert('Erro ao carregar dados dos álbuns.') })

  if (unsubscribePlaylists) unsubscribePlaylists()
  unsubscribePlaylists = onSnapshot(playlistsDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const payload = docSnap.data() || {}
      currentPlaylists = payload.data || []
      currentRankingSummary = payload.rankingSummary || {}
      currentRankingSources = payload.rankingSources || []
    } else {
      currentPlaylists = []
      currentRankingSummary = {}
      currentRankingSources = []
    }
    if (!isAlbumsView) renderPlaylistsView(currentPlaylists)
  }, (error) => { console.error('Erro ao carregar playlists:', error); alert('Erro ao carregar dados das playlists.') })
}

async function initializeAppContainer() {
  setLogLevel('Debug')
  try { app = initializeApp(firebaseConfig); db = getFirestore(app); auth = getAuth(app) } catch (error) { console.error('Erro ao inicializar Firebase:', error); mainContent.innerHTML = '<p class="text-red-400 text-center">Erro crítico ao conectar com o Firebase.</p>'; loadingSpinner.classList.add('hidden'); return }

  mainContent = document.getElementById('main-content')
  loadingSpinner = document.getElementById('loading-spinner')
  albumsView = document.getElementById('albums-view')
  playlistsView = document.getElementById('playlists-view')
  albumsGrid = document.getElementById('albums-grid')
  playlistsGrid = document.getElementById('playlists-grid')
  toggleViewBtn = document.getElementById('toggleViewBtn')
  generateBtn = document.getElementById('generateBtn')
  generateQuickBtn = document.getElementById('generateQuickBtn')
  saveBtn = document.getElementById('saveBtn')
  albumsSummary = document.getElementById('albums-summary')
  playlistsSummary = document.getElementById('playlists-summary')

  loadDataBtn = document.getElementById('loadDataBtn')
  updateAcclaimBtn = document.getElementById('updateAcclaimBtn')
  dataModal = document.getElementById('dataModal')
  closeModalBtn = document.getElementById('closeModalBtn')
  cancelModalBtn = document.getElementById('cancelModalBtn')
  processJsonBtn = document.getElementById('processJsonBtn')
  jsonInput = document.getElementById('jsonInput')
  jsonError = document.getElementById('jsonError')
  emptyStateCta = document.getElementById('emptyStateCta')
  emptyStateBtn = document.getElementById('emptyStateBtn')
  rankingPanel = document.getElementById('rankingPanel')
  rankingSourcesList = document.getElementById('rankingSourcesList')
  rankingSummaryList = document.getElementById('rankingSummaryList')
  rankingAcclaimList = document.getElementById('rankingAcclaimList')
  // Footer log elements (optional, added in HTML)
  footerLastUpdateEl = document.getElementById('footerLastUpdate')
  footerLogToggleEl = document.getElementById('footerLogToggle')
  footerLogEl = document.getElementById('footerLog')
  if (footerLogToggleEl && footerLogEl) footerLogToggleEl.addEventListener('click', () => footerLogEl.classList.toggle('hidden'))

  toggleViewBtn.addEventListener('click', toggleView)
  if (generateBtn) generateBtn.addEventListener('click', runHybridCuration)
  if (generateQuickBtn) generateQuickBtn.addEventListener('click', runHybridCuration)
  saveBtn.addEventListener('click', () => saveDataToFirestore(currentAlbums, currentPlaylists, currentRankingSummary, currentRankingSources))
  loadDataBtn.addEventListener('click', openDataModal)
  if (updateAcclaimBtn) updateAcclaimBtn.addEventListener('click', updateAllAcclaim)
  closeModalBtn.addEventListener('click', closeDataModal)
  cancelModalBtn.addEventListener('click', closeDataModal)
  processJsonBtn.addEventListener('click', processAndSaveJSON)
  if (emptyStateBtn) emptyStateBtn.addEventListener('click', openDataModal)

  setGenerateButtonsState(false)
  refreshToggleViewButtonState()

  try {
    if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) await signInWithCustomToken(auth, window.__initial_auth_token)
    else await signInAnonymously(auth)
  } catch (error) {
    console.error('Erro na autenticação:', error)
    loadingSpinner.classList.add('hidden')
    mainContent.innerHTML = '<p class="text-red-400 text-center">Erro de autenticação. O app não pode carregar.</p>'
    return
  }

  onAuthStateChanged(auth, (user) => {
    if (user) { userId = user.uid; albumsView.classList.remove('hidden'); loadData() } else { userId = null; if (unsubscribeAlbums) unsubscribeAlbums(); if (unsubscribePlaylists) unsubscribePlaylists() }
  })
}

function openDataModal() {
  if (!dataModal) return
  dataModal.classList.remove('hidden')
  dataModal.classList.add('visible')
}

function closeDataModal() {
  if (!dataModal) return
  dataModal.classList.add('hidden')
  dataModal.classList.remove('visible')
}

function robustInit() {
  let attempts = 0; const maxAttempts = 100
  const interval = setInterval(() => {
    attempts++
    if (typeof window.Sortable !== 'undefined') { clearInterval(interval); initializeAppContainer() } else if (attempts > maxAttempts) { clearInterval(interval); loadingSpinner && loadingSpinner.classList.add('hidden'); mainContent && (mainContent.innerHTML = '<p class="text-red-400 text-center">Erro crítico: Sortable.js falhou ao carregar.</p>') }
  }, 100)
}

document.addEventListener('DOMContentLoaded', () => { robustInit() })
