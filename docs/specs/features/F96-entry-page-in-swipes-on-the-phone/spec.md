---
status: Draft
lane: standard
solution_type: feature
imports: ["[[S-78-swipe-through-the-entry-page-on-the-phone]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F96: A página de entrada no celular, organizada em swipes
**Approved**: pendente. Em esboço, esperando a rodada de protótipo com o MJRP.

## Summary
**A feature:** No celular, a página de entrada (F80) deixa de ser uma página vertical longa e passa a ter quatro partes: o cabeçalho com a caixa na diagonal, um primeiro swipe com os passos que a página ensina, um segundo swipe com a caixa do The Album Blender, e o rodapé.

**Por quê:** O MJRP acha que, no celular, passar os passos de lado, como num carrossel, deixa a experiência melhor e a tela mais limpa do que a página vertical de hoje.

**Como saber que funcionou:** Quem abre a página de entrada no celular vê as quatro partes nessa ordem, passa os passos com o dedo lendo o rótulo de cada um, e chega à caixa do The Album Blender no segundo swipe. A forma exata sai da rodada de protótipo.

## Problem Statement
Dito pelo MJRP em 2026-11-23: «Para a versão mobile, to pensando aqui que em vez de a home ser vertical, se nao seria melhor os passos do que ela ensina, ser em formato de swipe para o usuario como num carrossel com os labels Lado A · 1 — Criar...Lado B · 2 — Inventário. Acho que a experiencia e o unclutter da tela ficariam melhor, o que nosso expert de UX e UI diria? Ah e abaixo do carrossel teria a caixa do The Album Blender em Swipe, aí...aí neste caso, no primeiro swipe teríamos somente o os elementos de UI ilustrativos pra como funcionaria a app.»

E a estrutura, nas palavras dele: «Entao ficaria assim no mobile: 1. Hero/Header com a caixa na diagonal - o botao criar creio que poderia sair, pois já aparece no top nav 2. Swipe 1 - a parte educativa da app 3. Swipe 2 - a parte da caixa do the album blender 4. footer».

Fatos conferidos no código da `main` (2026-11-23; só leitura):
- Os rótulos dos passos já existem na página de entrada (`public/splash/copy.js`): «Lado A · 1 — Criar», «Lado A · 2 — Álbuns», «Lado A · 3 — Blend», «Lado B · 1 — Playlists», «Lado B · 2 — Inventário».
- A curadoria dos álbuns da caixa está registrada na F95, com o nome «Na caixa do The Album Blender» (escolha do MJRP, 2026-11-23).

## Requirements
- [REQ-01] No celular, a página de entrada tem quatro partes, nesta ordem: o cabeçalho com a caixa na diagonal; o primeiro swipe; o segundo swipe; o rodapé · fixes S-78
- [REQ-02] O primeiro swipe é a parte que ensina o produto: a pessoa passa os passos de lado, como num carrossel, e cada passo traz o seu rótulo, como o MJRP os nomeou: de «Lado A · 1 — Criar» a «Lado B · 2 — Inventário» · fixes S-78
- [REQ-03] No primeiro swipe, cada passo mostra só os elementos de interface ilustrativos de como o app funciona · fixes S-78
- [REQ-04] O segundo swipe, abaixo do primeiro, é a caixa do The Album Blender: os álbuns da curadoria (F95), passados de lado · fixes S-78
- [REQ-05] A página de entrada no celular segue garantindo o que já garante (S-62): lê-se inteira sem script, nada se move com «reduzir movimento», e as capas reais seguem com o seu crédito · fixes S-78

## Observable States
A escrever depois da rodada de protótipo.

## Success Criteria
A escrever depois da rodada de protótipo.

## Out of Scope
A página de entrada no computador (o MJRP falou só do celular), a menos que ele diga o contrário; o nome e o conteúdo da curadoria (F95); o menu do alto (F88, F91); as telas do app.

## Open Questions
Nada disto está decidido; são as perguntas da rodada de protótipo.
- **Como a pessoa descobre que há mais para passar.** O que mostra que o swipe continua: um pedaço do passo seguinte à vista, pontos, setas, o rótulo, um contador.
- **O botão «Criar» sai do alto da página?** O MJRP: «o botao criar creio que poderia sair, pois já aparece no top nav». Ele disse «creio»: confirmar no protótipo.
- **A caixa na diagonal no celular.** Está em investigação, pelo peso e pela suavidade, numa issue da F80; o cabeçalho desta feature depende do que sair de lá.
- **O que o computador mantém.** Ele falou só do celular: o computador fica como está?
- **A acessibilidade de um swipe.** Botões para avançar e voltar, nenhum avanço automático, «reduzir movimento», leitor de tela e teclado.
- **O que vê quem está sem script.** Hoje a página se lê inteira sem script (S-62): os passos e os álbuns precisam continuar à vista.
- **A relação com a F95.** A curadoria «Na caixa do The Album Blender» vira o segundo swipe no celular; a redação do nome no celular fecha aqui, no protótipo. Qual das duas se constrói primeiro, ou se saem juntas.
- **O que o nosso especialista de UX e UI diria.** Ele perguntou; a crítica separada do protótipo responde.
