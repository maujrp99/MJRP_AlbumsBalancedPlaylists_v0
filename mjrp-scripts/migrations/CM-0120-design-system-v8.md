---
id: CM-0120
item: design-system
from: 7
to: 8
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0120 · design-system@7 → design-system@8

## Por que

O MJRP quer que todo projeto, o harness e cada filho, tenha o seu design system publicado no Claude (2026-11-06 21:48, depois de ver o «MJRP Jardim» e o «MJRP Professional» que o `MJRPpersonal` criou: «o que ela fez no claude agora, gostaria que todos os projetos criassem e tivessem»; S-215, F200). No Claude, o design system é um artefato do tipo Design System: o livro da marca, os tokens por tema, a tipografia, os componentes com prévia e a capa, uma referência que todo agente lê e que ele navega sem abrir arquivo. O `design-system.md` do repositório continua sendo a fonte; o Claude é o espelho.

## O que muda

- O modelo do `design-system.md` ganha, sob a linha do status, a linha `> **Design system no Claude:** <link> — …`, e o check do item passa a procurá-la.
- A `mjrp-defining-design-systems` ganha o procedimento do espelho: o documento limpo (o superado vai para `## Arquivo`, palavra por palavra), o espelho montado do documento da `main` e nunca do código, um sistema por identidade, com nome que não muda, o check `design_system_mirror_check.py` antes de publicar, o OK do humano antes da primeira publicação, a linha e a entrada no log.
- O modelo ganha também, opcional, a proporção de cor por tema em `## Themes` (HI-08 do cânone): a recomendação com a cor principal, e a medida do aprovado como fato.
- Chega ao filho, com o kernel, o `mjrp-scripts/design_system_mirror_check.py`.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` uma vez, para trazer o check e as páginas do cânone.
2. Chama a `mjrp-defining-design-systems` no procedimento do design system no Claude. Ela monta o espelho fora do repositório, roda `python3 mjrp-scripts/design_system_mirror_check.py docs/specs/design-system.md <pasta do espelho>` até sair 0 e **pergunta ao humano antes de publicar**, dizendo o que sai e para onde.
3. Com o OK dele, publica, escreve a linha `**Design system no Claude:**` sob o status e a entrada no log.
4. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0120`, e acrescenta `CM-0120` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0120` sai 0: o `design-system.md` traz a linha com um link `https://claude.ai/artifact/…`.

## Quando não se aplica

- Projeto sem tela (o item não se aplica a ele).
- Projeto cuja identidade é de outro projeto: escreve o link do sistema do dono, dizendo de quem é a identidade (o Control Center aponta para o «MJRP Harness»).
- Sem o OK do humano para publicar, a nota fica pendente e a lacuna aparece como aviso na carência; dispensá-la é dele.
