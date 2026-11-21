---
id: CM-0159
item: releases
from: 4
to: 5
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0159 · releases@4 → releases@5

## Por que

O modelo `templates/prd.md` da `mjrp-coaching-pm` é fonte do padrão de dois itens: `prd` e `releases`. Ele passou a seguir a ordem das seis perguntas (`prd@4`, CM-0158, F88), e a versão do `releases` acompanha a troca do modelo que ele compartilha, como na CM-0134.

Nasceu de: o pedido do MJRP de 2026-10-26 («este agora, o modelo depois») que mexeu no modelo compartilhado. A rota da nota segue a da CM-0134, em vez do aval `Catalog-editorial:`, que é dele: decidido pelo agente, revisável pelo MJRP.

## O que muda

- só a fonte do padrão: o `templates/prd.md` agrupa as seções sob as seis perguntas.
- **o `check` do item não muda**: é o mesmo da v4 (um `^REL-xx` no `ROADMAP.md`). Um filho que passa na v4 passa na v5.

## O que o filho faz

Nada além de registrar a nota: acrescente `CM-0159` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*. O que o modelo novo pede ao PRD é cobrado pelo item `prd` (CM-0158), não por este.

## Como se confere

`conformance_check.py . --check-note CM-0159` sai 0 e `--gaps` não lista `releases`.

## Quando não se aplica

Nos perfis `content` e `meta`.
