---
id: CM-0101
item: content-audit
from: 6
to: 7
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-24 · fonte ea9bb8495 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0101 · content-audit@6 → content-audit@7

## Por que

As perguntas da auditoria não se entendiam. Em 2026-11-03, respondendo pela tela da F166, o MJRP disse que os textos estavam mal elaborados e que não havia uma pergunta em si (F170, UAT-475). Ele parou de responder: a pergunta vinha como um assunto, sem o que ela pedia nem o que cada opção mudava, e o sensor não via o problema, porque conta forma e não compreensão.

## O que muda

- O molde da pergunta ganha duas linhas, depois de `classe:` e de `por que o agente não podia:` e antes das opções: `Contexto:`, com até duas frases (o que o MJRP precisa para decidir), e `Pergunta:`, que termina em «?» e pede uma decisão só. Cada opção diz o que acontece depois. A pergunta que pede aceite diz, no `Contexto:`, que a resposta não é o aceite e que o aceite é dele, com o Touch ID.
- O `content_audit_check.py` ganha a cláusula `questions_text`: sem `Pergunta:`, `Pergunta:` que não termina em «?» ou tem mais de um, `Contexto:` com mais de duas frases ou 320 caracteres, caminho com linha, `.py` ou id interno no `Contexto:`, opção com menos de quatro palavras. Só a pergunta **aberta** é julgada; a respondida é histórico.
- Chega `mjrp-scripts/question_cold_read.py`: entrega a um juiz barato, que nunca viu o projeto, só o contexto, a pergunta e as opções de cada aberta. O juiz diz o que a pergunta pede, o que muda em cada opção e o que não entendeu. «Não entendeu» devolve a pergunta para reescrita antes de ir à tela.
- **Só avisa até o filho aplicar esta nota.** Antes disso, a cláusula `questions_text` é aviso; depois, erro. Um conform que está para fechar não se invalida ao ganhar o sensor novo.

## O que o filho faz

1. Reescreve as perguntas **abertas** no molde novo (`Contexto:` e `Pergunta:`), no relatório da auditoria. Pode fazer isso antes do refresh: o molde é texto, e o sensor só chega com o refresh.
2. Roda `python3 mjrp-scripts/new_project.py --refresh-kernel <projeto>` **uma vez, no fim**. Ele traz o sensor e o `question_cold_read.py`.
3. Roda `python3 mjrp-scripts/question_cold_read.py <relatório.md>` e entrega a saída a um agente barato (Haiku) que nunca viu o projeto. Ele responde por pergunta: o que ela pede, o que muda em cada opção, o que não entendeu. Uma pergunta com «não entendeu» volta para reescrita e só depois vai à tela.
4. Roda `python3 mjrp-scripts/conformance_check.py . --check-note CM-0101`, e acrescenta `CM-0101` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0101` sai 0; `mjrp-scripts/question_cold_read.py` existe no projeto; e a saída do juiz barato não aponta pergunta que ele não entendeu.

## Quando não se aplica

Projeto sem auditoria de conteúdo no `reports/audits/`, ou sem pergunta aberta: não há enunciado a reescrever. O refresh leva os scripts do mesmo jeito.
