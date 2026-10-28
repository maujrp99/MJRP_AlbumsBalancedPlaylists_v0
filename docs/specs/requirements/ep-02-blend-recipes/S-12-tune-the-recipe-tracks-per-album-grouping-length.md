---
id: S-12
aliases: [S-12]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-02]]"
planned_for: "[[ROADMAP#^REL-04]]"
points_to: ["[[behavior#^blend-ingredients-by-recipe]]", "[[behavior#^playlists-generated-names]]"]
delivered_by: ["ab4bbb6", "a86877a"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-12 · Ajustar a receita: faixas por álbum, agrupamento, estrutura e duração

## pt-BR

Como quem cura playlists a partir de álbuns, quero ajustar a receita escolhida: quantas faixas por álbum, como agrupá-las, se sai uma playlist ou várias e qual a duração, para que a mistura tenha o tamanho e a ordem que combinam com a ocasião.
Hoje (fato lido do código): a quantidade vai de 1 a 10 faixas por álbum; há cinco formas de agrupar (por álbum, por posição geral, por artista, intercalado e aleatório); a duração vai de 30 a 180 minutos e só aparece quando a receita a usa; os nomes das playlists levam SPFY, BEA ou UGR e o agrupamento.
Entrega (histórico, antes do harness): 2026-01-02 (ab4bbb6), 2026-01-02 (a86877a); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: B5, P20 e seção 3.1 (`components/blend/BlendIngredientsPanel.js:16-347`, `algorithms/TopNAlgorithm.js:52-277`); ROADMAP legado, Sprint 15.5 («Algorithm Renaming», «Grouping Tracks»). O «Discovery Mode» não tem efeito (B6) e está em outra story.

## en

**Tune the recipe: tracks per album, grouping, length**

As someone who curates playlists from albums, I want to tune the chosen recipe: how many tracks per album, how to group them, whether it yields one playlist or several and how long, so that the blend has the size and order that fit the occasion.
Today (read from the code): the count goes from 1 to 10 tracks per album; there are five ways to group (by album, by overall rank, by artist, interleaved and shuffled); the duration goes from 30 to 180 minutes and only shows when the recipe uses it; playlist names carry SPFY, BEA or UGR and the grouping.
Delivery (history, before the harness): 2026-01-02 (ab4bbb6), 2026-01-02 (a86877a); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: B5, P20 and section 3.1 (`components/blend/BlendIngredientsPanel.js:16-347`, `algorithms/TopNAlgorithm.js:52-277`); legacy ROADMAP, Sprint 15.5 (“Algorithm Renaming”, “Grouping Tracks”). “Discovery Mode” has no effect (B6) and is in another story.
