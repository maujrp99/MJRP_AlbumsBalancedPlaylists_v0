# F76 TASK-07 — prova do inventário no celular (2026-11-20)

Harness: `../harness/inventory.html` com `../harness/vite.inventory.config.mjs` (a `InventoryView` real, o controlador, os renderizadores, as folhas, a moldura do celular e as folhas de estilo do app; 211 itens inventados: 160 Owned, 32 Not Owned, 19 Wishlist, títulos longos, capas desenhadas, médias, valores do Discogs frescos, escritos à mão e à espera; Firebase e servidor trocados por dublês). Script: `shoot-inventory.mjs` (Chrome sem cabeça; 393x852 com toque e escala 2; 1280x800).

```sh
npx vite --config reports/evidence/F76/harness/vite.inventory.config.mjs --port 5291 --strictPort --host 127.0.0.1
node reports/evidence/F76/inventory/shoot-inventory.mjs after 5291 both
```

## Celular, 393x852 (`after/`)

| Estado | Largura | Texto < 12 | Campo < 16 | Alvo < 44 | Linhas | Altura da linha | 1ª linha (topo) |
|---|---|---|---|---|---|---|---|
| list | 393/393 | 0 | 0 | 0 | 50 de 211 | 102 / 122 | 547 |
| empty, filtered, loading | 393/393 | 0 | 0 | 0 | — | — | — |
| reading (rodada em curso) | 393/393 | 0 | 0 | 0 | 50 | 102 / 122 | 617 |
| pressed (Wishlist), brl | 393/393 | 0 | 0 | 0 | 19 / 50 | 102 / 122 | 547 / 575 |
| folhas: status, item, filters, actions, jump | 393/393 | 0 | 0 | 0 | — | — | — |
| edit (janela de edição) | 393/393 | 0 | 0 | 0 | — | — | — |

Do topo ao 150º álbum (Soundgarden, «Ten»): A–Z, «S» → já na tela. **2 gestos** (`to150-*.png`). A página da lista tem 5 995 px com 50 linhas (antes: ~95 800 px com 211 cartões).

## Computador, 1280x800: antes (`before/`, a `InventoryView` de `feat/f76-mobile-redesign`) e depois (`after/`)

Sete estados (list, empty, filtered, reading, pressed, brl, edit): medidas idênticas em todos (largura, altura, alvos, textos, campos). Pixels idênticos em cinco; em list e pressed, 18 e 9 pixels diferem (de 1 024 000), delta máximo 23 de 255, numa linha de título de cartão: suavização de fonte da captura, a marcação é a mesma (o computador passa por `renderComputer`, o desenho de antes).

## O que vi nas capturas

- Lista: capas como protagonistas, título branco forte, artista cinza, valor à direita alinhado; as pílulas de status leem-se de longe (verde, rosa, neutra). Corrigido ao ver: as fichas de status saíam em caixa alta e espaçadas («32 NOT OWNED» estourava a ficha) — agora em caixa normal, 13 px; o título «My Collection» repetia a barra do topo — ficou só para leitor de tela; o aviso «waiting for a value» ocupava 230 px — botão à direita.
- Folha do álbum: limpa; «Data provided by Discogs.» sob o valor. Um respiro maior que o necessário entre «This edition on Discogs ↗» e o crédito (dois alvos de 44 px seguidos).
- Edição: campos de 16 px, BRL/USD como segmentos, «Save Changes» preso embaixo.
- Acima da dobra cabem 2 linhas (o cabeçalho tem contagens, totais, moeda e o aviso). Aceito: a barra presa traz a busca, o salto e os filtros para qualquer altura.

## Não verificado

iPhone real (Safari, barra que encolhe, teclado sobre a busca presa, arrastar a folha), dados reais, VoiceOver.
