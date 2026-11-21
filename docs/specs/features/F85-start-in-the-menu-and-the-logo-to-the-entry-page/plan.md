# Plan — Feature F85: «Start» no menu, e o logotipo leva à página de entrada · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
Via rápida. Rótulo e rota em `public/js/components/navigation/phoneTabs.js`, no menu do computador e no roteador (`/start`, com `/home` redirecionando); o destino do logotipo; a decisão da raiz e os botões da página de entrada (`scripts/entryPage.mjs`, `public/splash.html`, `signInFromLink.js`). Teste primeiro.

## Technical Design
A escrever no ramo.

## Dependencies
F79 e F80, entregues.

## Documents Consulted
`docs/specs/behavior.md` (a raiz do site e a página de entrada), `docs/specs/arch.md` (a raiz: duas páginas no build).

## Risks & Considerations
Um link salvo para `/home` quebrar; um piscar da página de entrada para quem tem conta.
