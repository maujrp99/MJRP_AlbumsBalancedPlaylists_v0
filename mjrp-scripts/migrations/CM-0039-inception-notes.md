---
id: CM-0039
item: inception-notes
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0039 · inception-notes@0 → inception-notes@1

## Por que

A Inception é a conversa do MJRP com a tela: cada rodada mostra um protótipo, ele reage, e o que a tela revelou — o valor, a usabilidade, a viabilidade, os requisitos captados, as perguntas, os riscos, as decisões dele — vira uma seção das `inception-notes.md`, que a `mjrp-coaching-pm` lê para enquadrar o problema. O modelo `templates/inception-notes.md` da `mjrp-designing-ui` fixa a seção de uma rodada; o item guarda que o arquivo, quando existe, é feito de rodadas.

Nasceu de: decisão do MJRP de 2026-10-16 11:27 (fila `awaiting_item` do catálogo, commit `85cd8f7e`): «Artefato para nosso PDLC.»

## O que muda

- quando o projeto **tem** `docs/specs/inception-notes.md`: ao menos uma seção `## Rodada N · AAAA-MM-DD HH:MM · design/inception/<nome>-vN.html` (o check lê o título «Rodada», em qualquer caixa).

## O que o filho faz

1. `mjrp-designing-ui` (modo explore): se o arquivo tem notas sem o título de rodada, retitule cada bloco no lugar (`## Rodada N · data hora · protótipo`), com a data e o protótipo que o próprio bloco já cita; **as palavras do humano ficam como estão**. Não reescreva, não resuma, não ponha na boca dele o que ele não disse.
2. Um projeto sem `inception-notes.md` (sem Inception, ou Inception pulada — o modo é «ligado por padrão, pode ser pulado») não é cobrado: o item só vale onde o arquivo existe. Quem quiser registrar rodadas passadas as escreve **com o MJRP**, da memória dele, não do agente.
3. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0039` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `inception-notes`.

## Quando não se aplica

Projeto sem `docs/specs/inception-notes.md`.
