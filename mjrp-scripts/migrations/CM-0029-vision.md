---
id: CM-0029
item: vision
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0029 · vision@0 → vision@1

## Por que

O `VISION.md` é o porquê do projeto — propósito, visão, objetivo e como — e a primeira coisa que a onboarding lê. Quem não sabe para que o todo serve mexe no específico sem saber que invariante quebra. O modelo `templates/vision.md` da `mjrp-pdlc-bootstrap` é onde o harness fixa essa forma, e o `new_project.py` o escreve no nascimento do projeto; um filho adotado depois (brownfield) ou que perdeu o arquivo não o tem na forma.

Nasceu de: decisão do MJRP de 2026-10-16 11:27 (fila `awaiting_item` do catálogo, commit `85cd8f7e`): «Artefato para o nosso harness.»

## O que muda

- `VISION.md` na raiz do projeto, com as seções `## Propósito (WHY)` e `## Objetivo (WHAT)` (e, no modelo, `## Visão (WHERE)` e `## Como (HOW)`). O check lê as duas primeiras; as quatro são do modelo.

## O que o filho faz

1. `mjrp-pdlc-bootstrap` (modo conform), com o guia `reference/vision-guide.md`: se o `VISION.md` **não existe**, crie-o do modelo `templates/vision.md` e escreva o conteúdo **com o MJRP** — o propósito de um projeto nunca é deduzido dos arquivos: extraia dos documentos que o projeto já tem (README, PRD, `docs/log.md`), mostre a fonte de cada frase e pergunte, com opções, antes de gravar.
2. Se o arquivo **existe com outros títulos** (`## Why`, `## Objetivos`…), renomeie as seções no lugar para as do modelo, mantendo as palavras que já estão lá; não reescreva o texto.
3. Projeto com tela: as seções `## Vibe` e `## Design DNA` do modelo (bloco `ui-only`) continuam do `mjrp-defining-design-systems`.
4. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0029` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `vision`; `conformance_check.py . --check-note CM-0029` sai 0.

## Quando não se aplica

Projeto `content` (o item `purpose` cobre: `VISION.md` ou `Core/PROJECT_CONTEXT.md`) e `meta`.
