---
id: CM-0106
item: product-structure
from: 14
to: 15
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0106 · product-structure@14 → product-structure@15

## Por que

No resumo da F43, o Control Center mostrava «o relatório está em `reports/audits/`»: texto em crase, que aponta a pasta e não abre nada. O MJRP queria ler o relatório e não conseguiu (F175, UAT-483, 2026-11-04). Nenhuma regra pedia o link, e a regra de «sem nome interno» no resumo empurrava o agente a apontar a pasta ou a não apontar nada.

## O que muda

- O Control Center resolve `[[arquivo|palavras comuns]]` para qualquer relatório de `reports/` do projeto, pelo nome do arquivo ou pelo caminho (com ou sem `.md`), e o clique abre o relatório na própria tela. Quem lê vê as palavras, não o caminho.
- A regra para quem escreve texto que vai à tela: o documento que a pessoa vai querer abrir é `[[arquivo|palavras comuns]]` apontando o **arquivo exato**, nunca um caminho nem uma pasta em crase. O molde do `Summary` (`new_feature.py`) e as skills `mjrp-specifying-sdd-artifacts` (a descrição da feature e a da issue) dizem a forma.
- O `product_structure_check.py` ganha o **aviso** `feature_summary_path`: caminho ou nome de arquivo em crase no `## Summary` de uma feature **ainda em andamento**. É aviso, nunca muda o código de saída, e a feature fechada não é reescrita de uma vez (corrige-se ao tocar nela). O aviso vira lacuna numa versão futura do item, depois que a regra chegar a todos os filhos.
- O catálogo sobe o `product-structure` à versão 15 e reestampa o `pattern_digest` de `product_structure_check.py`.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness, para trazer o `product_structure_check.py` novo.
2. Roda `python3 mjrp-scripts/product_structure_check.py .` e, para cada `feature_summary_path` listado, reescreve a referência no `## Summary` como `[[arquivo|palavras comuns]]`, apontando o arquivo exato (o relatório em `reports/…`). Não há o que reescrever nas features fechadas.
3. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0106` e acrescenta `CM-0106` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0106` sai 0. Com um `## Summary` de feature em andamento que cita `` `reports/audits/` ``, o `product_structure_check.py .` imprime o aviso `feature_summary_path` e sai 0; com `[[arquivo|palavras comuns]]`, não avisa.

## Quando não se aplica

Projeto sem Control Center que leia o repositório (o link só abre na tela dele), e projeto `content` ou `meta` sem features: não há `## Summary` a conferir. O refresh leva o sensor do mesmo jeito.
