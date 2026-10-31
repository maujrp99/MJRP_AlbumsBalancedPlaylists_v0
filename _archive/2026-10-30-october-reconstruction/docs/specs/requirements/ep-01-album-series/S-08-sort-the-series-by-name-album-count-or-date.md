---
id: S-08
aliases: [S-08]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-01]]"
planned_for: "[[ROADMAP#^REL-05]]"
points_to: ["[[behavior#^library-series-sort]]"]
delivered_by: ["29b3f5e"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-08 · Ordenar as séries por nome, quantidade de álbuns ou data

## pt-BR

Como quem cura playlists a partir de álbuns, quero ordenar as séries da biblioteca por quantidade de álbuns, nome (A-Z e Z-A) ou mais novo e mais antigo, para que eu ache a série certa quando tenho muitas.
Hoje (fato lido do código): a ordem muda os grupos de séries, não os álbuns, e só se nota no painel de todas as séries; começa por quantidade de álbuns crescente.
Entrega (histórico, antes do harness): 2026-01-14 (29b3f5e); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: A5 (`controllers/SeriesController.js:489-523`); ROADMAP legado, Sprint 21 («Series Sorting»).

## en

**Sort the series by name, album count or date**

As someone who curates playlists from albums, I want to sort the library's series by album count, name (A-Z and Z-A) or newest and oldest, so that I find the right series when I have many.
Today (read from the code): the order changes the groups of series, not the albums, and only shows on the all-series panel; it starts with album count ascending.
Delivery (history, before the harness): 2026-01-14 (29b3f5e); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: A5 (`controllers/SeriesController.js:489-523`); legacy ROADMAP, Sprint 21 (“Series Sorting”).
