---
id: CM-0017
item: roadmap
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0017 · roadmap@2 → roadmap@3

## Por que

O check do `roadmap@2` só reconhecia o resultado ancorado como `^OUT-01`. O projeto aninhado no repositório do harness leva o `id_prefix` do contrato nas sequências que o projeto de cima também usa (ADR-0020 D.3): o `ROADMAP.md` do Control Center ancora `^CC-OUT-01` e `^CC-OUT-02`, o sensor do grafo os lê, e o catálogo reclamava "sem resultados `^OUT-xx` ancorados" de um roadmap correto — um aviso que viraria erro ao fim da carência.

Nasceu de: reconferência independente do ramo de integração do ADR-0020 (2026-10-13, achado H-1).

## O que muda

- a âncora do resultado, no fim da linha da medida, aceita o prefixo do projeto: `^OUT-01` ou `^<PREFIXO>-OUT-01` (letras maiúsculas, o `id_prefix` do contrato);
- nada fica mais exigente: todo roadmap conforme à versão 2 já é conforme à 3.

## O que o filho faz

1. Nada, se o `ROADMAP.md` já passa. Quem declarou `id_prefix` no contrato e renomeou os resultados para `^<PREFIXO>-OUT-xx` passa a ser lido como conforme.
2. Acrescente `CM-0017` a `conformance.applied` no contrato, se quiser registrar a nota.

## Como se confere

`conformance_check.py . --gaps` não lista `roadmap` para um `ROADMAP.md` com `^CC-OUT-01` ancorado.

## Quando não se aplica

Quando o projeto não tem `id_prefix`: a âncora segue `^OUT-xx`, como na versão 2.
