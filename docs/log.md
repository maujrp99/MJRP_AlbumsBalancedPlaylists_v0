# log — o que aconteceu, em ordem

> **Append-only.** Uma entrada por bloco de trabalho, mais recente no topo, com prefixo parseável: `## [AAAA-MM-DD HH:MM] <tipo> — título`. Tipos: `session`, `decision` (o conteúdo mora na página do assunto em `docs/wiki/`, seção `## History`), `ingest`, `inventory`, `harness-feedback`, `review` (uma passada de crítica, com o caminho do relatório). Hora de Brasília, sempre. Ninguém lê este arquivo inteiro — consulta-se por data ou `grep`. Aqui fica só o **quando**; o que é verdade mora na wiki, o estado no `MEMORY.md`.


## [2026-11-19 23:39] session — a rolagem mantida em produção; `## Now` reescrito

- A correção da UAT-219 foi juntada na `main` (`0c0df5e`) e o site publicado (pacote `main-DLZf9BMM.js`).
- `MEMORY.md ## Now` reescrito com o estado de hoje: F71 fatia 1 e F73 em produção; F71 fatia 2 com um auxiliar; F72 à espera de prioridade; UAT-216 a UAT-218 abertas.

## [2026-11-19 23:38] session — F73: a tela redesenhada mantém a rolagem (UAT-219)

**Branch:** fix/f73-redraw-keeps-the-place

- `utils/keepField.js` guarda a rolagem da janela antes do redesenho e a repõe depois. No inventário, mudar o status não leva mais a lista ao topo. UAT-219 em `fixed`.

## [2026-11-19 23:37] session — F73 em produção; UAT-219 registrada (o inventário volta ao topo ao mudar o status)

- A F73 foi juntada na `main` (`0db59f6`) depois de o MJRP priorizá-la, e o site foi publicado. Quem tinha a aba aberta precisa recarregar uma vez: a guarda contra versão antiga só existe a partir desta publicação.
- O MJRP relatou: no inventário, mudar o status de um álbum leva a tela ao topo. UAT-219 aberta; entra na F73 como REQ-05 (é o mesmo redesenho inteiro da tela).

## [2026-11-19 23:34] session — F73: o campo em uso sobrevive ao redesenho; a aba antiga recarrega; a tela antiga de geração saiu; o inventário se solta

**Branch:** fix/f73-screens-keep-the-field

- Decisão de arquitetura (decidido pelo agente — revisável): três regras, cada uma num lugar só. `utils/keepField.js` devolve o campo em uso depois de um redesenho inteiro; `installStaleBuildGuard` protege todo arquivo pedido sob demanda, não só a troca de tela; a inscrição de uma tela numa loja vai em `this.subscriptions` da `BaseView`, com um teste de arquitetura que guarda isso.
- UAT-212 a UAT-215 em `fixed`. Prova: `reports/evidence/F73/2026-11-19-screens-keep-the-field-proof.md`.
- Fica de fora, anotado: a tela de playlists ainda se redesenha inteira a cada aviso das lojas; um clique no instante de um redesenho pode se perder.
- O MJRP exportou de verdade em produção para o Spotify (30 de 30 faixas) e para o Apple Music (na pasta da série): «sem o problema do campo funcionam os exports apple e spotify».

## [2026-11-19 23:34] review — reconferência visual de F56, F58, F60, F63, F65 e F70 por quem não implementou; três achados viram issues

- Relatórios: `reports/audits/2026-11-19-F56-visual-parity-recheck.md` e os de F58, F60, F63, F65 e F70, na mesma pasta. Feitos por um auxiliar que não implementou nenhuma das seis.
- Veredito: F56, F58, F65 e F70 passam. F60 e F63 reprovam sem P0; os três P1 viraram UAT-216 (playlists salvas no celular), UAT-217 («Blend your Albums» sem a série) e UAT-218 (barra do topo mais larga que a tela com o Spotify conectado).
- O que não foi conferido está dito em cada relatório: tudo que exigia gravar, apagar, gerar, sair ou conectar.
- F62: as exportações reais foram feitas pelo MJRP em produção («sem o problema do campo funcionam os exports apple e spotify»); a TASK-13 está marcada com essa prova.
- F73 pronta e provada no ramo `fix/f73-screens-keep-the-field`, sem commit: a trava de prioridade recusou («a F73 não está na Priorizada»). Fica à espera do MJRP, como a F72.

## [2026-11-19 23:29] session — UAT-212 a UAT-215 e F73 registradas: campo que perde o foco, exportar numa aba antiga, tela antiga de geração, inventário que não se solta

- O MJRP testou a exportação (F62) em produção e relatou: o «Batch Name» perde o foco ao digitar; depois os botões de exportar não respondem; recarregar sem salvar mostra uma tela antiga de geração.
- Causas lidas no código e vistas no navegador: a tela de playlists é redesenhada inteira a cada aviso de três lojas (UAT-212); a recarga por versão antiga só protege a troca de tela, e o site foi publicado enquanto ele testava (UAT-213); `/playlists` sem playlists ainda desenha as configurações antigas (UAT-214).
- Achado ao varrer os campos: a tela do inventário nunca se solta da loja e se desenha por cima de outra tela (UAT-215, aberta pelo agente).
- F73 criada na `main`, via rápida, conserto.

## [2026-11-19 23:22] session — F71 em produção; a F49 provada pelo MJRP em produção

- A F71 (primeira fatia) foi juntada na `main` (`63793a4`) e o site publicado: pacote `main-BfgCsm6G.js`. O servidor não mudou (`mjrp-proxy-00207-lhz`).
- O MJRP testou a F49 em produção: «f49: testando em prod, all good». O clique em «Load 3 more albums» mostrou os três álbuns restantes de uma série de 15, e o botão sumiu. A TASK-06 da F49 está marcada com essa prova.

## [2026-11-19 23:21] session — F71: provada no navegador e executada na conta do MJRP; ordem do inventário por artista e título

**Branch:** feat/f71-inventory-holds-every-album-of-my-series

- A ação «Add the albums of my series» rodou na conta do MJRP, a pedido dele: 23 álbuns antes (6 Owned, 16 Not Owned, 1 Wishlist), 188 acrescentados como Not Owned, 211 depois (6 / 204 / 1). Os 23 de antes ficaram iguais; a segunda execução não gravou nada. Prova: `reports/evidence/F71-inventory-holds-every-album-of-my-series/2026-11-19-browser-proof-and-owner-account-run.md`.
- Decidido pelo agente — revisável: a grade do inventário ordena por artista e depois por título (`public/js/models/inventorySort.js`); antes ordenava por um campo que os itens não têm. «1 album» no singular.
- O MJRP escolheu a opção A para a S-56 (2026-11-19): «opção A e to achando que o AVG rank nao faz sentido pra mim, poderia trocar por AVG Rating tb». O «Avg Rank» sai também do cartão do álbum e dá lugar ao «Avg Rating». É a segunda fatia da F71.

## [2026-11-19 23:13] session — F71: o manual diz o inventário como ficou

Branch: `feat/f71-inventory-holds-every-album-of-my-series`, depois do commit `c1f2821`.

As frases do manual que deixaram de ser verdade com a F71, corrigidas onde estavam, sem arquivo novo: `21_Dynamic_UI_Mapping.md` (seção 6: a situação por `models/inventoryStatus.js`, o filtro, as três contagens, a ação «Add the albums of my series» passo a passo), `14_Frontend_Components_Feature_Map.md` (inventário), `09_Frontend_Views.md` e `10_Frontend_Renderers.md` (cabeçalho, filtros, botão, cartão sem formato e sem preço), `11_Frontend_Components_Root.md` (a janela do álbum mostra o que é do item; «Not set» na janela de editar), `07_Frontend_Data_Infra.md` (`planSeriesAlbums`, `addAlbumsAsNotOwned`, `addBatch`, `createMany`) e `08_Frontend_Models.md` (os três modelos novos; `inventoryFromSeries.js` entre os que perguntam à regra de identidade). O commit do código também registrou, pelo gancho de status, o nó S-54 em «In progress».

## [2026-11-19 23:13] session — F45 a F70: tarefas provadas marcadas e declarações do passo retroativo; nenhuma feature fechada ainda, salvo a F53

Passada de limpeza dos `tasks.md` das F45 a F70 (menos a F66; F71 e F72 intocadas), sem tocar em código. Cada linha aberta foi decidida com prova: as provas do integrador com arquivo em `reports/evidence/` ou entrada do log foram marcadas (`rounds:: 1`, caminho da prova na linha; o que a prova diz «não visto» não foi mexido); as linhas de documentação foram marcadas quando conferidas no repositório; a conferência cruzada da spec e do plano foi feita por script. O que só diz «o MJRP julga ou aceita» saiu da lista de tarefas e foi para `## For the owner at UAT`, no fim de cada `tasks.md`. Nos `plan.md` das 19 features que fechariam, o `## Documents Consulted` ganhou a declaração de cada documento («atualizado» com o commit, ou «sem mudança» com o motivo), conferida no histórico de commits que citam a feature. Só a F53 passa no `retro_step_check` e fica `Done`. As outras 18 seguem `In Progress` com uma linha aberta (o passo retroativo): faltam «Prototype: none» dito pelo MJRP e o ok visual dele (ou o relatório de reconferência visual, nas features da trilha Agente). Também seguem abertas por falta real: F49 (clique do botão sem prova), F51 (protótipo fora do repositório), F52, F62, F64 e F69. Nenhum `Accepted`; `uat.md`, `MEMORY.md` e `ROADMAP.md` não foram tocados.

## [2026-11-19 23:12] session — F71 no ramo: uma regra para a situação do item, o filtro Owned / Not Owned / Wishlist e a ação «Add the albums of my series»

Branch: `feat/f71-inventory-holds-every-album-of-my-series` (da `main` em `2722d1d`). Auxiliar sem navegador e sem conta: nada rodou contra dados reais; a prova na tela e a execução na conta do MJRP são a TASK-10, do integrador.

**O que entrou.** (1) `models/inventoryStatus.js`: a situação de um item (Owned, Not Owned, Wishlist) dita num lugar só, sobre o campo `owned` de sempre (`true`, `null`, `false`), sem migração; o cartão, o filtro, os totais, a janela do álbum e o aviso da troca perguntam a ele. (2) O filtro de situação com «All», «Owned», «Not Owned», «Wishlist» e o cabeçalho com as três contagens (`models/inventoryFilter.js`). (3) A ação «Add the albums of my series», um botão na barra de filtros: lê as séries do banco, planeja contra o inventário do banco (`models/inventoryFromSeries.js`, função pura), pergunta com `dialogService.confirm` e grava pelo `InventoryService` e pelo `InventoryRepository.addBatch`, em partes de 100 (uma gravação por parte, `BaseRepository.createMany`), com o botão ocupado, o progresso e o fim dito como foi.

**Decisões do agente — revisáveis (2026-11-19), todas nas Open Questions do `spec.md` da F71.** A regra única da origem dos dados: o item feito pela ação leva o que a consulta da série leva (artista, título, ano, capa, id do Apple Music) e mais nada, tenha a tela de álbuns sido aberta ou não; nenhum álbum é carregado. «O mesmo álbum»: o mesmo id do Apple Music, o mesmo id de álbum do app, ou o primeiro nível da regra de identidade (`compareAlbumIdentity(...).same`); a mesma resposta passa a valer no «Add to Inventory» do cartão de um álbum. As três contagens do cabeçalho ignoram o filtro de situação. O cartão sem preço não mostra «$0.00» e o item sem formato não mostra «Unknown». A janela do álbum mostra a situação do item (dizia «OWNED» para todos) e nenhuma fora do inventário. Criar ou editar uma série **não** escreve no inventário: a ação é repetível, e o automático fica como pergunta para o MJRP.

**Dados.** Suíte: 2326 testes em 191 arquivos (eram 2219), build e lint limpos. Saíram da lista de complexidade `InventoryRepository.addAlbum` e `InventoryView.render`. `shared/albumIdentity.js` não mudou (versão 2); `models/inventoryFromSeries.js` entrou nos `CALL_SITES` do teste da regra. O doctor segue vermelho pelos mesmos cerca de 520 links de documentos arquivados; nenhum erro novo.

## [2026-11-19 23:11] decision — MJRP pede, na F71: o inventário mostra e ordena por «Avg Rank» (BEA) e «Avg Pop» (Spotify) (S-56)

Palavras do MJRP, com a captura das duas médias: «no inventory, na 71, pode usar as metricas do print e ter um filtro/ranking por BEA Avg rank e Spotify Avg Pop.?». Registrado na `main`: o requisito S-56 no épico EP-07, embutido no `prd.md`, e importado pela F71 como segunda fatia. A primeira fatia (álbuns das séries no inventário; filtro de situação) está em implementação; esta entra depois dela, feita na sessão principal ou por um auxiliar de modelo mais barato.

## [2026-11-19 23:07] session — UAT-211 em produção (site); em fixed

Site publicado da `main` (`946fc21`, pacote `main-DBBm8vch.js`). Em produção, a imagem do título servida tem o primeiro pixel transparente. Os nomes só aparecem com a conta do MJRP; não foram vistos pelo agente em produção (a regra e o `title` estão nos testes). UAT-211 em `fixed`, à espera do olhar do MJRP.

## [2026-11-19 23:06] session — UAT-211 consertada: título sem caixa e nomes inteiros na barra do topo (F63)

A imagem `TheAlbumBlender.png` tinha fundo preto opaco; o preto foi tirado de forma que, sobre preto, a imagem fique igual (diferença máxima de 10 em 255 por canal, o ruído do fundo). Os nomes da conta e do Spotify deixam o limite fixo de 80 px: 96 px em telas menores, 220 px em telas largas, e o nome inteiro em `title`. Teste primeiro: `test/components/TopBarNames.test.js`.

## [2026-11-19 23:05] session — UAT-211 aberta: barra do topo com retângulo atrás do título e nomes cortados (relato do MJRP)

O MJRP mandou uma captura da barra do topo: «um bug antigo pra arrumar, veja o print, qual o bug?». Leitura do agente: a imagem do título tem fundo preto opaco (aparece como caixa sobre a barra translúcida) e os dois nomes têm largura máxima de 80 px. Entra na F63 (Home e navegação), pela via rápida.

## [2026-11-19 22:51] decision — MJRP pede: a tela de séries diz quantos álbuns tem (S-55, F72); auxiliares de melhoria não precisam do modelo mais caro

Palavras do MJRP: «outra melhoria conseguimos colocar quantos albums estao na página de albuns series?» e «agora pra implementar essas melhorias creio que vc nao precisa passar para agents com modelos fable». Registrado na `main` antes do ramo: o requisito S-55 no épico EP-01, embutido no `prd.md`, e a feature F72 (via rápida, tipo feature, `^REL-40`). A F72 é feita pelo próprio integrador. O auxiliar da F71 já estava rodando quando a segunda frase chegou e termina como começou; daqui em diante, melhorias pequenas são feitas na sessão principal ou por um auxiliar de modelo mais barato.

## [2026-11-19 22:49] decision — MJRP pede uma melhoria: todos os álbuns das séries no inventário, como «Not Owned»; filtro Owned / Not Owned / Wishlist (S-54, F71)

Palavras do MJRP: «pode fazer um favor, registre uma melhoria, coloque todos os os albums que tenho na minha albums list como parte do meu inventory. tudo marcado como not owned, e melhore o filtro de status para Owned, Not Owned, Wishlist». Registrado na `main` antes de qualquer ramo: o requisito S-54 no épico EP-07, embutido no `prd.md`, e a feature F71 (via rápida, tipo feature, `^REL-40`).

## [2026-11-19 22:21] session — correção da contagem do fecho: 80 issues em fixed, 6 abertas

A entrada de fecho e o `## Now` diziam 79; a tabela de issues tem 80 em `fixed` e 6 abertas (UAT-17, 28, 61, 143, 193, 202). O `## Now` foi corrigido.

## [2026-11-19 22:21] session — fecho: a v5.0 em produção; 79 issues em fixed, 6 abertas com o MJRP

Branch: main
Session: sessão do V0 aberta pelo orquestrador do harness em 2026-11-19 («resolver todos os problemas do album blender»), continuada sob a dispensa do MJRP de 2026-11-19 19:03.

**Resumo.** Todas as features da v5.0 que dependiam do agente estão na `main` e em produção: site `fd9a0a1`, servidor `mjrp-proxy-00207-lhz` (publicado pela trava de lint; em produção, depois da última subida: depuração 404, 401 sem login, notas de «Nevermind» com login, «In the Court of the Crimson King» com página achada). A suíte tem 2219 testes; a build compila; `npx eslint .` termina com 0 erros.

**Decisões desta sessão (todas no log, com hora; as do agente são revisáveis).**
- MJRP: visitante não leva dados ao entrar com conta; sair da conta recarrega o app; servidor em Node 24; F52 ao código com a proposta emendada; o conserto do Scan na frente; «No Quarter» com afrouxamento e a F68 para rever as regras de identidade; a conformidade de 28/10 fica de lado; dispensa de bloqueio pelo processo.
- Agente: a resposta única da busca por IA entra no segundo nível da regra de identidade; a F68 passou na frente depois da varredura (16 de 199 álbuns sem página de notas; hoje 6, todos legítimos); a tabela de «escritas conhecidas»; aposentar as telas de ranking e de migração e a rota `/api/playlists`; os roteiros de navegador antigos saíram; erro do provedor de IA sai como 424; «não tem» da fonte vale 24 horas, «página sem notas» 7 dias; a ADR-0021 (Tailwind compilado) publicada como proposta; F67, F69 e F70 criadas na `main`; o Cloud Run não foi reconfigurado.

**Próxima sessão.** Começa pelo `## Now`: nada em andamento do lado do agente; as treze pendências do MJRP estão listadas lá, o aceite primeiro. Se ele pedir mais trabalho, os candidatos sem dono estão em «Pending on Agent».

**Dados.** Publicações do dia: mais de vinte do site e doze do servidor (revisões `mjrp-proxy-00196-sj7` a `mjrp-proxy-00207-lhz`). Dados de teste deixados na conta do MJRP: rankings em «Brothers In Arms» e «Rapture of the Deep»; os identificadores corrigidos de álbuns nas séries (F55) e os fatos das séries reescritos (F69) são efeito das features, não de teste. Nenhum push, nenhum carimbo de aceite, nenhuma senha digitada.

## [2026-11-19 22:18] review — segunda fatia da F58 e trava de lint em produção (site); UAT-18, 19, 20 em fixed

Site publicado da `main` (`fd9a0a1`, pacote `main-bsMs4i-z.js`), a primeira publicação que passou pela trava de lint. Prova em `reports/evidence/F58/2026-11-20-layers-and-lint-gate-proof.md`: arrastar uma faixa muda a ordem e o desfazer devolve; em produção as seis telas principais abrem sem erro. O servidor está sendo publicado (mudou só a escrita de expressões regulares, com teste antes e depois). Restam 6 issues abertas, todas dependentes do MJRP: UAT-17, 28, 202, 61, 143, 193.

## [2026-11-19 22:16] session — a trava de lint ligada (F64, UAT-20), pelo integrador

Com o ramo das camadas e o da F70 juntos, `npx eslint .` termina com 0 erros e 23 avisos. O passo `npx eslint . --quiet` entrou na automação do GitHub e nos dois roteiros de publicação, antes dos testes; um erro recusa a publicação. Manual 00 e o cabeçalho do `eslint.config.mjs` atualizados; TASK-13 da F64 fechada.

## [2026-11-19 22:15] review — F70 em produção (site) e provada; quatro issues em fixed

Site publicado da `main` (`88adbc4`, pacote `main-DDeTiHbR.js`); a F70 não muda o servidor. Prova em `reports/evidence/F70/2026-11-19-small-defects-proof.md`: em produção, como visitante, a busca de um artista de eletrônica não pede mais a lista da IA; o substituto de capa entra uma vez só. UAT-209 e UAT-210 só por teste, com a razão escrita. Em `fixed`: UAT-208, 209, 210, 63. Restam 9 issues abertas; auxiliar trabalhando nas UAT-18, 19 e 20.

## [2026-11-19 22:14] session — F64, fatia do lint: de 22 erros para 1; o portão não foi ligado (UAT-20)

Ramo `fix/f58-layers-and-lint-gate`. `npx eslint .` na `main` dava 22 erros e 78 avisos; agora dá 1 erro e 24 avisos. Consertados: 17 barras sem efeito em seis expressões regulares (com testes escritos e rodados antes da troca: `test/server/textCleaningPatterns.test.js`, `test/utils/NormalizationUtils.test.js`), a chave `Plus` duplicada dos ícones (ficou a que o app sempre desenhou), a `Promise` com função `async` do `AlbumLoader`, um `const` solto num `case` e um `catch` vazio; 54 avisos mecânicos (importações e variáveis sem uso, `catch (e)` sem leitura). O erro que resta é a chave `sorting` duplicada em `public/js/controllers/InventoryController.js:44`, arquivo do ramo `fix/f70-small-defects`: por isso o passo de lint **não** entrou na automação nem nos scripts de publicação. O que falta ligar está na TASK-13 da F64, com o texto do passo, que foi rodado fora da publicação e recusou com esse erro. Suíte: 2149 passando. Achados que não são mecânicos estão no plano da F64 (o botão de blend ligado sem álbuns, um `sort` que não ordena, títulos que perdem o número).

## [2026-11-19 22:12] session — F70: spec, plano e tarefas; comportamento e manual

Passo de documentos da via rápida, no mesmo ramo (`fix/f70-small-defects`): `spec.md` (quatro REQ, um por issue, com `verified_by::`), `plan.md` e `tasks.md` da F70 preenchidos, `status: In Progress`; fica aberta a tarefa da prova no navegador, do integrador. `docs/specs/behavior.md`: o visitante na busca de álbuns e na carga, «Mudar só o preço do item», «Notas de um álbum achado pela busca por IA» e «Capa que não há ou não carrega». Manual: `03`, `07`, `08`, `13`, `19`, `21`, `99` e o mapa de arquivos, nas frases que ficaram falsas (o site ignorava `data.ratings`; `updatePrice` no lugar errado) e nas três peças novas.

Não feito: status das issues em `docs/specs/uat.md` (é do integrador); `MEMORY.md`; publicação. O `doctor.py` segue vermelho por causas anteriores a este ramo (links de documentos antigos, o `## Now` do `MEMORY.md`, o lint).

## [2026-11-19 22:10] session — F70: a capa que falta ou falha tem um substituto, por uma peça só (UAT-63)

Confirmado no código: `components/ui/AlbumCardRenderer.js` `renderVisualHeader` punha o `src` vindo de `albumLoader.getArtworkUrl`, que pode ser nulo, sem substituto no erro; `views/renderers/DiscographyRenderer.js` apontava para `/assets/images/cover_placeholder.png`, arquivo que não existe; `Card.js` (inventário), `StagingAreaRenderer.js` e `ViewAlbumModal.js` tinham substituto só para o endereço ausente, nenhum para a falha; `AlbumCascade.js` tinha um `onerror` escrito no HTML.

Feito: `public/js/components/ui/coverImage.js` desenha toda capa de álbum. Sem endereço, ou com endereço que falha, a imagem mostra o mesmo substituto (SVG embutido), uma vez por imagem. A falha é ouvida por um ouvinte só, no documento (fase de captura), porque a maioria dos cartões é escrita na página como texto e um ouvinte na própria imagem se perderia; nenhum `onerror` no HTML. Usam a peça: cartão do álbum, cartão da busca, lista de escolhidos, cartão do inventário, cascata (blend e playlists guardadas) e janela do álbum.

Muda na tela, para o MJRP julgar: os quatro substitutos diferentes de antes (nota musical no inventário, «?» na lista de escolhidos, disco na janela do álbum, degradê com disco na cascata) viram um só. Fora da minha lista de arquivos, com edição mínima: `components/ui/Card.js` e `components/ViewAlbumModal.js`.

Testes: `test/components/ui/coverImage.test.js` (jsdom: sem endereço, evento `error`, uma vez só, cartão escrito como texto, cada lugar, e dois testes de arquitetura). Sem navegador nesta sessão: não visto na tela.

## [2026-11-19 22:10] session — F70: o app lê o que o servidor diz das notas de um álbum achado pela IA (UAT-210)

Confirmado no código. O enriquecedor de notas (`services/albums/adapters/enrichers.js`, `AcclaimEnricher`) confia no endereço da página que vem no álbum (`bestEverUrl`): com ele, responde «pronto» sem pedir; sem ele, pede `POST /api/enrich-album`. O servidor só manda esse endereço quando leu a página, então:
- `failed`, `not_asked`, `not_configured`, `not_found`: o álbum vinha sem o endereço e o app já pedia as notas pelo caminho normal. Para a falha, o defeito era teórico: uma falha nunca era gravada como «sem notas». Provado por teste.
- `no_ratings` (a página existe, sem nenhuma nota): o álbum vinha COM o endereço e o app o marcava como «pronto», com notas, sem ter nenhuma. Este era o defeito real, no sentido contrário ao descrito.

Feito: `public/js/models/ratingsOutcome.js` lê `data.ratings`; `api/client.js` `normalizeAlbumData` guarda o desfecho no álbum (`metadata.ratingsOutcome`) e só mantém o endereço da página quando o servidor disse `found` (ou não disse nada: servidor de antes da fatia 5). Nos outros casos vale a resposta do próprio pedido do app, com o motivo e a versão da regra de identidade que os prazos de confiança já usam. O enriquecedor não mudou. `normalizeAlbumData` foi dividida (complexidade 13 para menos de 10; saiu da lista de exceções).

Testes: `test/api/generateRatingsOutcome.test.js` (cliente, adaptador do catálogo, enriquecedor e carga reais, com a resposta montada pelo construtor do servidor); `test/api/siteAgainstGenerateWithRatings.test.js` reescrito (dizia que o app ignorava o campo). Nenhuma tela mostra o desfecho ainda. Decidido pelo agente — revisável: o `not_found` do `/api/generate` não é guardado, porque vem sem a versão da regra de identidade; o app pergunta de novo e guarda a resposta carimbada.

## [2026-11-19 22:10] session — F70: o preço do inventário mantém a moeda (UAT-209)

Confirmado no código: `controllers/InventoryController.js` `handleUpdatePrice` chamava `updatePrice(albumId, newPrice)` sem moeda. Efeito real, pior que o descrito: a tela ficava com `currency: undefined` e o repositório gravava o seu padrão, `USD`, qualquer que fosse a moeda do item (um item em BRL virava USD). O ramo `else` era inalcançável (o serviço lança na falha, nunca devolve falso), então a falha não mostrava aviso. A chave `sorting` estava escrita duas vezes no estado inicial.

Nenhuma tela chama `handleUpdatePrice` hoje: a janela de editar o item passa por `handleUpdateAlbum`, que manda preço e moeda juntos. O defeito existia no código e não era alcançável pela tela.

Feito no dono: `services/inventory/InventoryService.js` `updatePrice(albumId, newPrice, currency?)` usa a moeda do item quando nenhuma é dada, na tela e na gravação; item sem moeda não ganha uma inventada (só o preço é gravado); preço negativo é recusado antes de qualquer mudança; na falha, o item de antes volta. O controlador mostra «Price updated» ou «Failed to update price» e redesenha a partir da store nos dois casos.

Testes: `test/services/inventory/InventoryService.price.test.js` (repositório real sobre o Firestore de teste), `test/controllers/InventoryController.price.test.js`.

## [2026-11-19 22:09] session — F70: o visitante não pede rota paga (UAT-208)

Confirmado no código: `services/album-search/AlbumSearchService.js` pedia `POST /api/ai/studio-albums` para qualquer pessoa quando havia álbum eletrônico (`scanArtist`), e `api/client.js` `_fetchAlbumFromAPI` pedia `POST /api/generate`; o servidor recusa o convidado com 403 (`server/lib/auth/requireUser.js`). Na carga de álbuns o 403 não segura a carga (só o 401 segura, `api/serverResult.js` `holdOf`): o álbum já terminava como «não achado», depois de um pedido recusado.

Feito: `public/js/api/paidRoutes.js` é o lugar único que diz quem pode usar as rotas pagas (`mayUsePaidRoutes()`, lido do mesmo login que o `serverFetch` envia); os dois chamadores perguntam antes de chamar. Visitante: a busca não pede a lista da IA e devolve `reclassified: null` (o status mostra só «→ artista»); a segunda fonte não é pedida e o álbum termina como não achado no catálogo, com o aviso que já existe. Sem login conhecido, a chamada segue e o 401 do servidor segura a carga, como antes. `_fetchAlbumFromAPI` foi dividida (complexidade 13 para menos de 10; saiu da lista de exceções).

Testes: `test/api/paidRoutes.test.js` (a regra, os dois chamadores sem nenhum pedido de rede, e dois testes de arquitetura: quem nomeia uma rota paga importa `paidRoutes.js`; ninguém mais lê `isAnonymous` para decidir). Decidido pelo agente — revisável: com `PAID_ROUTES_ALLOW_ANONYMOUS=true` no servidor (não é o caso da produção), o app continua sem pedir para o visitante.

## [2026-11-19 22:05] session — F58 fatia 2, parte 2: o serviço das playlists montado num lugar só; nada importa o `app.js` (UAT-19)

Ramo `fix/f58-layers-and-lint-gate`. `services/playlists/playlistsWiring.js` entrega ao `PlaylistsService` o banco, o cache e quem está na conta; `PlaylistsController`, `BlendingController`, `PlaylistsDragHandler`, `SavedPlaylistsController` e `PlaylistsView` pedem a ele. O controlador das playlists não cria mais o `PlaylistRepository` (pede `findBatch`) e o `app.js` não exporta nada. As três listas de `test/architecture/layerBoundaries.test.js` estão vazias, com três regras novas. As suítes da F60 e da F62 passam sem mudança de expectativa (só a preparação mudou: o que era simulado no `app.js` é simulado no `firebase-init.js`); `test/services/playlists/playlistsWiring.test.js` é novo. Suíte: 2104 passando (2085 antes). Sem navegador: o arrasto de faixa e a ordem de importação ficam para a prova do integrador (TASK-20 da F58). Com este commit entram o `arch.md`, os manuais e a spec, o plano e as tarefas da segunda fatia da F58 (REQ-07 e REQ-08).

## [2026-11-19 22:02] session — F58 fatia 2, parte 1: a última loja que alcançava o banco virou serviço (UAT-18)

Ramo `fix/f58-layers-and-lint-gate`. `public/js/stores/SpotifyEnrichmentStore.js` deixou de existir: o que o app guarda das respostas do Spotify é o serviço `services/spotify/StoredSpotifyPopularity.js` («o que já temos deste álbum?» e «guarde isto»), montado em `spotifyPopularityWiring.js` sobre o `SpotifyEnrichmentRepository`. A coleção `spotify_enrichment`, o nome do documento e os campos são os de antes: os nove casos de `test/services/spotify/StoredSpotifyPopularity.test.js` passaram primeiro contra a loja antiga, depois contra o serviço. A lista de lojas que alcançam o banco em `test/architecture/layerBoundaries.test.js` ficou vazia. Saíram com o arquivo os métodos que ninguém chamava (a remoção de órfãos na leitura, `hasValidEnrichment`, `delete`, `getCount`). A regra de confiança não mudou: um registro gravado antes da regra de identidade segue aceito por 30 dias. As três lojas acima de 150 linhas foram julgadas uma a uma: são só estado e seletores; `albums.js` perdeu dois apelidos sem uso (171 para 162). O `arch.md`, os manuais e a spec da F58 entram com a parte 2.

## [2026-11-19 21:56] review — UAT-101 e UAT-75 conferidas no navegador; em fixed

A triagem dizia «não acontece mais, falta um olhar no navegador». Visto: a lista de séries tem as 48 opções 1,1 s depois da primeira carga; não existe mais selo «PENDING». A UAT-143 (filtro «Studio» com singles de eletrônica) fica aberta para o julgamento do MJRP com artistas reais. Restam 13 issues abertas.

## [2026-11-19 21:55] session — F52 fatia 5 em produção (servidor); UAT-181 em fixed

Servidor publicado da `main` (`b9e94d6`, revisão `mjrp-proxy-00206-47c`; volta `mjrp-proxy-00205-mg4`). Em produção: `/api/generate` 401 sem login; com login, uma busca paga de verdade respondeu 200 em 37,8 s, e a linha `generate` do registro traz o desfecho das notas por fonte (`acclaim: found`). A busca de álbum por IA foi vista funcionando: UAT-181 em `fixed`, junto com a UAT-23. Com isso a F52 fica sem fatia pendente. Auxiliares trabalhando: F70 (defeitos pequenos) e a segunda fatia das camadas com a trava de lint (`fix/f58-layers-and-lint-gate`).

## [2026-11-19 21:53] decision — F70 criada: defeitos pequenos achados no caminho (decidido pelo agente — revisável)

Feature de via rápida, `^REL-40`, conserta as UAT-208 (visitante pede rota paga), UAT-209 (preço do inventário sem moeda), UAT-210 (o app ignora o desfecho das notas na busca por IA), abertas agora, e a UAT-63 (capa sem substituto). Criada na `main` antes de qualquer ramo. O resto das UAT-18, 19 e 20 segue nas features donas (F58, F64), numa segunda fatia.

## [2026-11-19 21:52] review — F52 fatia 5 provada pelo integrador no servidor local; UAT-23 em fixed

Prova em `reports/evidence/F52/2026-11-19-slice-5-generate-path-proof.md`: a resposta de `/api/generate` passa a dizer, fonte por fonte, o que aconteceu com as notas; falha da fonte não sai mais igual a «não tem»; o servidor não sobe sem o arquivo de instruções da IA. `fetchRankingForAlbum` foi de complexidade 139 para menos de 8. Mudanças do auxiliar que ficam, revisáveis: uma consolidação que quebra responde 500 (antes, 200 com ranking vazio); o servidor não sobe sem o validador de álbum.

## [2026-11-19 21:55] session — F52 fatia 5: a `main` (com a F65) trazida para o ramo

A `main` andou enquanto a fatia 5 era feita: a F65 entrou (`7be0701`) e removeu `server/scripts/**`, `server/test/**`, `server/routes/playlists.js` e `shared/curation.js`. Trazida para `fix/f52-slice-5-generate-path-tells-the-truth` com um encontro só, numa frase de `docs/manual/23_Shared_Code.md` (ficaram as duas coisas: quem importa `shared/normalize.js` hoje e a nota da F65). O teste de complexidade pediu, e as 13 linhas dos arquivos removidos saíram das listas novas: ficam 14 funções do servidor acima de 10 (eram 26 no começo da fatia) e nenhuma em `shared/` (eram 9, todas do `curation.js`). O plano e a seção 13 do `arch.md` dizem os números de agora. Depois de juntar: `npx vitest run` com 2073 testes verdes, `npx vite build` compila, e os arquivos da fatia passam no ESLint da F65 sem erro.

## [2026-11-19 21:51] session — F65 e o conserto da aba antiga (F64, UAT-207) em produção

Site publicado duas vezes da `main`: `7be0701` (F65) e `9424320` (UAT-207; pacote `main-C1NCAuzH.js`). Servidor publicado com a F65 (revisão `mjrp-proxy-00205-mg4`; volta `mjrp-proxy-00204-pt4`): `POST /api/playlists` responde 404. Prova da UAT-207: no navegador local, um arquivo de tela inexistente fez a página recarregar uma vez; na segunda vez, dentro do minuto de guarda, apareceu «This screen could not be loaded» com o botão «Load the new version», sem laço. Em produção, `/`, `/home`, `/index.html` e `/saved-playlists` respondem `cache-control: no-cache`; os arquivos de `/assets` seguem com `max-age=3600`. UAT-207 em `fixed`.

## [2026-11-19 21:49] session — UAT-207 aberta e consertada: aba aberta antes de uma publicação (F64)

Na conferência de produção da F65, uma aba com a versão anterior mostrou «View Error» ao abrir as playlists guardadas: os arquivos das telas carregadas sob demanda mudam de nome a cada publicação, e a página era guardada pelo navegador por uma hora. Conserto em dois lugares: o roteador reconhece o arquivo que sumiu e carrega a versão nova uma vez (`utils/staleBuild.js`, com guarda contra repetição); o `firebase.json` passa a mandar `Cache-Control: no-cache` para a página. Testes primeiro: `test/utils/staleBuild.test.js`, `test/router.staleBuild.test.js`, `test/architecture/hostingServesFreshPage.test.js`. Entra na F64 (um caminho só para publicar).

## [2026-11-19 21:48] session — F52 fatia 5: documentos no ramo (spec, plano, tarefas, arch, manual)

No ramo `fix/f52-slice-5-generate-path-tells-the-truth`: `spec.md` (a fatia 5, REQ-11 a REQ-16, cada um com `verified_by`; as cinco mudanças de comportamento declaradas; três perguntas abertas: o que o app faz com `data.ratings`, o prazo de 75 s, o álbum pago que se perde quando o próprio servidor quebra depois dele), `plan.md` (seção «Fatia 5»: o desenho da esteira, as decisões e as alternativas, a tabela de todo `catch` do servidor com o estado de cada um, os riscos, o plano de testes), `tasks.md` (TASK-26 a TASK-35 fechadas; TASK-36 aberta para o integrador: prova local, publicação e leitura do log), `docs/specs/arch.md` (seção 13 da F52; o item 5 da seção 12 marcado como feito) e o manual (`02_Server_Structure.md`, `03_Backend_API_Layer.md` e `04_Backend_Logic_Services.md` reescritos onde falavam do caminho; frases corrigidas em `00_Dir_File_Structure_Map`, `01`, `05`, `23`, `32` e `99`). Corrigido de passagem no manual: a página 02 dizia que um álbum reprovado no esquema respondia 422; responde 424 desde a fatia 1.

Para quem juntar: a F65 remove `server/scripts/**` e `shared/curation.js`, que estão nas listas de complexidade novas (4 e 9 linhas em `test/architecture/complexityAllowlist.js`); o teste pede que as linhas saiam junto com os arquivos. O `doctor.py` segue vermelho pelos mesmos erros de antes (links de documentos antigos); o único que mudou é o do `MEMORY.md` (`## Now` mais velho que o log), que é do integrador: este ramo não toca o `MEMORY.md`.

## [2026-11-19 21:47] review — F65 provada pelo integrador; cinco issues em fixed

Dezessete endereços abertos no navegador sem erro nem arquivo faltando; as três telas aposentadas caem na Home. 143 arquivos removidos. Prova em `reports/evidence/F65/2026-11-19-remove-what-nothing-uses-proof.md`. Em `fixed`: UAT-203, 21, 10, 11, 30. UAT-17, UAT-20 e UAT-19 diminuíram e seguem abertas. Decisão do auxiliar que fica, revisável: os roteiros de navegador (`test/e2e`) saíram inteiros, com a dependência `puppeteer` (um commit reversível, `fd1cbea`).

## [2026-11-19 21:44] session — F65: provada numa cópia limpa do ramo (npm ci, suíte, build, servidor de desenvolvimento)

No ramo `fix/f65-remove-what-nothing-uses`, sobre o commit `6f047d7`. Feita a prova que os roteiros de publicação fazem: o commit exportado com `git archive` para uma pasta fora do repositório (sem `.git`, sem `node_modules`), `npm ci` de verdade (395 pacotes; nem `puppeteer` nem `jsonwebtoken` instalados), `npx vitest run` com 1945 testes passando em 162 arquivos (a busca de segredos lê a pasta quando não há git) e `npx vite build` compilando. Na mesma cópia, o servidor de desenvolvimento (`npx vite`, noutra porta) respondeu 200 para a página, `/js/app.js`, o worker da busca e um módulo importado por `@shared`: tirar `public/package.json` e o atalho `public/js/shared` não o quebra. O servidor, numa cópia da árvore juntada com a F69: `/_health` 200, `/api/playlists` 404, `/api/enrich-album`, `/api/generate` e `/api/ai/studio-albums` 401 sem login, `/api/musickit-status` 200. O `plan.md`, o `tasks.md` e o `spec.md` da F65 registram essas provas. Continua sem prova: nenhuma tela aberta num navegador.

## [2026-11-19 21:42] session — F65: spec, plano, tarefas, arquitetura, modelo de dados, stack e manual escritos no ramo

No ramo `fix/f65-remove-what-nothing-uses`. A pasta da F65 preenchida para o que foi construído: `spec.md` (`status: In Progress`; 7 REQ, todos com `verified_by`; em `fixes` entram UAT-10, UAT-11 e UAT-30, ao lado de UAT-203, UAT-21 e UAT-29), `plan.md` (o grafo e as entradas; o que saiu por grupo, com arquivos e linhas; o que a triagem listava e ficou; a prova do servidor; os `package.json`; a medição do ESLint por regra; a lista das classes sem regra, com arquivo e linha; os achados não mexidos; os dois roteiros de prova do integrador) e `tasks.md` (14 tarefas; abertas a prova no navegador, do integrador, e o julgamento do MJRP). `docs/specs/arch.md`: seção nova «O que nada usa saiu, e dois sensores que seguram isso (F65)» e as linhas que citavam o que saiu (15 rotas, sem `playlists` no servidor, sem a curadoria, quatro arquivos importando o `app.js`, duas linhas da tabela das regras do banco sem nenhum código que as use). `docs/specs/data-model.md` e `docs/specs/tech-stack.md` em dia. `docs/specs/behavior.md` não mudou: nenhum estado descrevia as telas retiradas. Manual: 108 linhas que citam arquivo removido marcadas («removed in F65», com o nome do arquivo), e as páginas 01, 02, 03, 05, 07, 11, 17, 18, 19, 24, 31 e 99 reescritas onde descreviam o que saiu; `docs/onboarding/UX_UI.md` e `QA_ENGINEER.md` e o `regression_checklist.md` também. Dois comentários de código que citavam módulo removido (`utils/FilterUtils.js`, `services/albums/clearAlbumCaches.js`). Não tocados: `docs/specs/uat.md`, `MEMORY.md`, `ROADMAP.md`, `docs/specs/priority.md`, `firestore.rules`. Fica para o integrador: a `docs/specs/constitution.md` ainda cita os testes de navegador em Puppeteer (tem cópia gerada e não foi emendada aqui). O doctor fica em 523 erros (tinha 524 na `main`). Suíte: 1945 testes passando em 162 arquivos; `npx vite build` compila.

## [2026-11-19 21:40] session — F52 fatia 5: o caminho de `/api/generate` diz a verdade (código e testes, no ramo)

Ramo `fix/f52-slice-5-generate-path-tells-the-truth` (o que faltava da UAT-23), teste antes do código. **O ranking de um álbum vira uma esteira de fontes** (`server/lib/fetchRanking.js` e `server/lib/rankingSources/`): BestEverAlbums, depois a popularidade do Spotify (só quando a página não lista faixas ou tem poucas notas), depois a IA (só quando nenhuma das duas deu o ranking do álbum inteiro). Cada fonte termina num desfecho com nome (`found`, `not_found`, `no_ratings`, `not_configured`, `failed`, `not_asked`); a escolha do que vira o ranking e a consolidação (`server/lib/ranking.js`) são passos puros. **O álbum responde o que houve com as notas:** `POST /api/generate` segue respondendo o álbum quando o álbum foi achado, e agora `data.ratings` diz, fonte por fonte (`acclaim`, `popularity`, `aiRanking`), se «não tem» ou se «não deu para perguntar». **Prompts:** o arquivo ausente, ilegível ou sem um dos dois prompts faz o servidor não subir (`loadPrompts` lança; `server/index.js` carrega na partida, uma linha); uma rota sem o prompt responde `internal`. O validador do álbum (`ajv`) também deixa de virar «validação desligada». **Prazo:** 75 s no total (o app espera 90 s); o provedor que não responde o álbum nesse tempo é `upstream_timeout`; a fonte de notas que ainda roda quando o tempo acaba fica `failed` e o álbum sai, porque já foi pago. **Log:** uma linha `generate` por pedido (resposta, status, tempo, desfecho de cada fonte; nada da pessoa nem do álbum).

Complexidade: `fetchRankingForAlbum` 139, `_albumFromResponse` 65 e `consolidateRanking` 49 saíram da conta (nenhuma função do que foi escrito passa de 10; a maior tem 8). Dois testes de arquitetura novos: nenhum `catch` vazio em `server/` fora de uma lista com motivo (3 entradas) e nenhum `catch` que só escreve no log no caminho de `/api/generate` e de `/api/enrich-album`; o limite de complexidade passa a valer no servidor e em `shared/`, com listas que só encolhem (18 e 9; eram 26 e 9). Suíte: 2061 testes; `npx vite build` compila.

Mudanças de comportamento além da pedida, decididas pelo agente — revisáveis: (1) no caminho em que o Spotify ganha de uma página com poucas notas, o raspador era perguntado duas vezes e o endereço da página se perdia; agora é perguntado uma vez e `bestEverUrl` vem preenchido; (2) uma consolidação que quebra (defeito nosso) respondia 200 com ranking vazio e a pilha do erro no corpo; agora vai para o caminho de erro da rota (`internal`); (3) `fetchRankingDebug` deixa de levar mensagens das fontes: uma linha por fonte, com desfecho e código. Números decididos sem medir: 75 s de prazo. Provado num servidor de verdade, numa cópia local, com um substituto da IA na própria máquina (nenhuma chamada paga) e o BestEverAlbums inalcançável: 200 com `ratings: { acclaim: "failed", popularity: "not_configured", aiRanking: "found" }`, 424 no 402 do provedor, e o servidor não sobe sem o arquivo de prompts. O app não mudou nesta fatia; não foi publicado.

## [2026-11-19 21:32] session — F65 junto com a `main` (F69 dentro): dois encontros, suíte verde

A `main` andou enquanto a F65 era feita (a F69 entrou, `6ae9940`); trazida para o ramo `fix/f65-remove-what-nothing-uses`. Dois encontros. `public/js/views/helpers/SeriesGridHelper.js`: a F69 o editou e a F65 o tinha removido por nada o importar; conferido de novo na árvore juntada (nenhum arquivo o importa) e mantida a remoção. `test/architecture/complexityAllowlist.js`: a F69 tirou as duas linhas do `SpotifyEnrichmentHelper` e a F65 as três da migração; saem as cinco. Depois de juntar: o grafo não acha módulo morto, `npx vitest run` com 1945 testes passando em 162 arquivos, `npx vite build` compila. Nenhum arquivo da F69 foi editado aqui.

## [2026-11-19 21:31] session — F65: classes de estilo sem regra levantadas; sai a regra que perdeu o último uso

No ramo `fix/f65-remove-what-nothing-uses`. Levantadas as classes escritas em `public/js` e em `public/index.html` que não têm regra no CSS construído (o pacote do Vite mais `public/css/modals.css`): 105 no ramo (eram 123 na `main`; 24 saíram junto com os arquivos removidos, entre elas todas as do Font Awesome, `fa-*`, `fas`, `fab`). A lista, com arquivo e linha, agrupada, vai no `plan.md` da F65; nada foi reestilizado (sem navegador). No sentido contrário, 23 classes têm regra em `public/css` e nenhum arquivo do app as escreve; só uma perdeu o último uso neste ramo, `.text-accent-secondary` (usada só pela tela de ranking retirada), e a regra dela sai de `public/css/modals.css`. As outras 22 já não tinham uso na `main` e ficam listadas. Suíte: 1881 testes passando; `npx vite build` compila.

## [2026-11-19 21:27] session — F65: o ESLint passa a verificar cada parte do código como o que ela é (UAT-20, em parte)

No ramo `fix/f65-remove-what-nothing-uses`. `eslint.config.mjs` ganha a lista do que não é verificado (`dist/`, `_archive/`, `_backups/`, `node_modules/`, `public/js/vendor/`, as cópias do harness, as pastas sem código do app) e um bloco por tipo de código: navegador para `public/js` (com `MusicKit`), worker para `public/js/workers`, navegador e Node para `shared`, CommonJS de Node para `server`, Node para `scripts` e os arquivos de configuração, Node com jsdom e os globais do Vitest para `test`. O `.eslintrc.json` da raiz sai (o ESLint 9 não o lê). Medido com `npx eslint .`: na `main` (cópia limpa, configuração antiga) 63 erros e 521 avisos em 531 arquivos, 377 deles `no-undef` por falta de globais; no ramo, com a configuração nova, 25 erros e 91 avisos em 411 arquivos. O que resta, por regra: `no-unused-vars` 89 (aviso), `no-useless-escape` 17, `no-empty` 3, `no-dupe-keys` 2 (`components/Icons.js:100` «Plus» e `controllers/InventoryController.js:44` «sorting»: a segunda chave vence a primeira), `no-case-declarations` 1, `no-async-promise-executor` 1 (`services/AlbumLoader.js:21`), `no-dupe-else-if` 1 (`server/lib/normalize.js:234`: um ramo que nunca roda), `no-undef` 1 e uma diretiva `eslint-disable` sem uso. O `no-undef` é defeito de verdade, anotado e não consertado: em `server/lib/fetchRanking.js` o comentário antes de `normalizeRating` não fecha, a função fica dentro do comentário e `mergeRankingEvidence` (linha 72) a chama; hoje nada chama `mergeRankingEvidence`. Consertado, por ser mecânico e em arquivo já tocado: quatro importações sem uso em `components/TopNav.js` e a importação sem uso do `axios` em `api/client.js` (o pacote do site não muda de tamanho: a build já deixava o `axios` de fora). O lint não entra na CI nem nos roteiros de publicação: ainda tem 25 erros. Suíte: 1881 testes passando; `npx vite build` compila.

## [2026-11-19 21:25] session — F65: teste de arquitetura que reprova módulo que nenhuma entrada alcança (UAT-203)

No ramo `fix/f65-remove-what-nothing-uses`. `test/architecture/noDeadModules.test.js` (12 casos): todo módulo de `public/js`, `shared` e `server` tem de ser alcançado, pelo grafo de importações, a partir de `public/index.html` ou de `server/index.js` (ou de um arquivo que os scripts do `package.json` e os roteiros de `scripts/` passem a nomear); toda folha de estilo de `public/css` também; nenhum arquivo alcançado importa arquivo que não existe; nenhuma importação com nome montado em tempo de execução. Teste não conta como uso. Uma exceção, com o motivo escrito: `public/js/firebase-config.example.js` (modelo copiado à mão), e a lista de exceções reprova linha que sobrou. Conferido por mutação: com a importação do `Footer` comentada no `app.js`, o teste acusa `public/js/components/Footer.js`; desfeita, passa. Hoje: 252 arquivos alcançados, nenhum módulo morto. A ferramenta deixa de pular pastas chamadas `test` ou `tests` dentro das pastas vigiadas (um arquivo de teste posto ali é vigiado como os outros). Suíte: 1881 testes passando em 156 arquivos; `npx vite build` compila.

## [2026-11-19 21:22] session — F52 fatia 5: o que o caminho de `/api/generate` faz hoje fica preso em teste, antes de mexer

Ramo `fix/f52-slice-5-generate-path-tells-the-truth`, da ponta da `main` (`6ae9940`). Antes de reescrever `fetchRankingForAlbum` (complexidade 139), `consolidateRanking` (49) e `GenerationService._albumFromResponse` (65), 52 testes de caracterização prendem o que elas fazem hoje, com as fontes trocadas por dublês (sem rede, sem chamada paga): `test/server/rankingPipeline.test.js` (que fonte é perguntada e em que ordem: BestEverAlbums, popularidade do Spotify, IA; o que sai em cada caminho), `test/server/rankingConsolidation.test.js` (a consolidação, passo puro) e `test/server/generateAlbumAnswer.test.js` (o álbum que a rota responde, com as notas nas faixas). Três testes dizem «TODAY» no nome: prendem o que esta fatia vai mudar de propósito (arquivo de prompts sem o prompt de ranking lido como «sem ranking»; o raspador perguntado duas vezes no caminho em que o Spotify ganha, com o endereço da página perdido; a consolidação que quebra respondida como álbum sem ranking). O `doctor.py` já estava vermelho na `main` (524 erros de link em documentos antigos); nada desta entrada mexe nisso.

## [2026-11-19 21:21] session — F65: páginas fora da build, testes que nenhum comando roda e dependências sem uso saem

No ramo `fix/f65-remove-what-nothing-uses`. Saem de `public/` o que a build não inclui e nada serve (o Vite só constrói `public/index.html`, e o roteiro de publicação só copia `js/firebase-config.js`, `css/`, `assets/` e `favicon.ico`): `debug-curator.html`, `debug-svg-generator.html`, `static_prototype_v3.html`, `typography-preview.html`, `404.html` (o `firebase.json` não a usa: toda rota cai no `index.html`), `legacy/**`, `_api.main.js`, `config.js` (um arquivo vazio que pedia para ser apagado), `package.json` (repetia o `"type": "module"` da raiz) e o atalho `public/js/shared` (o app importa por `@shared`). Saem os testes que nenhum comando roda: `tests/` (dois roteiros caseiros, fora do `include` do Vitest), `test/scripts/**` (oito roteiros soltos; três chamavam o provedor de IA) e `test/e2e/**` com as dez capturas de tela. Sobre o `test/e2e`: 4 dos 17 elementos que os roteiros procuram não existem mais (`#albumsGrid`, `#albumsList`, `#albumList`, `#debugPanel`) e o link `/playlists` do menu também não; não foram rodados aqui (sem navegador). Decidido pelo agente, revisável: saem inteiros, com os scripts `test:e2e` do `package.json` e o `puppeteer`; a prova no navegador do projeto é a do integrador (AGENTS.md, passo 4). `package.json` da raiz: descrição em dia; entram `espree` e `postcss` (usados pelos testes de arquitetura e não declarados), nas versões que o `package-lock.json` já resolvia; saem `puppeteer` e `jsonwebtoken`. O `dotenv` fica: `server/lib/services/spotifyPopularity.js`, que os testes da raiz carregam, o pede ao carregar. `package-lock.json` refeito só no arquivo, numa cópia fora do repositório: 70 pacotes saem, nenhum entra nem muda de versão; `npm ci --dry-run` aceita. `README.md` e `.github/workflows/ci.yml` deixam de citar o que saiu. Suíte: 1869 testes passando em 155 arquivos; `npx vite build` compila. Achado, não mexido: em `public/assets` há cerca de 44 MB que o app não carrega e que vão para o site a cada publicação (`data/albums-curated.json`, `data/albums-expanded-backup.json` e dez imagens).

## [2026-11-19 21:17] session — F65: busca de segredos vira teste; os scripts com o token do Discogs e os geradores sem uso saem (UAT-17)

No ramo `fix/f65-remove-what-nothing-uses`. Teste novo, `test/security/noSecretsInRepo.test.js`, com a busca em `test/security/support/secretScan.js`: lê todo arquivo de texto que o git acompanha e acusa credencial escrita (valor longo atribuído a nome com token, secret, key ou password; `Authorization: Discogs token=…` e `Bearer …` literais; chave privada com conteúdo; chaves de formato conhecido). Diz arquivo, linha e regra; nunca o valor. Rodado antes da remoção: vermelho em `scripts/generate-dataset.js:8` e `scripts/fetch-missing-artists.js:12`, e só neles. Depois: verde. Um valor na lista de públicos, com o motivo: a configuração web do Firebase em `public/js/firebase-config.js`. Saem de `scripts/` os dezesseis arquivos que nada roda (treze geradores e roteiros de dados, entre eles os dois com o token do Discogs, e três arquivos de dados deles); ficam os dois roteiros de publicação, `lib/`, `start-local.sh` e `stop-local.sh`. Saem da raiz `reproduce_match.js`, `sort_test.html`, `restart_dev.sh` (o `scripts/start-local.sh` faz o mesmo) e `.flatten_ts`. O token do Discogs continua no histórico do git: trocá-lo no site do Discogs é do MJRP (UAT-17). Com os geradores sai a receita que montou os arquivos de `public/assets/data`; os arquivos ficam, e a receita está no histórico. Suíte: 1869 testes passando em 155 arquivos; `npx vite build` compila.

## [2026-11-19 21:15] session — F69 em produção (site e servidor)

Site publicado da `main` (`8425964`, pacote `main-DIgppRDb.js`), depois o servidor (revisão `mjrp-proxy-00204-pt4`; volta `mjrp-proxy-00203-lwg`). Conferido em produção: rotas de depuração 404, 401 sem login, notas de «Nevermind» com login (In Bloom 89). A parte do servidor da F69 (a popularidade do Spotify como fonte reserva do ranking em `/api/generate`) não foi exercitada. Auxiliares trabalhando: F65 e a fatia 5 da F52.

## [2026-11-19 21:14] session — F65: a rota /api/playlists, shared/curation.js e o código morto do servidor saem (UAT-21)

No ramo `fix/f65-remove-what-nothing-uses`. Conferido antes de tirar: nada vivo importa `shared/curation.js` nem o que ele exporta (`CurationEngine`, `curateAlbums`); o blend do app usa os algoritmos de `public/js/algorithms`, que não o tocam. Saem a rota `POST /api/playlists` (`server/routes/playlists.js`, com a montagem e a guarda dela no `server/index.js`), `shared/curation.js` (517 linhas) e, no cliente, `generatePlaylists` e `normalizePlaylists` de `public/js/api/client.js`. Saem `server/scripts/**` (onze roteiros de depuração, um HTML, um PNG e um JSON), `server/search_debug.html` e `.png`, e as quatro configurações de lint e formatação do servidor que nada rodava (`.eslintrc.json`, `.eslintignore`, `.prettierrc`, `eslint.config.js`). **UAT-21:** `server/test/` sai inteiro: três arquivos importavam `public/js/curation.js`, que não existe; `run-tests.js` chamava o site de notas de verdade; dois eram do Jest, que nenhum comando rodava. O que era verdadeiro neles e roda sem rede foi para `test/server/answerParsing.test.js` (7 casos: o texto da resposta da IA e a consolidação das posições), dentro do `npx vitest run`; ficaram de fora o esquema do álbum (a raiz instala outra versão maior do `ajv`) e a página de notas (o `cheerio` é só do servidor). `server/package.json`: saem os scripts `lint`, `lint:fix`, `format`, os sete pacotes de desenvolvimento e o bloco do Jest; `test` passa a rodar `npx vitest run test/server` da raiz. `server/package-lock.json` refeito só no arquivo (`npm install --package-lock-only`): os 123 pacotes de produção ficam nas mesmas versões e com a mesma assinatura, os 517 de desenvolvimento saem. Provado numa cópia fora do repositório: `npm ci --omit=dev` instala 123 pacotes, o servidor sobe sem variável nenhuma, `/_health` responde 200, `/api/playlists` 404, `/api/enrich-album` e `/api/generate` 401 sem login; os dois módulos de `shared/` carregam. Suíte: 1858 testes passando em 154 arquivos; `npx vite build` compila. Uma linha sai da lista de funções acima do limite (`api/client.js`).

## [2026-11-19 21:13] review — F69 provada pelo integrador; UAT-206 em fixed

Conectado, a sessão vencida do Spotify foi renovada sozinha e a popularidade veio para os cinco álbuns (o «Core» incluído). Sem as chaves, um álbum sem popularidade guardada ficou `not-connected`, sem nenhum pedido ao Spotify. Prova em `reports/evidence/F69/2026-11-19-spotify-popularity-outcomes-proof.md`. A UAT-28 (chaves no navegador) fica aberta com a análise no `plan.md` da F69: três caminhos, recomendação de aprovar o padrão na constituição agora.

## [2026-11-19 21:11] session — F65: as duas telas de ranking por endereço e a tela de migração saem (UAT-10, UAT-11, UAT-30)

No ramo `fix/f65-remove-what-nothing-uses`, cumprindo a decisão registrada em 2026-11-19 21:03 (do agente, revisável; o código fica no histórico do git). Saem as rotas `/ranking/:albumId`, `/consolidated-ranking` e `/save-all` do `app.js`, com as telas `views/RankingView.js`, `views/ConsolidatedRankingView.js` e `views/SaveAllView.js`. Com a rota da migração saem `migration/MigrationUtility.js` e `repositories/AlbumRepository.js` (o grafo mostrou que só a migração os usava) e o código «Data Sync» do `components/TopNav.js` (`needsMigration`, `renderDataSyncLink`, `handleDataSync`, os dois ouvintes de botões que nunca eram desenhados); o `app.js` deixa de montar um utilitário de migração para o menu. O `components/Breadcrumb.js` perde o ramo de `/ranking`. Nenhum componente ficou órfão com a saída das telas de ranking: tudo o que elas usavam é usado por outra tela. Testes: saem os das duas telas (`ConsolidatedRankingView`, `SaveAllView`) e o caso do link de fonte da tela de ranking no teste de endereços de fora; o caso do caminho de navegação no teste de texto de fora passa a usar `/playlists`. Quatro linhas saem da lista de funções acima do limite de complexidade (três da migração e `TopNav.attachListeners`, que ficou dentro do limite). Suíte: 1851 testes passando em 153 arquivos; `npx vite build` compila. Sem navegador nesta sessão: abrir cada tela fica para o integrador.

## [2026-11-19 21:10] session — F69: documentos no ramo (spec, plano, tarefas, arch, behavior, manual) e a análise da UAT-28

No ramo `fix/f69-spotify-popularity-failure`: `spec.md` (8 REQ, cada um com `verified_by`), `plan.md` (o diagnóstico com arquivo, o desenho, as linhas tocadas nos arquivos da F58, a análise da UAT-28 com três caminhos e a recomendação: aprovar o padrão na constituição com a ameaça reduzida agora, corretor de chaves no servidor se o app passar a ter mais contas; o armazenamento não mudou) e `tasks.md` (11 fechadas; abertas: a prova no navegador pelo integrador, a publicação do servidor e o julgamento do MJRP). `arch.md` ganhou a seção «A popularidade do Spotify tem três desfechos (F69)»; `behavior.md`, cinco estados; o manual, as frases que ficaram falsas (`00`, `04`, `06`, `08`, `16`, `17`, `19`, `29`, `32`). Um teste a mais para `sourceOutcome`. Suíte: 1933 testes verdes; `vite build` compila. Para o MJRP julgar: seis mudanças de comportamento nas Open Questions do `spec.md`.

## [2026-11-19 21:09] session — F65: grafo de importações e saída dos módulos de public/js que nada alcança

Ramo `fix/f65-remove-what-nothing-uses`, saído da `main` em `2f9215b`. Ferramenta nova, `test/architecture/support/importGraph.js`: lê as importações de cada arquivo (estáticas, dinâmicas, `require`, `?worker`, as páginas HTML e o `@import` do CSS) e anda a partir das entradas (`public/index.html`, `server/index.js` e o que os scripts do `package.json` e os roteiros de `scripts/` nomeiam); teste não conta como uso. Na `main` ela aponta 49 módulos que nenhuma entrada alcança (4.998 linhas): 37 em `public/js` e 12 no servidor. Saem neste commit os 36 de `public/js` (fica o `firebase-config.example.js`, que é o modelo de configuração): oito algoritmos antigos, `cache/albumCache.js`, `repositories/SharedAlbumRepository.js`, `components/Autocomplete.js`, `services/PlaylistPersistenceService.js`, os geradores de SVG, os modelos `Playlist` e `Series` e os componentes soltos. Saem também dois que o grafo não acusa: `public/js/tests/TrackTransformerTest.js` (um roteiro de console, fora da suíte) e `views/playlists/PlaylistsDragDrop.js` (alcançado só por um arquivo de reexportação, e a função dele ninguém chama). Com eles: o teste do `SharedAlbumRepository`, dois casos do teste de texto de fora (peças removidas), 18 linhas da lista de funções acima do limite de complexidade e duas da lista dos que importam o `app.js` (sobram 4). Suíte: 1862 testes passando em 155 arquivos (eram 1869 em 156); `npx vite build` compila. Sem navegador nesta sessão.

## [2026-11-19 21:05] session — F69: a `main` (com a F58) trazida para o ramo

A `main` andou enquanto a F69 era feita (F58: `_publishSource` passou a ler `sourceOutcome`, a espera virou `LoadHold`). Trazida para `fix/f69-spotify-popularity-failure` com um conflito só, em `AlbumLoadService._publishSource`: ficou a versão da F58, e o «não conectado» passou a ser decidido em `models/albumSourceAsk.js` (`sourceOutcome` devolve `note: null`, e `_publishSource` só guarda quando há `note`). Três funções saíram da lista de complexidade acima de 10 (`applyEnrichmentToAlbum`, `applySpotifyData`, `describeQuery`). Suíte: 1931 testes verdes; `vite build` compila.

## [2026-11-19 21:03] session — F69: a popularidade do Spotify com três desfechos (código e testes, no ramo)

Ramo `fix/f69-spotify-popularity-failure` (UAT-206), teste antes do código. A popularidade de um álbum deixa de terminar sempre em «sem dado»: o Spotify não tem o álbum é `empty` com motivo (`not_found`, guardado 24 horas e só enquanto valer a versão da regra de identidade que o decidiu); a consulta que falhou é `failed`, nunca guardada; sem sessão do Spotify é `not-connected`, estado novo, que não é guardado nem escrito nos fatos da série. Um caminho só pergunta ao Spotify (`services/albums/adapters/spotifyPopularitySource.js`, atrás do `PopularityEnricher`); o laço de fundo `SpotifyEnrichmentService` saiu e o botão «Enrich Data» passou a pedir pela carga (`refreshSource`). Ao conectar, as fontes «não conectado» dos álbuns na tela são pedidas pela fila, sem recarregar álbum. O 429 do Spotify com espera de até 30 s segura a popularidade (`HoldReason.SPOTIFY_BUSY`); acima disso, ou sem tempo dito, é falha. O gêmeo do servidor (`server/lib/services/spotifyPopularity.js`, alcançado por `POST /api/generate`) passou ao contrato da F52: falha é `UpstreamError`.

Números decididos pelo agente — revisáveis: 24 horas de confiança para «o Spotify não tem este álbum» (o mesmo `EMPTY_TRUST.not_found` das notas); 30 s como a maior espera do Spotify que a carga segura (`MAX_SPOTIFY_HOLD_MS`, o mesmo teto que a exportação espera). Não foi visto num navegador nem publicado; o servidor só se prova publicando.

## [2026-11-19 21:03] review — triagem das 26 issues abertas contra o código de hoje; sete passam a fixed

Relatório em `reports/audits/2026-11-19-mjrpalbumblender-v0-open-issues-triage.md`. Em `fixed`, por já não acontecerem no código (com a feature que resolveu): UAT-31, 62, 73, 84, 152, 22, 29. Ficam abertas com «um olhar no navegador» pendente: UAT-75, 101, 143. Decidido pelo agente — revisável, sob a dispensa do MJRP: a F65 aposenta as duas telas de ranking alcançáveis só por endereço (UAT-10) e a tela de migração (UAT-11), remove a rota `/api/playlists` do servidor (sem tráfego em 30 dias) e os scripts com o token do Discogs; o código fica no histórico do git. Trocar o token no Discogs continua sendo do MJRP.

## [2026-11-19 20:52] session — F58 em produção (site)

Site publicado da `main` (`ec69407`, pacote `main-Bt2pCXey.js`). Em produção, como visitante: a Home abre, a busca de «Kendrick Lamar» mostra Studio (10) com «To Pimp a Butterfly», sem erro novo no console. Anotado, sem dono: um visitante ainda chega a pedir a lista da IA (rota paga) e recebe 403; o app devia nem pedir. Auxiliar trabalhando: F69.

## [2026-11-19 20:51] review — F58 provada pelo integrador; UAT-194 e UAT-14 em fixed

Carga de álbuns com zero funções acima do limite; o app caiu de 97 para 80 com a F57 e a F62 juntas. No navegador nada mudou (álbuns, blend, inventário, tela de migração, console limpo). Prova em `reports/evidence/F58/2026-11-19-load-service-within-the-limit-proof.md`. UAT-18 e UAT-19 ficam abertas: diminuíram, e o resto está em listas que só encolhem. Pergunta para o MJRP: o limite de 10 vira artigo da constituição?

## [2026-11-19 20:50] session — F58 junto com a `main`: a lista das funções acima do limite encolhe de 94 para 80

A F57 e a F62, que entraram na `main` enquanto a F58 era feita, trouxeram 14 funções para dentro do limite de complexidade (ou as retiraram). O teste de limite pediu, e as 14 linhas saíram da lista.

## [2026-11-19 20:48] session — F58: o limite de complexidade vira teste; spec, plano, tarefas, arch.md, ADR-0019 e manual em dia

No ramo `fix/f58-load-service-within-the-limit`. `test/architecture/complexityLimit.test.js` roda a regra `complexity` do ESLint (limite 10): na carga de álbuns sem exceção (0 acima de 10); no resto de `public/js` contra `test/architecture/complexityAllowlist.js`, a lista das 94 funções que passam de 10 hoje, com o número de cada uma e quem pode baixá-la (43 no código que a F62 segura, 10 no da F57, 3 da migração, 38 sem feature). A lista só diminui: função nova acima de 10, função que piorou e função consertada que ficou na lista reprovam; conferido por mutação. Medição: 136 funções acima de 10 antes, 133 depois (`public/js` 97 para 94, `vendor/` 4, `shared/` 9, `server/` 26). Documentos: `spec.md` (`status: In Progress`, REQ-01 a REQ-06 com `verified_by`), `plan.md` (o diagnóstico das quatro issues com arquivo e linha, as costuras, a tabela medida inteira), `tasks.md` (15 tarefas; aberta a prova no navegador, do integrador, e o julgamento do MJRP), `docs/specs/arch.md` (seção nova «O serviço de carga dentro do limite de complexidade (F58)»: onde a espera mora e como o `AlbumAsks` fica sabendo dela; a seção de direção das dependências reescrita para hoje), o texto da ADR-0019 e as páginas 01, 07, 10, 11, 14, 21, 23 e 99 do manual. Decidido pelo agente — revisável: o que resta da UAT-18 e da UAT-19 está no código do blend e das playlists e ficou numa lista em vez de consertado aqui. Pendências que não são deste ramo: o `doctor.py` segue vermelho (links antigos, `MEMORY.md`, lint) e a ADR-0019 já passava do teto de 6.000 caracteres antes desta edição (8.054; agora 8.567).

## [2026-11-19 20:47] session — F57 e F62 em produção (site)

Duas publicações do site da `main`: `b73b159` (F57: um seletor de álbum e um classificador; UAT-185 `fixed`) e `4f022d8` (F62: receitas, exportações, desfazer e refazer, título; sete issues `fixed`; pacote `main-CY7jC6wt.js`). Nenhuma muda o servidor. Auxiliar trabalhando: F58. A F69 começa agora.

## [2026-11-19 20:46] review — F62 provada pelo integrador no que não exporta; sete issues em fixed

Prova em `reports/evidence/F62/2026-11-19-blend-and-export-proof.md`: desfazer e refazer, apagar playlist, título editado que fica, caminho da tela, sem «Discovery Mode». As duas exportações (Spotify e Apple Music) só passaram em teste de unidade: prová-las cria playlists de verdade nas contas do MJRP, e isso fica para ele. Em `fixed`: UAT-200, 02, 03, 04, 08, 09, 190. Mudanças de comportamento para o MJRP julgar estão nas Open Questions do `spec.md` da F62 (dez itens).

## [2026-11-19 20:44] review — F57 provada pelo integrador; UAT-185 em fixed

Home e edição de série mostram os mesmos seis filtros, as mesmas contagens e os mesmos cartões para «Kendrick Lamar»; os dois álbuns que caíam em «?» estão em Studio. Prova em `reports/evidence/F57/2026-11-19-one-picker-one-classifier-proof.md`. A UAT-193 fica aberta: a metade das playlists (gerar e editar) é da F62. Mudanças de comportamento para o MJRP julgar estão nas Open Questions do `spec.md` da F57 (álbum eletrônico sem lista da IA aparece em Studio; «gold», «definitive» e «complete» não marcam mais coletânea; a busca da edição de série ficou igual à da Home).

## [2026-11-19 20:43] session — F62 junto com a `main`: um encontro nas importações do SpotifyService

A `main` andou enquanto a F62 era feita (F49 e F68 entraram, `50e7b2e`); juntada ao ramo `fix/f62-blend-and-export-do-what-they-say`. Um encontro só, em `public/js/services/SpotifyService.js`, nas linhas de importação: a F68 trocou `NormalizationUtils` por `titleWithoutEditionNotes` e a F62 acrescentou os erros com nome do Spotify; ficaram as duas coisas. Depois de juntar: `npx vitest run` com 1661 testes passando em 140 arquivos (a F62 sozinha tinha 1512 sobre os 1394 de partida), `npx vite build` compila.

## [2026-11-19 20:42] session — F62: spec, plano, tarefas, comportamento e manual escritos no ramo

Ramo `fix/f62-blend-and-export-do-what-they-say`. A pasta da F62 preenchida para o que foi construído: 10 REQ com `verified_by` (nenhuma das sete issues estava consertada por inteiro pelo trabalho do dia; a tabela «ainda existia?» traz arquivo e linha da `main` em `c9aaa7a`), 14 tarefas, abertas a prova no navegador (do integrador, com o que pede conta real do Spotify e da Apple Music separado do que não pede) e o julgamento do MJRP (nove mudanças de comportamento e os textos novos, nas Open Questions da spec). `docs/specs/behavior.md`: 14 estados reescritos e 8 novos. Manual: 00, 07, 10, 11 (4.2), 14, 15, 17, 18, 21 (3 e 4), 31 e 99. Decisões do agente, revisáveis, registradas na spec: «Discovery Mode» retirado; sem ranking da pessoa, a ordem do álbum; não duplicar na Apple pelo id lembrado na visita; guardar zera o desfazer. O doctor fica nos 521 erros que já tinha.

## [2026-11-19 20:41] session — F57 junto com a `main` (F68 dentro): sem conflito, suíte verde

A `main` andou enquanto a F57 era feita (F68, regras de identidade, em produção). Juntada ao ramo `fix/f57-one-album-picker-and-one-classifier` sem conflito (o git juntou sozinho `docs/log.md`, `docs/specs/arch.md`, `docs/specs/behavior.md` e `docs/manual/10_Frontend_Renderers.md`). Suíte: 1647 testes passando; `vite build` compila. A F57 não toca na regra de identidade nem em `AlbumSearchService.search`.

## [2026-11-19 20:40] session — F57: spec, plano, tarefas, arquitetura, comportamento e manual escritos no ramo

A pasta da F57 preenchida para o que foi construído (`status: In Progress`; 8 REQ, todos com `verified_by`; 12 tarefas, 10 fechadas; abertas a prova no navegador, do integrador, e o julgamento do MJRP). O plano traz o mapa dos dois fluxos antigos (Home e janela «Edit Series») de ponta a ponta com arquivo e linha, a tabela das 14 diferenças com a resposta a «precisam ser diferentes?» (só uma precisa: o destino da escolha), a causa da UAT-185 passo a passo e o que falta unificar (um quadro de tela único, que pede navegador). `docs/specs/arch.md`: seção nova «Uma peça só para escolher álbuns e um classificador só (F57)». `docs/specs/behavior.md`: dez estados reescritos e três novos (`^album-type-one-classifier`, `^series-edit-album-picker`, `^series-edit-saving`). Manual: `00`, `01`, `10`, `14`, `15`, `16`, `21`, `22` (as seções do classificador reescritas) e `29`. Não tocados: `docs/specs/uat.md`, `MEMORY.md`, `ROADMAP.md`, `docs/specs/priority.md`. Fica para o integrador: a linha do padrão Strategy em `docs/specs/constitution.md` ainda cita a pasta `classification/`, que saiu (a constituição tem cópia gerada e não foi emendada aqui).

## [2026-11-19 20:39] session — F62: funções tocadas dentro do limite de complexidade

Conferida a complexidade das funções novas e tocadas da F62 com `npx eslint --no-config-lookup --rule '{"complexity":["error",10]}'`: nenhuma função nova passa de 10. Quatro tocadas passavam ou passaram a passar e foram extraídas, sem mudar o que fazem: `RegeneratePanel.render` (11, agora com `_recipeToShow`), a comparação do `BEARankingStrategy` (12, agora uma cadeia de três comparadores pequenos), `PlaylistsService.restoreDraft` (15, agora com `_draftFor`) e `PlaylistsView.renderContent` (13, agora com `shownBatchNameOf` e `savedBatchNameOf`). O fim de `_writeCurrentBatch` foi para `_showSaved`; a função continua em 13, como a F60 a deixou, sem ramo novo. Ficaram acima do limite, tocadas sem ramo novo: `TopNAlgorithm.generate` (22; saiu um `console.log`) e o enriquecimento de faixa do `BalancedRankingStrategy` (30; uma atribuição dentro de um `if` que já existia). São da F58.

## [2026-11-19 20:39] session — F57: um classificador só e uma peça só para escolher álbuns (UAT-185, UAT-193)

Ramo `fix/f57-one-album-picker-and-one-classifier`, por um auxiliar sem navegador. **Causa da UAT-185, reproduzida em teste:** o classificador tinha duas definições de «eletrônico»; a larga procurava por pedaço de palavra e tem «hardcore», e o catálogo dá a «To Pimp a Butterfly» e a «good kid, m.A.A.d city» o gênero «Hardcore Rap»; o portão de gênero os tratava como eletrônicos, a definição estreita não deixava consultar a lista da IA, e o álbum saía sem resposta («?»). Em `albums-curated.json`, 508 álbuns estavam no mesmo buraco (JAY-Z, Nas, Eminem, 2Pac…). **O conserto é de desenho:** `models/albumType.js`, uma função pura que devolve tipo e motivo; o gênero deixou de ser portão e só diz se a lista da IA é evidência; «eletrônico» por nome inteiro de gênero; palavras do título só inteiras. **A peça:** `components/album-picker/AlbumPickerController.js` é a busca de artista da Home e da janela «Edit Series» (mesmo estado da F67, mesmos seis filtros, mesmo cartão, mesmo caminho `scanArtist` com prazo); as telas diferem só em `onPick`. Salvar a edição tem estado (`models/seriesDraft.js`): botão ocupado, sem gravação em dobro, falha dita na janela com a lista mantida. Saíram `SearchController.js`, `ArtistScanner.js`, `AlbumTypeClassifier.js`, a pasta `classification/`, `EditionFilter.js`, `types.js`, `getArtistDiscography`, e os dois arquivos de `components/search/` que ninguém importava (o teste de texto de fora passa a provar o cartão da busca). Função de aptidão nova: `test/architecture/oneAlbumPicker.test.js`. Suíte: 1521 testes (1417 antes); `vite build` compila. Decidido pelo agente — revisável: álbum eletrônico sem a lista da IA aparece em «Studio» (antes, «?»); «gold», «definitive» e «complete» deixam de marcar coletânea; «Live in» no começo do título marca ao vivo; a regra do «Hello World N» virou regra geral (número sobrando não casa com a lista). Nada visto num navegador.

## [2026-11-19 20:39] session — F58: um Firebase só, lojas de inventário e de usuário viram estado puro, a tela não importa o banco (UAT-14, UAT-18, UAT-19)

No ramo `fix/f58-load-service-within-the-limit`. **UAT-14:** só restava `views/SaveAllView.js:5-6`, que importava o SDK 11.6.1 do Firebase por CDN (um segundo Firebase, sem app iniciado). A tela de migração passa a receber da rota (`app.js`) o utilitário de migração, feito com o Firestore único do app, e quem está logado; não importa Firebase nenhum. A tela continua sem caminho pelo menu (UAT-11, decisão do MJRP pendente): foi feito o mínimo correto. Teste: `test/architecture/firestoreBehindRepositories.test.js`. **UAT-18:** `stores/inventory.js` e `stores/UserStore.js` viram estado puro; ler e gravar o inventário é do `services/inventory/InventoryService.js` (montado em `inventoryWiring.js`), ouvir o login é do `services/auth/UserSessionService.js` (montado em `userSession.js`, importado pelo `app.js`); as estatísticas do inventário viram regra pura (`models/inventoryStats.js`). **UAT-19:** `SeriesView`, `SeriesEventHandler` e `TopNav` não importam mais o banco nem o `app.js`; o ciclo `app.js` ↔ `stores/inventory.js` acabou. O que resta das duas (a loja do Spotify, o controlador e as telas de playlists e do blend) está em código do ramo da F62 e ficou numa lista que só pode diminuir, em `test/architecture/layerBoundaries.test.js`. Sem navegador nesta sessão.

## [2026-11-19 20:33] session — F62: exportar para a Apple Music avisa a falha e não duplica

Exportar para a Apple Music (UAT-200), no ramo `fix/f62-blend-and-export-do-what-they-say`. **Falha calada:** o erro ao criar uma playlist ia só para o console, e a tela chamava a exportação sem passar o botão, que por isso nunca era desabilitado nem mostrava progresso. **Duas vezes:** nada impedia o segundo clique, durante ou depois. Agora a regra mora em `services/AppleMusicExportService.js`, que devolve um relato (criadas, recusadas com o motivo, sem nenhuma faixa achada, faixas não achadas, pasta feita ou não), e a tela diz esse relato em avisos de 12 s. Um clique com a exportação em curso não cria nada e avisa. O que foi criado nesta sessão não é criado de novo: fica lembrado o id que a Apple devolveu por playlist (nome, faixas e ordem), no mesmo `exportLedger` do Spotify. **Escolha, do agente:** lembrar o id na sessão, e não conferir a biblioteca, porque lá o nome não é único e a playlist recém-criada demora a aparecer na lista, o que falharia justamente no segundo clique; o limite é que um recarregar da página zera a lembrança. Saiu `handleExportToSpotify` de `PlaylistsExport.js`, sem uso e com os mesmos defeitos.

## [2026-11-19 20:32] session — F58: a espera do servidor vira estado da loja de carga; o pedido por fonte ganha regras puras (UAT-194)

No ramo `fix/f58-load-service-within-the-limit`. Medição de hoje com a regra `complexity` do ESLint (limite 10) em `public/js`, `shared` e `server`: 136 funções acima de 10; na pasta da carga só duas, `_holdFor` (12) e `_enrichOne` (12), as duas de `AlbumLoadService.js`. Extraído: (1) a espera («entre na conta», «aguarde», «fonte ocupada») sai do serviço para `services/albums/LoadHold.js`, com as regras em funções puras (`models/albumLoadHold.js`), e passa a ser estado da `AlbumLoadStore` (`setHold`/`getHold`); o `AlbumAsks` deixou de olhar a cada segundo e aprende da espera pela assinatura da loja, com um prazo único só enquanto há espera (`holdWait` em `models/albumAsk.js`). (2) o pedido por fonte: `models/albumSourceAsk.js` (`awaitsSource`, `overNewestAlbum`, `sourceOutcome`) e `utils/LatestOnly.js`. Achado ao tirar o relógio: ele também era o que avisava o pedido de que a carga foi parada («Clear Cache»), porque `stop()` não mudava nada na loja; a parada virou estado (`stopGeneration`/`isStopped`). Depois: nenhuma função da pasta da carga acima de 10. Testes novos: `test/models/albumLoadHold.test.js`, `test/models/albumSourceAsk.test.js`, `test/services/albums/LoadHold.test.js`, `test/utils/LatestOnly.test.js`, e casos em `albumLoad.test.js`, `albumAsk.test.js`, `AlbumLoadService.test.js`, `AlbumAsks.test.js`. Sem navegador nesta sessão: a prova na tela fica para o integrador.

## [2026-11-19 20:30] session — F62: exportar para o Spotify renova o acesso, relata e não duplica

Exportar para o Spotify, no ramo `fix/f62-blend-and-export-do-what-they-say`. **Acesso vencido (UAT-200):** a exportação recusava de saída um acesso vencido (`isAuthenticated()` olha só a hora) mesmo havendo token de renovação, e um 401 no meio virava «Spotify Token Invalid» sem tentar nada. Agora o acesso vencido é renovado antes de começar; um 401 no meio renova UMA vez e repete a chamada; se não der, a janela diz «Spotify needs you to connect again», mostra o botão «Connect to Spotify again» e lista o que foi criado e o que não foi. Renovações pedidas ao mesmo tempo dividem uma só. **429:** com `Retry-After` de até 30 s a exportação espera e repete; acima disso para e diz quanto o Spotify pediu (a carga de álbuns não espera: tem o prazo dela). **Modo separado (UAT-09):** cada playlist criada volta com o seu endereço e a janela mostra um link «Open in Spotify» por playlist; o texto sob o botão acompanha o modo escolhido. **Sem duplicar:** o que foi criado nesta sessão não é criado de novo ao exportar outra vez (`services/export/exportLedger.js`); uma playlist criada sem todas as faixas é completada, não refeita. A busca de faixa não engole mais a falha: «não achei» é resposta, falha é falha. A faixa que já traz o endereço do Spotify não é buscada de novo. Saíram o `alert()` do login sem client id (agora um aviso) e `createSeriesPlaylists`, sem uso.

## [2026-11-19 20:24] session — F62: tela de playlists com desfazer, refazer, excluir playlist e título que fica

Tela de playlists (`/playlists`), no ramo `fix/f62-blend-and-export-do-what-they-say`. **Desfazer e refazer (UAT-02):** dois botões em «Actions & Export», desabilitados quando não há passo; o estado vem da store (`canUndo`, `canRedo`). O histórico não tinha ponto de partida (o primeiro passo gravado já era a mudança) e continuava valendo depois de gerar de novo: agora começa no conjunto como chegou à tela e recomeça quando outro conjunto entra (blend, gerar de novo, abrir lote, salvar). Desfazer tudo volta a «nada a salvar». Sem atalho de teclado: não existia. **Excluir playlist (UAT-03):** botão em cada cartão. **Título (UAT-04):** o campo editável mostrava «1. Lote - Título» e nada lia o que era digitado; agora só o título é editável, vai para a playlist (`name` e `title`) ao sair do campo, é salvo com o lote e volta ao abrir para edição; a tela não é redesenhada enquanto se digita. **Topo (UAT-190):** «Editing: nome do lote», um rótulo «Batch Name», caminho «Home › Blend › Playlists» ou «Home › Saved Playlists › Edit Batch». **Painel de reconfigurar (UAT-200):** abre na receita com que as playlists foram geradas (lida do `_meta`, que é salvo) e guarda o que a pessoa mexeu entre um redesenho e outro; antes voltava para a receita recomendada e esquecia duração, ranking e Top N.

## [2026-11-19 20:24] review — F68 provada em produção: 193 de 199 álbuns com página de notas; UAT-205 em fixed

Varredura repetida em produção: de 183 para 193 achados; os 6 «não tem» restantes são outro lançamento ou ausência real, todos carimbados com a versão 2 da regra; nenhuma falha. Contagem de álbuns trocados: 227 de 227 iguais. Prova em `reports/evidence/F68/2026-11-19-identity-rules-reviewed-proof.md`. Decisões do auxiliar que ficam, revisáveis pelo MJRP: uma tabela pequena de «escritas conhecidas» mantida à mão (Blonde/Blond, POWER UP/PWR-UP, Substance 1977-1980/Substance); um vizinho aceito quando é o único («Hotel California» com só a versão ao vivo listada), sempre sinalizado no cartão.

## [2026-11-19 20:23] session — F62: cada receita do blend faz o que o nome diz, ou avisa

Ramo `fix/f62-blend-and-export-do-what-they-say`. As quatro receitas do menu têm agora um teste que prova o que o nome promete, pelo caminho que a tela usa (`test/algorithms/recipes.promise.test.js`). Defeitos que existiam na `main` e foram consertados: «By Artist then By Rank» não agrupava por artista (lia `artistName`, que a faixa não tem); «My Own Ranking», num álbum sem ranking da pessoa, usava a ordem de aclamação (`album.tracks`) e não a do álbum; «Top Acclaimed» punha uma faixa sem nota acima de uma com nota quando ela era popular (a popularidade entrava no lugar da nota); o embaralhar era viciado. O aviso da F56 de fonte faltando diz agora a ordem usada no lugar («Their tracks were ordered in album order instead»), e essa frase é conferida contra o que cada ranking faz. «Discovery Mode» saiu do menu: nenhuma receita o lia (UAT-08; decidido pelo agente, revisável). A duração alvo aparece nas receitas Top N quando a saída pode ser dividida (antes dividia por 60 minutos sem mostrar). As playlists geradas guardam a receita inteira em `_meta`.

## [2026-11-19 20:20] session — F68 em produção (servidor, depois site)

Servidor publicado primeiro (`764b495`, revisão `mjrp-proxy-00203-lwg`; volta `mjrp-proxy-00202-ktd`), depois o site (pacote `main-Cm36-Baj.js`). Antes de publicar, o servidor local respondeu contra a fonte real como previsto: dos 16 álbuns da varredura, 10 com página e 6 `not_found` com a versão 2 da regra; «Nevermind», «Core (Remastered)», «No Quarter» e «The Wall» nas páginas certas. A varredura em produção roda agora.

## [2026-11-19 20:14] session — F68: documentos da feature, a seção de identidade do arch.md reescrita como uma só, comportamento e manual

No ramo `fix/f68-album-identity-rules-reviewed`: `spec.md` (`status: In Progress`, REQ-01 a REQ-10 com `verified_by`, a mudança de comportamento declarada, as três perguntas abertas com a decisão do agente), `plan.md` (a tabela da verdade da fonte para os 16 álbuns, o fluxo de uma comparação, as tentativas de busca, a versão da regra no «não tem» e o custo na primeira carga, «Como acrescentar uma regra», onde uma regra de gênero entraria, o que as outras três fontes ganham de graça, e o trecho de console da prova em produção) e `tasks.md` (TASK-01 a TASK-08 fechadas; TASK-09 aberta, do integrador: a varredura rodada de novo em produção). No `docs/specs/arch.md`, a seção «Uma regra só para dizer que é o mesmo álbum» virou uma descrição atual só (saíram as duas camadas «fatia 1» e «fatia 2», e três parágrafos da F55 que tinham ficado soltos no fim do arquivo, depois da seção da F61, voltaram para dentro dela). `docs/specs/behavior.md`: a linha do cartão, agora uma frase por regra do segundo degrau, e o prazo do «não tem», que depende da versão da regra. Manual: `23_Shared_Code.md` (a seção da regra reescrita), `02_Server_Structure.md` e `04_Backend_Logic_Services.md` (a busca do raspador em tentativas), `06`, `07`, `07b`, `08`, `10` e `24` (as frases que ficaram falsas). O `doctor` segue vermelho pelos 521 erros que já estavam na `main` (nenhum novo; a F68 saiu do aviso W20); o erro F1 do `MEMORY.md` (`## Now` atrás do registro) fica para o integrador, porque este ramo não mexe no `MEMORY.md`.

## [2026-11-19 20:12] session — F49 em produção (site); F57 começa

Site publicado da `main` (`1d5ed9b`, pacote `main-DPC1GW_g.js`). UAT-06 em `fixed` com a ressalva de que o clique não foi visto no navegador (nenhuma série do MJRP passa de 12 álbuns). Auxiliares trabalhando: F68, F62 e, agora, F57.

## [2026-11-19 20:11] review — F49 revisada pelo integrador; UAT-06 em fixed, sem prova do clique no navegador

Nenhuma série do MJRP passa de 12 álbuns (a maior tem 9), então o botão não aparece na conta dele; não criei série de teste. A prova é por teste com a tela de verdade (`reports/evidence/F49/2026-11-19-load-more-albums-proof.md`). Decidido pelo agente — revisável: publicar assim, com a ressalva escrita.

## [2026-11-19 20:08] session — F56 em produção (site)

Site publicado da `main` (`042da86`, pacote `main-BZG7nsE3.js`). A F56 não muda o servidor. Auxiliares trabalhando: F68 e F49; a F62 começa agora.

## [2026-11-19 20:08] session — F68: a regra de identidade revista (listas com nome), a busca da fonte de notas em tentativas ordenadas, e o «não tem» carimbado com a versão da regra

Ramo `fix/f68-album-identity-rules-reviewed`. Primeiro a verdade da fonte: 56 pedidos educados a `suggest.php` do BestEverAlbums (um por vez, 0,8 s entre eles), guardados como vieram em `test/fixtures/besteveralbums/suggest/`, e a tabela dos 16 em `test/fixtures/besteveralbums/sweep-2026-11-19.json`. Depois a regra (`shared/albumIdentity.js`), reescrita para ser lida de cima a baixo: normalização num lugar; o artista como lista de equivalências com nome (`ARTIST_EQUIVALENCES`: as mesmas palavras; os mesmos nomes em outra ordem); o título em dois degraus, o segundo como lista de regras com nome, frase e exemplo real (`SECOND_TIER_RULES`: antes do subtítulo, sem o que vem entre parênteses, o nome entre parênteses, com o nome do artista na frente, escrito de outro jeito); uma porta só do segundo degrau para «igual» (`acceptedAlone`, chamada pelo `pickAlbum` e pelo `compareKeptAlbum`); a tabela de todos os motivos como dado (`REASONS_EXPLAINED`), que o teste roda linha a linha. O raspador (`server/lib/scrapers/besteveralbums.js`) procura por tentativas ordenadas e nomeadas (`locateAlbum`: página do artista; `searchAttempts`: artista e título, título sozinho, artista sozinho; busca em HTML), com os títulos que a própria regra dá (`titlesToSearch`): a nota de edição não vai mais no texto da busca. Os dois limpadores de título (`cleanTitle` no app e no servidor) saíram; o Spotify, no app e no servidor, usa o `titleWithoutEditionNotes` da regra. O cartão ganhou uma frase por regra do segundo degrau (`identityNotice`). O servidor carimba o `not_found` com a versão da regra (`identityRule`), e o registro guardado no navegador só vale enquanto essa for a versão do app (`IDENTITY_RULE_VERSION`, agora 2). Resultado offline: 10 dos 16 achados; 3 são outro lançamento e 3 não existem na fonte. Suíte: 1343 testes, 110 arquivos (eram 1217, 107); `npx vite build` compila. Sem navegador nesta sessão: nada foi visto em tela.

## [2026-11-19 20:08] decision — F68: o que conta como o mesmo artista, o que entra no segundo degrau e a lista de escritas conhecidas (decidido pelo agente — revisável)

Com o que a fonte de notas respondeu em 2026-11-19: (1) os mesmos nomes em outra ordem são o mesmo artista («Robert Plant & Jimmy Page» = «Jimmy Page & Robert Plant»); «X and the Y» = «X & The Y» = «X & Y»; um nome mais curto ou mais longo não é («Page & Plant», «James Brown And His Famous Flames»). (2) O segundo degrau ganha três regras gerais, todas num sentido só (o pedido é o curto) e todas marcadas no álbum: o título do candidato com algo mais entre parênteses que não é nota de edição nem número («In The Court Of The Crimson King (An Observation By King Crimson)»), o título pedido escrito entre parênteses no candidato («Untitled (Led Zeppelin IV)»), e o nome do artista na frente do título («James Brown Live At The Apollo»). (3) O que nenhuma regra deriva sem errar em outro lugar vira um fato numa lista (`KNOWN_WRITINGS`), por artista: Frank Ocean «Blonde» = «Blond», AC/DC «POWER UP» = «PWR/UP», Joy Division «Substance 1977-1980» = «Substance». O intervalo de anos não virou regra geral porque «Greatest Hits 1970-2002» do Elton John não é o «Greatest Hits» dele. (4) Pedido longo nunca aceita o álbum curto: «More Balls to Picasso», «Unreal Unearth: Unheard» e «Before the Frost... Until the Freeze» seguem «não tem», por serem outro lançamento. Dois testes da F55 mudaram de `different` para o segundo degrau («Weezer» contra «Weezer (Green Album)»; «Hotel California» contra «Hotel California (Live at the Forum '76)»): sozinhos numa fonte passam a ser aceitos, com o aviso no cartão, como já acontecia com o subtítulo.

## [2026-11-19 20:08] session — F49: spec, plano, tarefas, comportamento e manual escritos no ramo

A pasta da F49 preenchida para o que foi construído (`status: In Progress`; 5 REQ, todos com `verified_by`; 7 tarefas, 5 fechadas; abertas a prova no navegador, do integrador, e o julgamento do MJRP). A spec traz a causa com arquivo e linha da `main` em `4dc353a` e o que ficou de fora. `docs/specs/behavior.md`: estado novo `^library-series-more-albums`. Manual: `09` (a grade e a série aberta inteira), `12` (o botão, que o `13` dizia estar lá e não estava), `15` e `29` (a ação `load-more-series` e `onShowAllAlbums`), `99` (linhas da `SeriesView`). Para o MJRP julgar: o texto «Load N more albums» ficou, embora o clique não carregue nada; a escolha vale só para a visita. `docs/specs/uat.md`, `MEMORY.md` e `ROADMAP.md` não tocados: são do integrador.

## [2026-11-19 20:08] session — F49: o botão de carregar mais álbuns mostra o resto da série (UAT-06)

Ramo `fix/f49-load-more-albums`, por um auxiliar sem navegador. Confirmado na `main` (`4dc353a`) por teste da tela inteira: o clique chegava ao ouvinte da raiz (`SeriesEventHandler`) e era jogado fora, porque `load-more-series` não estava entre as ações de série; o ouvinte próprio da grade (`_attachEventListeners`) não tinha chamador e, mesmo ligado, colava cartões no DOM que o redesenho seguinte apagaria. Os álbuns depois do décimo segundo já estavam carregados: a carga pede todos os álbuns das séries da página, e o corte em 12 é só de desenho, só na grade compacta do painel de todas as séries. Conserto: a escolha é estado explícito da tela (`SeriesExpansion`, em `models/seriesExpansion.js`, criado pela `SeriesView` a cada visita), a grade desenha por ele a cada redesenho, o clique passa pelo ouvinte que a tela já tinha, e o foco vai para o primeiro álbum que apareceu. Botão com `type="button"` e singular («Load 1 more album»). Decidido pelo agente — revisável: a escolha mora na tela e não no controlador (que a F56 está mexendo); o texto «Load» ficou. `SeriesController.js` e `AlbumLoadService.js` não tocados. Suíte: 1330 passando (1307 antes); `vite build` compila. Nada visto num navegador.

## [2026-11-19 20:07] review — F56 provada pelo integrador; UAT-189 e UAT-191 em fixed

Blend de uma série já carregada: de 19,2 s para 0,05 s; avisos dizendo qual álbum ficou sem qual fonte; edição de lote e regeneração com a série certa. Prova em `reports/evidence/F56/2026-11-19-screens-through-the-load-service-proof.md`, com o que não foi visto. Mudanças de comportamento para o MJRP julgar: some a pergunta «No ratings detected… Continue?» (os avisos a substituem); o «Refetch» faz o cartão voltar a carregar e não mostra mais «Metadata updated»; a coleção compartilhada `albums` do banco deixa de ser escrita (só o «Refetch» antigo escrevia, nada lia).

## [2026-11-19 20:05] session — F56 junto com a `main`: dois testes do método retirado saem

A F52 fatia 3 tinha consertado `adoptAlbum`; a F56 retirou o método (o «Refetch» agora é `reloadAlbum`, pela fila). No encontro dos dois ramos ficou a versão da F56, e os dois testes do método retirado saíram.

## [2026-11-19 20:02] session — F56: spec, plano, tarefas, arquitetura, ADR-0019, comportamento e manual escritos no ramo

Ramo `fix/f56-screens-load-through-the-service`. A pasta da F56 preenchida para o que foi construído (9 REQ com `verified_by`, 15 tarefas; abertas a prova no navegador com os tempos, do integrador, e o julgamento do MJRP); o diagnóstico com arquivo e linha e a escolha entre «um contexto por tela» e «juntar-se à geração em vigor» estão no plano. `docs/specs/arch.md` ganhou a seção «Toda tela pede os álbuns ao serviço de carga (F56)»; a lista «Not done yet» da ADR-0019 diz o que a F56 fechou (decisões 1 e 7) e o que ficou (o botão «Enrich Data» e a fila do Spotify em segundo plano ainda pedem por fora da fila); `docs/specs/behavior.md` tem os estados do blend, das playlists e da tela de álbuns (cinco novos); manual 01, 06, 07, 08, 15, 17, 18, 19, 21 e 99 corrigidos. O status da ADR e o `docs/specs/uat.md` não foram tocados.

## [2026-11-19 19:58] session — F63 em produção (site)

Site publicado da `main` (`5c3abda`, pacote `main-Bb_Tr-dD.js`). A F63 não muda o servidor. Auxiliares trabalhando: F68 e F56.

## [2026-11-19 19:57] review — F63 provada pelo integrador; seis issues em fixed

Prova em `reports/evidence/F63/2026-11-19-home-and-navigation-proof.md`. Em `fixed`: UAT-201, UAT-26 (consertada pela F67, agora com teste), UAT-13, UAT-27, UAT-07, UAT-192. Decidido pelo agente — revisável: UAT-10 (telas de ranking só por endereço) e UAT-11 (tela de migração) ficam abertas e vão para a F65 com a recomendação de aposentar as telas; tirar tela é decisão do MJRP. Mudanças de comportamento para ele julgar: o menu da conta não abre mais só com o mouse por cima; a caixa de colar mantém as linhas a consertar; entrar numa série não cria entrada nova no histórico.

## [2026-11-19 19:56] session — F56: blend, edição de playlists, «Refetch» e salvar série passam pelo serviço de carga (código, no ramo)

Ramo `fix/f56-screens-load-through-the-service`, a partir da `main` em `d210f35`. Uma porta só para qualquer tela pedir os álbuns de uma série: `albumAsks.albumsOf({ series, sources, signal })` (`services/albums/AlbumAsks.js`), que entra na carga em vigor (`AlbumLoadService.join`/`leave`) sem começar geração, reaproveita o que a tela de álbuns ou o navegador já têm, espera as fontes que a receita lê e devolve um resultado tipado (prontos, falhos com motivo, fontes em falta). O blend e a edição de playlists deixaram os laços próprios; o «Refetch» virou `reloadAlbum` (pela fila); salvar a edição de uma série reconcilia em vez de recarregar tudo, inclusive quando a edição escolhida muda; a injeção de álbuns e os escritores avulsos da prateleira saíram. Os métodos antigos do cliente (`fetchAlbum`, `fetchMultipleAlbums`, `BEAenrichAlbum`) foram removidos: nada mais os chamava. Teste de aptidão novo: `test/architecture/screensLoadThroughTheService.test.js`. Suíte: 1232 passando (1143 antes); `vite build` compila. Decisões do agente, revisáveis: o blend segue com os álbuns prontos e avisa quais ficaram de fora (para só quando nenhum está pronto); a pergunta «No ratings detected… Continue?» saiu, no lugar vêm os avisos de fonte em falta; o documento compartilhado `albums` deixou de ser gravado pelo «Refetch» (ninguém o lia). Não foi visto num navegador.

## [2026-11-19 19:56] session — F63: as duas sobras das playlists guardadas (UAT-27 e o olho da UAT-13), pelo integrador

O auxiliar da F63 não podia tocar nas playlists guardadas (a F61 estava em outro ramo). Com a F61 na `main`: o botão «Create Series» do estado vazio navega pelo roteador (era `location.hash`, que não ia a lugar nenhum), e os botões da linha de playlist aparecem sem mouse (mesma regra das faixas).

## [2026-11-19 19:54] session — F63: spec, plano, tarefas, comportamento e manual escritos no ramo

A pasta da F63 preenchida para o que foi construído (13 REQ: 10 com `verified_by`, dois deles «já consertado» pela F67, F50 e F54 com a prova; 3 não entregues e ditos assim: UAT-10 e UAT-11 pedem decisão do MJRP, UAT-27 ficou fora do escopo dado). A spec traz a tabela «ainda existia?» de cada issue com arquivo e linha, e a lista antes → depois dos 28 textos traduzidos, para o MJRP rever as palavras. 19 tarefas; abertas a prova no navegador (do integrador), o julgamento do MJRP e as três não entregues. `docs/specs/behavior.md`: 12 estados reescritos e 4 novos (`^home-bulk-skipped`, `^home-bulk-empty`, `^blend-series-from-address`, `^app-back-goes-back`). Manual: 00 (mapa de arquivos), 08, 11, 13, 15, 17, 19, 21 (seção 1.2), 24, 29, 99. Suíte: 1233 passando (1143 antes); `vite build` compila; `doctor.py` com os mesmos 521 erros de antes do ramo.

## [2026-11-19 19:48] session — F63: os itens «Soon» do menu não navegam mais

Confirmado na `main` por teste (UAT-201): By Artist, By Genre e By Track, marcados «Soon» no menu «Music Series», eram links com endereço; o ouvinte do próprio item recusava o clique, mas o roteador, que ouve todo link do app, navegava do mesmo jeito. Agora o item «Soon» não é link (`aria-disabled`, sem endereço), como o `docs/specs/behavior.md` já dizia (`^app-main`). A gaveta do celular continua com os três links, que abrem a tela «Coming Soon»: não mexido.

## [2026-11-19 19:47] session — F63: Esc num diálogo responde «cancelar»; teste do título único da aba

Confirmado na `main` (UAT-201, «um diálogo fechado com Esc deixa a ação pendurada»): `DialogService` tirava o diálogo da tela no Esc e a promessa de `confirm`/`prompt` nunca era resolvida. Agora o Esc, e um diálogo que toma o lugar de outro, respondem como «Cancel» (`false` / `null`). O título único da aba (metade da UAT-192, consertada pela F54 em `791da82`) ganhou o teste que não tinha: `test/architecture/oneTabTitle.test.js`.

## [2026-11-19 19:45] session — F63: as receitas do blend em inglês; teste que recusa texto em português no app (UAT-192)

Confirmado na `main`: 28 textos em português em `public/js/algorithms/*.js` (descrições das receitas, subtítulos das playlists geradas, descrições de curadoria), numa interface em inglês. Passados para o inglês mantendo o sentido (a lista antes → depois está no `spec.md` da F63, para o MJRP rever as palavras). Teste de arquitetura novo, `test/architecture/interfaceInEnglish.test.js`: lê toda string e template de `public/js` (pelo `espree`, sem comentários) e falha em letra acentuada do português ou palavra só do português; exceções nomeadas (`eletrônica`, `electrónica`, `Zé's`). O título da aba (a outra metade da UAT-192) já estava consertado pela F54: um título só, igual ao do `index.html`. Fora de `public/js` e não tocados: `shared/curation.js` (três subtítulos em português, código do servidor) e as páginas `public/debug-*.html`. Playlists já guardadas mantêm o subtítulo antigo: é dado gravado.

## [2026-11-19 19:44] session — F63: o menu de mistura abre com a série de origem escolhida (UAT-07, UAT-192)

Confirmado na `main`: `BlendingMenuView.mount` não lia o `seriesId` que o botão «Blend your Albums» põe no endereço (`/blend?seriesId=<id>`). Agora `BlendSeriesSelector.selectById` escolhe a série depois da carga e a tela já abre com o passo da receita liberado; série que não existe não escolhe nenhuma. Os cartões de série viraram botões para o teclado (`role`, `tabindex`, `aria-pressed`, Enter e espaço). `BlendingController.js` não foi tocado. Sem navegador nesta sessão.

## [2026-11-19 19:44] session — F52 fatias 3 e 4 em produção; F68 em andamento

Site e servidor publicados da `main` (`b7bb0cc`; revisão `mjrp-proxy-00202-ktd`, volta `mjrp-proxy-00201-kcq`). A varredura de 199 álbuns rodou contra essa revisão sem falhas. Auxiliares trabalhando: F68 (revisão das regras de identidade, com os 16 casos da varredura), F56 e F63. Pendente do MJRP: fixar uma instância no Cloud Run e aceitar a ADR-0021.

## [2026-11-19 19:43] session — F63: o menu da conta abre no toque; o ✕ da faixa aparece sem mouse (UAT-13)

Confirmado na `main`: o menu da conta só abria com o mouse em cima (`group-hover`), e as ações da faixa ficavam com `opacity-0` até o mouse passar. `AuthNav`: o avatar é um botão com `aria-expanded`/`aria-haspopup`; abre e fecha no toque ou clique, fecha com clique fora e Esc (o foco volta ao avatar), seta para baixo abre no primeiro item; não abre mais só por passar o mouse. `TrackRow`: as ações só ficam escondidas onde o aparelho tem mouse (`@media (hover:hover)`), e aparecem com o foco do teclado; o botão ganhou `aria-label`. Não feito, por estar fora do escopo dado (código das playlists guardadas): o olho de detalhes em `SavedPlaylistRow.js:51` e `SavedPlaylistActions.js:86`, que têm o mesmo `opacity-0 group-hover`. Sem navegador nesta sessão: como fica na tela é do integrador.

## [2026-11-19 19:43] review — varredura da fonte de notas: 16 de 199 álbuns sem página pela regra exata

Relatório em `reports/audits/2026-11-19-mjrpalbumblender-v0-ratings-source-sweep.md`. 183 achados, 16 `not_found`, nenhuma falha (a fila educada segurou 199 pedidos). Os 16 são, na leitura do agente, quase todos custo da regra exata na fonte (artista em outra ordem, qualificador entre parênteses, título escrito de outro jeito). Decidido pelo agente — revisável: a F68 (revisão das regras de identidade) passa na frente e começa agora, com esses 16 casos reais como base.

## [2026-11-19 19:41] session — F63: colar uma lista aceita hífen no nome e pula a linha ruim avisando

Confirmado na `main`: «Jay-Z - The Blueprint» virava artista «Jay» e álbum «Z - The Blueprint» (`line.split('-')`), e uma busca que quebrava numa linha abortava as outras. Um parser só para a linha colada, `parsePastedAlbumLine` em `models/albumQuery.js` (é o `parseAlbumQuery` mais o que só uma linha colada tem: marcador de lista, travessão ou tab como separador, espaço faltando de um lado do hífen), com tabela de 31 casos em `test/models/bulkPaste.test.js`. `models/bulkPaste.js` (puro) lê a lista e diz o que a tela mostra; `HomeController.handleBulkProcess` saiu de complexidade 15 para 4. A linha que não entra é pulada e listada sob a caixa (número, texto, motivo) e fica na caixa para ser corrigida; as outras seguem. Sem `alert`. A UAT-26 (`toast.warn`) já estava consertada pela F67 (`4b6aa73`) e ganhou o teste que faltava. Sem navegador nesta sessão.

## [2026-11-19 19:41] session — F63: o botão voltar volta (o roteador é o dono do histórico)

Ramo `fix/f63-home-and-navigation-answer`. Três armadilhas do botão voltar confirmadas na `main` e consertadas no dono: (1) a tela de álbuns acrescentava uma entrada ao entrar em `/albums/<id>` (`SeriesController.loadScope` chamava `history.pushState` por conta própria), e voltar caía de novo em `/albums/<id>`: é o «preso depois de criar uma série» da UAT-201; (2) as rotas que só mandam adiante (`/callback` do Spotify, `/album-series`, `/series`, endereço sem tela, `/`) empilhavam o destino por cima de si mesmas. O roteador ganhou `redirect` (troca a entrada) e `setAddress` (a tela muda o próprio endereço por ele); teste de arquitetura `test/architecture/historyOwnedByRouter.test.js` recusa escrita do histórico fora do roteador (três exceções conhecidas, com o motivo). A Home «morta» depois do Spotify já estava consertada pela F67 (`test/router.overlap.test.js`) e o botão «Connected» pela F50 (`test/services/spotify/SpotifyAuthSignal.test.js`). Sem navegador nesta sessão: a prova na tela fica com o integrador.

## [2026-11-19 19:38] decision — F69 criada: popularidade do Spotify, falha é falha (decidido pelo agente — revisável)

A proposta emendada da F52 deixou este ponto de fora. Feature de via rápida, `^REL-40`, conserta a UAT-206 (aberta agora). Criada na `main` antes de qualquer ramo, sob a dispensa do MJRP de 19:03. Servidor publicado com as fatias 3 e 4 da F52 e o conserto do artista com nota: revisão `mjrp-proxy-00202-ktd` (volta: `mjrp-proxy-00201-kcq`).

## [2026-11-19 19:36] review — F52 fatias 3 e 4 provadas; defeito da F55 achado e consertado («Nirvana (US)»)

Prova em `reports/evidence/F52/2026-11-19-slices-3-4-proof.md`. Achado: em produção desde a F55 fatia 1, a fonte de notas respondia «não tem» para álbuns cujo artista a fonte escreve com uma nota no fim («Nevermind by Nirvana (US)»). Consertado na regra (`artistNamesFromLabel`) e na busca da página do artista, com testes tirados da resposta real. Decidido pelo agente — revisável: o serviço do Cloud Run permite até 20 instâncias e a fila educada vale por instância; não mudei a configuração do serviço (fica para o MJRP). Depois de publicar, varrer os álbuns do MJRP atrás de outros «não tem» falsos.

## [2026-11-19 19:31] session — F59 fatia E e F61 em produção (site)

Duas publicações do site da `main`: `a6092a7` (F59 fatia E: Tailwind compilado com o site, sem script de terceiro; endereços de fora conferidos) e `4e4555b` (F61: playlists guardadas rápidas; pacote `main-CVU46dC0.js`). Em produção depois da F59: nenhum pedido ao CDN do Tailwind, nenhum aviso no console, estilos aplicados. UAT-25 e UAT-186 em `fixed`. A UAT-199 já estava em `fixed`; o resto dela (endereços) foi entregue. A ADR-0021 segue `Proposed`, à espera do MJRP. Nenhuma das duas muda o servidor.

## [2026-11-19 19:31] session — F52 fatias 3 e 4: documentos da feature, arquitetura, comportamento e manual

No ramo `fix/f52-slices-3-4`: `spec.md` com a fatia 2 marcada como entregue pela F55, as fatias 3 e 4 como ficaram, os REQ-06 a REQ-10 com `verified_by`, a mudança de comportamento declarada e duas perguntas abertas (os números escolhidos sem medir; os fatos antigos da série); `plan.md` com a seção «Fatia 3 e medição» (onde a seção 11 valeu sobre o pedido da sessão, os módulos, a tabela de números, as alternativas, os riscos e o plano de testes); `tasks.md` com as tarefas fechadas e uma aberta para o integrador (TASK-25), além da TASK-18, que é decisão do MJRP. `docs/specs/arch.md`: a seção 12 da proposta, com o que foi construído e os seis pontos que ficam abertos. `behavior.md`: os prazos do guardado e a carga das notas em espera. Manual: `02_Server_Structure.md`, `03_Backend_API_Layer.md` (ritmo, orçamento, a linha de log e como ler no Cloud Run), `07_Frontend_Data_Infra.md`, `08_Frontend_Models.md`, `18_Frontend_Logic_Core.md`. Fora da feature, por decisão da seção 11: a popularidade do Spotify (o que a leitura do código mostrou está no plano) e a memória curta por instância.

## [2026-11-19 19:31] session — F52 fatia 3, app: o «não tem» da fonte de notas leva o motivo e vale 24 horas ou 7 dias; a fonte ocupada segura a carga

Ramo `fix/f52-slices-3-4`. O `AcclaimEnricher` devolve, junto do `empty`, o motivo que o servidor deu (`not_found` ou `no_ratings`; nenhum quando a resposta é do servidor de antes da F52). O motivo vai com o estado até o registro guardado no navegador (`AlbumCacheAdapter`, tabela `EMPTY_TRUST`), que passa a valer conforme ele; um «vazio» sem motivo, inclusive os registros já guardados e a popularidade, segue valendo 1 hora. Uma falha continua sem ser guardada. O «Refetch» do álbum pergunta à fonte em qualquer momento, e o `adoptAlbum` só marca as notas como `done` quando o álbum voltou com notas (antes marcava sempre, mesmo quando o pedido tinha falhado). Um 503 `upstream_busy` com `Retry-After` segura a fila das notas até a hora dita, com aviso próprio (`HoldReason.SOURCE_BUSY`); sem `Retry-After` é falha com «tentar de novo». Compatibilidade: o site novo com o servidor de hoje lê o mesmo contrato; a aba de hoje com o servidor novo lê 503 e 504 como falha que pode repetir. Sem navegador nesta sessão: conferido só por testes.

## [2026-11-19 19:31] decision — por quanto tempo o app confia no «não tem» da fonte de notas: 24 horas e 7 dias (decidido pelo agente — revisável)

A proposta da F52 (seção 9) deixava o número com o MJRP e propunha 7 dias para os dois casos; a seção 11 (item 4), que vale sobre ela, manda começar em 24 horas para «álbum sem página» e 7 dias só para «página conferida, sem notas». Decisão: `not_found` vale 24 horas, `no_ratings` vale 7 dias, e um «vazio» sem motivo (servidor de antes da F52, registro antigo, popularidade) segue valendo 1 hora. O «Refetch» do álbum fura o prazo. Os números moram num lugar só, `EMPTY_TRUST` em `public/js/services/albums/adapters/AlbumCacheAdapter.js`. Sobe-se o prazo do «sem página» depois de ver, no log do servidor, quantos pedidos uma segunda visita ainda faz.

## [2026-11-19 19:30] review — F61 provada pelo integrador; UAT-186 em fixed

Playlists guardadas, conta do MJRP: primeira série em 0,26 s e lista inteira em 0,79 s (antes, hoje, 4,6 s; 20 s na regressão). Prova em `reports/evidence/F61/2026-11-19-saved-playlists-timing.md`. Proposta de modelo de dados do auxiliar (resumo dos lotes no documento da série) fica anotada no `plan.md` da F61, não feita.

## [2026-11-19 19:30] session — F52 fatia 3, servidor: orçamento de tempo, fila educada com a fonte de notas, um pedido por álbum de cada vez, e a linha de log da medição

Ramo `fix/f52-slices-3-4`. Três módulos novos, cada um com um trabalho e com o relógio injetado: `server/lib/politeQueue.js` (o dono do ritmo com a fonte raspada), `server/lib/timeBudget.js` (o tempo total de um pedido) e `server/lib/inFlight.js` (pedidos iguais simultâneos dividem um trabalho; nada fica guardado). O raspador (`besteveralbums.js`) entrega cada requisição à fila pelo `getPage` único, com prazo de 8 s (era 30 s), para de perguntar quando o tempo do pedido acaba e não pede o mesmo endereço duas vezes no mesmo pedido. O `EnrichmentService` dá 15 s a cada pedido de notas (o app espera 20 s) e responde `upstream_timeout` no fim; quando a fonte pede uma espera que não cabe, responde 503 `upstream_busy` com `Retry-After`. A rota escreve uma linha de log por pedido (`how`, `answer`, `ms`, `sourceRequests`), sem dado de pessoa nem de álbum. Números decididos pelo agente, revisáveis, sem medição da fonte: 2 requisições por vez, 250 ms entre inícios, espera de 1 s dobrando até 30 s no 429 e no 503, 3 tentativas, `Retry-After` cortado em 5 minutos. Tudo por instância do servidor. Pela seção 11 da proposta (item 10), a memória curta por instância não foi construída. Conferido num servidor de verdade, em cópia local: dois pedidos iguais deram `source` (3 requisições, 2,0 s) e `joined`; um álbum inventado deu `not_found` com 4 requisições. Foram 7 requisições ao BestEverAlbums no total.

## [2026-11-19 19:28] review — F59 fatia E provada pelo integrador (Tailwind compilado; endereços conferidos)

Oito telas comparadas com produção por estilo calculado, elemento a elemento, como visitante: iguais (diferenças só de escrita, listadas na prova). Receita selecionada no blend com o gradiente certo, com login. A ADR-0021 fica em `Proposed`: publicado sob a dispensa do MJRP de 2026-11-19 19:03 (decidido pelo agente — revisável); o aceite da ADR é dele. UAT-25 e UAT-199 em `fixed`; UAT-28 segue aberta.

## [2026-11-19 19:24] session — F61: spec, plano, tarefas, arquitetura, comportamento e manual escritos no ramo

A pasta da F61 preenchida para o que foi construído (8 REQ com `verified_by`, 12 tarefas, a prova no navegador com o tempo medido aberta para o integrador); o diagnóstico com arquivo e linha e a proposta de modelo de dados (um resumo das playlists gravado na série, não feita) estão no plano. `docs/specs/arch.md` ganhou a seção «Leitura das playlists guardadas (F61)»; `docs/specs/behavior.md` tem os estados da tela (três novos); manual 00, 01, 06, 09, 14, 17, 21, 24, 29, 99 e a lista de regressão corrigidos. Decisões do agente, revisáveis: 8 leituras juntas com prazo de 15 s; a lista lida antes aparece na hora ao voltar e é relida por trás; série em leitura não tem bloco próprio; sair da tela não cancela a leitura. O doctor segue vermelho com os mesmos 521 erros de antes do ramo, nenhum da F61.

## [2026-11-19 19:20] session — F59: spec, plano, tarefas, ADR-0021 (proposta), stack, arquitetura e manual escritos no ramo

Ramo `fix/f59-tailwind-local-and-url-schemes`. A pasta da F59 preenchida para tudo o que foi construído nas fatias A, B, C e E (11 REQ com `verified_by`, 14 tarefas; abertas a prova no navegador, do integrador, e o aceite da ADR, do MJRP). ADR-0021 escrita em «Proposed»: o Tailwind fica, compilado junto com o site (aceite do MJRP pendente; a constituição diz «Tailwind only if requested»). `docs/specs/tech-stack.md` (linha do Tailwind: 3.4.19, como é construído, a ADR), `docs/specs/arch.md` (a casca e a linha de CDN/Assets) e o manual (07b com a `safeUrl`, 09a com a folha do Tailwind, 31) dizem o que o código faz agora. Um teste a mais, `test/security/buildHandsOutNoSource.test.js`, para o requisito dos mapas de código ter prova na suíte. 1002 testes. O doctor segue vermelho com 521 erros, como antes do ramo; entre eles um novo, que é do integrador: o `## Now` do `MEMORY.md` ficou atrás do log (este ramo não toca o `MEMORY.md`). Não mexido: o status das issues no `uat.md`.

## [2026-11-19 19:19] session — F61: a leitura das playlists guardadas com um dono só (código e testes, no ramo)

Ramo `fix/f61-saved-playlists-fast`. Causa lida no código antes de mexer: a tela fazia 1 + N leituras, uma depois da outra (48 para 47 séries, nunca duas no ar), e só desenhava depois da última; apagar um lote relia tudo de novo. Agora `SavedPlaylistsReader` (`public/js/services/playlists/`) é o único dono da leitura: uma leitura das séries, depois as playlists de cada série com até 8 no ar e prazo de 15 s; estado por série (lendo, pronta, vazia, falhou com «Try again»); geração e senha por série para a resposta velha não escrever; o que já foi lido fica na tela enquanto é relido. Medido com o banco falso, 47 séries: 48 leituras nos dois casos; esperas em fila até a lista toda: 48 antes, 7 agora; até a primeira série aparecer: 48 antes, 2 agora. Sem navegador: o tempo real fica para o integrador medir. Suíte: 1046 testes (982 antes); `vite build` compila.

## [2026-11-19 19:15] session — F59: Tailwind compilado junto com o site, sem CDN (UAT-25)

Ramo `fix/f59-tailwind-local-and-url-schemes`. O Tailwind deixou de ser um script de terceiros rodando a cada abertura: é compilado junto com o site (Tailwind 3.4.19, dependência de desenvolvimento; `tailwind.config.js` na raiz, lido pelo `vite.config.js`; entrada `public/css/tailwind.css`, importada pelo `app.js` depois do `index.css`, para as regras do Tailwind continuarem vindo por último como vinham). O tema da página (fonte Syne, cores `brand`, os dois gradientes) e as 13 classes de componente (`.btn`, `.glass-panel`, `.badge` e as outras) saíram do `index.html` sem mudança. O `index.html` perdeu o script do CDN, a configuração embutida e o bloco de estilos; a política de conteúdo perdeu `https://cdn.tailwindcss.com` em `script-src` e em `style-src` (`'unsafe-inline'` continua: há 6 manipuladores embutidos e estilos embutidos no código). Classes montadas na hora: um caso só, as cores da receita selecionada com `/10` em `BlendRecipeCard.js`, 14 classes na lista de segurança. Regra de arquitetura como teste: `test/architecture/tailwindBuiltWithSite.test.js` compila o CSS duas vezes e exige que toda classe que o Tailwind acha no texto das páginas e de `public/js` esteja no CSS do site (758 classes, nenhuma faltando; tirando `public/js` da lista de arquivos, faltariam 753), e que toda montagem de nome de classe esteja lida e listada. Uma linha `@apply` que nunca teve efeito em `tech-theme.css` foi removida, para o botão `.tech-btn` não mudar agora que o Tailwind lê esse arquivo. CSS do build: 76,7 kB (13,0 kB comprimido), contra cerca de 11 kB antes mais o script do CDN. 1001 testes, build ok, o servidor de desenvolvimento entrega os estilos. Quem compila precisa de `npm ci` (pacote novo). Sem navegador nesta sessão: a conferência visual fica com o integrador.

## [2026-11-19 19:14] session — F59: endereço vindo de fora só vira link quando é da web (UAT-199)

Ramo `fix/f59-tailwind-local-and-url-schemes`. Um endereço que vem de um provedor ou de um registro guardado só vira link quando é um endereço da web (http ou https): uma função só, `safeUrl` (`public/js/utils/safeUrl.js`), usada nos três lugares onde isso acontecia sem conferência — o selo do Spotify no cartão do álbum (`Card.js`), o link da fonte na tabela do ranking consolidado (`ConsolidatedRankingView.js`) e o botão que abre no Spotify a playlist recém-criada (`SpotifyExportModal.js`, achado nesta passada). Um endereço como `javascript:...` deixa de chegar ao `href`: o cartão cai no endereço montado com o identificador do Spotify, a tabela mostra um traço e o botão não abre nada. Regra de arquitetura como teste: `test/architecture/outsideUrlChecked.test.js` lê todo `href`, `window.open` e troca de endereço em `public/js` e recusa o que não está escrito no código nem passou pela função. 994 testes. Sem navegador nesta sessão.

## [2026-11-19 19:14] session — F55 fatia 2 em produção (site e servidor)

Site e servidor publicados da `main` (`dd16b01`; revisão `mjrp-proxy-00201-kcq`, volta `mjrp-proxy-00200-2nh`). Em produção, com login: notas de «Core» (página 2906) e de «No Quarter» pelo título curto e pelo longo (a mesma página 11402). UAT-184 em `fixed`. Em andamento com auxiliares: F59 (resto), F61, F52 fatias 3 a 5.

## [2026-11-19 19:12] review — F55 fatia 2 provada pelo integrador; UAT-184 em fixed

Contagem na conta do MJRP depois da fatia 2: 227 álbuns pedidos, 227 iguais. «No Quarter» carrega pelo segundo nível, com o aviso no cartão; o identificador corrigido do «Core» foi gravado na série. Prova em `reports/evidence/F55/2026-11-19-slice-2-browser-proof.md`, com o que não foi visto.

## [2026-11-19 19:10] decision — a resposta única da busca por IA entra no afrouxamento do subtítulo (decidido pelo agente — revisável)

Na prova no navegador, «No Quarter» seguiu falhando: o catálogo da Apple (loja dos EUA) não tem o álbum em nenhuma busca, e ele sempre veio da busca por IA do servidor, que responde «No Quarter: Jimmy Page & Robert Plant Unledded». A fatia 2 tinha deixado a resposta da IA fora do segundo nível da regra. Decisão: uma fonte que é perguntada por um álbum e responde um álbum é julgada como resposta única (`compareOnlyAnswer`, dentro da regra): o título pedido antes de um subtítulo é aceito, com o motivo gravado no álbum e o aviso no cartão. O título longo pedido e o curto respondido continua recusado. Também visto: o identificador corrigido do «Core» foi gravado na série (300973540 → 1285806791).

## [2026-11-19 19:05] session — F55 fatia 2: documentos da feature, arquitetura, comportamento e manual

No ramo `fix/f55-identity-slice-2`: `spec.md` com os REQ-10 a REQ-16 e os seus `verified_by`, a mudança de comportamento declarada e as perguntas respondidas; `plan.md` com o desenho, as decisões, as alternativas recusadas, os riscos e o plano de testes da fatia 2; `tasks.md` com as tarefas fechadas e uma aberta, a prova no navegador pelo integrador (TASK-15). `docs/specs/arch.md`: a seção da regra reescrita para os dois degraus, o escritor único e o guardado conferido na leitura. `behavior.md`: a linha no cartão, o identificador corrigido, o guardado conferido, a remoção de álbum. `data-model.md`: o `appleMusicId` é corrigido pelo app. Manual 01, 02, 04, 06, 07, 08, 10, 17, 23, 24 e 32. A UAT-184 não foi mexida. 1053 testes, build ok; o doctor segue vermelho com os mesmos 521 erros de antes do ramo.

## [2026-11-19 19:03] decision — MJRP: dispensa de bloqueio pelo processo até as issues acabarem

Palavras do MJRP: «ok, eu vou ter que sair nao se bloqueia, decida e registre, principalmente nao se bloqueie pelo processo, sou dono do harness e te dou um waiver aqui pra vc continuar trabalhando nas issues até finalizar todas». Leitura do agente: enquanto ele está fora, o agente decide, registra cada decisão como «decidido pelo agente — revisável», e segue pelas issues abertas sem parar por recusa de processo (a recusa é registrada e o trabalho continua). Não muda: push, aceite e carimbos são dele; nenhuma senha é digitada; nada de `--no-verify`; cada feature só vai a produção testada e provada, com a volta anotada.

## [2026-11-19 18:59] session — F55 fatia 2: adicionar e remover álbum de uma série perguntam à regra única

O `SeriesService` casava a consulta em texto por «a consulta contém o título (e o artista)»: remover «Core» podia remover «Core Memories», e «Core Memories» na série impedia adicionar «Core». Agora, ao remover, a consulta que guarda o id do álbum é a dele (dado antigo); senão a regra diz qual consulta pediu o álbum da tela (a consulta é o pedido, o álbum é o candidato), o título próprio antes da consulta de que ele é só uma edição. Ao adicionar, só o título próprio é repetição; uma edição é outra coisa a pedir. O teste de arquitetura passou a cobrir os leitores do guardado e o `SeriesService`. Achado: o caminho de remoção manual do `SeriesEventHandler` espera a mensagem «Could not find album query in series», que o serviço nunca emite (emite «Could not find album "…" in series»); é código morto, não mexido. 1049 testes.

## [2026-11-19 18:56] session — F55 fatia 2: o álbum trocado já guardado no navegador é descartado quando é lido

Em vez de trocar a versão do registro (que jogaria fora todos os álbuns e todas as notas guardadas), cada leitura do guardado pergunta à regra única se o registro ainda é o álbum pedido pela consulta: `AlbumCacheAdapter.get` (a carga; memória e IndexedDB) e `APIClient.fetchAlbum` (o caminho antigo do blend e das playlists; memória, IndexedDB e o localStorage antigo). O que não é o álbum pedido é esquecido e buscado de novo; o título com subtítulo só fica se o registro diz que uma carga o aceitou pelo segundo degrau. O `peek` da contagem continua só-leitura. Na primeira carga depois de publicar, só os álbuns trocados são buscados de novo (8 em 227 na conta do MJRP, contados em 2026-11-19). 1038 testes.

## [2026-11-19 18:54] session — F55 fatia 2: o identificador corrigido da Apple gravado na série, por um escritor só

Quando o álbum pedido é achado sob outro identificador da Apple (o guardado sumiu ou leva a outro álbum), o `SeriesFactsService`, que já era o único escritor do que a carga aprende sobre a série, grava na mesma escrita, uma vez por série terminada: `appleMusicId` novo e, só se a consulta os guarda, `coverUrl` e `year` do álbum carregado. Artista e título pedidos nunca mudam. Não espera os fatos; a falha da escrita é avisada, tentada de novo na próxima passada e nunca derruba a carga. O álbum aceito pelo segundo degrau também tem o identificador gravado. Teste de arquitetura: só o `CatalogAdapter` diz que um identificador foi trocado, só o `albumQuery.js` lê, só o `SeriesFactsService` escreve. 1029 testes.

## [2026-11-19 18:52] session — F55 fatia 2: o segundo degrau da regra de identidade («No Quarter»)

Ramo `fix/f55-identity-slice-2`. A regra única (`shared/albumIdentity.js`) ganhou um segundo degrau, que nunca disputa com o primeiro: o título pedido é o título do candidato antes de um subtítulo («:» ou « - »), com o mesmo artista, e só num sentido (o pedido é o curto). `compareAlbumIdentity` responde `same-if-alone` (não é `same`); só o `pickAlbum`, que vê todos os candidatos, aceita, e só quando nenhum passou no primeiro degrau e os do segundo são um álbum só. O álbum carregado leva o motivo em `metadata.identityReason`; o cartão do álbum diz em uma linha quando foi aceito pelo segundo degrau; a contagem só-leitura o conta como igual, com o motivo. Não afrouxam, por olharem um candidato só: o identificador guardado, a resposta da IA e a página conferida sozinha no raspador. 1020 testes, build ok. Sem navegador nesta sessão.

## [2026-11-19 18:40] decision — MJRP: «No Quarter» tratado com afrouxamento; F68 criada para rever as regras de identidade de álbum

Palavras do MJRP: «o no quarter é um edge case, vamos tratá-lo com afrouxamento mas coloca no Do not forget do memory e abre uma feature pra revisao das regras todas pra encontrar a identidade de album, até pq depois com as futuras seções de genero, prevejo termos um algoritmo ficando mais complexo e precisamos revisar pra que a manutencao e o entendimento do mesmo seja fácil de entender.» Feito: (1) o afrouxamento entra na F55 fatia 2; (2) `MEMORY.md`, bloco Do Not Forget; (3) F68 criada na `main` (via rápida, `^REL-40`, UAT-205), citada na story S-53.

## [2026-11-19 18:34] session — F67 em produção (site)

Site publicado da `main` (`cdef6d5`, pacote `main-CkVMM5CM.js`). Em produção, como visitante: clique em Scan mostra «Scanning…» com o botão desabilitado na hora e, depois, 12 álbuns de «pavement». A F67 não muda o servidor. UAT-204 em `fixed`, à espera do aceite do MJRP.

## [2026-11-19 18:33] review — F67 revisada e provada pelo integrador; UAT-204 em fixed

Ramo do auxiliar com a `main` junto: 982 testes, build ok. Sete cenários no navegador em `reports/evidence/F67/2026-11-19-home-scan-browser-proof.md`. A causa do caso do MJRP não pôde ser determinada; dois defeitos reais que o explicam foram consertados (consulta ao catálogo sem prazo; navegação sobreposta deixava a tela sem ligar os botões, no roteador). O doctor segue vermelho com os erros antigos, nenhum da F67.

## [2026-11-19 18:30] session — F67: spec, plano, tarefas, comportamento e manual escritos no ramo

A pasta da F67 preenchida para o que foi construído (7 REQ com `verified_by`, 10 tarefas, a prova no navegador aberta para o integrador); `docs/specs/behavior.md` com os estados da busca da Home e a tela sempre montada; manual 14, 16, 19, 20, 21 e 22 corrigidos. O doctor segue vermelho com os mesmos 521 erros de antes do ramo, nenhum da F67.

## [2026-11-19 18:26] session — F67: o Scan da Home tem um estado só, prazo no catálogo e a IA depois (UAT-204)

Ramo `fix/f67-home-scan-answers`. Causa examinada antes do conserto: achado um defeito real do roteador (uma rota que redireciona deixava a tela seguinte desenhada e nunca montada, sem nenhum botão respondendo) e a falta de prazo no catálogo, no início do MusicKit e na lista da IA; a causa do caso do MJRP não se determina pelo código. Construído: `models/scanState.js` (estados parado, buscando, resultados, sem resultados, falhou), o `SearchController` como dono e a `HomeView.renderScan` como único desenho; prazo de 15 s no catálogo e de 10 s no início do MusicKit; os álbuns aparecem quando o catálogo responde e a lista da IA reclassifica depois; nenhum `alert` no fluxo. 982 testes, build ok. Sem navegador nesta sessão: a prova na tela fica com o integrador.

## [2026-11-19 18:18] decision — F67 criada: o Scan da Home responde ao clique (UAT-204)

Feature de via rápida, `^REL-40`, conserta a UAT-204. Criada na `main` antes do ramo. Achado novo: quando o Scan roda, o botão vira um círculo girando; na captura do MJRP o botão estava com o rótulo normal, então o clique não chegou a iniciar a busca ou ela terminou sem mostrar nada. A causa é investigada antes do conserto.

## [2026-11-19 18:18] session — F55 fatia 1 em produção (site e servidor)

Site e servidor publicados da `main` (`72c0a70`; revisão `mjrp-proxy-00200-2nh`, volta `mjrp-proxy-00199-hsv`). Em produção, com login, a fonte de notas respondeu `found` para «Core» e «Core (Remastered)» (mesma página) e `not_found` para «Core Memories». A UAT-184 fica aberta até a fatia 2: os álbuns trocados já guardados no navegador seguem na tela até vencer ou até «Clear Cache», e o identificador corrigido ainda não é gravado na série. Efeito conhecido: «No Quarter» (série Robert Plant 00-10s) passa a falhar com aviso, porque o catálogo só o tem com subtítulo. A regra do raspador que a F52 listava como tarefa 12 foi entregue aqui. O auxiliar da F67 (Scan) está trabalhando.

## [2026-11-19 18:16] review — F55 fatia 1 revisada e provada pelo integrador

Ramo do auxiliar com a `main` junto: 919 testes, build ok. Contagem na conta do MJRP: 8 álbuns trocados em 227 (9 linhas). Com a regra nova, 7 carregam o álbum certo e 1 («No Quarter») passa a falhar com aviso, porque o catálogo só o tem com subtítulo. A fonte de notas respondeu certo no servidor local. Prova em `reports/evidence/F55/2026-11-19-slice-1-browser-proof.md`.

## [2026-11-19 18:08] session — F55 fatia 1: documentos da feature, arquitetura e manual da regra de identidade

Documentos da fatia 1 da F55, no ramo `fix/f55-one-album-identity-rule`.

- **Feature** (`docs/specs/features/F55-the-album-asked-for-or-a-notice/`): `spec.md` em `In Progress`, com as duas fatias (a 1 feita, a 2 não), dez requisitos (nove com o teste que os prova) e a mudança de comportamento declarada; `plan.md` com o desenho como foi construído, as decisões do agente (dois degraus de acerto, nota de edição por vocabulário fechado, o subtítulo) e os riscos; `tasks.md` com 17 tarefas (12 fechadas; a prova no navegador e a fatia 2 abertas).
- **`docs/specs/arch.md`:** seção nova no fim, «Uma regra só para dizer que é o mesmo álbum (F55)», com os lugares antes e depois, e a linha da regra em «Compartilhado».
- **Manual:** `23_Shared_Code.md` ganhou a regra; `08_Frontend_Models.md`, o lado do app (`askedAlbum.js`, no lugar de `AlbumIdentity.js`); `06_Frontend_Data_Store.md`, a busca do Spotify como ficou; `17_Frontend_Services.md`, a contagem só-leitura e como rodá-la; `02_Server_Structure.md` e `04_Backend_Logic_Services.md`, o raspador e o Spotify do servidor; `24_Test_Suite.md`, os testes novos. Frases que ficaram falsas acertadas em `00_Dir_File_Structure_Map.md`, `01`, `07b` e `99`.
- **Para o MJRP decidir** (em `spec.md`, Open Questions): o subtítulo que não é nota de edição conta como parte do título; «(Live)» sozinho é nota de edição; «IV» não é «4». E falta rodar a contagem com o login dele antes de publicar.
- **Não tocado, e fica para o integrador:** o `tasks.md` da F52 ainda diz que a regra de identidade no raspador (TASK-12 de lá) não está feita; ela foi construída aqui.

## [2026-11-19 18:08] session — F55 fatia 1, app: cada lugar que aceita um álbum pergunta à regra única; contagem só-leitura do que está trocado (UAT-184)

Segunda parte da fatia 1 da F55, no ramo `fix/f55-one-album-identity-rule`: os lugares do app que aceitam um álbum passam a perguntar à regra única (`shared/albumIdentity.js`).

- **`public/js/models/askedAlbum.js`** (novo): lê a consulta guardada (o pedido) e o que cada fonte devolve (o candidato) nos mesmos três campos. Entrou no lugar de `models/AlbumIdentity.js`, a nota de semelhança em que o artista certo bastava, que foi removida.
- **Catálogo da Apple Music** (`CatalogAdapter.js`, e o caminho antigo em `api/client.js`): a regra escolhe entre os resultados da busca, em vez de valer o primeiro. O teste novo reproduziu a UAT-184 no código antigo: com «Shangri-La Dee Da» primeiro nos resultados, «Core» pedido carregava «Shangri-La Dee Da».
- **Identificador guardado:** o álbum a que ele leva é conferido pela regra. Se for outro álbum, o álbum é buscado pelo nome, e o resultado traz `metadata.replacedSourceId`. Nada é gravado na série (é a fatia 2).
- **Spotify** (`SpotifyService.js`): três buscas só listam candidatos; a regra aceita um ou nenhum. Saíram «um título contém o outro», o primeiro resultado como reserva e a nota por distância de edição.
- **Dados locais de capa** (`OptimizedAlbumLoader.js`): a linha do álbum pedido, ou nada; a primeira linha da busca não serve mais de reserva.
- **Resposta da busca por IA** (`api/client.js`): conferida pela regra; outro álbum vira «o servidor não tem», sem nova chamada paga.
- **Contagem só-leitura** (`services/albums/albumIdentityAudit.js`): para cada álbum pedido nas séries, o álbum que o app tem e o veredito. Pelo console, com a conta do dono: `await albumIdentityAudit()`. Lê por `peek` (novo nos guardados): não promove nem apaga nada.
- **Função de aptidão** (`test/architecture/albumIdentityRule.test.js`): falha se um desses lugares deixar de perguntar à regra ou voltar a comparar texto.
- Saíram também, por não terem mais quem use: as funções de semelhança e de chave de `utils/stringUtils.js`, os normalizadores de álbum e artista de `utils/NormalizationUtils.js`, e `extractArtist`/`extractAlbum` de `api/client.js`.
- `npx vitest run`: 919 testes; `npx vite build` compila. **Não visto num navegador** (o auxiliar não tem um). Mudança de comportamento: um álbum cujo título guardado difere do título do catálogo por um qualificador que não é edição passa a «não encontrado».

## [2026-11-19 18:07] session — F55 fatia 1, regra e servidor: uma regra só diz «este é o álbum pedido», e o raspador pergunta a ela (UAT-184)

Ramo `fix/f55-one-album-identity-rule`, da ponta da `main` local. Primeira parte da fatia 1 da F55 (UAT-184: a série pedia «Stone Temple Pilots - Core» e mostrava «Shangri-La Dee Da»).

- **A regra:** `shared/albumIdentity.js`, pura, usada pelo app e pelo servidor. `compareAlbumIdentity(pedido, candidato)` devolve um veredito tipado (igual ou diferente, com o motivo); `pickAlbum` escolhe o candidato que passa, ou nenhum. O título tem de bater por conta própria, inteiro; o artista tem de bater; o ano só ordena. Um subtítulo depois de «:» ou « - » só sai se for nota de edição. O teste de «Core» contra «Shangri-La Dee Da» e «Core Memories» foi escrito primeiro (`test/shared/albumIdentity.test.js`).
- **O servidor:** `server/lib/albumIdentity.js` carrega a regra. O raspador (`server/lib/scrapers/besteveralbums.js`) pergunta a ela em todos os pontos em que aceitava por «um texto contém o outro»; a busca em HTML não pega mais o primeiro link; a página de um resultado cujo rótulo já diz que é outro álbum não é aberta. O Spotify do servidor (`spotifyPopularity.js`) pegava o primeiro resultado da busca; agora escolhe pela regra, e a busca só pelo artista, que quebrava num nome nunca importado, voltou a funcionar.
- **Lido da fonte, para conhecer o formato** (cinco leituras do BestEverAlbums, sem login e sem custo): os resultados da busca vêm rotulados «Título by Artista»; a página do álbum diz o mesmo no `<title>` e no cabeçalho; a busca em HTML não devolveu nenhum link de álbum.
- Testes: 919 no fim da fatia (eram 789). Nada publicado; conserto em `server/` só se prova publicando.

## [2026-11-19 17:47] decision — MJRP: o conserto do Scan (UAT-204) passa na frente depois da F55; a conformidade de 28/10 fica de lado

Palavras do MJRP: «1. Sim pode 2.deixa de lado por enqto». (1) O conserto da UAT-204 (resposta imediata ao clique, prazo na consulta ao catálogo, «tentar de novo») é feito assim que a fatia 1 da F55 entrar na `main`. (2) A conformidade aberta em 2026-10-28 (`.mjrp/conform.json`) não é retomada nem largada agora; a trava de fim de turno segue registrando o vermelho dela.

## [2026-11-19 17:41] session — F52 fatia 1 em produção (site e servidor)

Site publicado da `main` (`de14155`, pacote `main-DQ1jxjKx.js`) e, depois, o servidor (revisão `mjrp-proxy-00199-hsv`; a volta é `mjrp-proxy-00198-5df`). Conferido em produção: 401 no formato novo sem login; com login, notas `found` e `not_found`, lista da IA `found` e a Home classificando com ela. Não visto: `/api/generate` com a chave, a carga segurando a fila, falha real da fonte. Prova: `reports/evidence/F52/2026-11-19-slice-1-browser-proof.md`. Também hoje: o MJRP disse que o Scan voltou a funcionar; o registro do servidor mostra que o clique que falhou não chegou ao servidor (UAT-204 segue aberta: sem prazo nem aviso na consulta ao catálogo).

## [2026-11-19 17:38] review — F52 fatia 1 revisada e provada pelo integrador

Ramo do auxiliar com a `main` junto: 789 testes, build ok. Prova em `reports/evidence/F52/2026-11-19-slice-1-browser-proof.md` (oito cenários; três coisas vistas só em teste de unidade, ditas lá). Escolhas do auxiliar que ficam, revisáveis: erro do provedor de IA sai como 424; página com zero notas casadas passa a `empty`; aba antiga lê a lista da IA só depois de recarregar. UAT-181 e UAT-23 seguem abertas (fatias 2 a 4).

## [2026-11-19 17:33] session — F52 fatia 1: documentos da feature e manual do contrato de resposta

Documentos da fatia 1 da F52, no ramo `fix/f52-server-tells-the-truth`.

- **Feature** (`docs/specs/features/F52-server-album-generation-back/`): `spec.md` em `In Progress`, com as quatro fatias (a 1 feita, as 2 a 4 não), oito requisitos e a mudança de comportamento declarada (página com zero notas deixa de contar como «tem notas»); `plan.md` com o desenho como foi construído e as decisões tomadas na construção; `tasks.md` com 20 tarefas (12 fechadas, duas à espera do MJRP).
- **Manual:** `03_Backend_API_Layer.md` ganhou o contrato da resposta, a lista fechada de códigos e a tabela do provedor de IA, linha por linha; `07_Frontend_Data_Infra.md` ganhou o leitor único, a carga segurada e o quadro das duas direções da publicação separada. Frases que ficaram falsas foram acertadas em `01`, `02` e `07b`.
- **`docs/specs/arch.md`:** a proposta diz agora que a fatia 1 está construída e quais dos pontos «ainda não verificados» foram vistos.
- O título da feature nos três documentos passou a «O servidor diz a verdade», o nome da proposta aprovada (era «A busca de álbum por IA do servidor volta a responder»).
- **Para o MJRP decidir** (em `spec.md`, Open Questions): aceitar que uma aba antiga fique sem a lista por IA até recarregar, ou o servidor manter `albums` no topo da resposta por um tempo.

## [2026-11-19 17:33] session — F52 fatia 1, app: um leitor da resposta do servidor, falha como falha, 401 e 429 seguram a carga (UAT-23)

Segunda metade da fatia 1 da F52, no mesmo ramo (`fix/f52-server-tells-the-truth`): o lado do app.

- **Um módulo lê a resposta do servidor** (`public/js/api/serverResult.js`, puro): `found`, `not_found`, `no_ratings`, ou `failed` com `code`, `retryable`, `status` e `hold`. Um 200 sem `outcome` é o servidor antigo (`legacy`) e segue a regra de antes; o erro antigo `{ error: 'texto' }` é lido pelo status.
- **Repetir é decidido pelo campo `retryable`**, nunca só pelo status (`api/client.js`, `_fetchAlbumFromAPI`): um 500 que diz «não repita» é uma chamada paga só.
- **Notas** (`adapters/enrichers.js`): falha é lançada como veio, e a carga marca a fonte como `failed`; `not_found` e `no_ratings` viram `empty`. **Mudança de comportamento:** página com zero notas casadas deixa de contar como `done` com o servidor novo, o que muda o filtro «por fonte» para esses álbuns.
- **Lista de álbuns por IA** (`AlbumSearchService`): a falha não fica mais guardada como «a IA não conhece álbuns» pela sessão; uma busca pergunta a lista uma vez só.
- **401 e 429 do próprio servidor seguram a carga** (`AlbumLoadService._addHeld`, `TaskQueue.pause/resume`): nenhum álbum é marcado como falha; no 429 a carga volta no prazo do `Retry-After`; no 401 ela para de perguntar até `resume()`, uma nova carga ou «tentar de novo», com um aviso só. A fila das notas pausa; a da busca de álbuns não (ela também fala com a Apple Music).
- **`_enrichOne` foi dividido** (tinha complexidade 21): `_newAsk`, `_askSource`, `_overNewestAlbum`, `_publishSource`.
- **Conferido:** `npx vitest run` com 786 testes (eram 590), `npx vite build` compila. As duas direções da publicação separada têm teste: site novo contra servidor antigo (`serverResult.test.js`, `client.test.js`, `AlbumSearchService.aiList.test.js`) e aba antiga contra servidor novo (`oldTabAgainstNewServer.test.js`).
- **Não visto:** nada foi conferido num navegador nem publicado. **Limite conhecido:** uma aba antiga deixa de ler a lista por IA do servidor novo até ser recarregada (a lista foi para `data.albums`) e classifica sem ela.
- **Não mexido:** `EMPTY_TRUSTED_FOR_MS` (1 hora) e a versão do registro guardado.

## [2026-11-19 17:31] session — F52 fatia 1, servidor: um contrato de resposta, o raspador lança a falha, tabela do provedor de IA (UAT-23, UAT-181)

Ramo `fix/f52-server-tells-the-truth`, de um agente auxiliar, da ponta da `main` (`be346b8`). Primeira metade da fatia 1 da F52 (seção 11 da proposta em `docs/specs/arch.md`): o lado do servidor.

- **Um módulo monta toda resposta** (`server/lib/outcome.js`): sucesso é `{ data, outcome }`, com `outcome` sempre presente (`found`, `not_found`, `no_ratings`); falha é `{ error: { code, retryable } }`, com `code` de uma lista fechada de sete. O respondedor de erros, a porta de login e o limite por pessoa passaram por ele, com os status de antes.
- **O raspador de notas lança a falha** (`server/lib/scrapers/besteveralbums.js`): sete `catch` engoliam erro de rede, prazo e 429 e viravam «não achei» (um deles aceitava a página sem vê-la). Agora toda requisição passa por uma função que lança; `null` só quando a fonte respondeu a tudo e nada bateu. Como um álbum é aceito não mudou.
- **Notas** (`POST /api/enrich-album`): responde 200 com o desfecho ou 502, 503, 504; deixou de pedir a chave de IA.
- **IA** (`POST /api/generate`, `POST /api/ai/studio-albums`): uma tabela fechada (`server/lib/aiProviderOutcome.js`) diz o que sai para cada resposta do provedor. Cobrança, cota, pedido recusado e resposta inaproveitável saem como 424 com `retryable: false` (a aba antiga não repete 4xx); só falha passageira sai como 5xx. O texto do provedor não sai mais; a lista por IA não responde 200 vazio na falha.
- **Conferido:** 135 testes do servidor na suíte da raiz; e o servidor de verdade numa cópia local (`curl`): 401, 400, 503 sem a chave, `found` e `not_found` contra o BestEverAlbums, 502 com a fonte inalcançável. Nenhuma rota paga foi chamada.
- **Não feito aqui:** `musickit`, `playlists` e as rotas de depuração seguem montando o próprio erro. Nada foi publicado.

## [2026-11-19 17:24] session — UAT-204 aberta: Scan parece não fazer nada (relato do MJRP)

O MJRP relatou, em produção, que clicar em Scan não faz nada. Não reproduzido pelo agente (visitante em produção: 12 álbuns; com login pelo app local: 0,8 s e 4,8 s). Hipótese: a busca espera a IA (até 60 s) sem resposta visível ao clique; o relato veio minutos depois da publicação do servidor em Node 24 (partida a frio).

## [2026-11-19 17:12] session — décimo deploy do site e servidor em Node 24 em produção

Site publicado da `main` (`bcdd114`, pacote `main-CYRWnKB2.js`): o aviso ao visitante na janela de entrada está no ar; sair da conta recarrega o app (visto só nos testes). Servidor publicado por `npm run deploy:server` (primeiro uso real do script) da `main` (`3a5c859`): revisão `mjrp-proxy-00198-5df`, imagem `node:24-slim`. Conferido em produção: `/api/debug/files` 404, `/api/musickit-status` 200, `/api/generate`, `/api/enrich-album` e `/api/ai/studio-albums` 401 sem login; `/api/enrich-album` 200 com login (pelo app local, notas de «Brothers in Arms»). A volta é a revisão `mjrp-proxy-00197-mps`. A trava de fim de turno passou a exigir o critério do conform aberto em 2026-10-28 (`.mjrp/conform.json`), que fecha vermelho (12 lacunas, 61 notas, catálogo defasado em 7); não é desta sessão, fica para o MJRP decidir.

## [2026-11-19 17:09] decision — servidor em Node 24 (ADR-0020)

O MJRP decidiu «24». `server/Dockerfile` passa de `node:18-slim` para `node:24-slim`; ADR-0020, `tech-stack.md`, `arch.md` e a pergunta aberta da F64 atualizados. Publica sozinho por `npm run deploy:server`; a volta é a revisão `mjrp-proxy-00197-mps`.

## [2026-11-19 17:06] session — UAT-12 cita o commit certo

A issue passa a citar `2a39683`.

## [2026-11-19 17:05] session — F60: visitante não leva dados e a janela de entrada avisa (UAT-12); sair da conta recarrega o app

Duas decisões do MJRP de hoje, feitas: a janela de entrada mostra «Series, playlists and inventory made as a guest stay with the guest session. They are not copied to your account when you sign in.»; e sair da conta recomeça o app da Home numa página nova (`utils/reloadApp.js`), o que tira da tela séries e playlists de quem saiu, além do inventário. Três testes novos, vistos falhar antes; a suíte tem 593 passando. No navegador: a janela de entrada mostra o aviso e os três botões. O recarregar ao sair não foi visto no navegador (sairia da conta no painel de teste).

## [2026-11-19 17:04] decision — quatro decisões do MJRP: visitante não leva dados, sair recarrega, F52 pode ir ao código, Node 24

Respostas do MJRP às quatro perguntas do agente, nas palavras dele:
1. Dados de visitante ao entrar com conta (UAT-12): «não levar e avisar».
2. Sair da conta deve recarregar o app: «sim».
3. F52, ir para o código com a proposta emendada (`docs/specs/arch.md`, «O servidor diz a verdade», seção 11): «sim».
4. Node do servidor: «24».

O que cada uma destrava: a UAT-12 fecha com um aviso na janela de entrada, sem cópia de dados; o sair da conta passa a recarregar a página, o que limpa séries e playlists da tela junto com o inventário; a F52 começa pela fatia 1 (contrato de resultado, um formato de erro, tabela do provedor de IA, raspador que propaga a falha); a imagem do servidor passa de `node:18-slim` para `node:24-slim`, publicada sozinha para isolar o risco.

## [2026-11-19 16:57] session — nono deploy do site: F59 fatia E em produção

`npm run deploy:site`, da `main` em `474f8cf`: 590 testes, pacote conferido, Hosting publicado, e o `index.html` no ar aponta o pacote recém-construído (`/assets/main-D7HiVm63.js`). Em produção agora: o texto de fora tratado antes de entrar no HTML (UAT-199). Não visto em produção num navegador. A F59 está com as fatias A, B, C e E em produção; restam o Tailwind servido do próprio site (UAT-25) e a conferência de esquema de dois endereços vindos de provedores.

## [2026-11-19 16:57] session — F59 fatia E na `main`: texto de fora entra no HTML como texto (UAT-199)

Ramo `fix/f59-escape-outside-text`, de um agente auxiliar, conferido pelo integrador: 590 testes passando, build compilando. `escapeHtml` (`public/js/utils/stringUtils.js`) virou função pura e trata também as aspas, de modo que vale dentro de atributo; 61 pontos em 20 arquivos de tela passaram a usá-la; um teste de arquitetura (`test/architecture/outsideTextEscaped.test.js`) lê os modelos de HTML e reprova um campo de texto de fora sem tratamento.

- **No navegador:** uma série chamada com HTML hostil aparece como texto na tela da série, no blend, no painel de todas as séries e na janela de apagar; nenhuma imagem injetada. A série de teste foi apagada.
- **Não visto:** o nome na lista do filtro de séries não bateu letra por letra (não investigado); sugestões da Home, selo do inventário e nome no diálogo do Spotify só em teste automático.
- **Fica de fora, para decidir:** dois endereços vindos de provedores são postos em `href` sem conferir o esquema (`Card.js`, `ConsolidatedRankingView.js`).
- **Observação do agente auxiliar:** o teste de arquitetura usa o `espree`, que vem pelo ESLint e não está declarado direto no `package.json`.
- **F59:** fatias A, B, C e E feitas; a D é a F66. Falta da fatia E original o Tailwind servido do próprio site (UAT-25), que não foi tocado.

## [2026-11-19 16:53] session — F59 fatia E (texto): texto de fora do código vira texto na tela (UAT-199), no ramo `fix/f59-escape-outside-text`

Ramo `fix/f59-escape-outside-text`, a partir da `main` em `ce5d2b4`; não entrou na `main`, não foi publicado. `escapeHtml` (`public/js/utils/stringUtils.js`) passou a ser uma função pura, sem DOM, que troca `& < > " '` — serve para conteúdo de elemento e para valor de atributo entre aspas; `null` e `undefined` viram texto vazio. As duas cópias locais (`FilterToolbar`, `RegeneratePanel`) chamam essa. Aplicada em 61 pontos de 20 arquivos: nomes de álbum, faixa, artista, série, playlist e lote, mensagem de erro (tela de erro do roteador, exportação do Spotify, menu de mistura), nome, e-mail e foto da conta, endereço lido da URL (trilha de navegação), ids e endereços de capa dentro de atributos. O que já era texto (`SafeDOM`, `textContent`) ficou como estava; rótulos escritos no código não foram tocados. Testes: 9 da função, 17 de telas desenhadas com um nome como `<img src=x onerror=...>` (11 falhavam antes do conserto) e 3 de um teste de arquitetura que falha quando um modelo de HTML recebe um campo de texto de fora sem `escapeHtml` (teria apontado 31 dos pontos consertados; 5 exceções listadas, todas texto escrito no código). Suíte: 590 testes passando; `vite build` compila. Não visto num navegador. Ficou fora, para decisão: endereços vindos de provedor postos em `href` por `setAttribute` (`Card.js`, `ConsolidatedRankingView.js`) aceitam `javascript:`; a política de conteúdo e o Tailwind (UAT-25) continuam abertos na fatia E.

## [2026-11-19 16:31] session — oitavo deploy do site, o primeiro pelo script da F64: F60 em produção

`npm run deploy:site`, da `main` em `c370dcd`. O script exportou a `main`, rodou os testes, construiu, conferiu o pacote, publicou só o Hosting e conferiu produção sozinho: o `index.html` no ar aponta o pacote recém-construído (`/assets/main-BEULvoEC.js`), servido como script. É a primeira prova da F64 com um deploy de verdade (o do servidor ainda não foi usado). Em produção agora: a F60 (salvar playlists sem perder o lote, um salvamento por vez, playlists que voltam ao recarregar, aviso de alteração não salva, apagar série com as playlists, inventário que sai com a pessoa). Não visto em produção num navegador. Como voltar: histórico de versões do Hosting.

## [2026-11-19 16:30] session — F60 na `main`; UAT-196, UAT-197, UAT-198 e UAT-05 em `fixed`

O ramo `fix/f60-no-saved-work-lost` (agente auxiliar, conferido pelo integrador) entrou na `main` em `fa141c0`. A suíte tem 561 testes passando.

- **Mudanças de comportamento que o MJRP precisa julgar** (o agente auxiliar as fez junto com os consertos): salvar playlists não regrava mais a série inteira a partir da memória; **apagar uma série apaga as playlists dela**, depois de a janela dizer quantas, sem desfazer; a cópia de inventário de visitante para conta saiu (só rodava no caso do defeito); o roteador passa a perguntar também no voltar do navegador; salvar um conjunto vazio é recusado.
- **Sem conserto, por decisão de desenho pendente:** UAT-12 (dados de visitante ao entrar). A issue traz as três saídas.
- **Perguntas abertas pelo agente auxiliar:** sair da conta deve recarregar o app? (só o inventário é limpo; séries e playlists em uso ficam na tela); o aviso de sair usa a caixa nativa do navegador, não o diálogo do app.
- **Achados dele, não consertados:** a data de criação de uma playlist regravada vira um mapa em vez de data; salvar sem conexão fica em «Saving...» sem prazo; apagar um lote e apagar todas as playlists de uma série ainda apagam um documento por vez; os álbuns guardados dentro de uma série não são apagados com ela.

## [2026-11-19 16:29] session — F60 conferida no navegador pelo integrador (parte); evidência gravada

O ramo veio de um agente auxiliar, com 561 testes passando depois de trazer a `main`. No navegador, com o login do MJRP e uma série de teste: playlists geradas voltam ao recarregar (UAT-05); dois cliques em salvar gravam um lote só; editar e salvar troca o lote sem sobra; o aviso de alteração não salva pergunta e respeita o não; apagar a série avisa que as playlists vão junto. **Não visto no navegador**, só em teste automático: a gravação que falha no meio (UAT-196), o inventário ao sair da conta (UAT-198) e o salvamento na série errada. `reports/evidence/F60-no-saved-work-lost/F60-browser-2026-11-19.json`.

## [2026-11-19 16:24] session — F60: documentos da feature, `behavior.md` e manual escritos do que foi feito; a UAT-12 fica como pergunta de desenho

- **Feature:** `docs/specs/features/F60-no-saved-work-lost/` com `spec.md` (`status: In Progress`, nove requisitos, oito com o teste que os prova), `plan.md` e `tasks.md` preenchidos a partir dos três commits do ramo. O conferidor de forma e o de tarefas passam; o `doctor.py` segue com os mesmos 520 erros de antes da feature.
- **UAT-12 (dados de visitante ao entrar), investigada e não consertada:** o visitante é uma conta anônima do Firebase; entrar com Google ou Apple troca de `uid`, e as regras do banco só deixam cada `uid` ler o que é seu, então depois do login o app não alcança mais o que o visitante gravou. Três caminhos, escritos em Open Questions do spec: vincular a conta anônima (o `uid` não muda e nada é copiado; recusado quando a conta já existe), copiar antes e depois do login, ou não levar e dizer isso. A escolha é do MJRP.
- **Outras duas perguntas para o MJRP, no mesmo lugar:** recarregar o app ao sair da conta (séries e playlists em memória ainda ficam na tela; só o inventário foi tratado); e a pergunta ao sair com alteração não salva usar a janela do app em vez do `confirm` do navegador (pede que o roteador espere a resposta).
- **Documentos acertados:** `docs/specs/behavior.md` (seis estados reescritos, três novos), `docs/specs/data-model.md`, `docs/specs/arch.md`, `docs/manual/` (01, 06, 07, 17, 19, 20, 21, 24, 99). `docs/specs/uat.md`, `MEMORY.md` e `ROADMAP.md` não foram tocados: são do agente integrador.
- **Não visto num navegador por quem implementou:** a prova é do agente integrador, com o login do MJRP.

## [2026-11-19 16:19] session — F60: playlists geradas e não guardadas voltam depois de recarregar a página (UAT-05); gerar de novo não troca a série

- **UAT-05, investigada e consertada (coube sem mudar o desenho):** a issue dizia que o conjunto era gravado no navegador e nunca lido de volta. O código mostrou mais: a geração escreve direto na loja, sem passar pelo serviço, então o conjunto recém-gerado nem chegava a ser gravado; só as edições de faixa gravavam. Agora o `PlaylistsService` acompanha a loja e mantém no navegador um rascunho do conjunto que ainda não está no banco, com o `uid` de quem o fez; `PlaylistsController.initialize` devolve o rascunho à tela quando ela abre vazia, para a mesma série e a mesma pessoa, e avisa «Your unsaved playlists were restored».
- **Regras do rascunho:** um só por vez; conjunto salvo não é rascunho (salvou, o rascunho some; abrir um lote salvo para editar toma o lugar dele); tela vazia não apaga o rascunho; rascunho de outra pessoa, de outra série ou gravado por versão antiga do app (sem dono) não volta.
- **Fora do alcance, dito para não parecer feito:** edições não salvas de um lote já salvo (endereço `/playlists/edit`) continuam se perdendo ao recarregar; para esse caso existe agora o aviso do navegador antes de sair.
- **Gerar de novo (`BlendingController.regenerate`):** gravava no conjunto da tela a série ativa em outro lugar, e o salvamento seguinte ia para ela (segunda origem do «salvar na série errada» da UAT-197, reproduzida em `test/controllers/BlendingController.regenerate.test.js`). Agora mantém a série do conjunto.
- **Testes:** 530 passando; `vite build` compila.

## [2026-11-19 16:18] session — F60: ao sair da conta o inventário some da tela e não é copiado para a conta seguinte (UAT-198)

- **Confirmado no código e em teste, antes do conserto** (`test/stores/inventory.userChange.test.js`, seis casos, todos falhavam): ao sair, o Firebase avisa primeiro «sem usuário» e logo depois a conta anônima que o app abre sozinho. No primeiro aviso a loja tentava ler o inventário de `anonymous-user`, as regras do banco recusavam, e os álbuns da pessoa anterior ficavam na memória e na tela. No segundo aviso a loja via «era anônimo, tem álbuns, chegou uma conta» e copiava o inventário inteiro da pessoa anterior para a conta anônima nova.
- **Conserto (`public/js/stores/inventory.js`):** na troca de pessoa o inventário em memória é esvaziado na hora, antes de qualquer leitura, e a tela é avisada; entre a saída e a conta seguinte não se lê nada; uma resposta de leitura que chega depois da troca é descartada.
- **A cópia de visitante para conta saiu deste caminho, e o MJRP precisa saber:** ela só rodava no caso do defeito. Um visitante de verdade tem um `uid` anônimo do Firebase, nunca o texto `anonymous-user`, então a condição nunca valia para ele; o inventário de visitante nunca migrou em produção. Levar os dados do visitante para a conta é a UAT-12, que fica como pergunta de desenho.
- **Visto e não mexido:** as séries e as playlists em memória também não são esvaziadas ao sair (só o inventário tinha issue). Recarregar o app ao sair resolveria tudo de uma vez; é decisão de desenho.
- **Testes:** 515 passando.

## [2026-11-19 16:18] review — crítica separada da proposta da F52: «não pode ir ainda»; proposta emendada

Relatório: `reports/audits/2026-11-19-mjrpalbumblender-v0-f52-proposal-critique.md`. Agente separado, só de leitura, 5 minutos. Dois achados que bloqueiam, conferidos pelo implementador no código: a falha das notas é engolida dentro do raspador, não no serviço (mudar só o serviço carimbaria «não achei» em falhas); e virar o erro do provedor de IA em 5xx faria o app repetir chamadas pagas. Mais seis correções antes do código e dois cortes. A proposta ganhou a seção 11, que vale sobre as anteriores, com as fatias refeitas. A direção (contrato de três desfechos, sem guardado em banco no servidor por enquanto) foi mantida. Falta o ok do MJRP para ir ao código.

## [2026-11-19 16:14] session — F64 na `main`: um caminho só para publicar (`npm run deploy:site`, `npm run deploy:server`)

O ramo `fix/f64-one-tested-way-to-production`, feito por um agente auxiliar em cópia isolada e conferido pelo integrador, entrou na `main`. O integrador leu os scripts (o que apagam, como tratam o `.env`, onde publicam) e rodou `npm run deploy:site:dry-run` até o fim: exporta a `main` para uma pasta temporária fora do repositório, roda os 493 testes, constrói, confere o pacote (o mesmo `main-DTBLM2CE.js` que está em produção) e para antes de publicar.

- **O que mudou:** `scripts/deploy-site.sh` e `scripts/deploy-server.sh` no lugar dos dois scripts antigos e do `cloudbuild.yaml` (removidos); `.github/workflows/ci.yml` só roda os testes e não publica; o manual `00_Deployment_and_Setup.md` descreve o caminho único e como voltar.
- **Não provado:** um deploy de verdade com os scripts novos (o próximo já será por eles); o `deploy-server.sh` em modo de ensaio foi rodado pelo agente auxiliar, não repetido pelo integrador; a automação do GitHub nunca rodou.
- **Decisão que espera o MJRP:** o Node da imagem do servidor continua em 18 (fora de suporte). O agente auxiliar tinha trocado para 26; o integrador reverteu, porque muda o que produção roda.
- **Segue aberto da UAT-20:** a verificação de código (`eslint`) tem 81 erros e não entra na automação.

## [2026-11-19 16:13] session — F60: salvar playlists não perde o lote, grava uma vez, na série certa; apagar a série leva as playlists (UAT-196, UAT-197)

- **Ramo:** `fix/f60-no-saved-work-lost`, a partir da `main` em `2adcdef`. Nada publicado, nada mesclado.
- **UAT-196 (reproduzida em teste, com um Firestore em memória que falha quando mandado):** o salvamento em modo de edição apagava o lote antigo e depois gravava o novo; com a gravação falhando, o lote sumia. Agora a regra do salvamento mora em `PlaylistsService.saveCurrentBatch`, e a gravação é uma só, atômica, em `PlaylistRepository.replaceBatch`: grava as playlists novas e remove as que elas substituem no mesmo envio. Falhou, fica tudo como estava e a tela avisa.
- **UAT-197, os quatro reproduzidos antes do conserto:** (1) segundo clique com a primeira gravação no ar gravava o lote duas vezes: agora só um salvamento por vez, e o botão é desenhado desabilitado a partir do estado (`isSaving`), então um redesenho da tela não devolve um botão clicável; (2) o salvamento ia para a série ativa na tela, não para a série das playlists: agora a série vem de um lugar só (`playlistsStore.seriesId`), e contexto de edição de outra série recusa o salvamento; (3) apagar a série deixava as playlists gravadas sem dono: `SeriesRepository.deleteWithPlaylists` apaga série e playlists num envio só, e a janela de confirmação diz quantas playlists e lotes vão junto; (4) não havia aviso ao sair com alteração não salva: agora há, por link ou botão do app, pelo voltar do navegador e ao fechar ou recarregar a aba.
- **Mudanças de comportamento que vieram junto, para o MJRP saber:** o salvamento não regrava mais a série inteira a partir da memória (achado 2.2 do mapa): só toca o `updatedAt` dela, no mesmo envio; se a série não existe mais, o salvamento é recusado com aviso, em vez de criar playlists sem série. Tirar uma playlist inteira da tela passou a contar como alteração não salva. Abrir para edição um lote que não existe mais esvazia a tela, em vez de deixar o lote anterior sob o nome novo.
- **Roteador:** os ganchos de antes de navegar agora podem ser removidos e valem também para o voltar do navegador; um endereço desconhecido sem rota `/home` não chama mais a si mesmo até estourar a pilha (era a origem do «Maximum call stack size exceeded» na saída da suíte).
- **Arquitetura:** `PlaylistsService.js` não importa mais o Firestore (a lista de exceções do teste de fronteiras encolheu para um arquivo); `handleSave` do controlador caiu de complexidade 27 para um caminho curto.
- **Testes:** suíte com 509 passando (462 antes); `vite build` compila. Arquivos novos: `test/helpers/fakeFirestore.js`, `test/controllers/PlaylistsController.save.test.js`, `test/services/PlaylistsService.save.test.js`, `test/services/SeriesService.delete.test.js`, `test/views/unsavedChangesGuard.test.js`, `test/components/playlists/PlaylistsGridRenderer.save.test.js`.
- **Falta nesta feature:** UAT-198, a análise da UAT-05 e da UAT-12, os documentos da feature, o manual e o `behavior.md`; a prova no navegador é do agente integrador.

## [2026-11-19 16:13] session — F64 conferida pelo integrador: o Node do servidor fica em 18 até o MJRP decidir; `arch.md` e `tech-stack.md` em dia

O agente auxiliar entregou a F64 com a imagem do servidor em Node 26. Mudar o Node muda o que produção roda, e isso é decisão do MJRP: o `server/Dockerfile` volta a `node:18-slim` (o que está no ar), com a pendência escrita. `docs/specs/arch.md` (segredos, implantação do site e do servidor) e `docs/specs/tech-stack.md` deixam de citar os scripts antigos e o `cloudbuild.yaml`.

## [2026-11-19 16:12] session — proposta de arquitetura da F52 escrita: «O servidor diz a verdade»

`docs/specs/arch.md`, seção nova no fim. O MJRP pôs como condição da v5.0 que a arquitetura esteja documentada antes do código; esta é a proposta da F52, escrita enquanto a F60 e a F64 rodavam em paralelo. Pontos: um contrato de resultado só para as rotas do servidor (tem o dado; a fonte não tem; não deu para saber), com a falha nunca lida como «sem dado»; o raspador só aceita o álbum certo, pela regra de identidade da F55; **não** começar por um guardado no servidor (o app já guarda por 7 dias; falta poder confiar no «não tem»), e medir antes de pôr banco; uma fila educada para a fonte raspada. Sete riscos, cinco alternativas, cinco fatias e três decisões que são do MJRP. Ainda **sem crítica separada**: é o passo seguinte, antes de qualquer código.

- **F64:** o agente auxiliar entregou o ramo `fix/f64-one-tested-way-to-production`; ainda não conferido nem integrado.
- **Fatia E da F59** (texto inserido como HTML) adiada para depois da F60: o levantamento achou 71 pontos candidatos em 25 arquivos de tela, vários deles os mesmos em que a F60 está mexendo.

## [2026-11-19 16:11] session — F64: spec, plano e tarefas escritos do que foi feito; evidência dos dois ensaios

- **Documentos da feature** (`docs/specs/features/F64-one-tested-way-to-production/`): `spec.md` em `In Progress` com seis requisitos, `plan.md` com o desenho, a decisão sobre as duas receitas da imagem e o risco do Node 26, `tasks.md` com sete tarefas fechadas (commit `fca0108`) e três à espera do MJRP: a primeira publicação real, a automação rodar no GitHub e o aceite.
- **Evidência:** a saída dos dois ensaios em `reports/evidence/F64-one-tested-way-to-production/` (os caminhos da pasta temporária trocados por `<TMP>`).
- **Pergunta aberta para o MJRP:** o Node do servidor passa de 18 para 26 na próxima publicação do servidor.

## [2026-11-19 16:08] session — F64: um script para publicar o site e um para o servidor; receitas antigas removidas

- **Scripts novos:** `scripts/deploy-site.sh` e `scripts/deploy-server.sh` (parte comum em `scripts/lib/deploy-common.sh`), chamados por `npm run deploy:site` e `npm run deploy:server`. Fazem os passos que vinham sendo feitos à mão: recusam se a `main` tem mudança não commitada, exportam a `main` para uma pasta temporária do sistema, `npm ci`, `npx vitest run`, constroem ou montam, conferem o que vai ser enviado, publicam, conferem a produção e mostram como voltar atrás. Usam o login do Firebase CLI e do gcloud; chave de conta de serviço é aceita se existir.
- **`--dry-run`:** faz tudo menos publicar e conferir a produção. Os dois rodaram até o fim na `main` em `e54c80e` (493 testes): o site com o Client ID do Spotify nos scripts, sem `.map`, 40 arquivos em `dist/`; o servidor subiu localmente na arrumação da imagem (`/api/musickit-status` 200, `/api/debug/files` 404, prompts e `shared/` carregados). **Nada foi publicado.**
- **Removidos:** `scripts/deploy-prod.sh`, `scripts/deploy-backend.sh` e `cloudbuild.yaml`. A produção usa `gcloud run deploy --source` (a imagem em uso vem de `cloud-run-source-deploy`); o `cloudbuild.yaml` era a receita que não copiava os prompts (UAT-22).
- **Node do servidor:** `server/Dockerfile` passa de `node:18-slim` para `node:26-slim` e de `npm ci --only=production || npm install` para `npm ci --omit=dev`. O servidor sobe no Node 26 com as dependências do lockfile; a assinatura ES256 do token da Apple foi exercitada com uma chave descartável. **Só vale na próxima publicação do servidor, que depende do sim do MJRP.**
- **Automação do GitHub:** `.github/workflows/ci-firebase.yml` vira `ci.yml`: roda `npx vitest run` em push e pull request e não publica nada. **Não testada: não rodou no GitHub.** O lint ficou de fora (81 erros hoje), então a UAT-20 segue aberta nessa parte.
- **Manual:** `docs/manual/00_Deployment_and_Setup.md`, seções 1 e 2, reescritas para o caminho único, com o que precisa existir na máquina e como voltar atrás.
- **Fica de fora (caminhos de outro agente ou fora do combinado):** `docs/specs/arch.md` e `docs/specs/tech-stack.md` ainda citam os scripts antigos e o `cloudbuild.yaml`; os itens 6.1, 6.5, 6.6 e 6.7 do mapa da v5.0.

## [2026-11-19 16:08] session — F59 fatia C em produção: as rotas pagas respondem 401 sem login e funcionam com login

- **Sétimo deploy do site** (main `e54c80e`): o app manda o login em toda chamada ao servidor. 493 testes antes; build sem mapas de código.
- **Segundo deploy do servidor:** revisão `mjrp-proxy-00197-mps`, de uma cópia limpa da `main`. Ponto de volta: `mjrp-proxy-00196-sj7`.
- **Conferido em produção:** sem login, as quatro rotas guardadas respondem 401 (antes 200). Com o login real do MJRP (app local falando com o servidor de produção): notas 200, lista de álbuns por IA 200 com 6 álbuns, busca de álbum por IA 200 com «1999». As rotas do Apple Music seguem abertas, de propósito.
- **Não conferido:** o app publicado num navegador com login depois deste deploy; uma aba aberta desde antes precisa ser recarregada para mandar o login.
- **F59:** fatias A, B e C em produção; a D virou a F66; falta a E (texto inserido como HTML sem tratamento; Tailwind servido do site).

## [2026-11-19 16:05] session — UAT-16 cita os dois commits da F59

A issue passa a citar `c48689d` (rotas de depuração) e `e253edd` (porta das rotas pagas).

## [2026-11-19 16:05] session — F59, fatia C: as rotas pagas do servidor só respondem a quem está logado, com limite por pessoa

- **O MJRP:** «Go for it pls», à proposta de seguir pela fatia C; e a F60 e a F64 rodam em paralelo com agentes auxiliares, cada um em cópia isolada (ainda sem resultado).
- **Mudança de arquitetura (o MJRP pediu para ser avisado):** o servidor ganhou uma porta. `verifyIdToken.js` confere o login do Firebase sem o Admin SDK; `requireUser.js` responde 401, 403 ou 503; `rateLimit.js` conta por pessoa; `guards.js` é o único arquivo que conhece o Google e as variáveis. No app, `api/serverFetch.js` passa a ser o único jeito de chamar o próprio servidor, levando o login. Fechado por padrão. O desenho e as alternativas estão no `plan.md` da F59.
- **Decisão do agente, revisável:** visitante (login anônimo) não usa as rotas pagas de IA; usa as de notas. `PAID_ROUTES_ALLOW_ANONYMOUS=true` reabre.
- **Limites:** 60 chamadas pagas e 900 de notas por pessoa por hora, contadas na memória de cada instância.
- **Testes:** 36 novos (31 do servidor, 5 do app), vistos falhar antes; a suíte tem 493 passando. O build compila.
- **Prova:** numa cópia local do servidor, com o login real do MJRP e as chaves reais do Google: sem login 401; com login 200; a terceira chamada paga com o limite em 2 recebe 429; a tela de álbuns do app carrega as notas. Evidência na pasta da F59.
- **A publicar, nesta ordem:** o site primeiro (passa a mandar o login), o servidor depois (passa a exigir).

## [2026-11-19 15:53] decision — o token do Discogs sai da F59 e vira a F66, para a F59 poder fechar

- **O MJRP:** «Fatia D deixe pra depois, pode até abrir uma feat nova qqr coisa pra não impedir a issue de fechar, até pq nem me lembro o que seria essa feature com discogs».
- **F66** criada («O token do Discogs sai do repositório», `^REL-40`, via rápida, conserta a UAT-17). A F59 fica com as fatias A e B (feitas), C e E.
- **O que é o Discogs aqui (lido no código):** `scripts/generate-dataset.js` e `scripts/fetch-missing-artists.js` leem discografias do Discogs para montar o arquivo de álbuns da busca com autocompletar (`public/assets/data/`). São scripts rodados à mão, uma vez; o app em produção não fala com o Discogs. O token está escrito nos dois arquivos e no histórico do git.
- **Depende do MJRP:** trocar ou apagar o token no site do Discogs. Sem posição na ordem de prioridade; ele decide.

## [2026-11-19 15:47] session — primeiro deploy do servidor: rotas de depuração fechadas em produção (F59, fatia B)

- **Autorização do MJRP:** «2. Pode, só antes gere uma tag no git pra fechar a v4.0» (a tag `v4.0` foi criada antes).
- **Deploy:** `gcloud run deploy mjrp-proxy --source server`, de uma cópia limpa da `main` em `93a7dc4`, com os mesmos passos do `scripts/deploy-backend.sh` (pasta `shared` e `config` copiadas para o contexto). Revisão nova `mjrp-proxy-00196-sj7`, com 100% do tráfego. Ponto de volta: `mjrp-proxy-00195-9fg`.
- **Conferido em produção:** as quatro rotas de depuração respondem 404, direto e pelo endereço do site (antes 200); `/api/musickit-status` e `/api/musickit-token` 200; `/api/enrich-album` 200 com notas; `/api/generate` de «Prince - 1999» 200 com o álbum; o `rawStage` não devolve mais a resposta crua; variáveis e segredos do serviço mantidos.
- **Segue aberto:** as rotas pagas respondem sem login (fatia C).
- **Prioridade gravada pelo MJRP no Control Center** («Foi!»): as doze que não começaram, na ordem combinada.
- Evidência: `reports/evidence/F59-close-what-is-open-security/F59-probe-2026-11-19.json`.

## [2026-11-19 15:44] session — tag `v4.0`; F59 fatia A publicada; F59 fatia B (servidor) pronta e provada numa cópia local

- **O MJRP:** «1.sim 2. Pode, só antes gere uma tag no git pra fechar a v4.0».
- **Tag `v4.0`** (anotada, local) no commit `cd96ad3`, o que está em produção como v4.0 desde o quinto deploy. Não enviada: o push é do MJRP.
- **Sexto deploy do site (F59, fatia A):** `firebase deploy --only hosting` de uma cópia limpa da `main`; 455 testes antes. Conferido por fora: o site serve o pacote novo, e o endereço do mapa de código devolve a página do app, não o mapa. A conexão do Spotify em produção, com a conferência nova, não foi vista num navegador.
- **Prioridade:** o MJRP salvou pelo Control Center as doze que não começaram (F60, F64, F52, F55, F56, F61, F57, F58, F49, F62, F63, F65); o agente mestre confirmou que a F59, em andamento, fica à frente e abriu a UAT-628 no harness para a mensagem que não nomeava o item.
- **Fatia B (servidor):** `server/lib/debugGate.js` (as rotas de depuração e o `rawStage` só com `ENABLE_DEBUG_ROUTES=true`; `NODE_ENV` não liga) e `server/lib/asyncRoute.js` (rota que quebra responde 500, ou o 4xx de um pedido ilegível, sem detalhe). Sete testes, escritos junto com o código; a suíte tem 462 passando. Numa cópia local do servidor: as quatro rotas de depuração respondem 404 por padrão e 200 com a chave ligada.
- **Achado na leitura de produção:** o serviço do Cloud Run foi publicado por `gcloud run deploy --source`, com quatro segredos (IA e os três da Apple) e nenhuma variável do Spotify; o `Dockerfile` fixa `NODE_ENV=production`.

## [2026-11-19 15:40] decision — a ordem da v5.0 é a do agente: F59, F60, F64, F52, F55, F56, F61, F57, F58, F49, F62, F63, F65

- **O MJRP, do iPhone:** pediu a ordem do agente para arrumar no harness remoto e, depois de tentar, disse «de qqr forma a prioridade é essa acima».
- **O Control Center recusou o salvamento** da ordem com 13 itens: «feature que já começou … sai da ordem, a lista é das que ainda não começaram». A F59, primeira da lista, está `In Progress`. O `docs/specs/priority.md` continua com a ordem antiga (F49, F59, F52, F55, F56, F57, F58, F61); o arquivo é a válvula do MJRP e o agente não o editou.
- **Avisado ao agente mestre do harness** (pedido do MJRP), com as duas perguntas: o caminho certo para gravar a ordem quando a primeira já começou, e se a mensagem que não nomeia o item vira achado do harness.
- **Enviado ao MJRP no iPhone:** o mapa da v5.0 (`reports/audits/2026-11-19-mjrpalbumblender-v0-v5-map.md`).
- **À espera dele:** publicar a fatia A da F59 sem o clique no Spotify; e o primeiro deploy do servidor, para a fatia B.

## [2026-11-19 15:35] session — correção anotada nos dois relatórios: as regras abertas eram as do arquivo, não as de produção

O mapa da v5.0 e o cruzamento ganharam, no topo, a nota da conferência de produção (UAT-15). A UAT-15 cita o commit `90cd34f`.

## [2026-11-19 15:34] session — F59, fatia A (só o site): regras do repositório fechadas, volta do Spotify conferida, sem mapas de código

- **Decisão do MJRP:** «Siga a sua prioridade». A ordem do agente: F59, F60, F64, F52, F55, F56, F61, F57, F58, F62, F63, F65; a F49 entra quando ele disser (o `docs/specs/priority.md` do Control Center ainda mostra a ordem que ele marcou antes; o arquivo é dele).
- **Correção de um achado:** as regras do banco **em produção não estavam abertas**. Lidas pela API de regras do Firebase: a versão em vigor é de 2026-01-11 e fecha o ranking de cada pessoa no dono. Aberto estava o arquivo `firestore.rules` do repositório («if true», nota DEBUG); publicá-lo teria aberto produção. O implementador tinha dito ao MJRP que os rankings estavam abertos a qualquer pessoa, repetindo o relatório sem conferir produção.
- **Feito:** `firestore.rules` igual às regras em vigor, com teste que recusa regra sem condição e dado pessoal sem dono; `firebase.json` aponta o arquivo; `SpotifyAuthService` recusa a volta cujo `state` não é o enviado e tira os segredos do gerador criptográfico; sair da conta encerra a sessão do Spotify; `vite.config.js` sem mapas de código.
- **Confirmado aberto em produção, ainda não consertado:** `/api/debug/files`, `/api/list-models` e `/api/debug/import` respondem 200; `POST /api/generate` responde 200 sem login. São as fatias B e C, de servidor.
- **Testes:** 12 novos, vistos falhar antes; a suíte tem 455 passando. O build compila, sem `.map`.
- **No navegador:** a volta do Spotify que não bate é recusada, sem pedido ao Spotify. A volta certa parou na tela de autorização do Spotify, que é do MJRP aceitar. `reports/evidence/F59-close-what-is-open-security/F59-probe-2026-11-19.json`.
- **Não publicado ainda:** espera a volta certa do Spotify ser vista no navegador, para não arriscar a conexão em produção.

## [2026-11-19 15:20] session — manual: diagramas da evolução da arquitetura (v3, v4.0, alvo v5.0), padrões e componentes

Pedido do MJRP: «produza novos diagramas de arquitetura para os manuais da documentacao, mostrando a evolucao do antes pra depois, nao esqueça de manter o mapeamento dos design patterns utlizados e dos componentes que temos». `docs/manual/01_System_Architecture.md` ganhou a seção 6: três diagramas do mesmo sistema (antes, hoje, alvo), a comparação lado a lado, o mapa de padrões com o identificador do catálogo do harness, o lugar e a versão em que cada um chegou (mais os seis padrões da casa sem identificador e os quatro planejados para a v5.0), e o mapa de componentes do cliente, do servidor e de fora. O índice do manual aponta para ela. A trava de estrutura recusou um arquivo novo em `docs/manual/`; o conteúdo entrou no arquivo de arquitetura que já existia. Os diagramas de «antes» e «hoje» saíram do código; o de «alvo» é plano. Não foram renderizados para conferir a sintaxe.

- **Prioridade do MJRP, pelo Control Center:** F49, F59, F52, F55, F56, F57, F58, F61 (`docs/specs/priority.md`). As features aparecem no board. F60, F62, F63, F64 e F65 ainda sem posição.
- **O MJRP:** «vou dar aceite com o tempo … pode começar a v5.0».

## [2026-11-19 15:16] session — dez issues de hoje ganham a parte «Evidência», que o board exige

O MJRP perguntou se as features da v5.0 aparecem no Control Center. O leitor do board (`product_structure_check.py`) conta 13 features na v5.0 (`^REL-40`) e 8 na v4.0 (`^REL-39`), mas estava vermelho: dez issues abertas hoje (UAT-182, UAT-183, UAT-187 a UAT-193, UAT-195) não tinham a parte **Evidência:** da gramática. Acrescentada em cada uma, apontando o relato do MJRP, o relatório da regressão ou a evidência da feature. A tela do Control Center em si não foi vista: ela pede login (401).

## [2026-11-19 15:14] session — quinto deploy do site: F54 (apagar do inventário, duração das faixas, botão «Close»), main `cd96ad3`

Publicado pela regra do MJRP de 2026-11-19 («cada Feature feita deveria ser testar e ir pra prod»): a F54 passou nos testes (443, 0 falhas) e no navegador local antes. `firebase deploy --only hosting` de uma cópia limpa da `main`. Conferido por fora: o site serve `assets/main-DfWvVVfh.js`, o mesmo arquivo do build. Não visto em produção no navegador. O servidor não foi tocado. Como voltar: «Rollback» no histórico do Firebase Hosting.

**v4.0, o que falta para fechar:** o aceite do MJRP nas issues em `fixed` e o push. Nenhum conserto da v4.0 está pendente de código.

## [2026-11-19 15:13] session — F54: o commit do conserto anotado nas issues e nas tarefas

UAT-01 e UAT-188 passam a citar o commit `82336c2`; as tarefas 3 e 4 da F54 também.

## [2026-11-19 15:12] session — F54: apagar do inventário apaga (UAT-01) e as faixas mostram a duração (UAT-188)

- **UAT-01:** `InventoryController.handleDelete` chamava `inventoryStore.deleteAlbum`, que não existe; passa a chamar `removeAlbum` e a tratar a falha. O repositório esquece a resposta «já está no inventário» do álbum removido, para ele poder ser adicionado de novo em seguida.
- **UAT-188:** `utils/duration.js`, um formatador só, em segundos; a janela de ranking e a tabela de faixas liam a duração como milissegundos. Conferido nos dados reais: 2.109 faixas com duração entre 15 e 4.767, em segundos.
- **Testes:** 9 novos, vistos falhar antes; a suíte tem 443 passando. `vite build` compila.
- **No navegador:** «GNX», o item de teste, removido do inventário do MJRP (24 para 23, não volta ao recarregar); durações nas duas janelas; botão «Close». `reports/evidence/F54-close-v4-inventory-delete-and-polish/F54-browser-2026-11-19.json`.
- **Documentos:** spec, plano e tarefas da F54; UAT-01 e UAT-188 em `fixed`; manual e `behavior.md` sem a ressalva dos defeitos.
- **Ficou de fora:** `TrackRow.formatDuration` e `PlaylistGrid.calculateDuration` ainda formatam por conta própria (certos, em segundos).

## [2026-11-19 15:05] session — mapa da v5.0: cada achado, por tema, com a feature que o resolve

Pedido do MJRP: «a partir do report, vc gerar um novo como um grande mapa … com cada item mapeado para cada feature e agrupado pelos temas que vc sugeriu». `reports/audits/2026-11-19-mjrpalbumblender-v0-v5-map.md`: os 153 itens do cruzamento em oito temas (segurança 11, perda de dado 10, carga e identidade 33, blend e exportação 16, Home e navegação 20, publicação 9, inventário 5, limpeza 13), mais 33 consertados na v4.0 e 3 que não valem mais; cada item em aberto com a feature (F49, F52, F54 a F65), o estado e o código de origem nos relatórios antigos. Onze issues legadas de 2025-11 a 2026-01 ficaram **sem feature**: não foram relidas e pedem triagem. A tradução e a atribuição são do implementador, sem julgamento separado.

## [2026-11-19 15:03] decision — tudo entra na v5.0, e cada feature pronta e testada vai para produção sozinha

- **O MJRP:** «pra mim tudo tem que entrar na v5.0, mas ir pra prod nao precisa ser um big bang, cada Feature feita deveria ser testar e ir pra prod».
- **O que muda:** não há v4.1. Os oito grupos em aberto do cruzamento entram na v5.0. A entrega é feature por feature: testada (testes e navegador), publicada, conferida em produção. O agente trata essa frase como a autorização para publicar o **site** ao fim de cada feature testada; publicar o **servidor** ou as **regras do banco** ele confirma com o MJRP na primeira vez de cada um.
- **Plano da v5.0 revisado no board:** F55 renomeada e alargada (regra única de identidade nos cinco lugares; o MJRP perguntou por que «o álbum» e não «os»); F52 reordenada (contrato de erros, raspador certo, cache); F56 só com blend e edição; F58 alargada ao controlador de playlists; novas F59 (segurança), F60 (perda de dado), F61 (playlists guardadas rápidas), F62 (blend e exportação), F63 (Home e navegação), F64 (um caminho testado para produção), F65 (limpeza). Todas em esboço, via rápida.
- **Issues novas:** UAT-196 a UAT-203, uma por grupo de achados sem issue. Três delas (UAT-197, UAT-198, UAT-200 a UAT-202) vêm dos relatórios e não foram reproduzidas pelo implementador; cada uma diz isso.
- **Ordem proposta dentro da v5.0, à espera do MJRP:** F59, F60, F64, F52, F55, F56, F61, F57, F58, F62, F63, F65.
- **v4.0:** a F54 fica com apagar do inventário (UAT-01), a duração (UAT-188) e o botão «Close» (UAT-195); a UAT-190 foi para a F62 e a UAT-192 para a F63.

## [2026-11-19 14:56] session — relatório do cruzamento com o estado de cada linha

Pedido do MJRP: marcar no relatório o que foi consertado na v4.0, o que vai para a v5.0 e o que não vale mais, com o motivo; o restante será discutido com ele no chat. `reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`: 33 linhas consertadas na v4.0, 10 a consertar na v5.0, 3 que não valem mais (cada uma com o motivo), 103 em aberto e 4 que contradizem a análise de hoje.

## [2026-11-19 14:53] session — F54: o texto passado como propriedade vira texto (UAT-195)

`SafeDOM` passa a tratar `textContent` como o texto do elemento. Conserto no ajudante, não nos dois botões, para valer para qualquer uso futuro. Três testes novos em `test/utils/SafeDOM.test.js`; escritos junto com o conserto, não vistos falhar antes (a causa foi lida no código). No navegador local: a janela de detalhe mostra «Close». A suíte tem 434 passando. Ainda fora de produção: o deploy espera o sim do MJRP.

## [2026-11-19 14:52] session — UAT-195 aberta: o botão de fechar da janela de detalhe do álbum aparece sem texto

Relato do MJRP em produção, junto de «ranking album em prod working!» (a janela de ranking reabre na ordem salva, UAT-187, vista por ele em produção). O botão vazio é o «Close». Causa lida no código: `SafeDOM` gravava `textContent` como atributo. A mesma captura mostra «--:--» na coluna de duração: anotado na UAT-188. Conserto pela F54.

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
