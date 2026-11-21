# Tasks — Feature F85: «Start» no menu, e o logotipo leva à página de entrada · Plan: [[plan]]
**Approved**: pendente

## Pre-Implementation
- [x] o MJRP pôs a F85 na «Priorizada»; o ramo `claude/f85-start-in-the-menu`

## Implementation
- [x] TASK-01 «Start» no menu e na aba do celular; a rota `/start`, (`/home` levava a ela; revisto no TASK-05) · implements:: REQ-01 · model:: sonnet
- [x] TASK-02 o logotipo leva à página de entrada, no computador e no celular · implements:: REQ-02 · model:: sonnet
- [x] TASK-03 a decisão da raiz e os botões da página de entrada apontam para `/start` · implements:: REQ-03 · model:: sonnet

- [x] TASK-05 `/home` é a página de entrada para todos: Firebase, plugin, gate, rota que sai para o navegador sem laço, logotipo em `/home` (UAT-238) · implements:: REQ-01, REQ-02 · model:: sonnet

## Verification
- [ ] TASK-04 no navegador, a 1280 e a 393 px, com e sem conta: o rótulo, o logotipo, a raiz, os links antigos (provado no servidor de desenvolvimento, `reports/evidence/F85/2026-11-21-f85-browser-proof.md`; falta o build de produção sob `vite preview`) · implements:: REQ-01, REQ-02, REQ-03 · model:: sonnet · waiting:: resource — a fila de trabalhos pesados da máquina · action:: o integrador roda o build, a bateria completa e o doctor no trem de merge e confere a raiz em produção

## Documentation
- [x] `behavior.md`, o manual, `info-arch.md`, a evidência em `reports/evidence/F85/`
