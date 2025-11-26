# Apple Music Integration - Impactos Arquiteturais

**Contexto**: Integração futura com Apple Music API para exportar playlists

---

## 🎯 Resumo Executivo

**Mudanças necessárias na arquitetura atual**:

1. ✅ **Routing**: History API (já decidido)
2. ⚠️ **Novo Store**: `AuthStore` para gerenciar Apple Music tokens
3. ⚠️ **Track Matching**: Sistema para mapear tracks → Apple Music IDs
4. ⚠️ **Backend Proxy**: Endpoint para trocar OAuth codes por tokens
5. ✅ **Stores atuais**: PlaylistsStore e AlbumsStore compatíveis!

---

## 1. Autenticação & OAuth Flow

### Arquitetura Necessária

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (SPA)                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AuthStore (novo)                                           │
│  ├─ musicKitToken: string                                   │
│  ├─ musicKitExpiry: Date                                    │
│  ├─ isAuthorized: boolean                                   │
│  └─ refreshToken()                                          │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend (Node.js Express) - NOVO ENDPOINT                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  POST /api/apple-music/token                                │
│  ├─ Input: { code: 'oauth_code' }                           │
│  ├─ Chama Apple Music API (server-to-server)               │
│  └─ Output: { token, refreshToken, expiresIn }             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Impacto: Novo Store Necessário

**Adicionar**: `public/js/stores/auth.js`

```javascript
/**
 * AuthStore
 * Manages Apple Music authentication state
 */

export class AuthStore {
  constructor() {
    this.musicKitToken = null
    this.musicKitExpiry = null
    this.isAuthorized = false
    this.listeners = new Set()
    
    // Load from localStorage on init
    this.loadFromStorage()
  }

  /**
   * Check if token is valid
   */
  isTokenValid() {
    if (!this.musicKitToken || !this.musicKitExpiry) return false
    return new Date() < new Date(this.musicKitExpiry)
  }

  /**
   * Set Apple Music token
   */
  setToken(token, expiresIn) {
    this.musicKitToken = token
    this.musicKitExpiry = new Date(Date.now() + expiresIn * 1000)
    this.isAuthorized = true
    
    this.saveToStorage()
    this.notify()
  }

  /**
   * Clear token (logout)
   */
  clearToken() {
    this.musicKitToken = null
    this.musicKitExpiry = null
    this.isAuthorized = false
    
    localStorage.removeItem('apple_music_token')
    this.notify()
  }

  /**
   * Persist to localStorage
   */
  saveToStorage() {
    localStorage.setItem('apple_music_token', JSON.stringify({
      token: this.musicKitToken,
      expiry: this.musicKitExpiry
    }))
  }

  /**
   * Load from localStorage
   */
  loadFromStorage() {
    const stored = localStorage.getItem('apple_music_token')
    if (stored) {
      const { token, expiry } = JSON.parse(stored)
      this.musicKitToken = token
      this.musicKitExpiry = expiry
      this.isAuthorized = this.isTokenValid()
    }
  }

  // Subscribe/notify pattern (como outros stores)
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notify() {
    this.listeners.forEach(listener => listener(this.getState()))
  }

  getState() {
    return {
      isAuthorized: this.isAuthorized,
      isTokenValid: this.isTokenValid()
    }
  }
}

export const authStore = new AuthStore()
```

**Impacto no Sprint**:
- Sprint 2: ❌ Não necessário (só routing)
- Sprint 5 ou 6: ✅ Adicionar AuthStore + OAuth view

---

## 2. Backend: OAuth Token Exchange

### Problema de Segurança

⚠️ **Não pode fazer OAuth client-side apenas!**

**Razão**: Apple Music OAuth requer `client_secret` que **não pode** estar no frontend.

### Solução: Backend Proxy Endpoint

**Adicionar ao servidor**: `server/index.js`

```javascript
// POST /api/apple-music/token
app.post('/api/apple-music/token', async (req, res) => {
  const { code } = req.body

  try {
    // Exchange code for token (server-to-server)
    const response = await axios.post('https://appleid.apple.com/auth/token', {
      client_id: process.env.APPLE_MUSIC_CLIENT_ID,
      client_secret: process.env.APPLE_MUSIC_CLIENT_SECRET,  // ← SECRETO!
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.APPLE_MUSIC_REDIRECT_URI
    })

    res.json({
      token: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in
    })
  } catch (error) {
    res.status(500).json({ error: 'Token exchange failed' })
  }
})
```

### Variáveis de Ambiente Novas

**Adicionar ao `.env` do servidor**:
```bash
# Apple Music API
APPLE_MUSIC_CLIENT_ID=com.yourapp.musickit
APPLE_MUSIC_CLIENT_SECRET=your-secret-here
APPLE_MUSIC_REDIRECT_URI=https://mjrp-playlist-generator.web.app/auth/callback
```

**Impacto**:
- Backend precisa secrets do Apple Music
- Cloud Run precisa variáveis de ambiente configuradas
- **Sem mudanças no deployment atual** (só adicionar vars)

---

## 3. Track Matching (Crítico!)

### Problema

Suas playlists têm:
```javascript
{
  title: "Comfortably Numb",
  artist: "Pink Floyd",
  album: "The Wall"
}
```

Apple Music precisa:
```javascript
{
  id: "1234567890",  // Apple Music Track ID
  type: "songs"
}
```

**Como mapear?** 🤔

### Solução 1: MusicKit Search API (Recomendado)

**Flow**:
```javascript
// Para cada track na playlist:
async function findAppleMusicTrack(track) {
  const query = `${track.artist} ${track.title}`
  
  const response = await fetch(
    `https://api.music.apple.com/v1/catalog/us/search?` +
    `types=songs&term=${encodeURIComponent(query)}`,
    {
      headers: {
        'Authorization': `Bearer ${musicKitDeveloperToken}`,
        'Music-User-Token': userToken
      }
    }
  )

  const results = response.data.results.songs.data
  
  // Match mais próximo
  const match = results.find(song => 
    song.attributes.name.toLowerCase() === track.title.toLowerCase() &&
    song.attributes.artistName.toLowerCase() === track.artist.toLowerCase()
  )

  return match ? match.id : null
}
```

**Impacto na arquitetura**:
- Precisa fazer N buscas (N = número de tracks)
- Rate limiting: Apple Music limita requests
- **Solução**: Fazer batch com delay entre buscas

### Solução 2: ISRC Codes (Ideal, mas requer enriquecimento)

**ISRC** = International Standard Recording Code (identificador único de gravação)

```javascript
{
  title: "Comfortably Numb",
  isrc: "GBUM71029604"  // ← Código universal
}
```

Apple Music aceita search por ISRC:
```javascript
const response = await fetch(
  `https://api.music.apple.com/v1/catalog/us/songs?filter[isrc]=${isrc}`
)
// Match perfeito, sem ambiguidade!
```

**Como obter ISRC?**
- Gemini AI pode incluir no metadata?  
- Spotify API tem ISRC (pode adicionar como fonte)
- MusicBrainz API (open source)

**Impacto**:
- **Sprint 1-2**: Não necessário
- **Sprint 5**: Adicionar campo `isrc` aos tracks
- **Futuro**: Enriquecer tracks com ISRC durante geração

### Recomendação Arquitetural

**Adicionar campo opcional aos tracks**:

```javascript
// AlbumsStore tracks structure (futuro)
{
  title: "Comfortably Numb",
  artist: "Pink Floyd",
  album: "The Wall",
  duration: 382,
  rank: 1,
  rating: 97,
  
  // Novos campos para integração
  isrc: "GBUM71029604",           // ← Adicionar quando disponível
  appleMusicId: "1440806041",     // ← Cache do match
  spotifyId: "x1Ha6kEHXe...",     // ← Futuro: Spotify integration
}
```

**Por quê?**
- ISRC = match perfeito
- Cache IDs = evita re-search toda vez
- Extensível para Spotify, YouTube Music, etc.

---

## 4. Playlist Creation API

### MusicKit JS (Frontend)

Apple disponibiliza SDK JavaScript: **MusicKit JS**

**Como funciona**:
```javascript
// 1. Inicializar MusicKit
await MusicKit.configure({
  developerToken: 'YOUR_DEVELOPER_TOKEN',  // ← Backend fornece
  app: {
    name: 'MJRP Playlist Generator',
    build: '2.0.0'
  }
})

const music = MusicKit.getInstance()

// 2. Autorizar usuário
await music.authorize()

// 3. Criar playlist
const playlist = await music.api.music('/v1/me/library/playlists', {
  method: 'POST',
  body: {
    attributes: {
      name: 'Classic Rock - P1',
      description: 'Generated by MJRP Playlist Generator'
    },
    relationships: {
      tracks: {
        data: [
          { id: '1440806041', type: 'songs' },
          { id: '1440805726', type: 'songs' }
          // ... mais tracks
        ]
      }
    }
  }
})
```

### Impacto Arquitetural

**Adicionar nova view**: `ExportView`

```javascript
// public/js/views/ExportView.js
export class ExportView extends BaseView {
  async render(params) {
    const playlists = playlistsStore.getPlaylists()
    
    return `
      <div class="export-view">
        <h2>Export to Apple Music</h2>
        
        ${playlists.map((playlist, idx) => `
          <div class="playlist-export-card">
            <h3>${playlist.name}</h3>
            <p>${playlist.tracks.length} tracks</p>
            
            <button 
              class="btn btn-primary"
              data-playlist-index="${idx}"
              data-action="export-apple-music">
              Export to Apple Music
            </button>
            
            <div id="status-${idx}" class="export-status"></div>
          </div>
        `).join('')}
      </div>
    `
  }

  async mount() {
    this.container = document.getElementById('app')
    
    // Event delegation para export buttons
    this.container.addEventListener('click', async (e) => {
      if (e.target.dataset.action === 'export-apple-music') {
        const playlistIndex = e.target.dataset.playlistIndex
        await this.exportToAppleMusic(playlistIndex)
      }
    })
  }

  async exportToAppleMusic(playlistIndex) {
    const playlist = playlistsStore.getPlaylists()[playlistIndex]
    const statusEl = this.$(`#status-${playlistIndex}`)
    
    try {
      statusEl.innerHTML = 'Matching tracks...'
      
      // 1. Match tracks to Apple Music IDs
      const trackIds = []
      for (const track of playlist.tracks) {
        const appleMusicId = await this.findAppleMusicTrack(track)
        if (appleMusicId) {
          trackIds.push(appleMusicId)
        }
        statusEl.innerHTML = `Matched ${trackIds.length}/${playlist.tracks.length} tracks`
      }
      
      // 2. Create playlist via MusicKit
      statusEl.innerHTML = 'Creating playlist...'
      const music = MusicKit.getInstance()
      
      await music.api.music('/v1/me/library/playlists', {
        method: 'POST',
        body: {
          attributes: {
            name: playlist.name,
            description: 'Generated by MJRP Playlist Generator'
          },
          relationships: {
            tracks: {
              data: trackIds.map(id => ({ id, type: 'songs' }))
            }
          }
        }
      })
      
      statusEl.innerHTML = '✅ Playlist created successfully!'
    } catch (error) {
      statusEl.innerHTML = `❌ Error: ${error.message}`
    }
  }

  async findAppleMusicTrack(track) {
    // Implementar search (como descrito acima)
  }
}
```

---

## 5. Rate Limiting & Performance

### Problema

Apple Music API tem limites:
- **Search**: ~20 requests/segundo
- **Playlist creation**: ~10 requests/segundo

Se playlist tem 50 tracks = 50 searches!

### Solução: Queue System

**Adicionar utilitário**: `public/js/utils/apiQueue.js`

```javascript
/**
 * API Queue
 * Rate-limited request queue
 */

export class ApiQueue {
  constructor(maxConcurrent = 5, delayMs = 200) {
    this.maxConcurrent = maxConcurrent
    this.delayMs = delayMs
    this.queue = []
    this.running = 0
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject })
      this.process()
    })
  }

  async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    this.running++
    const { fn, resolve, reject } = this.queue.shift()

    try {
      const result = await fn()
      resolve(result)
    } catch (error) {
      reject(error)
    } finally {
      this.running--
      setTimeout(() => this.process(), this.delayMs)
    }
  }
}

// Singleton for Apple Music API calls
export const appleMusicQueue = new ApiQueue(5, 200)
```

**Uso**:
```javascript
// Em vez de chamar direto:
const result = await findAppleMusicTrack(track)

// Usar queue:
const result = await appleMusicQueue.add(() => findAppleMusicTrack(track))
```

---

## 6. Resumo de Mudanças Arquiteturais

### Stores

| Store | Mudança | Quando |
|-------|---------|--------|
| AlbumsStore | Adicionar `isrc`, `appleMusicId` aos tracks | Sprint 5 |
| PlaylistsStore | ✅ Sem mudanças | - |
| SeriesStore | ✅ Sem mudanças | - |
| **AuthStore** (novo) | Gerenciar Apple Music auth | Sprint 5/6 |

### Backend

| Endpoint | Propósito | Quando |
|----------|-----------|--------|
| **POST /api/apple-music/token** | OAuth token exchange | Sprint 5/6 |
| **GET /api/apple-music/developer-token** | Fornecer developer token | Sprint 5/6 |

### Views

| View | Propósito | Quando |
|------|-----------|--------|
| **AuthCallbackView** | Handle OAuth redirect | Sprint 5/6 |
| **ExportView** | Export playlists | Sprint 5/6 |

### Utils

| Util | Propósito | Quando |
|------|-----------|--------|
| **apiQueue.js** | Rate-limited requests | Sprint 5/6 |
| **trackMatcher.js** | Match tracks to Apple Music | Sprint 5/6 |

---

## 7. Decisões Arquiteturais para Sprint 2

### ✅ O que fazer AGORA

1. **Router com History API** (já decidido)
2. **Views com lifecycle** (render/mount/destroy)
3. **Stores pattern consistente** (já temos)

### ⏳ O que deixar para depois

1. AuthStore (Sprint 5/6)
2. Backend OAuth endpoint (Sprint 5/6)
3. Track matching system (Sprint 5/6)
4. MusicKit integration (Sprint 5/6)

### 🎯 Preparação Futura

**Para facilitar integração futura, adicionar agora**:

1. **Track metadata extensível**:
   ```javascript
   // Em vez de objeto rígido:
   { title, artist, album }
   
   // Usar objeto extensível:
   {
     title,
     artist,
     album,
     metadata: {  // ← Campo para futuras integrações
       isrc: null,
       appleMusicId: null,
       spotifyId: null
     }
   }
   ```

2. **Export button placeholder** (desabilitado):
   ```javascript
   // PlaylistsView
   <button disabled class="btn btn-secondary" title="Coming soon">
     Export to Apple Music (Soon)
   </button>
   ```

---

## 8. Custo de Implementação

### Sprint 2 (Agora)
- ✅ History API: +15 linhas no router
- ✅ Track metadata extensível: +5 linhas nos stores

**Total**: ~20 linhas extras, zero complexidade adicional

### Sprint 5/6 (Integração Apple Music)
- AuthStore: ~150 linhas
- Backend endpoints: ~100 linhas
- ExportView: ~200 linhas
- Track matching: ~100 linhas
- Utils (queue, etc.): ~100 linhas

**Total**: ~650 linhas, 1-2 semanas de trabalho

---

## ✅ Conclusão

**Arquitetura atual (Sprint 1-2) está compatível!**

**Mudanças mínimas necessárias agora**:
1. ✅ History API (já decidido)
2. Track metadata extensível (opcional, mas recomendado)

**Tudo mais pode esperar Sprint 5/6** sem impacto na arquitetura base.

**Seu design está futuro-proof!** 🎉
