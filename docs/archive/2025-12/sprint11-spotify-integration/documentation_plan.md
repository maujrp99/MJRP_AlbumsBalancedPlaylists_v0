# Documentation Reorganization Plan

**Data**: 2025-12-19 18:40
**Objetivo**: Reorganizar, completar e manter documentação técnica atualizada

---

## Análise do Estado Atual

### Problemas Identificados

1. **Ordenação Confusa** no `data_flow_architecture.md`:
   - Inventory de componentes misturado com flows
   - Seções Sprint 11 no meio/fim do documento
   - Falta hierarquia clara

2. **Duplicação de Conteúdo**:
   - `ARCHITECTURE.md` (1251 lines) e `data_flow_architecture.md` cobrem tópicos similares
   - High-level architecture em ambos
   - Stores/Views descritos em ambos

3. **Itens Incompletos** no Inventory:
   - 4 Views sem documentação (❌)
   - 2 Stores sem documentação (❌)
   - 3 Services sem documentação (❌)
   - 4 Models sem documentação (❌)
   - 5 Repositories sem documentação (❌)
   - Vários itens ⚠️ Partial

4. **Docs Potencialmente Obsoletos**:
   - `ARCHITECTURE_AUDIT.md` - precisa verificar
   - `album_data_schema.md` - pode estar desatualizado
   - Specs antigos em `sprint-7-*`, etc.

---

## Estratégia de Reorganização

### Fase 1: Consolidar Documentação Principal

**Objetivo**: Um único ponto de entrada que referencia docs especializados

```
docs/
├── ARCHITECTURE.md          # MAIN: High-level + Links
├── technical/
│   ├── data_flow_architecture.md  # FLOWS: All sequence diagrams
│   ├── component_reference.md     # NEW: Inventory + API
│   ├── crud_operations.md         # EXTRACT: CRUD flows
│   └── album_data_schema.md       # KEEP: Model schemas
└── specs/
    └── [sprint-specific docs]     # ARCHIVE old, keep recent
```

### Fase 2: Estrutura Recomendada para `data_flow_architecture.md`

```markdown
1. Overview (brief)
2. System High-Level Architecture (mermaid)
3. App Initialization Flow
4. Navigation Map
5. Data Flows by Feature
   5.1 Album Series Flows
   5.2 Playlist Flows
   5.3 Inventory Flows
   5.4 Ranking & Spotify Flows

> Note: For issues, see DEBUG_LOG.md (no issues in this doc)
```

### Fase 3: Criar `component_reference.md`

Mover inventory de `data_flow_architecture.md` para novo arquivo com:
- Para cada componente: Purpose, API, Dependencies, Examples
- Status de documentação
- Links para código fonte

---

## Plano de Execução

### Sprint Doc-1: Reordenar (1-2h)
- [ ] Reorganizar seções do `data_flow_architecture.md`
- [ ] Mover inventory para `component_reference.md`
- [ ] Atualizar TOC

### Sprint Doc-2: Completar Views (2-3h)
- [ ] EditPlaylistView.js - documentar fluxos
- [ ] InventoryView.js - documentar CRUD
- [ ] SavedPlaylistsView.js - documentar fluxos
- [ ] ConsolidatedRankingView.js - documentar

### Sprint Doc-3: Completar Stores/Services (2h)
- [ ] inventory.js store - documentar API
- [ ] UserStore.js - documentar
- [ ] AlbumLoader.js - documentar
- [ ] OptimizedAlbumLoader.js - documentar
- [ ] DataSyncService.js - documentar

### Sprint Doc-4: Completar Models/Repos (1-2h)
- [ ] Album.js, Track.js, Playlist.js, Series.js
- [ ] Repositories - BaseRepository pattern

### Sprint Doc-5: Audit & Archive (1h)
- [ ] Verificar docs obsoletos em archive/
- [ ] Marcar deprecated ou remover
- [ ] Atualizar cross-references

---

## Estratégia de Manutenção

### ✅ Codificada em Workflow

A estratégia foi codificada como workflow invocável:

**Workflow**: `/post-implementation-docs`  
**Arquivo**: `.agent/workflows/post-implementation-docs.md`

### Regra: Update-on-Change (via workflow)

Quando implementar feature, invocar workflow que verifica:
1. Atualizar componente reference se novo/modificado
2. Atualizar flow diagram se fluxo mudou
3. Adicionar entry em DEBUG_LOG se foi bug fix

### Invocação

O usuário pode invocar após implementação:
```
/post-implementation-docs
```

Ou o agente sugere ao final de uma tarefa:
> "Tarefa concluída. Quer que eu rode `/post-implementation-docs`?"

### Review Trimestral
- Audit de docs obsoletos
- Remover/arquivar conteúdo deprecated
- Verificar accuracy dos diagrams

---

## Próximo Passo

**Escolha prioridade**:
1. **Bug #71** (wrong tracks) - mais urgente para UAT
2. **Doc-1** - reordenar estrutura do data_flow
3. **Doc-2 a Doc-4** - completar itens faltantes
