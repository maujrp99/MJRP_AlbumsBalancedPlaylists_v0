---
type: kernel-refresh
status: concluído
date: 2026-11-21
---

# Atualização do kernel do harness no Album Blender V0 — 2026-11-21

## Resumo

O kernel do V0 (carimbado em 2026-11-10) foi atualizado para o do harness de 2026-11-21 (fonte `61d4f2a91`).
Nada do produto foi tocado. A atualização ficou **staged** no ramo `claude/kernel-refresh-2026-11-21`, sem commit
(o gancho recusou o nome do ramo); o orquestrador aplica como patch na `main`. Base do patch: `main` em `c40a7b6`.

Comando rodado, na pasta do worktree:

```
python3 /Users/maujrp/mjrp/projects/mjrp-harness/mjrp-scripts/new_project.py . --refresh-kernel
```

## O que mudou

- **Scripts**: 48 arquivos novos em `mjrp-scripts/` e o resto atualizado (ao todo 320 arquivos). Entre os novos:
  `machine_load.py` (a fila de máquina, que o `merge_train.py` atual importa), `machine_load_selftest.py`,
  `board_move.py`, `board_states.json`, `board_states_check.py`, `state_first_check.py`, `hooks_map.py`,
  `hooks_map_check.py`, `hooks-catalog.json`, `conflict_marker_check.py`, `schema_bump_check.py`,
  `supervisor_state.py`, `delegation_brief.py` e as notas de migração CM-0138 a CM-0165.
- **Ganchos**: novos `machine_load_guard.py`, `state_first_guard.py`, `post-merge` e `reference-transaction`;
  atualizados `commit-msg`, `pre-commit`, `pre-merge-commit`, `deletion_guard.py`, `human_valves_guard.py`,
  `catalog_marks_guard.py`. Em `.claude/settings.json` entraram: guarda de «estado primeiro» (antes de Write/Edit),
  guarda da fila de máquina (antes de Bash) e o gancho da posse de sessão (`session_lease.py`) em três eventos.
- **Wiki do harness**: 31 páginas em `docs/wiki/harness/` (32 arquivos mudaram), mais `PRINCIPLES.md`. Os modelos
  de `mjrp-skills/.../mjrp-specifying-sdd-artifacts/templates/` (plan, spec, tasks) também foram atualizados.
- **Contrato** (`.mjrp-project.yml`): só ganhou `received:` (10 itens novos), a versão e a fonte do kernel e a lista
  `vendored`. `docs/specs/board.json`, `AGENTS.md`, o resto do contrato e o produto (`public/`, `server/`, `shared/`,
  `app/`) ficaram como estavam, assim como `docs/specs/priority.md`. Cópias das versões antigas estão em `_backups/`
  (ignorada pelo git).

## O que quebrou e como ficou

1. **Nome do ramo**: o gancho de commit recusou `claude/kernel-refresh-2026-11-21` (a convenção só aceita
   `claude/fNN-…`, `feat/fNN-…`, `fix/fNN-…`). Seguindo a ordem, não contornei: o orquestrador decidiu aplicar como patch.
2. **O doctor não rodou**: a fila de máquina segurou os dois pedidos por 3600 s (havia ~16 trabalhos na frente) e o
   `new_project.py` terminou com «não avaliável (exit 2)». Não é falha do trabalho. Por ordem nova, o doctor roda no merge.
3. **Mudança no log**: a `main` andou durante o trabalho (`c40a7b6`); mesclei e reinseri a entrada no `docs/log.md`.
4. **Vitest e teste do gancho de commit**: não rodados (mesma ordem: o orquestrador roda no merge; sem commit, não há
   como provar o gancho de commit aqui).

Verificado: `mjrp-scripts/machine_load.py` existe; `python3 mjrp-scripts/merge_train.py --help` roda.

## Conformidade antes e depois

| | Antes | Depois |
|---|---|---|
| Lacunas | 12 | 12 |
| Notas pendentes | 62 | 89 |
| Itens do catálogo atrás | 9 (adr-names@7, board@6, content-audit@13, prd@4, process-sensors@13, releases@5, report-names@11, session-close@9, visual-sensor@11) | nenhum |

As lacunas são as mesmas 12 (uma é erro: `report-names@11`, 11 relatórios com nome fora do padrão; as outras
são avisos). As notas subiram de 62 para 89 porque o catálogo agora conhece as notas novas. Das 89, 26 já estão
conformes e só precisam ser registradas em `conformance.applied` (board 5, session-close 9, info-arch-sections 3,
product-structure 3, releases 2, merge-drivers 1, inception-notes 1, requirement-nodes 1, wireframes 1);
as 63 restantes pedem trabalho.

Os arquivos completos das duas listagens estão no bloco de notas da sessão (antes: 62 notas; depois: 89 notas).

## Pendências por quem decide (mais urgente primeiro)

Prazos: avisos viram erro nas datas abaixo.

### Agente decide (a skill dona executa; sem pergunta ao MJRP)

1. **report-names** (6 notas, a lacuna é erro hoje): renomear os 11 relatórios de `reports/audits/` (visual-parity
   recheck F56, F58, F60, F63…) para `AAAA-MM-DD-<projeto>-<tipo>` e varrer os ponteiros. Skill: `mjrp-syncing-docs`.
   Prazo: 2026-12-21, mas já reprova.
2. **uat@4** (1 nota, prazo 2026-12-03, o mais próximo com lacuna): coluna «Reportado por» no `uat.md`, que separa
   as trilhas Humano e Agente. Skill: `mjrp-specifying-sdd-artifacts`. Atenção: coluna nova, sem inventar quem abriu cada item.
3. **wireframes@1** (1 nota, prazo 2026-11-27): registrar; o item já está conforme.
4. **Registrar as 26 notas já conformes** (lista acima): só `conformance.applied`, um commit por nota.
5. **process-sensors** (13 notas), **session-close** (9, já conformes), **adr-names** (3: nomes e cabeçalho dos ADRs),
   **record-shapes** (1: plan, tasks e plano de teste de cada feature nos modelos), **merge-drivers** (1),
   **requirement-nodes** (1), **product-structure** (3), **info-arch** (2) e **info-arch-sections** (3): técnicos e reversíveis.
   Prazos 2026-12-07 a 2026-12-21.
6. **content-audit** (13 notas, 2026-12-21): a auditoria de conteúdo roda de novo depois do kernel novo (o relatório de
   2026-10-28 é anterior ao refresh); um agente independente, um juiz por item. Fazer por último.

### MJRP decide

1. **delivery-strategy** (1 nota, 2026-12-07): como o V0 entrega (ramos, preview, produção, quem envia, como voltar
   atrás). O agente propõe lendo o projeto; a proposta vai a ele marcada como proposta. Ainda não existe no `arch.md`.
2. **project-palette** (2 notas, só aviso, nunca vira erro): a cor do projeto no Control Center; é escolha dele.
3. **design-system** (8 notas, 2026-12-07): `design-system.md` declarar os temas e trazer as «Identity Specs»;
   o agente escreve a partir do que existe, mas o que for escolha de produto (tema, cor) é dele.
4. **visual-sensor** (11 notas, 2026-12-21): `sensors.visual` no contrato (paridade visual); o agente propõe o
   config, mas ligar o sensor e as condições é decisão do MJRP.
5. **prd** (2) e **releases** (2): o PRD abre com «O que é» e as releases têm dono; o conteúdo de produto, medida e
   quem sente cada resultado é dele (a medida é opcional: «sem medida»).
6. As perguntas que a auditoria de conteúdo gerar (classe b ou c) vêm depois, em um lote só.

## O que muda para as sessões que trabalham agora

- Os ganchos do git vêm do caminho `mjrp-scripts/hooks` do **checkout principal** (a configuração do repositório aponta
  para lá). Assim que o patch entrar na `main`, os ganchos novos valem para todas as sessões, mesmo as que ainda
  têm a cópia antiga dos scripts. As guardas do Claude (`.claude/settings.json`) só passam a valer em cada worktree
  quando ele mesclar a `main`.
- Depois do merge: Write/Edit passa pela guarda de «estado primeiro»; Bash passa pela guarda da fila de máquina
  (testes e doctor pesados esperam a vez; a fila já tem ~16 pedidos); cada sessão ganha posse (`session_lease.py`).
- `merge_train.py` atual já acha o `machine_load.py` no V0. O quadro (board) usa os estados de `board_states.json`.
- Sessões com ramo fora de `claude/fNN-`, `feat/fNN-`, `fix/fNN-` continuam sem poder commitar (regra que já existia).

## Estrutura fora do lugar (aviso do refresh, nada foi movido)

Dez itens de `docs/` fora da natureza: `CHANGELOG.md`, `CONSTITUTION.md`, `CONTRIBUTING.md`,
`MJRP_Album_Blender_Prod_Vision.md`, `ROADMAP.md`, `archive/`, `debug/`, `manual/`, `onboarding/`, `technical/`. Cada um pede
decisão de natureza (e `archive/` e `debug/` vão para `_archive/`). Decisão do agente onde as regras do
`structure_rules.json` decidem; do MJRP onde for escolha de produto.
