<!-- docs/specs/features/F18-phone-use/tasks.md — o QUANDO, reconstituído: cada task é uma entrega que um commit `delivered_by` já fez; só está marcada onde esse commit existe. Sem `rounds::`: o número de voltas Execute ⇄ Verify nunca foi medido e não se inventa. -->
# Tasks — Feature F18: Usar o app no celular: menu em gaveta, faixas empilhadas e ordenação pelo toque · Plan: [[plan]]
**Approved**: not a gate

## Pre-Implementation
- [x] ramo da feature: não houve; a entrega foi feita antes do harness, direto na linha principal, pelos commits `delivered_by` das histórias
- [x] spec e plan conferidos entre si: cada REQ tem fluxo e commit no plan e uma task abaixo; escritos no conform de 2026-10-28

## Implementation
- [x] TASK-01 Menu do celular: fundo sólido, hambúrguer à esquerda e ícones que faltavam (a gaveta de navegação) — commit `8bd0b5c` (2025-12-06) · implements:: REQ-01 · model:: sonnet
- [x] TASK-02 Janela «Rank It» em tela cheia; o mesmo commit traz a tabela de faixas responsiva e a ordenação das séries, que outras histórias citam — commit `29b3f5e` (2026-01-14) · implements:: REQ-03 · model:: opus
- [x] TASK-03 Fechamento da Sprint 21, citado pelas três histórias: documentos e testes (o commit não mexe em código de tela) — commit `6d79577` (2026-01-14) · implements:: REQ-01, REQ-02, REQ-03 · model:: sonnet

## Verification
- [x] TASK-04 Prova da entrega: em produção desde 2025-12-06 pelos commits `8bd0b5c`, `6d79577`, `29b3f5e`; os testes existentes que cobrem cada REQ estão no `verified_by` da spec e a evidência fica em `reports/evidence/F18/evidence.md` · implements:: REQ-01, REQ-02, REQ-03 · model:: sonnet

## Documentation
- [x] spec, plan e tasks reconstituídos do que foi entregue · feature Done sem aceite próprio (regra do MJRP de 2026-10-18); esta pasta e a de evidência entram no commit do conform
