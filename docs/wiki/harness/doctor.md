---
title: O doctor
aliases: [doctor, doctor.py, sensores, o que o doctor vê]
summary: o que o doctor mede, o que ele deliberadamente não mede, e por que uma checagem só nasce depois de um incidente
tags: [harness, sensores, verificacao]
status: em formação
atualizado: 2026-10-12
---
<!-- kernel do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
O **doctor** é o sensor do harness: um script que lê a instância e devolve verde,
amarelo ou vermelho por critério nomeado. Ele não julga o trabalho — julga se a instância
obedece ao que ela mesma declara. Uma checagem só entra depois de um incidente que ela teria
pegado (ADR-0002 do harness, emendada pela ADR-0007 do harness): checagem sem incidente é opinião com exit code.

## As checagens

Erro (vermelho) nas letras C, I, F e A (I6 é a 12ª e última vaga de erro do teto da ADR-0002); aviso (amarelo) no W. O código é a fonte: `mjrp-scripts/doctor.py`.

| ID | O que confere |
|---|---|
| C1 | skills instaladas × fonte |
| I1 | schema do contrato e `environment`; de `project_palette` (e `control_center.portfolio_palette`) confere só a forma — um dicionário com `light` e/ou `dark` —, nunca os IDs, que a biblioteca de paletas julga |
| I2 | caminhos declarados existem |
| I3 | links relativos e wikilinks. Os campos inline `violates::`, `slows::` e `fixes:` levam **IDs**, não links de navegação: `F09`, `UAT-12`, `OUT-01` e `NFR-08` resolvem como ID (o `id:` da feature, a linha do `uat.md`, a âncora do ROADMAP, o nó) e não precisam abrir no Obsidian. O link de prosa fora desses campos segue a regra do nome inteiro que o `link_stem` do sensor do grafo cobra |
| I4 | `AGENTS.md` canônico |
| I5 | herança do `PRINCIPLES.md`; kernel e cópias carimbadas × fonte; espelho da constituição; o kit visual só onde há tela |
| F1 | forma do `MEMORY.md` e `## Now` × log; formato do log; crescimento do Ways of Working |
| F2 | gate além do SLA |
| F3 | sob git |
| I6 | conformidade canônica do filho × o catálogo (`canonical_catalog.json`): aviso até `max(since, received) + grace_days`, erro depois; nota aplicada cujo check reprova, catálogo ausente ou inválido = erro com o comando do conserto. Só o filho — o portão do Learn é o sensor `canonical_catalog` do contrato do harness |
| A1 | sensores do contrato (só o `visual` pode ser de etapa, `when: pre-merge`, e só é anotado; sensor-mapa sem `cmd` reprova) |
| A2 | `code-app` com tela e referência visual aprovada declara `sensors.visual`, que chega ao kit e a um config que existe |
| W1 | descrições das skills |
| W2 | commits aguardando push |
| W3 | campo desconhecido no contrato; contrato sem `environment` |
| W4 | edições sem commit |
| W5 | skills de fronteira não revistas |
| W6 | `CHARTER.md` não migrado; `stack:` mal usado |
| W7 | filhos com kernel defasado |
| W8 | deriva do Cowork |
| W9 | estrutura por natureza |
| W10 | sessões concorrentes |
| W11 | inventário do protótipo |
| W12 | nomes de skill aposentada |
| W13 | a cópia diária de todos os projetos (ADR-0024): reprova com a última cópia verificada acima de 24 h, sem nenhuma ou com um projeto `failed` (a 13ª vaga de erro, decisão do MJRP); avisa do disco externo acima de 2 dias; sem destino aqui (a ponte, o Cowork) é nota. A mensagem cita `python3 mjrp-scripts/daily_backup.py run` |
| W14 | protótipo × `info-arch.md` × wireframes (a tela que o gate aceitou por trailer conta como em dia) |
| W15 | branch de correção × status do UAT na `main` |
| W16 | conformidade do portfólio medida e gravada na pasta do Control Center |
| W17 | `folder-index.md` das pastas de `inventory:` em dia — a tabela nos dois sentidos e as contagens em prosa (aviso, nunca erro) |
| W18 | disco livre abaixo de 20 GB (`MJRP_DISK_FLOOR_GB` move o piso) **e o teto total de cada budget** do `structure_rules.json → budgets` (`$TMPDIR/cc-*`, `_backups/`, worktrees mesclados e limpos, as cópias diárias); aviso, nunca erro. Budget cujo caminho não se vê de onde o doctor roda é nota «não avaliável», nunca 0 GB — o incidente de 2026-10-19: capturas de juiz e worktrees encheram o disco e só o primeiro ENOSPC num commit mostrou; e os quatro de outubro por acúmulo sem teto (ADR-0023 § 3) |
| W19 | todo `mjrp-scripts/*.py` tem a sua entrada no `scripts-catalog.yml`, e nenhuma entrada ficou de script que saiu (só no dono do catálogo; aviso, nunca erro) — o W18 é o do disco livre, da F52 |
| W20 | as features (F43 em diante) seguem os moldes do SDD: a que corre avisa a seção que falta e o «a escrever» que ficou numa fechada (aviso, nunca erro; dono: o integrador, que escreve cada campo no fecho da feature, e a partir de 2026-11-30 o campo esquecido numa fechada vira erro do sensor). O **erro** da feature `Done`/`Accepted` fora do molde não é uma vaga do teto: é o sensor declarado `sdd_shape` (`sdd_shape_check.py`, A1), o mesmo que o `pre-commit` roda sobre as features do índice (F95) |
| W21 | a resposta da tela às perguntas da auditoria parada há mais de um dia, sem a `decision` de quem a executou (`screen_answers.py`, CC-ADR-0039; aviso, nunca erro; dono: o agente do projeto) | F166 |

## History
- **2026-10-31 10:20** · **O W13 conta a cópia movida e registrada** (F81, ADR-0030; decidido pelo agente, revisável pelo MJRP). `daily_backup_store.list_verified` aceita o manifest sem o `.tar.gz` em `daily/` quando o `projects-<data>.moved.json` concorda com ele; o `--check` e o W13 passam a ver essa cópia como feita (e avisam, sem reprovar, se o arquivo no destino mudou de tamanho ou sumiu), e o manifest sem arquivo e sem registro segue acusado, com o texto mandando rodar `--mark-moved`. O W13 não ganha vaga de erro nova.
- **2026-10-31 09:10** · **A passada diária do doctor roda sozinha às 07:30** (F106, S-191; o pedido do MJRP de 2026-10-27 14:10: o launchd `com.mjrp.daily-doctor` como o da cópia diária, ao acordar se o Mac dormia, gravando o rastro sem commitar; decidido pelo agente nos detalhes, revisável pelo MJRP). `daily_doctor.py run --scheduled` roda o doctor completo no checkout principal e sai limpo antes das 07:30 e com a passada do dia já no rastro; o `StartCalendarInterval` não recupera o que o Mac perdeu desligado, então o agendamento também roda ao entrar e de hora em hora, e a guarda faz as rodadas extras custarem nada. Uma trava em `.mjrp/` impede duas passadas juntas; o log (`~/Library/Logs/mjrp-daily-doctor.log`) guarda o fim acima de 1 MB e o teto de 5 MB está em `structure_rules.json → budgets`. Instalar é do MJRP (`--install`). O Control Center chama o mesmo script pelo «Rodar agora» da faixa do sensor (CC-ADR-0034, `Proposed`).
- **2026-10-31 01:10** · **O I3 lê também o `MEMORY.md`** (F103, S-188; pedido do MJRP em 2026-10-27 11:43: o link quebrado acusado também no `MEMORY.md` e no log; decidido pelo agente, revisável). O `IDENTITY_DOCS` do `_doctor_docs.py` ganha o `MEMORY.md` de cada projeto; o `docs/log.md` já estava na varredura de `docs/**`. Autoteste: o caso o caso do `link` quebrado no `MEMORY.md` e no `docs/log.md` no `doctor_selftest.py`. Nenhuma checagem nova (ADR-0002): o mesmo I3 em mais um arquivo. Sensor: pede a reconferência independente.
- **2026-10-27 22:08** · **O W13 acusa o manifest sem arquivo e a cópia guardada que não bate o `sha256`** (F121, UAT-403, reauditoria de `mjrp-scripts/`; decidido pelo agente, revisável pelo MJRP). `daily_backup_status` avisa o manifest em `daily/` sem o `.tar.gz` ao lado (antes só o arquivo sem manifest) e o campo `corrupt` do `last-run.json`; a poda relê o `sha256` das cópias que decidem antes de contá-las como boas, de modo que uma corrompida do mesmo tamanho não faz a anterior boa ser podada. Os dois são avisos (o erro de 24 h do W13 não muda). Na mesma F121, o critério do conform do `stop_gate.py` passou a exigir o `mjrp-scripts/conformance_check.py` do próprio repositório pelo caminho resolvido (UAT-402).
- **2026-10-27 17:23** · **O W14 lê o trailer do «regenerado idêntico»** (F117, UAT-392, P2-2 da reconferência da F111; decidido pelo agente, revisável pelo MJRP). O `drift()` julgava o wireframe pela data do último commit e acusava, para sempre, a tela que o `commit-msg` aceitou por ser idêntica (ela não entra no commit). Agora a tela nomeada num trailer `Prototype-regenerated-identical` do commit que mudou o protótipo, ou de um posterior, conta como em dia; o trailer de antes da última mudança do protótipo, ou de outra tela, não vale. As 10 telas da v4.14 que o merge da F67 deixou idênticas seguem acusadas: aquele merge passou pela válvula e não deixou trailer, e nada o escreve depois à mão (a F117 o recusa). Autoteste: caso 16 do `prototype_sync_check_selftest.py`.
- **2026-10-26 23:35** · **O sensor `sdd_shape` endurecido pela passada independente** (F95, segunda rodada). Corpo trivial (`-`, `- [ ]`, espaço de largura zero ou sem quebra, bloco cercado vazio) conta como seção vazia; o marcador «a escrever» é lido sem distinguir caixa, espaço nem fecho; status fora de Draft · Ready · In Progress · Done · Accepted · Cancelled · Deferred é **erro** (a feature graduada por outra palavra escaparia do portão; Cancelled e Deferred não se julgam). O W20 passa a dizer o dono (o integrador) e a data (2026-11-30) em que o «a escrever» esquecido numa feature fechada de F43 a F95 vira erro; de F96 em diante já é erro. A data é uma constante (`PENDING_TURN_DATE`), decisão do agente, classe (a), revisável. Ficam como estão, por decisão: o `--staged` aceita qualquer prefixo de pasta e o modo inteiro varre só a raiz e `apps/*/` (nenhuma pasta fora disso existe hoje; o `pre-commit` mais largo é o lado seguro), e os commits da F95 juntam duas tarefas em `6a0888b9c` (só rastreabilidade).
- **2026-10-26 22:49** · **W20 + o sensor `sdd_shape` — a forma do SDD cobrada por máquina** (F95; a regra é do MJRP, 2026-10-26 21:14: «os agentes não estão seguindo o SDD direito… a skill ensuring SDD não está servindo pra nada»). Incidente: de F43 a F94 nenhuma feature teve o `spec.md` no molde da `mjrp-specifying-sdd-artifacts` e nada cobrou, porque a `mjrp-ensuring-sdd` só vale quando alguém a chama. O `sdd_shape_check.py` lê as seções obrigatórias **dos próprios moldes** (`(optional)` e `(if …)` não são obrigatórias; seção só com o comentário do molde conta como faltando): a feature fechada fora do molde é **erro**, pelo sensor declarado no contrato (A1) e pelo `pre-commit` (só as features que o commit toca, pela cópia do índice) — o teto de erros da ADR-0002 está cheio, então não é uma 14ª vaga —, e a aberta só **avisa**, pelo W20 (a via rápida documenta depois, mas antes do fecho). Decisão do agente, classe (a), revisável: as features anteriores à F43 não são julgadas, e um «a escrever» esquecido só é erro numa feature F96 em diante (a primeira que nasce do `new_feature.py`).
- **2026-10-26 05:33** · **O W13 passou a ler a cópia diária** (F75 TASK-06 e TASK-08, ADR-0024). `_doctor_repo.w13_daily_backup` lê o estado de `daily_backup_status.evaluate` — o `last-run.json`, o manifesto verificado mais novo e o `external.json`, nunca o `.tar.gz` — e reprova (13ª vaga de erro, por decisão do MJRP, que emenda a ADR-0002) com a cópia acima de 24 h, sem cópia ou com um projeto `failed`; avisa do disco externo acima de 2 dias e de arquivo que o sistema não deixou ler; sem destino é nota. O W13 antigo (o `latest.json` do iCloud, a lacuna de dias e as sobras no destino) saiu junto com o `backup_repo.py`. Incidente: 21 e 22/10, dois dias sem backup que só viraram aviso.
- **2026-10-26 03:30** · **W18 mede o teto total e o dono de cada budget declarado** (F74 TASK-05, ADR-0023 § 3; os números são do agente por delegação do MJRP, log 2026-10-26 01:08, revisáveis). Segunda checagem registrada sob o id W18 (`_doctor_budgets.w18_budgets`): aviso acima do teto, com o dono e a regra; nunca erro, porque o teto de 12 da ADR-0002 está cheio. A nota «não avaliável» cobre o budget global que a ponte ou outra máquina não enxergam.
- **2026-10-25 18:49** · **W13 vai reprovar a cópia diária com mais de 24 h, numa 13ª vaga de erro** (decisão do MJRP, nas perguntas: «reprovar adicionando mais essa vaga» e «24hrs»). É a ADR-0024, ainda `Proposed`, que emenda a ADR-0002 (o teto passa de 12 para 13 checagens de erro). O W13 deixa de ler o `latest.json` do iCloud e passa a ler o `last-run.json`, o manifest do `.tar.gz` diário e o `external.json`, e avisa quando a cópia externa tem mais de 2 dias. O código muda na F75 TASK-06, e o W13 antigo sai na TASK-08. Incidente: dias sem backup, 21 e 22/10, que só viraram aviso (auditoria de `mjrp-scripts/`, B3).
- **2026-10-23 23:25** · **W19 — o doctor roda o `scripts_catalog_check.py`, só como aviso** (F53; a regra é do MJRP, 2026-10-19 23:49: «um sensor cobra que todo script tenha a sua entrada»; a escolha do aviso, do código e do escopo é do agente, classe (a), revisável; o teto de 12 obrigatórias da ADR-0002 não se mexe). Incidente: o catálogo de scripts passou a ser a fonte do card «Catálogo de Scripts & Sensors» do Control Center, e um script novo sem entrada aparece lá sem explicação, uma entrada velha descreve o que não existe. A falta de entrada vale para qualquer projeto que carregue o catálogo; a entrada sem script só onde o catálogo é do projeto (`profile: meta`): um filho leva o catálogo inteiro e só os scripts que vendoriza. O código é o W19 porque o W18 é o do disco livre (F52, em outro ramo).
- **2026-10-20 00:48** · **W17 — o doctor roda o `inventory_check.py --todas`, só como aviso** (decidido pelo MJRP como classe (a), revisável; o teto de 12 obrigatórias da ADR-0002 não se mexe). Incidente: o `folder-index.md` de `mjrp-scripts/` ficou com 4 scripts fora da tabela e as contagens em prosa velhas, e o sensor que acusava não rodava em lugar nenhum. Além da tabela, confere o `N itens` do cabeçalho e o `· N arquivos` de cada pasta de primeiro nível da árvore; esta última **não** em worktree vinculado, que não tem os arquivos ignorados do checkout onde a skill rodou, nem em pasta que contenha arquivo ignorado. As contagens soltas dentro das descrições ("34 itens", "42 nomes") **não dá para conferir**: são texto livre sobre o conteúdo de outro arquivo.
- **2026-10-19 21:17** · **W16 só grava na pasta real a partir da raiz real** (recheck da F50: o `conformance_check_selftest.py` gravava os projetos de teste na pasta real do Control Center). Sem `CC_HOME`, a raiz precisa ser uma pasta principal registrada no `workspace.json` da pasta padrão; qualquer outra raiz exige `CC_HOME` explícito, e sem ele o W16 só deixa uma nota. O arquivo da medida leva o hash do caminho (`<pasta>-<8 hex>.json`).
- **2026-10-19 19:52** · **W16 — o harness mede a conformidade do portfólio e a deixa na pasta do Control Center** (F50, UAT-268; decidido pelo agente, revisável pelo MJRP). Incidente: o `.mjrp/conformance_state.json` nascia só quando o doctor rodava dentro do filho, e o conform roda num worktree (o `.mjrp/` é gitignorado), então a tela mostrava «nunca medida» em 7 de 11 projetos. O doctor da raiz (perfil `meta`) chama o `portfolio_conformance.py`, que julga cada filho `code-app`/`content` pelo catálogo do harness, só lendo, e grava `<CC_HOME>/conformance/<projeto>.json` (nunca no filho). É nota, nunca erro; aviso se um projeto não pôde ser medido. De um worktree só grava com `CC_HOME` dado de propósito. Nenhuma checagem de erro nova (ADR-0002).
- **2026-10-18 14:17** · **I3 resolve o ID de feature, UAT, resultado e NFR; W11 aceita o nó do grafo** (feedback do fin-control, pontos 1 e 2: 9 erros I3 e 62 avisos W11 depois da regra nova da dívida técnica). O `_wiki_targets` ganha o `id:` do frontmatter e o prefixo `Fxx` da pasta de cada `features/*/spec.md` (e o nome inteiro da pasta), os `UAT-nn` do `uat.md`, os `OUT-nn`/`REL-nn` do `ROADMAP.md`, os `EP-nn` do PRD e o NFR com o prefixo do projeto aninhado (`CC-NFR-03`); `constitution#5` e `uat#^UAT-nn` já resolviam. O `prototype_inventory.py` aceita em `coberto`/`evoluído` o ID de um nó de `docs/specs/requirements/` (`S-xx`, `UC-xx`, `EA-xx`, `NFR-xx`) além do `REQ-nn`, com os padrões e a leitura do próprio `requirements_graph_check.py` (`requirement_node_ids`, `NODE_ID_IN_TEXT`) e confere que o nó existe. Nenhuma checagem nova (ADR-0002): só os dois formatos que as regras de hoje pedem. No fin-control: I3 9 → 0. Depois do juiz (14:48): o W11 só aceita nó que existe e está vivo (nem `Cancelled`, nem substituído; a mensagem diz o vigente), vê o conjunto vazio de nós como «nenhum ID é nó» e aceita os IDs próprios da feature (`REQ-F-17`, `NFR-F-06`) pelo padrão do sensor do grafo — fin-control W11 62 → 20 (todos nó substituído), pedroso-incorp 21 → 1.
- **2026-10-14 21:04** · **A cláusula `script` que não consegue rodar é AVISO na I6, não nota** (verificação da `mjrp-organizing-product-structure`, P2-4; mesma regra lean de 19:20). Script ausente ao lado do `conformance_check.py`, que quebrou, estourou o tempo ou saiu 2 deixa o item "não avaliável" — e o filho ficaria mudo pelo tempo que fosse. Só esse tipo de não avaliável sobe a aviso (`warn: True` no resultado do `evaluate`); os demais continuam nota. Nenhuma checagem nova: é a I6 que já existe. Junto: o `releases@1` mudou só a **mensagem** (título, `path` e `label` apontam o `ROADMAP.md`, de onde a tela lê releases) — o check não mudou, não sobe a versão nem pede nota; o `product-structure@1` (ainda fora da `main`) teve o `pattern_digest` reestampado porque o script ganhou regras (release sem story, `contributes_to` como a tela resolve, UTF-8 inválido como lacuna).
- **2026-10-14 19:57** · **Cláusula `script` no catálogo canônico; nenhuma checagem nova no doctor** (decisão do MJRP: o Board do fin-control saiu vazio e o catálogo não via). Nenhuma cláusula declarativa diz "o Control Center mostra este produto": a cláusula `script{script, label?}` roda um sensor stdlib que mora ao lado do `conformance_check.py` (um nome de arquivo, nunca um caminho) e viaja com ele no kernel — sai 0 passa, 1 é lacuna com as primeiras linhas do sensor, 2 / saída estranha / script ausente é "não avaliável" (nunca aprovação). O portão do Learn exige o script na fonte, em `pattern_sources` (mudar o que ele cobra pede nota) e nos `VENDORED_FILES`. Emenda o conjunto fechado de cláusulas do ADR-0019 § 3 sem nova ADR (e o cabeçalho da ADR aponta para cá, desde 2026-10-14 20:50) (regra de 2026-10-14 19:20: pedido direto do MJRP vira decisão dele, registrada). O primeiro item é `product-structure@1` (CM-0019), carregado pela I6 que já existe.

- **2026-10-13 23:01** · **I1 e o par de paletas do projeto** (ADR-0022, aceita pelo MJRP em 2026-10-13 21:23). `project_palette` e `control_center` entraram no schema do contrato; a I1 confere só a **forma** do par (`light`/`dark` escalares), porque a lista de IDs mora numa fonte só, a biblioteca de paletas, que o Control Center lê. Nenhuma checagem nova no doctor (ADR-0002); a ausência do campo é aviso do catálogo (item `project-palette`, I6), nunca erro.
- **2026-10-13 13:20** · **I6 — conformidade canônica dos filhos** (ADR-0019, aceita pelo MJRP em 1ª iteração; 12ª e última vaga de erro). Incidente: a auditoria do
  fin-control — kernel instalado, doctor verde, artefatos canônicos nunca construídos. O mecanismo: `canonical_catalog.json` (checagens declarativas, cláusulas e
  parâmetros fechados; composição lista = todas, `any`, `if`, `requires`), `conformance_check.py` (leitor único, vendorizado), uma nota `CM-NNNN` por passo de versão
  (cadeia imutável; frontmatter só `id/item/from/to`) e `conformance: {applied, received, waived}` no contrato. A carência (30 dias por item) conta de `received`, carimbado só pelo
  `--refresh-kernel`; `applied` é conferido contra o check da versão que a nota alvejou; `waived` e o rebaseline editorial são válvulas do humano (trailers
  `Conformance-waiver:` e `Catalog-editorial:`, recusados pelo `commit-msg` ao lado de um `Co-Authored-By:` de agente; dispensa até 90 dias, uma renovação). O portão do
  Learn saiu do doctor: é o sensor `canonical_catalog` (`--learn-gate`), que roda o check de cada item contra o seu `template`. O W7 nomeia as notas pendentes e os
  "nunca conformados". `english-names` é só aviso. Selftest: `conformance_check_selftest.py`.

- **2026-10-12 17:34** · A ADR-0017 do harness foi **aceita** pelo MJRP: o A2 ocupa a 11ª das 12 vagas de erro; o A1 só aceita `when`
  no `sensors.visual`; o hook `pre-merge-commit` cobra a reconferência visual (`verdict: pass` no frontmatter).

- **2026-10-12 16:34** · Revisão depois da crítica da ADR-0017 (P0 0 · P1 8; decisões do MJRP). **A1:** só `sensors.visual`
  pode ter `when`, e só `pre-merge`; qualquer outro sensor com `when`, outro valor, ou sensor-mapa sem `cmd` reprova
  (nunca `sh("")`, que saía verde). **A2:** além da presença, o sensor tem de ser de etapa, apontar para um `config` que
  existe e chegar ao kit (o `run.mjs` ou um juiz do projeto que importe dele); a exigência passa a ser **referência
  visual aprovada** registrada no `info-arch.md` (viva ou estática). A tela é a do `screen:` do contrato (campo novo),
  ou a heurística padrão — uma definição só, em `visual_gate.py`, que o hook `pre-merge-commit` também usa. **I5:** o kit
  de paridade visual vai só para `code-app` com tela; com tela e sem o kit reprova, kit sem tela avisa. Selftests no
  `doctor_selftest.py` (seis declarações ruins do A2, três escapes do A1) e no `visual_gate_selftest.py` (o hook).

- **2026-10-12 15:55** · **A2 — paridade visual declarada** (ADR-0017 do harness, *Proposed*; 11ª das 12 vagas de erro). Reprova um
  `code-app` com tela (`web/`, ou `src/` com arquivo de UI) e protótipo aprovado no `info-arch.md` (§ *Protótipos
  aprovados*, linha `Aprovado por:` que não é o molde) que não declara `sensors.visual`, ou o declara sem comando. O A1
  passou a aceitar sensor como mapa `{cmd, when}`: com `when: pre-merge` é sensor de etapa — o doctor não o roda
  (minutos de Playwright e dois servidores) e o `--skip-sensors` não lhe cobra registro; quem o roda é a reconferência
  visual do Delivery. Incidente: o Control Center 1.0 chegou ao UAT com a tela longe do protótipo v4.1 e todos os
  sensores verdes ([[harness-kaizen]] 2026-10-11 12:09). Selftest: quatro casos no `doctor_selftest.py`.

- **2026-10-09 20:55** · Revisão geral de 2026-10-09: a página ganhou a tabela *As checagens* (C1, I1–I5, F1–F3, A1, W1–W14 (W15 entrou em 13/10), tirada do código); as ADRs citadas passam a dizer "do harness", em texto, porque a cópia do kernel nos filhos ligava à ADR de mesmo número do filho (o Control Center tem a própria ADR-0002).

> Página criada em 09/09/2026 pelo BACKLOG #28a, por indicação do Zé. As entradas abaixo vieram
> **inteiras** do `MEMORY.md` — nada foi condensado na mudança; a edição, se vier, vem depois e
> com o `memory_check` capaz de vê-la.
- **2026-09-09 18:55** · **O `Stop` hook é o único ponto onde o harness impede.** `stop_gate.py`
  bloqueia o fim do turno quando houve edição em área vigiada sem critério declarado **e
  aprovado**. Turno de conversa nunca bloqueia — gate que trava o que não devia é gate que o
  humano desliga. Critério aprovado **antes** da última edição não vale: está velho.
- **2026-09-08 22:54** · **O doctor deixou de exigir PyYAML.** Lê YAML sozinho quando a biblioteca falta
  (`_yaml_min`), e o selftest compara os dois parsers para o fallback não divergir em silêncio. O
  `environment.setup` do contrato virou `nenhum` — era um comando que o Homebrew recusa. A porta de
  entrada de qualquer instância não pode exigir instalação.
- **2026-09-08 23:24** · **A3 feito (#8): o `doctor` rodou no Mac pela primeira vez** — e o harness saiu **VERMELHO**,
  6 erros, todos I2, todos em skills do **toolkit** (o build-framework está limpo). 4 são
  `MJRPvault/Meeting-Notes/` — **o vault existe, a subpasta não** — e 2 são o Mac anterior
  (`/Users/mpedroso/`). É o incidente que criou a I2, pego enfim. **A fase A fecha com o A4 (hooks).**
- **2026-09-08 23:24** · **Os dois filhos avaliados saem em exit 2: contrato no schema antigo** (`mjrp_project:` com
  name/type/path), que é o que o `README` § 2 ainda ensina. A documentação ensina o formato que o doctor
  não avalia — o achado do inventário, confirmado na prática. É fase B (#14) e passo 2 (#3).
- **2026-09-09 00:39** · **Os 6 do I2 resolvidos.** `eq-advisor` → `MJRPhifi-music/`; `ebook-summarizer` →
  `MJRPvault/Books/` (onde já estão o Learning Dashboard e o kanban — a listagem do vault corrigiu a
  resposta anterior dele); `Meeting-Notes/` + `_logs/` + `HTML_Catalog.md` **criados no vault**, que era
  a escolha dele (criar e manter, não aposentar as skills). Três dos seis eram **molde, não caminho**.
- **2026-09-09 00:44** · **#9c feito: `entry_check.py`** — executa o caminho que o `HOWTO` promete e devolve 0/1/2.
  12 verificações: instalação, doctor sem PyYAML (e **concordando** consigo com e sem), comandos citados,
  `environment` do contrato, caminho do marketplace, skills citadas. Achou 1 erro na 1ª execução
  (`mjrp-env-setup` no README, inexistente). O HOWTO parou de mandar instalar PyYAML e passou a dizer
  **de onde** rodar o `marketplace add` — dois dos seis tropeços dele, agora com sensor.
- **2026-09-09 00:55** · **O `doctor_selftest` na máquina dele pegou um bug meu que aqui era invisível.** O
  `_yaml_min` perdia lista em bloco → `gates_open` vazio → **F2 calado**. Corrigido: lê lista, data e
  aninhado com comentário, e **grita** (`YamlNaoSuportado`) no que não sabe. Selftest reforçado com 5
  amostras + frontmatter + um caso de expectativa escrita à mão (vale sem PyYAML). 8 checagens acusam.
- **2026-09-08 17:57** · **W4 entra no doctor** — edição sem commit nas áreas vigiadas (identidade, concepts,
  decisions, skills, scripts, _archive). Aviso, não erro. Testado ao vivo: pegou a
  reestruturação do VISION e a mudança de pasta antes de eu saber. Achou um bug no próprio
  doctor no caminho: `sh()` faz strip e comia o estado da primeira linha do porcelain.
- **2026-09-08 16:55** · **Furo:** nada no harness me avisa quando o Zé edita um arquivo no disco sem commitar.
  Só vi a edição porque ele perguntou e eu rodei `git status`. O doctor não olha o working tree.
- **2026-09-08 22:45** · **O `environment.setup` do contrato não roda na máquina do Zé** — declara
  `python3 -m pip install --user pyyaml`, e o Homebrew 3.14 é *externally managed*: o pip recusa. Ele
  teve que criar um venv à mão para o doctor rodar. **Ninguém verifica o `environment`** — o A1 executa
  só os `sensors`. O contrato declara um pré-requisito falso e o harness fica verde. Incidente
  documentado; candidato a checagem pela regra da ADR-0002.
- **2026-09-08 22:45** · **O doctor exige PyYAML; o `build_plugin.py` já lê YAML sem depender dele.** O sensor que é
  a porta de entrada de qualquer instância pede instalação para rodar — atrito exatamente onde não pode
  haver. O precedente de como resolver já está no próprio repo.
- **2026-09-07** · O `doctor` verifica a conformidade da instância, **não o trabalho**. Ficou
  verde durante um estrago inteiro. Sensor do entregável ainda não existe.
- **2026-09-07** · Resultado de sensor guardado em cache mente com o tempo — `.mjrp/sensors.json`
  precisa de invalidação por commit.

- **2026-09-09 20:05** · **Um sensor novo precisa de três casos, não de um.** O `doctor_selftest`
  ganhou o teto do `MEMORY.md` (BACKLOG #28c) com o caso do arquivo gordo — e isso não prova nada
  sozinho: um F1 que reprovasse **sempre** passaria nele. Os três que provam são: o gordo reprova,
  a seção que voltou reprova, e **o correto passa calado**. O terceiro é o que separa sensor de
  alarme. Vale a frase que já estava aqui: *sensor que reprova o que está certo ensina a ignorar
  vermelho.*
- **2026-09-09 20:06** · **Dois sensores contando a mesma coisa de jeitos diferentes.** No mesmo
  minuto, o `memory_check --forma` dizia "`## Now` com 13 linhas" e o F1 do doctor dizia 8, para
  o mesmo arquivo. Nenhum dos dois estava errado no próprio critério; errado era haver dois
  critérios. O `memory_check` passou a contar exatamente como o `now_section()` do doctor. Número
  de sensor que discorda de outro número de sensor não gera dúvida sobre qual está certo — gera
  descrédito nos dois.

- **2026-09-09 20:35** · **Uma checagem que existe e não roda é uma checagem que não existe.** O
  `entry_check` conferia o `environment` do contrato desde 09/09 — e leva **92 segundos**, porque
  clona o repositório num temporário para provar que a porta abre num clone limpo. Por isso ele
  está fora do `sensors:`, e por isso, na prática, ninguém rodava a checagem. A divisão que ficou:
  **o barato e diário vai para o doctor** (o runtime declarado existe nesta máquina, o `setup` não
  está em branco), **o caro e raro fica no `entry_check`**, rodado à mão. E executar o `setup` fica
  do lado caro **de propósito** — o doctor roda em todo `SessionStart`, e rodar um comando de setup
  ali seria o harness instalando coisa nas costas do Zé.
- **2026-09-09 20:36** · **"Em branco" não é "nenhum".** Um `environment.setup` vazio parece
  inofensivo e diz duas coisas diferentes: *não há pré-requisito* ou *ninguém preencheu*. O doctor
  reprova o branco e aceita a palavra `nenhum` — declarar que não há é informação; omitir não é.

- **2026-09-09 20:45** · **Resultado guardado é uma afirmação sobre código, e código muda.** O
  `.mjrp/sensors.json` guardava `code: 1` para o sensor do loop enquanto o `loop_selftest` já
  estava consertado e passando. O registro **era verdadeiro quando foi escrito e falso quando foi
  lido**, e nada nele dizia qual dos dois. A correção é uma digital do estado do repositório
  gravada junto do resultado — e ela **não** é só o HEAD: a maior parte do dia o trabalho está sem
  commit, então entram também o `git status` filtrado dos derivados e o tamanho e mtime do que ele
  nomeia. Filtrar os derivados não é detalhe: sem isso o próprio arquivo de cache mudaria a
  digital ao ser escrito, e nenhum registro casaria com o estado seguinte.
- **2026-09-09 20:46** · **Registro velho não é reprovação — é "não avaliável".** Aprovar a partir
  dele era o defeito; reprovar seria inventar uma falha que ninguém viu. O `--skip-sensors` passou
  a dizer *não sei, rode sem a flag*, que é o **exit 2** do contrato do harness aplicado dentro de
  uma checagem. E o caso que quase ninguém escreve: o registro do **mesmo** estado tem que ser
  **usado**. Sem esse caso, um cache que nunca casasse passaria no teste e o `--skip-sensors`
  ficaria inútil sem ninguém notar.

- **2026-09-14 12:00** · **`stop_gate.py` parou de tratar exit 1 e exit 2 como a mesma coisa.**
  A ADR-0002 §8 já dizia "não é verde nem vermelho", mas o `gate()` gravava `passed = (código ==
  0)` e bloqueava os dois com a mesma mensagem — achado numa revisão manual das ADRs no Kindle
  (BACKLOG #6). A trava continua igual nos dois casos (não avaliado não é são), só a mensagem
  mudou: exit 2 agora diz que o problema é o próprio critério (caminho, contrato ausente), não o
  trabalho. `hooks_selftest.py` ganhou o caso 7 pra provar. `AGENTS.md` documenta a distinção
  perto do resto dos sensores.

- **2026-09-14 13:45** · **I5 e W6: um projeto aberto fora do Claude Code não herdava nada
  automaticamente.** O Zé começou um projeto novo direto no Gemini, sem passar por
  onboarding/bootstrap. Dois furos concretos: (1) o `PRINCIPLES.md` não foi herdado em
  lugar nenhum — nem `AGENTS.md`, nem `constitution.md`; (2) foi criado um `CHARTER.md`
  cheio, o padrão que a migração CHARTER→PRD (BACKLOG #33/#44) devia ter aposentado. A causa
  raiz dos dois: `.claude/settings.json` (`SessionStart`/`Stop`) só existe para o Claude Code —
  nenhuma outra AI Platform passa por ali, então nada força a herança nem a leitura do
  bootstrap. **I5** (obrigatória — consome 1 das 3 vagas do teto de 12, sobram 2): reprova se
  nem `AGENTS.md` nem `docs/specs/constitution.md` declaram a herança do `PRINCIPLES.md`
  (PRINCIPLES §III). **W6** (aviso): avisa quando existe um `CHARTER.md` de mais de 10
  linhas (não o stub de retrofit) sem `docs/specs/prd.md` correspondente — parece charter novo,
  não migração em andamento. Os dois têm 3–4 casos no `doctor_selftest.py`, no padrão do W5
  (caso que acusa + caso que fica calado). **O que ainda falta, fora do doctor**: nada garante
  que um projeto novo, em qualquer AI Platform, comece com a estrutura certa — é o que motivou
  desenhar o `new_project.py`, um scaffolding determinístico rodado pelo Zé antes de abrir
  qualquer IA (ver BACKLOG e ADR pendente sobre "como um projeto começa, de verdade").

- **2026-09-28 12:37** · **W10 — sessões concorrentes no mesmo repo** (parecer do fin-control, 27/09). Avisa,
  nunca reprova: trava de git órfã (`.git/*.lock`, `refs/**`, `objects/maintenance.lock` com mais de 10
  min), com o comando que sara (`mv … .orphan-AAAAMMDD` — renomear passa onde apagar é recusado);
  sessão que terminou sem handoff (lease de `session_lease.py` sem release e sem sinal há mais de 12 h);
  mais de uma sessão ativa; trabalho parado numa branch mais de 10 commits à frente da principal. Na
  fonte (`meta`), também lista os filhos com trava órfã. Primeira rodada: `objects/maintenance.lock` de
  19/09 no próprio harness e de 11/09 no MJRP-curated-content — o `git gc` automático parado desde então.
- **2026-10-02 18:53** · **W11 — inventário do protótipo.** Quando o `info-arch.md` tem `## Inventário do protótipo`,
  avisa item sem destino: coberto/evoluído sem REQ (ou com REQ que não existe no spec), cortado sem
  motivo, pendente com o spec aprovado. Nunca cobra igualdade com o protótipo. A lógica mora no
  `prototype_inventory.py` (desde 2026-10-05, S-77: saiu do `SDD_chain_artifacts_check.py`, aposentado),
  copiado para os filhos junto com o `daily_checks.py`.
- **2026-10-05 17:56** · **daily-checks/ continua no git.** MJRP decidiu, depois da explicação das implicações: o rastro datado de aviso e erro (`daily-checks/sensor-*.md`) segue versionado no harness e nos filhos, e entra no commit de quem rodou o doctor — o histórico de quando cada problema abriu e fechou fica no git, ao custo do "M" entre sessões. Alternativas recusadas: `.gitignore`; commitar só no fechamento da sessão.
- **2026-10-05 18:55** · **W12 — skill aposentada em documento vivo.** Avisa quando README, AGENTS/CLAUDE/GEMINI, MEMORY, VISION, ROADMAP, specs, wiki ou contrato citam uma skill aposentada ou renomeada; registro (seções de histórico, entrada datada, tarefa feita, linha que diz aposentada ou já nomeia a sucessora, pastas de registro e logs) fica com o nome da época. A lista é uma só, `retired_skills.json`, a mesma que o `build_plugin.py --check` usa no corpo das skills (S-56). Nasceu de outra sessão respondendo com `mjrp-adr` e `mjrp-system-architect` depois do EP-10.

- **2026-10-08 17:43** · **W13 — backup do repositório atrasado.** Avisa quando o último `git bundle` no iCloud Drive não tem o HEAD (`backup_repo.py --check`); com o iCloud Drive fora do alcance da máquina, só anota que não avaliou. Nasceu da pré-condição do merge autônomo do PDLC em loops.
- **2026-10-09 19:45** · **W14 — protótipo × info-arch × wireframes.** Avisa quando o protótipo mais novo (`design/inception/<name>-vN.html`) não tem o wireframe de todas as telas da versão (as da versão anterior, menos as declaradas `<!-- wireframe-retired: <tela> -->` no `info-arch.md`), quando o `info-arch.md` não o cita, e quando ele mudou depois do `info-arch.md` ou de um wireframe. O mesmo `prototype_sync_check.py` roda no hook `commit-msg` e recusa o commit que traz o protótipo sem o info-arch e os wireframes da versão; a saída é do humano, no trailer `Prototype-sync: skip — <motivo>`. Protótipo tocado antes de 2026-10-09 é legado. Nasceu do Control Center v3.5: mudou depois de aprovado, com 3 das 7 telas com wireframe e o info-arch citando o v3.3 — a regra só existia em prosa (decisão do MJRP, 19:36: hook + sensor, todas as telas por versão).

## Related
[[harness-elements]] · [[harness-kaizen]] · skill-distribution · [[hooks-concept]] · ADR-0002 e ADR-0007 do harness (`docs/decisions/`)
