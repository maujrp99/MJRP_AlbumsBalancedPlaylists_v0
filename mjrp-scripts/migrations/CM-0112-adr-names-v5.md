---
id: CM-0112
item: adr-names
from: 4
to: 5
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0112 · adr-names@4 → adr-names@5

## Por que

Aceitar uma decisão que emenda ou supera outra escreve na decisão antiga uma linha de aviso (`**Emendada por**: …` ou `**Superada por**: …`), e uma decisão aceita não se edita de outro jeito. No `MJRPpersonal`, a ADR-0005 foi de 5.961 para 6.017 caracteres só por esse aviso, e passou do teto de 6.000 sem que a decisão tivesse crescido. O sensor reprovava a decisão antiga por causa da nova.

## O que muda

- O `adr_header_check.py` não conta, no teto de 6.000 caracteres, as linhas que começam com `**Emendada por**` ou `**Superada por**` (com ou sem `- ` na frente, com os dois-pontos dentro ou fora do negrito). Todo o resto segue contando.
- O catálogo sobe o `adr-names` à versão 5 e reestampa o `pattern_digest` do `adr_header_check.py`.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness, para trazer o `adr_header_check.py` novo.
2. Roda `python3 mjrp-scripts/adr_header_check.py .`. Uma decisão que passava do teto só pelo aviso deixa de ser acusada. **Não reescreva nenhuma decisão** para caber no teto: as aceitas são imutáveis.
3. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0112` e acrescenta `CM-0112` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0112` sai 0, e `adr_header_check.py .` não acusa o teto numa decisão que só o passava pelo aviso de emenda.

## Quando não se aplica

Projeto sem `docs/decisions/`.
