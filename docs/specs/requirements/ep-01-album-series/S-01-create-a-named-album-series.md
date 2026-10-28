---
id: S-01
aliases: [S-01]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-01]]"
planned_for: "[[ROADMAP#^REL-01]]"
points_to: ["[[behavior#^home-series-default-name]]", "[[behavior#^home-series-created]]", "[[behavior#^home-series-needs-album]]", "[[behavior#^home-series-create-failed]]"]
delivered_by: ["5542a3c"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-01 · Dar nome a uma série de álbuns e criá-la com os álbuns escolhidos

## pt-BR

Como quem cura playlists a partir de álbuns, quero dar um nome à série e criá-la com os álbuns que escolhi, para que eu tenha um conjunto de álbuns pronto para misturar.
Hoje (fato lido do código): sem nome digitado, a série se chama «New Album Series»; ao criar, o app abre a série criada e avisa «Created series: X with N albums»; sem nenhum álbum escolhido pede para escolher ao menos um.
Entrega (histórico, antes do harness): 2025-11-26 (5542a3c); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: H1, H11 (`controllers/HomeController.js:219-275`); ROADMAP legado, Sprint 2 («HomeView with series creation»).

## en

**Create a named album series**

As someone who curates playlists from albums, I want to give the series a name and create it with the albums I picked, so that I have a set of albums ready to mix.
Today (read from the code): with no name typed, the series is called “New Album Series”; on creating, the app opens the new series and says “Created series: X with N albums”; with no album picked it asks for at least one.
Delivery (history, before the harness): 2025-11-26 (5542a3c); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: H1, H11 (`controllers/HomeController.js:219-275`); legacy ROADMAP, Sprint 2 (“HomeView with series creation”).
