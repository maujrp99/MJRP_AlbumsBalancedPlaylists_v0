# Tasks — Feature F87: Um ambiente separado para validar o site antes da produção · Plan: [[plan]]
**Approved**: pendente

## Pre-Implementation
- [ ] confirmar no plano a fatia A, que o MJRP escolheu em 2026-11-21 («A)»)
- [ ] o MJRP põe a F87 na «Priorizada»

## Implementation
- [ ] TASK-01 `scripts/deploy-preview.sh` (fatia A), com teste, sem rodar a publicação · implements:: REQ-01, REQ-02, REQ-03, REQ-05 · model:: sonnet
- [ ] TASK-02 garantir que a prévia não grava preço do Discogs no Firestore · implements:: REQ-04 · model:: opus

## Verification
- [ ] TASK-03 o MJRP abre o endereço da prévia e vê a versão nova · implements:: REQ-01, REQ-03 · model:: sonnet

## Documentation
- [ ] `arch.md` § Delivery strategy em dia
