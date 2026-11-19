# log — o que aconteceu, em ordem

> **Append-only.** Uma entrada por bloco de trabalho, mais recente no topo, com prefixo parseável: `## [AAAA-MM-DD HH:MM] <tipo> — título`. Tipos: `session`, `decision` (o conteúdo mora na página do assunto em `docs/wiki/`, seção `## History`), `ingest`, `inventory`, `harness-feedback`, `review` (uma passada de crítica, com o caminho do relatório). Hora de Brasília, sempre. Ninguém lê este arquivo inteiro — consulta-se por data ou `grep`. Aqui fica só o **quando**; o que é verdade mora na wiki, o estado no `MEMORY.md`.


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
