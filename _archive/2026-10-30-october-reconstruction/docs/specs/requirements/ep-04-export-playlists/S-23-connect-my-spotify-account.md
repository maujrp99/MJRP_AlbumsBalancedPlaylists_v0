---
id: S-23
aliases: [S-23]
type: requirement
format: story
status: Accepted
epic: "[[prd#^EP-04]]"
planned_for: "[[ROADMAP#^REL-03]]"
points_to: ["[[behavior#^spotify-connect-button]]", "[[behavior#^spotify-connect-result]]", "[[behavior#^local-preferences-and-tokens]]"]
delivered_by: ["4ac955d"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# S-23 · Conectar a minha conta do Spotify

## pt-BR

Como quem cura playlists a partir de álbuns, quero conectar a minha conta do Spotify e desconectá-la quando quiser, para que o app possa enviar playlists para ela e buscar a popularidade das faixas.
Hoje (fato lido do código): o botão mostra «Connect» ou «Connected <nome> ✕»; ao desconectar o navegador pergunta antes; a conexão fica guardada no navegador.
Entrega (histórico, antes do harness): 2025-12-19 (4ac955d); aceita pela regra de brownfield do MJRP de 2026-10-18.
Origem: inventário do V1: L6, C1 (`services/SpotifyAuthService.js:21-283`, `components/SpotifyConnectButton.js:37-97`); ROADMAP legado, Sprint 11 («Spotify OAuth Integration»).

## en

**Connect my Spotify account**

As someone who curates playlists from albums, I want to connect my Spotify account and disconnect it whenever I want, so that the app can send playlists to it and fetch track popularity.
Today (read from the code): the button shows “Connect” or “Connected <name> ✕”; when disconnecting the browser asks first; the connection is kept in the browser.
Delivery (history, before the harness): 2025-12-19 (4ac955d); accepted under the MJRP's brownfield rule of 2026-10-18.
Origin: the V1 inventory of the v0: L6, C1 (`services/SpotifyAuthService.js:21-283`, `components/SpotifyConnectButton.js:37-97`); legacy ROADMAP, Sprint 11 (“Spotify OAuth Integration”).
