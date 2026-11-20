---
type: evidence
feature: F76
date: 2026-11-20
---
# F76 · polimento de Playlists e Playlists gravadas (crítica N3, N4, N5, N15, N20) — prova

Arnês: `reports/evidence/F76/harness/playlists/` (as telas **reais** com dados de exemplo: 6 playlists de 10 a 30 faixas, 12 séries gravadas com 2 a 6 lotes). `before-polish/` = o arnês sobre `main`; `polish/` = o ramo `feat/f76-mobile-polish-home-playlists`. Tamanhos: 393x852 e **393x660** (o que o Safari deixa) com toque, e 1280x800.

```sh
npx vite --config reports/evidence/F76/harness/playlists/vite.config.mjs --port 5193 --strictPort --host 127.0.0.1
node reports/evidence/F76/playlists/shoot.mjs polish 5193          # ONLY=generated,saved para só alguns casos
```

Casos novos: `reconfigure` (o painel aberto pelo «⋯»), `moved` (aviso e linha acesa depois de mover), `saved-filters`, `saved-series-sheet`, `saved-batch-sheet`, `saved-delete-confirm`.

| Medida | Antes | Depois |
|---|---|---|
| 1ª faixa de `/playlists` (y) | 496 | 270 |
| Faixas inteiras acima da barra de ação, 393x660 | 0 | 4 |
| Faixas inteiras acima da barra de ação, 393x852 | 3 | 6 |
| 1ª série de `/saved-playlists` (y, 393x660) | ~370 na conta real (crítica) | ~120 |
| Botões vermelhos à vista nas gravadas | 2 por lote aberto | 0 (só nas folhas) |

Em todos os casos do celular, nos dois tamanhos: largura 393, 0 texto < 12 px, 0 campo < 16 px, 0 alvo < 44 px (`polish/measures.json`).

Computador, 1280x800, janela e página inteira de `generated`, `saved` e `saved-open`: **0 pixel diferente** entre `before-polish/` e `polish/`.

O que vi nas capturas: na 1ª rodada o painel de receitas aberto pelo «⋯» ficava com o cabeçalho atrás da barra do topo e as receitas em duas colunas espremidas — corrigido (`scroll-margin-top`, uma coluna). A data do lote quebrava em «2 / Nov 2026» — agora não quebra. A caixa sem capas das séries vinha laranja — agora neutra. Final: lista calma, nomes em Syne, contagens na fonte de texto, nada vermelho fora das folhas.
