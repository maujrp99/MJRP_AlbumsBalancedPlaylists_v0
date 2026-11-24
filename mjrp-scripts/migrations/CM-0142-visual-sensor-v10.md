---
id: CM-0142
item: visual-sensor
from: 9
to: 10
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0142 · visual-sensor@9 → visual-sensor@10

## Por que

No MJRP Personal, a reconferência visual completa travava o merge de um conserto de bug a cada commit de tela, e o conserto esperava atrás das features. O MJRP aceitou, em 2026-11-17 14:57, que no conserto de bug o teste de navegador do próprio bug, rodado no site compilado, valha como reconferência visual (UAT-589, F273).

## O que muda

- O `mjrp-scripts/visual_gate.py` lê, no ramo cujas specs de feature mudadas dizem todas `solution_type: fix`, um segundo tipo de relatório: `reports/audits/<data>-<slug>-bug-browser-test[-n].md`. O cabeçalho leva `verdict` e `p0`, como a reconferência, e mais dois campos: `site: compiled` (o teste rodou no site compilado, não no servidor de desenvolvimento) e `test: <o arquivo do teste, relativo ao projeto>`, um arquivo que o ramo acrescentou ou mudou (nunca uma pasta, um caminho com `..` ou um arquivo que o ramo não tocou). A mesma tabela decide (P0 e `incomplete` recusam).
- No ramo com alguma feature que não é conserto, ou sem spec de feature, esse relatório não é lido: a reconferência completa continua pedida.
- A recusa do ramo de conserto sem relatório diz que o teste do bug vale.

## O que o filho faz

1. `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness: traz o `visual_gate.py` novo.
2. No conserto de bug que muda tela: o teste de navegador do bug (o fluxo que o MJRP viu falhar, com clique) roda no site compilado, e o relatório dele vai a `reports/audits/` com os quatro campos, `type: bug-browser-test`.
3. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0142` e acrescenta `CM-0142` a `conformance.applied`.

## Como se confere

A cópia do `mjrp-scripts/visual_gate.py` do filho, sem a linha do carimbo, é igual à da `main` do harness.

## Quando não se aplica

No perfil `content` e no `meta`, e num projeto sem tela: só registra a nota.
