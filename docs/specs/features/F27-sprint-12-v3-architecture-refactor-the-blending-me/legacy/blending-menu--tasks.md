# Blending Menu - Phase 1: Tasks

**Created**: 2025-12-22  
**Updated**: 2025-12-23  
**Status**: 🟡 PARTIALLY IMPLEMENTED  
**Plan**: [plan.md](./plan.md)  
**Analysis**: [algorithm-analysis.md](./algorithm-analysis.md)

---

## Phase 1A: Algorithm Modularization (Mixin Pattern)

> [!NOTE]
> **Decisão**: Refatorar algoritmos existentes ANTES de criar novos.
> **Pattern**: Mixin/Trait Pattern para manter BaseAlgorithm enxuta.

### 1A.1 Criar Mixins ✅ COMPLETED

#### [NEW] PlaylistBalancingMixin.js (~70 LOC)
- [x] Criar arquivo em `algorithms/mixins/`
- [x] Extrair `runSwapBalancing()` de Legacy/SDraft
- [x] Extrair `isSwapValid()` de Legacy/SDraft
- [x] Exportar como mixin aplicável

#### [NEW] DurationTrimmingMixin.js (~40 LOC)
- [x] Criar arquivo em `algorithms/mixins/`
- [x] Extrair `trimOverDurationPlaylists()` de MJRP/MJRPv0
- [x] Exportar como mixin aplicável

#### [NEW] TrackEnrichmentMixin.js (~185 LOC)
- [x] Criar arquivo em `algorithms/mixins/`
- [x] Extrair `enrichTracks()` de Legacy
- [x] Exportar como mixin aplicável

---

### 1A.2 Atualizar Algoritmos Existentes

#### LegacyRoundRobinAlgorithm.js
- [ ] Remover `runSwapBalancing()` (~55 LOC)
- [ ] Remover `isSwapValid()` (~22 LOC)
- [ ] Usar `PlaylistBalancingMixin`
- [ ] Manter `enrichTracks()` ou usar mixin

#### SDraftOriginalAlgorithm.js
- [ ] Remover `runSwapBalancing()` (~54 LOC)
- [ ] Remover `isSwapValid()` (~10 LOC)
- [ ] Remover `this._legacyHelper` instância desnecessária
- [ ] Usar `PlaylistBalancingMixin`
- [ ] Usar `TrackEnrichmentMixin`

#### MJRPBalancedCascadeAlgorithm.js
- [ ] Remover `trimOverDurationPlaylists()` (~35 LOC)
- [ ] Usar `DurationTrimmingMixin`

#### MJRPBalancedCascadeV0Algorithm.js
- [ ] Remover `trimOverDurationPlaylists()` (~35 LOC)
- [ ] Remover `this._legacyHelper` instância desnecessária
- [ ] Usar `DurationTrimmingMixin`
- [ ] Usar `TrackEnrichmentMixin`

---

### 1A.3 Verificação
- [ ] Todos os testes passam (se existirem)
- [ ] Algoritmos geram mesmos resultados
- [ ] Nenhum breaking change

---

## Phase 1B: New Algorithms (Top N)

### 1B.1 TopNAlgorithm.js (Base Class)
- [ ] Criar classe base (~100 LOC)
- [ ] Configurações: trackCount, rankingStrategy, targetDuration, outputMode

### 1B.2 Subclasses (~20 LOC cada)
- [ ] Top3PopularAlgorithm.js
- [ ] Top3AcclaimedAlgorithm.js
- [ ] Top5PopularAlgorithm.js
- [ ] Top5AcclaimedAlgorithm.js

### 1B.3 Registry Update
- [ ] Registrar 4 novos algoritmos em index.js

---

## File Structure (After Refactoring)

```
public/js/algorithms/
├── mixins/
│   ├── PlaylistBalancingMixin.js   [NEW]
│   ├── DurationTrimmingMixin.js    [NEW]
│   └── TrackEnrichmentMixin.js     [NEW]
├── BaseAlgorithm.js                # Unchanged (~197 LOC)
├── LegacyRoundRobinAlgorithm.js    # Reduced (~440 LOC)
├── SDraftOriginalAlgorithm.js      # Reduced (~210 LOC)
├── MJRPBalancedCascadeAlgorithm.js # Reduced (~355 LOC)
├── MJRPBalancedCascadeV0Algorithm.js # Reduced (~280 LOC)
├── TopNAlgorithm.js                [NEW]
├── Top3PopularAlgorithm.js         [NEW]
├── Top3AcclaimedAlgorithm.js       [NEW]
├── Top5PopularAlgorithm.js         [NEW]
├── Top5AcclaimedAlgorithm.js       [NEW]
└── index.js                        # Updated
```

---

## Phase 3: Integration & UX (Sprint 12 - In Progress)

### 3.1 Conditional Ingredients Panel ✅ COMPLETED
- [x] Create `ALGORITHM_INGREDIENTS` config in `BlendIngredientsPanel.js`
- [x] Add Ranking Type selector (Spotify/BEA/Combined)
- [x] Add Discovery Mode toggle
- [x] Show/hide ingredients based on selected flavor
- [x] Pass `selectedFlavor` from `BlendingMenuView` to panel

### 3.2 Connect Ingredients to Algorithms ✅ COMPLETED
- [x] Pass `rankingType` from UI config to `createRankingStrategy()`
- [x] Pass `outputMode` and `discoveryMode` to `algorithm.generate()`
- [x] Add 'combined' alias to ranking strategy factory
- [x] Lock ranking for TopN algorithms (popular=spotify, acclaimed=bea)

### 3.3 Background Enrichment Service ✅ COMPLETED
> **Spec**: [background-enrichment-spec.md](./background-enrichment-spec.md)

- [x] Create `SpotifyEnrichmentStore.js` (Firestore CRUD with lazy cleanup)
- [x] Create `SpotifyEnrichmentService.js` (queue + background worker)
- [x] Trigger enrichment on Spotify auth success
- [x] Add progress notifications (toast)
- [ ] Add visual progress UI in TopNav (deferred)

### 3.4 Documentation ✅ COMPLETED
- [x] Create `AlgorithmsMenu.md` (flavor definitions + ingredient matrix)
- [x] Update `ARCHITECTURE.md` with Phase 3 status
- [x] Update `data_flow_architecture.md` with enrichment notes

### 3.5 Enrichment Integration Layer ✅ COMPLETED
> **Problem**: Background enrichment saves to `spotify_enrichment` collection, but AlbumsView only reads embedded album data.
> **Solution**: Connect `SeriesView.refreshGrid` with `SpotifyEnrichmentStore` to auto-apply enrichment.

- [x] Create `SpotifyEnrichmentHelper.js` with `applyEnrichmentToAlbum()` function
- [x] Create `applyEnrichmentToAlbums()` for batch processing
- [x] Integrate with `SeriesView.refreshGrid()`
- [x] Auto-merge Spotify data into album objects on load
- [ ] Test: Background enrichment → navigate to Series → Spotify data visible

---

## ⚠️ Production Deployment Pending

> [!IMPORTANT]
> **Added**: 2025-12-23  
> **Priority**: Required before production deploy  
> **Status**: 🟡 PENDING

### Background Enrichment - Global Collection Migration

The `SpotifyEnrichmentStore` currently uses **user-scoped paths** to work with existing Firestore rules:

```
users/{userId}/spotify_enrichment/{albumKey}   ← CURRENT (dev)
```

For **production deployment**, migrate to **global collection** for shared enrichment:

```
spotify_enrichment/{albumKey}   ← TARGET (prod)
```

#### Why?
- **Shared data**: Enrichment for "Abbey Road" benefits ALL users
- **Cost savings**: One enrichment per album, not per user
- **Performance**: New users get pre-enriched data

#### Steps Required

1. **Add Firestore Security Rules** in Firebase Console:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... existing rules ...
    
    // Global Spotify Enrichment (any authenticated user can read/write)
    match /spotify_enrichment/{albumKey} {
      allow read, write: if request.auth != null;
    }
  }
}
```

2. **Update SpotifyEnrichmentStore.js**:
   - Remove `getCollectionPath()` method
   - Use `const COLLECTION = 'spotify_enrichment'` directly
   - Remove `userStore` import

3. **Data Migration** (optional):
   - Run one-time migration to copy user-scoped data to global collection
   - Or let natural re-enrichment populate global collection



## User Review Required

> [!IMPORTANT]
> **Tasks aprovadas. Iniciar execução da Phase 1A (Mixin refactoring)?**

