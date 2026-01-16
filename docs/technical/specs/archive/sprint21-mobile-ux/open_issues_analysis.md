# Sprint 21 - Open Issues Analysis

**Date**: 2026-01-15  
**Status**: Awaiting Resolution

---

## Issues Overview

| Ordem | Issue | Sintoma | Root Cause | Fix Anterior (Revertido) | Razão do Fix |
|-------|-------|---------|------------|--------------------------|--------------|
| **1** | #154 | "Could not find album in series" ao deletar | `HomeController.js` cria séries com `{ album: value }` ao invés de `{ title: value }` | `HomeController.js`: `title: album.title`<br>`SeriesService.js`: fallback `query.title \|\| query.album` | Corrigir dados malformados |
| **2** | #156 | Novos items só aparecem após refresh | `SeriesService` não invalidava cache `ALL_SERIES_VIEW` | `this.cache.clearAlbumSeries('ALL_SERIES_VIEW')` em `createSeries`, `updateSeries`, `removeAlbumFromSeries` | Forçar refresh do cache |
| **2** | #158 | "No albums" após deletar série | `deleteSeries` sem cache invalidation | Cache invalidation em `deleteSeries` | Recarregar dados atualizados |
| **3** | #155 | App congela ao deletar série | Cache stale + navegação incorreta | Cache invalidation + navegação forçada | Evitar estado inconsistente |
| **4** | #153 | Toast sucesso E falha ao editar série | Payload undefined para `updateHeader` → TypeError | *(Sem fix aplicado)* | — |
| **5** | #152 | Skeletons não aparecem/desaparecem | Observer hidrata no mesmo frame + guard `albums.length === 0` | Removeu guard, adicionou `isLoading` propagation | Mostrar Ghost Series |

---

## Root Causes por Camada

| Camada | Issues | Problema |
|--------|--------|----------|
| **Data** (HomeController) | #154 | Malformação na criação |
| **Cache** (SeriesService) | #155, #156, #158 | Falta de invalidação |
| **View** (SeriesModalsManager) | #153 | Payload undefined |
| **Renderer** (SeriesGridRenderer) | #152 | Conflito skeleton/filtros |

---

## Ordem de Resolução Proposta

```
[Data Integrity] → [Cache Layer] → [Deletion Flow] → [UI Feedback] → [UX Feature]
     #154            #156/#158         #155              #153            #152
```

**Princípio**: Corrigir de baixo para cima (dados → cache → lógica → UI → UX).

---

## Arquivos Afetados

| Issue | Arquivos |
|-------|----------|
| #154 | `HomeController.js`, `SeriesService.js` |
| #155, #156, #158 | `SeriesService.js` |
| #153 | `SeriesModalsManager.js`, `SeriesViewUpdater.js` |
| #152 | `SeriesController.js`, `SeriesView.js`, `SeriesViewUpdater.js`, `SeriesGridRenderer.js`, `animations.css` |

---

## Notas

- **Issue #157** (Album "76" Missing) permanece **RESOLVED** - fix em `MusicKitCatalog.js` foi preservado
- Todos os fixes das issues #152-#158 (exceto #157) foram **revertidos** em 2026-01-15 devido a regressões causadas pelo skeleton patch
- Ver `issue152_implementation.md` para análise detalhada do patch skeleton
