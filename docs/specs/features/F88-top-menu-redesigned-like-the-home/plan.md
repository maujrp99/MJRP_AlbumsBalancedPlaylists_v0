# Plan — Feature F88: O menu do topo do app redesenhado na linguagem da nova home · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
Esboço. Uma rodada de desenho primeiro (protótipo no comparador, em artefato do Claude), depois a construção em React na onda 3 da F83 (a moldura: barra do topo, rodapé, moldura do celular, login, em `public/js/shell/`). Parte da barra da home (`design/proposals/f80-splash/proposal.md`, Rodada 3 · v4) e dos componentes atuais em `public/js/components/navigation/` (`AuthNav`, `PhoneMenu`, `PhoneShell`, `SeriesDropdown`).

## Technical Design
A escrever depois da aprovação do protótipo.

## Dependencies
F80 (a home e a barra de que o menu parte); F83 (a migração para React, onda da moldura); F81 (os textos em português e inglês); F85 (o item «Start» no menu e o logotipo para a home).

## Documents Consulted
`design/proposals/f80-splash/proposal.md` § Rodada 3 · v4, `public/js/components/navigation/`, `docs/specs/design-system.md`.

## Risks & Considerations
A F88 não pode ir à produção sozinha: a home espera o fim da migração e o menu novo entra com ela (REQ-06). O menu do app faz mais coisas que o da home (conta, conexões, celular); nenhuma pode se perder (REQ-02).
