---
type: ux-audit
subject: "Reconferência visual pré-merge do ramo feat/f90-export-from-the-saved-playlists-screen, no site CONSTRUÍDO (vite build), Chromium a 1280 e WebKit com iPhone 14 e SE: exportar uma playlist, ou o lote, da tela das playlists guardadas, e o passo da pasta do Apple Music (UAT-276, S-72)"
project: mjrpalbumblender-v0
features: [F90]
moment: delivery
date: "2026-11-21 23:55"
judged: "2026-11-21 23:55"
judged_commit: 6ff1581
who_judged: separate-agent
verdict: pass
p0: 0
p1: 1
p2: 7
duration_s: 2700
status: open
---

# Reconferência visual — exportar da tela das playlists guardadas, e a pasta do Apple Music

**Veredito: passa (`pass`), sem P0; 1 P1 e 7 P2.** O pedido do dono funciona no site construído: cada playlist de um lote aberto tem o seu export (computador: ícone na linha, ao passar o mouse; celular: alvo de 44 × 44 ao lado da linha, nomeado «Export <nome>»), o lote tem «Export» ao lado de «Edit Batch» (celular: na folha «⋯», entre «Edit batch» e «Delete batch»), e as duas abrem a mesma janela com Apple Music, Spotify e JSON, nessa ordem. **No Apple Music**, com o MusicKit de mentira: o nome da série vem marcado «(default)» e um toque em «Export» aceita; as pastas existentes aparecem; «New folder» recusa vazio e só espaços em palavras comuns; um nome igual a uma pasta existente (sem contar maiúsculas) a reaproveita; «No folder» cria fora de pasta; lendo, nenhuma, falhou e recusado aparecem e em todos ainda dá para exportar; a escolha volta depois de recarregar. As chamadas de mentira confirmam que **a playlist é criada na pasta escolhida**, com o nome do lote inteiro («2. Road trip mix - Side Two»), e que exportar uma não toca nas outras. Nada mais na tela se moveu contra o `main` (o `main` contra ele mesmo deu 0 pixel de diferença). O P1 é um risco só para quem tem muitas pastas: a pasta escolhida é procurada de novo pelo nome, na primeira página da biblioteca.

## Como foi feito
- **Quem julgou:** agente juiz separado (Opus); não construiu o ramo.
- **Objeto:** `6ff1581` (worktree do ramo) e `main` (`1330ba9`, extraído com `git archive`), cada um construído com `vite build` pela fila da máquina (`machine_load.py`, rótulos `judge-f90-build`, `judge-f90-build-main`) em pastas de rascunho, servidos em `127.0.0.1` reescrevendo as rotas como o `firebase.json` (`/home` → `index.html`, o resto → `app.html`, `/api` → 500).
- **Navegador:** Playwright 1.56.1 (do checkout MJRPpersonal, como o juiz da F88): Chromium a 1280 × 800; WebKit com `iPhone 14` (390 × 664) e `iPhone SE` (320 × 568).
- **Costuras:** recusados os pedidos a `identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`, `music.apple.com` e `spotify.com`; nenhum login, nada escrito. A lista guardada veio de uma fonte de mentira posta no leitor da própria tela (como o `shoot.mjs` do construtor); a tela de edição, do `playlistsStore` do próprio site. O MusicKit é um `window.MusicKit` de mentira, posto antes de o app abrir (`/api/musickit-token` respondido com um token falso): lista de pastas com 3 nomes, com 9 (celular), nenhuma, falha na lista, autorização recusada, criação recusada (403); cada chamada registrada (`work/judge.mjs`, `MK`). Nenhuma chamada real.
- **Roteiros e medidas** (rascunho): `work/judge.mjs` (fases `geometry`, `desktop`, `edit`, `phone`), `work/out-*.json`. Um diagnóstico curto (`work/dbg.mjs`, um Chromium) rodou fora da fila. Os servidores foram fechados ao fim de cada roteiro.
- **Capturas:** `captures/` (39 recortes, 1,2 MB).

## O que foi conferido
1. **As entradas, e nada mais mexido** (`d1280-branch-batch-and-rows.png` × `d1280-main-batch-and-rows.png`; `iPhone14-branch-open-batch.png` × `iPhone14-main-open-batch.png`; SE idem):
   - **Computador:** «Export» (110 × 38, ícone Share, `btn-secondary`) entra entre «Edit Batch» e a lixeira; «Edit Batch» anda 117 px para a esquerda; cabeçalho, linhas (90/534, 609, 684 × 1100 × 74) e grupo idênticos ao `main`. Na linha, o export (48 × 32, `aria-label` «Export Side Two») aparece ao passar o mouse, como o olho; o olho ficou onde estava (1142, 638).
   - **Celular:** o alvo é 44 × 44 em todas as linhas, nos dois iPhones; o cabeçalho do lote e o «⋯» ficaram nas mesmas coordenadas; a linha da playlist perde 48 px de largura (iPhone 14: 316 → 268), e um nome longo que cabia em uma linha passa a duas (52 → 72 px de altura). Sem rolagem para o lado (390/390, 320/320).
   - **Ruído:** `main` contra `main` byte a byte igual nos quatro recortes.
2. **A janela** (`d1280-window-batch.png`, `iPhone14-window-one.png`, `iPhone14-batch-sheet.png`): «Export to Apple Music», «Export to Spotify», «Download JSON», nessa ordem, nas quatro entradas; o título diz «Export Side Two» para uma, «Export batch» para o lote. O Apple Music recebe o foco ao abrir; Escape fecha e devolve o foco ao botão da linha («Export Side Two»).
3. **O passo da pasta, cada estado com o stub** (`d1280-step-*.png`, `iPhone14-step-*.png`, `iPhoneSE-step-*.png`):
   - **Lendo:** «Reading your Apple Music folders...», com a série, «New folder» e «No folder» já escolhíveis.
   - **Listado:** a série marcada «(default)»; a pasta de nome igual à série («pink floyd essentials») não se repete; linhas de 44 px; no celular a lista rola dentro de 40 % da tela e «Export»/«Back» ficam fora dela, acima do menu de baixo (folha `z-index` 1000, menu 40; o ponto no centro de cada botão é o próprio botão).
   - **Um toque aceita:** «Export» com o padrão → `POST /v1/me/library/playlists {"name":"2. Road trip mix - Side Two","parent":"f2"}`, a pasta existente da série; sem pasta da série, `POST playlist-folders {"name":"Pink Floyd Essentials"}` e a playlist dentro dela (`new-folder`).
   - **Pasta existente** («Road Trips», lote inteiro): as duas playlists novas com `parent:"f1"`; a já criada na sessão não se repete; a faixa sem id procurada e deixada de fora com aviso.
   - **New folder:** vazio e «   » → «Type a name for the new folder.», o foco volta ao campo; «jazz» com «Jazz» na biblioteca → `parent:"f3"`, sem pasta nova.
   - **No folder:** `parent:null`; aviso «... exported to Apple Music, outside any folder.»
   - **Nenhuma pasta / a lista falhou / recusado:** os textos aparecem e «Export» continua valendo (falhou → exporta para a pasta da série; recusado → «The export to Apple Music failed before anything was created: ...»).
   - **Lembrado:** com `mjrp_apple_music_folder:Pink Floyd Essentials` = `{"name":"Road Trips"}` e a página recarregada, «Road Trips» vem marcada.
   - **Exportando:** o botão diz «Exporting 2. Road trip mix - Side Two...»; ao fim os avisos são os mesmos da tela de edição (mesma função `handleExportToAppleMusic`), incluindo a falha 403 («Apple Music did not create 1 of 1 playlist: ... Export again to create what is missing ...»).
4. **A tela de edição** (`d1280-edit-branch-apple.png`, `iPhone14-branch-edit-export-sheet.png` × `iPhone14-main-edit-export-sheet.png`): no computador, os três botões continuam Spotify, Apple Music, JSON; o Apple agora abre a janela já no passo da pasta (no `main` exportava direto). No celular, a folha «Export playlists» passou de Spotify-primeiro para Apple Music, Spotify, JSON. Nada pior, salvo o P2-4.
5. **Teclado, console:** setas mudam a escolha; Escape fecha; sem erro de console do F90 (só o «Worker Error: Network error» do índice de busca, igual no `main`, por causa dos bloqueios). Campo «New folder» com 16 px: o Safari não deve dar zoom.

## Achados
- **P1-1 · a pasta escolhida da lista é procurada de novo pelo nome, só na primeira página; numa biblioteca com muitas pastas pode nascer uma pasta duplicada.** O passo lista com `limit=100`, mas entrega ao export só o nome; o export chama `createOrGetFolder(nome)`, que lê `/v1/me/library/playlist-folders` sem `limit` (a página padrão do Apple Music, 25 itens pelo que se sabe da API, não verificado com conta real) e, sem achar, cria uma pasta nova com o mesmo nome. Com até ~25 pastas não acontece.
  - **Âncora:** `public/js/services/musickit/MusicKitLibrary.js` (`listFolders` × `createOrGetFolder`), `public/js/views/playlists/AppleFolderStep.js` (`onExport` entrega `folderName`), `public/js/services/AppleMusicExportService.js` (`_start`).
  - **Evidência:** `work/out-desktop.json`, `batchExistingCalls`: `GET playlist-folders?limit=100` ao abrir, `GET playlist-folders` (sem limite) ao exportar.
  - **A mudança:** levar o `id` da pasta escolhida até o export e usá-lo direto (`folderId`); sem id (nome digitado), procurar com `limit=100` e as páginas seguintes.
- **P2-1 · quando a lista de pastas chega, o foco cai para a página.** `draw()` refaz as linhas; o foco, posto na opção marcada ao abrir, vai para `BODY` (`focusAfterList: "BODY in=false"`). Teclado e VoiceOver perdem o lugar a cada abertura.
  - **Âncora:** `AppleFolderStep.js`, `draw()` (`SafeDOM.clear(list)`).
  - **A mudança:** guardar qual opção tinha o foco e devolvê-lo depois de redesenhar (ou atualizar as linhas no lugar).
- **P2-2 · a janela do computador não prende o foco, e no celular o foco não volta ao «⋯».** Tab a partir de «Download JSON» sai para o menu do topo atrás da janela (`tabsFromWindow`: `OUT:Start`, `OUT:Albums`…). No celular, depois de «⋯» → Export → fechar, o foco fica em `BODY`.
  - **Âncora:** `PlaylistExportWindow.js` (`openDialog`; `BaseModal` não prende o foco em lugar nenhum), `openBottomSheet` (a folha do lote já fechou quando a janela abre).
  - **A mudança:** prender Tab/Shift+Tab no painel; no celular, abrir a janela com o «⋯» do lote como lugar de volta.
- **P2-3 · o campo «New folder» fica com um nome velho.** Com uma pasta existente lembrada, antes de a lista chegar a escolha vira «New folder: Road Trips»; quando chega, «Road Trips» é marcada, mas o campo continua escrito «Road Trips» (`typedFieldWhenRemembered`). Quem toca «New folder» e «Export» exporta para «Road Trips» sem ter digitado nada.
  - **Âncora:** `AppleFolderStep.js`, `draw()` (`typed.value = ... : typed.value`); `appleFolderChoice.js`, `initialPick` sem a lista.
  - **Evidência:** `d1280-step-remembered-after-reload.png`; `work/dbg.mjs`.
  - **A mudança:** depois de a lista chegar, limpar o campo quando a escolha final não for «new».
- **P2-4 · na tela de edição do computador, «Back» mostra os três destinos sob o título «Export to Apple Music».** A janela abre direto no passo; «Back» volta a uma lista com Spotify e JSON, que essa tela já oferece em botões próprios.
  - **Âncora:** `PlaylistsView.js` (`openPlaylistExport({ start: 'apple', title: 'Export to Apple Music' })`), `PlaylistExportWindow.js` (`onBack: showRows`).
  - **A mudança:** com `start: 'apple'`, «Back» vira «Cancel» e fecha a janela.
- **P2-5 · palavras.**
  - «You have no folders in Apple Music yet. The playlists go to the folder below, created for them.» → «You have no folders in Apple Music yet. Export creates the folder you pick.» (vale também para uma playlist só, e para «No folder»).
  - Título «Export batch» → «Export Road trip mix» (dá o nome, como «Export Side Two» na linha).
  - Os outros estão bons e curtos: «Folder in Apple Music», «(default)», «(top of the library)», «Type a name for the new folder.», «Your Apple Music folders could not be read. You can still export to the folder below, or type a folder name.»
- **P2-6 · «Export» e «Back» do passo com o texto à esquerda,** enquanto os botões largos da janela (e do resto do app) centram o texto.
  - **Âncora:** `AppleFolderStep.js`, `exportButton`/`backButton` (`btn btn-primary w-full` sem `justify-center`).
  - **Evidência:** `d1280-step-listed.png`, `iPhone14-step-listed.png`.
  - **A mudança:** `justify-center` nos dois.
- **P2-7 · a spec se contradiz.** `docs/specs/features/F90-*/spec.md`, «Out of Scope», ainda diz «escolher a pasta do Apple Music», que a REQ-08 agora faz. **A mudança:** tirar o item.

## Observado, sem achado
- No computador, o export da linha só aparece ao passar o mouse (ou com o foco), como o olho; o próprio olho não mostra ícone visível nem no `main` (de antes do F90).
- No celular, o export estreita a linha em 48 px: nomes longos quebram em duas linhas no iPhone 14 (no SE já quebravam).
- Depois de exportar, a janela fica aberta com «Export» de volta; o aviso aparece em cima (`iPhone14-after-export.png`), como a folha da tela de edição já fazia.

## Não visto
- **Uma conta real do Apple Music:** a lista de pastas (`/v1/me/library/playlist-folders?limit=100`), o tamanho da página padrão (P1-1), a janela de autorização da Apple e a criação numa pasta escolhida só foram vistas com o MusicKit de mentira.
- **Spotify:** só a ordem e a abertura da janela própria (como na evidência do construtor); o pedido de conexão e os avisos do Spotify não foram percorridos.
- **Um iPhone de verdade:** só o WebKit do Playwright; o VoiceOver de verdade (P2-1, P2-2) não foi ouvido.
