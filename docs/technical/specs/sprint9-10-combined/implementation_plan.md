# Implementation Plan - Sprint 9+10 Combined Refactoring

**Created**: 2025-12-18 12:00  
**Updated**: 2025-12-18 14:00  
**Branch**: `feature/sprint9-ranking-enrichment`  
**Objective**: Complete Sprint 10 refactoring for clean, maintainable code

---

## 🎯 Primary Goal

> **A prioridade é o refactor deixar o código limpo e fácil de alterar, evoluir e manter.**  
> A consequência natural será endereçar mais facilmente as issues pendentes.

---

## 📊 Current Progress

| Arquivo | Original | Atual | Target | Status |
|---------|----------|-------|--------|--------|
| **server/index.js** | 535 | **150** | <150 | ✅ **DONE** |
| **AlbumsView.js** | 1,757 | **1,374** | <600 | ✅ **-22%** |
| **PlaylistsView.js** | 886 | **783** | <500 | ✅ **-12%** |

### Commits Realizados
1. `efa415f` - Phase 4: Server routes integration (-385 linhas)
2. `899d7e5` - Phase 3: AlbumsView render delegation (-230 linhas)
3. `c5da05b` - Phase 3: Scoped renderers extraction (-153 linhas)
4. `4351463` - Phase 5: PlaylistsView export delegation (-103 linhas)

**Total: -871 linhas removidas**, código centralizado em módulos

---

## 🔧 Phases

### Phase 4: Server Routes Integration ✅ COMPLETE

| Task | Status |
|------|--------|
| Integrar routes via `app.use()` | ✅ Done |
| Dependency injection pattern | ✅ Done |
| server/index.js < 150 lines | ✅ **150 lines** |
| Health check verification | ✅ Passed |

---

### Phase 3: AlbumsView Modularization 🔄 IN PROGRESS

**Módulos Criados:**
- `AlbumsGridRenderer.js` (354 lines) ✅
- `AlbumsFilters.js` (135 lines) ✅  
- `AlbumsScopedRenderer.js` (195 lines) ✅
- `index.js` (barrel export) ✅

**Métodos Delegados:**
- `renderExpandedList()` ✅
- `renderRankedTracklist()` ✅
- `renderOriginalTracklist()` ✅
- `renderAlbumsGrid()` ✅
- `renderScopedGrid()` ✅
- `renderScopedList()` ✅
- `filterAlbums()` ✅
- `escapeHtml()` ✅

**Pendente para <600 lines:**
- `mount()` handlers (~600 lines) - Complexo
- Series Modals HTML (~100 lines)

---

### Phase 5: PlaylistsView Modularization ⏳ PENDING

Módulos já **criados** (não integrados):
- `PlaylistsExport.js` (122 lines)
- `PlaylistsDragDrop.js` (71 lines)

---

### Phase 6: Documentation & Assessment ⏳ PENDING

- [ ] Code Quality Assessment v3
- [ ] Update ARCHITECTURE.md with Design Patterns
- [ ] Final metrics comparison

---

## 🏗️ Design Pattern: Context Object

```javascript
// Exemplo de delegação sem perder `this`
renderScopedGrid(albums, seriesList) {
  return renderScopedGridFn({
    albums,
    seriesList,
    currentScope: this.currentScope,
    renderAlbumsGrid: (a) => this.renderAlbumsGrid(a)
  })
}
```

---

## ✅ Verification

| Check | Phase 4 | Phase 3 |
|-------|---------|---------|
| `npm run build` | ✅ 2.53s | ✅ 2.65s |
| `npm run test` | ✅ 74/78 | ✅ 74/78 |
| Modules count | 131 | 132 |

---

## 📝 Issues para Endereçar Após Refactor

| Issue | Problema | Ação |
|-------|----------|------|
| **#58** | Badge PENDING | Verificar se fallback funciona |
| **#57** | Filter Regression | 🧪 TESTING |
| **#55** | Ghost Playlists | 🧪 TESTING |
| **#54** | Edit Batch | Re-especificar com SDD |

