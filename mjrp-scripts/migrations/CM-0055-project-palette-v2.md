---
id: CM-0055
item: project-palette
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0055 · project-palette@1 → project-palette@2

## Por que

A escolha do par de paletas que identifica o projeto no portfólio é uma decisão de design, e o item era da `mjrp-pdlc-bootstrap`, que cria o contrato mas não decide cor. A dona do conteúdo passa a ser a `mjrp-defining-design-systems`; a bootstrap só escreve a linha no contrato (e continua dona do contrato). A fonte do padrão passa do modelo do contrato para a regra da paleta na skill dona (a seção «Procedure — the palette question»).

Nasceu de: decisão do MJRP de 2026-10-18 (o dono do conteúdo é a skill do papel; o modelo mora com a dona).

## O que muda

- só o dono (`owner_skill`) e a fonte do padrão: a `mjrp-defining-design-systems` faz a pergunta do par e a bootstrap escreve a linha. A nota CM-0018 (publicada, não se reescreve) manda a pergunta para a `mjrp-defining-design-systems`; o catálogo é quem diz o dono.
- **o `check` do item não muda**: é o mesmo da v1 (o contrato tem a chave `project_palette`). Um filho que passa na v1 passa na v2.

## O que o filho faz

1. Se `conformance_check.py . --gaps` **não** lista `project-palette`, só registre a nota: acrescente `CM-0055` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*.
2. Se lista, é a lacuna da v1 e a `mjrp-defining-design-systems` a trata: lê a biblioteca de paletas, pergunta ao MJRP qual par identifica o projeto (com opções, sem assumir) e a bootstrap escreve `project_palette` no `.mjrp-project.yml`. O item só avisa; o projeto que prefere a faixa padrão pode seguir sem o campo.

## Como se confere

`conformance_check.py . --check-note CM-0055` sai 0 e `--gaps` não lista `project-palette` (ou lista como aviso, se o MJRP deixou a faixa padrão).

## Quando não se aplica

Nunca: todo projeto com contrato aparece no Control Center e precisa de cor (ou da faixa padrão).
