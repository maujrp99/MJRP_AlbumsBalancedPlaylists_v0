---
id: CM-0040
item: design-system
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0040 · design-system@2 → design-system@3

## Por que

A identidade visual de um produto cabe num formato fixo — as **Identity Specs**: o conceito em duas frases, a paleta (primária, secundária, de destaque e os estados), a tipografia, o ritmo e a superfície (clara ou escura, e por quê). É o que o `mjrp-defining-design-systems` extrai ou sintetiza e o que a `mjrp-designing-ui` consulta antes de desenhar. O `design-system@2` pedia só os temas; o MJRP marcou o modelo `identity-specs.md` canônico, então o documento precisa trazê-las.

Nasceu de: decisão do MJRP de 2026-10-16 11:27 (fila `awaiting_item` do catálogo, commit `85cd8f7e`): «Artefato para nosso PDLC.»

## O que muda

- o `check` do item soma ao `## Themes` da v2 as **Identity Specs** no `docs/specs/design-system.md` (o texto «Identity Specs», no bloco do formato fixo, em `Concept & DNA`); o resto do item não muda. Quem já tem as Identity Specs não faz nada.

## O que o filho faz

1. `mjrp-defining-design-systems`: acrescente ao `design-system.md`, na seção `Concept & DNA`, o bloco `### <Projeto> Identity Specs` no formato de `templates/identity-specs.md` (Concept · Palette · Type · Rhythm · Surface). O conteúdo vem do documento e do protótipo aprovado — a paleta, as fontes e a superfície já estão ali; o conceito e o ritmo, quando o documento não os diz, são **do MJRP**: proponha com a fonte e pergunte, sem dar por aprovado.
2. Se o documento já tem o bloco com outro título (`### Identidade`, `**Identity Specs**`), mantenha o conteúdo e ajuste o título para o do formato.
3. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0040` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `design-system`; `conformance_check.py . --check-note CM-0040` sai 0.

## Quando não se aplica

Projeto sem tela.
