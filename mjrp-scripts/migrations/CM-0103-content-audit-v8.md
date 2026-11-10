---
id: CM-0103
item: content-audit
from: 7
to: 8
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0103 · content-audit@7 → content-audit@8

## Por que

O MJRP é o juiz final (F171, UAT-477, 2026-11-03 23:42). Quando ele aprova uma mudança, o juiz daquele conteúdo não se lança de novo, a não ser que ele peça. Só que o sensor, ao ler o relatório de auditoria, via uma linha citada que tinha mudado por causa dessa aprovação e acusava `judge_anchor_missing`, o que pedia um juiz novo sobre o que ele já tinha aprovado.

## O que muda

- O `content_audit_check.py` ganha o aviso `anchor_moved_by_approval`. Uma âncora cuja linha mudou depois do `judged:` do juiz, por aprovação do MJRP, conta como boa: não é lacuna e não chama juiz. A aprovação é uma entrada `decision` do log cujo cabeçalho diz que o MJRP aprovou e nomeia o item, datada depois do `judged:` e não antes da mudança. O aviso sai no relatório e nomeia o arquivo, a linha e a hora da decisão, para a lacuna não sumir.
- Uma âncora cuja linha muda **sem** essa decisão segue `judge_anchor_missing`, como antes.
- O catálogo sobe o `content-audit` à versão 8 e reestampa o `pattern_digest` de `content_audit_check.py`.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness, para trazer o `content_audit_check.py` novo.
2. Roda `python3 mjrp-scripts/content_audit_check.py .` e lê os avisos `anchor_moved_by_approval`: cada um cita uma entrada de decisão do log cujo cabeçalho diz que o MJRP aprovou. A entrada pode ter sido escrita por um agente; o script não prova a aprovação, e o aviso mostra a entrada para ele conferir na releitura. Esse aviso não pede juiz novo. Se aparecer `judge_anchor_missing`, o caso é o de antes: o juiz do item (a `judge_skill`) relê a linha e refaz o trecho ancorado.
3. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0103` e acrescenta `CM-0103` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0103` sai 0. `content_audit_check.py .` não lista `judge_anchor_missing` numa âncora que uma decisão dele já cobre, e o aviso `anchor_moved_by_approval` aparece onde houve essa mudança.

## Quando não se aplica

Projeto sem auditoria de conteúdo em `reports/audits/`, e projeto cujo juiz não cita linha de arquivo do item: não há âncora a conferir. O refresh leva o sensor do mesmo jeito.
