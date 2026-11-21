# Tasks — Feature F85: «Start» no menu, e o logotipo leva à página de entrada · Plan: [[plan]]
**Approved**: pendente

## Pre-Implementation
- [x] o MJRP pôs a F85 na «Priorizada»; o ramo `claude/f85-start-in-the-menu`

## Implementation
- [x] TASK-01 «Start» no menu e na aba do celular; a rota `/start`, com `/home` e `/home?signin` levando a ela · implements:: REQ-01 · model:: sonnet
- [x] TASK-02 o logotipo leva à página de entrada, no computador e no celular · implements:: REQ-02 · model:: sonnet
- [x] TASK-03 a decisão da raiz e os botões da página de entrada apontam para `/start` · implements:: REQ-03 · model:: sonnet

## Verification
- [ ] TASK-04 (aberta: provado no servidor de desenvolvimento a 1280 e 393, com e sem conta, `reports/evidence/F85/2026-11-21-f85-browser-proof.md`; FALTA o build de produção sob `vite preview`, a bateria completa e o doctor neste ramo) no navegador, a 1280 e a 393 px, com e sem conta: o rótulo, o logotipo, a raiz, os links antigos · implements:: REQ-01, REQ-02, REQ-03 · model:: sonnet

## Documentation
- [x] `behavior.md`, o manual, `info-arch.md`, a evidência em `reports/evidence/F85/`
