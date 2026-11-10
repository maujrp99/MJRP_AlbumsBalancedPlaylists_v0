---
id: CM-0122
item: content-audit
from: 11
to: 12
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0122 · content-audit@11 → content-audit@12

## Por que

Na auditoria de conteúdo, a âncora de cada linha cita o trecho que o juiz leu e a linha onde ele estava. Desde a F179, quando uma rodada nova entra no topo de um arquivo e empurra as linhas, o trecho decide e a linha é só dica: o sensor aceita a âncora e avisa `anchor_line_moved`. Mas o aviso não tinha fim: enquanto ninguém reescrevesse a âncora, ele voltava a cada rodada do doctor (F209, UAT-488, o achado P2-3 da reconferência da F179). O sensor ganhou o comando que reescreve a linha.

## O que muda

- `content_audit_check.py <projeto> --fix-hints` reescreve, em cada arquivo de juiz que conta, só a linha das âncoras que seguiram o trecho. O trecho entre crases, o texto do achado e o `judged:` ficam como o juiz escreveu: o trecho é o que ele leu, e não mudou. Depois disso o aviso `anchor_line_moved` some.
- O texto do aviso passa a dizer o comando.
- O check do item **não muda** (as cláusulas `content_audit_check.py` e `audit_questions_check.py` são as mesmas da v11).
- O catálogo sobe o `content-audit` à versão 12, guarda a v11 em `superseded` e reestampa o `pattern_digest` do `content_audit_check.py`.

## O que o filho faz

1. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>`, do harness, para trazer o `content_audit_check.py` novo.
2. Se o doctor mostra `[aviso] anchor_line_moved`, roda `python3 mjrp-scripts/content_audit_check.py . --fix-hints` e commita os arquivos de juiz reescritos. **Não use o comando para esconder um `judge_anchor_missing`:** ele só mexe na âncora cujo trecho continua no arquivo, uma vez só.
3. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0122` e acrescenta `CM-0122` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0122` sai 0, e depois do `--fix-hints` o `content_audit_check.py .` não mostra mais `anchor_line_moved`.

## Quando não se aplica

Projeto sem auditoria de conteúdo em `reports/audits/`. O refresh leva o sensor do mesmo jeito.
