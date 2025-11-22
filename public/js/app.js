// public/js/app.js
// App entrypoint module extracted from hybrid-curator.html

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js'
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js'
import { getFirestore, doc, setDoc, onSnapshot, setLogLevel } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'

import { fetchAlbumMetadata } from './api.js'
import { curateAlbums } from './curation.js'

const firebaseConfig = window.__firebase_config
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'

let app, auth, db
let userId

let albumsDocRef
let playlistsDocRef

let currentAlbums = []
let currentPlaylists = []
let isAlbumsView = true
const sortableInstances = []
let unsubscribeAlbums = null
let unsubscribePlaylists = null

// UI elements
let mainContent, loadingSpinner, albumsView, playlistsView, albumsGrid, playlistsGrid
let toggleViewBtn, generateBtn, saveBtn, saveText, saveIcon
let albumsSummary, playlistsSummary
let loadDataBtn, dataModal, closeModalBtn, cancelModalBtn, processJsonBtn, jsonInput, jsonError

function formatDuration (seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

function calculateTotalDuration (tracks) {
  return (tracks || []).reduce((s, x) => s + (x.duration || 0), 0)
}

async function processAndSaveJSON () {
  const originalBtnText = processJsonBtn.textContent
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

    if (newAlbums.length === 0) throw new Error('Nenhum álbum foi encontrado.')

    await saveDataToFirestore(newAlbums, currentPlaylists)
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

function renderAlbumsView (albums) {
  albumsGrid.innerHTML = ''
  if (!albums || albums.length === 0) {
    albumsGrid.innerHTML = '<p class="text-spotify-lightgray col-span-full text-center">Nenhum álbum carregado. Clique em \"Carregar Dados\" para começar.</p>'
    albumsSummary.innerHTML = '<p class="text-center text-spotify-lightgray">Nenhum dado de origem.</p>'
    return
  }

  let totalTracks = 0
  let totalDuration = 0

  albums.forEach(album => {
    if (!album) return
    const albumTracks = album.tracks || []
    const albumDuration = calculateTotalDuration(albumTracks)
    totalTracks += albumTracks.length
    totalDuration += albumDuration

    const albumCard = document.createElement('div')
    albumCard.className = 'bg-spotify-lightdark p-4 rounded-lg shadow-lg flex flex-col transition-shadow hover:shadow-xl'
    albumCard.innerHTML = `
            <div class="flex items-center mb-4">
                <img src="${album.cover || 'https://placehold.co/100x100/333/888?text=Capa'}" alt="Capa do ${album.title}" class="w-20 h-20 rounded-md mr-4 object-cover" onerror="this.src='https://placehold.co/100x100/333/888?text=Capa'">
                <div>
                    <h3 class="text-xl font-bold text-white">${album.title || 'Título Desconhecido'}</h3>
                    <p class="text-sm text-spotify-lightgray">${album.artist || 'Artista Desconhecido'} (${album.year || '----'})</p>
                </div>
            </div>
            <div class="border-t border-spotify-gray pt-2">
                <div class="flex justify-between text-sm text-spotify-lightgray mb-2 px-2">
                    <span class="font-semibold">#</span>
                    <span class="flex-1 ml-4 font-semibold">Faixa</span>
                    <span class="font-semibold">Duração</span>
                </div>
                <ul class="space-y-1">
                    ${albumTracks.sort((a, b) => (a.rank || 99) - (b.rank || 99)).map(track => `
                        <li class="flex justify-between items-center p-2 rounded-md hover:bg-spotify-gray">
                            <span class="text-spotify-lightgray w-6 text-center">${track.rank || '-'}</span>
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
        <h3 class="text-lg font-semibold text-white mb-2">Resumo dos Álbuns (Origem)</h3>
        <div class="grid grid-cols-3 gap-4 text-center">
            <div>
                <p class="text-sm text-spotify-lightgray">Total de Álbuns:</p>
                <p class="text-2xl font-bold text-white">${albums.length}</p>
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
}

/**
 * Helper para renderizar um item de faixa (usado no Sortable)
 */
function renderTrackItem (track) {
  // Encontra o álbum original da faixa
  const originAlbum = currentAlbums.find(a => a.tracks && a.tracks.some(t => t.id === track.id))
  const albumTitle = originAlbum ? originAlbum.title : 'N/A'

  return `
        <li class="track-item flex justify-between items-center p-2 rounded-md hover:bg-spotify-gray" data-track-id="${track.id}">
            <div class="flex-1 truncate mr-2">
                <p class="text-white truncate" title="${track.title}">${track.title || 'Faixa Desconhecida'}</p>
                <p class="text-xs text-spotify-lightgray">Rank: ${track.rank || '-'}</p>
            </div>
            <span class="text-spotify-lightgray text-sm w-16 truncate text-center" title="${albumTitle}">${albumTitle}</span>
            <span class="text-spotify-lightgray text-sm w-12 text-right">${formatDuration(track.duration)}</span>
        </li>
    `
}

/**
 * Renderiza as playlists na UI (inclui inicialização do Sortable)
 */
function renderPlaylistsView (playlists) {
  playlistsGrid.innerHTML = ''
  if (!playlists || playlists.length === 0) {
    playlistsGrid.innerHTML = '<p class="text-spotify-lightgray col-span-full text-center">Nenhuma playlist gerada.</p>'
    playlistsSummary.innerHTML = '<p class="text-center text-spotify-lightgray">Nenhuma playlist para resumir.</p>'
    return
  }
  let totalTracks = 0
  let totalDuration = 0

  playlists.forEach(playlist => {
    if (!playlist) return
    const playlistTracks = playlist.tracks || []
    const playlistDuration = calculateTotalDuration(playlistTracks)
    totalTracks += playlistTracks.length
    totalDuration += playlistDuration

    const playlistCard = document.createElement('div')
    playlistCard.className = 'bg-spotify-lightdark p-4 rounded-lg shadow-lg flex flex-col'
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
  initSortable()
}

function renderPlaylistsSummary (playlists, totalTracks, totalDuration) {
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

  let verificationHtml = ''
  if (isOk) verificationHtml = '<p class="text-2xl font-bold text-green-400">OK - Totais Batem!</p>'
  else {
    verificationHtml = `
        <p class="text-2xl font-bold text-red-400">ERRO - Totais Divergentes!</p>
        <div class="flex justify-around mt-2 text-sm">
            <p class="text-gray-300">Origem: <span class="font-bold">${originTotalTracks} faixas</span> / <span class="font-bold">${formatDuration(originTotalDuration)}</span></p>
            <p class="text-gray-300">Resultado: <span class="font-bold">${totalTracks} faixas</span> / <span class="font-bold">${formatDuration(totalDuration)}</span></p>
        </div>
    `
  }

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
        <div class="border-t border-spotify-gray pt-4 text-center">
            <h4 class="text-md font-semibold text-white mb-1">Verificação de Integridade</h4>
            ${verificationHtml}
        </div>
    `
}

function toggleView () {
  isAlbumsView = !isAlbumsView
  if (isAlbumsView) {
    albumsView.classList.remove('hidden')
    playlistsView.classList.add('hidden')
    toggleViewBtn.textContent = 'Ver Playlists'
  } else {
    albumsView.classList.add('hidden')
    playlistsView.classList.remove('hidden')
    toggleViewBtn.textContent = 'Ver Álbuns'
    renderPlaylistsView(currentPlaylists)
  }
}

function initSortable () {
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

function handleDragEnd (evt) {
  const trackId = evt.item.dataset.trackId
  const fromListId = evt.from.dataset.playlistId
  const toListId = evt.to.dataset.playlistId
  if (fromListId === toListId) updateTrackOrder(toListId, evt.newIndex, trackId)
  else moveTrackBetweenPlaylists(fromListId, toListId, evt.oldIndex, evt.newIndex, trackId)
  resetSaveButton && resetSaveButton()
}

function updateTrackOrder (playlistId, newIndex, trackId) {
  const playlist = currentPlaylists.find(p => p.id === playlistId)
  if (!playlist) return
  const track = playlist.tracks.find(t => t.id === trackId)
  playlist.tracks = playlist.tracks.filter(t => t.id !== trackId)
  if (track) playlist.tracks.splice(newIndex, 0, track)
  renderPlaylistsView(currentPlaylists)
}

function moveTrackBetweenPlaylists (fromListId, toListId, oldIndex, newIndex, trackId) {
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

async function runHybridCuration () {
  if (!currentAlbums || currentAlbums.length === 0) {
    alert('Nenhum álbum carregado para processar.')
    return
  }
  try {
    const newPlaylists = curateAlbums(currentAlbums, { targetSeconds: 45 * 60 })
    currentPlaylists = newPlaylists
    await saveDataToFirestore(currentAlbums, newPlaylists)
    if (isAlbumsView) toggleView(); else renderPlaylistsView(currentPlaylists)
  } catch (err) {
    console.error('Erro ao rodar curadoria:', err)
    alert('Erro ao processar curadoria: ' + (err && err.message ? err.message : String(err)))
  }
}

async function saveDataToFirestore (albums, playlists) {
  if (!userId) return console.error('Usuário não autenticado.')
  try {
    const albumsData = { data: JSON.parse(JSON.stringify(albums)) }
    const playlistsData = { data: JSON.parse(JSON.stringify(playlists)) }
    await setDoc(albumsDocRef, albumsData)
    await setDoc(playlistsDocRef, playlistsData)
  } catch (err) { console.error('Erro ao salvar:', err) }
}

function loadData () {
  albumsDocRef = doc(db, `artifacts/${appId}/users/${userId}/curator/albums`)
  playlistsDocRef = doc(db, `artifacts/${appId}/users/${userId}/curator/playlists`)

  if (unsubscribeAlbums) unsubscribeAlbums()
  unsubscribeAlbums = onSnapshot(albumsDocRef, (docSnap) => {
    loadingSpinner.classList.add('hidden')
    if (docSnap.exists()) currentAlbums = docSnap.data().data || []
    else { currentAlbums = []; openDataModal() }
    renderAlbumsView(currentAlbums)
  }, (error) => { console.error('Erro ao carregar álbuns:', error); alert('Erro ao carregar dados dos álbuns.') })

  if (unsubscribePlaylists) unsubscribePlaylists()
  unsubscribePlaylists = onSnapshot(playlistsDocRef, (docSnap) => {
    if (docSnap.exists()) currentPlaylists = docSnap.data().data || []
    else currentPlaylists = []
    if (!isAlbumsView) renderPlaylistsView(currentPlaylists)
  }, (error) => { console.error('Erro ao carregar playlists:', error); alert('Erro ao carregar dados das playlists.') })
}

async function initializeAppContainer () {
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
  saveBtn = document.getElementById('saveBtn')
  saveText = document.getElementById('save-text')
  saveIcon = document.getElementById('save-icon')
  albumsSummary = document.getElementById('albums-summary')
  playlistsSummary = document.getElementById('playlists-summary')

  loadDataBtn = document.getElementById('loadDataBtn')
  dataModal = document.getElementById('dataModal')
  closeModalBtn = document.getElementById('closeModalBtn')
  cancelModalBtn = document.getElementById('cancelModalBtn')
  processJsonBtn = document.getElementById('processJsonBtn')
  jsonInput = document.getElementById('jsonInput')
  jsonError = document.getElementById('jsonError')

  toggleViewBtn.addEventListener('click', toggleView)
  generateBtn.addEventListener('click', runHybridCuration)
  saveBtn.addEventListener('click', () => saveDataToFirestore(currentAlbums, currentPlaylists))
  loadDataBtn.addEventListener('click', openDataModal)
  closeModalBtn.addEventListener('click', closeDataModal)
  cancelModalBtn.addEventListener('click', closeDataModal)
  processJsonBtn.addEventListener('click', processAndSaveJSON)

  try {
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token)
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

function openDataModal () { if (dataModal) dataModal.classList.remove('hidden') }
function closeDataModal () { if (dataModal) dataModal.classList.add('hidden') }

function robustInit () {
  let attempts = 0; const maxAttempts = 100
  const interval = setInterval(() => {
    attempts++
    if (typeof window.Sortable !== 'undefined') { clearInterval(interval); initializeAppContainer() } else if (attempts > maxAttempts) { clearInterval(interval); loadingSpinner && loadingSpinner.classList.add('hidden'); mainContent && (mainContent.innerHTML = '<p class="text-red-400 text-center">Erro crítico: Sortable.js falhou ao carregar.</p>') }
  }, 100)
}

document.addEventListener('DOMContentLoaded', () => { robustInit() })
