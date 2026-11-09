---
id: CM-0047
item: vision
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0047 · vision@1 → vision@2

## Por que

O conteúdo de o `VISION.md` é de quem escreve aquele papel, não de quem cria o arquivo vazio. A `mjrp-pdlc-bootstrap` cria o esqueleto do projeto e continua dona do contrato e do modo *conform*; o dono do conteúdo, do modelo e do guia é `mjrp-coaching-pm`. Um filho que lia «dono: `mjrp-pdlc-bootstrap`» passou a ler o dono certo.

Nasceu de: decisão do MJRP de 2026-10-17 23:02 (a pergunta «desde quando bootstrap é dono de artefato de produto, do conteúdo dele?»): quem cria o esqueleto (`mjrp-pdlc-bootstrap`) não é dono do conteúdo; o dono é a skill do papel, e o modelo e o guia moram com o dono.

## O que muda

- só o dono e o caminho de origem do padrão: o dono do item passa de `mjrp-pdlc-bootstrap` para `mjrp-coaching-pm`; o modelo `templates/vision.md` e o guia `reference/vision-guide.md` foram com ela.
- **o `check` do item não muda**: é o mesmo da v1. Um filho que passa na v1 passa na v2.

## O que o filho faz

1. Se `conformance_check.py . --gaps` **não** lista `vision`, não há nada a fazer além de registrar a nota: acrescente `CM-0047` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*.
2. Se lista, é uma lacuna da forma que a v1 já cobrava: quem a trata é a skill dona, `mjrp-coaching-pm`, com o modelo e o guia dela — o conteúdo que o projeto nunca disse é perguntado ao MJRP, um campo por vez, com a fonte, nunca rascunhado pelo agente para ele aprovar clicando.

## Como se confere

`conformance_check.py . --check-note CM-0047` sai 0 e `--gaps` não lista `vision`.

## Quando não se aplica

Nos perfis `content` e `meta`.
