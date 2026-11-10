---
id: CM-0076
item: adr-names
from: 2
to: 3
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0076 · adr-names@2 → adr-names@3

## Por que

O `adr-names` conferia o nome do **arquivo** (`NNNN-kebab` em inglês) e passava ADRs que o Control Center não lê: no MJRPpersonal, três ADRs com `# ADR 0002: …` (espaço no lugar do hífen) ou com um título que nem é de ADR, e duas com `## Status` + a palavra na linha de baixo (a tela lê `**Status**: x`, e sem ele **a ADR inteira** deixa de ler); a tela dizia «4 ADRs de MJRPpersonal não se leem» com o catálogo verde. É o 5º caso do dia em que o check não pede o que a tela lê. O leitor passa a aceitar `# ADR 0002:` (variante comum e inofensiva); o check continua estrito a **uma** forma, para que a tela nunca falhe em silêncio.

Nasceu de: o achado do MJRP de 2026-10-18 sobre a Overview do MJRPpersonal (`harness-kaizen`, 22:58).

## O que muda

- o `check` do item ganha uma segunda cláusula, `adr_header_check.py`, sobre o cabeçalho de cada `docs/decisions/NNNN-*.md`:
  - o título é `# ADR-NNNN: título` (dois-pontos, quatro dígitos, um espaço); com `id_prefix` no contrato vale também `# CC-ADR-NNNN: título`, e o título sem o prefixo segue válido, como o leitor o toma;
  - há a linha de status que a tela lê, `**Status**: Accepted` ou `- **Status:** Accepted`, nas primeiras 40 linhas (`## Status` com a palavra embaixo não se lê).
  As expressões estão num lugar só (`TITLE_RE`, `STATUS_RE`), e o teste de compatibilidade do Control Center as amarra às do leitor.
- a cláusula do nome do arquivo (v2) não muda.

## O que o filho faz

1. `python3 mjrp-scripts/conformance_check.py . --gaps` — cada ADR vem com o título que acusou.
2. Para cada uma, **só o cabeçalho** muda: a linha de título vira `# ADR-NNNN: <o mesmo texto>` (o número é o do arquivo; um título que não é de ADR ganha o prefixo na frente, sem trocar o texto) e o status vira a linha `**Status**: <a mesma palavra>` (`## Status` + palavra embaixo vira `**Status**: Accepted`, mantendo o resto do texto do status). Nenhuma decisão, contexto ou consequência muda — é a mesma exceção do nome do arquivo. Classe **(a)**, decidida pelo agente e revisável: registra a entrada do log com o sufixo ` — decidido pelo agente, revisável pelo MJRP`.
3. Commit por pathspec; acrescente `CM-0076` a `conformance.applied`.
4. **Brownfield, na mesma passada (regras do MJRP de 2026-10-18, classe (a), sem pergunta):**
   - a story ou a feature já fechada (Done) **antes do harness** nasce `Accepted`, com `accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"` no frontmatter; fila de aceite e pergunta ao MJRP não existem para ela. «Antes do harness» é: a story lista ao menos um commit em `delivered_by` e nenhum é mais novo que o commit que criou o `.mjrp-project.yml` (sem `delivered_by` ela não qualifica: escreva o commit que a entregou, que está no histórico do marco legado). O sensor do grafo imprime «N aceites por histórico». O trabalho fechado depois segue o aceite normal (b). A auditoria e os juízes olham o que **não** está fechado;
   - o sensor visual (paridade, reconferência) **não roda** nas telas já fechadas e em produção, a não ser que o MJRP peça: elas não são comparadas com protótipo e não geram achado nem reconferência. O sensor vale para a tela nova ou alterada depois do harness. O portão de merge não muda: o ramo que toca um arquivo de tela ainda precisa da reconferência, e para a tela legada alterada a base é a tela em produção antes da mudança.
   Os detalhes estão em `mjrp-pdlc-bootstrap` (`reference/legacy-history.md`).

## Prazo

O item `adr-names` mantém o `since` de 2026-10-13 (como todo item que sobe de versão: o `since` é do item, não da versão), mas a carência de **30 dias conta do dia em que o filho recebe a v3** (`--refresh-kernel` grava `received: adr-names@3`); só o filho que nunca recebeu conta de 2026-10-13, até 2026-11-12.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0076` sai 0 e `--gaps` não lista `adr-names`. No brownfield, a lista «aceite pendente» do Control Center não traz nenhuma story fechada antes do harness.

## Quando não se aplica

Projeto sem `docs/decisions/` (o item não se aplica). A parte brownfield, a projeto que nasceu com o harness: não há histórico anterior a ele.
