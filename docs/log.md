# log — o que aconteceu, em ordem

> **Append-only.** Uma entrada por bloco de trabalho, mais recente no topo, com prefixo parseável: `## [AAAA-MM-DD HH:MM] <tipo> — título`. Tipos: `session`, `decision` (o conteúdo mora na página do assunto em `docs/wiki/`, seção `## History`), `ingest`, `inventory`, `harness-feedback`, `review` (uma passada de crítica, com o caminho do relatório). Hora de Brasília, sempre. Ninguém lê este arquivo inteiro — consulta-se por data ou `grep`. Aqui fica só o **quando**; o que é verdade mora na wiki, o estado no `MEMORY.md`.


## [2026-11-19 14:51] session — quarto deploy do site: ícone da aba e título (main `1ca7b39`)

Pedido do MJRP, com «em prod pls». `firebase deploy --only hosting` de uma cópia limpa da `main`; antes: 431 testes passam, o build compila. Conferido por fora: `https://mjrp-playlist-generator.web.app` responde com o título «MJRP The Album Blender - Playlist Generator», o ícone em PNG (7 kB) e o `favicon.ico` com a mesma imagem. Não visto no navegador: a aba em si (o navegador pode guardar o ícone antigo por um tempo). Como voltar: «Rollback» no histórico de versões do Firebase Hosting.

## [2026-11-19 14:51] session — F54: o ícone da aba é o logo do site e o título é «MJRP The Album Blender - Playlist Generator»

Pedido do MJRP: «sabe o logo do site … pode colocar ele como favicon do browser tb … e no texto do browser "MJRP The Album Blender - Playlist Generator"...em prod». `public/favicon.png` (64 px) e `public/apple-touch-icon.png` (180 px) feitos do `public/assets/images/logo.png`; o `public/favicon.ico`, que estava vazio (0 bytes), recebeu a mesma imagem; `public/index.html` e a Home passam a usar o mesmo título, de modo que ele não muda mais de tela para tela (parte da UAT-192; o resto dela, idioma das receitas e série de origem no blend, segue aberto). O build traz o título e os dois ícones.

## [2026-11-19 14:50] review — cruzamento dos relatórios anteriores com a análise e o plano da v5.0; ADR-0019 corrigida

Relatório: `reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`. Feito por um agente separado, só de leitura, a pedido do MJRP («só começamos a v5.0 … fazendo um double check com os reports do inicio dessa sessao»). O implementador conferiu no código seis das afirmações mais graves; as seis conferem. O resto não foi reconferido.

- **Contagem (153 achados):** 33 consertados na v4.0, 10 no plano da v5.0, 20 com issue aberta e fora de qualquer feature, 83 sem issue e sem plano, 3 que não valem mais, 4 que contradizem a análise de hoje.
- **Mais graves que qualquer coisa do plano, todos fora dele:** as regras do Firestore deixam qualquer pessoa ler e gravar o ranking de qualquer usuário (UAT-15, `firestore.rules:32-36`); o servidor de produção tem as rotas de depuração montadas e a chave paga de IA exposta (UAT-16); um token do Discogs em dois scripts versionados (UAT-17); a edição de um lote de playlists apaga os antigos antes de gravar os novos, sem issue (`PlaylistsController.js:350-362`); o inventário da pessoa anterior fica na tela depois de sair da conta, sem issue.
- **O que muda o desenho da v5.0:** a lentidão das playlists guardadas é uma leitura por série, em fila, e não carga de álbum (a F56 tem de separar as duas); a regra «o primeiro resultado vale» existe em cinco lugares, e a F55 cobria um; a loja da Apple vem do idioma do navegador, nunca da conta; uma falha ainda vira «sem dado» na popularidade e nas notas, e a F51 passou a gravar isso na série; um cache de notas no servidor congelaria respostas erradas do raspador (ordem: contrato de erro, raspador certo, cache).
- **Onde a análise de hoje estava errada:** «80 álbuns em 8,5 s» contra «46 de 80 em 4 min 40 s» compara medidas diferentes (achados × achados e com nota); a ADR-0019 dava como feitas as decisões 1 e 7, que o código ainda não cumpre, e recusava a carga no servidor por um motivo falso. A ADR foi corrigida neste commit.
- **Limites do cruzamento:** os apêndices brutos A a M não foram relidos, só as notas verificadas; nenhum teste nem o app foram rodados.

## [2026-11-19 14:45] session — F53: spec, plano e tarefas escritos; UAT-149 em `fixed`

Passo retroativo da via rápida para a suíte de testes verde: quatro requisitos, o plano e as tarefas como foram feitas, com `status: In Progress`. Duas tarefas ficam abertas com `waiting::` (a origem de uma mensagem de erro que não derruba teste; o aceite do MJRP). O verificador de fecho da sessão apontou as tarefas em branco; a sessão **não** está encerrando: o cruzamento dos relatórios antigos com o plano da v5.0 segue rodando, e os arquivos locais de teste (`.claude/launch.json`, `vite.config.local.js`, o protótipo, o `.env`) continuam no worktree de propósito.

## [2026-11-19 14:43] session — terceiro deploy do site: a janela de ranking abre na ordem salva (UAT-187); F53, ADR-0019 e documentação na `main`

- **Autorização do MJRP:** «let's do it», em resposta ao pedido de levar a F53 à `main` e publicar o conserto da janela de ranking.
- **`main`:** o ramo `fix/f53-test-suite-green` entrou por `merge_train.py merge` (`ea393c1`): suíte de testes verde, ADR-0019, `behavior.md`, manual, os dois relatórios e o save.
- **Deploy:** `firebase deploy --only hosting`, de uma cópia limpa da `main` em `ea393c1`, com o `.env`. Antes do envio: 431 testes passam, 0 falham; o build compila. Conferido por fora: o site serve `assets/main-D0HKIHOg.js`.
- **Não conferido:** a janela de ranking em produção no navegador. O servidor não foi tocado.
- **Como voltar:** Firebase Console, Hosting, histórico de versões, «Rollback».
- **A ADR-0019 não está em nenhum remoto** (pergunta do MJRP): nada desta sessão foi enviado por push.
- O `merge_train` desmontou os worktrees das duas sessões laterais (F46 e F48), já integradas.

## [2026-11-19 14:42] session — save: v4.0 em produção e em fecho, regressão completa, v5.0 criada e em espera

> Participantes: MJRP + Claude Code · Branch: fix/f53-test-suite-green
> Session: claude-code:fix-albums-loading-and-cache (sessão de consertos do v0, aberta pela orquestradora do harness)
> Duração: o dia 2026-11-19

### Executive Summary
A v4.0 do Album Blender v0 foi para produção em dois deploys do site (carga de álbuns por um serviço dono, lista inteira de séries, filtros, busca e paginação, cache e nova tentativa, endereço local único, botão do Spotify). Uma regressão completa no navegador achou um fluxo quebrado, três telas lentas e um caso de álbum trocado; virou relatório e onze issues. O MJRP adotou a arquitetura proposta como release v5.0, que só começa depois de documentada e de cruzada com os relatórios do começo da sessão; esse cruzamento estava rodando quando a sessão foi salva.

### Decisions
- A v5.0 só começa com toda a arquitetura documentada e com o cruzamento dos relatórios do começo da sessão feito e o impacto relatado ao MJRP (dele, na última mensagem antes do save).
- A arquitetura proposta (todas as telas pelo serviço de carga, regra única de identidade do álbum, peça única de escolher álbuns, contrato de erros e cache no servidor) é a v5.0, pela via rápida; a v4.0 fecha com o que não depende dela mais o conserto da janela de ranking (MJRP).
- Antes do backlog: consertar os 28 testes, registrar a ADR da carga, atualizar o `behavior.md` e toda a documentação (MJRP). Feito: suíte verde, ADR-0019 `Proposed`, `behavior.md`, 22 arquivos do manual.
- Cenários, resultados, diagnóstico e análise vão para relatório `.md` (MJRP, duas vezes).
- O agente pôde ranquear dois álbuns de teste e criar dados de teste na conta dele para a regressão (MJRP); ficaram «GNX» no inventário e dois rankings.
- Dois deploys do site autorizados por ele («vamos mover pra prod»; «sim, prossiga»). O terceiro, do conserto da janela de ranking, não foi autorizado ainda.
- Mudança de arquitetura feita e avisada: cada fonte aplica a sua resposta sobre o álbum mais novo e só o último pedido de uma fonte escreve (`arch.md`, seção 19).
- Desvio de processo registrado, não contornado: o portão de fim de turno pede o `doctor.py`, vermelho desde antes da sessão; o protótipo da paginação ficou fora do git pela trava do espelho.

### Next Session
1. Ler `side-session-notes/local_a15091e2-6673-441f-a156-65b8e8f594b8/2026-11-19-v0-earlier-reports-vs-v5-plan.md`, conferir o que ele afirma e relatar ao MJRP o impacto na análise e no desenho da v5.0.
2. Escrever as propostas de arquitetura da v5.0 (F55, F56, F57, F52), com crítica separada, antes do código.
3. Fechar a v4.0: F54, documentos da F53, o deploy do conserto da janela de ranking quando o MJRP disser sim.
4. Ver os 24 erros novos do doctor depois do commit do manual.

### Key Data
- Produção: `https://mjrp-playlist-generator.web.app`, publicado da `main` em `40ca80d`. Servidor (Cloud Run `mjrp-proxy`) não tocado.
- Testes: 431 passam, 0 falham (`npx vitest run`, código de saída 0). Antes: 28 falhas.
- Medições: 80 álbuns em 8,5 s; 217 álbuns em 31 s; playlists guardadas 20 s; blend de 2 álbuns já carregados 8 a 18 s.
- Complexidade: `_enrichOne` 21, `CatalogAdapter.find` 12, `api/client.js fetchAlbum` 18, `PlaylistsController.handleSave` 27.
- Issues: UAT-182 a UAT-194 abertas nesta sessão; 51 abertas no total, 40 delas antigas e fora de qualquer feature.
- Doctor: 520 erros (496 antes do commit do manual; 499 no começo da sessão).
- Nada foi enviado por push.

## [2026-11-19 14:41] session — manual revisado contra o código: 22 arquivos de `docs/manual/` corrigidos

Pedido do MJRP: «antes de começar o backlog, atualize toda a documentacao». Um agente separado leu cada arquivo do manual ainda não revisado hoje (servidor, blend, playlists, inventário, integrações, ranking, testes, guia de estilo, folha de referência) e corrigiu o que o código contradiz; o implementador conferiu por amostra (a rota de busca que não existe, o `/debug/files`, os módulos sem uso) antes do commit.

- **Tirado do manual por não existir no código:** a rota `GET /api/search/album`; a espera de 300 ms na busca; a lista de permissão do `/debug/files` (ele lista qualquer caminho, o que agrava a UAT-16); o filtro de palavras do raspador; o limite de chamadas do Spotify no servidor; a evidência vinda de três fontes (só o BestEverAlbums chega); o limite de 80 minutos e a playlist «Overflow»; telas, lojas e métodos que não existem mais.
- **Dito agora como defeito conhecido:** apagar do inventário (UAT-01); o blend e a edição de playlists com laço de carga próprio (UAT-189).
- **Marcados como sem uso:** onze módulos que nada importa (entre eles `ViewModeStrategy`, `PlaylistsDragBoard`, `ContextMenu`, `SkeletonLoader`) e cinco algoritmos não registrados.
- **Não verificado, deixado como estava:** trechos do guia de estilo (classes e tamanhos), detalhes dos algoritmos de mistura, o que cada teste de navegador confere, e os campos de duração da faixa em `32_Data_Schema_Reference.md` (o manual diz milissegundos, o modelo guarda segundos; liga com a UAT-188). As linhas 49 a 81 de `24_Test_Suite.md` estão embaralhadas e não foram reorganizadas.
- **Achados de código, nada mexido:** `server/test/unit-tests.js` importa `public/js/curation.js`, que não existe (é a UAT-21); o `ScoreCalculator` declara uma penalidade de coletânea que nunca aplica.

## [2026-11-19 14:35] session — release v5.0 criada; a v4.0 entra em fecho; features F54 a F58 no board

- **Decisão do MJRP:** «vamos com sua nova arquitetura proposta, mas vamos criar um versao v5.0 pq a v4.0, apesar de ainda com varios defeitos, corrigiu o mais grave e está mais estável em prod. na v4.0, eu fecharia os que nao impactam e dependem da arquitetura mais o fix do ranking que reportei, aí vai todo o restante para a v5.0 via fast lane».
- **`ROADMAP.md`:** `^REL-40`, «v5.0 · Uma arquitetura só para carregar e escolher álbuns»; a `^REL-39` (v4.0) passa a «em fecho».
- **Story S-53** (Prioritized, v5.0), embutida no `prd.md` sob o épico EP-01.
- **v4.0, o que falta para fechar:** F54 (apagar do inventário e acabamento: UAT-01, UAT-188, UAT-190, UAT-192), F53 (suíte de testes verde, já feita no ramo) e o deploy do conserto da janela de ranking (UAT-187).
- **v5.0, via rápida:** F55 (o álbum pedido, ou um aviso: UAT-184), F56 (blend, edição e playlists guardadas pelo serviço de carga: UAT-186, UAT-189, UAT-191), F57 (uma peça só para escolher álbuns: UAT-185, UAT-193), F58 (limite de complexidade no serviço de carga: UAT-194, aberta agora), F52 (servidor, UAT-181) e F49 (carregar mais, UAT-06), as duas últimas movidas da v4.0.
- Todas com spec, plano e tarefas em esboço, `lane: fast`, `solution_type: fix`. A ordem dentro da v5.0 é do MJRP.

## [2026-11-19 14:34] session — ADR-0019 da carga escrita (Proposed) e `behavior.md` em dia com a v4.0

- **ADR:** `docs/decisions/0019-one-owner-for-the-album-load.md`, status `Proposed`. Registra a decisão de um dono só para a carga (o que o MJRP aprovou em conversa em 2026-11-19), as consequências medidas, o que ainda não foi feito e as alternativas recusadas. Escrita depois do código; o texto em si não passou por crítica separada, e o aceite formal está pendente.
- **`behavior.md`:** 12 estados reescritos para o que o código faz depois das features F45 a F51, três estados novos (`^library-album-failed`, `^library-paging`, `^app-local-address`) e ressalvas com o número da issue onde a regressão achou defeito (UAT-184, UAT-185, UAT-186, UAT-188, UAT-27). As linhas que não dizem «v4.0» não foram reconferidas.
- **Decisão do MJRP, 2026-11-19:** «vamos com sua nova arquitetura proposta, mas vamos criar um versao v5.0 … na v4.0, eu fecharia os que nao impactam e dependem da arquitetura mais o fix do ranking que reportei, aí vai todo o restante para a v5.0 via fast lane».

## [2026-11-19 14:33] session — F53: a suíte de testes está verde (431 passam, 0 falham; antes 28 falhas)

`npx vitest run` sai com código 0. Nenhum código do app mudou: os 28 eram testes fora de dia ou ambiente de teste quebrado.

- **Ambiente (3 falhas + as que vinham de arrasto):** as versões novas do Node definem um `localStorage` próprio, vazio, que escondia o do jsdom. O `test/setup.js` passa a entregar o guardado do jsdom (ou um em memória) e a esvaziá-lo antes de cada teste.
- **Loja de séries (19):** o teste descrevia a loja antiga, que criava e lia séries. A loja virou loja pura (ADR 0017). Teste reescrito para a loja que existe; criar e ler séries já é coberto em `test/services/SeriesService.test.js`.
- **Roteador (2):** a tela é criada de forma assíncrona; os testes passaram a esperar.
- **Login (1):** o serviço pega o `auth` só quando precisa; o teste esperava na criação.
- **Barra de filtros (1):** o teste simulava uma barra que não existe mais; agora simula a `FilterToolbar` e confere os artistas tirados das séries.
- **Painel do blend (2):** um teste herdava o contêiner do teste anterior.
- **Duração da playlist (4, que nem rodavam):** a conta saiu da tela e foi para `PlaylistGrid`; o teste foi junto (`test/components/playlists/PlaylistGrid.duration.test.js`).
- **Tela de ranking consolidado (arquivo que não carregava; 2 falhas ao carregar):** importava uma loja que não existe; e `render()` devolve o elemento em vez de escrever na tela.
- **Sincronização de usuário (arquivo que não carregava):** dublê declarado depois do `vi.mock`, que sobe para o topo.
- **Roteiros de navegador (8 arquivos «sem suíte»):** `test/e2e/` saiu da contagem do Vitest; tem executor próprio (`npm run test:e2e`), que não foi rodado.
- **Achado, não consertado:** durante a suíte aparece «Maximum call stack size exceeded» na saída de erro, sem derrubar teste; origem não investigada.

## [2026-11-19 14:31] session — F53 criada: a suíte de testes volta a ficar verde (UAT-149)

Pedido do MJRP: «conserte os 28 testes falhando». Feature na via rápida, `solution_type: fix`, consertando a UAT-149 (falhas de regressão antigas). Spec, plano e tarefas em esboço; o trabalho corre no ramo `fix/f53-test-suite-green`.

## [2026-11-19 14:30] session — análise da arquitetura de carga escrita em relatório, a pedido do MJRP

`reports/audits/2026-11-19-mjrpalbumblender-v0-load-architecture-analysis.md`: o desenho de hoje e o proposto (em diagrama), por que um é pior, os padrões de cada um, o risco de gargalo e a complexidade ciclomática medida com o ESLint. Achado da medição: `_enrichOne` está em 21, acima do limite de 10, depois da mudança da seção 19 do `arch.md`. Quem escreveu é quem desenhou; não houve crítica separada.

## [2026-11-19 14:21] session — relatório da regressão do navegador escrito, a pedido do MJRP

`reports/audits/2026-11-19-mjrpalbumblender-v0-browser-regression.md`: os 20 cenários com o resultado de cada um, o diagnóstico por achado, o que não foi testado, os dados de teste que ficaram na conta e o backlog proposto. Quem rodou foi o próprio implementador, não um juiz separado; o relatório diz isso no cabeçalho.

## [2026-11-19 14:20] session — UAT-193 aberta: o MJRP pede para investigar criar × editar com lógicas separadas (séries e playlists)

Nota dele para o backlog: ver se as lógicas de edição precisam mesmo ser diferentes das de criação, na série e na playlist, e como melhorar a arquitetura e os padrões para facilitar manutenção e evolução. Primeira passada no código: a busca e a classificação já são compartilhadas; a duplicação está na parte de tela (duas listas de discografia). Entra no backlog como investigação com proposta de arquitetura antes de qualquer código.

## [2026-11-19 14:18] session — regressão completa no navegador, a pedido do MJRP; UAT-188 a UAT-192 abertas

Feita em `http://127.0.0.1:5010`, na conta do MJRP, com dados de teste do agente (série «Claude Regression Test», depois «… v2»).

- **Funcionou:** busca por artista na Home e criação da série; carga da série; adicionar ao inventário e editar o item; remover um álbum da série (persistiu); blend com a receita recomendada; renomear o lote, remover uma faixa e salvar; busca das playlists guardadas (texto digitado de uma vez, foco mantido, UAT-179); «Edit Batch» traz o que foi salvo; apagar o lote; editar a série (renomear e acrescentar álbum pela busca); apagar a série.
- **Não funcionou:** apagar do inventário (UAT-01, confirmada: `inventoryStore.deleteAlbum is not a function`). O item de teste «GNX» ficou no inventário do MJRP.
- **Medido:** playlists guardadas, 20 s para aparecer (UAT-186); blend de 2 álbuns já carregados, 8 a 18 s (UAT-189); inventário, 1,2 s.
- **Causa achada:** UAT-184 (álbum trocado): com o artista certo, a conferência de nome aceita qualquer álbum (0,38 contra corte de 0,35), e vários identificadores guardados respondem 404.
- **Novas:** UAT-188 (duração 0:00 na janela de ranking), UAT-189 (blend lento), UAT-190 (tela de edição de playlists), UAT-191 (editar uma série recarrega todas), UAT-192 (título da aba, idioma, série de origem no blend).
- **Não testado:** exportar para o Spotify e para a Apple Music (criaria playlists nas contas dele), «Download JSON», «Refetch», colar em lote na Home, a janela de detalhe do álbum, a migração de visitante. Erros 500 do servidor apareceram no console durante a carga e não foram investigados.
- **Dados de teste que ficaram:** «GNX» no inventário; os rankings de «Brothers In Arms» e «Rapture of the Deep».

## [2026-11-19 14:14] session — UAT-187 consertada: a janela de ranking abre na ordem salva

`UserRankModal` passou a montar a lista pelo ranking que o álbum já traz (faixas sem posição depois, na ordem do disco); «Reset» volta para a ordem do disco. Um teste novo, visto falhar antes. No navegador: a janela de «Brothers In Arms» abre com a faixa-título em 1º. Achado ao lado, não consertado: a janela mostra «0:00» em toda faixa (a duração é guardada em segundos e a janela lê como milissegundos); vai para a lista da regressão.

## [2026-11-19 14:13] session — UAT-187 aberta: a janela de ranking reabre na ordem do disco, não na ordem salva

Relato do MJRP durante a regressão («epitaph como numero 2 … carregou em 3»). Causa lida no código: a janela ordena pela posição no disco e ignora o ranking que o álbum traz. Conserto como ponta da F46, no ramo `fix/f46-rank-modal-saved-order`.

## [2026-11-19 14:08] session — UAT-184, UAT-185 e UAT-186 abertas; o MJRP pediu uma regressão completa do site

- **Relatos do MJRP:** um álbum que ele nunca adicionou aparece numa série (UAT-184: pedido «Stone Temple Pilots - Core», carregado «Shangri-La Dee Da»); álbuns de estúdio do Kendrick Lamar caem na aba «?» da busca da Home (UAT-185); playlists e inventário lentos (UAT-186).
- **Pedido dele:** uma regressão completa no navegador, com dados criados pelo agente (uma série de álbuns «do Claude», blend, edição de playlists, inventário, os CRUDs), registrando as issues achadas; no fim, cruzar com o já reportado e montar um backlog de features para ele priorizar.

## [2026-11-19 14:04] session — segundo deploy do site em produção: F46, F48 e F50 (main `40ca80d`)

- **Autorização do MJRP:** «sim, prossiga», à proposta de juntar na `main` e fazer o segundo deploy.
- **Deploy:** `firebase deploy --only hosting`, de uma cópia limpa da `main` em `40ca80d`, com o `.env`. Antes do envio: 389 testes passam, as mesmas 28 falhas da linha de base; o build compila.
- **Conferido por fora:** `https://mjrp-playlist-generator.web.app` serve `assets/main-J6imsDjR.js` e o arquivo do botão do Spotify com o diálogo novo.
- **Não conferido:** o uso em produção no navegador depois deste deploy. O servidor (Cloud Run) não foi tocado.
- **Como voltar:** Firebase Console, Hosting, histórico de versões, «Rollback» para a versão anterior (a de hoje, `80e6028`).
- **Em produção o Spotify** precisa ser conectado de novo pelo MJRP: a conexão é guardada por endereço.

## [2026-11-19 14:03] session — F46, F48 e F50 na `main`; UAT-173 a UAT-177, UAT-180 e UAT-183 em `fixed`

O ramo `fix/f50-one-local-address` (com `fix/f46-albums-load-state` e `fix/f48-album-cache-and-retry` dentro) entrou na `main` pelo `merge_train.py merge`. O conflito do `docs/specs/uat.md` foi resolvido pelo `uat-merge`. Cada issue em `fixed` diz o que foi visto no navegador e o que não foi; o aceite é do MJRP. A UAT-181 (segunda fonte, 402) segue aberta: o sintoma sumiu com o acerto da cobrança, mas o código do servidor da F52 não foi feito.

## [2026-11-19 14:03] session — F46: o ranking salvo aparece na hora, sem esperar a nota; cada fonte aplica a resposta sobre o álbum mais novo

- **Autorização do MJRP:** «pode testar um ranking, escolha 2 albums de colecoes diferentes, me diga qual … depois eu arrumo com meu ranking». Álbuns usados: «Brothers In Arms» (Dire Straits) e «Rapture of the Deep» (Deep Purple). Os rankings de teste ficaram gravados na conta dele.
- **Defeito achado no teste:** o ranking salvo não refletia na série cuja nota ainda estava na fila; o pedido de reler esperava atrás dela.
- **Mudança de arquitetura (o MJRP pediu para ser avisado):** a porta das fontes ganhou `apply`; o serviço aplica a resposta sobre o álbum mais novo e só o último pedido de uma fonte escreve. `docs/specs/arch.md`, seção 19.
- **Testes:** 3 novos e 1 reescrito; a suíte tem 388 passando e as mesmas 28 falhas da linha de base. `vite build` compila.
- **No navegador:** `reports/evidence/F46-albums-load-state/F46-ranking-2026-11-19.json`.

## [2026-11-19 13:57] session — F46 e F48 conferidas no navegador (parte); o MJRP entrou no painel embutido

- **F48:** «Clear Cache» zera só o cache de álbuns (IndexedDB `mjrp-cache`) e a carga recomeça; login, Spotify e escolhas de tela ficam. `reports/evidence/F48-album-cache-and-retry/F48-browser-2026-11-19.json`.
- **F46:** o filtro «My Ranking» responde sobre as 46 séries (9 séries), não só sobre a página. `reports/evidence/F46-albums-load-state/F46-browser-2026-11-19.json`.
- **Carga:** 171 álbuns na página de 40 séries, nenhum aviso de falha (a segunda fonte voltou depois do acerto da cobrança).
- **Não conferido:** salvar um ranking pelo modal (grava nos dados do MJRP), a nova tentativa ao servidor, a validade do cache de ranking, a busca das playlists guardadas.

## [2026-11-19 13:53] session — F50 provada no navegador; spec, plano e tarefas escritos; UAT-178, UAT-182 e UAT-183 em `fixed`

- **No navegador:** `http://localhost:5010/albums` cai em `http://127.0.0.1:5010/albums`; o «x» do Spotify abre o diálogo do app e desconecta. O MJRP: «connect e disconnect do spotify ok agora no 5010». Evidência: `reports/evidence/F50-one-local-address/F50-probe-2026-11-19.json`.
- **Documentos:** spec, plano e tarefas da F50 preenchidos (passo retroativo), `status: In Progress`; as três issues em `fixed`, à espera do aceite do MJRP.
- **Aberto:** o login pela Apple em `127.0.0.1:5010` (403; em produção funciona). A F46 e a F48 seguem sem prova no navegador: o painel embutido está sem login da conta e a extensão do Chrome não respondeu.

## [2026-11-19 13:50] session — produção vista pelo MJRP depois do deploy; login pela Apple funciona em produção

- O MJRP abriu a tela de álbuns em produção depois do deploy: «top!, acabei de ver em prod, muito mais rapido». É a visão dele do deploy, não o OK das issues (UAT-172, UAT-24, UAT-179 seguem `fixed`, à espera do aceite).
- «Sign in with Apple» funciona em produção (captura do MJRP: consentimento da Apple e «Successfully signed in!»). O 403 só apareceu em `http://127.0.0.1:5010`, no painel embutido e no Chrome. Causa não provada; falta repetir o teste local com a sessão da Apple já aberta.

## [2026-11-19 13:46] session — site publicado em produção (F45, F47, F51) e UAT-183 aberta

- **Deploy:** a pedido do MJRP («vamos mover pra prod»), o site foi publicado no Firebase Hosting a partir da `main` no commit `80e6028` (`firebase deploy --only hosting`, com o `.env` que traz `VITE_SPOTIFY_CLIENT_ID`). Conferido por fora: `https://mjrp-playlist-generator.web.app` serve o pacote novo (`assets/main-CO4b4agM.js`, com o código da carga nova). Antes do envio: 232 testes passam na `main`, as mesmas 28 falhas da linha de base; o build compila.
- **Não conferido:** o uso em produção no navegador (login, tela de álbuns, filtros, paginação) ainda não foi visto depois do deploy. O servidor (Cloud Run) não foi tocado.
- **Como voltar:** Firebase Console, Hosting, histórico de versões, «Rollback» para a versão de 2026-01-19.
- **Desvio declarado:** o `scripts/deploy-prod.sh` exige chave de conta de serviço, que não existe nesta máquina; os mesmos passos dele foram feitos à mão com o login do Firebase CLI do MJRP, numa cópia limpa da `main`.
- **UAT-183:** relato do MJRP, o «x» do botão «Connected» do Spotify não faz nada. Conserto no ramo `fix/f50-one-local-address`.

## [2026-11-19 13:46] session — F50: o «x» do Spotify pergunta pelo diálogo do app (UAT-183)

`SpotifyConnectButton` trocou o `confirm()` nativo pelo `dialogService.confirm`, o mesmo diálogo das outras confirmações do app. Um teste novo cobre o clique no «x», a pergunta no diálogo do app e a desconexão com o sim. A causa (o navegador silenciando o `confirm()`) é provável, não provada; a prova é o MJRP clicar no «x» depois do conserto.

## [2026-11-19 13:43] session — F50: um endereço local só (`http://127.0.0.1:5010`) e o botão do Spotify que reflete a conexão (UAT-182)

- **UAT-182, causa e conserto:** a conexão avisava por `spotify-auth-success` e o botão só escutava `spotify-auth-change`, disparado só ao desconectar. Agora `SpotifyAuthService.setSession` dispara `spotify-auth-change` (conectar, renovar o token e desconectar usam o mesmo sinal) e o botão busca o nome da conta quando a sessão chega. `spotify-auth-success` fica só como gatilho do enriquecimento.
- **Um endereço:** `public/js/utils/localAddress.js` (função pura `canonicalLocalUrl`); o `app.js` manda `localhost` para `127.0.0.1`. `vite.config.js` na porta 5010 com `strictPort`.
- **Documentação:** `PORT_INFO.txt` reescrito, `README.md`, `.env.example` (com `VITE_SPOTIFY_CLIENT_ID`), manual `00_Deployment_and_Setup.md`, scripts de teste e `restart_dev.sh` na porta nova.
- **Testes:** 10 novos (`test/utils/localAddress.test.js`, `test/services/spotify/SpotifyAuthSignal.test.js`), vistos falhar antes do conserto. Suíte: 386 passam, as mesmas 28 falhas da linha de base. `vite build` compila.
- **Não conferido:** a prova no navegador (conectar o Spotify e ver o botão mudar; abrir `localhost:5010` e cair em `127.0.0.1`) ficou para o MJRP, porque o painel embutido estava com uma janela de login aberta. Spec, plano e tarefas da F50 ainda em esboço.
- **Login pela Apple:** 403 também no Chrome do MJRP. O retorno do login vai para `mjrp-playlist-generator.firebaseapp.com/__/auth/handler`, então o endereço local não é a causa. Em investigação.

## [2026-11-19 13:41] session — UAT-182 aberta: o botão do Spotify continua «Connect» depois de conectar

Relato do MJRP ao conectar o Spotify em `http://127.0.0.1:5010`. Causa lida no código: a conexão avisa por `spotify-auth-success`, o botão só escuta `spotify-auth-change`, disparado só ao desconectar. Conserto na F50 (ramo `fix/f50-one-local-address`).

## [2026-11-19 13:27] session — documentação da F46 e das pontas da F51: spec, plano e tarefas, `arch.md` seção 18, manual e título da F45

- Commit de documentação à parte do de código (`510a840`), no ramo `fix/f46-albums-load-state`. F46: `spec.md`, `plan.md` e `tasks.md` preenchidos, com o que a F45 e a F51 já tinham entregue dela; `status: In Progress` (faltam o navegador, o merge e o julgamento do MJRP). F51: TASK-09 e TASK-12 fechadas, TASK-15 a 17 acrescentadas, REQ-10 entregue e REQ-11 novo. F45: o título deixa de prometer «só as séries à vista». `arch.md`: seção 18 e três linhas da seção 17 corrigidas. Manual: 06, 08, 09, 12, 16, 17, mapa de arquivos e `regression_checklist`.
- Recusa de trava, por processo e não por defeito, registrada e não contornada: o primeiro commit de documentação foi recusado pelo `commit-msg` porque o `docs/log.md` não ia no commit (a entrada das 13:24 já tinha entrado no commit de código). Esta entrada é a do commit de documentação.
- O `doctor.py` segue vermelho no projeto por causas antigas (links partidos em arquivos de `docs/archive/` e do manual antigo, o sensor de lint e as 28 falhas da linha de base dos testes); o único erro que esta sessão criou, o `## Now` atrasado, foi corrigido.
- Session: claude-code:f46-albums-load-state (aberta pela sessão de consertos do v0)

## [2026-11-19 13:24] session — F46 fechada no código e pontas da F51: ranking salvo reflete na tela, «My Ranking» sobre todas as séries, aviso de álbuns não conferidos, «&amp;» lido limpo, busca das playlists guardadas

- Ramo `fix/f46-albums-load-state`, cortado da `main` local (`23d81d7`). O worktree veio num commit antigo (`c9cf80f`); o ramo foi renomeado e levado à ponta da `main` antes de qualquer mudança.
- **O que da F46 já estava pronto**, conferido no código: o estado por série e a grade desenhada por ele, o aviso «N albums did not load · Try again» e `retryFailed` (F45); a página desenhada inteira e as inscrições desfeitas no começo de cada visita (F51). O observador de visibilidade por série não foi construído e deixou de ser necessário com a paginação.
- **Ranking salvo pelo modal (F46).** `AlbumLoadService.refreshSource(albumId, source)` refaz uma fonte de um álbum; o trabalho de cada álbum passou a ser encadeado, para a fonte lenta em curso não apagar o ranking recém-lido. O modal salva por `onSubmit` e não importa mais o repositório; quem salva é `SeriesController.saveRanking`, por `OwnRankingService`. A tela deixou de mutar o álbum publicado.
- **«My Ranking» sobre todas as séries (F46).** `OwnRankingService` lê a lista de álbuns ranqueados uma vez por pessoa e a guarda em `stores/ownRankings.js`; `models/ownRanking.js` casa ranking e pedido por nome (caixa, acento, pontuação, «&», entidade HTML e nota de edição não contam) e pelo id quando o ranking não tem os nomes; o álbum carregado com ranking casa de forma exata. Limite conhecido: o álbum a que o catálogo deu outro título só casa depois de carregar. Saída exata, não feita porque muda dado gravado: guardar o id do álbum achado em `facts`.
- **O controlador larga a tela que fechou (F46).** `SeriesController` continuava inscrito nas stores entre uma visita e outra e redesenhava a grade de uma tela fechada enquanto a carga seguia. `SeriesView.destroy` chama `detachView`.
- **Aviso de álbuns não conferidos (F51).** Com o filtro por fonte ativo, o paginador diz quantos álbuns ainda não têm `facts`.
- **UAT-180 (F51).** A origem do «&amp;» não foi achada: nenhum caminho do código de hoje escapa texto antes de gravar, e as versões antigas lidas no histórico (a Home de texto, os modais, a edição de série) também não. Consertado pelo que se controla: `models/text.js` desfaz as entidades, `parseAlbumQuery` e `queryKey` passam por ela (o pedido com «&amp;» e o limpo têm a mesma chave; a chave de quem nunca teve entidade não muda), o catálogo é consultado com o texto limpo, e a Home e a edição de série gravam o pedido por uma função só (`toAlbumQuery`). O banco não foi reescrito. Achado junto: três lugares escapavam texto e depois o desenhavam como nó de texto (o título da série no cabeçalho, o modal de ranking), o que mostrava «&amp;» para um «&» gravado certo.
- **UAT-179.** Na tela de playlists guardadas o conserto da barra de filtros não bastava: `SavedPlaylistsView.update` refazia a página inteira a cada letra. A página passa a ser desenhada uma vez. Na Home, por leitura, o campo é desenhado uma vez e só escuta o Enter: não foi achado redesenho a cada tecla; o que havia era o controlador da tela de álbuns desenhando em segundo plano durante a carga, consertado acima. Falta repetir no navegador.
- Testes: 105 novos (serviço de carga 5, casamento de ranking 22, serviço de ranking 10, texto e pedido 12, paginador 19, barra de filtros 9, controlador 15, modal 3, playlists guardadas 3, aptidão 7). Suíte inteira: 337 passam, as mesmas 28 falhas da linha de base; `npx vite build` compila. Um arquivo antigo de `test/e2e/` (`ghost-albums-render`) chama `process.exit` quando não acha navegador e às vezes aparece como «1 error» na suíte; não é desta mudança.
- Ambiente, registrado e não contornado no repositório: `npm install` falhou no worktree ao baixar o Chrome do Puppeteer (pasta de cache partida em `~/.cache/puppeteer`); instalado com `PUPPETEER_SKIP_DOWNLOAD=1`, como a própria mensagem indica. O `package-lock.json` que a instalação alterou foi restaurado.
- Pedidos a quem é dono dos arquivos (F48, outra sessão): `SeriesService.loadFromFirestore` desfazer as entidades do nome da série, para todas as telas; `api/client.js` `generateAlbumId` usar `stableAlbumId` de `models/ownRanking.js` (a regra está escrita duas vezes); `UserRankingRepository.getAllRankings` devolve lista vazia quando a leitura falha, e o filtro não tem como avisar.
- Documentação: `spec.md`, `plan.md` e `tasks.md` da F46 preenchidos; tasks 09 e 12 da F51 fechadas e 15 a 17 acrescentadas; título da F45 corrigido («as séries do topo primeiro»); `arch.md` seção 18; manual 06, 08, 09, 12, 16, 17, mapa de arquivos e `regression_checklist`.
- Falta: a conferência no navegador (sessão de integração), o merge e o julgamento do MJRP. `uat.md` e o `## Now` do `MEMORY.md` ficam para a integração.
- Session: claude-code:f46-albums-load-state (aberta pela sessão de consertos do v0)

## [2026-11-19 13:19] session — F48, commit da documentação

- Commit à parte da documentação descrita na entrada da F48 abaixo: spec, plano e tarefas; `docs/manual/`; `data-model.md`; `arch.md`. Recusa de trava registrada: o gancho `commit-msg` recusou os commits seguintes ao primeiro por faltar entrada de log em cada um; não foi contornado, cada commit ganhou a sua entrada. O `doctor.py` está vermelho (497 erros) por links quebrados antigos em `docs/archive/`, `docs/technical/` e pastas `legacy/` das features, nenhum em arquivo desta entrega; não foi mexido.
- Session: claude-code:f48-album-cache-and-retry (sessão lateral, aberta pela sessão de integração dos consertos do v0)

## [2026-11-19 13:19] session — F48, commit da prateleira sem Firestore (UAT-14, parte)

- Commit à parte do conserto descrito na entrada da F48 abaixo: `SharedAlbumRepository.js`, `SeriesService` gravando por ele, `stores/albums.js` sem Firestore, os dois arquivos mortos removidos, o comentário das regras do Firestore corrigido (só o comentário), e os testes.
- Session: claude-code:f48-album-cache-and-retry (sessão lateral, aberta pela sessão de integração dos consertos do v0)

## [2026-11-19 13:19] session — F48, commit do «Clear Cache» (UAT-177)

- Commit à parte do conserto descrito na entrada da F48 abaixo: `clearAlbumCaches.js`, a ligação em `albumLoading.js` e `app.js`, o rodapé, `CacheManager.clear()` que falha quando o IndexedDB não limpa, e os três arquivos de teste.
- Session: claude-code:f48-album-cache-and-retry (sessão lateral, aberta pela sessão de integração dos consertos do v0)

## [2026-11-19 13:19] session — F48, commit do cache do ranking pessoal (UAT-176)

- Commit à parte do conserto descrito na entrada da F48 logo abaixo: `UserRankingRepository` com a instância do cache, validade de 1 hora e o teste `test/repositories/UserRankingRepository.test.js`.
- Session: claude-code:f48-album-cache-and-retry (sessão lateral, aberta pela sessão de integração dos consertos do v0)

## [2026-11-19 13:17] session — F48: nova tentativa que roda, cache do ranking que age, «Clear Cache» que limpa e a prateleira sem Firestore

- Ramo `fix/f48-album-cache-and-retry`, cortado da `main` local (`23d81d7`), num worktree à parte. Cada conserto teve o teste escrito antes e visto falhar no código antigo (a UAT-175 falhou com o próprio `ReferenceError: queryStr is not defined`).
- UAT-175: `public/js/utils/retry.js` (nova tentativa com recuo exponencial, variação e teto, padrão `DP-23`) e `public/js/api/client.js` (`ApiError` com o status; prazo de 90 s por chamada; `POST /api/generate` só é pedido de novo em falha de rede ou 5xx, nunca em 4xx nem em prazo estourado, porque a rota usa IA paga). `CatalogAdapter` passa a registrar no console o motivo da falha da segunda fonte.
- UAT-176: `UserRankingRepository` usa a instância `cacheManager` (guardava a classe), com validade de 1 hora, guarda também «este álbum não tem ranking» e esquece a entrada ao salvar e ao apagar. A outra metade da issue (regravar cada álbum a cada carga) já tinha saído com a F45.
- UAT-177: `services/albums/clearAlbumCaches.js` (para a carga, limpa o `cacheManager`, remove as chaves `album_cache_v…`), ligada em `albumLoading.js` e entregue ao rodapé por `app.js`. O botão não faz mais `localStorage.clear()`. `CacheManager.clear()` passa a falhar quando o IndexedDB não limpa, e o rodapé diz que não limpou.
- UAT-14 (parte): `repositories/SharedAlbumRepository.js` grava o álbum do «Refetch Metadata» na coleção `albums` sem o ranking pessoal; `stores/albums.js` ficou sem `import` do Firestore (saíram `saveToFirestore`, `loadFromFirestore`, `updateAlbum`); a lista de exceções da função de aptidão caiu de três para dois arquivos. Removidos `views/controllers/AlbumsStateController.js` (morto) e `public/legacy/AlbumsView_DEPRECATED.js` (o único que o importava, sem quem o importe).
- Testes: 39 novos ou refeitos em 8 arquivos; suíte inteira 271 passam, as mesmas 28 falhas da linha de base; `npx vite build` compila. Nada conferido no navegador: é da sessão de integração.
- Documentação: spec, plano e tarefas da F48 preenchidos (`status: In Progress`, `sdd_shape_check` verde); `docs/manual/` (00, 06, 07, 07b, 08, 11, 19, 98, `regression_checklist`); `docs/specs/data-model.md` (o que se grava em `albums`); `docs/specs/arch.md` (seção 17).
- Não feito: o «Refetch Metadata» pela fila da carga (TASK-12 da F48, aberta). Perguntas para o MJRP na spec: se o «Clear Cache» devia apagar também o resto do `localStorage`, e se o prazo de 90 s sem nova tentativa serve.
- Ambiente: `npm install` falhou ao baixar o navegador do Puppeteer; instalado com `PUPPETEER_SKIP_DOWNLOAD=1`. O `package-lock.json` que o `npm` reescreveu foi devolvido ao texto commitado com `_safe.py restore`.
- Session: claude-code:f48-album-cache-and-retry (sessão lateral, aberta pela sessão de integração dos consertos do v0)

## [2026-11-19 13:01] decision — F52 aberta: a busca de álbum por IA do servidor responde 402 em produção (UAT-181)

- O MJRP, sobre o achado do 402 em `POST /api/generate`: «abra uma feature pra arrumarmos isso via google cloud e firebase cli e eu posso entrar no console tb». Issue UAT-181 na Rodada 2 e feature F52 (`lane: fast`, `solution_type: fix`), na v4.0. O diagnóstico começa pelos registros do Cloud Run, só leitura; mudança de chave, de cota ou de cobrança é dele.
- Ele também perguntou «vamos mover para prod o que já foi corrigido?». Conferido: o site publica por `scripts/deploy-prod.sh` (Firebase Hosting; o `firebase` da máquina está logado na conta dele); a `main` compila; a versão no ar é de 2026-01-19. Risco apontado a ele: a chave do app no Spotify (`VITE_SPOTIFY_CLIENT_ID`) vem de um `.env` que não existe nesta máquina, e um build feito aqui sairia sem ela (o bundle no ar a tem). Publicação à espera da resposta dele sobre a chave.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 12:43] session — F45, F47 e F51 integradas na main local; UAT-172, UAT-24 e UAT-179 em «fixed», à espera do OK do MJRP

- Trem de merge do harness (`merge_train.py`): preflight limpo depois de commitar o rastro do doctor (`daily-checks/`, como a ferramenta pede); três merges, na ordem das features: `f295316` (F45), `d893d75` (F47), `5268f45` (F51). A trava visual não se aplica ao v0 (não há `info-arch.md` com referência visual aprovada). Nada foi enviado ao remoto: o push é do MJRP, e é ele que publica em produção.
- `docs/specs/uat.md`: UAT-172, UAT-24 e UAT-179 passam a `fixed`, cada uma com o commit, o teste e a medição no navegador. As duas do MJRP (172 e 179) só fecham com o OK dele; a UAT-24 foi aberta por agente com prioridade humana e também espera por ele.
- `MEMORY.md` `## Now` em dia.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 12:42] session — spec, plan e tasks das F45, F47 e F51 preenchidos; funções de aptidão em npm test; o arch.md diz o que foi construído

- Passo retroativo das três features, por um agente à parte a partir do log, do código e da evidência: F45 com 10 REQ e 16 tasks fechadas, F47 com 3 e 3, F51 com 10 REQ (o REQ-10, a UAT-180, marcado «não entregue») e 10 tasks fechadas. `sdd_shape_check`, `evidence_folder_check` e `requirements_graph_check` verdes. As três ficam `In Progress`: faltam o julgamento do MJRP, o merge e os pontos abertos listados em cada `tasks.md`.
- Contradições que o agente achou e ficaram escritas nas specs: o título da F45 promete «só as séries à vista» e isso não foi construído (a F51 busca por página); as contagens de teste do log não batiam (corrigidas pelas contagens por arquivo); `behavior.md` ainda descreve a carga e os filtros antigos.
- `test/architecture/albumLoadBoundaries.test.js`: 9 testes que leem os `import` e reprovam quando uma fronteira do desenho é cruzada (a proposta os prometia e só um existia). A lista de exceções do Firestore fora dos repositórios (issue UAT-14) tem três arquivos e só pode encolher.
- `docs/specs/arch.md`, seção 17: tabela «proposto × construído» com o porquê de cada diferença (limites medidos, carga pela edição escolhida, ordem das fatias, o que não foi construído).
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 12:34] session — manual e modelo de dados em dia com a carga nova, os filtros e a paginação

- Pedido do MJRP: revisar o manual a cada conserto, «corrigindo e atualizando e limpando o que não faz mais sentido». Atualizados em `docs/manual/`: 08 (o controlador sem o laço, a sequência nova da carga, a store de carga, o guardado por pedido, o que `AlbumIdentity` faz de fato), 06 (as duas stores e a projeção), 07 (o que o repositório lê do cache de verdade; `saveAlbumFacts`; a lista inteira de séries), 07b (`TaskQueue`), 09 (a grade pelo estado, o paginador, os filtros que leem a série, o campo de busca), 11 (o que o «Clear Cache» faz e não faz), 12 (`Pager`), 17 (`AlbumLoadService`, `SeriesFactsService`), 19 (o cliente de API é `public/js/api/client.js`; o `api.js` descrito nunca existiu), 32 (o documento da série como o código grava, com `facts`), o índice (nome certo do 06; não há Pinia nem MobX), 01 (idem), o mapa de arquivos (nove nomes de documento corrigidos, quatro arquivos de código que não existem marcados, a seção da v4.0) e o `regression_checklist` (os casos novos da tela de álbuns).
- `docs/specs/data-model.md`: `albumQueries` com `appleMusicId` e `facts`; a lista de séries sem o corte em 20.
- Recusa de processo, registrada e não contornada: o commit do protótipo `design/inception/albums-paging-v1.html` (o que o MJRP viu ao escolher as duas formas de paginação) foi recusado pela trava do espelho do protótipo, que pede o `docs/specs/info-arch.md` e os wireframes da versão em `design/wireframes/`; o v0 não tem nenhum dos dois (notas de conformidade abertas `info-arch` e `wireframes`). O arquivo fica na pasta `design/inception/` da cópia principal, fora do git, até a orquestradora levar ao MJRP.
- Ainda não revisto no manual: os documentos do servidor (02 a 05), mistura e playlists (15, 18, 21), integrações (20, 22), testes (24, que chama de «saudável» uma suíte com 28 falhas) e a dívida técnica (29). Entram quando os consertos dessas áreas forem feitos.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 12:06] session — F51: filtros que leem a série, busca que deixa digitar, paginação nas duas formas e os fatos gravados na série

- Ramo `fix/f51-album-filters-search-and-paging`, empilhado sobre o da F47. Peças novas: `models/seriesFilter.js` (os filtros como função pura sobre os pedidos das séries: série, artista, ano, fonte, busca), `models/paging.js` (páginas numeradas e lista que cresce, por série, de 10 a 100), `models/albumFacts.js` e `services/series/SeriesFactsService.js` (o ano e as fontes de cada álbum gravados no pedido, só a diferença, quando a série termina de carregar; `SeriesRepository.saveAlbumFacts` não mexe em `updatedAt`), `components/ui/Pager.js`. `SeriesController` ganhou a visão da página (`getPageView`) e pede ao serviço de carga só as séries da página; a lista de artistas sai das séries; `FilterToolbar` desenha o campo de busca uma vez e atualiza o resto só quando muda (UAT-179, pela causa); a grade desenha inteira a página, sem o truque das três primeiras séries.
- Conferido no navegador com a conta do MJRP: 10 de 45 séries na primeira página, 5 páginas; digitar «robert plant» de uma vez mantém o foco e traz as quatro séries de outras páginas; página 2 sem bloco cinza; a rolagem cresce de 10 em 10; 67 de 217 pedidos ganharam o bloco `facts` depois de três páginas. Evidência: `reports/evidence/F51-album-filters-search-and-paging/`.
- Testes: 56 novos (filtro 14, paginação 7, fatos e serviço 7, e os anteriores); suíte inteira 223 passam, as mesmas 28 falhas da linha de base.
- Achado para o MJRP: `POST /api/generate` em produção responde 402 (Payment Required). A segunda fonte de álbuns, que usa IA paga, está fora do ar; os álbuns que a Apple Music não tem ficam com o aviso de falha.
- Limites conhecidos: o filtro «My Ranking» só enxerga os álbuns carregados (o ranking mora com o usuário, não na série); o filtro por fonte de uma série fica completo depois da primeira carga dela; a Home ainda não foi conferida para a UAT-179; a UAT-180 (`&amp;`) segue aberta.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 12:01] decision — paginação da tela de álbuns: as duas formas, por série, de 10 a 100 por página; notas a 4 buscas por vez

- O MJRP viu o protótipo (`design/inception/albums-paging-v1.html`) e decidiu: «ok, o ideal seria poder escolher multiplos de 10 por pagina, 10, 20, 30, 40, 50, ...100» e «opção A e b, séries por página, go for it». Ficam as duas formas (páginas numeradas e rolagem que carrega mais), a unidade é a série, e o tamanho da página vai de 10 a 100, de 10 em 10.
- Notas: o teto da fonte lenta sobe de 2 para 4 buscas simultâneas (`LOAD_LIMITS.slowConcurrency`). Medido com 45 séries: 31 notas em 60 s, contra cerca de 20 com 2; o servidor passa de 5 s para 7 s por busca quando recebe mais de uma. O gargalo é o raspador, sem cache: fica para a fatia do servidor.
- Ramo novo `fix/f51-album-filters-search-and-paging`, empilhado sobre o da F47.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:57] decision — filtros, busca e paginação da tela de álbuns: os fatos que os filtros leem passam a morar no pedido da série (F51)

- O MJRP perguntou «como ficaria a questao de filtros se a gente utilizasse paginacao nas telas?». Três caminhos apresentados (filtrar só o carregado; carregar tudo ao filtrar por ano ou fonte; guardar ano e fonte junto do pedido). Escolha dele: «vamos fazer a opcao C». E: «a opcao C imagino que tb necessite a revisao de arquitetura para nao virar patch...vamos melhorando a arquitetura do site, refatorando conforme necessario». Sobre séries antigas: «go for it, preenche sozinho na primeira carga». Sobre haver paginação: «vamos er paginacao entao certo?» — sim, por série; a forma (páginas numeradas ou rolagem que carrega mais) ele escolhe sobre um protótipo.
- Desenho na seção 16 da proposta no `docs/specs/arch.md`: o bloco `facts` em cada item de `albumQueries` (ano, fontes, data da conferência), gravado só pelo `SeriesRepository`; um `SeriesFactsService` grava a diferença em lote quando a série termina de carregar; o filtro vira função pura sobre os pedidos; a tela pagina o resultado do filtro; a barra de filtros atualiza em vez de se refazer.
- Regra de trabalho adotada: cada área tocada por um conserto sai com o dono certo, com teste e com checagem automática; refatoração maior é avisada antes; o que muda dado gravado ou tela vai ao MJRP primeiro.
- Issues novas na Rodada 2: UAT-179 (campo de busca perde o foco a cada tecla; relatado pelo MJRP) e UAT-180 (pedido gravado com `&amp;` não é achado no catálogo). Feature F51 registrada.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:54] session — F47: a lista de séries sem o corte em 20; o MJRP tinha 45 séries e via 20

- O MJRP, olhando a tela: «engraçaod eu nao tenho albuns do robert plant?». Conferido no banco dele, pelo próprio app: 45 séries na conta, 20 na tela, 25 escondidas pelo `limit: 20` de `SeriesService.loadFromFirestore`; quatro delas com Robert Plant. Nada foi perdido, era só leitura. Ele mandou: «go for it, faz a F47 agora».
- Ramo `fix/f47-series-list-without-cut`, empilhado sobre o da F45 (sem a carga nova, 217 álbuns levariam uns 20 minutos). Conserto: `findAll` sem `limit` e sem `orderBy` (o Firestore deixa de fora o documento que não tem o campo ordenado); a ordem por data de atualização é aplicada no cliente, com a série sem data por último. Três testes em `test/services/SeriesService.test.js`, dois falhavam antes.
- A carga de 217 álbuns mostrou três coisas, corrigidas no desenho da F45: (1) as fontes rápidas (ranking pessoal, popularidade guardada) disputavam as vagas da busca no catálogo: ganharam fila própria (`sourceConcurrency: 6`); (2) 196 dos 217 pedidos trazem o `appleMusicId` da edição escolhida, que a carga antiga ignorava: o adaptador agora carrega por ele, numa chamada só, e é a edição que o MJRP escolheu; (3) 32 desses identificadores respondem 404 (edição de outra loja ou retirada): cai na busca por nome na hora, sem esperar.
- Medido, guardado apagado: 45 séries na tela; 57 álbuns aos 5 s, 118 aos 10 s, 207 aos 30 s; tudo resolvido aos 31 s, 213 achados e 4 com aviso de falha. As quatro séries de Robert Plant aparecem. Evidência: `reports/evidence/F47-series-list-without-cut/`.
- Achados a registrar: um pedido gravado com `&amp;` no lugar de `&` («Jimmy Page &amp; Robert Plant - No Quarter») não é achado; o MJRP relatou que o campo de busca não deixa digitar de uma vez («o campo de bucas tem problemas ... acho que ocorre o mesmo na home»); e escolheu a opção C para os filtros com paginação («vamos fazer a opcao C»): guardar ano e fonte junto do pedido, na série.
- `window.albumLoadStore` e `window.albumLoadService` expostos em `app.js`, como as outras stores, para inspeção e teste.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:41] session — F45 ligada ao app e medida no navegador: os 80 álbuns em 8,5 s (antes, 1 álbum aos 8,5 s e 46 de 80 aos 4 min 40 s)

- Ligação: adaptadores em `public/js/services/albums/adapters/` (catálogo sobre a Apple Music com o servidor como segunda fonte; notas, popularidade e ranking pessoal, cada um devolvendo um álbum novo; guardado por pedido, base + estado por fonte, «vazio» confiável por 1 hora, ranking pessoal nunca guardado), a composição em `services/albums/albumLoading.js` (que também projeta a store de carga na prateleira `stores/albums.js`, com o setter novo `setAlbumsBySeries`), `models/albumQuery.js` (a leitura única de «Artista - Título»: só o primeiro separador divide). `SeriesController` perdeu o laço de carga (647 → 405 linhas): pede ao serviço, reconcilia quando a lista de séries muda, desfaz as inscrições da visita anterior. `SeriesGridRenderer` desenha a série vazia pelo estado derivado (carregando, falhou, oculta) e mostra o aviso «N albums did not load · Try again».
- Saiu da carga, por decisão do agente e revisável pelo MJRP (decisão 1 da proposta, sem resposta dele ainda): a regravação de cada álbum na coleção `albums` do Firestore.
- Medido (guardado apagado, mesma conta, 20 séries, 80 álbuns): 33 álbuns aos 3 s, 50 aos 5 s, os 80 aos 8,5 s; nenhum erro no console; sair para a Home e voltar mantém 20 blocos e 80 álbuns (antes caía de 20 para 15). Evidência: `reports/evidence/F45-albums-load-in-parallel/F45-probe-after-2026-11-19.json` e `F45-desktop-after-2026-11-19.jpg`.
- Achado da primeira tentativa: com 6 buscas simultâneas a Apple Music respondeu 429 e 5 séries mostraram o aviso de falha (o aviso funcionou; captura `F45-desktop-failure-notice-2026-11-19.jpg`). Corrigido no adaptador: 3 por vez, nova tentativa com espera crescente e variação (`DP-23`), e falha da Apple não cai mais na segunda fonte, que usa IA paga (antes caía).
- Testes: 78 novos passam (fila 12, estado 15, store 10, serviço 18, adaptadores 23). Suíte inteira: 189 passam, 28 falham nos mesmos 9 arquivos da linha de base (mais os 8 E2E sem suíte); nenhuma regressão nova.
- Aberto: as notas chegam a 2 buscas por vez (17 de 80 aos 40 s), sem travar a tela; as séries abaixo das 3 primeiras seguem em bloco cinza até entrarem na janela (F46); o «Refetch» ainda corre fora da fila e é adotado pelo serviço depois (F48); `/blend` e o modo edição ainda usam `apiClient.fetchAlbum`.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:35] session — F45: a store única da carga e o serviço dono da carga, com dublês das fontes (55 testes novos no total)

- `public/js/stores/albumLoad.js`: store pura, única dona de «pedido → álbum e estado», com aviso agrupado por tique e `subscribe` que devolve o `unsubscribe` (10 testes). `public/js/models/albumLoadState.js`: as regras de estado mudaram de `services/albums/` para `models/`, porque a store não pode importar `services/` (função de aptidão da proposta). `public/js/models/cloneAlbum.js`: cópia do álbum e das faixas, para o enriquecimento não mutar o publicado.
- `public/js/services/albums/AlbumLoadService.js`: gerações (só a carga atual escreve), reconciliação a cada abertura, achar separado de enriquecer, fontes em cadeia por álbum (as rápidas primeiro, a de notas por último, na fila lenta de limite 2), `retryFailed`, `stop`, `whenIdle`. Não importa rede, Firestore nem tela: recebe o catálogo, as fontes e o guardado por injeção. 18 testes, entre eles: resultado de carga antiga é descartado; reabrir o mesmo escopo não busca de novo; reconciliar quando a série mudou; «vazio» distinto de «falhou»; falha nunca vai para o guardado; segunda visita sem busca; álbum do catálogo congelado e não mutado; teto da fonte lenta.
- Ainda não ligado ao app: faltam os adaptadores (catálogo, notas, popularidade, ranking, guardado), a projeção para `stores/albums.js`, o controlador e a grade.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:31] decision — a proposta da carga de álbuns emendada depois das duas críticas (seção 15 do arch.md)

- Segunda crítica (Fable, cortada pelo limite de tempo): `2026-11-19-v0-albums-load-architecture-critique.md`, na pasta de notas. Veredito igual ao da primeira: pode seguir depois dos P0. O que só ela viu: o servidor não distingue «sem nota» de «a busca falhou» (o raspador engole o erro); o teto de 4 buscas simultâneas não foi medido; a chave do guardado tem de ser a do pedido; `clearAll` apaga séries e rankings junto.
- Emendas, decididas pelo agente e revisáveis pelo MJRP: store única dona de «pedido → álbum», com `stores/albums.js` como leitura projetada; guardado por pedido, base ao achar e um registro por fonte; geração em vez de sessão, com reconciliação a cada abertura; fatias revistas (a F45 leva a grade pelo estado derivado; o observador de visibilidade vai para a F46); álbum publicado não é mutado; filtro, busca ou mistura carregam o escopo inteiro; cancelar é descartar; começa em 2 buscas de nota por vez; a distinção «sem nota» × «falhou» pede mudança no servidor, em fatia própria. A tabela «comportamento de hoje → novo dono → fatia» tem 15 linhas.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:29] review — crítica independente da proposta da carga de álbuns (Opus, 5 min): pode seguir depois de quatro P0; aceitos

- Relatório: `2026-11-19-v0-albums-load-architecture-critique-opus.md`, na pasta de notas das sessões. Veredito: a direção está certa; faltam quatro pontos. Aceitos pelo agente, revisáveis pelo MJRP:
- P0-1, duas fontes da verdade: a store nova passa a ser a única dona de «pedido → álbum»; `stores/albums.js` vira leitura derivada dela, sem a chave `ALL_SERIES_VIEW` e sem a recusa de série inativa.
- P0-2, o guardado: uma chave única; guarda a base do álbum ao achar e cada enriquecimento com o seu estado; ao ler, enfileira só o que falta. Entra já na F45.
- P0-3, nove comportamentos de hoje sem dono no desenho (capa de reserva, reordenação por nota, `seriesIds`, ranking ao reabrir, série nova com a memória cheia, Refetch e injeção fora da fila, adicionar/remover/editar, o corte em 20, quem lê a lista de séries): a proposta ganha a tabela «comportamento de hoje → novo dono → fatia».
- P0-4, a F45 não se sustenta sem parte da F46: a F45 leva o estado derivado da série na grade e um observador por série em todos os layouts; a F46 fica com o aviso de falha, o «tentar de novo» e o fim das inscrições acumuladas.
- P1: o enriquecimento cria um álbum novo e troca a referência (não muta o publicado); com filtro, busca ou Blend ativos a carga é do escopo inteiro; a sessão é a mesma só se a lista de pedidos da série não mudou; a tabela de prazos corrige a segunda fonte (`/api/generate`); três funções de aptidão a mais (mutação, chave única, dono único).
- Regra do MJRP para as críticas: «vamos colocar um limite de tempo para as criticas ... eu sugiro 5 min no max» e «nao quero bloqueios, quero agir mais rápido». Padrão: 5 minutos com escopo fechado; passou, entrega o que conferiu. A primeira crítica (Fable, escopo de dez perguntas) passou do tempo e foi mandada encerrar.
- Código nesta entrada: `public/js/services/albums/loadState.js` (as regras de estado, puras) com 15 testes (`test/services/albums/loadState.test.js`).
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:25] session — F45: a fila da carga (`TaskQueue`) nasce com 12 testes

- Ramo `fix/f45-albums-load-in-parallel`. `public/js/utils/TaskQueue.js`: limite de tarefas ao mesmo tempo, prioridade (por tarefa e por grupo), prazo por tarefa com `AbortSignal`, cancelamento, `onIdle`. Não importa nada do projeto (o teste confere). Erros com nome: `TaskTimeoutError`, `TaskCancelledError`.
- Teste antes do código: `test/utils/TaskQueue.test.js` falhou por falta do módulo e passou depois, 12 de 12. É a primeira peça do desenho da seção «Carga da tela de álbuns — proposta» do `arch.md`; o serviço e o estado esperam a crítica independente, que está rodando.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:23] decision — proposta de arquitetura da carga da tela de álbuns escrita no arch.md; a crítica roda em paralelo ao código

- A proposta está em `docs/specs/arch.md`, seção «Carga da tela de álbuns — proposta» (profundidade leve): um serviço dono da carga (`AlbumLoadService`), cada carga com identidade e cancelamento (`LoadSession`), fila com limite, prioridade e prazo (`TaskQueue`), portas para o catálogo, as notas, a popularidade, o ranking pessoal e o guardado, achar o álbum separado de enriquecer, estado explícito por álbum numa store pura e estado da série derivado. Três opções comparadas (remendo, este desenho, levar a carga ao servidor); recomendada a segunda. Funções de aptidão em `npm test`. Entrega em fatias: F45, F46, F48 e, por último, os laços próprios de `/blend` e do modo edição.
- Achado ao desenhar: a coleção `albums` do Firestore, regravada a cada carga, não tem leitor no app (`stores/albums.js:267`, `loadFromFirestore`, sem chamador). Vira a decisão 1 do MJRP na proposta (parar de gravar na carga).
- O MJRP, sobre as skills do harness: «note que temos uma serie de skills mjrp- que podem ajudar (mas nao te limitar) nas tarefas» e «nao deixe as skills te limitarem hein». Decidido pelo agente, revisável por ele: a crítica independente (`mjrp-critiquing-architecture`) roda em paralelo, sem segurar o código das peças que ela não muda (a fila e as funções puras de estado); a página visual da proposta só se o MJRP pedir; a ADR sai depois da crítica.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:20] decision — o MJRP quer correções de arquitetura, não remendos, e o manual revisto junto; a v4.0 ganha a story S-52

- Arquitetura: «me avise quando tiver correcoes arquiteturais pra corrigir os problemas, quero ficar ciente, disso ok? nao quero patches, quer correcoes robustas com padroes de arquitetura conforme principios do harness». A F45 ia começar como remendo (paralelizar a fila e pôr prazo); parou antes de qualquer código. O conserto da carga do `/albums` passa a ser um desenho só, em fatias (F45, F46, F48): um serviço dono da carga, cada carga com identidade, estado explícito por álbum e por série numa fonte só, achar o álbum separado de enriquecer, fila com limite e prazo, Firestore só nos repositórios, cache com uma definição de identidade. Apresentado ao MJRP, que respondeu «go for it». Antes do código: a proposta de arquitetura, a crítica independente e a ADR.
- Manual: «importante, vá revisando toda a documentacao no manual por favor, corrigindo e atualizando e limpando o que não faz mais sentido». Cada conserto atualiza os arquivos de `docs/manual/` da área que tocou; o que o manual descreve e o código não tem (11 arquivos de código citados que não existem, 10 documentos do índice com nome errado ou ausentes, o carregamento concorrente que nunca existiu) é corrigido ou tirado.
- Resposta da orquestradora do harness à dúvida da release só de consertos: não há isenção; a REL-39 ganha a story que os consertos servem, e a feature que corrige issue de outra rodada declara `planned_for:`. Feito: a story S-52 (EP-01, `Prioritized`, `planned_for` REL-39), embutida no `prd.md`, e `planned_for` na F47 e na F49. `product_structure_check.py` e `requirements_graph_check.py` saem verdes; as seis features caem na v4.0.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:16] session — v4.0 aberta no v0: medição da carga do /albums, sete issues (UAT-172 a 178) e seis features de conserto (F45 a F50)

- Lido antes de escrever: o manual inteiro (`docs/manual/`, 37 arquivos), o caminho de carga do `/albums` no código (controlador, cliente de API, prateleira, grade, cache, tela) e os três relatórios do V1 (o da causa por inteiro; o mapa completo no corpo; os apêndices A a M por seis leitores, cada defeito conferido na linha do código, notas na pasta de notas das sessões: `v0-appendix-*-verified.md`). A «lista de 89 linhas» do V1 é régua de cobertura, não lista de defeitos: os defeitos estão nos apêndices e no `uat.md`.
- Ambiente de prova: app local na porta 5010 (a 5000 é do Receptor AirPlay do macOS) com `/api` repassado ao servidor de produção, sem segredo no disco; Firestore de produção (`mjrp-playlist-generator`, o projeto que vale em tempo de execução); login feito pelo MJRP no painel. Arquivos locais fora do git: `vite.config.local.js`, `.claude/launch.json` (no worktree da sessão).
- Medido no navegador, cache vazio, 20 séries e 80 álbuns: 1º álbum aos 8,5 s, depois 1 a cada 5–6 s; aos 48 s, 3 séries e 17 blocos cinza; aos 4 min 40 s, 46 de 80. O tempo vai em `POST /api/enrich-album` (média 4,9 s por álbum, em fila); a Apple Music responde em 0,4 s. Sair e voltar no meio da carga: de 20 blocos para 15 em 10 s. Evidência em `reports/evidence/F45-albums-load-in-parallel/` e `reports/evidence/F46-albums-load-state/`.
- Linha de base dos testes (`npx vitest run`, rodado pela primeira vez): 111 passam, 28 falham em 9 arquivos; outros 8 arquivos de `test/e2e/` entram no padrão do Vitest e acusam «No test suite found». «Sem regressão nova» mede-se contra isso.
- Registrado: `^REL-39` «v4.0 · Carregamento e estabilidade» no `ROADMAP.md`; «Rodada 2 — v4.0» no `docs/specs/uat.md` com UAT-172 (carga lenta, do MJRP), 173 (séries em bloco cinza ou que somem), 174 (álbum que falha sem aviso), 175 (nova tentativa que nunca roda: `api/client.js:202`, `:225`; achado novo, o relatório do V1 dizia o contrário), 176 (leituras e gravações a cada visita), 177 («Clear Cache» não limpa), 178 (localhost e 127.0.0.1, do MJRP); features F45 a F50 geradas pelo `new_feature.py` do harness (`lane: fast`, `solution_type: fix`), em esboço com o resumo e o problema escritos. A F47 corrige a UAT-24 e a F49 a UAT-06, da Rodada 1.
- Pendente de resposta da orquestradora do harness: o `product_structure_check.py` acusa a REL-39 «sem nenhuma story que conte» (release só de consertos), e a F47 e a F49 caem na REL-38 por corrigirem issues da Rodada 1.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:16] decision — respostas do MJRP às perguntas de produto da carga do /albums e ao ambiente de prova

- Limite de 20 séries (UAT-24): «nunca determinei que me lembre limite de series, logo, acidente.» O corte sai (F47).
- Série com álbuns que falharam: «aviso para series que falharam» (F46).
- Carregar todas as séries ou só as visíveis: «carrega com lazy loading sugiro» (F45).
- Ambiente: «Pode testar em producao, só eu uso a app». Sobre o conserto do servidor só se provar publicando: «concordo com o conserto».
- Endereço local: «temos problemas de usar localhost e 127.0.0.1 um funciona para spotify e outra pra apple, isso é algo que gostaria de arrumar tb» (UAT-178, F50).
- Board: o MJRP pediu documentar tudo no Control Center do harness, no projeto do v0, numa versão nova: «um v4.0». Nome dado pelo agente, revisável por ele: «v4.0 · Carregamento e estabilidade».
- Dúvida de harness vai para o agente mestre do harness: «na dúvida sobre o harness pergunte para o [Master Harness Agent]».
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:16] decision — o MJRP manda consertar o v0 pela via rápida, sem ficar preso ao processo; cai a trava «não alterar código do v0»

- Palavras do MJRP, repassadas pela orquestradora do harness: «resolver todos os problemas do album blender no projeto filho V0, começando pelos mais graves, tudo pelo fast lane, todavia nao ficando bloqueado pelo processo, apenas seeguindo para documentar o que está sendo feito, mas o objetivo é arrumar e testar no browser que está arrumado».
- O que muda: o `MEMORY.md` dizia «Não alterar, apagar nem mover código do v0 (em produção)». A partir deste pedido o código do v0 é consertado, um ramo por conserto (`fix/fNN-<slug>` ou `claude/fNN-<slug>`), cada feature registrada na `main` antes do ramo, com `lane: fast` e `solution_type: fix`. O trabalho não espera a «Priorizada» nem as perguntas abertas do conform; a documentação vem junto, como registro do que foi feito (o passo retroativo antes do fecho).
- O que não muda: push, `--no-verify`, carimbos e aceite são do MJRP. Uma trava de commit que recusar por processo, e não por defeito, é registrada e levada à orquestradora; não é contornada.
- Antes de começar, o MJRP pediu o alinhamento: rodar a `mjrp-pdlc-onboarding`, ler o manual a partir do índice, comparar com o código, depois com os relatórios do V1, e reportar o lido e o não lido. Sobre os apêndices do mapa: «acredite verificando no codigo e no browser».
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-10-31 00:40] session — as versões do produto com o nome no formato do roadmap (UAT-434 do harness)

- Os 33 nomes das versões no `ROADMAP.md` saem de «Versão do produto v1.5 (sem tag)» para «v1.5 · v1.5 Refactor» (o número, depois o tema): o Control Center separa o número do nome por « · », e sem isso o rótulo quebrava letra a letra. A rodada do `uat.md` passa a «Rodada 1 — v3.20.0» (a tela liga a rodada à versão pelo começo do nome). Só o texto mudou: os ids (`^REL-06` a `^REL-38`), as versões (`version::`) e os vínculos ficam como estavam. Decidido pelo agente, revisável pelo MJRP; o importador do harness passa a gravar assim.
- Session: f135-versions-timeline

## [2026-10-30 23:53] decision — o histórico do v0 gravado pelas sprints: 26 features, 31 sprints, 33 versões do produto (a F128 e a F136 do harness)

- O MJRP aprovou o de-para refeito sobre os originais (as pastas SDD de cada sprint, a Product Vision de dez/2025, o roadmap antigo, o CHANGELOG) às 22:15 de 2026-10-30 e autorizou a gravação. Gravado pelo `legacy_history_import.py` do harness, a partir do registro `docs/specs/board-mapping.json` (`board_mapping@1`), depois do `--refresh-kernel`: **26 features** F19–F44 (uma por pasta SDD de sprint, com as 156 funcionalidades e os 160 arquivos SDD originais em `legacy/`), **31 sprints** em `docs/specs/groupings/sprints/`, **33 versões do produto** REL-06 a REL-38 no `ROADMAP.md` (a versão do app em `version::`), **142 issues** do `DEBUG_LOG` no `uat.md` e o **EP-09** (achar o álbum certo no catálogo oficial, serve o OUT-03). Foi para `_archive/october-reconstruction/` o que o MJRP descartou: as F01–F18, as 39 stories de outubro e as REL-01..05. O `docs/specs/board.json` e o contrato (`groupings: [release, sprint]`) foram escritos.
- Decidido pelo agente, revisável pelo MJRP: os ids seguem depois do maior que o projeto já teve; cada feature mora na última versão em que saiu; o EP-09 serve o OUT-03; o OK do orquestrador nas 226 linhas mecânicas é da sessão da F128, que não escreveu a proposta.
- Os juízes na v0, todos com exit 0: `board_mapping_check.py`, `requirements_graph_check.py`, `product_structure_check.py`, `feature_history_check.py`, `uat_tracks_check.py`. As notas CM-0086, CM-0088, CM-0089, CM-0092, CM-0093 e CM-0094 passam e entram em `conformance.applied`. Ponto de volta: a tag `v0-before-history-import` (o git antes da gravação). Seguem abertas, do MJRP: as notas de tela (`info-arch`, `wireframes`, `design-system`, `visual-sensor`), a `project-palette` e a auditoria de conteúdo. O `doctor` da v0 segue vermelho nos links das docs antigas (I3) e, desde esta gravação, nos links relativos dos arquivos SDD copiados para `legacy/`: achado para o harness.
- Session: f136-configuring-boards (a sessão de página do harness)

## [2026-10-30 18:25] decision — o de-para do histórico do v0 é refeito pela F136 do harness; o de outubro foi descartado pelo MJRP

- Recado da integradora do harness ao fechar o cascade: o MJRP descartou hoje o de-para de outubro (as stories e as features de histórico montadas no conform: S-xx, F01 a F18) e a sessão da F136 do harness (a skill `mjrp-configuring-boards`) o refaz a partir dos requisitos originais; só os épicos EP-01 a EP-08 se reaproveitam. Quem pegar as perguntas da auditoria (P-01 a Visão, P-33 a paleta e as demais) parte daí: perguntas sobre stories e features de histórico podem mudar com o de-para novo.
- Session: cascade-children-orchestrator

## [2026-10-30 18:19] session — fechamento do cascade nesta pasta: releitura da juíza passou; o resto é do MJRP; sessões arquivadas

- A releitura da juíza B passou (`b7955c5`): os 2 P0, as 7 perguntas evitáveis, as issues H10 e S8 e os 5 `delivered_by` fechados. O conform segue aberto no que depende do MJRP: as perguntas da auditoria (P-01 a Visão — a regra «uma frase» caiu no harness pela F126 —, P-33 a paleta, e as demais) e os itens de tela (`info-arch`, `wireframes`, `design-system`) que dependem delas. Código intocado, sem push. As sessões do cascade (executora e juíza) foram arquivadas a pedido do MJRP; nada sem commit, nenhuma vaga ativa.
- Session: cascade-children-orchestrator

## [2026-10-29 18:59] review — releitura da juíza B depois da rodada de correção do v0

A juíza B releu só o que falhou no julgamento de 2026-10-28, em `reports/audits/2026-10-28-mjrpalbumblender-v0-conformance-audit.md`: os dois P0 (a evidência da F04 e a história S-04), as sete perguntas evitáveis e a regra dobrada (P-36), as issues de H10 e S8 (UAT-26 e UAT-27) e os cinco `delivered_by` fracos. Cada um está fechado no relatório, com o arquivo e a linha que o mostram; os quatro itens de tela sem arquivo seguem abertos de propósito (dependem do MJRP e da economia até 30/10). O veredito do relatório passa a «conforme, com pontos fracos»; o conform continua aberto. Nenhum código tocado, nenhum push, nenhuma válvula do MJRP.

## [2026-10-29 18:55] session — conform do v0 não fechado: rodada de correção da juíza B feita, aguardando releitura

A sessão A terminou a rodada de correção pedida pela orquestradora depois do «não conforme» da juíza B (`f8000df`): prova do F04 (P0), histórias aceitas com defeito aberto (P0 da S-04), sete perguntas evitáveis decididas pelo agente, UAT-26 a UAT-29, `delivered_by` das cinco histórias refeito e itens de tela mantidos abertos pelas regras (economia até 2026-10-30 e sensor visual no fechado). Detalhe nas entradas de 2026-10-29 18:54, 18:55 e 18:55 deste log. O conform segue **não fechado**: 17 notas e 7 lacunas (tela, paleta e a auditoria de conteúdo), e o relatório da juíza ainda lista as perguntas que o agente decidiu até ela reler.

## [2026-10-29 18:55] decision — sete perguntas evitáveis decididas pelo agente; issues UAT-26 a UAT-29 e ADR-0015 normalizada — decidido pelo agente, revisável pelo MJRP

Rodada de correção da juíza B: sete perguntas do rascunho eram evitáveis (classe a) e uma era também regra dobrada; o agente decide e tira da lista ao MJRP.
- [revisável] H10 e S8, as duas coisas do mapa sem issue, viraram UAT-26 (colar texto vazio na Home chama `toast.warn`, que o `Toast` não tem — `HomeController.js:132`; uma lista sem hífen NÃO o chama, mostra `toast.error`) e UAT-27 (o botão «Create Series» do estado vazio faz `location.hash = '/home'` e o roteador lê só o `pathname` — `SavedPlaylistsView.js:249`, `router.js:83-88`), na trilha do agente.
- P-29 (token do Spotify no `localStorage`): `PRINCIPLES.md` §I.14 só admite credencial no cliente com o BYOK aprovado na constituição e a constituição não o aprova; regra antes do código: é defeito de código, issue UAT-28 (`SpotifyAuthService.js:179-182`), sem emenda da constituição (essa é do MJRP).
- P-30 (exceção para o P0 VT-06): `PRINCIPLES.md` §I.3 manda e não há exceção aprovada; o código é o defeito (UAT-14). Sem pergunta.
- P-32 (ADR-0015 `APPROVED`): o cabeçalho passou a `Accepted (registro original de 2026-01-10: APPROVED)`; é normalização do vocabulário de um registro já aprovado em 2026-01-10, não aceite novo.
- P-26 (ADR-0018 `Proposed`): o aceite é da via técnica (tech lead), não do MJRP; a ADR fica `Proposed` e o aceite técnico fica pendente de quem aceita; o agente não aceita ADR por conta própria.
- P-34 (quando entram os itens de tela): a regra responde — economia até 2026-10-30 (decisão do MJRP repassada pela orquestradora no pedido de 2026-10-28) e «o sensor visual não roda no fechado em produção» (regra do MJRP de 2026-10-18); os itens `info-arch`, `info-arch-sections`, `wireframes`, `design-system` e `visual-sensor` ficam abertos e não são criados agora. Resta ao MJRP só a válvula de dispensar de vez, que é dele.
- P-35 (`delivered_by` fraco): resolvida no git (entrada de 2026-10-29 18:55).
- P-36 (tasks fechadas sem `rounds::`, e a recomendação «deixar» dobrava a regra): a regra vale (`loop.py:194` reprova task fechada sem `rounds::`); a pendência virou UAT-29 e o parecer ao harness `reports/harness-feedback/2026-10-29-mjrpalbumblender-v0-loop-rounds-no-legacy-exemption.md`; nenhum número foi inventado.
- Também: o agente R perguntou se o aceite por histórico continua valendo nas histórias com defeito aberto; a regra do MJRP de 2026-10-18 responde (o fechado em produção antes do contrato nasce aceito e não é re-julgado), então não é pergunta.

## [2026-10-29 18:55] decision — histórias aceitas com defeito aberto apontam as issues; delivered_by fraco refeito no git — decidido pelo agente, revisável pelo MJRP

Rodada de correção da juíza B, P0 da S-04 e `delivered_by` fraco (`mjrp-writing-reqs`; ordem de serviço nos arquivos dos juízes de requisitos e de SDD).
- O grafo NÃO tem campo para «aceita com issue aberta» (`violates::` só existe em spec de feature Fix, regra `fix_nfr_import`; não há `known_issues`): o sensor fica verde sem ler o corpo. Sem tirar o aceite histórico (regra do MJRP de 2026-10-18), a S-04 (UAT-24 e UAT-06), a S-37 e a S-38 (UAT-12), a S-15 (UAT-02, UAT-13), a S-12 (UAT-08) e a S-24 (UAT-09) ganharam no corpo uma linha «Defeito aberto hoje» com o link `[[uat#^UAT-nn]]`; os ponteiros «o defeito está em outra story», que não existe, saíram. Parecer ao harness sobre a aresta que falta: `reports/harness-feedback/2026-10-29-mjrpalbumblender-v0-accepted-story-open-issue-edge.md`.
- [revisável] As cinco histórias de `delivered_by` fraco acharam commit real anterior ao contrato (`merge-base --is-ancestor 54fd54c`) e nenhum aceite por histórico foi retirado nem criado: S-30 `9ebed2b`, `11747c3`; S-31 `b9530f1`, `29b3f5e`; S-32 `29b3f5e`; S-34 `2093d63`, `cd7dff4`; S-38 `6eb6682`, `b85f473`, `edc38ee`. Os commits `6d79577` (só documentos e testes) e `2f980d0` (só configuração) saíram como entrega; as tasks de F04, F07 e F18 e as tabelas de `reports/evidence/` foram refeitas contra os commits novos. S-30 e S-31 agora datam de dezembro de 2025 a janeiro de 2026 e estão em REL-05: a coerência da release é do MJRP e não foi mexida.
- [revisável] `behavior.md`: ressalvas de UAT-01 («Excluir» do inventário), UAT-09 («Open in Spotify» no modo separado) e S8 (UAT-27); o cabeçalho diz que o que não funciona virou issue de UAT; 46 caminhos de código errados corrigidos em `behavior.md` e em 9 nós, só quando o nome do arquivo é único em `git ls-files`.

## [2026-10-29 18:54] decision — prova do F04 corrigida: o teste não cobre a migração real do visitante — decidido pelo agente, revisável pelo MJRP

Rodada de correção da juíza B, achado P0 da prova do F04 (ordem de serviço: `reports/audits/2026-10-28-mjrpalbumblender-v0-content-mjrp-ensuring-quality.md`). `reports/evidence/F04/evidence.md` dava a migração do visitante para a conta como coberta por `DataSyncService.test.js` e `UserSyncService.test.js`; esses testes recebem `'guest'` à mão e a UAT-12 diz que a migração real não acontece. A evidência agora diz o que o teste prova (a função, com a entrada montada à mão) e o que não prova (o fluxo real), aponta a UAT-12, e o `spec.md`, o `tasks.md` e o `plan.md` do F04 ganharam a mesma ressalva só nas frases. Nenhum teste foi executado (falta `npm ci`); nas 18 evidências «Testes automatizados que cobrem» virou «que existem… não foram executados nesta passagem».
[revisável] O teste do F01 REQ-04 (`ConsolidatedRankingView.test.js:4,14`) importa `stores/series.js`, que não existe: a evidência diz que ele não conta como prova. O teste do F13 REQ-01 é script Puppeteer fora do vitest — dito na evidência. Deriva de `mjrp-ensuring-quality` («a aresta não é a prova»).
[revisável] Caminhos de código das linhas «Onde mora» dos planos (F02, F03, F04, F05, F07, F10, F12, F13) corrigidos para o arquivo real quando o nome é único em `git ls-files`.


## [2026-10-28 13:17] review — julgamento independente do v0 pela juíza B: relatório entregue

A juíza B (sessão separada da executora) auditou o conform: sete juízes em Sonnet, um por skill juíza, e o relatório principal `reports/audits/2026-10-28-mjrpalbumblender-v0-conformance-audit.md` (os arquivos dos juízes ao lado). Veredito **não conforme**: 2 P0 de conteúdo abertos (a evidência da F04 contra a UAT-12; a S-04 aceita sem ressalva contra a UAT-24 e a UAT-06), 7 perguntas evitáveis e 1 regra dobrada. `conformance_check.py … --pending --gaps` (do harness): 7 lacunas, 17 notas pendentes (tela, paleta e `content-audit`). Conferido: nenhum arquivo de código alterado, apagado ou movido; nenhum push (`origin/main` em `c9cf80f`); nenhuma válvula do MJRP. O conform segue aberto: a rodada de correção é da executora, com os achados dos juízes como ordem de serviço.

## [2026-10-28 13:03] decision — notas de uat, trilha da feature e pasta de evidência registradas — decidido pelo agente, revisável pelo MJRP

Com `docs/specs/uat.md` e as 18 features, entraram na fila e passam as notas dos itens `uat` (CM-0001, CM-0081 → uat@3), `feature-track` (CM-0004, CM-0083 → feature-track@2) e `evidence-folder` (CM-0005, CM-0026, CM-0068, CM-0080 → evidence-folder@4): `conformance_check.py --check-note` passa nas oito. Registradas sem rodada (o trabalho já está feito pelos pacotes D1 e D2). Com isso o `--pending` fica em 17 notas, todas de tela, paleta e auditoria de conteúdo; a carência dos itens de tela agora vai até 2026-11-27 (o refresh do kernel renovou o `received`).

## [2026-10-28 13:03] session — conform do v0 não fechado: sessão A parou de novo, com features e issues de UAT no repositório

Segunda parada da sessão A (depois do recado da orquestradora de 2026-10-28 sobre features por release e issues de UAT). Acrescentado desde a primeira parada: 18 features Done (F01..F18), 25 issues de UAT na trilha do agente (`docs/specs/uat.md`, 4 delas subidas à trilha do MJRP por segurança ou decisão) e a saída de 12 histórias `Backlog` do Board. O conform segue **não fechado**: 17 notas e 7 lacunas abertas (tela, paleta, auditoria de conteúdo), dentro da carência; 37 perguntas ao MJRP (9 de classe b, 28 de classe c) esperam resposta em `v0-conform-perguntas-ao-mjrp.md` (pasta de notas das sessões laterais). `requirements_graph_check.py`, `product_structure_check.py`, `feature_history_check.py`, `record_shapes_check.py` e `evidence_folder_check.py` verdes (rodados nesta sessão).

## [2026-10-28 13:02] decision — features de histórico do v0: 18 features Done por release, cada história importada por uma — decidido pelo agente, revisável pelo MJRP

Nota CM-0074 (item `release-features`) e o pedido do MJRP via orquestradora de 2026-10-28 (features Done por release; cada história Done importada por exatamente uma feature), pelo pacote D1 (`mjrp-specifying-sdd-artifacts`, regra de histórico legado da bootstrap). 18 features `Done` em `docs/specs/features/F01..F18-*/` (`spec.md`, `plan.md`, `tasks.md`) e 18 `reports/evidence/Fxx/evidence.md`: REL-01 F01..F03, REL-02 F04..F07, REL-03 F08..F11, REL-04 F12..F14, REL-05 F15..F18. As 39 histórias Done estão cada uma importada por exatamente uma feature (conferido por script); nenhuma feature cruza release; nenhuma tem `accepted_in` (o aceite por histórico fica nas histórias); `feature_history_check.py`, `requirements_graph_check.py`, `record_shapes_check.py` e `evidence_folder_check.py` verdes, sem sinal de tamanho.
[revisável] Seis features de uma história só (F03, F08, F10, F14, F15, F16): cada uma é fatia vertical com valor próprio — deriva de `legacy-history.md` e `feature-size.md`.
[revisável] `verified_by` cita o teste existente quando o nome casa com o requisito; senão diz «sem teste automatizado próprio» com o commit e o `evidence.md`. Os testes não foram executados (falta `node_modules`) e o `evidence.md` diz isso. `Prototype Parity` = «não se aplica» pela regra do MJRP de 2026-10-18.
Dúvidas que viraram pergunta ao MJRP: `delivered_by` fraco em S-30, S-31, S-32, S-34 e S-38 (commits que só mexem em documentos ou configuração; o código do celular está em 29b3f5e); tasks fechadas sem `rounds::` (o `loop.py --check-tasks` as reprovaria; nada o roda hoje); a troca «flavor → recipe» (Sprint 17.9, ADR-0015) não está em nenhuma história Done.

## [2026-10-28 12:58] decision — issues de UAT do v0: o que não funciona vira issue na trilha do agente — decidido pelo agente, revisável pelo MJRP

Decisão do MJRP (via orquestradora, 2026-10-28): o que o mapa do V1 mostra que não funciona vira ISSUE DE UAT na trilha do agente, não «não entregue». Executado pelo pacote D2 (`mjrp-specifying-sdd-artifacts`); esta entrada corrige a de 12:09, que dizia que S-40..S-54 viraram histórias `Backlog`.

- `docs/specs/uat.md` (novo) tem 25 issues em uma rodada (`Rodada 1 — R5`), todas abertas por `agente`, com o campo «OK do humano» vazio: UAT-01..UAT-13 são os defeitos de capacidades entregues (excluir álbum da coleção, desfazer/refazer sem botão, excluir playlist antes de guardar, título da playlist que não fica, playlists perdidas ao recarregar, «carregar mais» sem efeito, menu de mistura sem a série, modo descoberta sem efeito, «Open in Spotify» no modo separado, telas de ranking sem link, tela de migração sem caminho, migração do visitante que não roda, ações só no hover no celular); UAT-14..UAT-25 são a dívida técnica da crítica de arquitetura, cada uma com `violates::`. Cada linha citada foi conferida no código pelo agente.
- As histórias S-40..S-48 e S-52..S-54 saíram do Board (12 arquivos; `_safe.py retire` recusou arquivo versionado, então foram movidas para `_backups/` com o carimbo do retire e a remoção entra neste commit) e os 12 embeds saíram do PRD. S-49, S-50 e S-51 (séries de artista, gênero e faixas soltas, «em breve» de verdade) continuam `Backlog`.
- [revisável] UAT-15, UAT-16 e UAT-17 (segurança) e UAT-24 (decidir o limite de 20 séries) sobem à trilha do MJRP com `prioridade: humano — …`: o `uat_tracks_check.py` e a skill mandam subir o que é segurança ou pede decisão, e revogar o token só o dono da conta faz; as outras 21 ficam na trilha do agente. Deriva de `uat_tracks_check.py`.
- [revisável] Uma rodada só, em R5, porque o check exige release na rodada. Gravidade pelo guia de `bug-reports.md` da `mjrp-ensuring-quality`; a das issues de arquitetura é a da própria crítica.
- Do `docs/debug/DEBUG_LOG.md` (170 linhas de `Status`, 138 resolvidas) nenhuma issue nova: as 32 restantes ou já estão cobertas (#146, #8, #7), ou foram resolvidas no código com o status desatualizado, ou citam arquivo que não existe mais, ou são pedido de funcionalidade; #45 e #143 não se confirmam sem rodar o código (falta `node_modules`).
- Ficaram fora pelo teto de 12 da dívida: coleções globais sem dono, `_schemaVersion`, «flavor» no código, arquivos acima de 200 linhas, retentativa sem jitter, `AuthService` duplicado (segundo lote possível).

## [2026-10-28 12:39] session — conform do v0 não fechado: a sessão A parou; notas aplicadas, abertas e achados

**Resumo.** Sessão A (executora) do bootstrap e do conform do v0 (brownfield, em produção), a pedido da orquestradora e por decisão do MJRP de 2026-10-28. Código do v0 intocado; nenhum push; todos os commits são locais na `main`.

**Aplicadas (registradas em `conformance.applied`, cada uma com `--check-note` passando):** vision (CM-0029, 0047), roadmap (0002, 0017, 0025, 0041, 0045), releases (0003, 0046, 0078), prd (0051, 0077), constitution (0030, 0048), arch (0032, 0053, 0072), tech-stack (0071), data-model (0033, 0054), adr-names (0012, 0024, 0076, 0085), arch-critique (0011), behavior (0031, 0049), requirement-nodes (0037, 0067), product-structure (0019, 0020, 0021, 0022, 0027, 0028, 0058, 0069, 0079, 0082), release-features (0074), contract-screen (0006), report-names (0016, 0043, 0059, 0060, 0065), english-names (0013), record-shapes (0034, 0044) e memory-layer (0035, 0062).
**Abertas:** tela — visual-sensor (0007, 0023), info-arch (0008), wireframes (0009), design-system (0010, 0040, 0061, 0064, 0075), info-arch-sections (0038): a regra de economia até 2026-10-30 (sem wireframe nem protótipo) e a regra do MJRP de 2026-10-18 (sensor visual não roda no fechado em produção) as deixam para depois; destrava com a decisão do MJRP (P-34); project-palette (0018, 0055): escolha do MJRP (P-33); content-audit (0052, 0057, 0063, 0066, 0073): é a auditoria da sessão B, juíza separada.

[revisável] CM-0074 (`release-features`) registrada sem criar features de histórico: `feature_history_check.py` fica verde e o v0 não tem pasta de marcos legados; features por release seriam escolha do MJRP.
[revisável] `screen:` do contrato é `public/` (o valor do modelo, `web/src/`, não existe no v0). Isso fez os itens de tela passarem a se aplicar.
[revisável] `new_project.py --refresh-kernel` rodou no fim (o harness avançou durante a sessão) e fez um commit próprio; `_backups/` entrou no `.gitignore` do v0 porque a regra da pasta diz que ela não é versionada.

**Achados registrados e não corrigidos (código intocado):** crítica de arquitetura (1 P0 de código — SDK do Firestore fora dos adaptadores —, 11 P1, 5 P2) em `reports/audits/2026-10-28-mjrpalbumblender-v0-architecture-audit.md`; primeiro `doctor.py` completo: 327 links quebrados em documentos legados e os três sensores do contrato sem `node_modules` (`npm ci` destrava); parecer ao harness em `reports/harness-feedback/`.
**Próxima sessão.** A sessão B (juíza independente) audita o conteúdo; as 34 perguntas ao MJRP estão em `side-session-notes/local_8c6b8fce-…/v0-conform-perguntas-ao-mjrp.md` e viram a seção de perguntas do relatório de auditoria. Depois: rodada de correção e as notas abertas.
**Dados.** 9 commits do scaffold (o `new_project.py` os fez) + 16 do conform (com este); 51 notas aplicadas, 17 pendentes; `requirements_graph_check` e `product_structure_check` verdes; 39 aceites por histórico (regra do MJRP de 2026-10-18).
Session: local_a-executora-v0-conform

## [2026-10-28 12:34] review — crítica independente da arquitetura do v0: recorte em ordem (1 P0 de código, documentos corrigidos)

Nota CM-0011 (item `arch-critique`, arch-critique@1) pela `mjrp-critiquing-architecture`, em agente separado de quem escreveu os documentos. Relatório: `reports/audits/2026-10-28-mjrpalbumblender-v0-architecture-audit.md` (primeira passada 12:19: P0 3 · P1 10 · P2 5; segunda passada 12:31, depois da correção dos documentos: P0 1 · P1 11 · P2 5 · higiene 4; veredito «recorte em ordem»). `--check-note CM-0011` passa; `report_types_check.py` verde.
O P0 que resta (VT-06: o SDK do Firestore importado fora dos adaptadores — `PlaylistsService.js:17`, `stores/albums.js:9`, `SaveAllView.js:5-6`) é defeito de CÓDIGO, não de documento: o documento já diz a verdade e aponta o conserto; a regra (ADR-0017, `PRINCIPLES.md` §I.3) vale e o código fica como item de conserto aberto (`violates::`), sem emenda — o v0 está em produção e o código não é alterado neste conform.
[revisável] Nota de higiene do juiz aplicada: a constituição agora diz que o `localStorage` só passa pelo `StorageService` em `PlaylistsService` e `SeriesService`; o espelho do Spec Kit foi regenerado da fonte.
Decisões do humano levantadas pela crítica (vão como perguntas): quem escreve em `/albums` e `spotify_enrichment`; teto de 20 séries; alcance do §I.14 para o token do Spotify no `localStorage`; aceite da ADR-0018; aprovação do `tech-stack.md`; exceção para o P0 (o juiz recomenda não).

## [2026-10-28 12:33] review — doctor completo do v0: espelho da constituição regenerado; links legados e dependências não instaladas ficam registrados

O doctor (I5) reprovava `.specify/memory/constitution.md`: era uma segunda constituição escrita, sem o marcador «GERADO de docs/specs/constitution.md» (PRINCIPLES.md, Parte III: uma escrita e uma gerada). [revisável] Regenerada a partir de `docs/specs/constitution.md` com o marcador; a cópia anterior ficou em `_backups/specify-memory-constitution.md.20261028` — deriva de PRINCIPLES.md Parte III e `_doctor_kernel.py` (`i5_constitution_generated`). É documento de configuração do Spec Kit, não código do produto. Depois da regeneração o doctor diz «constitution: a cópia do SpecKit é gerada e bate com a fonte».
Também reportado e não corrigido (primeiro `doctor.py` completo do v0): (1) 327 erros I3 de link quebrado em documentos legados (`docs/archive` 211, `docs/manual` 69, `docs/technical/specs/archive` 33, `docs/debug` 7, outros) — dívida de documentação antiga do v0, dono: MJRP/sessão de docs, destrava com uma rodada de `mjrp-syncing-docs`; (2) A1: os três sensores do contrato (`npm run lint`, `npm test -- --run`, `npm run build`) «não executam» porque `node_modules` não existe — destrava com `npm ci` (instalação de dependências, não feita nesta sessão).

## [2026-10-28 12:32] decision — tela declarada e nomes de relatório: notas registradas — decidido pelo agente, revisável pelo MJRP

Notas CM-0006 (item `contract-screen`) e CM-0016, 0043, 0059, 0060, 0065 (item `report-names`, report-names@5); `--check-note` passa nas seis (as três do meio com o aviso de nome do parecer ao harness registrado como pergunta em `conformance.asked`).

`screen: [public/]` já estava no contrato (commit 55dd329). O aviso que restou do `report_types_check.py` é o do nome do parecer em `reports/harness-feedback/`: o `project_slug` do harness não aceita `_` na pasta do projeto (defeito do harness, não do v0); o parecer já está em `reports/harness-feedback/` e a pergunta/aviso ficou em `conformance.asked` com a hora da entrada do log de 12:10.

## [2026-10-28 12:32] decision — documentos de arquitetura corrigidos após a crítica independente — decidido pelo agente, revisável pelo MJRP

Rodada de correção da arquitetura: um juiz independente (a skill `mjrp-critiquing-architecture`, agente separado de quem escreveu) leu `arch.md`, `data-model.md`, `tech-stack.md`, `constitution.md` e as ADRs contra o código e achou documentos falsos em pontos que importam (relatório `reports/audits/2026-10-28-mjrpalbumblender-v0-architecture-audit.md`). O autor corrigiu os quatro documentos depois de reler no código as linhas citadas; as doze notas de arquitetura continuam passando.

[revisável] O projeto Firebase vivo é `mjrp-playlist-generator` (`firebase-config.js:3-10`, carregado por `index.html:111`); `mjrp-albums` é só o reserva de `firebase-init.js:6-13`.
[revisável] A fronteira do Firestore é descrita como o código a faz, apontando a regra violada (ADR-0017, `PRINCIPLES.md` §I.3) e o achado do relatório como conserto — a regra não foi dobrada para casar com o código (regra antes do código). A constituição passou a apontar para o relatório de auditoria no lugar do «relatório do conform» que não existia no repositório.
[revisável] `firestore.rules:35` (`albumRankings` aberto) e a escrita de qualquer login anônimo em `/albums` e `spotify_enrichment` entram em `arch.md` como fato; nenhum pipeline publica as regras (`firebase.json` sem bloco `firestore`).
[revisável] `data-model.md` diz que a migração convidado→usuário não roda (`UserSyncService.js:22`), o corte de 20 séries sem aviso e que `albumQueries` é regravado por inteiro.
Dívida de código (os itens `violates::` com fonte `arquivo:linha`) fica no relatório de auditoria, não nos documentos de arquitetura (Art. III da constituição).

## [2026-10-28 12:31] decision — requisitos do v0: 39 histórias entregues aceitas por histórico; o que não funciona virou história pendente — decidido pelo agente, revisável pelo MJRP

Notas dos itens `requirement-nodes` (CM-0037, CM-0067), `product-structure` (CM-0019, 0020, 0021, 0022, 0027, 0028, 0058, 0069, 0079, 0082 → product-structure@10) e `release-features` (CM-0074), pela `mjrp-writing-reqs` (pacote C1): `--check-note` passa em todas; `requirements_graph_check.py` e `product_structure_check.py` VERDES (187 nós, nenhuma regra violada; a tela conta 56 nós: 39 histórias entregues, 15 pendentes sem release, 2 NFR transversais).

[revisável] As 39 histórias entregues (S-01..S-39) nascem `Done` e `Accepted` com `accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"` — a regra vale: cada uma lista ao menos um `delivered_by` commit real (`git cat-file -t`) anterior ao commit 54fd54c que criou o contrato. Um só registro para as 39 histórias, não 39 linhas. O grafo imprime «39 aceites por histórico».
[revisável] Só o que funciona vira história entregue. O que o código tenta e não cumpre (excluir álbum do inventário chama método inexistente; desfazer/refazer sem botão; «carregar mais» sem handler; excluir playlist sem botão; Discovery Mode sem efeito; título da playlist sem persistência; `?seriesId=` ignorado em `/blend`; rotas de artista/gênero/faixas «em breve»; telas só por URL digitada) virou história `Backlog` sem release (S-40..S-54), com o ID do inventário e a linha. Fix não é nó de requisito neste grafo (o sensor só aceita `S-`, `UC-`, `EA-`, `NFR-`).
[revisável] Os itens do Sprint 24 viraram NFR-01 (testes ponta a ponta) e NFR-02 (desempenho com Lighthouse), ambos `Backlog` e transversais; as refatorações dos Sprints 17 a 19 são arquitetura e não viraram história de usuário.
[revisável] Release de cada história: a do ROADMAP legado para o sprint que a entrega; hashes repetidos entre histórias (por exemplo `c8be9fa` em S-09, S-14, S-15, S-21) porque o histórico do git (que só começa em 2025-11-22) não separa essas capacidades em commits.
[revisável] As histórias apontam para estados do `behavior.md` (sem `info-arch.md` nem protótipo, que não existem); quando o `info-arch.md` existir o estado de tela migra com o mesmo block ID.
Não foi criada feature de histórico: `feature_history_check.py` fica verde sem `docs/specs/milestones/` e o v0 não os tem; features de histórico por release seriam escolha do MJRP, não exigência do sensor.

## [2026-10-28 12:31] decision — comportamento transversal do v0 (behavior.md) escrito do inventário do código — decidido pelo agente, revisável pelo MJRP

Notas CM-0031 e CM-0049 (item `behavior`, behavior@2), pela `mjrp-writing-reqs` (pacote C1); `--check-note` passa.

`docs/specs/behavior.md` nasceu do modelo da skill dona com 113 estados com block ID em 10 superfícies (tela inicial, biblioteca, menu de mistura, playlists geradas, exportação, playlists guardadas, inventário, conta, mensagens do app, guardado no navegador). Cada linha traz o ID do inventário do V1 e o `arquivo:linha`.
[revisável] Só o que o código FAZ (fato lido): fonte `reports/audits/2026-10-27-mjrpalbumblender-v0-feature-inventory.md` do V1 (leitura estática, "confirmar ao vivo" onde o inventário marca).

## [2026-10-28 12:10] harness-feedback — três checks passam o modelo sem preencher; o slug do projeto não aceita sublinhado

O pacote B achou três pontos em que o check do harness deixa passar o que a skill dona não deixaria: (1) `constitution`, `arch` e `data-model` passam com o modelo ainda com colchetes (o check só pede o título); (2) o `tech-stack` aceita ADR em `Proposed` na coluna Decisão; (3) o `project_slug` do `report_types_check.py` não aceita `_`, então nenhum parecer neste projeto fica sem aviso de nome. Parecer em `reports/harness-feedback/2026-10-28-mjrpalbumblender-v0-checks-pass-untouched-templates.md` — vai ao harness, não é corrigido aqui (o agente não edita o check).
Nota CM-0013 (item `english-names`): `--check-note` passa (`docs/wiki/*.md` só tem `index.md`); registrada sem rodada.

## [2026-10-28 12:09] decision — ADRs 0015 a 0018 renomeadas para o padrão; ponteiros varridos — decidido pelo agente, revisável pelo MJRP

Notas CM-0012, 0024, 0076 e 0085 (item `adr-names`, adr-names@4), pela `mjrp-recording-decisions` (pacote B); `--check-note` passa nas quatro e o `--gaps` já não lista o item. As quatro ADRs (`adr-015…018`) viraram `0015-flavor-to-recipe.md`, `0016-service-layer-extraction.md`, `0017-pure-state-stores.md`, `0018-fine-grained-services.md` por `git mv`; só título (`# ADR-NNNN:`) e linha de status mudaram. Varredura `git grep -n -F` dos nomes antigos e de `ADR-015…018` corrigiu os ponteiros em `docs/ROADMAP.md:98`, `docs/manual/00_Dir_File_Structure_Map.md` (linhas 257, 258, 277-280), `proj-documentation-task.md` (281-282) e no corpo da 0017 (`ADR-016` → `ADR-0016`); nada mais acha os nomes antigos.

[revisável] Numeração 0015 a 0018 mantida (a que as ADRs já tinham) — deriva do molde `decision@3`.
[revisável] Status e data originais preservados (0015 APPROVED; 0016 e 0017 Accepted; 0018 Proposed; todas 2026-01-10) e nenhuma linha `**Acceptance**:` foi inventada: o `adr_header_check.py` isenta ADR de data anterior a 2026-10-26 e a CM-0085 manda não reescrever as antigas.
Aberto (classe b): a ADR-0018 segue `Proposed` — o aceite técnico é do tech lead (agente) ou do MJRP; pergunta no relatório de auditoria.

## [2026-10-28 12:09] decision — arquitetura, stack e modelo de dados do v0 escritos do código existente — decidido pelo agente, revisável pelo MJRP

Notas CM-0032, 0053, 0072 (item `arch`, arch@3), CM-0071 (item `tech-stack`) e CM-0033, 0054 (item `data-model`, data-model@2), pela `mjrp-designing-architecture` (pacote B); `--check-note` passa nas seis.

[revisável] `arch.md` descreve o que o código é e não traz lista de problemas (Art. III da constituição proíbe «Known Issues» em documento de arquitetura); desempenho e escala ficaram TBD por serem decisão de produto — fonte: mapa do V1 (Apêndices E, F §7, G §2).
[revisável] `tech-stack.md` (`status: Draft`): versões lidas de `package.json`, `server/package.json`, lockfiles, `Dockerfile` e do CI; a coluna Decisão fica `—` porque nenhuma ADR do v0 decide tecnologia. A aprovação como baseline é do MJRP (pergunta no relatório de auditoria).
[revisável] `data-model.md` segue o que o código grava (`albumQueries` etc.), não o que os manuais 05/32 desenham; campos que o mapa do V1 não leu por inteiro ficam TBD.
[revisável] Padrões de projeto citados com endereço: Store/Observer `DP-05`, Repository `DP-01`, Service `DP-12`, Strategy `DP-04`, Facade `DP-11`, Factory `DP-02`; Singleton, MVC e Command ficaram fora (o `DP-03` do catálogo diz evitar).
Fonte dos fatos de código: relatório do V1 `reports/audits/2026-10-27-mjrpalbumblender-v1-project-bootstrap-report.md` (juiz independente: passou).

## [2026-10-28 12:09] decision — constituição do v0: artigos aprovados mantidos; divergências do código viram conserto, não emenda — decidido pelo agente, revisável pelo MJRP

Notas CM-0030 e CM-0048 (item `constitution`, constitution@2), pela `mjrp-designing-architecture` (pacote B); `--check-note` passa. Antes do trabalho as duas já passavam com o esqueleto de colchetes (o check só pede o título), por isso o conteúdo foi conferido por leitura.

[revisável] Os artigos da constituição aprovada do v0 (`docs/CONSTITUTION.md`, v1.0.0, ratificada em 2025-12-10) ficam palavra por palavra, só na forma do modelo; a linha «Service Layer» duplicada no Art. II foi retirada; nos Art. I, IV e V entra uma linha «Relação com o harness» apontando para `PRINCIPLES.md` §I.8, §I.10 e §I.14 — versão segue 1.0.0.
[revisável] Regra antes do código: onde a constituição e o código divergem, a regra manda e o código vira item de conserto com `violates::` (lista no relatório de auditoria: Art. III × `DEBUG_LOG.md`, Art. II × Tailwind por CDN, Art. V × token escrito em script e regras abertas do Firestore, ADR-0017 × stores que chamam o Firestore). Nenhum artigo foi reescrito para casar com o código.

## [2026-10-28 12:09] decision — PRD do v0: épicos de histórico; a CM-0051 é satisfeita pela forma atual (prd@2) — decidido pelo agente, revisável pelo MJRP

Notas CM-0051 e CM-0077 (item `prd`, prd@2), pela `mjrp-coaching-pm` (pacote A). A CM-0077 passa; a CM-0051 reprova só no degrau antigo (`sem a seção ## Entregue`) e o próprio check diz «versão atual (prd@2): passou» — a CM-0077 proíbe a seção, então a nota é registrada como satisfeita pela forma atual e o PRD não foi editado para o formato mais velho (`conformance-notes.md`, passo 2 e `conform-mode`, passo 6).

[revisável] Oito épicos de histórico, um por área funcional entregue, cada um servindo um único resultado: EP-01 a EP-06 pela organização da própria documentação (`docs/MJRP_Album_Blender_Prod_Vision.md:23-36,44-50,58-77,80-87`); EP-07 (inventário) e EP-08 (conta e nuvem) tiveram stories entregues na R2 e precisavam de casa — colocação provisória, «decidido pelo agente, pendente do MJRP» (OUT-03 e OUT-01), com pergunta de confirmação no relatório de auditoria.
[revisável] Personas, regras de negócio, dependências e fora de escopo só dizem o que a documentação do v0 diz, com a fonte; riscos: «nenhum risco registrado» e os achados do V1 foram para Candidatos.
[revisável] O PRD ainda não embute stories: os requisitos entregues são o próximo pacote (`mjrp-writing-reqs`).

## [2026-10-28 12:09] decision — roadmap e releases do v0: resultados e marcos tirados da documentação legada — decidido pelo agente, revisável pelo MJRP

Notas do item `roadmap` (CM-0002, 0017, 0025, 0041, 0045 → roadmap@6) e do item `releases` (CM-0003, 0046, 0078 → releases@3), pela `mjrp-coaching-pm` (pacote A); `--check-note` passa nas oito.

[revisável] Cinco releases de histórico (R1 a R5) agrupam os Sprints 1 a 23 por data e tags `v*` do git — deriva de `docs/ROADMAP.md:22-281` e `git tag`; Sprint 24 e Sprint 22 não são release (são janelas de tempo).
[revisável] Quatro resultados permanentes (OUT-01 a OUT-04, em `## Now`) saem um a um da seção «Product Vision» do ROADMAP legado (`docs/ROADMAP.md:293-298`); OUT-05 (Next) é o Sprint 22 (`docs/ROADMAP.md:285-289`); Later é a «Long-Term Vision» (`docs/ROADMAP.md:300-305`) — nenhum resultado novo foi inventado.
[revisável] O Sprint 24 («QA & Stability») não virou resultado: saúde técnica é restrição, não resultado (`the-top-of-the-graph.md` da `mjrp-coaching-pm`); os itens vão para `## Candidatos (Intake)` do PRD, para virarem NFR e itens de conserto.
[revisável] Problema, «quem sente» e medida entram só quando a documentação do v0 os diz (com a fonte em comentário); o resto está marcado «a perguntar ao MJRP (P-NN)» — conteúdo de produto, classe c, perguntas no relatório de auditoria.
[revisável] Descrições das releases omitem o que o mapa do V1 mostra que não funciona (desfazer/refazer sem botão; excluir item do inventário) — deriva do inventário do V1 §1.6 e do mapa §2.D/§2.F.

## [2026-10-28 12:08] decision — visão do v0: campos citados da documentação; Visão e paleta ficam para o MJRP — decidido pelo agente, revisável pelo MJRP

Notas CM-0029 e CM-0047 (item `vision`, vision@2), executadas pela `mjrp-coaching-pm` (pacote A, Sonnet) e conferidas com `conformance_check.py --check-note`: as duas passam.

- Propósito, Objetivo, Como, Vibe e Design DNA do `VISION.md` são citação da documentação do v0 (`docs/MJRP_Album_Blender_Prod_Vision.md:11-15`, `README.md:3-6`, `docs/CONSTITUTION.md`), com a fonte em comentário no arquivo; só mudaram de forma.
- A Visão (WHERE) não está dita num lugar só: o campo ficou «a perguntar ao MJRP (P-01)» — pergunta no relatório de auditoria do conform (conteúdo de produto, classe c).
- O nome da paleta da Vibe também ficou para o MJRP (P-02).


## [2026-10-28 11:56] decision — v0 entra no harness como projeto brownfield; o fechado em produção nasce aceito — decidido pelo agente, revisável pelo MJRP

Contexto: decisão do MJRP de 2026-10-28 (confirmada por ele à orquestradora): o v0 do Album Blender (Vanilla JS, em produção) passa a ser projeto do harness; até 2026-10-27 era só fonte para a análise que alimenta o V1.

- [revisável] `new_project.py` rodou sem `--force` (`--profile code-app --process-level standard --ui --requirements-format story`, sensores do `package.json`: lint `npm run lint`, teste `npm test -- --run`, build `npm run build`) e só acrescentou 207 arquivos (nenhum existente alterado, apagado ou movido; código intocado) — deriva de a regra do MJRP de não sobrescrever e de «o código não se apaga nem se move».
- [revisável] `npm test` é o modo de observação do vitest; o contrato usa `npm test -- --run` para o sensor terminar — deriva de `package.json` scripts.test.
- [revisável] `screen:` do contrato declarado como `[public/]` (a tela mora em `public/index.html`, `public/css/`, `public/js/`); o valor do modelo (`web/src/`) não existe aqui — deriva de `public/` (código existente).
- [revisável] regras do MJRP de 2026-10-18 valem aqui: o que está fechado e em produção antes do commit que criou `.mjrp-project.yml` (54fd54c, 2026-10-28 11:52) nasce aceito, sem pedir aceite de histórico; o sensor visual não roda no fechado em produção — deriva de `docs/wiki/harness/conformance-notes.md` e da referência `legacy-history` da bootstrap.
- Todos os 19 ramos remotos (`backup-main-v1.6`, `prod-fixes`, `deploy-sa-helper`, `feature/*`, `fix/*`, `sprint-*`…) têm 0 commits que a `main` não tenha (`git rev-list --count origin/main..<ramo>`); das 70 tags, só `v2.7.0` tem 1 commit fora da `main` (f534ffc, 2025-12-15, CHANGELOG).
