# log — o que aconteceu, em ordem

> **Append-only.** Uma entrada por bloco de trabalho, mais recente no topo, com prefixo parseável: `## [AAAA-MM-DD HH:MM] <tipo> — título`. Tipos: `session`, `decision` (o conteúdo mora na página do assunto em `docs/wiki/`, seção `## History`), `ingest`, `inventory`, `harness-feedback`, `review` (uma passada de crítica, com o caminho do relatório). Hora de Brasília, sempre. Ninguém lê este arquivo inteiro — consulta-se por data ou `grep`. Aqui fica só o **quando**; o que é verdade mora na wiki, o estado no `MEMORY.md`.

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
