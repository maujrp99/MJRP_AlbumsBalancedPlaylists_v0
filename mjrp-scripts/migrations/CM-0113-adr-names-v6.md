---
id: CM-0113
item: adr-names
from: 5
to: 6
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0113 · adr-names@5 → adr-names@6

## Por que

A `CM-0112` isentou do teto de 6.000 caracteres as linhas de aviso (`**Emendada por**` e `**Superada por**`), mas qualquer linha que começasse pelo rótulo saía da conta, de qualquer tamanho: 20.000 caracteres de texto da decisão passavam atrás de um rótulo. Na reconferência da F188, o primeiro conserto limitou cada linha ao ponteiro (o rótulo, o id da ADR e a data, em até 1.500 caracteres), e a segunda passada achou o furo que sobrou: o limite era por linha, sem teto no total, e 40 linhas na forma do aviso escondiam 60.040 caracteres.

## O que muda

- O `adr_header_check.py` só desconta do teto de 6.000 caracteres a linha na forma do **ponteiro**: o rótulo (`**Emendada por**:` ou `- **Emendada por:**`, o mesmo com `Superada por`), o id da ADR (com link ou sem) e uma data, em até 1.500 caracteres por linha. Fora dessa forma, a linha conta inteira.
- O desconto soma, no máximo, 4.000 caracteres por ADR. O que os ponteiros somarem acima disso conta como qualquer outro texto. As ADRs reais somam, no máximo, 3.101 caracteres de aviso (9 linhas), então nenhuma real é afetada.
- A mensagem do teto diz quantos caracteres foram descontados e os dois limites.
- O catálogo sobe o `adr-names` à versão 6 e reestampa o `pattern_digest` do `adr_header_check.py`.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness, para trazer o `adr_header_check.py` novo.
2. Roda `python3 mjrp-scripts/adr_header_check.py .`. Uma decisão que só passava do teto por avisos além do ponteiro (ou por mais de 4.000 caracteres de aviso) passa a ser acusada. **Não reescreva nenhuma decisão aceita**: ela é imutável; se for o caso, o texto extra era decisão e a emenda é uma ADR nova.
3. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0113` e acrescenta `CM-0113` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0113` sai 0, e `adr_header_check.py .` não acusa o teto numa decisão cujos únicos acréscimos são ponteiros de até 1.500 caracteres, somando até 4.000.

## Quando não se aplica

Projeto sem `docs/decisions/`.
