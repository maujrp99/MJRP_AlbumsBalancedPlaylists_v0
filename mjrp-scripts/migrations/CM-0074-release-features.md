---
id: CM-0074
item: release-features
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0074 · release-features@0 → release-features@1

## Por que

No `MJRPpersonal` (UAT-257, 2026-10-18) o `ROADMAP.md` tinha quatro releases (REL-01 a REL-04) com toda story feita (11/11, 19/19, 12/12, 8/8) e `docs/specs/features/` só com um `.gitkeep`: o que se entregou antes do harness mora em `docs/specs/milestones/M0..M11`, cada marco com `spec.md`, `plan.md` e `tasks.md`. A tela Tracking do Control Center mostra uma release pelas **features** (e pelas issues de UAT dela): só a REL-03, a única com issues, apareceu; as outras três sumiram. O `product-structure` dizia VERDE, porque julga o que cada feature tem, nunca que uma release não tem nenhuma; e o sensor do grafo aceita uma story Done com `delivered_by`, sem feature, como evidência.

Nasceu de: o incidente do MJRPpersonal, registrado no `harness-kaizen`. A regra não é nova, é derivada: **uma story entregue fica com a feature que a entregou**.

## O que muda

- Nova cláusula, `feature_history_check.py`, num item próprio. Para cada release do `ROADMAP.md` com story Done/Accepted:
  - sem **nenhuma feature** que pouse nela (a feature declara `planned_for: "[[ROADMAP#^REL-xx]]"` ou importa stories planejadas para ela; uma feature Fix não conta) → `release_done_without_feature`;
  - com feature, mas com story feita que nenhuma feature importa → `story_done_not_in_feature` (**só** num projeto com histórico legado).
- **Severidade.** Num projeto com histórico legado — uma pasta `docs/specs/milestones/` (ou `sprints/`) com algo dentro, ou já arquivada em `_archive/*milestones*`/`_archive/*sprints*` — o achado é **aviso** (o trabalho existe, só mora em outra forma; migrar é um julgamento que o agente faz e o MJRP revisa). Em qualquer outro projeto é **lacuna**: ali a entrega foi feita dentro do harness e uma release sem feature é fluxo quebrado. Aí uma story Done só com `delivered_by` (a evidência que o grafo aceita: um spike, uma decisão de arquitetura) **não conta** para a release.
- `CM-0074` entra em `open_warning_notes`: o aviso **é** o trabalho que a nota manda fazer, então o `--check-note` não passa com um aviso em aberto (resolva, ou registre a pergunta ao MJRP em `conformance.asked`).

## O que o filho faz

1. `python3 mjrp-scripts/feature_history_check.py .` — um achado por release, com o remédio.
2. Num projeto com histórico legado, siga `mjrp-pdlc-bootstrap` › `reference/legacy-history.md`. **Um marco foi uma release, não uma feature**: a migração é uma reconciliação — (1) mapeie cada marco à sua release do `ROADMAP.md` pela evidência (o texto do spec/tasks do marco, que cita os códigos antigos das stories; as datas dos commits; as descrições das release), dividindo pelo `planned_for` das stories o marco que cobre duas releases; (2) dentro de cada release ache as **features**, as fatias verticais que entregam valor observável, e crie cada `docs/specs/features/Fxx-<slug>/` com `status: Done`, `planned_for` da release e `imports:` das stories que entregou; (3) reconcilie — toda story feita é importada por uma feature só; **história nova ou dividida (e a feature que ficaria sem story) é proposta ao MJRP no lote, classe (c)**, e a story que o agente rascunha nasce `Backlog`, nunca Done ou Accepted; story do tamanho de uma feature, ou feature de uma story só, é anotada; os sinais de tamanho do harness avisam; (4) o check sem aviso; (5) **por último**, a pasta do marco vai para `_archive/` ou fica com um ponteiro, nunca apagada. Criar as features e seus `imports:` é classe (a) — decidido pelo agente, revisável pelo MJRP.
3. Num projeto sem histórico legado, a lacuna é de fluxo: a release entregou sem feature — a `mjrp-specifying-sdd-artifacts` (onde a pasta da feature nasce) diz como escrever a feature que faltou.
4. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0074` e acrescente `CM-0074` a `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0074` sai 0 (o check é o `feature_history_check.py`, sem aviso em aberto).

## Quando não se aplica

No perfil `content` e no `meta`, e no `process_level: minimal`, como nas CM-0019 a CM-0028 e na CM-0058. Release sem story feita não pede feature.
