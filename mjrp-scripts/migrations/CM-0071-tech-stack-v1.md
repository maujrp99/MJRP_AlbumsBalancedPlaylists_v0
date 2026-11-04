---
id: CM-0071
item: tech-stack
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0071 · tech-stack@0 → tech-stack@1

## Por que

Com o que o produto é construído (linguagem, runtime, front, back, dados, integrações, testes, build) não tinha casa: ora ia no `arch.md`, ora na constituição, ora só no
`pyproject.toml`, e ninguém conseguia dizer qual escolha tinha ADR e qual não. Desde esta nota a stack mora em `docs/specs/tech-stack.md`, uma tabela com a decisão de
cada linha, o que se decidiu não usar e as restrições com a fonte; o `arch.md` aponta para lá.

Nasceu de: decisão do MJRP de 2026-10-18 (aprovou o modelo do artefato `tech-stack.md`). Onde o produto roda (infra, CI/CD) **não** é o assunto dele: mora na aba de Ops, quando existir.

## O que muda

- Item novo `tech-stack`, `docs/specs/tech-stack.md`, perfil `code-app`: o modelo é `templates/tech-stack.md` da `mjrp-designing-architecture`, dona do conteúdo; o juiz é a `mjrp-critiquing-architecture`.
- O check cobre a forma (`tech_stack_check.py`, mais a cláusula do `status:`):
  - `status:` no frontmatter é `Draft` ou `Aprovado pelo MJRP em AAAA-MM-DD` — só o valor, **sem comentário na linha**;
  - a seção `## Stack` com a tabela de cinco colunas (Camada · Tecnologia · Versão · Para quê · Decisão);
  - a célula **Decisão** é `—`, ou um ou mais `[[ADR-NNNN]]` separados por ` · `, cada um com ` § x` opcional; comentário vai em «Para quê». O `[[ADR-NNNN]]` resolve para o `docs/decisions/NNNN-*.md` do próprio projeto (link que não resolve é lacuna);
  - a seção `## Restrições`, com ao menos uma regra e a ADR citada na mesma forma;
  - `## Decidido não usar` é **opcional** (só quando houver); se existe, tem a tabela de três colunas e a Decisão na mesma forma.
- A stack só muda por ADR; a coluna `Decisão` cita a ADR (`—` quando nenhuma cobre a escolha ainda). As expressões (`STATUS_RE`, `DECISION_CELL_RE`) estão num lugar só, o `tech_stack_check.py`, que o leitor do Control Center importa ou espelha.

## O que o filho faz

1. Escreve `docs/specs/tech-stack.md` do modelo (`mjrp-designing-architecture`), **a partir do que o código usa de fato**: os manifestos e lockfiles (`pyproject.toml`/`uv.lock`, `package.json`/lockfile e equivalentes), a constituição e as ADRs. Só as camadas que existem; a versão é a que o lockfile fixa; a ADR de cada linha na coluna `Decisão`, ou `—`.
2. É **classe (a)** — decidido pelo agente, revisável pelo MJRP: o agente escreve e registra a entrada do log com o sufixo ` — decidido pelo agente, revisável pelo MJRP`; não pergunta ao MJRP o que o código já mostra. O arquivo fica `status: Draft` até o MJRP aprovar (`Aprovado pelo MJRP em AAAA-MM-DD`).
3. Aponta o `arch.md` para ele: uma seção `## Stack` de uma linha que remete a `docs/specs/tech-stack.md`; a coluna do mapa de componentes que listava a tecnologia passa a nomear a **camada da stack** (o detalhe do componente, se precisar, vai noutra coluna).
4. **Na auditoria de conteúdo do conform** (`mjrp-pdlc-bootstrap`), o `tech-stack` ganha a linha na tabela «item por item», com a skill juíza `mjrp-critiquing-architecture` e o arquivo do juiz. Enquanto o item novo estiver na carência e a nota não aplicada, a linha ainda não é cobrada (`content-audit@5`, CM-0073); aplicada a nota, é.
5. Commit por pathspec; acrescente `CM-0071` a `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0071` sai 0 e `--gaps` não lista `tech-stack`.

## Quando não se aplica

Projeto `content` ou `meta` (o harness raiz é `meta`).
