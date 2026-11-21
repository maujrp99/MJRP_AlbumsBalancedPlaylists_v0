---
id: CM-0031
item: behavior
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0031 · behavior@0 → behavior@1

## Por que

Todo projeto tem superfície que não é tela: a saída de um comando, um código de saída, um arquivo gerado, a resposta de uma API, o que um agente faz. O `behavior.md` é onde essa superfície vira estado observável com block ID, e é para ele que um requisito sem tela aponta (`points_to`). O `new_project.py` o escreve no nascimento; um filho adotado depois, ou que o perdeu, deixa os requisitos sem onde apontar.

Nasceu de: decisão do MJRP de 2026-10-16 11:27 (fila `awaiting_item` do catálogo, commit `85cd8f7e`): «Artefato para o nosso harness.»

## O que muda

- `docs/specs/behavior.md`, aberto pelo título `# Behavior` (ou `# Comportamento…`), com uma seção por superfície e cada estado como item de lista terminado em `^block-id`, na forma de `templates/behavior.md`.

## O que o filho faz

1. `mjrp-pdlc-bootstrap` (modo conform): se o arquivo **não existe**, crie-o do modelo `templates/behavior.md`. Os estados vêm do que o projeto **já** produz — leia o código e os testes (a saída de cada comando, os códigos de saída, os arquivos gerados) e os requisitos que apontam para `behavior`; liste cada estado numa frase, com onde se vê.
2. Um estado só entra quando os exemplos que ele mostra foram **julgados pelo humano**: se os exemplos são novos, proponha-os ao MJRP em vez de os dar por julgados; o que o projeto já registrou como julgado (UAT, log) o agente copia, com a fonte.
3. Se o arquivo **existe com outro título**, ajuste só o título; os estados e os block IDs já escritos não mudam (os requisitos apontam para eles).
4. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0031` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `behavior`; `conformance_check.py . --check-note CM-0031` sai 0. O sensor do grafo de requisitos (`requirements_graph_check.py`) confere os block IDs que os requisitos citam.

## Quando não se aplica

Projeto `content` ou `meta`.
