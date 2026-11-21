---
id: CM-0025
item: roadmap
from: 3
to: 4
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0025 · roadmap@3 → roadmap@4

## Por que

A tela de Produto do Control Center mostra, para cada resultado, três campos: o **problema**, **quem sente** e a **medida**. Ela só os lê de uma linha de lista que abre com o rótulo em negrito (`- **Problema:** …`) dentro da seção `###` do resultado. No fin-control, o conform de 2026-10-17 pôs "Quem sente" numa linha solta, sem o rótulo, e não escreveu o "Problema": o `roadmap@3` passou (só pedia `Now`/`Next`/`Later`, o `^OUT-xx` e o `tags::`) e a tela mostrou os dois campos vazios. A auditoria independente do conform marcou a nota como **fraca**: passava pela forma, não pelo que a tela mostra.

## O que muda

- o `check` do item continua olhando o `ROADMAP.md` e passa a exigir também, cada um pelo menos uma vez, na forma que a tela lê (uma linha de lista, o rótulo em negrito, os dois-pontos dentro do negrito):
  - `- **Problema:** <o que dói hoje, nas palavras de quem sente>`
  - `- **Quem sente:** <quem é e com que frequência>`
  - `- **Medida:** <hoje → alvo> ^OUT-xx`
- o modelo `templates/roadmap.md` do `mjrp-pdlc-bootstrap` traz os três campos nos resultados de Now e de Next;
- a conferência **por resultado** (cada resultado tem os três) não é uma cláusula do catálogo: é um aviso do `product_structure_check.py`, a partir do `product-structure@5` (CM-0027). O `roadmap@4` pega o projeto que não escreveu o rótulo em lugar nenhum, que foi o caso do fin-control. **Limite dito:** um resultado novo sem os rótulos, num arquivo em que outro resultado já os tem, passa o `roadmap@4`; só o aviso por resultado (`outcome_no_problem`, `outcome_no_who`) o pega, e é aviso, não falha. A skill dona (`mjrp-coaching-pm`) escreve os três campos em todo resultado, e a auditoria do conform lê isso.

## O que o filho faz

1. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0025` diz o que falta. Para cada resultado do `ROADMAP.md`, a `mjrp-coaching-pm` escreve, na seção `###` dele, os três campos **rotulados**, com o conteúdo que o roadmap e o PRD já dizem (uma linha solta de "Quem sente" ganha o rótulo; nada se perde).
2. **O que é do humano não se redige:** o *problema* e a *medida* de um resultado que o projeto nunca declarou são perguntados a ele, um por um, com a fonte — nunca escritos pelo agente e aprovados por um clique em "(Recomendado)" (`mjrp-pdlc-bootstrap`, `reference/product-decisions.md`). O agente só reorganiza o que já está dito.
3. Commit por pathspec, com entrada no log, e `CM-0025` em `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0025` sai 0; e, na tela de Produto, os três campos de cada resultado aparecem preenchidos.

## Quando não se aplica

Fora do perfil `code-app`. Um projeto sem `ROADMAP.md` ainda não tem o que rotular (o `roadmap@1` vem antes).
