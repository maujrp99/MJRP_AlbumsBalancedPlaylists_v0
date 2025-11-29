# Proposta de Consolidação de Documentação Arquitetural

## Documentos Identificados para Consolidação

### 📁 Artifacts da Sessão Atual (.gemini/antigravity/brain/)

| # | Arquivo | Tema | Criar em | Manter? |
|---|---------|------|----------|---------|
| 1 | `implementation_plan.md` | Store Persistence Architecture | 2025-11-29 ~16:52 | ❌ Consolidar |
| 2 | `impact_analysis.md` | Store State Management Impact | 2025-11-29 ~16:54 | ❌ Consolidar |
| 3 | `data_flow_architecture.md` | Data Flow & Sequence Diagrams | 2025-11-29 ~16:59 | ❌ Consolidar |
| 4 | `album_data_schema.md` | Album Data Schema & Transformations | 2025-11-29 ~17:03 | ❌ Consolidar |

### 📁 Documentos do Projeto (/docs/)

| # | Arquivo | Tema | Data | Manter? |
|---|---------|------|------|---------|
| 5 | `SPRINT_5_PERSISTENCE_ARCHITECTURE.md` | Repository Pattern, Firestore, CRUD | 2025-11-28 | ✅ **Manter** (comprehensive) |
| 6 | `APPLE_MUSIC_ARCHITECTURE.md` | OAuth, API Integration | Anterior | ✅ **Manter** (feature-specific) |
| 7 | `CACHING_STRATEGY.md` | Cache Layer Design | Anterior | ❌ Consolidar |
| 8 | `ROUTING_DECISION.md` | Hash vs History API | Anterior | ❌ Consolidar |
| 9 | `SPRINT_5_ARCHITECTURE_UPDATES.md` | Updates Summary | 2025-11-28 | ⚠️ **Revisar** |

### 📁 Outros Documentos Potencialmente Arquiteturais

| # | Arquivo | Tema | Manter? |
|---|---------|------|---------|
| 10 | `SDD.md` | Software Design Document | ✅ **Manter** (master doc) |
| 11 | `IMPACT_ANALYSIS.md` (docs/) | V2.0 Impact | ⚠️ **Revisar** se duplica artifacts |

---

## Proposta de Consolidação

### Opção A: ARCHITECTURE.md Único (Recomendada)

```
ARCHITECTURE.md
├── Store State Management (2025-11-29)
│   ├── Problem Statement
│   ├── Data Flow Diagrams
│   ├── Album Data Schema
│   ├── Impact Analysis
│   └── Implementation Plan
│
├── Routing Strategy (Hash vs History)
│   └── Decision: History API for OAuth
│
├── Caching Strategy
│   ├── L1 (Memory) + L2 (IndexedDB)
│   └── TTL & Invalidation
│
└── Cross-References
    ├── → SPRINT_5_PERSISTENCE_ARCHITECTURE.md (Repository Pattern)
    ├── → APPLE_MUSIC_ARCHITECTURE.md (OAuth Flow)
    └── → SDD.md (Overall Design)
```

**Benefícios**:
- ✅ Single source of truth para decisões arquiteturais
- ✅ Organizado cronologicamente
- ✅ Fácil navegação
- ✅ Reduz documentos redundantes

### Opção B: Manter Separado por Tema

```
/docs/
├── ARCHITECTURE_STORE_STATE.md (consolidado de artifacts)
├── ARCHITECTURE_CACHING.md
├── ARCHITECTURE_ROUTING.md
├── SPRINT_5_PERSISTENCE_ARCHITECTURE.md (manter)
└── APPLE_MUSIC_ARCHITECTURE.md (manter)
```

**Benefícios**:
- ✅ Modular
- ⚠️ Mais arquivos para manter

---

## Estrutura Proposta do ARCHITECTURE.md

```markdown
# Architecture Decision Records & Design Docs

## Table of Contents
- [Store State Management (2025-11-29)](#store-state-management)
- [Routing Strategy](#routing-strategy)
- [Caching Strategy](#caching-strategy)
- [Cross-References](#cross-references)

---

## Store State Management
**Date**: 2025-11-29  
**Status**: ✅ Approved  
**Related Issues**: #7 Album Not Found, #8 Ghost Albums

### Problem Statement
[conteúdo de impact_analysis.md]

### Data Flow
[conteúdo de data_flow_architecture.md]

### Album Data Schema
[conteúdo de album_data_schema.md]

### Implementation Plan
[conteúdo de implementation_plan.md]

---

## Routing Strategy
**Date**: [data do ROUTING_DECISION.md]  
**Status**: ✅ Implemented

[conteúdo]

---

## Caching Strategy
**Date**: [data do CACHING_STRATEGY.md]  
**Status**: ✅ Implemented

[conteúdo]

---

## Cross-References

### Repository Pattern & Firestore
→ See [SPRINT_5_PERSISTENCE_ARCHITECTURE.md](SPRINT_5_PERSISTENCE_ARCHITECTURE.md)

### Apple Music Integration
→ See [APPLE_MUSIC_ARCHITECTURE.md](APPLE_MUSIC_ARCHITECTURE.md)

### Overall System Design
→ See [SDD.md](SDD.md)
```

---

## Arquivos a Deletar Após Consolidação

### Artifacts (.gemini/)
- ❌ `implementation_plan.md` → consolidado
- ❌ `impact_analysis.md` → consolidado
- ❌ `data_flow_architecture.md` → consolidado
- ❌ `album_data_schema.md` → consolidado

### Docs (/docs/)
- ❌ `CACHING_STRATEGY.md` → consolidado
- ❌ `ROUTING_DECISION.md` → consolidado
- ⚠️ `SPRINT_5_ARCHITECTURE_UPDATES.md` → revisar duplicação

### Manter Inalterado
- ✅ `SPRINT_5_PERSISTENCE_ARCHITECTURE.md` (master persistence doc)
- ✅ `APPLE_MUSIC_ARCHITECTURE.md` (future feature)
- ✅ `SDD.md` (overall design)

---

## Ação Solicitada

**Por favor, aprove:**

1. ✅ Opção A (ARCHITECTURE.md único) ou Opção B (separado por tema)?
2. ✅ Deletar artifacts listados acima após consolidação?
3. ✅ Manter estrutura cronológica proposta?
4. ✅ Cross-references para docs complexos (Repository Pattern, etc.)?

Após aprovação, eu:
1. Crio `/docs/ARCHITECTURE.md` consolidado
2. Deleto artifacts redundantes
3. Atualizo referências em outros docs (README, etc.)
