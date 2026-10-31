---
id: CM-0027
item: product-structure
from: 4
to: 5
---
<!-- cópia carimbada do MJRP Harness · versão 2026-10-30 · fonte 9dc987dce · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0027 · product-structure@4 → product-structure@5

## Por que

A auditoria independente do conform do fin-control (2026-10-17) achou notas registradas como aplicadas que **só passavam pela forma**: a `uat@3` com os rótulos postos sobre o texto antigo (código e nome de função em «O que acontece», um «Corrigido: 14 funções renomeadas…» em «O que deveria acontecer») e nenhuma issue com `**Aberta por:** agente (…)` — cerca de 38 achadas por juiz, reconferência ou crítica apareciam como abertas pelo MJRP; um resultado com 6 de 6 stories feitas parado em Now; uma feature (a F01) com o MVP inteiro, 39 stories. O check media a forma; o que faltava era visível ao leitor, não ao padrão.

## O que muda

- o `product_structure_check.py` ganha um **canal de avisos**: julgamentos de conteúdo que um padrão só aproxima. Eles saem depois das lacunas (`[aviso]`), em `--json` sob `warnings`, cada um com `code` estável, e **nunca mudam o exit code** — o item passa ou reprova exatamente como na v4. Quem os lê é o conform e, no fim, a auditoria de agente separado (`mjrp-pdlc-bootstrap`, `reference/conform-mode.md` e `reference/conformance-audit-template.md`);
- os avisos, por área:
  - **resultado** — `outcome_no_problem` e `outcome_no_who` (o resultado sem `- **Problema:**` / `- **Quem sente:**`, que a tela mostra vazios; a exigência no nível do arquivo é do `roadmap@4`, CM-0025);
  - **ciclo do resultado** (Later → Next → Now → Now «em monitoramento» → Alcançados; `pdlc-loops` § 7) — `outcome_done_not_achieved` (stories todas feitas, segue em Now sem `achieved:: AAAA-MM-DD`: está em monitoramento, e **só o MJRP** marca alcançado), `outcome_achieved_in_now`, `outcome_achieved_incomplete` (alcançado sem a data, o `- **Valor medido:**` ou o `- **Aprendizado:**`) e `now_too_many` (mais de 5 resultados em curso em Now; «em monitoramento» não conta);
  - **tamanho da feature** — `feature_many_stories` (mais de 8 stories), `feature_many_epics` (stories de 3 ou mais épicos), `feature_many_tasks` (mais de 12 tasks). A definição: *a menor fatia vertical que entrega valor observável a quem usa, cabe numa rodada de execução e verificação e se confirma com uma verificação só*. É sinal, não limite: partir é decisão do humano;
  - **descrição da issue de UAT** — `uat_issue_code_in_plain_part` (nome de função, de arquivo, `snake_case`/`camelCase` ou trecho de código em «O que acontece» ou «O que deveria acontecer»), `uat_issue_fix_report` («Corrigido:» onde vai a expectativa) e `uat_issue_opened_by_missing` (a evidência cita juiz, reconferência, crítica ou auditoria e a issue não tem `**Aberta por:** agente (<quem>)`);
- uma única mudança no que passa: um resultado sob `## Alcançados` deixa de ser «sem horizonte» (`outcome_no_horizon`). Nada fica mais exigente.

## O que o filho faz

1. `python3 mjrp-scripts/product_structure_check.py .` — sai 0 como na v4 e lista os avisos. Cada aviso é uma **pergunta de conteúdo** para quem fez o trabalho e para o auditor, não uma lacuna a calar:
   - **issue de UAT** — a `mjrp-specifying-sdd-artifacts` reescreve a descrição **separando o conteúdo de verdade** (o que a pessoa vê em «O que acontece», o que se espera em «O que deveria acontecer», o nome técnico em «Evidência» ou «Causa»; o relato do que foi feito vai para a linha do Status), e põe `**Aberta por:** agente (<quem>)` em toda issue que um juiz, uma reconferência, uma crítica ou um verificador abriu — quem abriu **não se adivinha**: o log, o relatório citado ou o humano dizem (`reference/uat-issue-description.md`);
   - **resultado** — o ciclo e os rótulos são do `mjrp-coaching-pm`; `achieved::` é do MJRP, o agente não marca; problema e medida que o projeto nunca declarou são perguntados ao humano, um por um, com a fonte;
   - **feature grande** — o aviso vai ao humano com as opções (partir por fatia vertical, ou manter e dizer por quê); não se parte sozinho.
2. Acrescente `CM-0027` a `conformance.applied` depois de ler os avisos e tratar os que são do trabalho (ou de levá-los, por escrito, ao relatório da auditoria).

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0027` sai 0 e `product_structure_check.py .` sai 0. O que o script não vê, a auditoria de agente separado lê: nota a nota, sólida, fraca ou errada.

## Quando não se aplica

No perfil `content` e no `meta`, e no `process_level: minimal`, como nas CM-0019 a CM-0022.
