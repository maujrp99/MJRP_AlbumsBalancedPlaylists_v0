# F63 — a barra do topo cabe na tela (UAT-218)

**Quando:** 2026-11-19 23:41 · **Onde:** `http://127.0.0.1:5010/inventory`, ramo `fix/f63-top-bar-fits`, conta do MJRP com o Spotify conectado.

## Antes

A 1440 px a barra media 1200 px e o conteúdo pedia cerca de 1395: o botão da conta terminava em x=1504 e a página tinha rolagem horizontal. A barra já não cabia antes do conserto da UAT-211; alargar os nomes piorou.

## Depois

| Largura | Rolagem horizontal | Nome da conta | Nome do Spotify | Menu |
|---|---|---|---|---|
| 375 | não (375) | fora da barra | fora da barra | lateral |
| 800 | não (800) | fora da barra | fora da barra | lateral (antes: links na barra, 1055 px) |
| 1024 | não (1024) | escondido | só o ícone, nome ao passar o mouse | links na barra |
| 1280 | não (1280) | «Maurício Ped…» (77 px) | «Mau…» (43 px) | links na barra |
| 1440 | não (1440) | inteiro (92 px) | inteiro (144 px) | links na barra |
| 1680 | não | inteiro | inteiro | links na barra |

O botão de desconectar o Spotify (✕) continua visível em todas as larguras de 1024 para cima.

## Não conferido

- Um nome muito longo (mais de 220 px) e a barra com o visitante (sem conta).
- A 1280 px o nome do Spotify fica com 43 px: legível só pelo começo; o nome inteiro está no `title`.
