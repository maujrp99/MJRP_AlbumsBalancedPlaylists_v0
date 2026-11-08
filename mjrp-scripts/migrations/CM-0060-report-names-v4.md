---
id: CM-0060
item: report-names
from: 3
to: 4
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0060 · report-names@3 → report-names@4

## Por que

**O `type:` sozinho quebrou a tela.** O conform do `pedroso-incorp` (2026-10-18) seguiu o aviso do `report_types_check` e pôs só `type: ux-audit` em 17 relatórios antigos de `reports/audits/` (commit `53499cd` de lá). O leitor de críticas do Control Center exige `status:` assim que um tipo de crítica é declarado; os 17 passaram a aparecer como «Não deu para ler as críticas… formato desconhecido» em «Pendente com o humano». Antes da edição não tinham cabeçalho e eram lidos pelo nome. Dois juízes se contradiziam: um pedia o `type:`, a tela reprovava o arquivo por faltar o `status:`. O mesmo vale para o fin-control (9 críticas com o tipo e sem o `status:`).

Nasceu de: o incidente dos 17 relatórios do `pedroso-incorp` (2026-10-18), registrado no `harness-kaizen`.

## O que muda

- **Os tipos de crítica trazem o campo que a tela exige.** Na lista (`report_types.json`), `ux-audit` e `architecture-audit` declaram `required_fields.status` com as palavras que a tela lê, por significado: `open`/`aberta`/`aberto`, `closed`/`fechada`/`fechado`/`resolved`, `superseded`/`substituida`/`substituido` (a tela ignora acento e caixa). Um teste do Control Center confere que a lista e a tela leem as mesmas palavras.
- **Declarar o tipo sem o campo é erro em qualquer data**, antigo inclusive: a tela recusa o arquivo. O mesmo para um `status:` com palavra que a tela não lê.
- **O aviso do relatório antigo sem tipo diz que o tipo de crítica traz também o `status:`**, e como lê-lo do veredito do relatório: `closed` se passa, sem P0 aberto e nada esperando o MJRP; `open` se não; `superseded` se um mais novo o substituiu.
- **O nome diz crítica, o cabeçalho não tem `type:`:** um arquivo com `ux-audit` ou `architecture-audit` no nome e cabeçalho sem `type:` também é erro em qualquer data — a tela o lê como crítica e o recusa.
- Nada mais muda: as cláusulas do item, o corte de data do tipo e a regra de nome são os da v3.

## O que o filho faz

1. `python3 mjrp-scripts/report_types_check.py .` — as críticas que declaram o tipo sem `status:` aparecem como erro.
2. Para cada uma, **leia o veredito** do relatório e some `status: closed|open|superseded` ao cabeçalho (a `mjrp-syncing-docs` executa; o conteúdo do relatório não se toca). **Dar o `type:` a uma crítica antiga é dar também o `status:`** — nunca um sem o outro. Na dúvida sobre o veredito (relatório sem veredito claro), escreva **`status: open`** — é a palavra segura, a tela lê o arquivo e ele segue visível como crítica aberta — e **pergunte ao MJRP à parte** (entrada no log que cita o arquivo; se quiser, registre-o em `conformance.asked`). O `asked` não solta o erro de um tipo de crítica sem `status:`: o `status:` entra na mesma edição, com `open` na dúvida.
3. Os avisos de crítica antiga sem tipo: dê o `type:` **e** o `status:` na mesma edição.
4. Acrescente `CM-0060` a `conformance.applied` depois do `--check-note CM-0060` passar.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0060` sai 0 (nenhum erro do `report_types_check`; cada aviso resolvido ou registrado em `conformance.asked`, com a entrada do log que o cita).

## Quando não se aplica

Projeto sem `reports/`. Um relatório de outro autor, em outro formato (HTML, PDF), não leva cabeçalho: a checagem só lê `.md`.
