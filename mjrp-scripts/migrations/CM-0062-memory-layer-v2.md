---
id: CM-0062
item: memory-layer
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte d990067a9 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0062 · memory-layer@1 → memory-layer@2

## Por que

A tela «Aguardando sua decisão/ação» do Control Center lê as perguntas da auditoria de conformidade no relatório
(`reports/audits/*conformance-audit*.md`, seção `## Perguntas para o MJRP`). O `pedroso-incorp` (2026-10-18) as tinha também
copiadas no `Pending on Human` do `MEMORY.md ## Now`: a tela as mostrava duas vezes, e a cópia deixava de bater com o
relatório a cada resposta do MJRP.

Nasceu de: a crítica de UX da tela (F40) sobre o relatório do `pedroso-incorp`, decisão do MJRP de 2026-10-18, registrada no `harness-kaizen`.

## O que muda

- O modelo do `## Now` (`templates/now.md` da `mjrp-saving-context`) diz que o `Pending on Human` **aponta** para o relatório da
  auditoria de conformidade — «perguntas da auditoria de conformidade, em `reports/audits/<arquivo>`», sem contar quantas (a tela
  conta; um número aqui seria uma cópia que se desatualiza) — e **nunca as copia**. As perguntas vivem só no relatório.
- O check do item ganha uma cláusula `script`, `now_questions_check.py`: reprova um `Pending on Human` que **copia** as perguntas
  (uma frase que fala das perguntas da auditoria e enumera: faixa de números como `1–21`, ids `P-NN`, `§`, opções `(a)`, parêntese com
  lista, ou mais de 220 caracteres). O ponteiro passa. As cláusulas da v1 continuam.

## O que o filho faz

1. `python3 mjrp-scripts/now_questions_check.py .` — se sair 0, só registre a nota. Se listou uma frase, abra o `MEMORY.md ## Now` e troque
   a lista por uma linha: «perguntas da auditoria de conformidade, em `reports/audits/<arquivo>`». O que depende do MJRP e **não** é
   pergunta da auditoria continua na lista.
2. **O relatório aberto** (o mais novo, com pergunta sem resposta) tem as perguntas em lista numerada? Converta **só a seção
   `## Perguntas para o MJRP`** para a forma nova (`### P-NN · item: <id> · <assunto>`, uma opção por linha; a regra de conversão está
   na referência de respostas da `mjrp-pdlc-bootstrap`: o número antigo vira `P-NN`, um conjunto de opções partido ganha o próximo número
   livre com «(era a 21, 2º conjunto)» no texto, mais nada no relatório muda). **Os relatórios antigos, já fechados, ficam como estão.**
3. Acrescente `CM-0062` a `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0062` sai 0, e `now_questions_check.py` não lista nada. O que o script
não vê — uma cópia curta, sem enumeração, de uma pergunta — a auditoria de conteúdo do conform lê (a juíza do item é a
`mjrp-auditing-docs`).

## Quando não se aplica

Projeto sem `MEMORY.md ## Now` (`content` e `meta`).
