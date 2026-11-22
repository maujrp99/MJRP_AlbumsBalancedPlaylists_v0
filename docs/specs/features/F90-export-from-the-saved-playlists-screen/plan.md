# Plan — Feature F90: Exportar uma playlist a partir da tela das séries de playlists · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
O export da tela de edição vira uma peça que as duas telas usam. Três decisões, todas do agente (revisáveis):

- **Uma janela de export só** (`views/playlists/PlaylistExportWindow.js`): recebe as playlists, o nome da série e o do lote, mostra Apple Music, Spotify e JSON (nessa ordem; folha embaixo no celular, janela no computador) e chama os três exports. A tela de edição passa a abri-la também (no celular no lugar da folha que tinha; no computador os três botões ficam, chamando a mesma função).
- **Os exports deixam de ler a loja da tela de edição**: `handleExportJson`, `handleExportToAppleMusic` e `showSpotifyExportModal` recebem as playlists, a série e o lote; sem eles leem a loja, como antes. Ficam onde estavam (`views/playlists/PlaylistsExport.js`, `components/SpotifyExportModal.js`); só a entrada deles mudou, e a janela só chama o que já existia.
- **Uma playlist sozinha no Apple Music** guarda a posição que tem no lote (`names.positions`): o nome é o mesmo do export do lote inteiro, e o registro da sessão (`exportLedger`) não deixa criar duas vezes.

- **A pasta do Apple Music é escolhida num passo** (`views/playlists/AppleFolderStep.js`, `appleFolderChoice.js`) que a janela mostra ao tocar em Apple Music; a tela de edição no computador abre a janela direto nele. A lista vem de `musicKitService.listFolders()` (novo, em `musickit/MusicKitLibrary.js`; ao contrário de `createOrGetFolder`, não esconde a falha); o serviço de export recebe `folderName` e `noFolder`. A escolha fica em `localStorage` (`mjrp_apple_music_folder:<série>`). (REQ-08)

Nada é gravado no lote: as telas só passam o que já têm.

## Technical Design
- `public/js/views/playlists/PlaylistsExport.js` — os exports com entrada explícita. (REQ-03, REQ-04, REQ-05, REQ-07)
- `public/js/views/playlists/PlaylistExportWindow.js` — `openPlaylistExport({ playlists, seriesName, batchName, positions, title, start })`. (REQ-03)
- `public/js/views/playlists/AppleFolderStep.js`, `appleFolderChoice.js` — o passo da pasta e a escolha lembrada; `services/musickit/MusicKitLibrary.js`, `MusicKitService.js` — `listFolders()`. (REQ-08)
- `public/js/services/AppleMusicExportService.js` — `positions`, `folderName` e `noFolder` opcionais em `names`. (REQ-04, REQ-08)
- `public/js/components/SpotifyExportModal.js` — recebe playlists e série. (REQ-05)
- `public/js/components/playlists/SavedPlaylistRow.js`, `SavedPlaylistActions.js`, `SavedPlaylistCard.js`, `SavedPlaylistsPhone.js`, `SavedSeriesGroup.js`, `views/SavedPlaylistsView.js` — o «Export» da playlist e do lote. (REQ-01, REQ-02)
- `public/js/views/playlists/phonePlaylistActions.js`, `views/PlaylistsView.js` — passam a usar a peça. (REQ-07)
- `public/css/mobile/playlists.css` — só o que a linha da playlist com o novo botão pedir, dentro da consulta do celular. (REQ-01, REQ-06)

## Dependencies
F62 (os relatórios do export), F76 (a tela guardada no celular), F61 (a leitura das playlists guardadas). Nenhuma biblioteca, cor nem ícone novo (`Share` já existe).

## Documents Consulted
`docs/specs/behavior.md`, `docs/specs/design-system.md`, `docs/specs/features/F62-*`, `F76-mobile-redesign`, `public/js/views/SavedPlaylistsView.js`, `public/js/components/playlists/*`, `public/js/views/playlists/*`, `public/js/services/AppleMusicExportService.js`, `SpotifyExportService.js`, `public/js/components/SpotifyExportModal.js`.

Declarações:
- `docs/specs/constitution.md`, `docs/specs/arch.md`, `docs/specs/data-model.md`, `docs/specs/tech-stack.md` — sem mudança: nenhuma dependência nem entidade nova
- `docs/specs/behavior.md`, `docs/specs/info-arch.md` — atualizados no fecho
- `docs/specs/design-system.md` — sem mudança se nada novo for preciso

## Risks & Considerations
- A tela de playlists já existe em React na linha de migração (`integrate/staging-2026-11-21`, `public/js/screens/saved-playlists/`): esta feature precisa ser repetida lá (TASK-08, em aberto; não é feita nesta linha).
- Um export real para o Apple Music não foi feito pelo agente; só o MJRP, com a conta dele, pode.
- A ordem dos destinos da tela de edição no computador (três botões: Spotify, Apple Music, JSON) não foi mudada; no celular segue a janela nova.
