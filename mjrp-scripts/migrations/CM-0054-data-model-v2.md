---
id: CM-0054
item: data-model
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0054 · data-model@1 → data-model@2

## Por que

O conteúdo de `docs/specs/data-model.md` é do papel que desenha a arquitetura, não de quem escreve a cadeia SDD. O modelo `templates/data-model.md` morava na `mjrp-specifying-sdd-artifacts`, com a `mjrp-designing-architecture` por dona do item; agora mora com a dona.

Nasceu de: decisão do MJRP de 2026-10-17 23:02: o modelo mora com a skill dona do conteúdo; a crítica independente do ramo (23:53) apontou que `arch` e `data-model` ainda tinham o modelo na `mjrp-specifying-sdd-artifacts`.

## O que muda

- só o caminho de origem do padrão: o modelo `templates/data-model.md` saiu da `mjrp-specifying-sdd-artifacts` e mora na `mjrp-designing-architecture`. A nota CM-0033 (publicada, não se reescreve) cita o caminho antigo: siga o dono do catálogo.
- **o `check` do item não muda**: é o mesmo da v1. Um filho que passa na v1 passa na v2.

## O que o filho faz

1. Se `conformance_check.py . --gaps` **não** lista `data-model`, só registre a nota: acrescente `CM-0054` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*.
2. Se lista, é a lacuna da v1 e a `mjrp-designing-architecture` a trata, com o modelo dela: o que o código não revela (a stack, o limite de escala) é do MJRP, perguntado com opções.

## Como se confere

`conformance_check.py . --check-note CM-0054` sai 0 e `--gaps` não lista `data-model`.

## Quando não se aplica

Projeto `content` ou `meta`.
