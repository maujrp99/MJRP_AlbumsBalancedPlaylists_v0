<!-- docs/specs/features/F17-rating-origin-and-refetch/tasks.md — o QUANDO, reconstituído: cada task é uma entrega que um commit `delivered_by` já fez; só está marcada onde esse commit existe. Sem `rounds::`: o número de voltas Execute ⇄ Verify nunca foi medido e não se inventa. -->
# Tasks — Feature F17: Ver de onde vem a nota de cada faixa e buscar de novo os dados de um álbum · Plan: [[plan]]
**Approved**: not a gate

## Pre-Implementation
- [x] ramo da feature: não houve; a entrega foi feita antes do harness, direto na linha principal, pelos commits `delivered_by` das histórias
- [x] spec e plan conferidos entre si: cada REQ tem fluxo e commit no plan e uma task abaixo; escritos no conform de 2026-10-28

## Implementation
- [x] TASK-01 Buscar de novo os dados de um álbum: botão «Refetch», avisos, barra de progresso e uso dos dados novos na mistura — commit `a2f789e` (2026-01-17) · implements:: REQ-02 · model:: opus
- [x] TASK-02 Evidências da nota: servidor expõe as fontes, o transformador as guarda e a estrela mostra a dica; persistência do que foi buscado — commit `bb801a5` (2026-01-19) · implements:: REQ-01 · model:: opus

## Verification
- [x] TASK-03 Prova da entrega: em produção desde 2026-01-17 pelos commits `a2f789e`, `bb801a5`; os testes existentes que cobrem cada REQ estão no `verified_by` da spec e a evidência fica em `reports/evidence/F17/evidence.md` · implements:: REQ-01, REQ-02 · model:: sonnet

## Documentation
- [x] spec, plan e tasks reconstituídos do que foi entregue · feature Done sem aceite próprio (regra do MJRP de 2026-10-18); esta pasta e a de evidência entram no commit do conform
