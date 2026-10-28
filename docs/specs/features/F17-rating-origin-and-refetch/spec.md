---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-28-see-where-each-tracks-rating-comes-from]]", "[[S-29-fetch-an-albums-data-again]]"]
planned_for: "[[ROADMAP#^REL-05]]"
---
<!-- docs/specs/features/F17-rating-origin-and-refetch/spec.md — feature entregue antes do harness e reconstituída no conform de 2026-10-28 a partir dos nós das histórias, do ROADMAP legado e dos commits `delivered_by`. Nasce Done e não carrega aceite próprio (regra do MJRP de 2026-10-18: o que estava fechado e em produção antes do harness nasce aceito). -->
# Feature F17: Ver de onde vem a nota de cada faixa e buscar de novo os dados de um álbum
**Approved**: not a gate

## Summary
**A feature:** ao passar o mouse na estrela de uma faixa, a dica mostra a fonte e a nota de cada fonte; e o botão «Refetch» busca de novo os dados de um álbum nas fontes de nota e mantém os dados novos depois de recarregar a página.

**Por quê:** a pessoa quer confiar na nota, ou saber por que desconfiar dela, e manter as notas e a popularidade em dia.

**Como saber que funcionou:** passar o mouse na estrela mostra «fonte: nota (votos)»; clicar em «Refetch» avisa o início e o fim e a nota nova continua lá depois de recarregar a página.

## Problem Statement
A nota de uma faixa era um número solto, sem a fonte (S-28), e os dados buscados de novo se perdiam ao recarregar (S-29). Proveniência: Sprint 23 do ROADMAP legado («Consolidated Ranking Refactor: Evidence UI, Persistence Logic, Cache Sync») e sua spec arquivada (docs/technical/specs/archive/sprint23-ranking-refactor/); commits a2f789e (2026-01-17) e bb801a5 (2026-01-19). Feature reconstituída no conform de 2026-10-28.

## Requirements
- [REQ-01] A pessoa passa o mouse na estrela de uma faixa e vê a fonte e a nota de cada fonte, no formato «fonte: nota (votos)». · from [[S-28-see-where-each-tracks-rating-comes-from|S-28]]
  verified_by:: test/transformers/TrackTransformer.test.js (preserva as evidências da nota); entrega em produção: commit bb801a5 (2026-01-19) — ver reports/evidence/F17/evidence.md
- [REQ-02] A pessoa pede ao app que busque de novo os dados de um álbum nas fontes de nota (botão «Refetch», com avisos de início, sucesso ou falha e barra de progresso no topo); a mistura passa a usar os dados novos. · from [[S-29-fetch-an-albums-data-again|S-29]]
  verified_by:: test/services/SeriesService.test.js (refetchAlbumMetadata grava o álbum atualizado); entrega em produção: commit a2f789e (2026-01-17) — ver reports/evidence/F17/evidence.md

## Observable States
- S-28 · [[behavior#^track-score-evidence-tooltip]]
- S-29 · [[behavior#^album-refetch-feedback]]

## Prototype Parity
- Prototype: não se aplica. Tela entregue antes do harness e em produção; o v0 não tem protótipo aprovado, `info-arch.md` nem `design-system.md` (PRD, «Desenho e protótipo»).
- Transversal layer touched: não comparada. Regra do MJRP de 2026-10-18: em brownfield o sensor visual não roda no que já está fechado e em produção; ele continua declarado para a primeira tela alterada depois do harness.
- Design-system cuts or swaps: none.

## Success Criteria
- Para S-28 (REQ-01): a dica mostra o formato «fonte: nota (votos)».
- Para S-29 (REQ-02): o botão «Refetch» mostra avisos de início, sucesso ou falha e uma barra de progresso no topo; a mistura passa a usar os dados novos.

## Out of Scope
- Abrir o ranking do álbum e o ranking de todas as faixas por endereço: o v0 ainda não faz.
- Comparar a nota da crítica com a popularidade no Spotify (F11).

## Open Questions
- Nenhuma. As dúvidas de produto que a reconstituição levantou estão no relatório do conform (pacote D1), com opções e recomendação.
