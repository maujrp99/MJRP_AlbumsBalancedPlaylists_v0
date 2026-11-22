# F83 onda 8a: a prova das exportações

Ramo `claude/f83-wave-8a-exports` (a partir de `claude/f83-wave-7b-blend-screen`, 160c702). O pai da comparação é o 160c702, construído em um worktree solto.

## 1. A gravação das chamadas ao MusicKit (o caminho do dono)

- `test/support/musicKitRecorder.js`: um SDK de mentira que anota toda chamada, a mesma função no jsdom e no site construído. `test/support/exportRecordingScenarios.js`: 27 cenários (uma playlist; lote; pasta escolhida por id; pasta nova; pasta lembrada; uma playlist de um lote com a posição; sem pasta; faixas não achadas; 300 faixas com id; 120 buscas; 250 pastas em 3 páginas; limite de taxa 429; 401 no meio; falha e repetir; autorização expirada; autorização negada; sem token; pasta que não se cria; de novo na mesma sessão; dois cliques; nada a exportar; as playlists da tela de edição; a leitura das pastas (algumas, nenhuma, erro, sem autorização); o arquivo).
- Dourado `test/fixtures/exportMusicKitRecording.json`: gravado UMA vez (`RECORD_EXPORT=1`) no commit 1513f6b, antes de mover qualquer arquivo: 605 eventos, 264 chamadas `api.music`. Nunca recapturado (o `git diff` de `test/fixtures` no commit da mudança é vazio).
- **Depois da mudança, no jsdom: idêntico** (30 casos verdes, a mesma comparação; só a linha `loadExports` do teste mudou de caminho).
- **No site construído (`recording-built.mjs`): idêntico em Chromium e em WebKit**: 106 conferências e 264 chamadas `api.music` em cada motor, na ordem (o token, `configure`, `getInstance`, `authorize`, cada `api.music` com caminho, parâmetros e corpo), os textos de progresso, o texto dos avisos e as pastas lidas. As pausas de 500 ms entre duas criações não são chamada ao SDK e o tipo/duração do aviso não aparece na página: não comparados. O arquivo foi provado pelas telas (§ 2).
- Os testes de exportar existentes (`AppleMusicExport.test` 20, `PlaylistExportWindow` 20, `AppleFolderStep` 23, `exportWindowFromMain` 15 cenários, `SavedPlaylists.export` 6) só mudaram o caminho de um `vi.mock`/`import`; nenhuma asserção.
- Não há divisão da lista de faixas: um pedido leva todas (300 faixas = um `POST`).

## 2. A janela do Spotify em React

- Dourado da janela à mão (`test/fixtures/spotifyExportBeforeF83.json`, 21 cenários, commit 427d107), capturado antes de reescrever: a página, o estado dos campos, cada nó de texto como está escrito, o foco e o que a janela pediu ao mundo. `test/ui/SpotifyExportWindow.sameAsBefore.test.tsx`: 21 cenários sem diferença e 2 testes de que a conferência não é cega (uma palavra, uma classe, um atributo e um espaço mudados de propósito são acusados). Os 9 casos de `SpotifyExportModal.test.js` levados com as mesmas asserções para `test/ui/SpotifyExportWindow.test.js`.
- Estados: parada (as da tela de edição, uma playlist, várias), modo e nome, buscando/criando/adicionando, concluída com os links, parcial (faixas não achadas, criadas sem todas as faixas, sem faixa, não criadas), não conectado (reconectar), falha e tentar de novo, falha imprevista, nada a exportar, dois cliques, fechar (X, Fechar, fundo, Escape não faz nada), fechada enquanto espera, texto nunca marcação. O DOM é o mesmo no computador e no celular (só o CSS de `#spotify-export-modal` muda): o celular é provado no navegador.
- Defeitos mantidos: sem Escape; sem prender o Tab; sem foco ao abrir nem ao fechar; sem `role` de janela; o fundo não fecha enquanto exporta; «1 tracks» em inglês no singular; a janela é refeita inteira a cada palavra da exportação.

## 3. No navegador, sites construídos, o pai (160c702) contra este ramo

`browser-proof.mjs` (`run-all.sh`): Firebase e todo outro host bloqueados; MusicKit é o mesmo gravador; o Spotify é respondido pelo roteiro (perfil, busca, criar playlist, pôr faixas) e cada pedido é anotado; a loja das guardadas é alcançada por uma linha no fim do arquivo da tela (igual nos dois lados; nada publicado). Cada passo nos dois lados, em sincronia: a janela (elementos, cada nó de texto, a caixa de cada elemento), o foco, o que o MusicKit foi perguntado, o que o Spotify foi perguntado, o arquivo entregue ao navegador (nome, tamanho e hash), o texto dos avisos e os pixels da janela. Espera ≥ 1,1 s depois de folhas e avisos; a área de avisos e o rodapé escondidos nas figuras; só figuras de elemento (nunca a página inteira).

- Telas: playlists de edição e playlists guardadas. Computador: Chromium 1280 e 900; Chromium 899 (a faixa do celular); iPhone 14 e iPhone SE no Chromium com perfil e no WebKit; WebKit 1280.
- Partes: Apple Music (pastas: algumas, nenhuma, erro, 250 em 3 páginas; escolher, pasta nova sem nome, com nome, sem pasta, exportar, Escape e o foco de volta), Spotify (a janela, o modo, o nome, o fundo, exportar até o relatório, Escape, Fechar; e a criação que falha, tentar de novo), o arquivo (os bytes iguais), e o fechar de todo jeito (Escape, toque fora, o botão de fechar) com o foco.
- Total nos arquivos guardados em `raw/`: **4.342 conferências passadas e 16 reprovadas, todas explicadas abaixo; 0 diferenças sem explicação** (cada janela, foco, chamada ao MusicKit, pedido ao Spotify, arquivo e aviso igual em todas; nos pixels só os dois ruídos abaixo). Duas execuções intermediárias (Chromium 1280 das duas telas, a primeira passada) foram sobrescritas por execuções completas e não estão guardadas: ambas sem falha.
- **Ruído, explicado:** (a) 3 pixels de 1 em 255 na barra do topo (o botão do Apple Music da moldura, uma transição ainda correndo) em Chromium 1280: aparecem também de pai contra pai (execução de controle, `raw/browser-proof-edit-chromium-1280-control.json`), 38 passos classificados assim; (b) no WebKit 1280 da tela de guardadas, 4.003 pixels (até 23 de 255) no canto de cima à esquerda, x 16–196, y 21–50: **é a chama animada do logo «The Album Blender»** (a figura do recorte mostra só ela, e cada quadro da chama difere de outro); apareceu nas 3 execuções reais desta parte (em 6, 9 e 3 passos) e não na única execução de controle: provável, não provado por uma repetição que a faça aparecer de pai contra pai. As 13 reprovações do controle de Chromium 1280 (arquivo `-control`) são o ruído (a) de uma execução feita antes de a regra de ruído existir. A janela e o resto da página nesses passos são iguais (DOM, caixas e todos os demais pixels). Classificado como ruído pelo recorte exato.
- `figures/`: duas figuras (pai e novo) por caso, 500 px.

## 4. Totais

Suíte inteira (fila): 378 arquivos, 5.031 testes, verde (inclui `noSecretsInRepo`); `test/architecture` verde; `tsc` limpo; `eslint` 0 erros e 67 avisos (os mesmos do pai). Build dentro de `scripts/bundle-budget.json`: principal 194.889 B → 195.460 B (+571 B: o inglês das 38 chaves novas); teto 195.860 B (400 B de folga); o que vem depois da primeira tela 236.603 B → 236.792 B; `background` 58.100 B → 59.300 B (necessidade 58.815 B; 485 B de folga); `reactVendor` 68.691 B sem mudança. A janela do Spotify é um arquivo de 3.517 B pedido só ao apertar o botão.

## 5. Não provado

- A exportação de verdade para a biblioteca do dono (Apple Music) e a do Spotify: nada aqui toca a Apple nem o Spotify. É dele, na prévia: uma pasta nova, uma pasta escolhida, sem pasta.
- No navegador, o Spotify só com a API de mentira; o estado «buscando» passa depressa demais para o roteiro: o dourado do jsdom o cobre.
- No celular, o arrastar com o dedo não é parte desta onda.
