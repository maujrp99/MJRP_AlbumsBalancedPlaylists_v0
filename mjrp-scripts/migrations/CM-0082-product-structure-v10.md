---
id: CM-0082
item: product-structure
from: 9
to: 10
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0082 · product-structure@9 → product-structure@10

## Por que

O `uat@3` (CM-0081, F48) acrescenta a coluna `Reportado por` à tabela do `docs/specs/uat.md`. O leitor do `product_structure_check.py` — espelho do `uat.py` do Control Center — só conhecia os cabeçalhos de sete e de oito colunas: com a coluna nova ele reprovaria o `uat.md` inteiro («cabeçalho da tabela desconhecido»). A coluna em si é julgada pelo `uat_tracks_check.py`, não por este item.

Decidido pelo agente (classe a: o leitor precisa conhecer o formato que o MJRP aprovou; técnico e reversível), revisável pelo MJRP.

## O que muda

- o `product_structure_check.py` aceita também o cabeçalho de nove colunas (`Reportado por` depois de `Reportado em`) e lê a linha sem a coluna. **Só afrouxa**: um filho que passava na v9 passa na v10; nenhuma lacuna nova.

## O que o filho faz

Nada além de registrar a nota: acrescente `CM-0082` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*.

## Como se confere

`conformance_check.py . --check-note CM-0082` sai 0 e `--gaps` não lista `product-structure`.

## Quando não se aplica

Projeto `content` ou `meta` (o harness raiz é `meta`).
