---
id: S-06
aliases: [S-06]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-01]]"
planned_for: "[[ROADMAP#^REL-02]]"
points_to: ["[[behavior#^series-edit-modal]]", "[[behavior#^series-edit-messages]]", "[[behavior#^album-remove-confirm]]", "[[behavior#^album-removed]]"]
delivered_by: ["19d38c1", "b3b9f32"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-06 · Editar uma série: trocar o nome, tirar álbuns e acrescentar outros

## pt-BR

Como quem cura playlists a partir de álbuns, quero trocar o nome da série, tirar álbuns dela e acrescentar outros buscando um artista, para que a série acompanhe o que quero ouvir, sem criar outra.
Hoje (fato lido do código): o nome é obrigatório; álbum repetido é recusado; os botões de editar e excluir a série ficam só no cabeçalho de cada série do painel geral.
Entrega (histórico, antes do harness): 2025-12-07 (19d38c1), 2025-12-31 (b3b9f32); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: A10, A12, A14 (`components/series/SeriesEditModal.js:10-221`, `components/series/SeriesEventHandler.js:205-306`); ROADMAP legado, Sprint 15 («Edit Modal Refactor: Artist scan») e Sprint 21.5 (remoção sem piscar).

## en

**Edit a series: rename it, remove and add albums**

As someone who curates playlists from albums, I want to rename the series, remove albums from it and add others by searching an artist, so that the series follows what I want to hear, without creating another one.
Today (read from the code): the name is required; a repeated album is refused; the buttons to edit and delete the series appear only in each series' header on the all-series panel.
Delivery (history, before the harness): 2025-12-07 (19d38c1), 2025-12-31 (b3b9f32); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: A10, A12, A14 (`components/series/SeriesEditModal.js:10-221`, `components/series/SeriesEventHandler.js:205-306`); legacy ROADMAP, Sprint 15 (“Edit Modal Refactor: Artist scan”) and Sprint 21.5 (removal without flashing).
