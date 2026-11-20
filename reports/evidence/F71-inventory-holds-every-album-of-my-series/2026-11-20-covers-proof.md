# F71 — o item do inventário sem capa ganha a capa do álbum (UAT-222)

**Quando:** 2026-11-20 00:36 · **Onde:** `http://127.0.0.1:5010/inventory`, ramo `fix/f71-inventory-item-gets-its-cover`, conta do MJRP.

## Antes

15 de 211 itens sem `albumData.coverUrl`, todos acrescentados por «Add the albums of my series»: «No Quarter», «Hotel California», «lullaby and... The Ceaseless Roar», «The Rise and Fall of Ziggy Stardust…», «Voodoo», «Let It Bleed (Remastered 2019)», «When the Pawn...», «Blonde», «Walking Into Clarksdale» e seis de Robert Plant. A entrada da série desses álbuns não guarda o endereço da capa; a lista de séries tira a capa do álbum carregado.

## Depois de «Update ratings»

- Aviso: «Ratings updated for 209 of 211 albums. 1 album was not found. 1 album had no ratings at its sources. 14 albums got their cover.»
- Sem capa: só «No Quarter», que a carga de álbuns não acha.
- «Hotel California» mostra a capa do Apple Music no cartão.

## Não conferido

- A janela de um item sem capa mostrando a capa que chega: só em leitura do código e nos testes da janela.
- Um item novo, acrescentado depois, fica sem capa até o próximo «Update ratings». Não há leitura automática ao entrar (isso é o que a F75 propõe com a fila).
