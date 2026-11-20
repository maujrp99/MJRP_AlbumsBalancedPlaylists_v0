# F71 — prova no navegador e execução na conta do MJRP

**Quando:** 2026-11-19 23:20 · **Onde:** `http://127.0.0.1:5010/inventory`, servindo o ramo `feat/f71-inventory-holds-every-album-of-my-series` (com a `main` `ffd414f` juntada), na conta do MJRP, contra o Firestore de produção.
**Quem:** o integrador (agente), a pedido do MJRP («coloque todos os os albums que tenho na minha albums list como parte do meu inventory. tudo marcado como not owned»).

## Antes

| O quê | Valor |
|---|---|
| Cabeçalho | «23 albums · ✓ 6 Owned · 16 Not Owned · ♡ 1 Wishlist» |
| Filtro de status | «All», «Owned», «Not Owned», «Wishlist» |
| Cada opção do filtro | All 23 · Owned 6 · Not Owned 16 · Wishlist 1; as três contagens do cabeçalho não mudam com o filtro |

## A ação «Add the albums of my series»

1. **Confirmação lida:** «188 albums from your 48 series will be added as Not Owned. 14 albums already in your inventory stay as they are. 18 entries that repeat an album of another series are added once.» Botão «Add 188 albums».
2. **Entradas deixadas de fora (console):** 42 linhas, todas `already-in-inventory` ou `repeated-in-series`; em todas o álbum é o mesmo da outra entrada (por exemplo «Brothers In Arms (Remastered 1996)» em duas séries, «About Face» em «David Gilmour» e em «Gilmour & Plant»). Nenhum par que devesse ficar separado.
3. **Cancelar:** nada gravado; 23 álbuns; o botão volta ao texto normal e fica habilitado.
4. **Confirmar:** o botão passou por «Adding 188 albums…», «Adding albums… 100 of 188», «Adding albums… 188 of 188». Aviso: «Added 188 albums as Not Owned.»

## Depois (página recarregada, lido do Firestore)

| O quê | Valor |
|---|---|
| Cabeçalho | «211 albums · ✓ 6 Owned · 204 Not Owned · ♡ 1 Wishlist» |
| Itens vindos das séries (`albumData.metadata.addedFrom == 'series'`) | 188, todos `owned: null`, `format: null`, sem preço |
| Itens de antes | 23, com a mesma divisão: 6 Owned, 16 Not Owned, 1 Wishlist |
| Sem capa (a série não guardava o endereço) | 15; mostram a capa substituta |
| Apertar o botão de novo | «Every album of your series is already in your inventory. Nothing was added.»; 211 álbuns |
| Ordem da grade | por artista e título («Above & Beyond», «AC/DC», «Alice In Chains»…) |
| Filtro em «Wishlist» | «1 album» (singular) |

## Decidido pelo agente — revisável

- **A ordem da grade** passou a ser por artista e depois por título (`public/js/models/inventorySort.js`). Antes ordenava por um campo que os itens não têm, e 211 cartões saíam na ordem dos ids do banco. Era uma pergunta aberta do `spec.md`.
- **«1 album»** no singular.

## Não conferido

- A lista de pedidos de rede da aba só guardava os últimos e não mostra a janela da gravação; a ausência de pedido ao Apple Music e a `/api` vem dos testes (`test/models/inventoryFromSeries.test.js`, `test/services/inventory/*`), não desta sessão.
- Um aviso «Cache Cleared!» aparece no carregamento da página do inventário. Não é desta feature; fica anotado.

## Desfazer

Os 188 itens têm `albumData.metadata.addedFrom == 'series'` e `format == null`, em `artifacts/mjrp-albums/users/{uid}/inventory`. Os de antes não têm `addedFrom`.
