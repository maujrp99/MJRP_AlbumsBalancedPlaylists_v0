---
id: CM-0063
item: content-audit
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0063 · content-audit@2 → content-audit@3

## Por que

A crítica de UX da tela F40 do Control Center (2026-10-18) achou que a tela não lê com segurança as perguntas do relatório da auditoria:
opções cortadas no lugar errado, um seguimento colado na última opção, um conjunto de opções sem nome, e a tela adivinhando de que item do
catálogo a pergunta trata. A forma agora é fixa, e um juiz opus achou que nada a conferia: o parse engolia uma opção quebrada em duas
linhas, `item: prd, roadmap` e um título com espaço duplo.

Nasceu de: a decisão do MJRP de 2026-10-18 sobre as perguntas da auditoria, registrada no `harness-kaizen` e no `conformance-notes`.

## O que muda

- O `content_audit_check.py` traz o **parse único** da seção `## Perguntas para o MJRP` (`parse_questions`, que a tela espelha) e a confere:
  o título `### P-NN · item: <id do catálogo ou —> · <assunto>`, o `item:` existente no catálogo, uma opção por linha (`- a) …`, letras
  em ordem, ao menos duas), o seguimento (`Seguimento (sem opções): …`, um só, em linha própria), as marcas (`→ respondida em AAAA-MM-DD HH:MM:
  (b)`, `(a, c)` ou `(outra) <texto>`; `→ seguimento respondido em …: <texto>`) e as linhas opcionais (`perguntada em …`, `conferida na releitura de …`).
- **Severidade:** a forma é **aviso** enquanto o filho não aplicou a CM-0063 e **lacuna** (exit 1) depois, numa cláusula própria, `audit_questions_check.py`, com o rótulo
  «perguntas da auditoria fora da forma P-NN». O `content_audit_check.py` (o juiz que a CM-0052 já aplicou) só avisa: um relatório de forma antiga não é «auditoria não feita», e
  nenhum filho reprova no critério de saída do conform por escrever a auditoria antes de ter as skills. Não há data de calendário.
- Marca (ou resposta de seguimento) sem uma entrada `decision` no log, **da mesma hora**, que cite `P-NN` e o relatório, é **sempre aviso**
  (`mark_without_log`) — o script vê a entrada ausente; uma marca e uma entrada falsas escritas juntas só a releitura da auditoria pega.
- `python3 mjrp-scripts/content_audit_check.py --parse-questions <relatório.md>` imprime o parse em JSON.
- Um relatório sem a seção não é cobrado por ela. A primeira cláusula `script` do item é a da v2; a segunda é a nova.

## O que o filho faz

1. Rode `python3 mjrp-scripts/content_audit_check.py .` (o aviso `questions_shape` não é lacuna) e `python3 mjrp-scripts/audit_questions_check.py .` (sai 0 enquanto a nota não foi aplicada). Se saírem 0,
   só registre a nota: acrescente `CM-0063` a `conformance.applied`, sem rodada.
2. Se imprimiu `questions_shape` no relatório **aberto** (o mais novo, com pergunta sem resposta), converta a seção para a forma nova
   (referência de respostas da `mjrp-pdlc-bootstrap`, § converter o relatório aberto). O relatório antigo e fechado fica como está.
3. Um `mark_without_log` pede a entrada `decision` que faltou — ou a retirada da marca, se o MJRP não respondeu.

## Como se confere

`conformance_check.py . --check-note CM-0063` sai 0 — **um relatório aberto de forma antiga só avisa, por desenho**: a nota é o que traz as skills que ensinam a forma, e o filho a aplica
antes de ser cobrado por ela. Depois de aplicada, o relatório fora da forma reprova com o rótulo próprio, e a cura é converter a seção (a referência de respostas da `mjrp-pdlc-bootstrap`).

## Quando não se aplica

Perfil `meta` (o harness se julga pelo próprio Learn gate).
