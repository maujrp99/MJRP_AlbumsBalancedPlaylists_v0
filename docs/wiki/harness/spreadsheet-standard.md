<!-- kernel do MJRP Harness · versão 2026-11-03 · fonte 79ddf31a1 · cópia derivada: não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# Padrão de planilhas — como toda planilha MJRP se apresenta

> Kernel · página de regra · criada 2026-10-05 17:01 · origem: parecer do `mjrp-pedroso-construction-sw` (2026-09-28), triado na S-58

## Definition

Toda planilha que um projeto MJRP cria ou altera — Google Sheets ou Excel, gerada por código ou montada à mão pelo agente — segue as regras abaixo. A regra é do MJRP, não do domínio: vale para finanças, obra, saúde ou qualquer projeto de duas vias em que a planilha é uma porta do produto. Cada regra tem um ID para ser citada (`SS-03`), como as do [[design-canon]].

## As regras

| ID | Regra |
|---|---|
| **SS-01** | **Tipografia.** Montserrat em todo cabeçalho de coluna, rótulo e título de seção; Calibri em dado numérico, descrição e texto geral — até o MJRP dizer outra coisa. |
| **SS-02** | **Alinhamento vertical** ao meio em 100% das células. |
| **SS-03** | **Alinhamento horizontal:** centro para rótulo de coluna e valor numérico; esquerda para descrição longa e comentário. |
| **SS-04** | **Quebra de texto** ligada em toda célula; se o conteúdo passa de 2 linhas, a coluna alarga até caber em no máximo 2. |
| **SS-05** | **Idioma:** rótulo, coluna, status, aba e mensagem de validação em português. |
| **SS-06** | **Dado conferido:** fundo verde-limão suave (`#d9f99d` / `#bef264`) no que é 100% real e auditado. |
| **SS-07** | **Dado não confirmado pelo MJRP:** fonte vermelha (`#dc2626`) no fundo padrão (branco/zebra) — suposição, valor hipotético e todo valor calculado que dependa deles. |

## O que cada projeto decide

No próprio `docs/specs/design-system.md`, numa seção da planilha: a cor do cabeçalho (a da marca do projeto), a zebra, o que conta como "conferido" (SS-06) e "não confirmado" (SS-07) no domínio dele, a marcação das colunas calculadas, a organização e a cor das abas. O projeto escolhe dentro das regras; não as troca. Mudar uma regra é decisão do MJRP, registrada aqui.

## No MJRP

- `mjrp-implementing-tasks` aplica as regras quando a task cria ou formata planilha; `mjrp-defining-design-systems` registra as escolhas do projeto; `mjrp-personal-finance` cita esta página em vez de ser a dona.
- Exemplos vivos: `mjrp-fin-control-2026-27` (`src/SubscriptionsSheetFormat.gs`) e `mjrp-pedroso-construction-sw` (`design-system.md` § Planilha mestre, `src/schema/Schema.gs`).
- Sem sensor por enquanto: conferir formatação exige ler a planilha exportada, e nenhum projeto pediu ainda. O critério para criar um é a segunda planilha que nasça fora do padrão.

## History

- **2026-10-05 17:01** · S-58: o padrão saiu da skill `mjrp-personal-finance` ("Universal spreadsheet formatting standard") para o kernel, a pedido do parecer do pedroso — a planilha mestre de lá nasceu fora do padrão porque nenhuma skill de construção apontava para ele. Regras SS-01 a SS-07 iguais às da skill, sem regra nova. O sensor opcional do parecer ficou fora (ver acima).

## Related

[[design-canon]] · [[engineering-canon]] · `mjrp-implementing-tasks` · `mjrp-defining-design-systems` · `mjrp-personal-finance`
