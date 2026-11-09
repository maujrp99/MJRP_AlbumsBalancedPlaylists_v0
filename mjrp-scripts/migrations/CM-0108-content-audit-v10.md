---
id: CM-0108
item: content-audit
from: 9
to: 10
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0108 · content-audit@9 → content-audit@10

## Por que

A skill que julga a tela passou a se chamar **`mjrp-critiquing-ux-ui`** (era `mjrp-critiquing-ux`): o nome antigo escondia que ela julga também cor e tipografia. O MJRP aprovou manter uma skill só e renomeá-la em 2026-11-04 (F176, UAT-484). O arquivo do juiz e a linha da tabela da auditoria que o filho já escreveu citam o nome antigo, e o sensor os reprovaria depois do refresh.

## O que muda

- O `content_audit_check.py` aceita, para o `judge_skill` do arquivo do juiz e para a linha da tabela item por item, o nome da skill **ou** um nome antigo que o `retired_skills.json` aponta para ela. O arquivo não precisa ser reescrito (reescrever fingiria uma releitura): o juiz relê na próxima rodada e já escreve o nome novo.
- O nome do arquivo do juiz (`*-content-<juiz>.md`) segue o que a linha cita; nada a renomear.
- O check do item **não muda**.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness, para trazer o `content_audit_check.py` novo e o `retired_skills.json` com o nome antigo (`mjrp-critiquing-ux` → `mjrp-critiquing-ux-ui`).
2. Roda `python3 mjrp-scripts/content_audit_check.py .`: um juiz com o nome aposentado (`mjrp-critiquing-ux`) no arquivo e na tabela continua valendo, sem `judge_file_invalid` nem `audit_row_missing`.
3. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0108` e acrescenta `CM-0108` a `conformance.applied`.

Até o refresh nada quebra: o plugin antigo ainda chama a skill pelo nome antigo, e o novo chama pelo nome novo.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0108` sai 0 (o mesmo check da v9).

## Quando não se aplica

Projeto sem auditoria de conteúdo em `reports/audits/`, e projeto cujos juízes nunca foram a skill da tela. O refresh leva o sensor do mesmo jeito.
