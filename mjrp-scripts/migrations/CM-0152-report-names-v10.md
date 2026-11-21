---
id: CM-0152
item: report-names
from: 9
to: 10
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0152 · report-names@9 → report-names@10

## Por que

A F273 (UAT-589) trouxe o tipo `bug-browser-test` e o modelo do relatório dele, `templates/bug-browser-test.md` da `mjrp-ensuring-quality`, e o modelo ficou sem dono no catálogo (UAT-603, F297): o learn-gate reprovava a `main`. O modelo é o molde do relatório do tipo que o `report-names@9` já exige, então é do `report-names`, como o `skill-critique.md` na v7.

## O que muda

- O modelo `bug-browser-test.md` entra nas fontes do padrão do item. O check do item **não muda**.

## O que o filho faz

1. `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness, para trazer o modelo novo (se o filho copia os modelos de relatório).
2. Nada a reescrever.
3. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0152` e acrescenta `CM-0152` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0152` sai 0.

## Quando não se aplica

Projeto sem `reports/`.
