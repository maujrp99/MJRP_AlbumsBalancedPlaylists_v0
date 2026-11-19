# F68 — regras de identidade de álbum revistas: prova (2026-11-19 20:24)

Código: `main` em `764b495`. Testes: 1543 passando em 132 arquivos; build ok. Servidor na revisão `mjrp-proxy-00203-lwg`, site com o pacote `main-Cm36-Baj.js`.

## Varredura em produção, antes e depois

A mesma varredura de `reports/audits/2026-11-19-mjrpalbumblender-v0-ratings-source-sweep.md`: os 199 álbuns distintos das 47 séries do MJRP, perguntados ao servidor de produção.

| | Antes da F68 | Depois |
|---|---|---|
| Página achada | 183 | **193** |
| «Não tem» | 16 | **6** |
| Falha | 0 | 0 |

Os 6 que ficam, todos com a versão 2 da regra carimbada e com motivo:

| Pedido | Por que não |
|---|---|
| Bruce Dickinson - More Balls to Picasso | outro lançamento (a reedição de 2024; a fonte tem «Balls to Picasso») |
| Hozier - Unreal Unearth: Unheard | outro lançamento (a reedição ampliada; a fonte tem «Unreal Unearth») |
| The Black Crowes - Before the Frost... Until the Freeze | outro lançamento (os dois álbuns num só; a fonte tem «Before the Frost...») |
| Solarstone - Rain Stars Eternal | a fonte não tem |
| Solarstone - island | a fonte não tem |
| James Brown - Best of Live At the Apollo: 50th Anniversary | a fonte não tem |

Os 10 que voltaram: King Crimson «In the Court of the Crimson King», Joy Division «Substance 1977-1980», AC/DC «POWER UP», os dois do Genesis com «(2007 Stereo Mix)», «Walking Into Clarksdale», «Mighty ReArranger», «Led Zeppelin IV», Frank Ocean «Blonde», James Brown «Live At The Apollo (1962)».

## Antes de publicar, servidor local contra a fonte real

Os mesmos 16 mais quatro casos anteriores: 10 com página, 6 `not_found` com `identityRule: 2`; «Nevermind» na página 187, «Core (Remastered)» na 2906, «No Quarter» na 11402, «The Wall» na 204.

## Contagem de álbuns trocados na conta do MJRP

`albumIdentityAudit()` depois da F68: 227 pedidos, 227 iguais, 0 diferentes.

## Não visto

- As linhas novas no cartão para os motivos novos (álbum aceito com parênteses a mais, etc.).
- As outras três fontes (Apple, Spotify, capas locais) com respostas reais para os motivos novos.
- Os «não tem» falsos guardados em outros navegadores sendo perguntados de novo (só em teste de unidade; o navegador de teste foi varrido direto no servidor).
