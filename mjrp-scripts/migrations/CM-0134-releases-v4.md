---
id: CM-0134
item: releases
from: 3
to: 4
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0134 · releases@3 → releases@4

## Por que

O modelo `templates/prd.md` da `mjrp-coaching-pm` é fonte do padrão de dois itens: `prd` e `releases`. Ele passou a abrir com a seção `## O que é`, a narrativa do produto (`prd@3`, CM-0133, F211), e a versão do `releases` acompanha a troca do modelo que ele compartilha, como na CM-0078.

Nasceu de: o pedido do MJRP de 2026-11-07 (todo PRD abre com a narrativa do produto), que mexeu no modelo compartilhado. A rota da nota segue a que o MJRP escolheu para o mesmo caso em 2026-10-19 (CM-0078: «segue com 78»), em vez do aval `Catalog-editorial:`, que é dele: decidido pelo agente, revisável pelo MJRP.

## O que muda

- só a fonte do padrão: o `templates/prd.md` abre com `## O que é`.
- **o `check` do item não muda**: é o mesmo da v3 (um `^REL-xx` no `ROADMAP.md`). Um filho que passa na v3 passa na v4.

## O que o filho faz

Nada além de registrar a nota: acrescente `CM-0134` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*. O que o modelo novo pede ao PRD é cobrado pelo item `prd` (CM-0133), não por este.

## Como se confere

`conformance_check.py . --check-note CM-0134` sai 0 e `--gaps` não lista `releases`.

## Quando não se aplica

Nos perfis `content` e `meta`.
