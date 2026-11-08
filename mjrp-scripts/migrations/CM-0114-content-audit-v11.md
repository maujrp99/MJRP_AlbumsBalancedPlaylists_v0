---
id: CM-0114
item: content-audit
from: 10
to: 11
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-07 · fonte b4a466ac2 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0114 · content-audit@10 → content-audit@11

## Por que

Na auditoria de conteúdo, a âncora de cada linha é o trecho entre crases que o juiz leu (`caminho:linha` e o trecho). O `content_audit_check.py` aceitava um trecho feito só de espaços: ele "está" em qualquer linha do arquivo, então duas âncoras em branco fechavam o mínimo de âncoras sem que o juiz tivesse lido nada (F192, UAT-488). O sensor passou a recusá-las. É mudança de comportamento, não de redação: o filho que não recebe a nota continua aceitando a âncora em branco.

## O que muda

- O `content_audit_check.py` rejeita a âncora cujo trecho entre crases é vazio ou só espaços, com a mensagem «o trecho entre crases está vazio (só espaços): a âncora cita o que o juiz leu, e espaço não é leitura». A âncora com trecho de verdade segue valendo.
- O check do item **não muda** (as cláusulas `content_audit_check.py` e `audit_questions_check.py` são as mesmas da v10).
- O catálogo sobe o `content-audit` à versão 11, guarda a v10 em `superseded` e reestampa o `pattern_digest` do `content_audit_check.py`.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness, para trazer o `content_audit_check.py` novo.
2. Roda `python3 mjrp-scripts/content_audit_check.py .`. Uma linha da tabela cuja âncora é só espaços passa a ser acusada: o juiz relê o arquivo e cita o trecho que leu. **Não preencha a âncora com um trecho que ele não leu.**
3. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0114` e acrescenta `CM-0114` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0114` sai 0, e `content_audit_check.py .` acusa uma âncora cujo trecho entre crases é só espaços e aceita uma com trecho que existe na linha citada.

## Quando não se aplica

Projeto sem auditoria de conteúdo em `reports/audits/`. O refresh leva o sensor do mesmo jeito.
