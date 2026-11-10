---
id: CM-0118
item: content-map
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0118 · content-map@2 → content-map@3

## Por que

A F177 (texto para pessoa ler, UAT-485 e UAT-491) achou textos longos na tela sem parágrafo nem linha em branco, difíceis de ler. A regra entrou no cânone de design como CO-09, e o modelo `templates/content-map.md` da `mjrp-designing-ui` passou a dizê-la.

## O que muda

- O modelo do mapa do conteúdo diz como escrever texto longo que vai à tela: um assunto por parágrafo, linha em branco entre blocos, rótulo em linha própria, lista para os itens com a fonte ao lado.
- A checagem do item não muda: o `CONTENT_MAP.md` continua tendo que existir. Muda o que o dono escreve nele.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz o modelo novo pela skill.
2. Na próxima edição do `CONTENT_MAP.md`, o texto longo segue a regra.
3. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0118` e acrescenta `CM-0118` a `conformance.applied`.

## Como se confere

`conformance_check.py . --gaps` não lista `content-map`.

## Quando não se aplica

Fora do perfil `content`: só registra a nota.
