---
status: Draft
lane: standard
solution_type: improvement
imports: ["[[S-76-move-between-screens-smoothly]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F94: Transições suaves entre as telas
**Approved**: pendente. Em esboço, esperando o MJRP. Depende da migração das telas para React (F83) chegar à produção.

## Summary
**A feature:** A passagem de uma tela para outra (os itens do menu, da home para o app e de volta, a abertura e o fechamento de janelas e de folhas do celular) deixa de ser abrupta e passa a ser suave, por um mecanismo só para o app inteiro, respeitando «reduzir movimento».

**Por quê:** Hoje a tela some e outra aparece de uma vez; o MJRP quer mais suave. Com todas as telas em React (F83) um só mecanismo serve o app inteiro, por isso vem logo depois da migração.

**Como saber que funcionou:** Ao trocar de tela, a anterior sai e a nova entra sem corte seco nem espaço vazio; com «reduzir movimento» ligado, a troca é imediata; o roteador, os guardas de saída e a medição de uso seguem iguais.

## Problem Statement
Dito pelo MJRP em 2026-11-22: «agora que vi no menu aquela barra laranja que aparece no topo, nao deveria aparecer mesmo e as transicoes precisam ser mais suaves, creio que é pq nao finalizou a migracao ainda, certo?» À pergunta do orquestrador «Transições mais suaves entre telas: registro para logo depois da migração (recomendo)?», respondeu: «3. Sim».

Fatos conferidos no código da linha React (`integrate/staging-2026-11-21`, 2026-11-22; só leitura):
- O roteador (`public/js/router.js`) troca a tela sem transição: ao mudar de rota ele destrói a tela atual, pede o arquivo da tela nova, a desenha e só então troca o conteúdo de `#app` (esvazia o contêiner e põe o novo, ou `innerHTML`). Não há animação nem a API de View Transitions do navegador no roteador; só há movimento em partes soltas (a folha do celular, `Sheet.js`, e a camada do menu) e a regra «reduzir movimento» em algumas folhas de estilo.
- As telas carregam sob demanda: cada rota importa o arquivo da tela só quando é visitada (`loadScreen(() => import('./screens/…/index.ts'))` em `public/js/app.js`). Enquanto o arquivo vem, quem usa continua vendo a tela anterior (o contêiner só é trocado quando a nova está desenhada) e, passados 150 ms, aparece uma barra de progresso fixa no topo (`GlobalProgress`, cor laranja da marca); a troca, quando chega, é seca.
- A home é uma página HTML à parte (`public/splash.html`), fora do roteador: ir da home para o app (e voltar pelo logotipo) é uma carga de página inteira do navegador, não uma troca de tela do app; por isso entrar no app de lá não usa o mesmo mecanismo de dentro do app sem decisão própria (ver S-70 e a F85).

## Requirements
- [REQ-01] A passagem entre as telas do app (itens do menu, abrir e voltar) é suave, por um mecanismo único no roteador, sem cada tela refazer o seu · fixes S-76
- [REQ-02] A abertura e o fechamento de janelas e de folhas do celular seguem o mesmo jeito de se mover das telas · fixes S-76
- [REQ-03] Com «reduzir movimento» ligado no aparelho, a troca é imediata, sem animação · fixes S-76
- [REQ-04] A transição não atrasa a troca nem esconde a falha: se o arquivo da tela demora ou falha, o aviso de «sem conexão» e o de versão nova aparecem como hoje, sem a tela ficar presa no meio da animação · fixes S-76

## Observable States
A escrever depois da rodada de desenho.

## Success Criteria
A escrever depois da rodada de desenho.

## Out of Scope
Redesenhar as telas; a migração para React em si (F83); o desenho do menu (F88). Se a home entra no mesmo mecanismo é pergunta aberta abaixo.

## Open Questions
- **A barra laranja que aparece no topo ao clicar em Albums e Blend: qual é, e sai.** O MJRP já disse que não é a faixa «By Album · By Artist…» sob o menu nas telas de Albums e Blend; falta a foto dele para dizer qual é. Pergunta aberta à parte da transição; não se registra o que ela é até a foto. (Pista do agente, não confirmada: o código tem uma barra de progresso laranja fixa no topo, mostrada enquanto o arquivo de uma tela chega; a foto confirma ou descarta.)
- **Como suavizar?** Cruzamento entre as telas (cross-fade), as transições de vista do navegador (View Transitions), movimento de um elemento compartilhado de uma tela para a outra, ou um esqueleto da tela enquanto carrega: não decidido. Começa por uma rodada de desenho (um protótipo que compara duas ou três maneiras, dentro do design system).
- Quanto dura a transição? Não decidido.
- A home (página à parte) entra? Não decidido; mexe na F85 e na S-70.
- O MJRP acha que é porque a migração ainda não terminou: a resposta do agente é que em parte sim (um mecanismo só depende de todas as telas em React), por isso a feature espera a migração.
