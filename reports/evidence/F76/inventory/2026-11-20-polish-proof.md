# F76 · polimento do Inventário (N2, N8, N9, N4) — prova

**Ramo:** `feat/f76-mobile-polish-inventory-windows`. **Como:** o banco de prova `../harness/inventory.html` (a tela de verdade, 211 itens inventados) servido por `npx vite --config reports/evidence/F76/harness/vite.inventory.config.mjs --port 5391 --strictPort --host 127.0.0.1` e fotografado por `shoot-inventory.mjs` (agora com `PHONE_H=660` para a altura que o Safari deixa e o cenário `seller`, a conta do MJRP hoje: sem configurações de vendedor no Discogs, 39 álbuns esperando valor; e `why`, a folha aberta).

| Medida (cenário `seller`) | Antes (`polish-before*/`) | Depois (`polish-after*/`) |
|---|---|---|
| Topo da primeira linha | 721 | 365 |
| Linhas inteiras acima da barra de baixo a 393x660 | 0 | 2 |
| Linhas inteiras a 393x852 | 0 | 4 |
| Rolagem de lado · alvos < 44 · texto < 12 | 0 · 0 · 0 | 0 · 0 · 0 |
| 1280x800 (`list`, `seller`, `brl`, `reading`, `edit`) | — | idênticos pixel a pixel, salvo `list`: 340x14 px na grade de cartões, idêntico a olho (borda de imagem; o código do computador não mudou) |

O que vi nas capturas: o cabeçalho cabe em ~250 px e respira; a moeda alinha com as duas somas; «Data provided by Discogs.» e «Lowest asking prices · Why?» numa linha só; o aviso de espera quebra em duas linhas («value.» sozinho na segunda, aceitável). A folha «Why lowest asking prices?» lê bem, com o link em laranja. A folha Status com um ✓ só (`status-393x852.png`).
