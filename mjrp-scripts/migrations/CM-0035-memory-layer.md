---
id: CM-0035
item: memory-layer
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0035 · memory-layer@0 → memory-layer@1

## Por que

A sessão seguinte começa pelo `MEMORY.md` (`## Now`, em quatro blocos) e consulta o `docs/log.md` por data. Os modelos da `mjrp-saving-context` (`now.md`, `session-entry.md`, `retroactive-entry.md`) e o da `mjrp-debugging` (`log-entry.md`) fixam a forma dos dois — e o brief aprovado também mora ali: a regra 9 da `mjrp-structuring-requests` o manda para o `docs/log.md` como uma entrada (`brief.md` é o molde da conversa, a entrada é o que o filho guarda); o doctor (F1) e o hook `commit-msg` a cobram de dentro, mas só depois de o projeto ter a camada. O item põe a camada no catálogo: sem o `## Now` nos quatro blocos e sem uma entrada de log no formato do harness, a retomada de sessão não acha onde parou.

Nasceu de: decisão do MJRP de 2026-10-16 11:27 (fila `awaiting_item` do catálogo, commit `85cd8f7e`): «Artefato do nosso harness.» (now, retroactive-entry, session-entry, brief) · «Artefato para nosso PDLC.» (log-entry).

## O que muda

- `MEMORY.md` com a seção `## Now` e, nela, os quatro blocos rotulados `**Where the Work Stopped.**`, `**Pending on Agent.**`, `**Pending on Human.**` e `**Do Not Forget.**` (modelo `now.md`);
- `docs/log.md` com ao menos uma entrada `## [AAAA-MM-DD HH:MM] <tipo> — <título>`, de um dos tipos `decision`, `session`, `inventory`, `ingest`, `harness-feedback`, `review` (modelos `session-entry.md`, `retroactive-entry.md` e `log-entry.md`); o brief aprovado é uma dessas entradas (tipo `decision`), com a decisão na `## History` da página do assunto — o check só confere que o log tem entradas na forma, o resto é a regra 9 da `mjrp-structuring-requests`.

## O que o filho faz

1. `mjrp-saving-context`: se o `MEMORY.md` não tem o `## Now`, escreva-o do modelo `templates/now.md` **a partir do estado real** do projeto (o `git log`, o que a última entrada do log diz, o que está aberto), cada bloco com a data; o que depende do MJRP vai em `Pending on Human`, perguntado, nunca suposto.
2. Se o `docs/log.md` não existe ou não tem entrada no formato, crie-o com o cabeçalho do `new_project.py` e acrescente uma entrada **retroativa** (`templates/retroactive-entry.md`, tipo `session`) que diga de onde a informação veio; a hora vem do `TZ=America/Sao_Paulo date`, nunca estimada. Não invente decisões que o projeto não registrou.
3. Um `MEMORY.md` que já tem os blocos sob outro rótulo é ajustado no lugar (só o rótulo); o texto fica.
4. Commit por pathspec com entrada no log.

Depois de conferir, acrescente `CM-0035` a `conformance.applied` no contrato.

## Como se confere

`conformance_check.py . --gaps` não lista mais `memory-layer`; o F1 do doctor segue verde.

## Quando não se aplica

Projeto `content` (a memória dele tem outro desenho) e `meta`.
