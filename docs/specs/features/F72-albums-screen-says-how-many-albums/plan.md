<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F72: A tela de séries diz quantos álbuns e quantas séries ela mostra · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Architecture Approach
O filtro das séries (`models/seriesFilter.js`) já responde quais séries passam e com quais álbuns. A conta e a frase ficam num modelo puro novo, `models/seriesCounts.js`; nada mais decide esse número.

## Technical Design
- `models/seriesCounts.js`: `countAlbums(matching)` soma os álbuns das séries que passam; `describeCounts({ single, series, totalSeries, albums })` escreve a linha, com singular e plural.
- `SeriesController.getPageView` devolve `paging.albums` ao lado dos números de página que já devolvia.
- `SeriesView.showCounts` entrega a frase ao cabeçalho, que só é redesenhado quando a frase muda.
- `SeriesHeader` mostra a linha sob o título (`data-series-counts`).

## Dependencies
Nenhuma nova.

## Documents Consulted
- `docs/specs/behavior.md` (estados `^library-paging` e vizinhos)
- `public/js/models/seriesFilter.js`

Declarações do passo retroativo da via rápida (conferidas nos commits que citam a F72, em 2026-11-21):
- `docs/specs/constitution.md` — sem mudança (nenhum commit que cita a F72 toca o arquivo)
- `docs/specs/arch.md` — sem mudança (nenhum commit que cita a F72 toca o arquivo)
- `docs/specs/data-model.md` — sem mudança (nenhum commit que cita a F72 toca o arquivo)
- `docs/specs/tech-stack.md` — sem mudança (nenhum commit que cita a F72 toca o arquivo)
- `docs/specs/design-system.md` — sem mudança (nenhum commit que cita a F72 toca o arquivo)
- `docs/specs/behavior.md` — atualizado (commits que citam a F72 e tocam o arquivo: `274dfe4`, `49c786e`)
- `docs/wiki/` — sem mudança (nenhum commit que cita a F72 toca uma página da wiki do projeto)

## Risks & Considerations
- O número é o dos álbuns pedidos nas séries que passam, em todas as páginas: o mesmo álbum em duas séries conta duas vezes. Está dito na spec como pergunta aberta para o MJRP.
- `SeriesView.updateAlbums` está na lista das funções acima do limite de complexidade: a mudança não lhe acrescentou caminho (a conta foi para um método próprio).

## Test plan
- `test/models/seriesCounts.test.js`: a soma e as formas da frase.
- `test/components/series/SeriesHeader.counts.test.js`: a linha aparece, some quando não há o que dizer e acompanha um número novo.
- Navegador, conta do MJRP: todas as séries, uma busca, uma série só (`reports/evidence/F72/2026-11-20-albums-count-proof.md`).
