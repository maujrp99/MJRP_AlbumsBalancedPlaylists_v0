---
status: Draft
lane: standard
solution_type: feature
imports: ["[[S-57-see-what-a-cd-costs-and-where-to-buy-it]]"]
planned_for: "[[ROADMAP#^REL-40]]"
---
# Feature F75: Preço de CDs e onde comprar, no inventário
**Approved**: pendente (via padrão: protótipo com a skill de UI antes de construir, pedido do MJRP)

## Summary
**A feature:** Cada álbum do inventário mostra quanto custa o CD e traz o link de compra na Amazon, no Discogs e na iMusic; a busca vale para um álbum ou para o inventário inteiro.

**Por quê:** O MJRP quer decidir o que comprar e onde, e no futuro entrar em programas de afiliação.

**Como saber que funcionou:** A escrever depois do protótipo.

## Problem Statement
Pedido do MJRP de 2026-11-20 00:14. A viabilidade foi conferida antes de qualquer desenho: `reports/audits/2026-11-20-mjrpalbumblender-v0-cd-prices-feasibility.md`. Links de compra: viáveis nos três. Preço: só o Discogs entrega hoje; a Amazon exige conta de afiliado com vendas; a iMusic não tem interface pública.

**Propósito, dito pelo MJRP em 2026-11-20 00:14:** estimar o valor do inventário. O preço vem sozinho e a pessoa pode alterá-lo à mão, como já faz hoje.

O que isso decide no desenho (decidido pelo agente — revisável):
- O valor de um item tem origem: lido de uma loja (qual, quando) ou escrito pela pessoa. O que a pessoa escreveu nunca é trocado por uma leitura automática.
- O total do inventário soma o valor de cada item e diz quantos itens entraram na soma e quantos ficaram sem valor.
- Para estimar valor de coleção, a fonte certa no Discogs é a sugestão de preço por estado do disco (exige a conta dele); o menor preço anunciado é um piso, não uma estimativa.

## Requirements
- [REQ-01] «a escrever depois das respostas do MJRP às perguntas da viabilidade e do protótipo» · fixes S-57

## Observable States
A escrever com o protótipo.

## Success Criteria
A escrever.

## Out of Scope
Ler preço da página da Amazon ou da iMusic por conta própria (fere os termos delas).

## Open Questions
As quatro perguntas do relatório de viabilidade.
