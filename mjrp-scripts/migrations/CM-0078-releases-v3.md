---
id: CM-0078
item: releases
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0078 · releases@2 → releases@3

## Por que

O modelo `templates/prd.md` da `mjrp-coaching-pm` é fonte do padrão de dois itens: `prd` e `releases`. Ele mudou para a regra «o PRD é a fonte do conteúdo» (a tabela de épicos sem estado, todo requisito embutido; `prd@2`, CM-0077), e a versão do `releases` acompanha a troca do modelo que ele compartilha, como o `design-system` e o `arch` acompanham a deles.

Nasceu de: a decisão do MJRP de 2026-10-19 (o `prd.md` é a fonte do conteúdo), que mexeu no modelo compartilhado. A rota da nota é decisão dele: para o `releases`, que só acompanha o modelo, ele disse «segue com 78» (2026-10-19, relatado pela sessão principal) — a nota em vez do aval `Catalog-editorial:`; não contorna a válvula dele.

## O que muda

- só a fonte do padrão: o `templates/prd.md` ganhou a tabela de épicos sem coluna de estado e a regra de que todo requisito está embutido no PRD.
- **o `check` do item não muda**: é o mesmo da v2 (um `^REL-xx` no `ROADMAP.md`). Um filho que passa na v2 passa na v3.

## O que o filho faz

Nada além de registrar a nota: acrescente `CM-0078` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*. O que o modelo novo pede ao PRD é cobrado pelo item `prd` (CM-0077), não por este.

## Como se confere

`conformance_check.py . --check-note CM-0078` sai 0 e `--gaps` não lista `releases`.

## Quando não se aplica

Nos perfis `content` e `meta`.
