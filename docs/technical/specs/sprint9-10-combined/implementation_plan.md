# Implementation Plan - Sprint 9+10 Combined Refactoring

**Created**: 2025-12-18 12:00  
**Updated**: 2025-12-18 12:10  
**Branch**: `feature/sprint9-ranking-enrichment`  
**Objective**: Complete Sprint 10 refactoring for clean, maintainable code

---

## 🎯 Primary Goal

> **A prioridade é o refactor deixar o código limpo e fácil de alterar, evoluir e manter.**  
> A consequência natural será endereçar mais facilmente as issues pendentes.

---

## 📊 Issues vs Refactor - Consequência, Não Objetivo

| Issue | Problema | Componente | Consequência do Refactor |
|-------|----------|------------|--------------------------|
| **#58** Badge PENDING | Dados BestEver não refletem | `AlbumsView.js` | Código modularizado facilita debug. **Nota**: Se fallback de ratings funcionar, badge PENDING pode ser removido. |
| **#57** Filter Regression | State initialization incorreta | `AlbumsView.js` | Filtros isolados em módulo próprio = menos chance de regressão |
| **#55** Ghost Playlists | State contamination | `PlaylistsView.js` | Modularização reforça separação de concerns |
| **#54** Edit Batch | IDs mudam no regenerate | `PlaylistsView.js` | **PRECISA RE-ESPECIFICAR USANDO SDD** - Problema arquitetural, não de modularização |

---

## 🔧 Proposed Changes

### Phase 4: Server Routes Integration (Menor Risco)

Os módulos de routes já foram **criados** mas não **integrados**.

#### [MODIFY] [server/index.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/server/index.js)

**Mudanças:**
1. Importar routes: `albumRoutes`, `playlistRoutes`, `debugRoutes`
2. Usar `app.use()` para montar as routes
3. Remover endpoints inline que foram movidos
4. Manter apenas: app setup, middleware, health check

**Target**: < 150 linhas

---

### Phase 3: AlbumsView Modularization

**Objetivo**: Código limpo, single responsibility, fácil de manter.

Módulos já **criados**:
- `AlbumsGridRenderer.js` (329 linhas) ✅
- `AlbumsFilters.js` (119 linhas) ✅
- `index.js` (barrel export) ✅

**Pendente**: Integração usando Context Object Pattern

#### [MODIFY] [AlbumsView.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/AlbumsView.js)

**Context Object Pattern:**
```javascript
// AlbumsView.js
import { filterAlbums } from './albums/AlbumsFilters.js'
import { renderAlbumsGrid } from './albums/AlbumsGridRenderer.js'

// Delegate with context
const filtered = filterAlbums({
  albums: this.albums,
  filters: this.filters,
  scope: this.scope
})

const html = renderAlbumsGrid({
  albums: filtered,
  viewMode: this.viewMode,
  onAlbumClick: (id) => this.handleAlbumClick(id)
})
```

**Sobre Badge PENDING (Issue #58):**
- Se o fallback de ratings (BestEver → Spotify → AI) funcionar corretamente, **não precisamos de badge PENDING**
- O badge deve mostrar a FONTE dos ratings (Acclaim/Popularity/AI), não um estado de "aguardando"
- Isso simplifica a lógica e remove estados intermediários confusos

---

### Phase 5: PlaylistsView Modularization

**Objetivo**: Código limpo, single responsibility, fácil de manter.

Módulos já **criados**:
- `PlaylistsExport.js` (122 linhas) ✅
- `PlaylistsDragDrop.js` (71 linhas) ✅
- `index.js` (barrel export) ✅

**Pendente**: Integração usando Context Object Pattern

#### [MODIFY] [PlaylistsView.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/PlaylistsView.js)

**Sobre Issue #54 (Edit Batch):**
> [!IMPORTANT]
> **PRECISA RE-ESPECIFICAR USANDO SDD**
> 
> O problema de "IDs mudam no regenerate" é arquitetural, não de modularização.
> Após o refactor, criaremos uma spec dedicada usando o template SDD para resolver corretamente.

---

### Phase 6: Documentation & Assessment

#### [NEW] Code Quality Assessment v3
- Executar análise completa do codebase após refactor
- Comparar métricas com v1 e v2
- Documentar melhorias alcançadas

#### [UPDATE] [ARCHITECTURE.md](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/docs/ARCHITECTURE.md)

**Adicionar seção: Design Patterns em Uso**

| Pattern | Onde | Por quê |
|---------|------|---------|
| **Context Object** | Views modules | Evita acoplamento `this`, permite delegation |
| **Strategy** | ViewModeStrategy.js | Compact/Expanded modes intercambiáveis |
| **Observer** | Stores | Notificação de mudanças de estado |
| **Repository** | *Repositories.js | Abstração de acesso a dados |
| **Factory** | Barrel exports (index.js) | Criação centralizada de módulos |
| **State Machine** | PlaylistsStore.mode | Controle explícito de CREATE/EDIT modes |
| **Facade** | MusicKitService | Interface simplificada para Apple Music API |

---

## ✅ Verification Plan

### Automated Tests

```bash
# Após cada fase:
npm run build    # Vite build must pass
npm run test     # 74/78 tests (4 pre-existing failures OK)
npm run lint     # No new lint errors
```

### Manual Verification

#### Phase 4 (Server Routes)
```bash
# Terminal 1: Start server
cd server && node index.js

# Terminal 2: Test endpoints
curl http://localhost:3000/_health
curl http://localhost:3000/api/enrich-album -X POST -H "Content-Type: application/json" -d '{"artist":"Led Zeppelin","album":"Led Zeppelin IV"}'
```

#### Phase 3 (AlbumsView)
1. Abrir http://localhost:5000/albums
2. Verificar se albums aparecem
3. Testar todos os filtros (Artist, Year, Source)
4. Testar view mode toggle (Compact/Expanded)

#### Phase 5 (PlaylistsView)
1. Criar nova série → Gerar playlists → Salvar
2. Testar drag-and-drop
3. Testar export JSON e Apple Music

### Final Assessment (Phase 6)

1. Executar **Code Quality Assessment v3**
2. Atualizar **ARCHITECTURE.md** com Design Patterns
3. Comparar métricas:
   - AlbumsView.js: 1,524 → target < 600
   - PlaylistsView.js: 756 → target < 500
   - server/index.js: ~400 → target < 150

---

## 📋 Execution Order

| Step | Phase | Task | Est. Time |
|------|-------|------|-----------|
| 1 | 4 | Integrar server routes em `index.js` | 45 min |
| 2 | 4 | Verificar endpoints | 15 min |
| 3 | 3 | Integrar `AlbumsFilters.js` com Context Object | 45 min |
| 4 | 3 | Integrar `AlbumsGridRenderer.js` com Context Object | 45 min |
| 5 | 3 | Verificar AlbumsView features | 30 min |
| 6 | 5 | Integrar `PlaylistsExport.js` | 30 min |
| 7 | 5 | Integrar `PlaylistsDragDrop.js` | 30 min |
| 8 | 5 | Verificar PlaylistsView features | 30 min |
| 9 | 6 | Code Quality Assessment v3 | 30 min |
| 10 | 6 | Atualizar ARCHITECTURE.md (Design Patterns) | 30 min |

**Total Estimado**: ~5.5 horas

---

## 🎯 Success Criteria

| Metric | Target | Current |
|--------|--------|---------|
| AlbumsView.js | < 600 lines | 1,524 |
| PlaylistsView.js | < 500 lines | 756 |
| server/index.js | < 150 lines | ~400 |
| Overall Code Quality Score | > 7.0 | 5.8 |
| Design Patterns Documented | All | - |

---

## ⚠️ Risk Mitigation

| Risk | Mitigation |
|------|------------|
| `this` context loss | Use Context Object Pattern |
| Event listener leaks | Ensure `destroy()` calls module cleanup |
| Circular imports | Use barrel exports (`index.js`) |
| Breaking existing features | Test after each module integration |

---

## 📝 Post-Refactor: Issue #54 Re-Specification

Após o refactor, criar nova spec usando template SDD para resolver Issue #54:

```
.specify/templates/spec-template.md → docs/technical/specs/sprint9-10-combined/edit-batch-spec.md
```

**User Story**: Como usuário, quero editar um batch existente e ao salvar, que ele sobrescreva o batch original, não crie um novo.
