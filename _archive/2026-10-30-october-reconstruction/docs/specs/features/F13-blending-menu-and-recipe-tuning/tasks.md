<!-- docs/specs/features/F13-blending-menu-and-recipe-tuning/tasks.md — o QUANDO, reconstituído: cada task é uma entrega que um commit `delivered_by` já fez; só está marcada onde esse commit existe. Sem `rounds::`: o número de voltas Execute ⇄ Verify nunca foi medido e não se inventa. -->
# Tasks — Feature F13: Montar a mistura em passos, ajustar a receita, dar nome ao lote e gerar de novo sem sair da tela · Plan: [[plan]]
**Approved**: not a gate

## Pre-Implementation
- [x] ramo da feature: não houve; a entrega foi feita antes do harness, direto na linha principal, pelos commits `delivered_by` das histórias
- [x] spec e plan conferidos entre si: cada REQ tem fluxo e commit no plan e uma task abaixo; escritos no conform de 2026-10-28

## Implementation
- [x] TASK-01 Menu de mistura em passos: seletor de série, escolha de receita e ingredientes, geração e nome padrão do lote — commit `e8ebe0b` (2025-12-23) · implements:: REQ-01 · model:: opus
- [x] TASK-02 Painel de reconfigurar e componentes das playlists, para gerar de novo com outra receita na própria tela — commit `333e72b` (2025-12-23) · implements:: REQ-03 · model:: opus
- [x] TASK-03 Polimento do menu de mistura: seletor de série e ingredientes por receita, e correção da store de séries — commit `9d53fdf` (2025-12-31) · implements:: REQ-01 · model:: sonnet
- [x] TASK-04 Ajuste da receita: faixas por álbum, formas de agrupar, uma ou várias playlists e duração — commit `ab4bbb6` (2026-01-02) e commit `a86877a` (2026-01-02) · implements:: REQ-02 · model:: opus
- [x] TASK-05 Nome do lote sempre à vista, refletido nos títulos da grade e na exportação — commit `d3ed5e1` (2026-01-02) · implements:: REQ-04 · model:: sonnet

## Verification
- [x] TASK-06 Prova da entrega: em produção desde 2025-12-23 pelos commits `e8ebe0b`, `333e72b`, `9d53fdf`, `ab4bbb6`, `a86877a`, `d3ed5e1`; os testes existentes que cobrem cada REQ estão no `verified_by` da spec e a evidência fica em `reports/evidence/F13/evidence.md` · implements:: REQ-01, REQ-02, REQ-03, REQ-04 · model:: sonnet

## Documentation
- [x] spec, plan e tasks reconstituídos do que foi entregue · feature Done sem aceite próprio (regra do MJRP de 2026-10-18); esta pasta e a de evidência entram no commit do conform
