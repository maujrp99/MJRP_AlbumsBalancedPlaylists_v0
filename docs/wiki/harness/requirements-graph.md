---
title: Grafo de requisitos — nós, arestas tipadas e releases
aliases: [requirements-graph, grafo de requisitos, knowledge graph, rastreabilidade, arestas tipadas, cardinalidade feature requisito, release, planned_for, contributes_to, Cancelled, release_required, identidade de ID]
summary: como requisitos e artefatos do PDLC viram nós com ID estável e arestas tipadas, legíveis no Obsidian e por script; a cardinalidade feature × requisito; como a release agrupa requisitos e épicos; a aresta contributes_to entre roadmaps, o estado Cancelled e a identidade de ID no repositório
tags: [kernel, sdd, requisitos, grafo, release]
status: em formação
atualizado: 2026-10-14
fontes: [design/proposals/requirements-knowledge-graph-proposal.md, decisions/0020-control-center-as-product-contributes-to, kernel/architecture/knowledge-graph-concept, kernel/architecture/linked-notes-concept, kernel/architecture/graph-engineering-concept, kernel/ways-of-working/spec-kit]
---
<!-- kernel do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->

## Definition
O **grafo de requisitos** é a documentação do PDLC tratada como grafo de conhecimento: cada requisito, épico,
release, feature, REQ do spec, task, estado observável e teste é um **nó com ID estável**, e cada relação entre eles é
uma **aresta tipada** — com nome, direção, origem e destino permitidos e cardinalidade. Os conceitos (knowledge
graph, ontologia, tripla, validação por formas) estão em [[knowledge-graph-concept]]; o modelo de notas ligadas que
o humano usa para navegar, em [[linked-notes-concept]]. Um grafo, duas leituras: o
humano navega no Obsidian (wikilink, backlink, graph view); o agente e o sensor leem o mesmo grafo por script.
Não é *graph engineering*: no sentido do [[graph-engineering-concept]], aquele é o grafo de **comportamento**
dos agentes; este é o grafo de **dados** que o comportamento lê como estado.

## Details

> A S-63 fechou; o desenho e as alternativas estão em `design/proposals/requirements-knowledge-graph-proposal.md`.

### Nós e onde moram
- **Requisito:** um arquivo por nó, `docs/specs/requirements/<pasta do épico>/<ID>-<slug>.md`. O nome começa pelo ID
  (`S-07`, `UC-04`, `EA-11`, `NFR-03` — o próximo número livre do prefixo, nunca reusado) e segue com o slug: o título
  em inglês (a linha em negrito que abre `## en`), em kebab-case ASCII minúsculo, até 50 caracteres, encurtado com juízo
  para um humano ainda entender (`S-07-import-the-card-statement.md`). O slug nasce com o nó e não segue edições do
  título; a identidade é o ID (`id: S-07` e `aliases: [S-07]` no frontmatter). Renomear é operação explícita
  (`req_file_names.py --reslug <ID>`): move o arquivo e reescreve os links. Link e embed levam o nome inteiro do
  arquivo, com o ID como texto — `S-07`, `!S-07-import-the-card-statement` —,
  porque o Obsidian resolve nome de arquivo, não alias; o sensor acusa link com ID solto ou slug velho (`link_stem`) e
  nome fora da forma (`node_slug`). Status e arestas no frontmatter. A pasta é a que o épico declara
  (`folder:: ep-NN-<slug-em-inglês>`); NFR em `nfr/`. Regra `node_folder` no sensor, dormente enquanto nenhum épico declara `folder::`. O corpo vem em cada língua declarada — por padrão `## pt-BR` e `## en`, no mesmo arquivo, com um ID e um frontmatter só (regra `bilingual`; o contrato muda a lista em `mjrp_harness.requirements.languages`, `[]` desliga). A frase da story segue o template da `mjrp-writing-reqs` (regra `story_form`, declarada no `requirements_graph_rules.json`): uma das duas formas, de Cohn ou de Klement, uma frase só de até 220 caracteres, sem referência interna, e as outras línguas espelhadas com o título em negrito; o commit recusa a story cujo texto ele muda fora do molde, e a aberta que ninguém tocou avisa até a data de virada. É o nó mais ligado do grafo, por isso tem a âncora mais estável.
- **Feature:** uma pasta por ciclo SDD, `docs/specs/features/<F-ID>-<slug>/` com `spec.md`, `plan.md`, `tasks.md`.
  Dentro da pasta, `REQ-` e `TASK-` são IDs locais, resolvidos pelo script dentro dela.
- **Épico:** no `prd.md`, com as arestas dele numa linha logo abaixo do heading (`serves:: ROADMAP#^OUT-01`).
  **Resultado e release:** no `ROADMAP.md`, com block ID (`^OUT-01`, `^REL-01`); o resultado leva as arestas dele numa
  linha `contributes_to::` na seção (ver *O resultado que contribui*). A direção é do ROADMAP
  para o PRD: o ROADMAP define os resultados, e o épico **serve** a um deles (`serves`). O ROADMAP não deriva dos
  requisitos do PRD — decisão do MJRP, 2026-10-04 12:15.
- **Tags de categoria:** todo resultado leva **de 1 a 3 tags** numa linha `tags:: #a #b` na sua seção do ROADMAP (logo
  abaixo do heading); todo épico **herda** as tags do resultado que serve e pode declarar **até 3 próprias** (`tags::` abaixo
  do heading, no PRD). Vocabulário livre, em inglês e kebab-case (`#visual-management`): o sensor confere só formato e
  quantidade (regra `tags`); `--tags` lista as de cada nó, com a herança calculada. Para quê: classificar e filtrar os
  resultados por categoria na gestão visual — a primeira é a GVV (Gestão Visual Virtual) do Control Center. Decisão do
  MJRP, 2026-10-06.
- **NFR (requisito não funcional transversal):** um nó próprio em `requirements/nfr/` (`NFR-01-<slug>.md`), como restrição que
  vale para todas as features; não é importado por nenhuma. O prefixo `REQ-` fica só para os REQ locais da feature.
  Decisão do MJRP, 2026-10-04 12:15, reversível: ele pode voltar atrás.
- **Estado observável:** uma situação da superfície do sistema que o humano vê e julga — alvo do `points_to`, com block
  ID por estado. Um tipo de nó, dois documentos: o **estado de tela** no `info-arch.md` (superfície visual, do protótipo
  julgado) e o **estado de comportamento** no `behavior.md` (superfície não visual: saída de comando, código de saída,
  arquivo gerado, hook que bloqueia, resposta de API, o que um agente faz). Sem tela, o que o humano julga são os
  exemplos. Link com caminho (`apps/<app>/docs/specs/info-arch#^x`) resolve no projeto aninhado. Decisão do MJRP,
  2026-10-04 14:41: uma regra só para todo requisito, sem isenção por tipo de projeto nem por data.

### A declaração única
As regras abaixo, em forma que o script lê, estão em `mjrp-scripts/requirements_graph_rules.json`: tipos de nó
(com o padrão de ID e onde mora), arestas (origem, destino, mínimo, máximo, a partir de que status são cobradas),
restrições e a sintaxe de cada forma de nó. Mudou a regra, muda o arquivo — e esta página explica o porquê.
Os status seguem o ciclo `Backlog → Prioritized → Ready → In progress → Done → Accepted`; uma aresta cobrada "a
partir de Ready" vale de Ready em diante. **Ready é o «Pronto para construir»** ([[pdlc-loops]] §4): o requisito vai a Ready com o OK do
humano, registrado no log; **Accepted** é o aceite dele no UAT. `Deferred` é válido mas fica **fora do ciclo**: requisito adiado não é
cobrado como Ready nem conta como aberto (decisão do MJRP, 2026-10-04 14:28). **`Cancelled`** também fica fora do ciclo: é o
requisito que não será feito — superado por outro ou desistido. Nunca conta como alcançado nem como aberto e **não conta no
andamento** (a tela o lista fora do `feito/total`: `7/7 Done · 1 Cancelled`; o `gen_prd_status.py`, que escrevia essa forma na tabela do PRD, foi aposentado em 2026-10-19); mantém o ID e as arestas — `epic` continua cobrada, e
`supersedes` diz por quem foi superado. A diferença para `Deferred`: o adiado pode voltar, o cancelado não — o retorno é um
nó novo (MJRP, 2026-10-13 17:15, ADR-0020 A.6). No board do Delivery,
uma coluna **Cancelled** no fim.

### Arestas da primeira versão
Escreve-se **só uma direção**; a inversa é calculada (backlink no Obsidian, script para o agente).

| Aresta | De → para | O sensor exige |
|---|---|---|
| `serves` | épico → resultado do ROADMAP | todo épico tem exatamente 1 |
| `epic` | requisito → épico | todo requisito tem exatamente 1, em todo projeto |
| `planned_for` | requisito (ou épico, como atalho) → release | opcional — release é opcional por projeto; obrigatória a partir de `Prioritized` quando o contrato liga `requirements.release_required` (a release do épico cumpre) |
| `contributes_to` | resultado → resultado de **outro** roadmap | 0..1; o alvo existe, é caminho relativo + `#^ID`, nunca o próprio roadmap, sem ciclo (ver *O resultado que contribui*) |
| `points_to` | requisito → estado observável (de tela ou de comportamento) | requisito Ready tem pelo menos 1; o alvo existe |
| `imports` | feature → requisito | ver *Cardinalidade* |
| `implements` | TASK → REQ local | toda TASK tem pelo menos 1; todo REQ tem pelo menos uma TASK |
| `verified_by` | REQ → teste ou entrada do `uat.md` | REQ Done tem pelo menos 1 |
| `supersedes` | requisito novo → requisito entregue | obrigatória quando um requisito Done muda |
| `delivered_by` | requisito → commit | evidência de Done quando nenhuma feature Done o importa (trabalho meta, ou entregue antes do grafo) |
| `accepted_in` | requisito → aceite do humano (`uat#^UAT-xx` ou `log AAAA-MM-DD HH:MM`) | requisito Accepted tem 1, e ele resolve |

Cada aresta é checada só no trecho do ciclo em que faz sentido (lição do `SDD_chain_artifacts_check`: checar tudo
em todo par gerou 366 falsos positivos).

### Cardinalidade feature × requisito
Decisão do MJRP, 2026-10-04, nas palavras dele — **limitar:**
- **Feature → requisito: 1..n.** Uma feature entrega um ou mais requisitos. Por exemplo, a F01 entrega a S-08 e a
  S-09 juntas porque compartilham a mesma tela.
- **Exceção: o conserto.** Uma feature `solution_type: fix` com `fixes:` não vazio não importa story: o requisito dela é a issue que ela corrige (`feature_has_requirement` não cobra o `imports`). Sem `fixes:`, ou com `solution_type: feature`, a regra de 1..n vale. O legado `track: Fix` segue pela regra do NFR e do artigo da `constitution` (abaixo). F64 e F94.
- **Requisito → feature: 0..1 aberta por vez.** Um requisito em andamento está numa única feature.
- **Se um requisito precisa de duas features, ele é grande demais.** A saída é fatiar o requisito, que já é um
  procedimento da `mjrp-writing-reqs`, e não permitir n:m.
- **Exceção: os NFR transversais.** Eles não são importados por uma feature de produto. Valem como restrição para todas e
  são conferidos na revisão, junto com a `constitution.md`. **A única importadora é a feature `solution_type: fix` que paga uma
  violação dele** (`violates:: NFR-xx`): trabalho de engenharia (um refactor planejado por ADR, infraestrutura) importa o NFR
  que serve, em vez de uma story inventada para a feature ter o que importar — e pode ter só NFR no `imports`. A exceção é a dívida
  que ela paga, não a trilha sozinha (regra `fix_nfr_import`): `fixes:` não vazio (o card da Fix tira a release da issue), um
  `violates::` fora de bloco de código que nomeia o mesmo NFR, e o NFR vivo (nem `Cancelled`, nem substituído). Quando o violado é
  um artigo da `constitution.md` (que não é nó do grafo), a spec diz `violates:: constitution#N` de um artigo que existe, com `fixes:`, e o `imports` fica vazio.
  Várias features abertas podem importar o mesmo NFR. Quem declara é `imports.nfr_tracks` no `requirements_graph_rules.json`.
- **Mudar um requisito já entregue gera um requisito novo, que substitui o antigo.** É aí que a aresta
  `supersedes` deixa de ser opcional.

### Release, épico e requisito
- **Release é opcional por projeto** e mora numa seção do `ROADMAP.md` (decisão de 2026-10-02). Um projeto que quer a release
  sempre declarada liga `mjrp_harness.requirements.release_required: true` no contrato: então todo requisito a tem a partir de
  `Prioritized` (um Backlog pode ainda não ter) — na própria story **ou no épico dela**, que cumpre pelo atalho. Wave, milestone e
  release são o mesmo nó, com um campo `kind` se o projeto quiser nomear diferente; milestone é release com data.
  **Desde 2026-10-14 19:57 (decisão do MJRP), o produto tem de aparecer no Control Center:** num `code-app` em `standard`
  ou `full`, o item `product-structure` do catálogo canônico cobra ao menos uma release no `ROADMAP.md` e, em toda story
  que não é `Deferred` nem `Cancelled`, o `epic:`; e o **próprio** `planned_for` **a partir de `Prioritized`** (`product-structure@2`: só uma story em
  `Backlog` pode ficar sem release; é a mesma régua do sensor do grafo com `release_required` ligado) — o atalho do épico vale
  para este sensor, mas não chega ao Board da tela. O NFR transversal (`type: nfr` ou ID `NFR-nn`/`<PFX>-NFR-nn`) não tem épico nem
  release por regra: não entra em "sem release" nem no "n de m" de nenhuma release (o mesmo que o núcleo do Control Center, F22). O juiz é `mjrp-scripts/product_structure_check.py`. **Desde 2026-10-14 21:21 (decisão do
  MJRP), a estrutura é exigida na criação e conferida nos donos:** uma story só fica `Ready` com `epic:` e o próprio
  `planned_for:` resolvendo (`mjrp-writing-reqs`); só entra em Delivery se o script, filtrado para ela, não acusa
  lacuna (o portão da `mjrp-pdlc`, [[pdlc-loops]] §4); o Learn roda o script inteiro; e um filho antigo se arruma de
  uma vez pelo modo *conform* da `mjrp-pdlc-bootstrap` (dona da nota CM-0019).
- **A unidade planejada é o requisito** (`planned_for`); a feature herda a release dos requisitos que importa, e o
  sensor acusa feature que importa requisitos de releases diferentes. O remédio — a story entregue fica com a feature que
  a entregou; o `planned_for` de uma Done é a release em que saiu; nunca uma feature por release — está em [[pdlc-loops]] § 5.
- **Uma release pode conter épicos inteiros** — o épico não atravessa necessariamente a release. `planned_for` no
  épico é atalho para todos os seus requisitos; o requisito sobrescreve quando precisa. A composição por épico é
  calculada: épico inteiro na release quando todos os seus requisitos estão nela, parcial quando só alguns.
  **MJRP (2026-10-04): é importante para o controle humano e a gestão visual no Control Center** — o roadmap tem de
  poder mostrar releases compostas por épicos.
- **Ficam fora:** *fase* é a fase do PDLC (discovery, design, SDD), outro eixo; *sprint* é caixa de tempo, não de
  conteúdo — quem usa declara como release de `kind: sprint`.

### O resultado que contribui para o resultado de outro roadmap (`contributes_to`)

Um produto que mora dentro do repositório de outro (um app em `apps/<app>/`) é um **projeto como os outros**: tem épicos
próprios, cada um servindo a um resultado do roadmap dele, e toda story tem exatamente 1 épico. O fio para cima não é
um épico emprestado: é uma aresta **de resultado para resultado**. No `ROADMAP.md` do filho, o resultado declara aquele
do roadmap de cima para o qual contribui, na sintaxe de propriedade das outras arestas:

```
### O humano vê o estado do trabalho dos agentes numa aplicação web e mobile, …
contributes_to:: ../../ROADMAP#^OUT-03
… ^CC-OUT-01
```

- **Cardinalidade 0..1.** Sem `contributes_to` é o caso comum (todo filho independente). A **release** continua só
  respondendo *quando*; o resultado, *por quê*.
- **A forma do alvo:** sempre **caminho relativo ao arquivo que declara + `#^<ID>`** — nunca um ID nu. O resolvedor nunca cai
  no grafo local: um alvo que só casaria por ID local é erro.
- **Três resultados da resolução**, com saídas diferentes no sensor:

  | Caso | Quando | Saída |
  |---|---|---|
  | **resolvido** | o caminho cai no `ROADMAP.md` de outro projeto do **mesmo repositório** (um diretório com `.mjrp-project.yml` sob a mesma raiz de repositório) e o bloco existe lá e é um resultado | passa |
  | **inexistente** | o arquivo é alcançável e o bloco não existe nele; o alvo é o próprio roadmap; a forma é ID nu; o alvo não é resultado; há ciclo | **erro** (exit 1) |
  | **fora de alcance** | o caminho sai do repositório, o arquivo não está no disco (ponte, nuvem, repositório irmão ausente) ou não é o `ROADMAP.md` de um projeto com contrato | **não avaliável** (exit 2 com `--strict`) — nunca verde, nunca lido |

  A leitura do alvo fica limitada aos `ROADMAP.md` de projetos com contrato do mesmo repositório — o servidor de um app
  nunca abre um caminho livre.
- **O rollup — contribuir não é igualar, e o filho não segura o pai.** O status de um resultado é derivado **só dos
  épicos próprios** dele. O status do resultado filho **não entra** nessa derivação, nem como unidade: o filho costuma ser
  mais largo que o pai (o `^CC-OUT-01` inclui a release do iPhone; o `^OUT-03` se cumpre no Mac). O filho aparece **ao
  lado**, numa lista "Resultados que contribuem" com `{projeto, ID, título, status derivado no projeto dele}`. O caso
  "próprios fechados, contribuinte aberto" não é mostrado como 100% sozinho: a tela diz *"Trabalho próprio: concluído ·
  1 resultado que contribui em andamento"*. Filho ilegível ou fora de alcance: a linha dele diz **desconhecido** e o
  motivo — nunca um palpite, nunca omitida. A leitura e a tela são do Control Center; o grafo só provê a aresta.
- **"Aninhado" vem do caminho,** não de campo no contrato: um projeto cujo contrato está sob a raiz de um repositório
  cuja raiz tem outro contrato é aninhado (`kind: nested`). Projeto filho com repositório próprio não é aninhado: é
  independente, e um `contributes_to` dele para o harness é fora de alcance fora da máquina que tem os dois.
- **Todo app novo dentro do harness** nasce assim: épicos próprios, `contributes_to` quando contribui, e o prefixo de
  identidade abaixo.

### Identidade: o ID é único no repositório

Duas sequências com o mesmo prefixo em projetos que dividem um repositório (`OUT-01` no harness e no app) fazem um ID
deixar de dizer de que projeto é. A regra (ADR-0020 D.3): um projeto aninhado leva o prefixo do contrato
(`mjrp_harness.id_prefix: CC`) em **toda sequência por projeto que o projeto que o contém também usa** — ADR
(`CC-ADR-0002`), épico (`CC-EP-01`), resultado (`CC-OUT-01`), NFR (`CC-NFR-01`). Ficam sem prefixo o que o outro projeto
não usa ou que é uma sequência só no repositório: release, story (`S-NN`), feature, issue do UAT. O sensor aceita o prefixo
do contrato nos resultados, épicos e NFR do projeto e **reprova (`id_unique`) um ID de nó repetido** entre o aninhado e a
raiz do repositório. O nome do arquivo de uma ADR não muda; muda o título (`# CC-ADR-0002: …`, formato `decision@2`).

### O status pede evidência
O status é declarado no frontmatter, e declarado sozinho ele mente: ninguém atualiza, ou atualiza errado, e quem lê o
grafo roteia com confiança para o lugar errado (risco R-01 do PRD do harness). Por isso o sensor confere o status
contra a realidade — **a mesma regra para todo projeto**, decidida pelo MJRP em 2026-10-04:

| Status | Evidência que o sensor exige |
|---|---|
| **In progress** | uma feature aberta que importa o requisito, **ou** atividade recente — commit no nó ou na feature, ou entrada do log que cita o ID, em até `requirements.stale_days` (14) |
| **Done** | uma feature Done que o importa (tarefas fechadas, REQ com `verified_by`), **ou** `delivered_by:` com o commit que entregou |
| **Accepted** | a de Done **e** `accepted_in:`, que aponta o aceite do humano |
| **Ready** | `points_to`; o estado de tela apontado aparece na linha `shows::` de um protótipo aprovado (registro em `info-arch.md` § *Protótipos aprovados*) — estado de comportamento fica isento, não tem tela; e o documento do estado observável não mudou depois do requisito — se mudou, o critério pode ter envelhecido; com estado de tela, o `docs/specs/design-system.md` do projeto existe (regra `design_system_exists`: a identidade se decide antes do «Pronto para construir») |

Code-app entrega por feature; o trabalho meta, e o que foi entregue antes do grafo, por commit — as duas formas são
evidência conferível, nenhuma é isenção. Três mecanismos aplicam a regra: o `pre-commit` recusa o commit que deixa
contradição num nó que ele toca; o `Stop` faz o mesmo nas sessões locais; uma passada diária acusa o que apodreceu
sem edição (In progress parado, estado mudado depois do Ready).

### O status derivado no mesmo commit (F67)
Cada status tem uma fonte só. O que deriva de outro — a feature do `tasks.md`, o requisito das features que o importam, a issue
de UAT `fixing (Fxx)` da Fxx **quando a pasta da Fxx cita a issue** (UAT-429: a feature já pronta não conserta sozinha a issue aberta depois dela) — é gravado pelo `pre-commit` no mesmo commit (`status_sync.py --staged`, que lê o índice e deriva só o
que o commit toca); as regras moram em `requirements_graph_rules.json` → `derivation`. Só para a frente: `Accepted` e `closed` nunca
são derivados. Épico e release são calculados por quem os mostra, nunca gravados. `status_sync.py --check` acusa o drift fora dos
commits; `--apply` o grava. **A passada diária** (`status_sync_daily.py`, chamada pelo `doctor` antes das checagens; à mão, `status_sync.py --daily`) aplica o derivado do projeto inteiro, a raiz e cada app aninhado com grafo, e **grava nos arquivos sem commitar** (decisão do integrador, 2026-10-27: só o integrador escreve na `main`, e todo commit leva entrada no log; quem leva o derivado é o integrador ou o próximo commit, em que o `pre-commit` alinha). O relatório do `doctor` diz quantos status gravou e quais nós. Só grava no checkout principal, na `main`, sem merge, rebase nem `index.lock` abertos, e nunca em arquivo com edição sem commit; num worktree ou fora da `main` só mede. O que o derivado não decide (um `Done` com tarefa aberta, um requisito à frente da feature, uma issue `fixed` com a feature aberta) vai para o rastro do sensor de cada projeto, trilha do agente; à lista do MJRP só chega o que é dele (o «Aceite», o aceite, o OK de uma issue da trilha dele).

### Reconciliação (Guardian)
Quando o sensor acusa contradição ou status apodrecido, quem lê o grafo **reconcilia antes de rotear**:

1. Leia o achado e o nó — só ele, não o documento inteiro.
2. Confira a realidade: o git (o commit existe? a feature foi tocada?), os testes do REQ, o `uat.md`, o log.
3. A realidade tem evidência que faltava no nó → escreva a evidência (`delivered_by`, `accepted_in`, a tarefa marcada).
4. O status está à frente da realidade → volte o status ao que a evidência sustenta e diga por quê no log.
5. **Accepted é decisão do humano** — sem aceite registrado, pergunte a ele; nunca o declare por ele.
6. Registre cada reconciliação no log (uma entrada por decisão) e rode o sensor de novo.

É procedimento de Guardian: a `mjrp-ensuring-sdd` o assume (S-66), e a `mjrp-pdlc` o chama antes de decidir a
próxima etapa. O que **deriva** de outro status não passa por proposta: a passada diária o aplica (abaixo). A passada só **propõe** o que é da reconciliação, que pede julgamento (relatório em `reports/audits/`); o status muda numa sessão. O agente
que executa a reconciliação por conta própria é do EP-03 (brief do MJRP).

### Quem faz o quê (arquétipos)
- **Escrevem as arestas:** `mjrp-writing-reqs` (`epic`, `points_to`, `planned_for`), `mjrp-coaching-pm` (`serves`, `contributes_to`), `mjrp-specifying-sdd-artifacts`
  (`imports`, `implements`), quem escreve o teste ou o `uat.md` (`verified_by`).
- **Escrevem os estados observáveis:** o de tela, `mjrp-designing-ui` (block ID no
  `info-arch.md`, a partir do protótipo aprovado); o de comportamento, `mjrp-writing-reqs` no Example Mapping, com os
  exemplos julgados pelo humano antes do Ready (decisão D-04 do MJRP, 2026-10-04).
- **Confere o grafo:** `mjrp-ensuring-sdd` (Guardian), sobre o sensor determinístico
  (`requirements_graph_check.py`; o `SDD_chain_artifacts_check` foi aposentado em 05/10, S-77).
- **Percorre o grafo:** `mjrp-pdlc` (Orchestrator) decide a próxima etapa pelo estado dos nós.
- **Julga o conteúdo:** `mjrp-ensuring-quality` (Reviewer) — a aresta existir não prova que o teste prova o REQ.

## History
- **2026-10-30 20:35** · **A story movida de pasta não é story nova (UAT-420, conserto da F137).** A reconferência achou que mover uma story para a pasta de outro épico, com a frase intacta, era recusado como se ela fosse nova. Agora o texto antigo é achado no `HEAD` pelo id; a abreviação declarada não termina a frase; o milhar não é versão; e, sem `format:` no nó, o formato do contrato decide, como a nota CM-0093 diz.
- **2026-10-30 18:30** · **A frase da story no template, conferida pelo sensor (F137, UAT-416).** O MJRP: «stories vem do scrum, do agile e tem um padrao bem conhecido, um template de escrita e percebi que nao estamos seguindo». Das 202 stories, 18 seguiam o template; eram escritas imitando a vizinha. A regra `story_form` (no sensor do grafo, sem checagem nova no doctor) recusa no commit a story cujo texto sai do molde, com o motivo; as abertas que ninguém tocou avisam até 2026-11-30 e viram achado depois (o padrão do W20); as entregues não se julgam. Decidido pelo agente, revisável pelo MJRP: o teto de 220 caracteres (a mais longa das 18 tinha 216). As 36 abertas fora do molde reescritas; a S-195, a S-199 e a S-202 ficam para os ramos delas.
- **2026-10-30 10:03** · **O modelo dos três eixos vira a ADR-0025 (`Proposed`, F129):** o tipo do item (épico, feature, story, task, bug) lido do id e do lugar no `node_types` que já existe (o campo `item_type`); a sprint (`SPR-NN`, `docs/specs/groupings/sprints/`) e o milestone (`MS-NN`, `docs/specs/groupings/milestones.md`) como agrupamentos opcionais declarados no contrato (`groupings`); o `kind::` da release sai; o estado reduzido a uma categoria que é a coluna; a task item do board sem virar nó próprio (continua `local_id` do `tasks.md`); «fechado» separado de «aceito»; «Esperando» (S-197). O modelo inteiro e o impacto estão no plano da F129. A seção *Release, épico e requisito* acima muda quando a ADR for aceita. Decidido pelo agente, revisável pelo MJRP.
- **2026-10-30 09:33** · Decisão do MJRP: **a task é card próprio no board**, com filtro de tipo (opção B, entre «filha no card» e «card próprio»); a spec e o plano são documentos do item, abertos na gaveta do card. Vira o épico CC-EP-08 do Control Center.
- **2026-10-30 00:01** · Decisão do MJRP, depois da pesquisa `reports/research/2026-10-29-work-items-groupings-and-sdd.md`: **release e milestone se separam** — release é o que vai para o usuário (uma versão); milestone é um ponto no tempo com critério de saída. Isto reverte a regra de 2026-10-02 (milestone = release com data; sprint = release `kind: sprint`). **A sprint entra como agrupamento opcional, por projeto** (o harness segue em fluxo contínuo; a v0 do Album Blender usa as sprints para o histórico). O modelo novo (tipos de item, agrupamentos, estado; o board agnóstico) ainda vai virar épico e ADR; até lá a regra antiga segue no código.
- **2026-10-27 15:39** · **O board mostra o trabalho que está em ramo, sem banco de dados (F67 TASK-04, S-173).** Decisão do MJRP (2026-10-26: «continuo tendo que pedir status no chat»; a resposta dele: a F67 mais os ramos no board, sem banco de dados), vista e aprovada por ele na tela em 2026-10-27 («fora isso ok pra fechar»): o núcleo lê a feature na ponta de um ramo aberto (`branch-convention@2`, que aceita também os ramos dos worktrees `claude/fNN-…`) e o card do Feature Board diz «em ramo · N de M tasks» (ou só «em ramo»), o nome do ramo ao passar o mouse, distinto por peso e traço, nunca só por cor. Decidido pelo agente, revisável pelo MJRP: o estado `^tracks-feature-on-branch` (UI-255), o nó S-173 `Done` com `delivered_by: 6609ebd8`, e na S-168 os estados `^commit-derives-status-same-commit` e `^daily-pass-writes-derived-no-commit` do `behavior.md` da raiz, escritos no passo retroativo. A palavra «ramo» vira «branch» na F109 (S-192).
- **2026-10-26 22:25** · **O conserto não importa story: o requisito dele é a issue (F94, UAT-376).** O PDLC v12 (F64) já dizia que a feature `solution_type: fix` não importa story, mas o sensor só conhecia o `track: Fix` antigo com `violates::`; a regra aprovada vence o código, então `feature_has_requirement` aceita `solution_type: fix` com `fixes:` não vazio (3 casos no selftest; no app, 17 features deixaram de ser acusadas). Decidido pelo agente, revisável pelo MJRP.
- **2026-10-26 11:30** · **O status derivado é gravado pelo `pre-commit`, e na via rápida o `points_to` é cobrado a partir de Done (F67, S-168).** Decisão do MJRP (brief da sessão D): quando a feature da via rápida vai para In Progress, a story que ela importa vai junto, e a exigência do estado observável passa a valer a partir de Done (o passo retroativo, antes de fechar). Decidido pelo agente, revisável pelo MJRP: o status de épico e de release continua **calculado** por quem o mostra, nunca gravado (gravar seria uma segunda fonte); a derivação só anda para a frente (nunca rebaixa Done, nunca escreve Accepted, nunca fecha issue de UAT); e o hook só deriva o que o commit toca, para não varrer o drift alheio para dentro de um ramo.
- **2026-10-26 02:56** · **O `--staged`/`--changed` pergunta o carimbo do aceite só dos nós que o commit toca (F78, UAT-362).** O `pre-commit` levava ~43 a 65 s: 99% era `check_acceptance` chamando o git (um `git log --follow`, uma varredura topológica do histórico e dezenas de `git show` por nó `Accepted`) para 98 nós, e o `--staged` descartava o achado de todos menos dos nós tocados. `touched_nodes` passou a ser perguntado **antes** do grafo, e o `Graph(scope=…)` pula o git dos nós fora dele; a varredura topológica e o `status_at` ganharam cache por execução. O veredito é o mesmo (o filtro de `main()` continua); o passe diário e o `--summary` não usam o escopo.
- **2026-10-19 12:05** · **A comparação do PRD § Entregue com os specs sai — `product-structure@9` (CM-0079).** O modelo do PRD perdeu a seção `## Entregue` (`prd@2`, CM-0077, decisão do MJRP): o que está feito se lê do status dos nós embutidos, e uma seção que o resume é uma segunda fonte, como a coluna `Estado` da tabela de épicos. Os dois avisos da CM-0058 (`entregue_status_mismatch`, `entregue_done_not_cited`) saem; o check só perde avisos. A tabela de épicos fica `Épico | Serve`, o critério de saída vai para a linha `exit::` da seção do épico.
- **2026-10-18 14:17** · **Feature de engenharia importa o NFR, não uma story forçada** (feedback do fin-control, ponto 3: a S-66 existia só para a F06, um refactor planejado pela ADR-0004, ter o que importar). O grafo aceita a feature `track: Fix` cujo `imports` são só NFR (ou nenhum, com `violates:: constitution#N` na spec); fora da trilha Fix o NFR importado segue reprovando (`nfr_not_imported`); o NFR não conta para `one_open_feature` nem para a release. Escolha do agente (sem trilha técnica nova): as trilhas que existem são Full, Standard, Fast track e Fix, e a regra da dívida técnica já faz da violação de NFR um item de Fix — criar uma quinta trilha pediria mudar o `feature-track` do catálogo e a tela. Revisável pelo MJRP. Selftest: `requirements_graph_check_selftest.py` (10 casos, com a forma real da F06 do fin-control). Os modelos `req-nfr.md` e `spec.md` e o `feature-artifacts.md` dizem a mesma regra (CM-0067 `requirement-nodes@2`, CM-0068 `evidence-folder@3`; o `spec.md` é modelo do `feature-track`, sem subida).
- **2026-10-18 10:01** · **O PRD § Entregue é cruzado com o `status:` dos specs — `product-structure@7` (CM-0058)** (feedback do `pedroso-incorp`, ponto 4 da auditoria de 2026-10-18): a seção que a CM-0051 criou diz o que já existe, e nada a comparava com o quadro. Escolhi o `product_structure_check` e não o item `prd` porque ele já lê o PRD e os specs e tem o canal de aviso que nunca muda o exit code, enquanto o `prd` só tem cláusulas `contains` (forma). `entregue_status_mismatch`: a frase (corte em `. ` e `;`) que cita `Fnn` com `Done` ou `In progress` e o spec diz outro estado; `entregue_done_not_cited`: spec `Done` fora de uma seção que cita features (seção sem ID não se compara). Aviso e não lacuna porque a seção é prosa e a leitura por frase é aproximação; o dono é a `mjrp-coaching-pm` (o topo do PRD), a cura é corrigir o lado velho. O digest do script mudou, então o item vai a v7.
- **2026-10-18 09:48** · **«Done» é completo qualquer que seja a forma do ID** (feedback do `pedroso-incorp`, ponto 2 da auditoria de 2026-10-18; o sensor saiu verde com seis features `Done` que tinham `- [ ]` e REQ sem `verified_by`): o motivo era o ID — as tasks `T-230` e os REQ `REQ-F-05` do filho não casavam com `TASK-nn`/`REQ-nn`, então o sensor via zero tasks e zero REQ. A regra `feature_done_tasks_open` virou `done_feature_complete`: numa feature `Done`/`Accepted`, qualquer caixa `- [ ]` do `tasks.md` (fora de bloco de código) e todo REQ definido (cabeçalho ou item entre colchetes/negrito, mesmo `REQ-F-05`) sem `verified_by::` é achado. Sem fase de aviso: o sensor do grafo não tem severidade nem corte por data, toda regra é um achado cobrado a partir do status. Efeito medido: harness 0, `fin-control` +1 (F08, task de depois do deploy), `pedroso-incorp` 0 (as Done já estavam fechadas), Control Center +2 achados (F12 e F38, caixas do rodapé de Done).
- **2026-10-14 22:29** · **Uma régua só para o `Prioritized`, e o NFR fora da conta** (decisão do orquestrador sob a delegação lean do MJRP; a `product-structure@2` e a CM-0020 ainda não estão na `main`, então se corrigem sem versão nova): o `product_structure_check.py` passa a cobrar `planned_for:` **a partir de `Prioritized`** (só `Backlog` fica isento), alinhado ao sensor do grafo com `release_required`; antes a `@2` isentava também o `Prioritized`, e o MJRP tinha ficado com a escolha de reverter. O NFR transversal deixa de ser contado em "sem release" e no "n de m" das releases (espelha `is_transversal` do núcleo do Control Center, F22); o teste-pino do app compara o script com o app lendo o mesmo produto sem os NFRs, e fica verde antes e depois do merge da F22. `mjrp-writing-reqs`, a referência da `mjrp-pdlc-bootstrap` e a CM-0020 dizem o mesmo.
- **2026-10-14 22:08** · **A release se escolhe no Ready** (decisão do MJRP, delegada, regra lean; P1-4 da verificação dos donos): o `product_structure_check.py` deixa de cobrar `planned_for:` de story em `Backlog`/`Prioritized` — o `epic:` segue cobrado desde o primeiro nó e a release vale a partir de `Ready`; a story sem release continua contada em "sem release". O item sobe a `product-structure@2` (CM-0020, que também diz aos filhos que a dona é a `mjrp-pdlc-bootstrap`). Junto: cada lacuna do `--json` ganha um `code` estável e o portão da `mjrp-pdlc` passa a ser o `--story` do próprio script (seleciona por `code`, normaliza o caminho, caminho inexistente é exit 2).
- **2026-10-14 21:21** · **A estrutura de produto desmontada nos donos** (decisão do MJRP): o `product_structure_check.py` fica como sensor — o item `product-structure@1` (I6) e o portão Discovery→Delivery por story na `mjrp-pdlc`; o laço de arrumar um filho antigo vai para o modo *conform* da `mjrp-pdlc-bootstrap`, agora dona da CM-0019; `Ready` passa a exigir o `planned_for` da própria story; a skill que fazia o laço sozinha é aposentada.
- **2026-10-14 19:57** · **O produto tem de aparecer no Control Center** (MJRP, crítico; o Board do fin-control saiu vazio: 11 épicos e 70 stories certos, nenhuma release, nenhum `planned_for`). O item `product-structure@1` do catálogo canônico (nota CM-0019) roda `product_structure_check.py`, que lê o projeto como a tela lê: release no `ROADMAP.md` (a do PRD não chega), o `planned_for` da própria story (o do épico não chega), a medida do resultado como `- **Medida:**` na seção dele. A `release_required` e o atalho do épico continuam valendo para o sensor do grafo; a skill `mjrp-organizing-product-structure` roda o laço até a tela.
- **2026-10-13 19:00** · **ADR-0020 (T1)**: a seção *Subprojeto do harness* e as exceções nas arestas `epic` e `planned_for` saem — o app é um projeto como os outros, com épicos próprios, e `parent_epic` sai do contrato; entra a aresta `contributes_to` (resultado → resultado de outro roadmap, 0..1, alvo existente, sem ciclo; resolvido / inexistente / fora de alcance; o filho não segura o pai); `planned_for` obrigatório vira a opção de projeto `requirements.release_required` (a release do épico cumpre); entra o estado **`Cancelled`**, fora do andamento; entra a identidade de ID no repositório (`id_prefix`, `id_unique`). Sensor, `doctor.py`, `gen_prd_status.py` e as skills mudaram no mesmo trilho.
- **2026-10-09 20:55** · Revisão geral de 2026-10-09: nome do nó `<ID>-<slug>.md` (slug do título em inglês, até 50 caracteres, congelado ao nascer; `aliases: [<ID>]`; link com o nome inteiro e o ID como texto; renomear com `req_file_names.py --reslug`); exceções do subprojeto do harness nas arestas `epic` e `planned_for`; regra `design_system_exists` no Ready com tela; sensor `requirements_graph_check.py` no lugar do aposentado; S-63 fechada.
- **2026-10-09 15:13** · Subprojeto do harness (decisão do MJRP): épico só no harness; o subprojeto declara `parent_epic` no contrato e organiza as stories por release; o sensor reprova épico no subprojeto, `epic:` em story dele e story `Prioritized` sem release. O Control Center é o primeiro (EP-08).
- **2026-10-07 20:29** · Onda E do PDLC em loops: Ready é o contrato — vai a Ready com o OK do humano, registrado no log (decisão do MJRP; `mjrp-writing-reqs` atualizada na onda D).
- **2026-10-06** · **Tags de categoria em resultado e épico** (MJRP: "todos os elementos de outcome de roadmap e dos épicos do harness venham com uma tag que categorize"). Resultado com 1 a 3, épico herda e soma até 3 próprias, vocabulário livre; regra `tags` no sensor e no selftest, `--tags` lista; modelos de ROADMAP e PRD da `mjrp-pdlc-bootstrap` e a `mjrp-coaching-pm` escrevem o campo.
- **2026-10-05 13:46** · **Requisito em pt-BR e em inglês** (S-110; MJRP, 2026-10-05 09:39: "que isso fosse padrão, constitution"). Seções `## pt-BR` e `## en` no mesmo nó; regra `bilingual` no sensor, padrão `languages: [pt-BR, en]`; os 131 nós do harness traduzidos de uma vez (decisão dele: todos agora).
- **2026-10-05 10:53** · **Requisitos agrupados por épico** (S-123; MJRP: a lista longa de stories incomodava). Cada épico declara
  `folder:: ep-NN-<slug-em-inglês>` no PRD; os nós moram nessa pasta, NFR em `nfr/`. Regra `node_folder`; mover um nó não conta
  como atividade para `status_stale`.
- **2026-10-04 22:26** · **Dono do estado de comportamento** (decisão D-04 do MJRP): a `mjrp-writing-reqs` o escreve no Example
  Mapping quando não há tela, e o humano julga os exemplos antes do Ready.
- **2026-10-04 22:00** · **Estado de tela julgado** (decisão D-23 do MJRP, 2026-10-04). Requisito Ready que aponta para estado do
  `info-arch.md` (inclusive aninhado) precisa que um protótipo aprovado o mostre: o block ID está numa linha `shows::`
  do registro em § *Protótipos aprovados*. Regra `state_judged` no sensor; estado de comportamento isento.
- **2026-10-04 15:32** · **O status pede evidência** (S-67; MJRP, a partir da preocupação dele com a fragilidade do status
  declarado). Arestas `delivered_by` e `accepted_in`; regras de evidência no sensor; `pre-commit` e `Stop` recusam
  contradição nova; passada diária; procedimento de reconciliação do Guardian. Risco R-01 no PRD do harness.
- **2026-10-04 14:44** · **`points_to` aponta para estado observável** (decisão do MJRP, 2026-10-04 14:41). O sensor acusava 36
  requisitos do harness, um projeto sem tela; em vez de isentá-los, o alvo deixou de ser só estado de tela. Os 36
  ganharam o estado de comportamento do que existe hoje em `docs/specs/behavior.md` — descrição de onde se vê, não
  critério depois da entrega. Ficou um achado verdadeiro: a S-33 (Tracking do Control Center) está em andamento sem o
  `info-arch.md` do app. A S-63 substitui a S-48 (spec, plan e tasks planos → pasta por feature).
- **2026-10-04 14:29** · `Deferred` entra nas regras como status fora do ciclo (`off_track_statuses`): válido, nunca cobrado
  como Ready, nunca aberto — decisão do MJRP. O harness migrou o próprio backlog para o grafo (passo 10 da S-63):
  `^OUT-01` a `^OUT-06` no ROADMAP, `serves` em cada épico, 81 nós em `docs/specs/requirements/`.
- **2026-10-04 12:29** · Declaração única criada (`requirements_graph_rules.json`); IDs de resultado e release viram
  `OUT-01` e `REL-01` (antes `^R1`, por consistência com `EP-01`); arestas de nó dentro de documento (épico, release)
  em campo inline abaixo do heading.
- **2026-10-04 12:15** · Decididos pelo MJRP: a direção ROADMAP → épico (`serves`); NFR como nó próprio, e os requisitos de
  produto `REQ-` do harness viram requisitos no formato do projeto sob o épico que já os cita (reversível).
- **2026-10-04 11:26** · Página criada na S-63 com as decisões do MJRP: estrutura mista (arquivo por requisito,
  pasta por feature), arestas da primeira versão, cardinalidade feature × requisito (texto dele), releases com
  requisito como unidade e épico compondo release na gestão visual.
