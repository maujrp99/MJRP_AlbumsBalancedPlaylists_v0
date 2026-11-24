---
id: CM-0026
item: evidence-folder
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0026 · evidence-folder@1 → evidence-folder@2

## Por que

O `evidence-folder@1` só pedia que a pasta `reports/evidence/` **existisse**. No fin-control ela existia, com uma única subpasta (`UAT-visual/`) e nenhuma evidência de feature; o log do conform dizia que a evidência "já mora em `reports/evidence/<TASK-ID>/`", e não morava. A auditoria independente do conform (2026-10-17) marcou a nota como **fraca**: passava pela forma, e a prova de entrega estava em outro lugar (ou em lugar nenhum).

## O que muda

- o `check` do item deixa de ser "a pasta existe" e passa a ser o script `evidence_folder_check.py` (vendorizado com o kernel, ao lado do `conformance_check.py`), que olha o que a pasta guarda. **Reprova** (lacuna, com `code` estável) quando o projeto tem features e:
  - `evidence_dir_missing` — não há `reports/evidence/`;
  - `evidence_loose_file` — há arquivo solto na raiz de `reports/evidence/` (a evidência mora numa subpasta com o nome do que prova);
  - `evidence_not_by_feature` — há feature com task feita e **nenhuma** subpasta com o nome de uma feature (`Fxx`, `Fxx-…`) ou de uma task (`TASK-…`) com arquivo dentro (a pasta só guarda outros assuntos, como `UAT-visual/`);
  - `evidence_pointer_dangling` — uma spec, um plan ou um tasks de feature cita `reports/evidence/<caminho>` que não está no disco.
- **Avisa** (imprime, nunca muda o exit code) `evidence_feature_without_folder`: feature com todas as tasks feitas e sem pasta própria com arquivo — a prova dela pode morar em outro assunto (uma rodada de UAT, uma reconferência visual), mas então as tasks dizem onde.
- o resto do item não muda; projeto sem feature não tem o que provar e passa.

## O que o filho faz

1. `python3 mjrp-scripts/evidence_folder_check.py .` (ou `conformance_check.py . --gaps`) lista o que falta, com o arquivo e a skill dona.
2. A `mjrp-implementing-tasks` leva a evidência para `reports/evidence/<TASK-ID>/` (ou `Fxx/`) **com `git mv`**, mantendo o nome do arquivo (`<TASK-ID|assunto>-<viewport|origem>-AAAA-MM-DD.<ext>`), e **varre o nome antigo do repositório inteiro** (`git grep -n -F "<caminho antigo>"` em `docs/`, `reports/`, `design/`, comentários), corrigindo cada ponteiro. Uma evidência que **nunca foi gravada** não se inventa: a feature ganha `reports/evidence/<Fxx>/evidence.md`, um arquivo **verdadeiro** que diz onde a prova mora de fato (a saída do verificador, o commit, o relatório de auditoria ou de reconferência) e o que não tem prova, e o `mjrp-ensuring-quality` recebe a lacuna (refazer a verificação e gravar a prova do que ficou sem). Nunca um print ou uma saída fabricados para a pasta passar. O log que afirma «a evidência mora em …» sem que o script confirme está errado, e se corrige.
3. Commit por pathspec com entrada no log; `CM-0026` em `conformance.applied` só depois de o script sair 0.

## Como se confere

`python3 mjrp-scripts/evidence_folder_check.py .` sai 0 e `conformance_check.py . --check-note CM-0026` sai 0.

## Quando não se aplica

Projeto sem `docs/specs/features/`. Fora do perfil `code-app`.
