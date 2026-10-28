<!-- docs/specs/features/F16-my-own-track-ranking/tasks.md — o QUANDO, reconstituído: cada task é uma entrega que um commit `delivered_by` já fez; só está marcada onde esse commit existe. Sem `rounds::`: o número de voltas Execute ⇄ Verify nunca foi medido e não se inventa. -->
# Tasks — Feature F16: Dar a minha própria ordem às faixas de um álbum e misturar por ela · Plan: [[plan]]
**Approved**: not a gate

## Pre-Implementation
- [x] ramo da feature: não houve; a entrega foi feita antes do harness, direto na linha principal, pelos commits `delivered_by` das histórias
- [x] spec e plan conferidos entre si: cada REQ tem fluxo e commit no plan e uma task abaixo; escritos no conform de 2026-10-28

## Implementation
- [x] TASK-01 Ranking do usuário: repositório, estratégia, janela «Rank It», receita «My Own Ranking» (Top N pela ordem do usuário) e persistência corrigida — commit `7aa9704` (2026-01-11) · implements:: REQ-01 · model:: opus

## Verification
- [x] TASK-02 Prova da entrega: em produção desde 2026-01-11 pelos commits `7aa9704`; os testes existentes que cobrem cada REQ estão no `verified_by` da spec e a evidência fica em `reports/evidence/F16/evidence.md` · implements:: REQ-01 · model:: sonnet

## Documentation
- [x] spec, plan e tasks reconstituídos do que foi entregue · feature Done sem aceite próprio (regra do MJRP de 2026-10-18); esta pasta e a de evidência entram no commit do conform
