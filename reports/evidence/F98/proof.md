# F98 — a exportação para o Apple Music diz por que falhou (UAT-307, UAT-308): a prova

Ramo `fix/f98-apple-music-export-says-why-it-failed`, a partir da `main` em `9cfb859`, com a `main` em `b76dfeb` juntada. 2026-11-23.

## O que mudou

- **A busca no catálogo do Apple Music tem três respostas.** `MusicKitCatalog.findTrackFromAlbum` e `findTrack` devolvem a faixa, ou «nada» só quando o Apple Music respondeu e não tinha, ou lançam o erro. `AppleMusicExportService` conta as faixas não conferidas à parte (`unchecked`, `uncheckedTracks`). Uma playlist sem nenhuma faixa conferida vai para «Not created», nunca para «No track found».
- **A recusa tem nome.** `AppleMusicRefusedError` (401, 403, os códigos de recusa do MusicKit) e `AppleMusicAuthorizationError`, em `public/js/services/musickit/musicKitErrors.js`. Recusada na pasta, na busca ou ao criar a playlist, a exportação para e diz «Apple Music did not allow this for your account», com o próximo passo.
- **O fim da exportação para o Apple Music aparece na janela de exportar** (`public/js/ui/AppleExportReport.tsx`), no lugar dos avisos que sumiam: o que foi criado e em que pasta, o que não foi, as faixas não encontradas separadas das não conferidas, «Try again» e «Close». Com a janela fechada durante a exportação, um aviso só diz como terminou.
- **Resultado parcial não tem título de sucesso**, nas duas janelas: «Exported, with something left out», com sinal âmbar, e «Try again» com o que ele faz.
- **O resultado é anunciado e recebe o foco**, nas duas janelas: `role="status"` no topo do relatório, e o foco no título quando o relatório aparece.
- **Toda frase vem do dicionário** (UAT-308): os dois serviços de exportação e `holdNotice` devolvem código e dados; `public/js/i18n/exportTexts.js`, `public/js/i18n/holdTexts.js` e as duas janelas dizem as palavras. 61 chaves novas em cada idioma. Teste de guarda: `test/architecture/exportsDoNotSpeak.test.js`.
- **Os dois textos da recusa do Spotify**: verdadeiro para qualquer 403 («Spotify did not allow this for your account», a lista de testes como «o motivo mais provável») e «the list has only a few places».
- **Evento de uso**: `playlists_exported` leva `reason` (`refused`, `unchecked`) também para o Apple Music.

## Teste antes

`reports/evidence/F98/red-before.txt`: os dez arquivos de teste novos e alterados, rodados antes da implementação: 71 testes falhando e quatro arquivos sem carregar (os módulos que eles importam ainda não existiam). Depois: verdes.

## No navegador, no site construído

`reports/evidence/F98/browser-proof.mjs` (rodado por `run-all.sh`), sobre o site construído da ponta do ramo. O MusicKit é o substituto de `test/support/musicKitRecorder.js`, posto em `window.MusicKit` antes de a página carregar; a API do Spotify é respondida pelo próprio script; todo outro endereço é abortado (Apple Music, o script e a API da Apple, as páginas do Spotify, o Firebase de produção, qualquer esquema que não seja http para 127.0.0.1). Nenhum link que sai do site é pressionado, nenhum app da máquina é aberto. O idioma é a escolha guardada (`albumblender:lang`). As frases esperadas são lidas dos dicionários do site; em português, a prova também confere que nenhuma frase do dicionário em inglês dos relatórios está na tela.

| motor | largura | idioma | passou | falhou |
|---|---|---|---|---|
| Chromium | 1280 | inglês | 108 | 0 |
| Chromium | 1280 | português | 118 | 0 |
| Chromium | 390 | inglês | 108 | 0 |
| Chromium | 390 | português | 118 | 0 |
| WebKit | 1280 | inglês | 108 | 0 |
| WebKit | 1280 | português | 118 | 0 |
| WebKit | 390 | inglês | 108 | 0 |
| WebKit | 390 | português | 118 | 0 |

Total: 904 de 904. Saídas em `raw/run-<motor>-<largura>-<idioma>.txt`; o que o MusicKit simulado e o Spotify simulado receberam, e o que foi abortado, em `raw/<motor>-<largura>-<idioma>-<serviço>-<cenário>.json`; 104 capturas em `figures/` (em 128 cores, para pesar menos). Os únicos endereços abortados em toda a prova foram os do Google e do Firebase (login, banco, fontes); nenhum endereço da Apple nem das páginas do Spotify chegou a ser pedido.

Os onze cenários, em cada motor, largura e idioma:

**Apple Music**
1. **Sucesso:** «Export complete», as duas playlists com as suas faixas e a pasta; nenhuma lista de faixas, nenhum «Try again».
2. **Todas as buscas falhando (500):** «Export failed», «your tracks could not be checked», «5 tracks could not be checked», nunca «not found», «Try again»; com o Apple Music de volta, «Try again» completa a exportação e o título recebe o foco de novo.
3. **Misto** (uma busca falha, uma faixa não existe): «Exported, with something left out», as duas playlists criadas com o que foi achado, «1 track not found» e «1 track could not be checked» em listas separadas, «Try again» com a explicação.
4. **A autorização não dada:** «Apple Music was not authorized», com o próximo passo; nada buscado nem criado; «Try again».
5. **A conta recusada (403 nas buscas):** «Apple Music did not allow this for your account», com o próximo passo; a exportação parou na primeira busca (1 de 5); nunca «not found».
6. **Nada no catálogo** (o catálogo responde e não tem): «None of the tracks was found in Apple Music», «5 tracks not found», sem «Try again».

**Spotify** (a janela de novo, pelo resultado parcial, pelos textos e pelo idioma)
7. **Misto:** «Exported, with something left out» (era «Export Complete!»), 3 / 5, as duas listas, «Try again» com a explicação.
8. **403:** o texto suavizado, com o passo «peça para incluir o seu e-mail»; em inglês, «the list has only a few places».
9. **500 nas buscas:** «your tracks could not be checked», «Try again».
10. **Listas vazias de verdade:** «No tracks found on Spotify» (dito pela janela, no idioma do app), sem «Try again».
11. **Sucesso com uma faixa que o Spotify não tem:** «Export Complete!»: faixa não encontrada não é falha.

Em cada cenário: o resultado é uma região de status e o título tem o foco; a janela cabe na tela, sem rolagem lateral; nenhum erro de página; a página nunca saiu do site; o MusicKit de verdade e a Apple nunca foram alcançados.

## Suíte e sensores

- Suíte inteira (`npx vitest run`, sozinha, pela fila), sobre a árvore com a `main` juntada: 421 arquivos, 5.789 testes passaram, 1 pulado; saída 0.
- `npm run typecheck`: saída 0. `npx eslint . --quiet`: saída 0. `npm run budget:publication`: saída 0 (`raw/publication-budget.txt`).
- **O orçamento de peso mudou.** O script principal cresceu 1.293 B (200.486 → 201.779): os textos em inglês dos dois relatórios, do progresso e do aviso de pausa (61 chaves; o inglês mora sempre no script principal) e `i18n/holdTexts.js`. O que vem depois da primeira tela cresceu 2.527 B (256.458 → 258.985): o relatório do Apple Music e as peças que ele divide com a janela do Spotify, a recusa com nome, `i18n/exportTexts.js` e os mesmos textos em português. Os tetos em `scripts/bundle-budget.json` foram medidos de novo pela regra do arquivo (medido + 150 B): `main` 201.929, `background` 87.477.
- Os três sensores (`requirements_graph_check --changed`, `product_structure_check`, `sdd_shape_check`): saída 0.

## As gravações de referência que mudaram (de propósito)

Regravadas uma vez e comparadas linha a linha com o que estava guardado (`raw/golden-*.txt`):
- `test/fixtures/spotifyExportBeforeF83.json`: 16 de 52 páginas (a região de status e o foco; as frases ditas pela janela; o título do resultado parcial).
- `test/fixtures/exportWindowFromMain.json`: 4 de 44 páginas (o progresso em etapa e nome; a página «done», que agora é o relatório).
- `test/fixtures/exportMusicKitRecording.json`: as chamadas ao MusicKit são as mesmas em 26 de 28 cenários. Mudaram em «every creation fails (401…)» (a recusa para a exportação: 1 pedido de criação em vez de 3) e em «the step reads the folders, the person has not authorized» (só as palavras do erro, que agora tem nome).

## As falhas do MusicKit, uma a uma

| Chamada | Falha | O que a pessoa vê |
|---|---|---|
| iniciar (a chave do site) | o site sem a chave | «Apple Music is not set up for this site» |
| iniciar (o script, o prazo) | não carrega, ou passa de 10 s | «Apple Music could not be reached» |
| autorizar | a pessoa não autoriza | «Apple Music was not authorized», com o próximo passo |
| ler ou criar a pasta | recusa (401, 403) | a exportação para: «did not allow this for your account» |
| ler ou criar a pasta | outra falha | as playlists vão para a raiz da biblioteca, e o relatório diz |
| buscar a faixa | respondeu e não tem | «not found» |
| buscar a faixa | rede, 5xx, 429, outro erro | «could not be checked», contada à parte |
| buscar a faixa | recusa (401, 403) | a exportação para: «did not allow this for your account» |
| criar a playlist (com as faixas) | recusa (401, 403, sem assinatura) | a exportação para: «did not allow this for your account» |
| criar a playlist (com as faixas) | outra falha | «Apple Music did not create», com o que ele disse; as outras ainda são tentadas |

Não há chamada separada de «incluir faixas»: elas vão no mesmo pedido que cria a playlist.

## O que esta prova não cobre

- **O Apple Music e o MusicKit de verdade.** Tudo é simulado; nenhuma conta real foi usada. O que o MusicKit lança numa conta recusada não pôde ser lido: a leitura usa o código do erro, o status e as palavras, com folga, e o que ela não reconhece vira «could not be checked», nunca «not found».
- **O limite de chamadas (429)** não tem espera nem texto próprio: na busca conta como «could not be checked», na criação entra em «Apple Music did not create».
- **A chave do site vencida** (401 no catálogo) aparece como recusa da conta, com o mesmo próximo passo.
- **Faixas que o Apple Music aceite e não inclua na playlist** (a biblioteca dele é atualizada depois): a exportação não confere a playlist criada.
- **«Tentar de novo» depois de um resultado parcial cria uma playlist nova** para a que ganhou faixas, e a primeira fica na biblioteca (o Apple Music não deixa apagar pela API). O texto ao lado do botão diz isso.
- **O evento `playlists_exported` saindo da página:** o coletor fica bloqueado na prova. Está provado nos testes de `test/services/usage/`.
- **As descrições que a exportação grava dentro do Spotify** («Generated by MJRP Album Blender…», «Part of…») continuam em inglês e com o nome antigo do produto: não aparecem na tela do app, e estão na lista do teste de guarda, com o motivo. A descrição gravada no Apple Music («Created by MJRP's The Album Blender») também não mudou.
- **As mensagens das classes de erro** (`SpotifyRefusedError` e as outras) continuam em inglês: fora da exportação, um chamador que mostre `error.message` mostra inglês.
- **A redação em português** é dele aprovar (os textos novos aparecem no Painel, nos grupos «Relatório da exportação para o Apple Music» e «Relatórios de exportação»).
- `docs/specs/behavior.md` ainda não descreve o relatório do Apple Music nem a propriedade `reason` para o Apple Music: fica para o passo retroativo (TASK-11).
- O `doctor.py` sai vermelho por dois erros do `MEMORY.md` que já estavam na `main` (o bloco «Where the Work Stopped» acima do tamanho; o `## Now` mais antigo que o log). Este ramo não toca o `MEMORY.md`.
