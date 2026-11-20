---
type: evidence
feature: F75
subject: "F75 em produção: a leitura de valores na conta do MJRP"
written: "2026-11-20 02:51"
who: integrador (agente), no navegador embutido, conta do MJRP
---
# F75 — prova em produção · 2026-11-20 02:51

**O que está no ar:** site e servidor publicados da `main` (`70e63da`); servidor na revisão `mjrp-proxy-00213-qpq`, com o secret `discogs-token` mapeado em `DISCOGS_TOKEN` (a conta do serviço já lia o secret: nenhuma permissão foi mudada). A volta do servidor é `mjrp-proxy-00209-prz` (antes da F75).

**Como foi provado:** o app local (`http://127.0.0.1:5010`, código da `main`) na conta do MJRP, falando com o servidor de produção. A tela do site publicado, com login, não foi aberta por mim.

## O que a leitura mostrou

| Medida | Resultado |
|---|---|
| Álbuns do inventário | 211 |
| Com valor do Discogs («lowest for sale») | 198 |
| «None for sale on Discogs now» | 5 |
| «No CD edition found» | 8 |
| «Estimated value of what I own» | $1,166.51 (147 de 157 com valor) |
| «To buy the rest» | $339.27 (51 de 54 com valor) |
| Em reais | R$ 6.873,06 e R$ 1.998,95, «1 USD = 5.892 BRL» |
| Tempo da leitura | cerca de 13 minutos |

Sem valor: POWER UP (AC/DC), Unreal Unearth: Unheard (Hozier), Carry Fire e Saving Grace (Robert Plant), Mighty ReArranger (Bonus Tracks), Doggystyle (Snoop Dogg), Before the Frost... Until the Freeze (The Black Crowes), In My Memory (New Edition Bonus Disc) (Tiësto): sem edição em CD achada. Substance 1977-1980, Dressed To Kill (2025 Remaster), Led Zeppelin IV, Admirável Chip Novo, I've Tried Everything But Therapy (Part 1): nenhuma à venda na edição escolhida.

## O que o Discogs recusou

O pedido de sugestão de preço (os três estados) volta 404 com a frase «You must fill out your seller settings first.». A conta do MJRP não tem as configurações de vendedor preenchidas, e o agente não mexeu na conta. Por isso o valor mostrado é o **menor preço à venda** da edição em CD mais colecionada, e a tela diz isso: «CD · Discogs · lowest for sale», o aviso com o link `discogs.com/settings/seller`, e «Discogs values are lowest asking prices for now.». Quando ele preencher, a próxima leitura tenta a sugestão de novo, sem publicar código.

## Defeito achado na prova e consertado

A primeira leitura devolveu «No CD edition found» para 16 de 16 álbuns: o servidor lia o 404 da página de preço como «álbum não achado». Consertado (`e6f20b6`), com teste; depois veio a segunda leitura (`7e9c82f`, `26519f2`).

## Não verificado

- A sugestão de preço em três estados, com a média: nunca foi lida de verdade (depende das configurações de vendedor).
- O site publicado aberto com login; o celular.
- A leitura fica só no navegador, por seis horas (termos do Discogs): no celular ou em outro navegador, os valores aparecem depois de «Read them now» lá.
- A cláusula dos termos sobre levar tráfego a outros sites, com o valor do Discogs acima dos links da Amazon e da iMusic: juízo do MJRP.
