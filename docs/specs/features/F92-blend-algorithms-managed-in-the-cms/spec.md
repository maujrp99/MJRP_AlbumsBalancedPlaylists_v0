---
status: Draft
lane: standard
solution_type: feature
imports: ["[[S-74-grow-and-manage-the-blend-algorithms-from-the-cms]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F92: Algoritmos de mistura criados e gerenciados no CMS
**Approved**: pendente. Em esboço, esperando o MJRP. Depende do CMS (F82).

## Summary
**A feature:** Uma seção do CMS onde o dono cria e acrescenta algoritmos (receitas) de mistura, como «deep cuts» e «menos ouvidas», e decide quais aparecem na tela de Blend, em que ordem, com que nome, descrição e configuração.

**Por quê:** Uma das ideias da plataforma é o MJRP ir criando e acrescentando receitas. Hoje cada receita é código.

**Como saber que funcionou:** A escrever com a proposta.

## Problem Statement
Dito pelo MJRP em 2026-11-22: «Importante: uma das ideias dessa plataforma seria a de ir eu ir criando e acrescentando algoritmos para o blend. Por exemplo um algoritmo de deep cuts, um algoritmo das menos ouvidas o oposto do top. Eu eu precisa no CMS ter uma seção especial para criar e gerar algoritmos e gerenciar o aparecimento e configuração deles na tela de blend. Isso implica que a tela de blend tem que ser altamente configurável tb.»

## Requirements
- [REQ-01] Uma seção especial do CMS cria e gera algoritmos de mistura · fixes S-74
- [REQ-02] No CMS o dono gerencia o aparecimento e a configuração de cada algoritmo na tela de Blend: quais aparecem, em que ordem, com que nome e descrição, e a configuração de cada um · fixes S-74
- [REQ-03] A tela de Blend é altamente configurável: o que ela mostra vem da configuração, não do código, e um algoritmo novo aparece sem mudar a tela · fixes S-74
- [REQ-04] Algoritmos novos que o MJRP já citou: «deep cuts» e «as menos ouvidas, o oposto do top» · fixes S-74

## Observable States
A escrever.

## Success Criteria
A escrever.

## Out of Scope
O CMS em si (F82); as chaves de ligar e desligar features (F93); mudar os algoritmos que existem hoje.

## Open Questions
- **O que é «criar um algoritmo» sem escrever código?** Compor a partir de blocos com parâmetros (fonte do ranking, sentido do topo ou do fim, exclusões, quantidades) ou acrescentar um módulo de código que o CMS então liga e configura? Decide a proposta de arquitetura, antes de qualquer construção.
- O que quer dizer «deep cuts» (faixas fora do topo de cada álbum?) e «menos ouvidas» (menor popularidade, menor nota?): a definir com o MJRP, com exemplos.
- Quem usa a tela de Blend vê a configuração do dono, ou cada pessoa pode ter a sua?
- Relação com a F82: seção nova do mesmo CMS (decidido pelo agente, revisável: a F92 e a F93 são features próprias que dependem da F82, porque cada uma tem arquitetura e entrega próprias, enquanto a F82 já guarda os pedidos pequenos do CMS, REQ-02 e REQ-03).
