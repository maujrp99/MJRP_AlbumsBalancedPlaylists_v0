---
id: CM-0056
item: content-map
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0056 · content-map@1 → content-map@2

## Por que

O `CONTENT_MAP.md` de um projeto de conteúdo (taxonomia, pastas, convenção de nomes, schema de frontmatter por tipo) é a estrutura do conteúdo, a lente de arquitetura da informação do desenho, e o item era da `mjrp-pdlc-bootstrap`, que só cria o arquivo vazio. A dona do conteúdo passa a ser a `mjrp-designing-ui`, com o modelo `templates/content-map.md` por fonte do padrão (o mesmo modelo é fonte de `info-arch-sections`: um modelo pode ser fonte de dois itens).

Nasceu de: decisão do MJRP de 2026-10-18 (o dono do conteúdo é a skill do papel; o modelo mora com a dona).

## O que muda

- só o dono (`owner_skill`) e a fonte do padrão: a `mjrp-designing-ui` escreve o `CONTENT_MAP.md`; a bootstrap só cria o arquivo vazio no scaffold. A nota CM-0015 (publicada, não se reescreve) manda criar o arquivo pela bootstrap; o catálogo é quem diz o dono.
- **o `check` do item não muda**: é o mesmo da v1 (o `CONTENT_MAP.md` existe na raiz). Um filho que passa na v1 passa na v2.

## O que o filho faz

1. Se `conformance_check.py . --gaps` **não** lista `content-map`, só registre a nota: acrescente `CM-0056` a `conformance.applied`, sem rodada, como no passo 2 do modo *conform*.
2. Se lista, é a lacuna da v1 e a `mjrp-designing-ui` a trata: escreve o `CONTENT_MAP.md` a partir do conteúdo que já existe (extrai antes de inventar) e o MJRP aprova o mapa antes de produzir em volume.

## Como se confere

`conformance_check.py . --check-note CM-0056` sai 0 e `--gaps` não lista `content-map`.

## Quando não se aplica

Projeto `code-app` ou `meta`.
