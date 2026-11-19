# Plan — Feature F47: A lista de séries mostra todas as séries, sem o corte em 20 · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito depois do código (passo retroativo da via rápida), a partir do `docs/log.md` de 2026-11-19 11:54, do código do ramo e da medição em `reports/evidence/F47-series-list-without-cut/`.

## Architecture Approach
É a linha «Ler a lista de séries, com o corte em 20 → `SeriesService`, sem o corte → F47» da tabela da seção 15 de «Carga da tela de álbuns — proposta», no `docs/specs/arch.md`. Nenhuma peça nova: o dono da leitura continua o `SeriesService`, e o Firestore continua só no repositório.

O ramo foi empilhado sobre o da F45 de propósito: sem a carga nova, os 217 álbuns das 45 séries levariam uns 20 minutos.

Não refina o `arch.md`. O `data-model.md` ganhou o parágrafo «Lista de séries inteira (desde a v4.0)».

## Technical Design
Fluxo: `SeriesService.loadFromFirestore` → `repository.findAll({})` (sem `limit` e sem `orderBy`) → as datas viram `Date` → a lista é ordenada no cliente por `updatedAt`, a mais recente primeiro e a série sem data por último → `albumSeriesStore.setSeries` → `saveToLocalStorage`.

- `public/js/services/SeriesService.js`, `loadFromFirestore` — antes: `findAll({ orderBy: ['updatedAt', 'desc'], limit: 20 })`. O `limit` cortava em 20. O `orderBy` na consulta escondia a série sem `updatedAt`, porque o Firestore deixa de fora o documento que não tem o campo ordenado. Agora a consulta vem sem os dois e a ordem é aplicada no cliente. REQ-01, REQ-02, REQ-03.
- `test/services/SeriesService.test.js` — três testes no bloco «loadFromFirestore (F47, UAT-24…)»; dois falhavam antes do conserto. REQ-01, REQ-02, REQ-03.

No mesmo commit (`5e98488`) entraram três correções da carga, que pertencem à F45 e estão nas tarefas dela: a fila própria das fontes rápidas, a carga pela edição escolhida e a queda na busca por nome quando a loja responde 404. E `window.albumLoadStore` e `window.albumLoadService` em `public/js/app.js`, para inspeção e teste.

## UI/UX Design (if the feature touches a screen)
Nenhum desenho novo. A tela de álbuns passou de 20 para 45 séries na conta do MJRP. Captura: `reports/evidence/F47-series-list-without-cut/F47-desktop-after-2026-11-19.jpg`. Não houve sensor visual.

## Dependencies
Nenhuma.

## Documents Consulted
- `docs/specs/arch.md` — «sem mudança»: a tabela da seção 15 já dava a F47 como dona do fim do corte.
- `docs/specs/data-model.md` — «atualizado» no commit `12713e2` (2026-11-19 12:34): a lista de séries sem o corte em 20.
- `docs/specs/behavior.md` — «sem mudança»: não descrevia o corte.
- `docs/specs/constitution.md` — «sem mudança»; a issue aponta o artigo I (sem falha silenciosa), que o conserto passa a cumprir neste ponto.
- `docs/specs/uat.md` — «sem mudança» por esta feature: a UAT-24 segue aberta até o MJRP julgar.
- `docs/manual/` — «atualizado» no commit `12713e2`: o 07 diz que a lista de séries vem inteira.
- `info-arch.md` e `design-system.md` — o projeto não tem.

## Risks & Considerations
- A leitura traz todas as séries de uma vez. Para 45 é uma leitura só; uma conta muito maior pediria leitura em partes.
- A ordem agora é feita no navegador. O teste cobre a série sem data; uma data inválida é tratada como sem data.
- Mais séries na tela pedem mais álbuns: por isso a feature depende da carga nova (F45) e levou à paginação (F51).
- A suíte inteira tem 28 falhas de antes desta feature (linha de base de 2026-11-19).

## Test plan
> Derivado dos REQ do `spec.md` (a feature não importa requisito) · 2026-11-19 12:37, hora de Brasília

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | `SeriesService.test.js`: «brings every series of the account, not only the 20 most recent»; contagem no navegador (45 no banco, 45 na tela) | todas as séries na tela | serviço, navegador | sim; a contagem, não |
| REQ-02 | `SeriesService.test.js`: «asks the database with no limit and no ordering, so a series without an update date is not left out» | série sem data aparece | serviço | sim |
| REQ-03 | `SeriesService.test.js`: «keeps the most recently updated first, and a series with no update date last» | ordem mantida | serviço | sim |

Rodado em 2026-11-19 12:33: `test/services/SeriesService.test.js`, 7 testes, todos passam.

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): o seletor de séries não foi contado no navegador; uma conta com centenas de séries não foi testada.
