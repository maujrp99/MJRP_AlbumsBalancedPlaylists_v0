---
id: CM-0024
item: adr-names
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-28 · fonte a194e58f2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0024 · adr-names@1 → adr-names@2

## Por que

O `adr-names@1` só conferia a forma do nome (`NNNN-kebab`), não o idioma. No fin-control, `0001-modularizacao-backend-gas.md`, `0002-glossario-nomenclatura-pt-br.md` e `0003-caixinhas-controle-independente.md` passaram no check; o conform registrou a nota como "só registro, sem rodada" e as três ADRs seguiram em português. A auditoria independente do conform (2026-10-17) marcou a nota como **errada**: o check não podia ver o que a regra de nomes pede — o que a máquina lê é inglês.

## O que muda

- o `check` do item continua sendo `name_pattern` sobre `docs/decisions/*.md`, e agora olha também o **idioma**, com três sinais determinísticos, nesta ordem:
  1. uma letra fora do ASCII no nome (um acento);
  2. uma **palavra inteira** da lista `deny_words` — radicais comuns em português sem acento (`modularizacao`, `glossario`, `caixinhas`, `controle`, `planilha`…) e as palavras de função (`da`, `dos`, `para`, `uma`, `como`…; `de` e `sem` ficaram de fora porque também são inglês: `de-risk`, `sem-ver`);
  3. uma palavra que **termina** em `-cao`, `-coes`, `-dade`, `-dades`, `-mento`, `-mentos`, `-ncia`, `-ncias` (a terminação dos substantivos portugueses sem o acento) e é maior que a terminação; a lista `allow_words` (`cacao`, `memento`, `pimento`, `valencia`…) é a exceção, as poucas palavras inglesas que a terminação apanharia por acidente.
- a mensagem do check passa a dizer **qual palavra** acusou o arquivo.
- **Risco de falso positivo, dito:** é uma heurística, não um dicionário. Foi medida contra as 70 ADRs com nome distinto de todos os projetos do MJRP (nenhum nome em inglês foi apanhado) e contra o dicionário inglês do sistema (a terminação só apanha 19 palavras, quase todas raras; as que podem aparecer num título de ADR estão em `allow_words`). O contrário também vale: um nome em português sem nenhuma das palavras ou terminações passa. O que o check não vê, a auditoria independente do conform vê.

## O que o filho faz

1. `python3 mjrp-scripts/conformance_check.py . --gaps` — cada arquivo vem com a palavra que o acusou.
2. A `mjrp-recording-decisions` renomeia cada um com `git mv`, mantendo o número e dando um nome em inglês que diga a decisão; **depois varre o repositório inteiro atrás do nome antigo** (`git grep -n -F "<nome antigo sem .md>"`: `docs/`, `design/`, `src/`, `reports/`, comentários) e corrige cada ponteiro — o nome do arquivo é a única edição que uma ADR aceita. O texto da ADR continua em português.
3. Uma palavra inglesa que o check apanha por engano **não se contorna trocando o nome só para passar**: diga ao MJRP, que decide (a dispensa é dele).
4. Commit por pathspec com entrada no log. Esta nota **nunca** é só registrada quando o item aparece no `--gaps`: o `--gaps` é a prova de que o nome ainda está em português.

Depois de conferir, acrescente `CM-0024` a `conformance.applied` no contrato.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0024` sai 0 e `--gaps` não lista mais `adr-names`.

## Quando não se aplica

Projeto sem `docs/decisions/`. Uma ADR escrita por um terceiro, em outro idioma, que o MJRP decidiu manter: dispensa dele.
