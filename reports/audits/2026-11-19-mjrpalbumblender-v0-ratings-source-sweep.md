# Varredura da fonte de notas com a regra de identidade — 2026-11-19 19:43

## O que foi feito

Com a conta do MJRP, para cada álbum distinto pedido nas 47 séries (199 álbuns), o servidor de produção (revisão `mjrp-proxy-00202-ktd`, com a regra única de identidade e o conserto do artista com nota da fonte) foi perguntado se a fonte de notas tem a página do álbum. O pedido levou uma faixa fictícia, então «página achada» aparece como `no_ratings`; o que interessa é `not_found`.

## Resultado

| Resposta | Álbuns |
|---|---|
| Página achada | 183 |
| `not_found` | 16 |
| Falha | 0 |

Os 199 pedidos passaram pela fila educada (três de cada vez no app, dois no servidor) sem nenhuma falha nem «fonte ocupada».

## Os 16 «não tem»

| # | Pedido | Leitura do agente (a confirmar na F68) |
|---|---|---|
| 1 | King Crimson - In the Court of the Crimson King (Expanded Edition) | a fonte escreve o título com um qualificador entre parênteses («An Observation by King Crimson») |
| 2 | Joy Division - Substance 1977-1980 | a fonte escreve «Substance»; o pedido traz o intervalo de anos |
| 3 | Bruce Dickinson - More Balls to Picasso | reedição de 2024 com outro título; a fonte tem «Balls to Picasso» |
| 4 | AC/DC - POWER UP | a conferir (a fonte tem «Power Up») |
| 5 | Genesis - Foxtrot (2007 Stereo Mix) | a conferir (a fonte tem «Foxtrot»; o texto mandado à busca leva a nota de edição?) |
| 6 | Genesis - Selling England By the Pound (2007 Stereo Mix) | idem; sem a nota de edição o álbum é achado |
| 7 | Robert Plant & Jimmy Page - Walking Into Clarksdale | a fonte escreve os artistas em outra ordem ou como «Page & Plant» |
| 8 | Robert Plant & The Strange Sensation - Mighty ReArranger (Bonus Tracks) | a conferir (artista escrito de outro jeito na fonte) |
| 9 | Hozier - Unreal Unearth: Unheard | edição com subtítulo; a fonte tem «Unreal Unearth» (pedido longo, resposta curta: a regra recusa de propósito) |
| 10 | Led Zeppelin - Led Zeppelin IV (Remastered) | a fonte escreve «Untitled (Led Zeppelin IV)» ou parecido |
| 11 | Solarstone - Rain Stars Eternal | a conferir (pode não existir na fonte) |
| 12 | Solarstone - island | a conferir |
| 13 | The Black Crowes - Before the Frost... Until the Freeze | a conferir (pontuação no título) |
| 14 | Frank Ocean - Blonde | a fonte escreve «Blond» ou «Blonde [Blond]» |
| 15 | James Brown - Live At The Apollo (1962) | a conferir |
| 16 | James Brown - Best of Live At the Apollo: 50th Anniversary | coletânea; pode não existir na fonte |

Antes da F55 a comparação era «um título contém o outro», que achava vários destes (e também achava álbuns errados). A regra nova é exata por desenho; estes casos são o custo e entram na revisão da F68, cada um com nome, exemplo e teste.

## Efeito no app

Com as fatias 3 e 4 da F52, o app confia 24 horas num «não tem» da fonte. Um «não tem» falso fica guardado por esse tempo em cada navegador; a F68 precisa derrubar esses registros ao publicar.
