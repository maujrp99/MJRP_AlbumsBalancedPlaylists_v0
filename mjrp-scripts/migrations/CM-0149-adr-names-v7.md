---
id: CM-0149
item: adr-names
from: 6
to: 7
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0149 · adr-names@6 → adr-names@7

## Por que

Duas ADRs do Control Center (a CC-ADR-0044, com 10.288 caracteres, e a CC-ADR-0055, com 8.594) foram aceitas pelo MJRP acima do teto de 6.000 e ficaram reprovando o teste de compatibilidade das ADRs (UAT-599, F289). ADR aceita não se edita, então o texto não pode baixar.

## O que muda

- O `adr_header_check.py` ganha `OVER_CEILING_ACCEPTED`, uma lista por nome de arquivo com o tamanho congelado: a ADR da lista passa até esse tamanho e reprova acima. O teto de 6.000 e o desconto do aviso não mudam, e ADR nova é julgada contra os 6.000. A lista só traz as duas do Control Center, e o filho não tem nenhuma delas.
- O catálogo sobe o `adr-names` à versão 7 e reestampa o `pattern_digest`.

## O que o filho faz

1. `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` traz o `adr_header_check.py` novo.
2. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0149` e acrescenta `CM-0149` a `conformance.applied`. Nada na decisão do filho muda.

## Como se confere

`conformance_check.py . --check-note CM-0149` sai 0, e `adr_header_check.py .` julga como antes.

## Quando não se aplica

Projeto sem `docs/decisions/`.
