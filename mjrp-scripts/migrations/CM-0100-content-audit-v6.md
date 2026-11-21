---
id: CM-0100
item: content-audit
from: 5
to: 6
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0100 · content-audit@5 → content-audit@6

## Por que

O MJRP decidiu, em 2026-11-03, responder às perguntas da auditoria na tela do Control Center (F166, UAT-471; CC-ADR-0039). A tela grava a resposta no projeto, e nenhum agente fica sabendo sozinho: é preciso um aviso, e os leitores do log têm de conhecer o tipo novo de entrada.

## O que muda

- O `docs/log.md` ganha o tipo `answer`: a entrada que a tela escreve, com a pergunta no título e o relatório no corpo. O F1 do doctor não a conta, e o `log_entry_check.py` recusa a que não tem pergunta e relatório.
- O `marks_without_log` do `content_audit_check.py` aceita a entrada `answer` como a que respalda a marca.
- Chega o `mjrp-scripts/screen_answers.py`: ele lista as respostas sem executar no início de sessão, e o doctor avisa (W21) da que passa de um dia.
- **Só afrouxa para o que já existe:** nenhum relatório de hoje muda de veredito, e o filho que passava continua passando.

## O que o filho faz

1. `new_project.py --refresh-kernel <projeto>`, do harness: traz os scripts e o hook de início de sessão. Sem isso, a tela recusa a resposta com esta instrução.
2. Quando houver resposta da tela: aplique, escreva a entrada `decision` que cita a pergunta e o relatório, e commite por pathspec (a referência `conformance-audit-answers` da `mjrp-pdlc-bootstrap`).
3. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0100` e acrescenta `CM-0100` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0100` sai 0, e `mjrp-scripts/screen_answers.py` existe no projeto.

## Quando não se aplica

Projeto sem auditoria de conteúdo no `reports/audits/`: não há pergunta a responder. O refresh leva os scripts do mesmo jeito.
