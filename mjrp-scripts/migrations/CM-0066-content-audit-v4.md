---
id: CM-0066
item: content-audit
from: 3
to: 4
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0066 · content-audit@3 → content-audit@4

## Por que

O MJRP deu o mesmo retorno nos dois filhos (2026-10-18): ele não pode ser o gargalo. No `pedroso-incorp` o conform terminou com 22 perguntas
para ele; no `fin-control`, com uma lista de «o que fica aberto / perguntas para você». Quase todas eram técnicas, organizacionais ou
reversíveis, e o próprio agente disse que decidiria «com qualidade» — mas a regra «o agente não decide o conteúdo do produto» mandou tudo
para ele. No `fin-control` houve pior: a constituição (as listas vêm só do cadastro) e o código (listas fixas de reserva) divergiram, e o
agente recomendou dobrar a regra para caber no código; só refletiu depois de o MJRP perguntar duas vezes se a regra faz sentido.

Nasceu de: a decisão do MJRP de 2026-10-18 («quero tudo corrigido, que for possível, e se não for possível, a justificativa do porquê»),
registrada no `harness-kaizen` e no `AGENTS.md` do harness.

## O que muda

- **A decisão em classes**, na `mjrp-pdlc-bootstrap` (a referência das decisões do conform): todo ponto que a auditoria levanta é (a) derivável
  de regra que ele já aprovou, ou técnico ou organizacional **e** reversível — **o agente decide, corrige e registra** (entrada `decision` no
  log com o título terminando em ` — decidido pelo agente, revisável pelo MJRP`, e a lista no relatório); (b) fato ou ação só dele (todo aceite
  e as válvulas dele incluídos); (c) escolha de produto sem regra aprovada. **A lista do (c) é (c) seja qual for a reversibilidade:** meta ou
  medida, limiar ou linha de base de um número na tela, resultado novo, prioridade entre resultados, mudança na VISION, problema e «quem sente». **Só (b) e (c) vão ao MJRP**, em lote, e não
  seguram o fechamento; a (c) leva o «por que o agente não podia» e, exceto medida/problema/«quem sente» (aí a pergunta cita o registro e **não
  recomenda**, decisão explícita dele), a recomendação com o porquê de cada alternativa. O conform só fecha sem nada aberto que o agente
  podia resolver.
- **A regra antes do código**: regra aprovada e código divergem → julgue a regra primeiro; se ela fica, o código é o defeito (Fix com
  `violates::`); só regra errada vira emenda, que é (c). Nunca recomendar dobrar a regra.
- **O relatório da auditoria** ganha a seção `## Decidido pelo agente (revisável)` e a seção de achados sobre as perguntas. O juiz da auditoria
  cobra **pergunta evitável** e **regra dobrada** (P1), e o relatório os **conta no frontmatter**, como o `content_p0`: `avoidable_questions: N`
  e `bent_rules: N` (os achados abertos, um item `- [P1] pergunta evitável · P-NN — …` por achado; o número tem de ser igual aos itens; fechado
  na releitura vira `- [P1 fechado AAAA-MM-DD] …`). **O conform não fecha com nenhum dos dois acima de 0** (`audit_avoidable_open`,
  `audit_bent_rule_open`; `audit_policy_count` quando o número não bate ou falta).
- **Cada pergunta aberta** do `## Perguntas para o MJRP` declara, logo abaixo do título e antes do texto, `classe: b` ou `classe: c` — e a `c` também
  `por que o agente não podia: …` (cada linha uma só vez). `classe: a` não é pergunta. O `content_audit_check.py` lê as duas linhas no mesmo
  parse (`classe`, `why_not`) e a cláusula `audit_questions_check.py` as confere (`questions_class`); a pergunta já respondida é histórico e
  não pede classe. `--parse-questions` sai 1 com problema de forma ou de classe.
- **Severidade:** `questions_class` e os dois números são **aviso** enquanto o filho não aplicou a CM-0066 e **lacuna** (exit 1) depois,
  independente da CM-0063. Não há data de calendário: um relatório escrito antes das skills não reprova.

## O que o filho faz

1. Rode `python3 mjrp-scripts/content_audit_check.py .` e `python3 mjrp-scripts/audit_questions_check.py .` e leia os avisos `questions_class` e
   `audit_policy_*`. Sem aviso (sem seção de perguntas, ou todas respondidas, e nenhum achado aberto), só registre a nota: acrescente
   `CM-0066` a `conformance.applied`, sem rodada — mas faça o passo 3, que não depende da seção de perguntas.
2. Cada pergunta **aberta** do relatório mais novo é classificada com a `mjrp-pdlc-bootstrap` (a referência das decisões do conform):
   - a que é (a): o agente a decide e corrige, registra no log e na seção nova do relatório, e **tira a pergunta**;
   - a que é (b) ou (c): ganha `classe:` (e o «por que o agente não podia» na `c`), e cada opção, o porquê — menos a medida, o problema e o
     «quem sente», que citam o registro e não recomendam.
3. **Rejulgue as decisões que o agente já tomou antes desta regra**, não só as perguntas abertas: as entradas do log marcadas `pendente do MJRP`
   ou «decidido pelo agente», e as emendas de regra que o conform propôs. Uma que dobrou a regra para caber no código — por exemplo, uma
   emenda da constituição recomendada porque o código faz diferente — é **reaberta**: julgue a regra; se ela fica, o código vira Fix com
   `violates::` e uma entrada `decision` nova aponta para a antiga (o log só acrescenta). Os achados vão para o relatório como *regra dobrada*.
4. Relatório e perguntas fechados ficam como estão. O relatório novo declara `avoidable_questions` e `bent_rules`.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0066` sai 0 — **um relatório aberto sem classe só avisa, por desenho**: a nota é o que
traz as skills que ensinam a classe, e o filho a aplica antes de ser cobrado por ela. Depois de aplicada, uma pergunta aberta sem classe (ou
uma `classe: a`), um número de achados ausente ou diferente dos itens, ou um achado aberto reprova, e a cura é a conversão do passo 2 e a
releitura do auditor.

## Quando não se aplica

Perfil `meta` (o harness se julga pelo próprio Learn gate).
