# F74 — segunda medida: as faixas que a versão 1 da regra deixou sem nota

**Quando:** 2026-11-20 01:14 · **Onde:** ramo `fix/f74-track-titles-second-slice`, sem navegador e sem servidor publicado.

**Como refazer:** `node scripts/measure-track-identity.mjs --second`. Não usa a rede: lê `test/fixtures/trackIdentity/measuredAlbums2.json`.

## O que foi lido

- **16 páginas do BestEverAlbums**, em 2026-11-20, 29 pedidos, um a cada 4 segundos, achadas pela busca do servidor e lidas pelo leitor do servidor com o `cheerio` de verdade. O teto combinado eram 30 pedidos: nove álbuns da lista ficaram sem leitura (abaixo).
- **Os títulos do Apple Music** pela consulta pública do iTunes. Em três álbuns a consulta devolveu outro lançamento («The Chronic», «Madvillainy», «Nevermind»): para esses a medida usa só as faixas que o integrador nomeou, do inventário.
- **«Versão 1»** é quantas dessas faixas a regra publicada casava nestas páginas, calculado uma vez antes da mudança e guardado no arquivo de dados.

## A tabela

| Álbum | Faixas | Com nota na página | Versão 1 | Depois |
|---|---|---|---|---|
| Yes «Close to the Edge» | 3 | 3 | 1 | 3 |
| Genesis «Foxtrot (2007 Stereo Mix)» | 6 | 6 | 5 | 6 |
| Genesis «Selling England By the Pound (2007 Stereo Mix)» | 8 | 7 | 6 | 7 |
| Crosby, Stills, Nash & Young «Déjà Vu» | 10 | 10 | 9 | 10 |
| D'Angelo «Voodoo» | 13 | 13 | 12 | 13 |
| Neutral Milk Hotel «In the Aeroplane Over the Sea» | 11 | 11 | 10 | 11 |
| T. Rex «Electric Warrior (Expanded Edition) [2003 Remaster]» | 18 | 11 | 10 | 11 |
| Dr. Dre «The Chronic» (só as 4 faixas nomeadas) | 4 | 16 | 0 | 4 |
| Kendrick Lamar «To Pimp a Butterfly» | 16 | 16 | 14 | 16 |
| Steely Dan «Can't Buy A Thrill» | 10 | 10 | 9 | 10 |
| Elliott Smith «Either/Or» | 12 | 12 | 11 | 12 |
| Madvillain «Madvillainy» (só a faixa nomeada) | 1 | 22 | 0 | 1 |
| Bob Dylan «Blonde On Blonde» | 14 | 14 | 12 | 14 |
| Nirvana «Nevermind» (só a faixa nomeada) | 1 | 12 | 0 | 0 |
| Stevie Wonder «Songs in the Key of Life» | 21 | 17 | 17 | 17 |
| Queens of the Stone Age «Songs for the Deaf» | 15 | 14 | 11 | 14 |
| **Total** | 163 | — | 127 | 149 |

A primeira medida não mudou: 102 notas nos 12 álbuns.

## Faixa por faixa

| Álbum | Faixa do álbum | O que a fonte escreve | O que era | Agora |
|---|---|---|---|---|
| Yes «Close to the Edge» | «Close to the Edge: I. The Solid Time of Change, II. …»; «And You and I: I. Cord of Life, II. …» | «Close To The Edge: The Solid Time Of Change / Total Mass Retain / …»; «And You And I: Cord Of Life / Eclipse / …» | defeito (regressão): a numeração das partes | `title-with-its-parts` |
| Crosby, Stills, Nash & Young «Déjà Vu» | «Country Girl: A. Whiskey Boot Hill / B. Down, Down, Down / C. …» | «Country Girl: Whiskey Boot Hill/Down, Down, Down/Country Girl (I Think You're Pretty)» | defeito | `title-with-its-parts` |
| Genesis «Foxtrot» | «Supper's Ready (2007 Stereo Mix)» | «Supper's Ready: I. Lover's Leap / II. … / VII. …»: a fonte lista as partes; as outras cinco faixas ela escreve só com o título | defeito | `title-with-its-parts` |
| Genesis «Selling England By the Pound» | «The Cinema Show», «Aisle of Plenty» | uma entrada só: «The Cinema Show / Aisle Of Plenty» (89) | a fonte dá uma nota às duas | a primeira leva (`first-of-titles-listed-together`); «Aisle of Plenty» fica sem: pergunta aberta |
| D'Angelo «Voodoo» | «Greatdayndamornin' / Booty» (o Apple não escreve «Medley:») | «Greatdayindamornin' / Booty» | defeito: uma letra | escrita conhecida |
| Neutral Milk Hotel | «King of Carrot Flowers, Pts. 2 & 3» | «The King Of Carrot Flowers Pt. Two & Three» | defeito | escrita (segundo degrau) |
| T. Rex «Electric Warrior» | «Bang a Gong (Get It On)» | «Get It On» | defeito | `title-in-its-brackets` |
| Dr. Dre «The Chronic» | «F**k Wit Dre Day (And Everybody's Celebratin')», «The Day The N****z Took Over (feat. …)», «A N***a Witta Gun», «Lyrical G******g» | as quatro por extenso, sem asteriscos | defeito | `letters-starred-out` |
| Kendrick Lamar «To Pimp a Butterfly» | «u», «i» | «U», «I», na página | defeito do leitor: pulava títulos de uma letra | o raspador lê |
| Steely Dan «Can't Buy A Thrill» | «Midnite Cruiser» | «Midnight Cruiser» | defeito: grafia | escrita conhecida |
| Elliott Smith «Either/Or» | «2:45 Am» | «2:45 AM» | defeito do leitor: cortava «2:» como número de faixa | o raspador guarda o título inteiro |
| Madvillain «Madvillainy» | «Operation Lifesaver a.K.A. Mint Test» | «Operation Lifesaver/Mint Test» | defeito | escrita («a.k.a.») |
| Thin Lizzy «Black Rose» | «Do Anything You Want to Do», «My Sarah» | «Do Anything You Want To» (1), «Sarah» (5) | defeito: o app manda as faixas na ordem das notas e a regra lia o lugar na lista como número da faixa | a regra lê `position` |
| Bob Dylan «Blonde On Blonde» | «Fourth Time Around», «Obviously Five Believers» | «4th Time Around», «Obviously 5 Believers» | defeito | escrita (número por extenso) |
| Queens of the Stone Age «Songs for the Deaf» | «Song for the Dead», «Hanging Tree», «Song for the Deaf» | «A Song For The Dead», «Hangin' Tree», «A Song For The Deaf» | defeito | escrita («A» no começo, «-in'») |
| o mesmo | «The Real Song for the Deaf» | não está na página | sem nota na fonte | — |
| Stevie Wonder «Songs in the Key of Life» | «Saturn», «Ebony Eyes», «All Day Sucker», «Easy Goin' Evening (My Mama's Call)» | não estão na página (17 faixas) | sem nota na fonte | — |
| Nirvana «Nevermind» | «Endless, Nameless» | não está na página (12 faixas) | sem nota na fonte | — |

## Não lidos (o teto de pedidos)

Snoop Dogg «Doggystyle» e Red Hot Chili Peppers «By the Way» («C****n»): o degrau dos asteriscos deve resolver, se a fonte escreve por extenso; não conferido. Deep Purple «Purpendicular», Coldplay «Viva La Vida…», Imagine Dragons «Evolve», Iron Maiden «Senjutsu», Portishead «Dummy», America, AC/DC «Let There Be Rock»: não se sabe.

## O que se vê e não foi tocado

«Before the Frost... Until the Freeze» e Hozier «Unreal Unearth: Unheard»: a regra do álbum (F68) responde «não tem página» (a fonte só tem «Before The Frost...» e «Unreal Unearth», que ela trata como outro lançamento). A média que o inventário mostra é a que estava guardada antes: «Update ratings» não escreve «nada» por cima de um número.

## Não conferido

- O navegador e o servidor publicado.
- Que o app manda `position` em cada faixa no pedido de notas: lido no código (`Track.position`, do número de faixa do Apple Music), não visto num pedido de verdade. Num álbum de dois discos o número recomeça no segundo disco.
