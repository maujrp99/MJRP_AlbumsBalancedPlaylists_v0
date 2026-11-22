# Plan — Feature F94: Transições suaves entre as telas · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
Em esboço. Começa por uma rodada de desenho, antes de escolher o mecanismo. O que é sabido (conferido no código da linha React em 2026-11-22): o roteador troca o conteúdo de `#app` sem transição, depois de pedir o arquivo da tela nova (carga sob demanda, com barra de progresso após 150 ms); a home é uma página HTML à parte, `public/splash.html`. Um mecanismo só no roteador serve todas as telas depois de a F83 chegar à produção.

## Technical Design
A escrever depois da rodada de desenho aprovada. Candidatas a comparar: cruzamento entre telas, View Transitions do navegador, movimento de elemento compartilhado, esqueleto enquanto carrega; todas respeitando «reduzir movimento» e o design system.

## Dependencies
F83 (as telas em React; bloqueia: entra logo depois de chegar à produção), F88 (o menu), F85 e S-70 (a passagem da home para o app).

## Documents Consulted
`public/js/router.js`, `public/js/utils/loadScreen.js`, `public/js/components/GlobalProgress.js`, `public/splash.html` (linha `integrate/staging-2026-11-21`, só leitura).

## Risks & Considerations
- Uma transição não pode atrasar a troca nem esconder a falha de carga (REQ-04).
- A home, sendo outra página, pode ficar de fora do mecanismo do roteador.
- «Reduzir movimento» precisa valer em todas as variantes.
