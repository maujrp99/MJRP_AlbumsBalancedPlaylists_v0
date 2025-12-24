# Playlist Architecture Analysis

**Created**: 2025-12-23 22:04
**Purpose**: Avaliar opções arquiteturais para modularizar o CRUD de Playlists

---

## 1. Estado Atual: Problemas Identificados

### 1.1 Responsabilidades Misturadas

```
┌────────────────────────────────────────────────────────────┐
│                    SavedPlaylistsView (667 LOC)            │
│  ✅ List Series/Batches                                     │
│  ✅ Delete (Playlist, Batch, All)                           │
│  ✅ Navigate to Edit                                        │
│  ❌ Modal management inline                                 │
│  ❌ Repository calls inline                                 │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    PlaylistsView (896 LOC)                  │
│  ✅ Generate playlists                                      │
│  ✅ Edit tracks (drag & drop)                               │
│  ✅ Save to Firestore                                       │
│  ✅ Export (JSON, Spotify, Apple)                           │
│  ❌ Generation logic duplicated with BlendingMenu          │
│  ❌ Firestore save logic 100+ LOC inline                   │
│  ❌ No delete capability                                   │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    BlendingMenuView (515 LOC)               │
│  ✅ 4-step wizard                                           │
│  ✅ Generate playlists                                      │
│  ❌ Track transformation duplicated                        │
│  ❌ No batch naming step                                   │
└────────────────────────────────────────────────────────────┘
```

### 1.2 Duplicação de Código

| Código Duplicado | Localização 1 | Localização 2 |
|------------------|---------------|---------------|
| `transformTracks()` | BlendingMenuView:411 | PlaylistsView:751 |
| `generatePlaylists()` | BlendingMenuView:385 | PlaylistsView:734 |
| Repository instancing | SavedPlaylistsView:462,505,545 | PlaylistsView:531 |

---

## 2. Opções Arquiteturais

### Opção A: Service-Oriented (Recomendada)

Extrair lógica de negócio para **Services**, manter Views apenas como UI.

```
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer (NEW)                       │
├─────────────────────────────────────────────────────────────┤
│  PlaylistGenerationService.js                                │
│    ├── generate(albums, config) → playlists                 │
│    ├── transformTracks(tracks) → normalized                 │
│    └── validate(config) → boolean                           │
├─────────────────────────────────────────────────────────────┤
│  PlaylistPersistenceService.js                               │
│    ├── save(seriesId, playlists, batchName)                 │
│    ├── load(seriesId, batchName?) → playlists               │
│    ├── delete(seriesId, playlistId)                         │
│    ├── deleteBatch(seriesId, batchName)                     │
│    └── deleteAll(seriesId)                                  │
└─────────────────────────────────────────────────────────────┘
         ▲              ▲              ▲
         │              │              │
    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
    │Blending │    │Playlists│    │ Saved   │
    │MenuView │    │  View   │    │Playlists│
    └─────────┘    └─────────┘    └─────────┘
```

**Prós:**
- Single source of truth para lógica
- Fácil testar services isolados
- Views ficam finas (~200-300 LOC cada)

**Contras:**
- Requer refactor significativo
- 2 novos arquivos para manter

---

### Opção B: Component Library

Componentizar UI em componentes reutilizáveis:

```
components/playlists/
├── PlaylistGrid.js          ← Layout grid
├── PlaylistCard.js          ← Card com header + tracks
├── TrackItem.js             ← Track com badges + drag
├── PlaylistSeriesInput.js   ← Nome do batch
├── PlaylistActions.js       ← Botões de ação (delete, export)
├── BatchGroupCard.js        ← Card de grupo na landing
└── DeleteConfirmModal.js    ← Modal de confirmação
```

**Prós:**
- UI consistente
- Componentes testáveis
- Reutilização entre views

**Contras:**
- Não resolve duplicação de lógica
- Mais arquivos para manter

---

### Opção C: Hybrid (Services + Components) ⭐ IDEAL

Combina A + B:

```
┌─────────────────────────────────────────────────────────────┐
│                    1. SERVICE LAYER                          │
│  PlaylistGenerationService    PlaylistPersistenceService    │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    2. COMPONENT LAYER                        │
│  TrackItem  PlaylistCard  BatchGroupCard  DeleteModal       │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    3. VIEW LAYER (Thin Orchestrators)        │
│  SavedPlaylistsView     PlaylistsView     BlendingMenuView  │
│      (~200 LOC)           (~300 LOC)         (~300 LOC)     │
└─────────────────────────────────────────────────────────────┘
```

**Prós:**
- Melhor separação de concerns
- Lógica centralizada + UI consistente
- Views viram "wiring" entre services e components
- Mesma abordagem que SeriesView V3

**Contras:**
- Maior investimento inicial
- Mais planejamento necessário

---

## 3. Avaliação Comparativa

| Critério | Estado Atual | Opção A | Opção B | Opção C |
|----------|--------------|---------|---------|---------|
| **Modularidade da Lógica** | ⭐ 2/5 | ⭐⭐⭐⭐⭐ 5/5 | ⭐⭐ 2/5 | ⭐⭐⭐⭐⭐ 5/5 |
| **Componentização UI** | ⭐ 1/5 | ⭐ 1/5 | ⭐⭐⭐⭐⭐ 5/5 | ⭐⭐⭐⭐⭐ 5/5 |
| **Testabilidade** | ⭐ 2/5 | ⭐⭐⭐⭐ 4/5 | ⭐⭐⭐ 3/5 | ⭐⭐⭐⭐⭐ 5/5 |
| **LOC Total** | 2078 | ~1800 | ~2200 | ~1700 |
| **Esforço de Refactor** | - | Médio | Médio | Alto |
| **Consistência com SeriesView V3** | ❌ | ❌ | ❌ | ✅ |

---

## 4. Recomendação: Opção C (Hybrid)

### 4.1 Roadmap de Implementação

```
Phase 1: Services (Logic)
├── PlaylistGenerationService.js
│   ├── Mover transformTracks()
│   ├── Mover generate()
│   └── Adicionar validate()
├── PlaylistPersistenceService.js
│   ├── Mover save/delete/load
│   └── Encapsular Repository calls
└── Refactor views para usar services

Phase 2: Components (UI)
├── TrackItem.js (já definido na spec)
├── PlaylistCard.js
├── BatchGroupCard.js
└── DeleteConfirmModal.js

Phase 3: Thin Views
├── SavedPlaylistsView → ~200 LOC
├── PlaylistsView → ~300 LOC
└── BlendingMenuView → ~300 LOC
```

### 4.2 Nomenclatura Proposta

```
services/
├── PlaylistGenerationService.js    ← Generate logic
├── PlaylistPersistenceService.js   ← CRUD logic
└── PlaylistExportService.js        ← Export logic (já existe parcialmente)

components/playlists/
├── TrackItem.js
├── PlaylistCard.js
├── PlaylistGrid.js
├── BatchGroupCard.js
├── PlaylistSeriesInput.js
└── modals/
    ├── DeletePlaylistModal.js
    └── SavePlaylistsModal.js
```

---

## 5. Próximos Passos

1. [ ] Revisar esta análise com usuário
2. [ ] Confirmar Opção C como escolha
3. [ ] Criar implementation_plan.md detalhado
4. [ ] Implementar Phase 1 (Services)
5. [ ] Implementar Phase 2 (Components)
6. [ ] Refactor Views para usar novos módulos
