---
id: CM-0117
item: visual-sensor
from: 7
to: 8
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0117 · visual-sensor@7 → visual-sensor@8

## Por que

O MJRP pediu a aprovação de longe também nos filhos: «faça o que precisar pq preciso dela nos filhos tb, com certeza!». A CC-ADR-0041 (a passkey nos filhos) emenda a CC-ADR-0038 na frase «Filhos: só Touch ID». A CM-0116 dizia que o `_passkey.py` não ia para o filho, e já ia, pelo padrão `_*.py` de `VENDORED_FILES`; o que o deixava de fora era a trava. Esta nota substitui aquela frase.

## O que muda

- No filho, antes de pedir o dedo, o `mjrp-scripts/visual_gate.py` procura uma assinatura daquele tip, como no harness. A lista de chaves é uma só, a da `main` do harness; uma lista dentro do filho é ignorada.
- O projeto é a pasta do repositório do merge, em `~/mjrp/projects/`, que tem de estar no registro do Control Center. A cópia do `_passkey.py` e do `visual_gate.py`, menos a linha do carimbo, tem de ser igual à `main` do harness; diferente, ou sem o harness na pasta, a passkey fica fora e o Touch ID continua.
- O refresh grava `branch.main.mergeoptions=--no-ff`: um merge por avanço rápido na `main` não roda hook nenhum. O doctor do filho (I5) reprova sem a opção e avisa, com a data, cada avanço da `main` que não seja um commit novo, um merge commit ou a sincronia com o `origin/main`.
- Sincronizar com o GitHub passa a ser `git pull --ff-only`.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz o `_passkey.py` e o `visual_gate.py` novos e grava a opção do `--no-ff`.
2. O pedido de aprovação de longe sai do script do harness: `python3 ~/mjrp/projects/mjrp-harness/mjrp-scripts/remote_approval.py request <ramo> --root .`.
3. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0117` e acrescenta `CM-0117` a `conformance.applied`.

## Como se confere

`git config --get branch.main.mergeoptions` diz `--no-ff`; o doctor do filho não reprova o I5; e `python3 ~/mjrp/projects/mjrp-harness/mjrp-scripts/remote_approval.py audit --root .` sai 0.

## Quando não se aplica

No perfil `content` e no `meta`, e num projeto sem tela: só registra a nota. Um projeto aninhado no repositório do harness já é o harness.
