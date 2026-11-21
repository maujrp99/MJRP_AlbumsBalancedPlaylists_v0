---
id: CM-0119
item: info-arch-sections
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0119 · info-arch-sections@1 → info-arch-sections@2

## Por que

A F177 (texto para pessoa ler, UAT-485 e UAT-491) achou textos longos na tela sem parágrafo nem linha em branco, difíceis de ler. A regra entrou no cânone de design como CO-09, e o modelo do Content Map da `mjrp-designing-ui` passou a dizê-la.

## O que muda

- O Content Map do `info-arch.md` escreve o texto longo que vai à tela com um assunto por parágrafo, linha em branco entre blocos, rótulo em linha própria, lista para os itens com a fonte ao lado.
- A checagem das seções não muda: muda o que o dono escreve nelas.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz o modelo novo pela skill.
2. Na próxima edição do Content Map, o texto longo segue a regra.
3. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0119` e acrescenta `CM-0119` a `conformance.applied`.

## Como se confere

`conformance_check.py . --gaps` não lista `info-arch-sections`.

## Quando não se aplica

Num projeto sem tela: só registra a nota.
