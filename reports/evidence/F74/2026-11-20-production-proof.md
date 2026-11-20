# F74 — prova em produção e medida no inventário do MJRP

**Quando:** 2026-11-20 01:04 · **Onde:** servidor na revisão `mjrp-proxy-00208-kzm` (a volta é `mjrp-proxy-00207-lhz`), site publicado de `8efa91c`; «Update ratings» rodado na conta do MJRP pelo ambiente local, contra a produção.

## O que a página do álbum mostra agora

| Álbum | Antes | Agora |
|---|---|---|
| In the Court of the Crimson King (Expanded Edition) | 2 de 8 com nota; «I Talk to the Wind (Duo Version)» com a nota da original | 5 de 8: as cinco originais (93, 90, 93, 82, 93); as três extras sem nota |
| High Voltage (AC/DC) | 2 de 9, pela página do disco australiano | 9 de 9, pela página «High Voltage (International)» |
| Black Rose: A Rock Legend | 6 de 9 | 7 de 9; «Do Anything You Want to Do» e «My Sarah» seguem sem nota, embora a medida do ramo desse 9 |

## O inventário inteiro, depois de «Update ratings»

| | Antes da F74 | Depois |
|---|---|---|
| Álbuns com nota em todas as faixas | não medido | 109 |
| Álbuns com nota em só parte das faixas | 84 | 87 |
| Álbuns sem nota em nenhuma faixa | 13 | 13 |
| Faixas com nota | não medido | 2106 de 2612 |

O número de álbuns «em parte» subiu porque saíram as notas repetidas: a faixa extra que levava a nota da original deixou de levar.

## Regressão achada

«Close to the Edge» (Yes) tinha nota nas 3 faixas e ficou com 1. O Apple Music escreve «Close to the Edge: I. The Solid Time of Change, II. …» e «And You and I: I. Cord of Life, II. …»; a fonte escreve os títulos curtos. A regra antiga os casava por «contém»; a nova não tem degrau para o título seguido da lista das suas partes.

Outras faixas sem nota que parecem a mesma faixa escrita de outro jeito, a conferir contra a página da fonte: «Country Girl: A. Whiskey Boot Hill / …» (CSN&Y), «Bang a Gong (Get It On)» (T. Rex), os títulos com asteriscos do Dr. Dre, do Snoop Dogg e do Red Hot Chili Peppers, «u» e «i» (Kendrick Lamar), «Midnite Cruiser» (Steely Dan), «King of Carrot Flowers, Pts. 2 & 3» (Neutral Milk Hotel), três faixas do Genesis com «(2007 Stereo Mix)».

Segunda fatia aberta com esses exemplos (ramo `fix/f74-track-titles-second-slice`).

## Não conferido

- Quantos álbuns perderam nota por causa da regressão: a leitura de antes foi sobrescrita pelo «Update ratings», então só «Close to the Edge» tem o antes e o depois vistos.
- Os 13 álbuns sem nenhuma nota (quase todos de música eletrônica) não foram olhados um a um.
