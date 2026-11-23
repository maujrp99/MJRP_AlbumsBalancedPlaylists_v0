# Plan — Feature F92: Algoritmos de mistura criados e gerenciados no CMS · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
O desenho inteiro está em `design/proposals/f82-cms/architecture-proposal.md` (§ 6.5, § 8, F-7, F-10, F-12, F-13), criticado por um agente separado (`reports/audits/2026-11-22-mjrpalbumblender-v0-cms-published-content-architecture-audit.md`); a decisão, na ADR-0024 (Proposed). O que vale para esta feature:

- **«Criar um algoritmo» é compor por blocos** (decidido): fonte do ranking, sentido, pular, pegar, exclusão por duração e agrupamento, nos limites do REQ-06. Não é um módulo de código que o CMS liga.
- **Um motor só.** O intérprete **não** é reescrito em `shared/`: o motor de `public/js/algorithms/` (`TopNAlgorithm` e as estratégias de `ranking/`) ganha os parâmetros dos blocos, e as três receitas «Top N» do código passam a ser definições fixas no mesmo vocabulário. O validador da definição (só dados) mora em `shared/content`. Mover o motor para `shared/` fica para quando o app precisar dele.
- **O catálogo de receitas** junta as receitas do código e o documento publicado (`published/recipes`, no máximo 64 KB) num modelo só; a tela de Blend e o painel de gerar de novo desenham sempre o catálogo e não importam `algorithms/index.js`. Sem documento, o catálogo é o código. É lido sob demanda, ao abrir o Blend (prazo de 3 s, sem nova tentativa; falhou, valem as receitas do código).
- **O que é dado e o que fica código:** é dado o que o dono muda (visível, ordem, recomendada, aparência de `recipeLooks.js`, ingredientes de `recipeIngredients.js`, nome e descrição, as definições por blocos); fica código a receita equilibrada do MJRP, o motor, e o selo «recomendada» como texto único da tela.
- **Playlist guardada:** as faixas nunca mudam; ids de receita nunca reaproveitados nem apagados.
- **A popularidade do Spotify** alimenta as duas receitas novas; fechar a escrita de convidados nela é pré-requisito da fatia 4 (REQ-08), seguro por teste.

## Delivery slices
As fatias são as da F82 (cada uma publicável sozinha e reversível); a F92 é dona das de número 3 e 4.

| Fatia | O que traz desta feature | O que pede antes | Ele faz |
|---|---|---|---|
| 0 · Alicerce | só o caso do emulador que lista a escrita de convidados em `spotify_enrichment/` como exceção que só encolhe (F-13) | a TASK-05 da F82 | — |
| 1 e 2 | nada (são dos textos, das chaves e da página de entrada) | — | — |
| **3 · Receitas: aparecer e configurar** | o catálogo no Blend e no «gerar de novo»; a seção de receitas do Painel (visível, ordem, recomendada, aparência, ingredientes); o selo único; F-7 | a fatia 1 da F82 (o Painel e a leitura do conteúdo), a linha do React em produção e o kit do CMS pelo harness (F332) | — |
| **4 · Receitas por blocos** | o motor generalizado, as «Top N» como definições fixas e a equivalência (F-12), o construtor e a prévia, «Deep cuts» e «As menos ouvidas», os limites (F-10) | a fatia 3 e a escrita de convidados em `spotify_enrichment/` fechada (F-13 verde) | publica as regras que fecham essa escrita |

## Technical Design
| Módulo | O que é | REQ |
|---|---|---|
| `shared/content/` (a F82 cria; aqui entra o validador de receita) | a definição de receita por blocos, só dados: o vocabulário e os limites do REQ-06; sem Firebase nem `fetch` | 06 |
| `public/js/algorithms/TopNAlgorithm.js` e as três receitas «Top N» | o motor generalizado (sentido, pular, pegar, exclusão); as «Top N» viram definições fixas em código | 05, 04 |
| `public/js/algorithms/recipeCatalog` (novo) | o catálogo: código mais documento publicado, executa sempre pelo motor | 02, 03, 07 |
| `public/js/screens/blend/` e `screens/playlists/RegeneratePanel.tsx` (linha do React) | passam a desenhar o catálogo; o selo único; «gerar de novo» com receita escondida | 03, 07 |
| `public/js/screens/admin/` (F82) | a seção de receitas e o construtor, com a prévia | 01, 02, 09 |
| `firestore.rules`, `test/security/` | o fechamento da escrita de convidados em `spotify_enrichment/` e o caso F-13 | 08 |
| `test/architecture/` | F-7 (a tela não importa `algorithms/index.js`), F-10 (receita limitada), F-12 (equivalência), o teste do catálogo que falha com a exceção de popularidade | 03, 05, 06, 08 |

## Dependencies
F82 (o CMS e a leitura do conteúdo; bloqueia), F93 (a mesma leitura de `published/*` e o mesmo Painel), F81 (os nomes e descrições nos dois idiomas), F83 (as telas de Blend e de gerar de novo em React). A F332 do harness (o kit).

## Documents Consulted
`design/proposals/f82-cms/architecture-proposal.md`, `proposal.md`, `prototype.html`; `public/js/algorithms/index.js`, `public/js/components/blend/BlendRecipeCard.js`; `docs/specs/features/F82-*`, `F93-*`; `docs/specs/constitution.md` (V.13); a decisão do MJRP de 2026-11-22 em `docs/log.md`.
Declarações: `docs/specs/data-model.md` (`published/recipes`), `arch.md`, `behavior.md` (a tela de Blend configurável) e `info-arch.md`: atualizados no fecho.

## Risks & Considerations
- **Um algoritmo definido por dados precisa de blocos que cubram o que o MJRP imagina**; se não cobrirem, volta a ser código.
- **Duas fontes da verdade para o motor** se houvesse dois intérpretes: por isso um motor só e a equivalência de cada «Top N» com a sua forma em blocos (F-12).
- **A popularidade falsa de um convidado** enviesaria as receitas novas (R11 da proposta, aberto): a fatia 4 só sai com a escrita fechada.
- **«Faixa sem dado fica fora»** pode mudar uma faixa de uma receita de hoje: a diferença é listada e vai a ele antes de mudar.
- A tela de Blend já existe em React na linha de migração; a fatia 3 espera essa linha chegar à produção.
