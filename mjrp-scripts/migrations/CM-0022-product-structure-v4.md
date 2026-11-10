---
id: CM-0022
item: product-structure
from: 3
to: 4
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0022 · product-structure@3 → product-structure@4

## Por que

A gaveta da issue de UAT, no Control Center, mostra a descrição da issue a quem precisa entendê-la, decidir e, depois, conferir a correção. Até aqui a descrição era um parágrafo só — o que acontece, o que se esperava, nomes de arquivo, códigos de regra e a evidência emendados —, difícil de ler. O responsável pelo produto pediu (2026-10-16, sobre a UAT-212 do Control Center, com os prints das gavetas da UAT-100, 101 e 209): a descrição escrita para ler, com partes fixas, e canônica para todos os projetos.

## O que muda

- o `check` do item continua sendo o script `product_structure_check.py`, que passa a cobrar a `Descrição` de cada issue do `docs/specs/uat.md` na gramática **`uat@3`** (a da célula; a tabela segue `uat@2`): partes unidas por `<br>`, cada uma aberta pelo rótulo em negrito, nesta ordem:
  ```markdown
  **O que acontece:** <texto> <br>**O que deveria acontecer:** <texto> <br>**Como ver:** <br>- <passo> <br>- <passo> <br>**Evidência:** <br>- `<caminho>` ou <link> <br>**Causa:** <texto técnico, opcional, por último>
  ```
- cobra de **cada issue ainda não fechada** (sem data no "OK do humano") **e de toda issue reportada a partir de 2026-10-16**, qualquer que seja o estado; a issue fechada antes dessa data não é julgada até ser reescrita (o Control Center a reescreve depois do protótipo v4.7);
- lacunas novas, cada uma com o seu `code` estável: `uat_issue_unlabeled` (a descrição é um parágrafo só) e `uat_issue_labels` (falta um rótulo obrigatório, os rótulos fora de ordem ou repetidos, "Como ver" sem passos, "Evidência" vazia, "O que acontece" ou "O que deveria acontecer" sem texto, ou um rótulo que não abre a própria parte). A mensagem diz o que falta;
- o texto das três primeiras partes é em linguagem simples: nome de arquivo, código de regra, seletor e commit só em "Evidência" e "Causa" (a regra de escrita é da `mjrp-specifying-sdd-artifacts`, `reference/uat-issue-description.md`; o juiz confere a forma, não o vocabulário);
- o resto do item não muda.

## O que o filho faz

1. A `mjrp-pdlc-bootstrap`, em modo *conform*, roda `python3 mjrp-scripts/product_structure_check.py .` e leva cada lacuna `uat_issue_*` à `mjrp-specifying-sdd-artifacts`, que reescreve a célula `Descrição` de cada issue não fechada **a partir do texto dela e da evidência que ela já cita** — sem perder fato, sem inventar passo —, nas partes acima. Muda só essa célula: o Status, a gravidade e o "OK do humano" ficam. Um lote só, sem decisão de produto: o humano lê as issues depois, na gaveta.
2. Issue nova já nasce nas partes (o modelo do `uat.md` as traz; quem abre a issue é a `mjrp-debugging` ou a `mjrp-ensuring-quality`).
3. Acrescenta `CM-0022` a `conformance.applied`, se quiser registrar a nota.

## Como se confere

`python3 mjrp-scripts/product_structure_check.py .` sai 0 — nenhuma lacuna `uat_issue_*` —, e `conformance_check.py . --gaps` não lista `product-structure`.

## Quando não se aplica

No perfil `content` e no `meta`, e no `process_level: minimal`, como na CM-0019 a CM-0021. Um projeto sem `docs/specs/uat.md` não tem issue a reescrever.
