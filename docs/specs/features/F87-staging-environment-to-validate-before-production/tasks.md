# Tasks — Feature F87: Um ambiente separado para validar o site antes da produção · Plan: [[plan]]
**Approved**: pendente

## Pre-Implementation
- [ ] confirmar no plano a fatia A, que o MJRP escolheu em 2026-11-21 («A)»)
- [x] o MJRP põe a F87 na «Priorizada» · feito: a F87 está em `docs/specs/priority.md` (commits `71a9f6b` e `965c5ea`)

## Implementation
- [x] TASK-01 `scripts/deploy-preview.sh` (fatia A), com teste, sem rodar a publicação · implements:: REQ-01, REQ-02, REQ-03, REQ-05 · model:: sonnet · rounds:: 1 · evidência: `scripts/deploy-preview.sh` e `test/server/deployPreview.test.js` na `main`; `docs/log.md` de 2026-11-21 14:37
- [x] TASK-01b `deploy-preview.sh --branch <ramo local>` (padrão `main`): exporta e constrói esse ramo com as mesmas checagens; a checagem de «limpo» vale para a pasta onde o ramo está; recusa ramo inexistente; `deploy-site.sh` não ganha a opção (teste prova) · implements:: REQ-01, REQ-02 · model:: sonnet · rounds:: 1 · evidência: o cabeçalho de uso de `scripts/deploy-preview.sh` (`--branch <branch>`); `docs/log.md` de 2026-11-21 14:40
- [ ] TASK-02 garantir que a prévia não grava preço do Discogs no Firestore · implements:: REQ-04 · model:: opus

- [x] TASK-04 o servidor aceita os canais de prévia do próprio site (`server/lib/corsOrigin.js`, teste `test/server/corsOrigin.test.js`); fica em produção só depois de `npm run deploy:server` · implements:: REQ-01, REQ-03 · fixes:: UAT-261 · model:: sonnet · rounds:: 1 · evidência: `server/lib/corsOrigin.js` e `test/server/corsOrigin.test.js` na `main`; o servidor foi publicado da `main` depois disso (`docs/log.md` de 2026-11-23 11:21, revisão `mjrp-proxy-00216-cxd`)

## Verification
- [x] TASK-03 o MJRP abre o endereço da prévia e vê a versão nova · implements:: REQ-01, REQ-03 · model:: sonnet · rounds:: 1 · evidência: `docs/log.md` de 2026-11-22 00:11 (o MJRP testou na prévia `home-menu` antes de mandar publicar) e de 2026-11-23 01:08 (a migração inteira na prévia `staging`)

## Documentation
- [ ] `arch.md` § Delivery strategy em dia
