# F97 — a exportação para o Spotify diz por que falhou (UAT-302): a prova

Ramo `fix/f97-spotify-export-says-why-it-failed`, a partir da `main` em `65a2005`. 2026-11-23.

## O que mudou

- **A recusa tem nome.** Um 403 do Spotify vira `SpotifyRefusedError` (`public/js/services/spotify/spotifyErrors.js`), lançado por `SpotifyService._fetch` (`errorOf`). A exportação para na primeira chamada recusada e devolve a falha `refused`. A janela diz «Spotify did not allow this account» e o próximo passo; não mostra «Try again» (tentar de novo é ser recusado de novo) nem «Tracks matched 0».
- **Busca que falha não é faixa não encontrada.** `SpotifyExportService._uriOf` devolve três respostas: achou, o Spotify não tem, não foi possível conferir. O relatório ganhou `unchecked` e a chamada `onUnchecked`. Uma playlist cujas faixas não puderam ser conferidas vai para «Not created», nunca para «No track found».
- **Nada conferido.** Sem nenhuma faixa casada e com alguma busca falhada, a falha é `unchecked`: a janela diz que as faixas não puderam ser conferidas e oferece «Try again».
- **Textos** em inglês e português: seis chaves `spotifyWindow.refused*` e `spotifyWindow.unchecked*`. O texto da recusa manda pedir ao dono e avisa que a lista tem poucas vagas; não promete inclusão (o Spotify aceita no máximo 5 contas nesse modo).
- **Evento de uso.** `playlists_exported` ganhou a propriedade `reason`, de um conjunto fechado (`refused`, `unchecked`); o `outcome` continua `failed`.

## Teste antes

`reports/evidence/F97/red-before.txt`: os quatro arquivos de teste rodados antes da implementação, 27 testes falhando. Depois: verdes.

## No navegador, no site construído

`reports/evidence/F97/browser-proof.mjs`, com a API do Spotify respondida pelo próprio script (nunca a de verdade) e todo outro endereço abortado (Apple Music, as páginas do Spotify, o Firebase de produção, qualquer esquema que não seja http para 127.0.0.1).

| motor | largura | passou | falhou |
|---|---|---|---|
| Chromium | 1280 | 33 | 0 |
| Chromium | 390 | 33 | 0 |
| WebKit | 1280 | 33 | 0 |
| WebKit | 390 | 33 | 0 |

Total: 132 de 132. Saídas em `raw/run-<motor>-<largura>.txt`; o que o Spotify simulado recebeu, em `raw/<motor>-<largura>-<cenário>.json`; 24 capturas em `figures/`.

Os quatro cenários, em cada motor e largura:
1. **403 em tudo** (o corpo que o Spotify dá a uma conta fora da lista): a recusa e o próximo passo; nenhuma menção a faixas não encontradas; a exportação parou na primeira busca (1 de 5).
2. **500 nas buscas:** «your tracks could not be checked», «5 tracks could not be checked», «Try again»; depois, com o Spotify de volta, «Try again» completa a exportação.
3. **Listas vazias de verdade** (200, `tracks.items: []`): «No tracks found on Spotify» e «5 tracks not found», como antes.
4. **Misto** (uma busca falha, uma faixa não existe): a exportação completa com 3 de 5; «1 track not found» e «1 track could not be checked», cada faixa na sua lista.

## Suíte e sensores

- Suíte inteira (`npx vitest run`, pela fila): 412 arquivos, 5591 testes passaram, 1 pulado; saída 0.
- `npm run typecheck`: saída 0. `npx eslint . --quiet`: saída 0. `npm run budget:publication`: saída 0 (`raw/publication-budget.txt`).
- **O orçamento de peso mudou.** O script principal cresceu 312 B (198.469 → 198.781, com os dois acertos de texto depois do juiz): os seis textos em inglês (o inglês mora sempre no script principal) e a propriedade `reason` do evento. O que vem depois da primeira tela cresceu 397 B. Os tetos em `scripts/bundle-budget.json` foram medidos de novo pela regra do arquivo (medido + 150 B): `main` 198.931, `background` 64.088.

## Apple Music: o mesmo padrão existe (relatado, não consertado)

`public/js/services/musickit/MusicKitCatalog.js`, `findTrackFromAlbum` (linhas 261-263): toda falha da busca no catálogo (rede, 401, 403, 429, 5xx) é escrita no console e devolvida como `null`, a mesma resposta de «o catálogo não tem». `AppleMusicExportService._catalogIdsOf` põe a faixa em `notFound`, e `_deliver` põe a playlist sem nenhuma faixa em `empty` («none of its tracks was found»). Com todas as buscas falhando, o relatório do Apple Music diz que nenhuma faixa foi encontrada: a mesma mentira da UAT-302. A autorização e a criação da pasta falham com mensagem própria; o defeito é só na busca de faixas. Pede uma issue própria.

## O que esta prova não cobre

- Os textos em português **no navegador**: nada na `main` troca o idioma ainda (a F81 está em outro ramo). Estão provados em jsdom (`test/ui/SpotifyExportWindow.test.js`, `test/i18n/exportWindowTexts.test.js`).
- O evento `playlists_exported` saindo da página: o coletor fica bloqueado na prova. Está provado nos testes de `test/services/usage/`.
- A resposta de verdade do Spotify a uma conta recusada de verdade: o corpo do 403 é o documentado; nenhuma conta real foi usada.
- Um 403 por outro motivo (permissão que falta no login, playlist de outra pessoa) recebe o mesmo texto da recusa.
- Fora da exportação, um 403 do Spotify (carregar álbuns, popularidade) continua sendo um erro comum para quem chama, mas a mensagem passou a ser «Spotify did not allow this account.» em vez do texto cru do Spotify.
- `docs/specs/behavior.md` ainda não descreve a propriedade `reason` do evento: fica para o passo retroativo (TASK-09).
