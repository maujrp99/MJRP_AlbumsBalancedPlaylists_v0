---
id: CM-0099
item: visual-sensor
from: 4
to: 5
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0099 · visual-sensor@4 → visual-sensor@5

## Por que

UAT-472, 2026-11-03. O juiz de qualidade da auditoria do `MJRPpersonal` deixou um P0: o comando do sensor visual quebra com `ERR_MODULE_NOT_FOUND`. O `collect.mjs` entrou no kit em 2026-10-19 (F52) e não entrou na lista do que o refresh copia, então o `run.mjs` do filho importa um arquivo que não veio. O `sensors.visual` declarado passava no `conformance_check.py`, porque o `check` do item lê o contrato e não abre o kit.

## O que muda

- o `--refresh-kernel` copia o `mjrp-scripts/visual_parity/collect.mjs` para o filho com tela;
- o `new_project_selftest.py` do harness recusa arquivo do kit, ou `import` local, que fique fora da lista;
- o `check` do item não muda.

## O que o filho faz

1. `new_project.py <projeto> --refresh-kernel`, do harness: traz o `collect.mjs`.
2. `node --input-type=module -e "await import('./mjrp-scripts/visual_parity/run.mjs')"` sai 0.
3. Roda o `sensors.visual.cmd` do contrato. Sem o Playwright no projeto, ele sai 2 (não avaliável), que é outra coisa: o `ERR_MODULE_NOT_FOUND` é que não pode mais aparecer.
4. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0099` e acrescenta `CM-0099` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0099` sai 0, `--gaps` não lista `visual-sensor`, e o `import` do passo 2 sai 0.

## Quando não se aplica

Projeto sem tela, como na CM-0007, e projeto que lê o kernel no lugar (`kernel.source: in-repo`).
