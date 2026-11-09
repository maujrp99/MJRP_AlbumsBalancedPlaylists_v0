---
id: CM-0016
item: report-names
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0016 · report-names@0 → report-names@1

## Por que

Os modelos das skills do harness nomeiam o relatório `AAAA-MM-DD-<projeto>-<tipo>`: a data primeiro ordena por tempo em `ls`. O fin-control usava `<tipo>-<assunto>-AAAA-MM-DD`; o MJRP decidiu pela data primeiro, nos dois.

Nasceu de: decisão do MJRP (2026-10-13, aceite da ADR-0019): a data vem primeiro, como os modelos das skills do harness já prescrevem; o fin-control usava tipo primeiro.

## O que muda

- arquivos de `reports/audits/` nomeados `AAAA-MM-DD-<projeto>-<tipo>.md`, em minúsculas e kebab.

## O que o filho faz

1. Renomear com `git mv` e reescrever os links que apontam para o nome antigo (nada se apaga sem cópia).
2. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0016` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `report-names`.

## Quando não se aplica

Projeto sem `reports/audits/`.
