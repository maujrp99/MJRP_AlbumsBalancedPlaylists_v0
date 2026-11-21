---
id: CM-0077
item: prd
from: 1
to: 2
---
<!-- cópia carimbada do MJRP Harness · versão 2026-11-21 · fonte 61d4f2a91 · não edite aqui — edite no harness e rode `new_project.py --refresh-kernel` -->
# CM-0077 · prd@1 → prd@2

## Por que

Decisão do MJRP de 2026-10-19: **«o source of truth do conteúdo é o prd.md; a tela é apenas uma renderização organizada do prd.md»** (o `ROADMAP.md` também é fonte), e **«isso é canônico, o harness conformance precisa garantir isso também»**.

Nasceu de uma inconsistência: a tabela de épicos do PRD tinha uma coluna `Estado` com contagens escritas à mão («7/9 Done · 2 Backlog»). Elas resumem as stories que o próprio PRD embute (`![[S-…]]`) e ninguém as atualiza: o PRD do Control Center estava desatualizado em 3 dos 6 épicos. Uma contagem escrita à mão é uma segunda fonte, e a segunda fonte envelhece. O andamento de um épico se **lê** das stories que o PRD embute; nunca se escreve.

Na mesma nota, as **seis mudanças do modelo do PRD** que o MJRP aprovou («Sim, as seis», 2026-10-19), de uma pesquisa de modelos de PRD (as fichas estão em `docs/wiki/sources/`, citadas no guia da `mjrp-coaching-pm`): entram `## Dependências`, `## Desenho e protótipo` e `## Mudanças`; «Objetivo e métricas» vira `## Objetivo` e aponta para o ROADMAP (a medida tem uma fonte só); `## Entregue` sai, porque duplica o estado das stories embutidas — o mesmo problema da coluna `Estado`; `## Candidatos (Intake)` fica.

## O que muda

As cláusulas `contains` do item `prd` trocam: `## Objetivo` (só esse título), mais `## Dependências`, `## Desenho e protótipo` e `## Mudanças`; `## Entregue` deixa de ser exigida. E o item ganha uma cláusula, `prd_source_check.py`, com quatro achados:

- **`prd_epic_state`** — a tabela de épicos (a que abre com `Épico`/`Epic`) não tem coluna de estado (`Estado`, `Status`, `Progresso`, `Situação`) nem célula que traga o andamento escrito (`7/9 Done · 2 Backlog`, `Done`, `Em curso`); e nenhuma linha de épico (`EP-nn` em item de lista ou parágrafo da seção `## Epics`/`## Épicos`) carrega uma contagem escrita à mão (`11 de 11 stories Done`, `0/3 Backlog`).
- **`prd_node_not_embedded`** — todo nó de `docs/specs/requirements/` (story, caso de uso, EARS, NFR) está embutido no `prd.md` pelo **nome inteiro** do arquivo: `![[S-07-import-the-card-statement]]`. Embed pelo ID solto de um arquivo com slug não vale (é a regra `link_stem` do grafo). Um nó que existe e não está embutido é um achado: o PRD contém todos os requisitos.
- **`prd_epic_table_form`** — existe uma tabela de épicos na forma que o leitor do Control Center lê: o primeiro cabeçalho começa por `Épico`/`Epic` e cada linha dá o nome do épico como o leitor o acha (`| **EP-nn · nome** |`, `| EP-nn · nome |` ou `| EP-nn | nome |` sob um cabeçalho `Nome`). Uma tabela de linhas `EP-nn` sob outro cabeçalho (`ID`, `#`) a tela não lê; os épicos só em seções `### EP-nn` não montam a tabela.
- **`prd_delivered_section`** — o PRD não tem a seção `## Entregue`. O que está feito se lê do status das stories embutidas; antes de removê-la, o conteúdo tem de estar coberto por nós embutidos, e o que não estiver é achado para o PM, não se descarta em silêncio.

A forma que o modelo (`mjrp-coaching-pm`, `templates/prd.md`) passa a trazer: `| Épico | Serve |`, o épico em negrito `**EP-nn · nome**`; sem coluna de estado, de contagem nem de critério de saída (uma coluna a mais é permitida, desde que não seja estado nem contagem). O critério de saída mensurável de cada épico é a linha opcional `exit:: <o que se mede para dar o épico por saído>` logo abaixo do `serves::` da seção dele (decidido pelo agente em 2026-10-19, revisável pelo MJRP). As expressões não são uma lista nova: o check usa o `epic_identity` do `product_structure_check.py` (o espelho do leitor) e os padrões de nó e de embed do `requirements_graph_check.py`; o teste de compatibilidade do Control Center (`tests/compat/test_prd_source_of_truth.py`) amarra tudo ao leitor `prd.py`.

## O que o filho faz

Tudo **classe (a)** — conserto mecânico que se deriva da regra, decidido pelo agente e revisável pelo MJRP; registra a entrada do log com o sufixo ` — decidido pelo agente, revisável pelo MJRP`.

1. `python3 mjrp-scripts/conformance_check.py . --gaps` — e `python3 mjrp-scripts/prd_source_check.py .` lista cada achado com arquivo e linha.
2. **Estado na tabela de épicos:** apague a coluna inteira (cabeçalho, separador e a célula de cada linha). Se há uma coluna `Critério de saída`, o texto dela vai para a linha `exit::` da seção do épico (ver o passo 4) e a coluna sai também. Nada a recalcular: a tela mostra o andamento das stories. Se a célula dizia algo que não é contagem (um aviso, «entregue (a categoria, S-61, em backlog)»), o texto é conteúdo: leve-o para a prosa do épico (ou para a story) antes de apagar a coluna, não o perca.
3. **Nó não embutido:** abaixo do `### EP-nn` do épico dele (a pasta do nó é a `folder::` do épico), acrescente `![[<nome inteiro do arquivo>]]`; um NFR vai em `### Transversais`. Um nó que a tela mostra como cancelado ou adiado também se embute: o PRD tem tudo.
4. **Tabela que a tela não lê** (por exemplo um PRD que só tem seções `### EP-nn`, uma **lista** de épicos com contagens, como `- EP-01 · nome · serve OUT-01 · 11 de 11 stories Done · saída: a Medida do OUT-01`, ou uma tabela com cabeçalho `ID`): a lista é **substituída** pela tabela (não convivem), sem as contagens; o «saída: …» de cada item vai para a linha `exit::` da seção do épico, ou é descartado quando só repete a Medida do resultado que o épico serve («saída: a Medida do OUT-01» não diz nada que o `serves::` já não diga). Monte a tabela de épicos a partir das seções que já existem — `| Épico | Serve |`, uma linha por épico, `**EP-nn · nome**` com o **mesmo nome do título da seção** e o resultado em `Serve` (o mesmo `serves::` da seção). O critério de saída que o PRD já escreve para o épico (ou o que estava numa coluna `Critério de saída` apagada) vai para a linha `exit::` da seção, abaixo do `serves::`; se o épico não tem critério, não se inventa um (conteúdo dele, classe (c)).
5. **As três seções novas** (`## Dependências`, `## Desenho e protótipo`, `## Mudanças`): acrescente cada uma no lugar do modelo; **vazia vale** (uma linha «nenhuma conhecida» ou «a desenhar»). Se o projeto já tem o protótipo aprovado, ligue-o e ao `info-arch.md` em `## Desenho e protótipo`.
6. **`## Objetivo e métricas` → `## Objetivo`:** renomeie o título e deixe o texto dizer o objetivo e apontar para o ROADMAP; uma tabela de medidas que repete as do ROADMAP sai daqui (a medida tem uma fonte só). Se o PRD mantém uma tabela `Medida | Alvo | Quem mede` que a tela lê e que não está no ROADMAP, é conteúdo do PM: pergunte (classe (c)), não apague.
7. **`## Entregue` sai, depois de conferido:** para cada item da seção, ache o que o cobre. **Coberto** é: as stories que o entregaram estão embutidas no PRD (status Done ou Accepted), ou uma feature Done as importa (`imports:`) e as stories dela estão embutidas — uma **feature sozinha não é nó embutido** e não cobre nada. O que está coberto, apague com a seção. O que **não** está coberto (capacidade anterior ao backlog, sem story, ou só com a feature) não se descarta em silêncio: guarde o texto em `_archive/AAAA-MM-DD-prd-entregue/entregue.md` (nada é apagado sem cópia), cite o caminho em `## Mudanças` e registre o achado no relatório do conform para o PM decidir se vira story Done retroativa.
8. Commit por pathspec; acrescente `CM-0077` a `conformance.applied`.

## Prazo

O item `prd` mantém o `since` de 2026-10-17, mas a carência de **30 dias conta do dia em que o filho recebe a v2** (`--refresh-kernel` grava `received: prd@2`); só o filho que nunca recebeu conta de 2026-10-17. Dentro da carência o achado é aviso; o doctor não fica vermelho de imediato.

## Como se confere

`python3 mjrp-scripts/conformance_check.py . --check-note CM-0077` sai 0 e `--gaps` não lista `prd`. A tela do Control Center lê a tabela sem a coluna `Estado` (sem selo «o PRD diz…») e o andamento de cada épico vem das stories.

## Quando não se aplica

Projeto `content` ou `meta` (o harness raiz é `meta`): o item `prd` vale para o `code-app` em `standard` e `full`. Um PRD sem `docs/specs/requirements/` (nenhum nó) não tem o que embutir: só a tabela de épicos é julgada.
