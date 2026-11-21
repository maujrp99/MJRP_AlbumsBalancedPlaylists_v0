---
status: Draft
lane: standard
solution_type: feature
imports: ["[[S-70-move-from-the-home-to-the-app-without-a-jolt]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F88: O menu do topo do app redesenhado na linguagem da nova home
**Approved**: pendente

## Summary
**A feature:** O menu do topo do app passa a ter a cara e o jeito do menu da nova home (F80), para que ir da home ao app seja uma transição só.

**Por quê:** Hoje a home nova e o app têm menus de aparência diferente; quem entra pela home sente a troca de um site por outro.

**Como saber que funcionou:** O MJRP vai da home ao app e o menu parece o mesmo, no celular e no computador, com tudo o que o menu do app faz hoje ainda funcionando.

## Problem Statement
Dito pelo MJRP em 2026-11-21: «o que mudaria pra home ir pra prod agora, já fazer o redesign completo do top nave, aí a transicao fica mais suave, o que acha?» Ao caminho proposto pelo orquestrador (redesenhar o menu na linguagem da home, construí-lo em React dentro da migração F83, e a home esperar o fim da migração para home, menu novo e telas migradas chegarem juntos à produção): «siga».

## Decision
Decidido pelo MJRP em 2026-11-21 («siga»): o menu é redesenhado na linguagem da home aprovada (proposta da F80, Rodada 3 · v4, onde «a barra é o menu»), construído em React na onda da moldura da F83, e nada chega à produção antes do fim da migração.

## Requirements
- [REQ-01] O menu do topo do app compartilha a aparência e o comportamento do menu da home onde faz sentido: a barra, os nomes Inicie/Start · Álbuns · Blend · Playlists · Inventário (português e inglês), o logotipo que leva à home, o item atual marcado · fixes S-70
- [REQ-02] O menu mantém tudo o que o menu do app faz hoje: a conta (entrar, sair), a conexão com Spotify e Apple Music e o menu do celular · fixes S-70
- [REQ-03] É construído em React, na onda da moldura da F83 · fixes S-70
- [REQ-04] Funciona no celular e no computador · fixes S-70
- [REQ-05] O protótipo passa pelo comparador e pela aprovação do MJRP antes da construção · fixes S-70
- [REQ-06] Nada disto chega à produção antes de a migração terminar · fixes S-70

## Observable States
A escrever.

## Success Criteria
A escrever.

## Out of Scope
Mudar as telas atrás do menu; a página da home em si (F80); o dicionário e a escolha de idioma (F81).

## Open Questions
- Quais partes do menu da home não fazem sentido dentro do app (por exemplo, o convite para começar)? Sai da rodada de desenho.
