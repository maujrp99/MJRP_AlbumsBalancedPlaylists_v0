# Tasks — Feature F86: O design system do site, como artefato · Plan: [[plan]]
**Approved**: pendente

## Pre-Implementation
- [x] o MJRP põe a F86 na «Priorizada» — o card estava na «Priorizada» e foi movido para «Em andamento» em 2026-11-21, nesta sessão (`board_move.py`)
- [x] levantar do código os tokens, fontes e componentes em uso — `docs/specs/design-system.md` refeito do código (log 2026-11-21 11:43, `d47a5a3`)

## Implementation
- [x] TASK-01 a página do design system do site, gerada do documento, publicada como artefato · implements:: REQ-01 · model:: opus — prova: https://claude.ai/artifact/RHR5zAhDUhQowiEn5BeCgj (versão 1), gerada por `design/proposals/design-system/build-design-system.mjs` (45 quadros vivos, 25 linhas para aprovar, contraste medido igual ao documento); os 5 P1 da primeira crítica corrigidos e os 6 P1 da segunda crítica (`reports/audits/2026-11-21-mjrpalbumblender-v0-f86-design-system-page-critique-2.md`) corrigidos antes de publicar
- [x] TASK-02 a página de revisão dos textos vestida com o design system do site · implements:: REQ-02 · model:: sonnet — prova: log 2026-11-21 11:46, republicada em https://claude.ai/artifact/DDE57759QtWJkM4qKVHzBF (versão 2); a página do design system liga para ela na seção «Texto», sem copiar a lista

## Verification
- [ ] TASK-03 a página confere com o site no navegador, no computador e no celular · implements:: REQ-01, REQ-02 · model:: sonnet — feito em parte: a página conferida num navegador a 1280x800 e a 390x844 (sem rolagem lateral, 39 palavras na primeira tela do celular, os quadros com o CSS do site); falta pôr cada peça ao lado da tela do site em produção

## Documentation
- [x] `design-system.md` em dia — o link da página no topo; quatro desencontros provados corrigidos e marcados pendentes de aprovação (contraste no painel, o texto preto no fogo, o corpo de texto, o vidro da base); a recomendação da ponta amarela
