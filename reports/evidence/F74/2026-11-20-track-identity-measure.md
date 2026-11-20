# F74 — medida: quantas faixas recebem nota, antes e depois

**Quando:** 2026-11-20 00:45 · **Onde:** ramo `fix/f74-track-ratings-reach-the-right-tracks`, sem navegador e sem servidor publicado.

**Como refazer:** `node scripts/measure-track-identity.mjs` (a tabela) e `node scripts/measure-track-identity.mjs --tracks` (faixa por faixa, com o degrau da regra). Não usa a rede: lê `test/fixtures/trackIdentity/measuredAlbums.json`.

## O que foi lido

- **As páginas do BestEverAlbums** dos 12 álbuns da medida de partida, em 2026-11-20, com `curl`, uma a cada 4 segundos, 28 pedidos ao todo (o combinado eram cerca de 25: os três a mais foram a página internacional do «High Voltage» e a página «Before The Frost...»). A página de cada álbum foi achada pela busca do próprio servidor (`findAlbumId`) e lida pelo leitor do servidor (`parseChartRankingById`), com o `cheerio` de verdade. As páginas inteiras ficaram fora do repositório; o repositório guarda só os títulos, as notas e os números das faixas.
- **Os títulos das faixas como o Apple Music escreve**, pela consulta pública do iTunes (`itunes.apple.com/search` e `/lookup`), loja dos EUA. Não é a conta do MJRP: a contagem de faixas de cada álbum bate com a do inventário dele (8, 9, 9, 42, 8, 20, 24, 19, 18, 16, 11, 15).
- **«Antes»** é a comparação que o servidor fazia até a F74 (`normalizeKey` e, se nada casasse, `toFuzzyCore`), copiada e congelada no script. Ela reproduz a medida de partida do inventário nos 12 álbuns, número por número.

## A tabela

| Álbum | Faixas | Com nota na página | Antes | das quais uma nota em duas faixas | Depois |
|---|---|---|---|---|---|
| King Crimson «In the Court of the Crimson King (Expanded Edition)» | 8 | 5 | 2 | 1 | 5 |
| AC/DC «High Voltage» | 9 | 9 | 2 | 0 | 9 |
| Thin Lizzy «Black Rose: A Rock Legend» | 9 | 9 | 6 | 0 | 9 |
| Armin van Buuren «Mirage (Deluxe Edition)» | 42 | 6 | 10 | 4 | 6 |
| King Crimson «Larks' Tongues In Aspic (Expanded Edition)» | 8 | 6 | 4 | 0 | 6 |
| The Black Crowes «Before the Frost... Until the Freeze» | 20 | 11 | 10 | 0 | 11 (ver abaixo) |
| New Order «Substance» | 24 | 12 | 13 | 1 | 12 |
| Joy Division «Substance 1977-1980» | 19 | 10 | 11 | 1 | 10 |
| The Jimi Hendrix Experience «Are You Experienced (Deluxe Version)» | 18 | 11 | 11 | 1 | 11 |
| The Who «Who's Next (Bonus Track Version)» | 16 | 9 | 10 | 1 | 9 |
| James Brown «Live At The Apollo (1962)» | 11 | 9 | 7 | 0 | 6 |
| Free «Free Live!» | 15 | 8 | 10 | 3 | 8 |
| **Total** | 199 | 105 | 96 | 12 | 102 |

**Como ler.** «Com nota na página» é o teto: a fonte não dá nota a mais faixas do que essas. Das 96 notas de antes, 12 eram a mesma nota posta em duas faixas (a extra com a nota da original) e 2 eram do «High Voltage» australiano, outro disco; 82 estavam na faixa certa. Depois, 102 das 105 notas das páginas chegam à sua faixa, cada uma a uma faixa só.

**Onde o número cai, e por quê.**
- «Mirage (Deluxe Edition)», 10 → 6: a página dá nota a 6 faixas. As outras 4 eram três remixes e uma faixa repetida com a nota da original.
- «Substance» (New Order) 13 → 12, «Substance 1977-1980» 11 → 10, «Who's Next» 10 → 9, «Free Live!» 10 → 8: saíram «Thieves like Us (Instrumental)», «Love Will Tear Us Apart (Pennine Version)», «Behind Blue Eyes (New York Record Plant Session)», e em «Free Live!» «Mr Big» e «All Right Now» repetidas e «Get Where I Belong (Alternative Take)»; entrou «Ride On Pony».
- «Live At The Apollo (1962)», 7 → 6: «Lost Someone (Live 1962)» tinha 78, que é a nota de «Lost Someone (Part 2)». A página dá nota a duas metades, «(Part 1)» 80 e «(Part 2)» 78, e o álbum tem a faixa inteira: a regra não escolhe uma das duas. É uma perda conhecida, à espera de decisão do MJRP.

**«Before the Frost... Until the Freeze».** O 11 é o que o casamento de títulos dá COM a página «Before The Frost...» na mão. A busca de hoje não entrega essa página: a regra de identidade do álbum (F68) decidiu que ela é outro lançamento (só o primeiro dos dois discos). O servidor de hoje responde «não tem página»; o «10 de 20» do inventário é de antes da F68. A F74 não mexeu nisso.

## As causas das notas que faltavam

103 faixas dos 12 álbuns estavam sem nota.

| Causa | Faixas | Exemplo real |
|---|---|---|
| (a) a mesma faixa escrita de outro jeito | 12 | «21st Century Schizoid Man (Including "Mirrors")» e «21st Century Schizoid Man Including Mirrors» |
| (b) o leitor não lê linhas que estão na página | 0 | as 12 páginas: o leitor tira tantas linhas quantas a página tem |
| (c) a fonte dá nota a menos faixas do que a edição tem | 83 | «Substance» (New Order): a página lista as 12 faixas do primeiro disco, o álbum tem 24 |
| (d) a página de outra edição | 7 | AC/DC «High Voltage»: a busca pegava a página do disco australiano (8 faixas); o álbum é o internacional, que tem página própria, «High Voltage (International)» |
| (e) outra | 1 | James Brown: a página chama a abertura de «Introduction To James Brown», o álbum de «Introduction By Fats Gonder / Opening Fanfare» |

As 12 de (a), pelo que as diferencia:

| Diferença | Faixas | Degrau que resolve |
|---|---|---|
| a fonte escreve sem parênteses o que o álbum escreve entre parênteses; «&» e «and» | 5 | `same-text` |
| «Pt. 1» e «Part One» | 2 | `same-song-described` |
| uma grafia («Foxey Lady» / «Foxy Lady») | 1 | `same-song-described`, pela lista de escritas conhecidas |
| uma palavra a mais ou a menos, no mesmo número de faixa («My Sarah» / «Sarah», «Do Anything You Want to Do» / «…Want To», «A Train Makes…» / «A Train Still Makes…», «Ride On Pony» / «Ride On A Pony») | 4 | `same-place-one-word-apart` |

## Não conferido

- O navegador: a coluna BestEverAlbums e a «Avg Rating» na tela, e a nova leitura das notas sem «Clear Cache».
- O servidor publicado: a medida usa o código do ramo e páginas guardadas.
- Os outros 197 álbuns do inventário: a medida cobre os 12 piores. A contagem «84 com nota em parte das faixas» só se refaz no navegador, com «Update ratings», depois de publicar.
