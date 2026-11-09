---
id: CM-0059
item: report-names
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0059 · report-names@2 → report-names@3

## Por que

Dois furos que o conform do `pedroso-incorp` (2026-10-18) achou na `report-names@2` (CM-0043):

1. **A pasta `reports/harness-feedback/` saía da regra inteira.** Ela dispensa o `type:` (o tema vem da pasta), mas isso tirava também o *nome*: os quatro pareceres do filho tinham nome em português e sem o segmento do projeto, e a forma passava.
2. **A CM-0043 se fechava com o trabalho por fazer.** Os 19 avisos do `report_types_check` são o trabalho que a nota manda o conform fazer, e o `--check-note CM-0043` aceitava o registro «só registro» com eles abertos.

Nasceu de: o feedback do `pedroso-incorp` (pontos 6 e 7 da auditoria de 2026-10-18), registrado no `harness-kaizen`.

## O que muda

- **O nome em `reports/harness-feedback/` segue a regra.** Sem `type:`, mas `AAAA-MM-DD-<projeto>-<assunto>.md`, em minúsculas ASCII e em inglês; o primeiro termo depois da data é o do projeto (a pasta sem `mjrp-`; uma pasta de trabalho do git resolve para o repositório). **Sempre aviso, em qualquer data**: a regra nasceu em 2026-10-18, depois de pareceres escritos e triados no harness com o nome antigo, e erro que o filho não solta sozinho não serve (o `asked` só solta aviso). Um parecer que o harness já triou (o mesmo nome na caixa de entrada dele) não se renomeia sozinho: renomear quebra a triagem, e a pergunta é do MJRP — que o aviso leva à nota (`--check-note`) e ao `conformance.asked`.
- **A nota só se aplica sem aviso em aberto.** `conformance_check.py . --check-note CM-0043` (e a `CM-0059`, a `CM-0060`) reprova enquanto o `report_types_check` tiver um aviso que o conform não resolveu. Cada aviso que sobra vira **pergunta ao MJRP**, registrada no contrato — uma entrada **por arquivo**, que serve a todas as notas que dividem o sensor:

  ```yaml
  conformance:
    asked:
      - {path: reports/harness-feedback/2026-09-28-padrao-formatacao.md, asked_at: "2026-10-18 10:30"}
  ```

  O `asked_at` é a hora de uma entrada do `docs/log.md` do projeto (`## [AAAA-MM-DD HH:MM] …`) **cujo texto cita o arquivo**: a pergunta está registrada onde o MJRP lê, e o agente não a declara sozinho (a entrada sem `asked_at`, ou cujo log não a tem, **reprova**). O comando conta as registradas e passa; a entrada de um arquivo que já não avisa sai como `[obsoleta]` (tire-a do contrato quando o MJRP responder). O doctor (I6) lista as perguntas em aberto numa linha só por projeto. Um erro do `report_types_check` (o tipo de crítica sem `status:`) **não** se solta com `asked`: só se corrige.
- A cláusula de nome de `reports/audits/` e a cláusula `script` do item são as da v2.

## O que o filho faz

1. `python3 mjrp-scripts/report_types_check.py .` — os erros e os avisos, inclusive os de nome em `reports/harness-feedback/`.
2. Parecer em `reports/harness-feedback/` com nome fora da regra: se o harness ainda não o triou, renomeie (`git mv`, por pathspec); se já triou, **não renomeie** — pergunte ao MJRP (entrada no log que cita o arquivo) e registre-o em `conformance.asked`.
3. Aviso que nenhum tipo resolve (relatório sem tipo que sirva): pergunta ao MJRP com as opções (entrada no log que cita o arquivo) e o arquivo em `conformance.asked` (uma entrada serve às três notas). Acrescente as notas a `conformance.applied` só depois do `--check-note` passar.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0059` sai 0 (sem erro e com cada aviso resolvido ou registrado em `conformance.asked` com a entrada do log); o mesmo vale para `--check-note CM-0043`.

## Quando não se aplica

Projeto sem `reports/`. Um relatório de outro autor, em outro formato (HTML, PDF), não leva cabeçalho: a checagem só lê `.md`.
