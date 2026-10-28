# log — o que aconteceu, em ordem

> **Append-only.** Uma entrada por bloco de trabalho, mais recente no topo, com prefixo parseável: `## [AAAA-MM-DD HH:MM] <tipo> — título`. Tipos: `session`, `decision` (o conteúdo mora na página do assunto em `docs/wiki/`, seção `## History`), `ingest`, `inventory`, `harness-feedback`, `review` (uma passada de crítica, com o caminho do relatório). Hora de Brasília, sempre. Ninguém lê este arquivo inteiro — consulta-se por data ou `grep`. Aqui fica só o **quando**; o que é verdade mora na wiki, o estado no `MEMORY.md`.

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
