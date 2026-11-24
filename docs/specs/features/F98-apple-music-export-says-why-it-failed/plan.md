# Plan — Feature F98: A exportação para o Apple Music diz por que falhou · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Architecture Approach
Em esboço. Via rápida: este plano se completa no passo retroativo, com o que foi construído.

O modelo é o conserto da F97. A recusa do Apple Music ganha um nome próprio (uma classe de erro em `public/js/services/musickit/`), lançada pelas chamadas do MusicKit que a exportação faz; a busca no catálogo deixa de engolir a falha e passa a ter três respostas; `AppleMusicExportService` conta as faixas não conferidas à parte e para na recusa. O fim da exportação deixa de ser uma fila de avisos em inglês: o serviço devolve o relatório em dados, e a janela de exportar (`public/js/ui/PlaylistExportWindow.tsx`) o desenha, com as mesmas peças que a janela do Spotify usa.

Para as frases (UAT-308), o padrão que o código já tem (`public/js/i18n/askTexts.js`, `public/js/i18n/inventoryTexts.js`): o modelo e o serviço dão um código e os números; um arquivo de `i18n/` ou a tela diz as palavras no idioma do app. `models/` não importa `i18n/`.

## Technical Design
A completar no passo retroativo. Já decidido:
- Erros com nome para a recusa e para a autorização não dada, e uma função que classifica o que o MusicKit lança (código do erro, status 401/403).
- `findTrackFromAlbum` e `findTrack` deixam a falha subir; `AppleMusicExportService` devolve, por faixa, achou / não tem / não conferida; o relatório ganha `unchecked` e os tipos de falha `refused` e `unchecked`.
- `createOrGetFolder` deixa a recusa subir (as outras falhas continuam virando «sem pasta»).
- O relatório do Apple Music desenhado na janela, com «Tentar de novo»; as peças do relatório (título, listas, faixas) compartilhadas com a janela do Spotify; `role="status"` e o foco no título.
- Um resultado com faixas sem conferir tem título próprio, nas duas janelas.
- `SpotifyExportService`, `AppleMusicExportService` e `holdNotice` devolvem códigos e dados; os textos novos em `public/js/i18n/en/` e `public/js/i18n/pt/`.
- `exportReason` lê o relatório dos dois serviços.
- Teste de guarda: nenhuma frase pronta nos dois serviços de exportação nem em `models/albumLoadState.js`.
- Teste que falha antes, para cada requisito.

## Dependencies
F97 (o conserto do Spotify, o modelo deste); F62 (o relatório da exportação); F77 (o evento `playlists_exported`); F81 (os dicionários e a escolha do idioma); F83 (as janelas em React); F90 (a janela de exportar e o passo da pasta do Apple Music).

## Documents Consulted
`docs/specs/uat.md` (UAT-307, UAT-308); `docs/specs/features/F97-spotify-export-says-why-it-failed/` e `reports/evidence/F97/`; `public/js/services/AppleMusicExportService.js`, `public/js/services/musickit/` e `public/js/ui/PlaylistExportWindow.tsx` (`main`, só leitura); S-72, S-79.

A declarar no passo retroativo, um a um («atualizado» ou «sem mudança»): `arch.md`, `data-model.md`, `tech-stack.md`, `constitution.md`, `design-system.md`, `behavior.md`.

## Risks & Considerations
- O que o MusicKit lança de verdade numa recusa não pôde ser lido de uma conta real: a classificação lê o código do erro e o status, com folga, e o que não reconhece vira «não foi possível conferir», nunca «não encontrada».
- Um 401 ou 403 na busca do catálogo também pode ser a chave do site vencida, e não a conta da pessoa: o texto dá um próximo passo que serve nos dois casos, sem afirmar o que o app não sabe.
- Tentar de novo depois de um resultado parcial cria de novo a playlist que ganhou faixas (o registro da sessão trata como outra playlist): o texto ao lado do botão diz isso.
- O relatório na janela troca os avisos que sumiam: a gravação de referência da exportação (`test/fixtures/exportMusicKitRecording.json`) muda nas linhas dos avisos, e só nelas.
- A prova no navegador nunca carrega o MusicKit de verdade nem chama a Apple: tudo é simulado, e todo endereço da Apple e do Spotify é abortado.
