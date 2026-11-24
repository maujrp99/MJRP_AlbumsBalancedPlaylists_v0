---
id: CM-0105
item: content-audit
from: 8
to: 9
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte 926c1c410 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0105 · content-audit@8 → content-audit@9

## Por que

Uma rodada nova no topo do `uat.md` desce todas as linhas abaixo dela. O juiz do `MJRPpersonal` cita `docs/specs/uat.md:71` com o trecho que a linha diz, e o sensor conferia linha e trecho juntos: com o trecho intacto, o doctor ficou vermelho (`judge_anchor_missing`) até um juiz separado reler o arquivo (F179, UAT-486, 2026-11-04). Pior, os agentes passaram a pôr as issues novas no fim da última rodada para não acionar o juiz, e a issue ficou na versão errada do board. O mesmo vale para o `ROADMAP.md` e o `prd.md`, quando se move um bloco.

## O que muda

- O `content_audit_check.py` confere pelo **trecho**; a linha é dica. Se a linha (ou o intervalo) ainda diz o trecho, a âncora vale como está escrita. Se não diz, mas o trecho existe **uma vez** no arquivo, a âncora vale e o sensor passa a contá-la na linha onde o trecho está agora. O relatório ganha o aviso `anchor_line_moved`, uma linha por arquivo de juiz, com a linha antiga e a nova, e diz que não há o que reler.
- O trecho que **sumiu** do arquivo segue `judge_anchor_missing`: é o sinal de que o juiz precisa reler. O caso `anchor_moved_by_approval` da CM-0103 (o trecho mudou por aprovação do MJRP) fica como estava.
- O trecho que aparece **mais de uma vez**, e não na linha citada, também é `judge_anchor_missing`: não há como saber qual deles o juiz leu. A mensagem lista as linhas onde o trecho aparece. Trecho repetido que ainda está na linha citada vale, como antes.
- O catálogo sobe o `content-audit` à versão 9 e reestampa o `pattern_digest` de `content_audit_check.py`.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness, para trazer o `content_audit_check.py` novo.
2. Roda `python3 mjrp-scripts/content_audit_check.py .`. Os `judge_anchor_missing` que vinham só de mudança de linha somem; ficam os de trecho que sumiu ou que se repete, e para esses o juiz do item (a `judge_skill`) relê e refaz a âncora. O aviso `anchor_line_moved` não pede nada.
3. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0105` e acrescenta `CM-0105` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0105` sai 0. Com uma linha inserida acima de um trecho ancorado, `content_audit_check.py .` não lista `judge_anchor_missing` e imprime `anchor_line_moved`; com o trecho apagado, lista.

## Quando não se aplica

Projeto sem auditoria de conteúdo em `reports/audits/`, e projeto cujo juiz não cita linha de arquivo do item: não há âncora a conferir. O refresh leva o sensor do mesmo jeito.
