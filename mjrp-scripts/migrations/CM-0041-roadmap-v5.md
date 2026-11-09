---
id: CM-0041
item: roadmap
from: 4
to: 5
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0041 · roadmap@4 → roadmap@5

## Por que

O documento de problema e resultado (`templates/problem-outcome-doc.md` da `mjrp-coaching-pm`) não é um arquivo próprio: as partes dele pousam no grafo — o problema e o escopo no épico do PRD, a métrica de sucesso no **resultado** do ROADMAP que o épico serve, o cliente e a necessidade nos requisitos. O MJRP marcou o modelo canônico, e o lugar onde ele se cobra num filho é o resultado do `ROADMAP.md`: `- **Problema:**`, `- **Quem sente:**`, `- **Medida:**` (o `roadmap@4` já os exige). O modelo passa a ser **fonte do padrão** do item.

Nasceu de: decisão do MJRP de 2026-10-16 11:27 (fila `awaiting_item` do catálogo, commit `85cd8f7e`): «Artefato para nosso PDLC.»

## O que muda

- **o `check` do item não muda**: é o mesmo da v4. O que muda é a procedência — o `problem-outcome-doc.md` entra em `pattern_sources`, e uma mudança futura nele passa a pedir nota, como as do `roadmap.md`. Um filho que passa na v4 passa na v5.

## O que o filho faz

1. Se `conformance_check.py . --gaps` **não** lista o `roadmap`, só registre a nota: acrescente `CM-0041` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*.
2. Se lista, é a lacuna da v4 (os campos rotulados) e a `mjrp-coaching-pm` a trata como na CM-0025: o **problema, quem sente e a medida de um resultado são do MJRP** — perguntados um campo por vez, com a fonte, nunca rascunhados pelo agente para ele aprovar clicando.

## Como se confere

`conformance_check.py . --check-note CM-0041` sai 0 e `--gaps` não lista `roadmap`.

## Quando não se aplica

No perfil `content` e no `meta`.
