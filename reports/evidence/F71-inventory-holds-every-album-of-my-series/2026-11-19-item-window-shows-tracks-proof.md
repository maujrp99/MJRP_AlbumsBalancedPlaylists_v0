# F71 — a janela do álbum no inventário mostra as faixas (UAT-220)

**Quando:** 2026-11-19 23:50 · **Onde:** `http://127.0.0.1:5010/inventory`, ramo `fix/f71-inventory-window-shows-tracks`, conta do MJRP, Spotify conectado.

## Antes (capturas do MJRP, em produção)

«Close to the Edge» e «In the Court of the Crimson King (Expanded Edition)»: «No tracks are kept for this album: it was added from your series…». «The Dark Side of the Moon»: faixas com nota, popularidade «Not linked» nas dez, «Avg Pop: —».

## Depois

| Álbum | Ao abrir | Meio segundo depois |
|---|---|---|
| Close to the Edge (veio da série) | «Loading the tracks of this album…» | 3 faixas, com nota e popularidade; «Avg Rating: 89.7», «Avg Pop: 49%» |
| In the Court of the Crimson King (Expanded Edition) (veio da série) | «Loading…» | faixas; «Avg Rating: 90», «Avg Pop: 59.5%»; 2 faixas com «Not linked» |
| The Dark Side of the Moon (item antigo) | as faixas que o item guarda, na hora | as de agora: «Avg Rating: 89.9», «Avg Pop: 72.8%», nenhuma «Not linked» |
| No Quarter (veio da série) | «Loading…» | faixas; «Avg Rating: 78.8», «Avg Pop: —»; 14 faixas «Not linked» |

O selo de status continua o do item («NOT OWNED»). Os álbuns já estavam guardados no navegador; um álbum nunca carregado leva o tempo de uma busca.

## Não conferido

- Um álbum que a carga não acha (a frase «The tracks of this album could not be loaded…»): só em teste de unidade.
- Fechar a janela no meio do pedido: só em teste de unidade.

## O mesmo pedido da tela de álbuns (2026-11-19 23:54)

O MJRP perguntou por que a janela do inventário carrega algo diferente da tela de álbuns: «nao deveria ser a mesma chamada?». A janela pedia só as notas e a popularidade; agora pede as três fontes que a tela de álbuns mostra, incluindo o ranking da pessoa. Visto: «The Dark Side of the Moon» com «My Avg: 5.5 · Avg Rating: 89.9 · Avg Pop: 72.8%»; «Close to the Edge» com «My Avg: -» (ele não tem ranking desse álbum).

**O que continua diferente, de propósito:** o pedido é feito com o artista e o título do item do inventário, não com a consulta guardada na série. O que o navegador guarda é achado pelo par artista e título, então para o mesmo par é o mesmo registro. Um item cujo título difere do da série (por exemplo «Led Zeppelin IV» no inventário e «Led Zeppelin IV (Remastered)» na série) é pedido como outro álbum.
