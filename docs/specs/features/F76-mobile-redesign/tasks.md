# Tasks — Feature F76: O app no celular, redesenhado · Plan: [[plan]]
**Approved**: pendente

## Pre-Implementation
- [x] crítica de UX das telas no celular, com a skill `mjrp-critiquing-ux-ui` (`reports/audits/2026-11-20-mjrpalbumblender-v0-mobile-ux-audit.md`)
- [x] a feature priorizada pelo MJRP (`priority.md`, 2026-11-20)
- [x] protótipo julgado antes da construção: dispensado pelo MJRP para esta feature (as palavras dele estão no `spec.md`)

## Implementation
- [x] TASK-01 a base do celular: medidas mínimas, áreas seguras, a barra de baixo, a barra do topo, a folha (de tela cheia e de baixo), o app pelo ícone da tela de início · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-13 · model:: opus
- [x] TASK-02 Albums: filtros em folha, cabeçalho de série, cartão com ações nomeadas, visão em lista, paginação · implements:: REQ-01, REQ-05 · model:: opus
- [x] TASK-03 a janela do álbum e a janela de ranking · implements:: REQ-06, REQ-07 · model:: opus
- [x] TASK-04 Playlists e playlists gravadas · implements:: REQ-01, REQ-08 · model:: opus
- [x] TASK-05 Home: criar e editar série · implements:: REQ-09 · model:: opus
- [x] TASK-06 Blend · implements:: REQ-10 · model:: opus
- [x] TASK-07 Inventário, depois da F75 · implements:: REQ-11 · model:: opus

## Verification
- [x] TASK-08 a tela de computador igual, antes e depois, em cada tela; as medidas da crítica refeitas a 393x852 e 852x393: `reports/evidence/F76/2026-11-20-foundation-proof.md` (antes/depois, 393x852, 852x393 e 1280x800, com `compare.py`) e `reports/evidence/F76/2026-11-20-production-proof.md` (a 1280x800 nenhum elemento do celular nas três telas conferidas); nada num iPhone, nenhuma tela com dados na primeira prova (não verificado) · implements:: REQ-01, REQ-02, REQ-12 · model:: opus

## Documentation
- [x] `docs/specs/behavior.md`, `docs/specs/info-arch.md`, `docs/specs/arch.md` e o manual
