---
id: CM-0098
item: product-structure
from: 13
to: 14
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0098 · product-structure@13 → product-structure@14

## Por que

O MJRP criou, em 2026-11-01, uma regra para a pequena mudança de texto e copy: ela dispensa a coluna «Priorizada» e a feature, é feita direto na `main` pelo integrador e vai direto a «Em andamento» (F158, S-208). Uma issue assim não tem feature para citar, e a gramática do `Status` do `uat.md` só aceitava `fixing (<Fxx>)`.

## O que muda

- O leitor do `uat.md` aceita o `fixing` sem feature numa linha de `Tipo` `copy`. Em qualquer outro tipo, esse `Status` segue fora da gramática.
- O padrão do board (`mjrp-scripts/board_defaults.json`) ganha o tipo de registro `copy`, e o board `uat` passa a mostrá-lo.
- O `pre-commit` ganha o `mjrp-scripts/copy_change_check.py`: na linha principal, o commit de uma issue de tipo `copy` só toca `content/copy/*.json`, o `uat.md` e o `docs/log.md`, e dentro do JSON só o `pt` e o `en` de entradas que existem: continuam texto, com os mesmos marcadores, e no máximo 10 entradas por commit. Só uma linha nova nasce `copy`. O salvar da tela, onde houver, só muda o texto, que continua texto; marcador e texto vazio não se conferem nele. Um `--amend` é julgado pelo commit inteiro. Saída 0, 1 e 2, como as outras travas.
- O `uat_tracks_check.py` cobra que a issue de tipo `copy` aberta por um agente suba à trilha do humano (`agente · prioridade: humano — ver: <motivo>`): quem dá o OK dela é sempre ele.
- **Só afrouxa para o `uat.md` que já existe**: nenhuma linha de hoje tem o `Tipo` `copy`, então um filho que passava na v13 passa na v14.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz os scripts, o `pre-commit` e o padrão do board novos.
2. Se o `docs/specs/board.json` do projeto declara um board com o id `uat` (ou outro que filtra as issues por tipo), a `mjrp-configuring-boards` acrescenta `copy` à lista `filter.types` dele. Sem isso, a issue de tipo `copy` não aparece nesse board. Sem o board declarado, o padrão já traz o tipo.
3. O projeto cujo texto de tela não mora em `content/copy/*.json`, em páginas com o objeto `texts`, não tem o que fazer direto na `main`: a trava não julga um arquivo de lá que não tenha essa forma, e a mudança de texto segue o caminho normal, por um ramo.
4. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0098` e acrescenta `CM-0098` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0098` sai 0, e `--gaps` não lista `product-structure`. Na `main` do filho, um commit que muda uma linha de `Tipo` `copy` e também outro arquivo é recusado pelo `pre-commit`, e o que muda mais de 10 entradas, ou um `pt` que deixa de ser texto, também.

## Quando não se aplica

Projeto `content` ou `meta` (o harness raiz é `meta`).
