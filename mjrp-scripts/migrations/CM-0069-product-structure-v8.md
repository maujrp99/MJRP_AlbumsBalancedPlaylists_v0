---
id: CM-0069
item: product-structure
from: 7
to: 8
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-09 · fonte ea576bcde · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0069 · product-structure@7 → product-structure@8

## Por que

No `MJRPpersonal` (2026-10-18) a tela Product Tracking › Epics mostrou todo épico como «EP-01 · OUT-03», «EP-02 · OUT-01»…, sem o nome, e o catálogo havia passado. O PRD dele escreve a tabela de épicos como `| EP-01 · O acervo de livros migrado e enriquecido | OUT-03 | entregue | … |` (id e nome na MESMA célula, sem negrito) e o leitor do Control Center só conhecia `| **EP-xx · nome** |`: com o id solto, pegava a segunda célula como nome, que ali é a coluna *Serve*. O `product_structure_check.py` copiava o mesmo leitor, então não via nada de errado. É a terceira vez no mesmo dia em que **o check do catálogo não exige o que a tela exige** (`report-names@4`, `design-system@4`).

Nasceu de: o incidente do MJRPpersonal, registrado no `harness-kaizen`.

## O que muda

- O leitor do Control Center (`prd.py`) e o espelho dele no sensor aceitam **três formas** de nomear o épico na tabela, e **nenhuma outra**:
  1. `| **EP-xx · nome** — texto |` (a parte em negrito é o nome — a forma de sempre; o separador também pode ser `—`, `–`, `:` ou ` - `);
  2. `| EP-xx · nome |` com id e nome na mesma célula, em negrito ou não; o separador é `·`, `—`, `–`, `:` ou ` - `;
  3. `| EP-xx | nome |` com o nome na célula seguinte, **só se o cabeçalho dessa coluna disser que ela é o nome** (`Nome`, `Epic`/`Épico`, `Título`, `O que é`) — nunca `Serve`, `Resultado`, `Estado`, `Critério de saída`.
- Um «nome» feito só de IDs (`EP-01 · OUT-03`, `EP-11 - EP-12`) não é nome: é a coluna ao lado lida por engano.
- Linha com `EP-xx` e sem nome que se ache **não vira mais um nome errado**: a leitura do PRD falha (`failed/unsupported_format`, com a linha) e o sensor reprova.
- Lacuna nova, **`epic_name_missing`**, uma por linha da tabela de épicos cujo nome a tela não acha (o leitor para na primeira; o sensor lista todas, para o filho corrigir a tabela numa passada). Entra no `GATE_BLOCKING`: sem o nome o PRD inteiro fica ilegível na tela e bloqueia as stories.
- A conferência da tela do conform (`mjrp-pdlc-bootstrap`, `reference/screen-check.md`) ganha o passo «A tela confere com o PRD e o grafo»: lê o `state.json` do snapshot e compara os nomes dos épicos com o PRD, o número de épicos, «sem épico», «sem release» e as NFR com o grafo; divergência é achado.
- A `mjrp-coaching-pm` ganha a regra do **nome do épico** (`reference/epic-naming.md`: seis regras do mercado, as decisões da casa e uma lista de onze linhas, passa ou não passa; as linhas 8, 9 e 11 são julgamento). Nome que reprova é achado **P2** do juiz do PRD; **P1** se o épico é uma NFR disfarçada ou o nome é termo técnico ou de layout. A forma (um verbo no infinitivo, uma capacidade de uma pessoa, uma ação, de 3 a 9 palavras e até 70 caracteres) é **decisão da casa — decidido pelo agente, não aprovada pelo MJRP, revisável por ele, 2026-10-18**. O check da v8 não reprova nome fraco (forma e conteúdo são coisas distintas): quem julga é o juiz.
- O que reprovava continua reprovando; o que passava com uma tabela legível continua passando. Fica mais exigente só para a linha que a tela já não lia direito.

## O que o filho faz

1. `python3 mjrp-scripts/product_structure_check.py .` — cada `epic_name_missing` traz o arquivo e a linha. Escreva a linha como `| **EP-xx · nome** — texto |` (a forma que o harness usa) ou `| EP-xx · nome |`; se a tabela tem uma coluna com o nome, dê a ela o cabeçalho `Nome`.
2. Rode `python3 mjrp-scripts/conformance_check.py . --check-note CM-0069` e acrescente `CM-0069` a `conformance.applied`.
3. **Confira a tela**, não só o script: abra Tracking › Epics e compare os nomes com o PRD (passo novo em `reference/screen-check.md` da `mjrp-pdlc-bootstrap`, «A tela confere com o PRD e o grafo»: nomes e contagens do snapshot contra o PRD e o grafo).

4. **Os épicos cujo nome reprova a lista de onze linhas** da `mjrp-coaching-pm` (`reference/epic-naming.md`) se tratam **pela origem do nome**, não todos do mesmo jeito:
   - o nome que o próprio log ou o cabeçalho do PRD registra como **do agente** («decidido pelo agente», «proposta do agente» que ele não aceitou) é classe (a): renomeie na linha da tabela e no título `### EP-xx · nome` juntos (o ID, a âncora `^EP-xx` e a pasta ficam) e registre a troca como «decidido pelo agente, revisável pelo MJRP»;
   - **qualquer outro** — um nome que o MJRP aceitou («aceitos como estavam», a resposta dele no log) ou de que não há registro de quem decidiu — é conteúdo que ele decidiu, classe (c): **não renomeie**; faça **um lote de perguntas**, cada uma com dois nomes candidatos que passam a lista, a recomendação (é escolha de nome sobre conteúdo aprovado, não medida de resultado) e «por que o agente não podia». Renomeie só depois da resposta dele;
   - o épico que é uma NFR disfarçada vai à `mjrp-writing-reqs`, como regra, e não se renomeia.
   Nome de épico **novo** continua sendo proposto ao PM, com dois candidatos.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0069` sai 0 (o check é o `product_structure_check.py` da v8).

O passo 4 fecha com uma saída que um script lê, no arquivo do juiz da `mjrp-coaching-pm` escrito **depois** dos renomeios (`reports/audits/AAAA-MM-DD-<projeto>-content-mjrp-coaching-pm.md`, item `prd`): `grep -cE '^- \[P[12]\].*epic-naming' <esse arquivo>` imprime **0**, ou imprime exatamente o número de blocos `### P-` com `classe: c` que citam `epic-naming` e estão abertos (os nomes que esperam o MJRP) — e nenhum desses nomes foi renomeado. O juiz marca cada achado de nome com `epic-naming linha N` (a linha da lista que reprova).

## Quando não se aplica

No perfil `content` e no `meta`, e no `process_level: minimal`, como nas CM-0019 a CM-0028 e na CM-0058.
