---
id: CM-0021
item: product-structure
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0021 · product-structure@2 → product-structure@3

## Por que

A gaveta da feature, no Control Center, mostra a descrição da feature a quem não leu o spec. Até aqui a descrição era o primeiro parágrafo do `## Problem Statement` — só o problema — ou, nas features que já tinham, o `## Summary` num parágrafo só, com as três respostas aglomeradas. O responsável pelo produto pediu (2026-10-16, sobre a UAT-203 do Control Center): toda feature com o resumo, em três parágrafos — o que a feature é e entrega, por quê, como saber que funcionou —, retroativamente, e canônico para todos os projetos.

## O que muda

- o `check` do item continua sendo o script `product_structure_check.py`, que passa a cobrar, de **toda** feature (`docs/specs/features/Fxx-*/spec.md`), o `## Summary` logo antes de `## Problem Statement`, em **três parágrafos separados por linha em branco**, cada um começando pelo seu rótulo, nesta ordem:
  ```markdown
  ## Summary
  **A feature:** <o que é — a coisa em si> <o que entrega a quem usa>.

  **Por quê:** <o problema, nos termos de quem sente, uma ou duas linhas>.

  **Como saber que funcionou:** <uma verificação observável, uma linha>.
  ```
- lacunas novas, cada uma com o seu `code` estável: `feature_summary_missing` (sem `## Summary`), `feature_summary_after_problem` (o Summary depois do Problem Statement) e `feature_summary_labels` (falta um rótulo, um rótulo não começa o próprio parágrafo, ou os rótulos fora da ordem). A mensagem diz o que falta;
- o texto é em linguagem simples: sem ID, nome de arquivo, script ou skill, versão, código de regra ou codinome — o detalhe e a procedência ficam no Problem Statement (a regra de escrita é da `mjrp-specifying-sdd-artifacts`, `reference/feature-description.md`);
- o resto do item não muda.

## O que o filho faz

1. A `mjrp-pdlc-bootstrap`, em modo *conform*, roda `python3 mjrp-scripts/product_structure_check.py .` e leva cada lacuna `feature_summary_*` à `mjrp-specifying-sdd-artifacts`, que escreve (ou reformata) o `## Summary` de cada feature **a partir do spec dela e do que foi entregue** — o Problem Statement, os requisitos, as tarefas fechadas —, nos três parágrafos. Não muda o título nem o resto do spec. Um lote só, sem decisão de produto: o humano lê os resumos depois, como lê qualquer texto da tela.
2. Feature nova já nasce com o bloco (o modelo de `spec.md` o traz).
3. Acrescenta `CM-0021` a `conformance.applied`, se quiser registrar a nota.

## Como se confere

`python3 mjrp-scripts/product_structure_check.py .` sai 0 — nenhuma lacuna `feature_summary_*` —, e `conformance_check.py . --gaps` não lista `product-structure`.

## Quando não se aplica

No perfil `content` e no `meta`, e no `process_level: minimal`, como na CM-0019 e na CM-0020. Um projeto sem `docs/specs/features/` não tem o que resumir.
