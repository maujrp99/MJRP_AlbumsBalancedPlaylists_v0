---
id: CM-0127
item: info-arch-sections
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0127 · info-arch-sections@2 → info-arch-sections@3

## Por que

Num projeto filho, uma aprovação ampla («aprovado tudo») registrada como tudo o que estava na tela cobriu o que o humano não olhou, e estados aprovados sem `shows::` travaram as stories em Ready. O registro da aprovação passa a guardar as palavras dele, como foram entendidas e as ressalvas (F214, S-222).

## O que muda

- Cada registro em `## Protótipos aprovados` ganha três linhas: «Palavras do humano», «Como foi entendido» (a lista explícita do que o registro cobre) e «Ressalvas».
- `shows::` lista todo estado que a versão mostra.
- A checagem das seções não muda: muda o que o dono escreve nelas.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz o modelo novo pela skill.
2. O próximo registro de aprovação segue o modelo; os registros antigos ficam como estão.
3. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0127` e acrescenta `CM-0127` a `conformance.applied`.

## Como se confere

`conformance_check.py . --gaps` não lista `info-arch-sections`.

## Quando não se aplica

Num projeto sem tela: só registra a nota.
