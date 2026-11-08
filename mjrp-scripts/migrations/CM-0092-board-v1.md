---
id: CM-0092
item: board
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0092 · board@0 → board@1

## Por que

O board do Control Center passou a ler a configuração de cada projeto (`docs/specs/board.json`, o `board@1`: as fases com as etapas, os
tipos de item, as colunas e os boards como visões, sobre o padrão do harness em `mjrp-scripts/board_defaults.json`; a F134). Nenhum
caminho levava um projeto que já existe até ela: o bootstrap não falava de board, e a reconciliação do que o projeto já tinha — sprints,
versões, milestones, features, issues, o histórico em prosa — ficava para o julgamento de cada agente. Foi assim que, no v0 do Album
Blender, um agente igualou sprint a feature. O MJRP pediu, em 2026-10-30, a skill que concilia os itens com o board e mostra o de-para
antes de gravar (a `mjrp-configuring-boards`, F136), e que ela faça parte do bootstrap e do conform.

## O que muda

- Item novo no catálogo, `board@1`, no perfil `code-app`: o `docs/specs/board.json` existe e passa nas recusas do `board@1`.
- O juiz é o `mjrp-scripts/board_mapping_check.py <projeto>` (vem no kernel): `board_missing` (sem o arquivo), `board_config_shape` (as
  mesmas recusas do sensor do grafo), `uat_type_unread` (uma célula `Tipo` do `uat.md` que nenhum tipo do board lê),
  `legacy_unmapped` (uma pasta `docs/specs/sprints/` ou `docs/specs/milestones/` com algo dentro e nenhum `docs/specs/board-mapping.json`)
  e, quando o registro do de-para existe, o juiz estrito sobre ele.
- O registro do de-para (`docs/specs/board-mapping.json`, `board_mapping@1`) é novo: é a memória de como o que existia entrou no board.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz o `board_mapping_check.py`.
2. Roda a skill `mjrp-configuring-boards` (a `mjrp-pdlc-bootstrap` a chama no conform):
   - **sem histórico para conciliar** (o que o projeto tem já é feature, story, épico e issue do harness, e não há sprint, milestone nem versão
     a agrupar): o `board.json` dos padrões, `{"format": "board@1", "waiting_after_days": 1}`, mais o que o projeto não faz (uma etapa
     que nunca acontece, como o Deploy de uma biblioteca) como decisão do MJRP;
   - **com histórico** (sprints, milestones, versões, o histórico em prosa): o de-para inteiro — o inventário das fontes, uma linha por
     fonte, os ambíguos como perguntas, a tabela e a prévia mostradas antes de gravar; o de-para mecânico o orquestrador aprova, os
     ambíguos e as escolhas de configuração (ligar a sprint ou o milestone, um tipo novo, tirar uma etapa) vão ao MJRP num lote.
3. Nada é gravado antes da aprovação; depois, o `board.json` e o `board-mapping.json` num commit, com a entrada do log.
4. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0092` e acrescenta `CM-0092` a `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/board_mapping_check.py .` sai 0, e `conformance_check.py . --gaps` não lista `board`.

## Quando não se aplica

No perfil `content` e no `meta`. Um `docs/specs/board.json` que já existe e passa não é reescrito: a nota só se registra.
