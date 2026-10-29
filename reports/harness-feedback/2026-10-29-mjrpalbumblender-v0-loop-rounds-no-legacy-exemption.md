# Parecer do v0 para o harness: tasks de histórico não têm como cumprir `rounds::`

Projeto: MJRP_AlbumsBalancedPlaylists_v0 (brownfield, rodada de correção do conform, 2026-10-29). Origem: a pergunta P-36 do rascunho de perguntas, que a juíza do conform reclassificou (pergunta evitável e regra dobrada): lacuna de check se reporta ao harness, não se pergunta ao MJRP do v0.

## Fato

- O `mjrp-scripts/loop.py --check-tasks` reprova task fechada sem `rounds:: N` (o número de rodadas de verificação que o laço do harness fez até a task fechar).
- O v0 tem 18 features de histórico (F01 a F18) com 61 tasks fechadas, reconstituídas no conform de 2026-10-28 a partir de commits anteriores ao contrato (`54fd54c`). Nenhuma foi feita no laço do harness, então o número real de rodadas não existe, e escrever `rounds:: 1` falsificaria a medida.
- Hoje nada roda o `--check-tasks` sobre features `lane: standard`, então o conform passa; mas a regra existe e o artefato diverge dela.

## O que o v0 fez (a regra vale)

A regra não foi dobrada: as 61 tasks seguem sem `rounds::` e a pendência está registrada como issue de UAT na trilha do agente (UAT-29, `docs/specs/uat.md`), com a regra como `violates::`. Nenhuma emenda da regra foi pedida.

## Proposta ao harness (decisão do harness)

Uma de duas, a escolher pelo dono do harness: (1) o `--check-tasks` aceita uma marca de histórico (por exemplo `rounds:: n/a (histórico anterior ao harness)`) para task de feature reconstituída de commits anteriores ao contrato, ligada à regra do MJRP de 2026-10-18; ou (2) o conform de brownfield diz, na referência `legacy-history.md`, o que escrever no lugar de `rounds::` em task de histórico. Enquanto isso, o v0 não escreve número inventado.
