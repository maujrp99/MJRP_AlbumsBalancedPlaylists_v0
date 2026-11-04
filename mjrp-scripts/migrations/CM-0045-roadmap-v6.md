---
id: CM-0045
item: roadmap
from: 5
to: 6
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0045 · roadmap@5 → roadmap@6

## Por que

O conteúdo de o `ROADMAP.md` é de quem escreve aquele papel, não de quem cria o arquivo vazio. A `mjrp-pdlc-bootstrap` cria o esqueleto do projeto e continua dona do contrato e do modo *conform*; o dono do conteúdo, do modelo e do guia é `mjrp-coaching-pm (que já era a dona)`. Um filho que lia «dono: `mjrp-pdlc-bootstrap`» passou a ler o dono certo.

Nasceu de: decisão do MJRP de 2026-10-17 23:02 (a pergunta «desde quando bootstrap é dono de artefato de produto, do conteúdo dele?»): quem cria o esqueleto (`mjrp-pdlc-bootstrap`) não é dono do conteúdo; o dono é a skill do papel, e o modelo e o guia moram com o dono.

## O que muda

- só o dono e o caminho de origem do padrão: o modelo `templates/roadmap.md` saiu da pasta da `mjrp-pdlc-bootstrap` e mora agora na `mjrp-coaching-pm`.
- **o `check` do item não muda**: é o mesmo da v5. Um filho que passa na v5 passa na v6.

## O que o filho faz

1. Se `conformance_check.py . --gaps` **não** lista `roadmap`, não há nada a fazer além de registrar a nota: acrescente `CM-0045` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*.
2. Se lista, é uma lacuna da forma que a v5 já cobrava: quem a trata é a skill dona, `mjrp-coaching-pm (que já era a dona)`, com o modelo e o guia dela — o conteúdo que o projeto nunca disse é perguntado ao MJRP, um campo por vez, com a fonte, nunca rascunhado pelo agente para ele aprovar clicando.

## Como se confere

`conformance_check.py . --check-note CM-0045` sai 0 e `--gaps` não lista `roadmap`.

## Quando não se aplica

Nos perfis `content` e `meta`.
