# Album Caching Strategy - Análise Detalhada

**Contexto**: Decidir se e como fazer cache de dados de álbuns buscados da API

---

## TL;DR - Recomendação

✅ **SIM, fazer caching com estratégia híbrida**:
- localStorage para persistência entre sessões
- Memory cache para performance intra-sessão
- TTL de 7 dias (configurável)
- Cache busting manual (botão refresh)

**Razão**: Balance entre UX (fast) e freshness (dados atualizados)

---

## Problema a Resolver

### Cenário Típico

Usuário cria série com 5 álbuns:
1. Primeira vez: Busca via API (~5-15 segundos)
2. Volta à página Albums: **Buscar de novo?**
3. Refresh browser: **Buscar de novo?**
4. Amanhã acessa de novo: **Buscar de novo?**

**Sem cache**: Re-fetch toda vez = lento, desperdício de API calls, bad UX  
**Com cache**: Instant load = fast, menos API calls, better UX

---

## Opção 1: Sem Cache (Status Quo)

### Como Funciona
```javascript
// Toda vez que abre AlbumsView:
await apiClient.fetchMultipleAlbums(queries)
// Sempre busca API fresh
```

### ✅ Vantagens
1. **Sempre atualizado** - Dados sempre fresh do backend
2. **Simples** - Sem complexidade de invalidação
3. **Sem stale data** - Nunca mostra dados velhos

### ❌ Desvantagens
1. **Lento** - 5-15 segundos toda vez
2. **Desperdício** - Dados raramente mudam (BestEverAlbums é estável)
3. **Bad UX** - Loading toda vez, mesmo para dados já vistos
4. **API overload** - Múltiplas chamadas desnecessárias
5. **Custo** - Se Gemini API cobrar por call, $$$

### Quando Usar
- Somente se dados mudam muito frequentemente
- APIs grátis e super rápidas
- Não é o nosso caso! ❌

---

## Opção 2: Cache Agressivo (localStorage, sem TTL)

### Como Funciona
```javascript
// Primeira vez:
const cached = localStorage.getItem(`album_${query}`)
if (cached) {
  return JSON.parse(cached) // Instant!
}

const album = await apiClient.fetchAlbum(query)
localStorage.setItem(`album_${query}`, JSON.stringify(album))
return album
```

### ✅ Vantagens
1. **Super rápido** - Instant load após primeira busca
2. **Offline-ready** - Funciona sem conexão
3. **Zero API calls** - Após primeira vez

### ❌ Desvantagens
1. **Stale data** - Se BestEverAlbums atualizar ranking, não vê
2. **localStorage limits** - Apenas 5-10 MB
3. **Sem refresh** - Usuário preso com dados velhos
4. **Bug fix nightmare** - Se API mudar formato, cache quebra

### Quando Usar
- Dados 100% estáticos
- localStorage suficiente
- Não é ideal para nós (BestEver pode atualizar)

---

## Opção 3: Cache com TTL (Time-To-Live) ✅ Recomendado

### Como Funciona
```javascript
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 dias em ms

function getCachedAlbum(query) {
  const cached = localStorage.getItem(`album_${query}`)
  if (!cached) return null

  const { data, timestamp } = JSON.parse(cached)
  
  // Verificar se expirou
  if (Date.now() - timestamp > CACHE_TTL) {
    localStorage.removeItem(`album_${query}`)
    return null // Expirou, buscar de novo
  }

  return data // Válido!
}

function setCachedAlbum(query, album) {
  localStorage.setItem(`album_${query}`, JSON.stringify({
    data: album,
    timestamp: Date.now()
  }))
}

// Uso:
async function fetchAlbum(query) {
  const cached = getCachedAlbum(query)
  if (cached) {
    console.log('✅ Cache hit:', query)
    return cached
  }

  console.log('🌐 Cache miss, fetching:', query)
  const album = await apiClient.fetchAlbum(query)
  setCachedAlbum(query, album)
  return album
}
```

### ✅ Vantagens
1. **Fast** - Instant se dentro do TTL
2. **Fresh** - Atualiza após TTL expirar
3. **Balanceado** - Best of both worlds
4. **Configurável** - TTL ajustável

### ❌ Desvantagens
1. **Complexidade** - Precisa gerenciar TTL
2. **Ainda pode estar stale** - Dentro do TTL, dados podem estar desatualizados
3. **localStorage management** - Precisa limpar dados velhos

### TTL Ideal para Nosso Caso

**BestEverAlbums rankings**:
- Atualizam raramente (semanas/meses)
- **TTL sugerido**: 7 dias

**AI-generated rankings**:
- Podem variar em re-run
- **TTL sugerido**: 3 dias (mais conservador)

**Compromisso**: **7 dias para todos**
- Usuário não espera rankings mudarem dia a dia
- Se quiser fresh, botão "Refresh"

---

## Opção 4: Cache Híbrido (Memory + localStorage) ✅✅ Melhor Opção

### Como Funciona

**2 níveis de cache**:
1. **Memory cache** (RAM) - Super rápido, session-only
2. **localStorage** - Persiste entre sessões, com TTL

```javascript
class AlbumCache {
  constructor() {
    this.memoryCache = new Map() // L1 cache (RAM)
    this.ttl = 7 * 24 * 60 * 60 * 1000 // 7 dias
  }

  /**
   * Get album from cache (memory first, then localStorage)
   */
  get(query) {
    // L1: Check memory cache
    if (this.memoryCache.has(query)) {
      console.log('✅ L1 cache hit (memory):', query)
      return this.memoryCache.get(query)
    }

    // L2: Check localStorage
    const storageKey = `album_${this.normalizeKey(query)}`
    const cached = localStorage.getItem(storageKey)
    
    if (!cached) return null

    try {
      const { data, timestamp } = JSON.parse(cached)
      
      // Check TTL
      if (Date.now() - timestamp > this.ttl) {
        console.log('⏰ Cache expired:', query)
        localStorage.removeItem(storageKey)
        return null
      }

      console.log('✅ L2 cache hit (localStorage):', query)
      
      // Promote to L1 cache
      this.memoryCache.set(query, data)
      
      return data
    } catch (error) {
      console.warn('Cache parse error:', error)
      localStorage.removeItem(storageKey)
      return null
    }
  }

  /**
   * Set album in cache (both levels)
   */
  set(query, album) {
    // L1: Memory cache
    this.memoryCache.set(query, album)

    // L2: localStorage
    const storageKey = `album_${this.normalizeKey(query)}`
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        data: album,
        timestamp: Date.now(),
        version: '2.0' // Para futuras migrações
      }))
      console.log('💾 Cached:', query)
    } catch (error) {
      console.warn('localStorage full, clearing old entries:', error)
      this.clearOldEntries()
      // Retry
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          data: album,
          timestamp: Date.now(),
          version: '2.0'
        }))
      } catch (retryError) {
        console.error('Failed to cache even after cleanup:', retryError)
      }
    }
  }

  /**
   * Clear specific album cache
   */
  invalidate(query) {
    this.memoryCache.delete(query)
    const storageKey = `album_${this.normalizeKey(query)}`
    localStorage.removeItem(storageKey)
  }

  /**
   * Clear all cached albums
   */
  clearAll() {
    this.memoryCache.clear()
    
    // Clear all album_* keys from localStorage
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('album_')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    console.log('🗑️ Cleared all album cache')
  }

  /**
   * Clear expired entries
   */
  clearExpired() {
    let cleared = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key.startsWith('album_')) continue

      try {
        const cached = JSON.parse(localStorage.getItem(key))
        if (Date.now() - cached.timestamp > this.ttl) {
          localStorage.removeItem(key)
          cleared++
        }
      } catch (error) {
        localStorage.removeItem(key) // Remove corrupted
        cleared++
      }
    }
    console.log(`🗑️ Cleared ${cleared} expired entries`)
  }

  /**
   * Clear oldest entries to free space
   */
  clearOldEntries(count = 5) {
    const entries = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key.startsWith('album_')) continue

      try {
        const cached = JSON.parse(localStorage.getItem(key))
        entries.push({ key, timestamp: cached.timestamp })
      } catch (error) {
        localStorage.removeItem(key)
      }
    }

    // Sort by oldest first
    entries.sort((a, b) => a.timestamp - b.timestamp)
    
    // Remove oldest N entries
    entries.slice(0, count).forEach(({ key }) => {
      localStorage.removeItem(key)
    })
    
    console.log(`🗑️ Cleared ${count} oldest entries`)
  }

  /**
   * Normalize cache key
   */
  normalizeKey(query) {
    return query.toLowerCase().replace(/\s+/g, '_')
  }

  /**
   * Get cache stats
   */
  getStats() {
    let localStorageCount = 0
    let totalSize = 0

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key.startsWith('album_')) continue

      localStorageCount++
      totalSize += localStorage.getItem(key).length
    }

    return {
      memoryCount: this.memoryCache.size,
      localStorageCount,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      ttlDays: this.ttl / (24 * 60 * 60 * 1000)
    }
  }
}

// Singleton
export const albumCache = new AlbumCache()
```

### ✅ Vantagens
1. **Super fast** - L1 cache (memory) é instant
2. **Persiste** - L2 cache (localStorage) sobrevive refresh
3. **Fresh** - TTL de 7 dias garante atualização
4. **Resiliente** - Lida com localStorage full
5. **Debuggable** - Stats e clear methods
6. **Configurável** - TTL ajustável

### ❌ Desvantagens
1. **Mais complexo** - Dois níveis de cache
2. **Mais código** - ~150 linhas

### Por Que É a Melhor Opção?

```
┌─────────────────────────────────────────────────┐
│ User Journey                                    │
├─────────────────────────────────────────────────┤
│ 1. Cria série com 5 álbuns                      │
│    → API call (5-15 sec)                        │
│    → Save to L1 + L2 cache                      │
│                                                 │
│ 2. Navega para AlbumsView                       │
│    → L1 cache hit (INSTANT!) ✨                 │
│                                                 │
│ 3. Refresh browser                              │
│    → L1 empty (refresh cleared memory)          │
│    → L2 cache hit (100ms) ✅                    │
│    → Promote to L1                              │
│                                                 │
│ 4. Fecha browser, volta amanhã                  │
│    → L2 cache hit (ainda dentro de 7 dias)      │
│    → Promote to L1                              │
│    → INSTANT UX ✨                               │
│                                                 │
│ 5. Volta depois de 8 dias                       │
│    → L2 cache expired                           │
│    → API call (fetch fresh data)                │
│    → Save to L1 + L2                            │
└─────────────────────────────────────────────────┘
```

---

## localStorage Capacity Management

### Limites
- **Quota**: 5-10 MB típico
- **1 álbum**: ~10-50 KB (dependendo de tracks)
- **Capacidade**: ~100-500 álbuns

### Estratégias se Cheio

1. **LRU (Least Recently Used)**:
   ```javascript
   // Remove álbuns não acessados há mais tempo
   clearOldEntries(5)
   ```

2. **Size-based**:
   ```javascript
   // Remove álbuns maiores primeiro
   // (mais tracks = mais espaço)
   ```

3. **User choice**:
   ```javascript
   // Botão "Clear Cache" nas settings
   ```

**Nossa escolha**: LRU (simples e efetivo)

---

## UI/UX Considerations

### Botão "Refresh"

```javascript
// AlbumsView
<button class="btn btn-secondary" id="refreshBtn">
  🔄 Refresh Data
</button>

// Handler
this.on(refreshBtn, 'click', async () => {
  const activeSeries = seriesStore.getActiveSeries()
  
  if (confirm('Re-fetch all albums from API? This may take a while.')) {
    // Clear cache for this series
    activeSeries.albumQueries.forEach(query => {
      albumCache.invalidate(query)
    })
    
    // Re-fetch
    await this.loadAlbumsFromQueries(activeSeries.albumQueries)
  }
})
```

### Cache Status Indicator

```javascript
// Mostrar se veio de cache
<div class="album-card">
  ${album._cached ? 
    '<span class="cache-badge">💾 Cached</span>' : 
    '<span class="cache-badge">🌐 Fresh</span>'
  }
</div>
```

### Settings Panel (futuro)

```
Settings
├─ Cache TTL: [7 days ▼]
├─ Cache size: 2.3 MB / 5 MB
├─ Cached albums: 23
└─ [Clear All Cache]
```

---

## Implementação Recomendada

### Fase 1: Sprint 3 (Now)
✅ Implementar cache híbrido básico:
- Memory cache (L1)
- localStorage cache (L2) com TTL 7 dias
- Auto clear de expired entries

### Fase 2: Sprint 4
➕ Adicionar UI:
- Botão "Refresh"
- Cache status badges

### Fase 3: Sprint 5
➕ Adicionar Settings:
- TTL configurável
- Cache stats
- Clear cache button

---

## Comparação Final

| Feature | Sem Cache | Cache Agressivo | Cache TTL | Cache Híbrido |
|---------|-----------|----------------|-----------|---------------|
| **Speed (primeira vez)** | 5-15s | 5-15s | 5-15s | 5-15s |
| **Speed (segunda vez)** | 5-15s | Instant | Instant* | Instant |
| **Speed (após refresh)** | 5-15s | Instant | Instant* | 100ms** |
| **Freshness** | ✅ Always | ❌ Never | ⚠️ 7 days | ⚠️ 7 days |
| **API calls** | Muitos | Mínimo | Médio | Médio |
| **Complexidade** | Simples | Simples | Média | Alta |
| **Offline** | ❌ | ✅ | ✅ | ✅ |
| **localStorage usage** | Nenhum | Alto | Alto | Alto |
| **User control** | N/A | ❌ | ⚠️ | ✅ |

*Se dentro do TTL  
**L2 hit, depois instant via L1

---

## Minha Recomendação Final

✅ **Cache Híbrido (Memory + localStorage) com TTL 7 dias**

**Justificativa**:
1. Melhor UX (instant após primeira busca)
2. Dados reasonably fresh (7 dias suficiente para rankings)
3. Offline-capable
4. User control (refresh button)
5. Future-proof (pode adicionar settings)

**Trade-offs aceitáveis**:
- 150 linhas de código extra
- localStorage pode encher (mas temos LRU)
- Dados podem estar até 7 dias desatualizados (mas user pode refresh)

**Implementação**:
- Sprint 3: Cache básico
- Sprint 4: UI controls
- Sprint 5: Settings panel

**Quer seguir com essa estratégia?** 🚀
