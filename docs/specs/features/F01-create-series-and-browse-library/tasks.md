<!-- docs/specs/features/F01-create-series-and-browse-library/tasks.md — o QUANDO, reconstituído: cada task é uma entrega que um commit `delivered_by` já fez; só está marcada onde esse commit existe. Sem `rounds::`: o número de voltas Execute ⇄ Verify nunca foi medido e não se inventa. -->
# Tasks — Feature F01: Criar uma série de álbuns e achar os álbuns na biblioteca, com a nota de cada faixa · Plan: [[plan]]
**Approved**: not a gate

## Pre-Implementation
- [x] ramo da feature: não houve; a entrega foi feita antes do harness, direto na linha principal, pelos commits `delivered_by` das histórias
- [x] spec e plan conferidos entre si: cada REQ tem fluxo e commit no plan e uma task abaixo; escritos no conform de 2026-10-28

## Implementation
- [x] TASK-01 Roteador por History API, BaseView e a tela inicial que cria a série (nome padrão, aviso de criação, pedido de ao menos um álbum) — commit `5542a3c` (2025-11-26) · implements:: REQ-01 · model:: opus
- [x] TASK-02 Alimentar o gerador de playlists com as faixas em ordem de aclamação (curadoria) — commit `7154dc7` (2025-11-25) · implements:: REQ-04 · model:: opus
- [x] TASK-03 Biblioteca de séries em grade ou lista, com o cache de álbuns e o cliente da API, e a visão de ranking com a nota do BestEverAlbums por faixa — commit `1e5be0b` (2025-11-26) · implements:: REQ-02, REQ-04 · model:: opus
- [x] TASK-04 Busca e filtros da biblioteca — commit `585bed7` (2025-11-28) · implements:: REQ-03 · model:: opus

## Verification
- [x] TASK-05 Prova da entrega: em produção desde 2025-11-25 pelos commits `7154dc7`, `5542a3c`, `1e5be0b`, `585bed7`; os testes existentes que cobrem cada REQ estão no `verified_by` da spec e a evidência fica em `reports/evidence/F01/evidence.md` · implements:: REQ-01, REQ-02, REQ-03, REQ-04 · model:: sonnet

## Documentation
- [x] spec, plan e tasks reconstituídos do que foi entregue · feature Done sem aceite próprio (regra do MJRP de 2026-10-18); esta pasta e a de evidência entram no commit do conform
