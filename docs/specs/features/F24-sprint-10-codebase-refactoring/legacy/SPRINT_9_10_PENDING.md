# Sprint 9+10 Consolidated Pending Tasks

**Created**: 2025-12-18 11:54  
**Updated**: 2025-12-18 22:48  
**Branch**: `feature/sprint9-ranking-enrichment`  
**Status**: ✅ **Deployed to Production** - UAT in progress

---

## 📊 Executive Summary

| Sprint | Total Tasks | Completed | Pending | Progress |
|--------|-------------|-----------|---------|----------|
| Sprint 9 | ~12 | 9 | **3** | 75% |
| Sprint 10 | 57 | 23 | **34** | 40% |
| **Total** | ~69 | 32 | **37** | ~46% |

### 🎉 Today's Fixes (2025-12-18)
- ✅ EditPlaylistView loading spinner bug
- ✅ EditPlaylistView regenerate critical freeze bug
- ✅ Playlist numbering (visual + generation)
- ✅ Race condition fix (container not found)
- ✅ GlobalProgress component + skeleton loaders CSS
- ✅ Playlist ordering in SavedPlaylistsView

---

## 🔴 Sprint 9: Ranking & Enrichment - PENDING

### Critical Issues

| Issue | Título | Status | Ação Requerida |
|-------|--------|--------|----------------|
| **#58** | Badge "PENDING" apesar de BestEver data | 🚧 IN PROGRESS | Investigar desconexão entre API response e frontend |
| **#57** | Filter Regression | ✅ FIXED | Constructor filter schema updated |
| **#55** | Ghost Playlists / Batch Contamination | ✅ FIXED | State machine + URL param pattern |
| **#54** | Edit Batch Not Overwriting | ✅ FIXED | Delete old batch before save |
| **#59** | EditPlaylistView loading spinner | ✅ FIXED | loadingContainer + isLoading state |
| **#60** | Scroll/DragDrop UX | ✅ FIXED | min-h, custom-scrollbar, drop-zone-padding |
| **#61** | Regenerate browser freeze | ✅ FIXED | Algorithm ID + isGenerating reset |
| **#62** | Race condition AlbumsView | ✅ FIXED | Unmount guard check |

### Implementation Tasks

| Task | Descrição | Status | Notas |
|------|-----------|--------|-------|
| `normalizeLoose` fix | Fix BestEver para Led Zeppelin IV | ✅ **DONE** | Código existe em `besteveralbums.js` |
| `spotifyPopularity.js` | Serviço de fallback Spotify | ✅ **DONE** | 110 linhas implementadas |
| Fallback pipeline | BestEver → Spotify → AI | ✅ **DONE** | Implementado em `fetchRanking.js` |
| Dynamic Badges | Badges Acclaim/Popularity/AI | ⚠️ **PARTIAL** | Implementado mas Issue #58 mostra PENDING |
| Source Filter | Dropdown para filtrar por source | ✅ **DONE** | Issue #57 fixed |
| **DELETE musicboard.js** | Cleanup de scraper deprecated | ❌ **PENDING** | Arquivo com 352 linhas ainda existe |
| **GlobalProgress.js** | Loading bar component | ✅ **NEW** | Created with skeleton CSS |

### Issue #58 Deep Dive

**Problema**: Led Zeppelin IV mostra "PENDING" apesar de:
- Scraper retornar `albumId: "144"` ✅
- "Ranked by Acclaim" mostrar tracks com ratings ✅
- API enrich sendo chamado ✅

**Próximos passos:**
1. Verificar response de `/api/enrich-album` no console
2. Confirmar que `bestEverInfo.albumId` está sendo retornado
3. Verificar parsing em `client.js:127`

---

## 🟠 Sprint 10: Codebase Refactoring - PENDING

### Phase 1-2: Setup & Legacy ✅ COMPLETE

| Task | Status |
|------|--------|
| Delete `app.legacy.js` | ✅ 47KB removed |
| Build verification | ✅ 4.34s, 131 modules |

### Phase 3: AlbumsView Modularization (16 pending)

| Task ID | Descrição | Status | Bloqueio |
|---------|-----------|--------|----------|
| T012 | Delegate to AlbumsGridRenderer | 🔄 Partial | 4 métodos delegados |
| T014 | Delegate to AlbumsFilters | 🔄 Partial | filterAlbums delegado |
| T015-T016 | Extract/Delegate SeriesModals | ❌ BLOCKED | `this` context coupling |
| T017-T018 | Extract/Delegate AlbumsDataLoader | ❌ BLOCKED | `this` context coupling |
| T019 | AlbumsView to orchestration only | ❌ DEPENDS | Depende de T015-T018 |
| T020 | Verify < 600 lines | ❌ PENDING | Atual: 1,524 linhas |
| T021-T029 | Build/Test/Manual verification | ❌ PENDING | Depende do refactor |

**Métricas atuais:**
- AlbumsView.js: 1,524 linhas (target: 600)
- Redução alcançada: -17% (de 1,837)

### Phase 4: Server Routes (8 pending)

| Task ID | Descrição | Status | Bloqueio |
|---------|-----------|--------|----------|
| T031 | Integrate album routes | ❌ PENDING | Dependency injection |
| T033 | Integrate playlist routes | ❌ PENDING | Dependency injection |
| T035 | Integrate debug routes | ❌ PENDING | Dependency injection |
| T036-T042 | Refactor index.js + verification | ❌ PENDING | Depende de T031-T035 |

**Módulos criados (não integrados):**
- `routes/albums.js` - 256 linhas
- `routes/playlists.js` - 64 linhas
- `routes/debug.js` - 127 linhas

### Phase 5: PlaylistsView (6 pending)

| Task ID | Descrição | Status | Bloqueio |
|---------|-----------|--------|----------|
| T046 | Delegate to PlaylistsExport | 🔄 Partial | handleExportJson delegado |
| T048 | Delegate to PlaylistsDragDrop | ❌ BLOCKED | `this` context coupling |
| T049-T053 | Refactor + verification | ❌ PENDING | Depende de T048 |

**Métricas atuais:**
- PlaylistsView.js: 756 linhas (target: 500)
- Redução alcançada: -15% (de 891)

### Phase 6: Polish & Documentation (4 pending)

| Task ID | Descrição | Status |
|---------|-----------|--------|
| T054 | Update CODE_QUALITY_ASSESSMENT | ⏳ Lower priority |
| T055 | Update ARCHITECTURE.md | ⏳ Lower priority |
| T056-T057 | Final commit + test suite | ❌ Final step |

---

## 🎯 Recommended Approach: Context Object Pattern

Para resolver o bloqueio de `this` context nos módulos:

```javascript
// Módulo
export function setupSeriesModals(context) {
  const { container, editingSeriesId, showToast, update } = context
  // Use context instead of this
}

// View
import { setupSeriesModals } from './albums/SeriesModals.js'
setupSeriesModals({
  container: this.container,
  editingSeriesId: () => this.editingSeriesId,
  showToast: (msg, type) => Toast.show(msg, type),
  update: () => this.update()
})
```

---

## 🧹 Cleanup Tasks

| Task | File | Size | Priority |
|------|------|------|----------|
| DELETE | `server/lib/scrapers/musicboard.js` | 352 lines | Medium |
| UPDATE | `ARCHITECTURE.md` | - | Low |
| UPDATE | `CODE_QUALITY_ASSESSMENT.md` | - | Low |

---

## 📎 Related Documents

- Sprint 9 Spec
- Sprint 9 Rankings Architecture
- Sprint 10 Spec
- Sprint 10 Plan
- Sprint 10 Tasks
- [DEBUG_LOG](../../../../debug/DEBUG_LOG.md) - Issues #54-58
- CODE_QUALITY_ASSESSMENT_v2

---

## ✅ Order of Execution (Recommended)

1. **Resolver Issue #58** - Badge PENDING é o bug mais visível
2. **User Verification** - Issues #54, #55, #57
3. **Cleanup** - Deletar musicboard.js
4. **Sprint 10 Phase 4** - Integrar server routes (menor risco)
5. **Sprint 10 Phase 3** - Aplicar Context Object Pattern em AlbumsView
6. **Sprint 10 Phase 5** - Aplicar Context Object Pattern em PlaylistsView
7. **Sprint 10 Phase 6** - Documentação final
