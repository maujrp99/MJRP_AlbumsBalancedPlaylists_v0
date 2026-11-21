---
id: CM-0052
item: content-audit
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0052 · content-audit@0 → content-audit@1

## Por que

O check de forma diz que o arquivo existe e tem os títulos; não diz se o que está escrito presta. Os arquivos canônicos que a bootstrap gerou nos filhos «não ficaram bons», e a rodada anterior de conform passou por todos os juízes de forma. Desde esta nota, cada item do catálogo nomeia (`judge_skill`) a skill que julga o **conteúdo** do artefato — a crítica de arquitetura para `arch`, `data-model` e `constitution`; a crítica de UX para a tela; a `mjrp-coaching-pm` para o topo do produto; a `mjrp-writing-reqs` para os requisitos e o `behavior`; e assim por diante — e a auditoria de fechamento do conform roda cada uma, item por item. Sem juiz (`null`), o item é só forma.

Nasceu de: decisão do MJRP de 2026-10-17 23:25 («o pdlc-bootstrap deveria garantir que rode a auditoria de qualidade de conteúdo dos arquivos canônicos através da revisão dos juízes»): a auditoria roda em todo filho, mesmo com o conform em dia.

## O que muda

- Um relatório `reports/audits/AAAA-MM-DD-<projeto>-conformance-audit.md` (`type: conformance-audit`), com `who_judged: separate-agent`, `judged` com a hora real, **mais novo que a nota mais nova que o projeto recebeu e que o último refresh do kernel** (todo conform que traz notas pede uma auditoria nova), `content_p0: 0` e, na tabela «item por item», **uma linha por item que se aplica** (`conformance_check.py . --audit-plan` lista quais).
- Para cada item **com juiz**, a linha cita o **arquivo do juiz** — `reports/audits/AAAA-MM-DD-<projeto>-content-<juiz>.md` —, escrito pelo próprio agente juiz: `type: content-judgment`, `who_judged: separate-agent`, a `judge_skill` do item, `judged` e `items`, e uma seção `` ### `item` — **sólida|fraca|errada** `` por item. **Todo veredito, *sólida* inclusive, traz ao menos duas linhas** `- [ok|P0|P1|P2] caminho:linha `trecho que a linha diz` — texto`: o arquivo é **do próprio item** (o `path` do catálogo ou o que o check lê), a linha existe e o trecho é o que ela diz. Um veredito que não é *sólida* exige também um achado P0/P1/P2 com o texto; *errada* exige P0. Veredito sem arquivo de juiz não vale, nem «sólida». Item sem juiz diz «só a forma».

## O que o filho faz

1. `mjrp-pdlc-bootstrap` (modo conform, passos 9 a 11, mesmo sem nota pendente): `python3 mjrp-scripts/conformance_check.py . --audit-plan` lista os itens e os juízes. O agente principal do conform lança, **em paralelo, um agente separado por skill juíza**, só leitura no projeto, que roda a crítica própria da skill sobre os itens dela e escreve o **seu** arquivo de juiz (a referência dos juízes da bootstrap descreve o formato). Depois o auditor (agente separado) lê os arquivos e escreve o relatório principal.
2. Cada achado vira item da rodada de correção, feita pela skill dona do item — ou pergunta numerada ao MJRP, com opções, quando o conteúdo é dele (o topo do produto, os exemplos do `behavior`). **Nada de produto é escrito pelo agente para o MJRP aprovar clicando.**
3. Depois da rodada, o mesmo juiz relê o artefato e fecha o P0 no arquivo dele (`[P0 fechado AAAA-MM-DD] …`); o auditor atualiza `content_p0`. **A nota só se aplica com nenhum P0 de conteúdo aberto.**
4. Commit por pathspec com entrada no log; acrescente `CM-0052` a `conformance.applied`.

## Como se confere

`conformance_check.py . --check-note CM-0052` sai 0: o `content_audit_check.py` lê o relatório **e o arquivo de cada juiz** — datas que não estão no futuro nem antes da chegada das notas, `who_judged`, âncoras que existem, vereditos que batem, nenhum P0 aberto. Uma tabela de vereditos sem os arquivos dos juízes reprova.

## Quando não se aplica

Perfil `meta` (o harness se julga pelo próprio Learn gate).
