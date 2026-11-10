---
id: CM-0111
item: delivery-strategy
from: 0
to: 1
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-10 · fonte 77b3a80a7 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0111 · delivery-strategy@0 → delivery-strategy@1

## Por que

No site pessoal (UAT-496, 2026-11-04) a regra de entrega do harness — «só o MJRP dá push, a `main` fica local» — foi copiada para um projeto que tem preview e produção na Vercel. O harness não tem site no ar, então a regra dele nunca precisou dizer o que gera preview nem o que vai a produção. Sem ninguém perguntar como o projeto entrega, um lote de 50 commits ia direto à produção, sem passar por preview.

A decisão do MJRP, de 4/11: a estratégia de entrega é escrita **para o projeto**, não copiada do harness. «Só o MJRP dá push» é a estratégia do harness e o padrão até o projeto escrever a dele.

## O que muda

- Item novo, `delivery-strategy`, com o juiz `delivery_strategy_check.py`. O `docs/specs/arch.md` do projeto ganha a seção `## Delivery strategy` (ou `## Estratégia de entrega`), que responde, cada pergunta sob um rótulo:
  - que ramos existem;
  - o que gera preview;
  - o que vai a produção;
  - quem envia cada um;
  - o que se confere em cada etapa;
  - como se volta atrás;
  - se o preview usa as credenciais e os dados de produção.
- A seção leva uma linha `Status:`: **proposta** (escrita pelo agente, à espera do MJRP) ou **confirmada** (ele a confirmou). Proposta passa no check, com aviso: o que importa é que esteja escrita e marcada; a decisão é dele.
- Um projeto sem produção diz isso numa linha («Sem produção: …») e não precisa do resto.
- O modelo `arch.md` da `mjrp-designing-architecture` traz a seção. A `mjrp-pdlc-bootstrap`, dona do item, pergunta se a estratégia existe e, se não, propõe uma lendo o que o projeto tem (`reference/delivery-strategy.md`).

## O que o filho faz

1. `python3 mjrp-scripts/delivery_strategy_check.py .` — diz o que falta.
2. Sem a seção: leia a hospedagem (arquivos de deploy, `package.json`), os workflows de `.github/workflows/`, os ramos e o contrato `.mjrp-project.yml`, e **escreva uma proposta** no `docs/specs/arch.md`, pelo procedimento de `mjrp-pdlc-bootstrap` › `reference/delivery-strategy.md`. O que a leitura não mostra (uma credencial do preview, um plano da hospedagem) entra como «não conferido», nunca como fato.
3. Marque a seção `Status: proposal` e **leve a proposta ao MJRP** — ele confirma, ajusta ou recusa. Não é decisão do agente: é escolha de entrega e de risco do projeto. Confirmada, o `Status:` passa a `confirmed`.
4. Projeto sem produção: uma linha «Sem produção: …» (por que, e onde o código roda) e o `Status:`.
5. `python3 mjrp-scripts/conformance_check.py . --check-note CM-0111` e acrescente `CM-0111` a `conformance.applied`.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0111` sai 0 (o check é o `delivery_strategy_check.py`; o aviso de «proposta» não reprova). Sem a seção, ou com uma pergunta sem resposta, o mesmo comando sai 1 e diz qual.

## Quando não se aplica

No perfil `content` e no `meta`. O harness e o Control Center dentro dele seguem a estratégia do harness (`AGENTS.md`, § Push); um filho só a adota como a dele se o MJRP a confirmar na seção.
