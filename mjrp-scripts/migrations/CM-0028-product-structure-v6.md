---
id: CM-0028
item: product-structure
from: 5
to: 6
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0028 · product-structure@5 → product-structure@6

## Por que

A crítica independente do ramo das duas frentes (2026-10-17) rodou o `product-structure@5` sobre o fin-control como a auditoria o leu e achou dois furos nos avisos. O `uat_issue_fix_report` não pegava a **UAT-02**, o caso que a CM-0027 cita: ela traz «**Corrigido**: 14 funções renomeadas…» com os dois-pontos **fora** do negrito, e o padrão só aceitava «Corrigido:». E o aviso `outcome_achieved_incomplete` só reconhecia o rótulo `Aprendizado`, enquanto a tela também lê `O que aprendemos`.

## O que muda

- `uat_issue_fix_report` passa a pegar «Corrigido:», «**Corrigido**:» e «**Corrigido:**» (e «Resolvido…» do mesmo jeito);
- `outcome_achieved_incomplete` aceita `- **O que aprendemos:**` como o aprendizado, igual à tela;
- só avisos mudam: o exit code e o que reprova são os da v5. Nada fica mais exigente.

## O que o filho faz

1. `python3 mjrp-scripts/product_structure_check.py .` — como na CM-0027, os avisos são a agenda do conform e da auditoria: a UAT com «Corrigido» em «O que deveria acontecer» é reescrita separando o conteúdo (o que foi feito vai para a linha do Status), pela `mjrp-specifying-sdd-artifacts`.
2. Acrescente `CM-0028` a `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0028` sai 0.

## Quando não se aplica

No perfil `content` e no `meta`, e no `process_level: minimal`, como nas CM-0019 a CM-0027.
