# Plan — Feature F91: «Criar» (Create) no menu, com um ícone de adição · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
Em esboço. Mudança pequena de nome e ícone, sem arquitetura nova. O que é sabido (conferido no código em 2026-11-22): o nome «Start» está escrito em `public/js/components/navigation/phoneTabs.js` (a aba do celular e o nome da tela na barra de cima), em `Breadcrumb.js`, em `Footer.js` e no menu do computador (`TopNav.js`); o texto vai para o dicionário de pares pt/en da F81. O ícone «Go» a trocar mora no conjunto de ícones do app.

## Technical Design
A escrever depois de o MJRP confirmar o nome e o ícone. Um ícone de adição só entra se o `design-system.md` não o tiver; então é acrescentado lá primeiro.

## Dependencies
F85 (o nome «Start» e o logotipo), F88 (o menu redesenhado), F81 (idiomas: o «Criar» em português).

## Documents Consulted
`docs/specs/features/F85-*`, `F88-*`, `public/js/components/navigation/phoneTabs.js`.

## Risks & Considerations
- A F85 e a F88 estão em andamento e tocam as mesmas linhas.
- O endereço `/start` já foi publicado e pode estar em links salvos.
