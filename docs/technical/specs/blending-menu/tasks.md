# Blending Menu - Phase 1: Tasks

**Created**: 2025-12-22  
**Status**: APPROVED  
**Plan**: [plan.md](./plan.md)  
**Analysis**: [algorithm-analysis.md](./algorithm-analysis.md)

---

## Phase 1A: Algorithm Modularization (Mixin Pattern)

> [!NOTE]
> **Decisão**: Refatorar algoritmos existentes ANTES de criar novos.
> **Pattern**: Mixin/Trait Pattern para manter BaseAlgorithm enxuta.

### 1A.1 Criar Mixins

#### [NEW] PlaylistBalancingMixin.js (~70 LOC)
- [ ] Criar arquivo em `algorithms/mixins/`
- [ ] Extrair `runSwapBalancing()` de Legacy/SDraft
- [ ] Extrair `isSwapValid()` de Legacy/SDraft
- [ ] Exportar como mixin aplicável

#### [NEW] DurationTrimmingMixin.js (~40 LOC)
- [ ] Criar arquivo em `algorithms/mixins/`
- [ ] Extrair `trimOverDurationPlaylists()` de MJRP/MJRPv0
- [ ] Exportar como mixin aplicável

#### [NEW] TrackEnrichmentMixin.js (~185 LOC)
- [ ] Criar arquivo em `algorithms/mixins/`
- [ ] Extrair `enrichTracks()` de Legacy
- [ ] Exportar como mixin aplicável

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

## User Review Required

> [!IMPORTANT]
> **Tasks aprovadas. Iniciar execução da Phase 1A (Mixin refactoring)?**
