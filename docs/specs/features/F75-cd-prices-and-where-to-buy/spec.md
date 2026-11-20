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

**Respostas do MJRP em 2026-11-20 00:22:**
1. Conta do Discogs: «sim tenho conta lá e aceitaria» ligar um token.
2. Estado do disco: «poderíamos guardar o valor de 3 estados e apresentar os 3 e a media».
3. Edição: «vamos começar com a mais comum numa primeira iteracao e depois melhoramos».
4. Moeda: «USD, Euro, Libra (os 3 mais comuns no discogs) e Real, creio que precisamos ter o cambio do dia pra calcular de USD pra real».
5. Rumo: «dar um foco para colecionador vai impactar bastante nessa funcionalidade de inventory … precisamos depois pesquisar e fazer benchmark de apps que já fazem esse controle de inventário de coleção de CDs e Vinis e fitas cassete».

Conferido em 2026-11-20: uma fonte pública de câmbio (`api.frankfurter.app`, taxas de referência do dia, sem chave) respondeu com USD para BRL, EUR e GBP.
Termos de uso da API do Discogs lidos em 2026-11-20 01:24 (relatório de viabilidade, última seção): o preço é dado restrito, de uso pessoal e não comercial; não pode servir para levar tráfego a outras lojas; não pode ser mostrado com mais de seis horas de atraso nem guardado além do necessário; exige o aviso «Data provided by Discogs.» com link. A proposta precisa mudar: o valor do Discogs é relido, não guardado por semanas; e juntá-lo com links de afiliado de outras lojas depende de autorização escrita do Discogs.

**Decisões do MJRP em 2026-11-20 01:32:** opção B («pra fazer um full teste, depois eu abro outra feature pra desligar o discogs, poderiamos usar feature toggle aqui»): o valor do Discogs entra já, em uso pessoal, atrás de um interruptor. O cartão é o da v5.1 (`design/inception/inventory-value-v5.1.html`). O token novo do Discogs está no Secret Manager (`discogs-token`).

**Decidido pelo agente — revisável:** os três estados são «Mint», «Near Mint» e «Very Good Plus»; o valor do Discogs não é gravado no Firestore (os termos pedem que não seja guardado além do necessário nem mostrado com mais de seis horas): fica só no navegador, por até seis horas; o que se grava no item é o valor que a pessoa escreve e qual edição do Discogs foi usada; as perguntas ao virar «Owned» (quanto pagou, estado do disco) ficam fora desta feature.

## Requirements
- [REQ-01] O cartão do inventário segue o padrão da v5.1: uma superfície com a capa até as bordas e cinco linhas iguais em todo cartão: o rótulo do valor conforme o status («In my collection · worth» ou «Not mine yet · costs»), a origem e o valor, as duas médias, o rótulo das ações, as ações. · fixes S-57
- [REQ-02] As contagens por status do cabeçalho são botões que filtram o inventário por aquele status; o seletor de status sai da barra. · fixes S-57
- [REQ-03] A pessoa escreve o valor de um álbum na janela dele; esse valor aparece com a origem «written by you», é gravado no item e nunca é trocado por uma leitura. Ela pode voltar ao valor do Discogs. · fixes S-57
- [REQ-04] O app lê do Discogs, pelo servidor, a sugestão de preço da edição em CD mais comum do álbum, nos estados «Mint», «Near Mint» e «Very Good Plus»; o valor do álbum é a média dos três; a janela mostra os três, a média, a edição usada e quando foi lido. · fixes S-57
- [REQ-05] Um valor do Discogs só é mostrado se foi lido há menos de seis horas, e não é guardado além disso; passado esse tempo ele é lido de novo ou deixa de aparecer. · fixes S-57
- [REQ-06] Ao lado de todo valor vindo do Discogs aparece «Data provided by Discogs.», com link para a página do Discogs daquela edição; o app diz, à vista, que usa a API do Discogs e não é afiliado a ele. · fixes S-57
- [REQ-07] O cabeçalho mostra «Estimated value of what I own» e «To buy the rest», cada um com quantos álbuns entraram na soma («N of M»). · fixes S-57
- [REQ-08] A pessoa escolhe a moeda (USD, EUR, GBP, BRL); os valores são convertidos pelo câmbio do dia, e fora do dólar a tela diz a taxa usada. Sem a taxa, a tela mostra em dólar e diz por quê. · fixes S-57
- [REQ-09] «Update values» lê os valores de todo o inventário respeitando o limite de pedidos do Discogs, mostra o progresso, pode ser parado e não trava a tela; um álbum que entra no inventário sem valor é lido na vez seguinte, e a tela diz quantos esperam. · fixes S-57
- [REQ-10] O valor do Discogs tem um interruptor no servidor: desligado, sem publicar código de novo, o app não mostra valor, botão nem aviso do Discogs, e o valor escrito à mão, o total e os links de compra seguem funcionando. · fixes S-57
- [REQ-11] «Where to buy»: no cartão do álbum que a pessoa não tem, três links (Discogs, Amazon, iMusic) numa busca pronta por artista, título e CD; no cartão do que ela tem, um link que abre a janela do álbum; na janela, os três links. · fixes S-57
- [REQ-12] O inventário ordena pelo valor, nas duas direções; o álbum sem valor fica no fim. · fixes S-57
- [REQ-13] Cada falha diz o que houve e nada é inventado: o Discogs não tem edição em CD, o Discogs não respondeu, o limite de pedidos foi atingido, o token foi recusado, o câmbio não chegou. · fixes S-57

## Observable States
A escrever com o protótipo.

## Success Criteria
A escrever.

## Out of Scope
Ler preço da página da Amazon ou da iMusic por conta própria (fere os termos delas).

## Open Questions
- Quais três estados guardar: os três mais altos (Mint, Near Mint, Very Good Plus)?
- Os termos de uso da API do Discogs permitem guardar e mostrar a sugestão de preço?
