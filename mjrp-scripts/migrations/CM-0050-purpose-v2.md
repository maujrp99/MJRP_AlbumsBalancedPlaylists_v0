---
id: CM-0050
item: purpose
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0050 · purpose@1 → purpose@2

## Por que

O conteúdo de o propósito declarado (`VISION.md` ou `Core/PROJECT_CONTEXT.md`) é de quem escreve aquele papel, não de quem cria o arquivo vazio. A `mjrp-pdlc-bootstrap` cria o esqueleto do projeto e continua dona do contrato e do modo *conform*; o dono do conteúdo, do modelo e do guia é `mjrp-coaching-pm`. Um filho que lia «dono: `mjrp-pdlc-bootstrap`» passou a ler o dono certo.

Nasceu de: decisão do MJRP de 2026-10-17 23:02 (a pergunta «desde quando bootstrap é dono de artefato de produto, do conteúdo dele?»): quem cria o esqueleto (`mjrp-pdlc-bootstrap`) não é dono do conteúdo; o dono é a skill do papel, e o modelo e o guia moram com o dono.

## O que muda

- só o dono e o caminho de origem do padrão: o dono do item passa de `mjrp-pdlc-bootstrap` para `mjrp-coaching-pm`; o guia `reference/vision-guide.md` foi com ela. A página `vision-document.md`, fonte do padrão do item, passou a dizer que o modelo e o guia são da `mjrp-coaching-pm` (só a redação).
- **o `check` do item não muda**: é o mesmo da v1. Um filho que passa na v1 passa na v2.

## O que o filho faz

1. Se `conformance_check.py . --gaps` **não** lista `purpose`, não há nada a fazer além de registrar a nota: acrescente `CM-0050` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*.
2. Se lista, é uma lacuna da forma que a v1 já cobrava: quem a trata é a skill dona, `mjrp-coaching-pm`, com o modelo e o guia dela — o conteúdo que o projeto nunca disse é perguntado ao MJRP, um campo por vez, com a fonte, nunca rascunhado pelo agente para ele aprovar clicando.

## Como se confere

`conformance_check.py . --check-note CM-0050` sai 0 e `--gaps` não lista `purpose`.

## Quando não se aplica

No perfil `content` e no `meta`.
