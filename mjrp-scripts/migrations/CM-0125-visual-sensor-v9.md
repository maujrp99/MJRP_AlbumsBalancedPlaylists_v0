---
id: CM-0125
item: visual-sensor
from: 8
to: 9
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0125 · visual-sensor@8 → visual-sensor@9

## Por que

No primeiro merge de um filho aprovado pela passkey (o `MJRPpersonal`, 6/11), a sessão de lá seguiu as mensagens da trava e tropeçou três vezes: a recusa da aprovação vencida mandava rodar `python3 mjrp-scripts/remote_approval.py`, que não existe no filho; o `wait` e o `status` recusavam o `--root` que o `request` aceita; e nada dizia que a aprovação vale para a ponta do ramo. É a UAT-522, consertada pela F199.

## O que muda

- No filho, toda mensagem do `mjrp-scripts/visual_gate.py` que manda rodar a aprovação de longe mostra o script do harness pelo caminho completo, com `--root <filho>`: o `request` e o `prune` da recusa por aprovação que não vale, e o `discard` e o `request` do aviso novo.
- O aviso novo: quando há uma aprovação do mesmo ramo para outra ponta (um commit depois do pedido), a trava diz qual é e mostra como pedir outra, antes de pedir o Touch ID. Nenhuma aprovação passa a valer para outra ponta.
- O `remote_approval.py` mora só no harness e já é o novo: o `wait`, o `status`, o `discard` e o `prune` aceitam `--root`, e o `request` e o `wait` dizem a ponta.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz o `visual_gate.py` novo. Sem o refresh, a cópia do filho fica diferente da `main` do harness, e a passkey sai até ele (o Touch ID continua).
2. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0125` e acrescenta `CM-0125` a `conformance.applied`.

## Como se confere

A cópia do `mjrp-scripts/visual_gate.py` do filho, sem a linha do carimbo, é igual à da `main` do harness, e `python3 ~/mjrp/projects/mjrp-harness/mjrp-scripts/remote_approval.py status --root .` sai 0.

## Quando não se aplica

No perfil `content` e no `meta`, e num projeto sem tela: só registra a nota. Um projeto aninhado no repositório do harness já é o harness.
