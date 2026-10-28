---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-08-sort-the-series-by-name-album-count-or-date]]"]
planned_for: "[[ROADMAP#^REL-05]]"
---
<!-- docs/specs/features/F15-sort-the-series/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F15: Ordenar as séries por nome, quantidade de álbuns ou data
**Approved**: not a gate

## Summary
**A feature:** um seletor «Sort» na biblioteca ordena as séries por quantidade de álbuns, por nome (A-Z e Z-A) ou da mais nova para a mais antiga e vice-versa.

**Por quê:** a pessoa quer achar a série certa quando tem muitas.

**Como saber que funcionou:** trocar a opção do seletor «Sort» muda a ordem dos grupos de séries no painel de todas as séries.

## Problem Statement
Com muitas séries, a pessoa precisa ordená-las para achar a certa (S-08). Proveniência: Sprint 21 do ROADMAP legado («Series Sorting: functional sorting by Name, Album Count, and Recency»); commit 29b3f5e (2026-01-14). Feature reconstituída no conform de 2026-10-28.

## Requirements
- [REQ-01] A pessoa ordena as séries da biblioteca por quantidade de álbuns, nome (A-Z e Z-A) ou mais novo e mais antigo; a ordem muda os grupos de séries e não os álbuns, e só se nota no painel de todas as séries. · from [[S-08-sort-the-series-by-name-album-count-or-date|S-08]]
  verified_by:: sem teste automatizado próprio (o NFR-01 registra a falta de testes de ponta a ponta); a prova é a entrega em produção, commit 29b3f5e (2026-01-14) — ver reports/evidence/F15/evidence.md

## Observable States
- S-08 · [[behavior#^library-series-sort]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-08 (REQ-01): a ordem muda os grupos de séries, não os álbuns, e só se nota no painel de todas as séries; começa por quantidade de álbuns crescente.

## Out of Scope
- Ordenar os álbuns dentro de uma série: a ordem muda os grupos de séries, não os álbuns.
- Ver todos os álbuns de uma série no painel geral: o v0 ainda não faz.

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
