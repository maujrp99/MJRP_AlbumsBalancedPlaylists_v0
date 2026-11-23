# Plan — Feature F93: Chaves para ligar e desligar features em produção, pelo CMS · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
O desenho inteiro está em `design/proposals/f82-cms/architecture-proposal.md` (§ 5, § 6.4, § 7, § 8.1, F-3, F-5, F-6, F-8), criticado por um agente separado (`reports/audits/2026-11-22-mjrpalbumblender-v0-cms-published-content-architecture-audit.md`); a decisão, na ADR-0024 (Proposed). O que vale para esta feature:

- **As chaves moram em `published/site`** (documento público, 16 KB): uma lista fechada, validada por um validador do núcleo (`shared/content`) que o Painel, o site e o **servidor** usam.
- **O que cada chave faz, e o que é «desconhecida»:**

| Chave | Esconde | Não carrega | Desconhecida (sem leitura e sem cópia que desligue) |
|---|---|---|---|
| `discogsValues` | valor, botão, aviso e atribuição do Discogs | o módulo de valores do inventário | o site pergunta ao servidor |
| `usageMeasurement` | nada visível | o adaptador do PostHog (já assim, F77) | segue a variável do build; o CMS só desliga |
| `portugueseForAll` | o seletor de idioma | o dicionário português para quem não pediu | fechada |

- **Um modelo para esconder e não carregar:** o registro das features (`public/js/features/registry.js`), só dados; desligada, nunca chama o `import()`; o encaixe na tela não desenha nem a caixa. Nenhuma lógica de feature no registro.
- **O servidor** passa a ler um documento público do Firestore (hoje não lê: muda uma linha de `tech-stack.md`, registrada na ADR-0024): leitura REST, cache de 60 s, prazo de 1,5 s, três estados (`on`, `off`, `unknown`). Na v1 nenhuma rota do servidor grava conteúdo.
- **Discogs: duas travas, uma autoridade.** O servidor liga só com a variável do serviço e a chave do CMS; o site pergunta ao servidor como hoje. «Para quem» fica em `DISCOGS_VALUES_FOR`.
- **O Discogs é o caro:** separá-lo do inventário mexe em cerca de oito arquivos de uma tela que migra para React (F83); até lá a chave esconde e a lista de exceções (que só encolhe) o registra.

## Delivery slices
As fatias são as da F82 (cada uma publicável sozinha e reversível); a F93 é dona de parte da 0 e da 2.

| Fatia | O que traz desta feature | O que pede antes | Ele faz |
|---|---|---|---|
| **0 · Alicerce** (só o que tem usuário já) | `shared/content` com o validador das chaves, **usado pelo servidor**; o servidor lê a chave do Discogs (duas travas, estado «desconhecido», espera na instância nova) | nada: sem React, sem o kit; o teste das regras da F82 (TASK-05) e as regras publicadas (F82 TASK-09) para o documento existir | liga a chave no console (sem Painel) |
| 1 · Textos | nada (é da F82); só o leitor do conteúdo, que esta feature reaproveita | a linha do React em produção e o kit | — |
| **2 · Chaves e página de entrada** | o registro das features ligado às telas (medição, Discogs, português); a seção de chaves do Painel; F-5 e F-6 | a fatia 1 da F82, a linha do React em produção e o kit do CMS (F332) | aceita o NFR-03 |
| 3 e 4 | nada | — | — |

## Technical Design
| Módulo | O que é | REQ |
|---|---|---|
| `shared/content/` (a F82 cria; aqui entra o validador das chaves) | a lista fechada, o tipo, o padrão de cada uma; sem Firebase nem `fetch` (`coreStaysPortable` cobre) | 05 |
| `server/lib/valueSources/valueSwitch.js` e `server/routes/values.js` | lê o documento público, cache de 60 s, prazo de 1,5 s, três estados, duas travas; o interruptor de hoje (`DISCOGS_VALUES`, `DISCOGS_VALUES_FOR`) continua | 02, 08 |
| `public/js/api/valueApi.js` | passa a entender «desconhecido» e não mostra o Discogs nele | 08 |
| `public/js/features/registry.js` (novo) | só dados: id, padrão, `import()` | 03, 09 |
| `public/js/services/content/` (F82) | o estado das chaves, a cópia que só desliga | 06, 07 |
| `public/js/screens/admin/` (F82) | a seção de chaves | 01, 02 |
| `public/js/app.js` | os módulos com chave e o Painel fora de `prefetchScreensAfterTheFirstScreen` | 09 |
| o inventário (os arquivos listados na pergunta em aberto da spec) | o Discogs atrás do registro | 03, 09 |
| `test/architecture/` | um sensor como `usageBehindThePort`: o módulo da função só pelo `import()` do registro, as exceções só encolhem (F-5); F-3 | 03, 09 |
| testes no navegador real | sem marca da função e sem pedido do arquivo (F-6); a leitura bloqueada (F-1) | 03, 09 |

## Dependencies
F82 (o CMS e a leitura do conteúdo; bloqueia; a peça de chave nasce no kit, F332 do harness), F75 (o Discogs e o interruptor de hoje), F83 (React no site: carga sob demanda por tela), F77 (a medição).

## Documents Consulted
`design/proposals/f82-cms/architecture-proposal.md`; `server/lib/valueSources/valueSwitch.js`, `public/js/api/valueApi.js`, `docs/specs/features/F75-*`, `F82-*`, `docs/specs/arch.md`, `docs/specs/tech-stack.md`; a decisão do MJRP de 2026-11-22 em `docs/log.md`.
Declarações: `docs/specs/tech-stack.md` (a linha do servidor que lê um documento: depois da aceitação da ADR-0024), `arch.md` (o registro das features), `behavior.md` e `data-model.md` (`published/site`): atualizados no fecho.

## Risks & Considerations
- **Dois interruptores do Discogs discordam:** resolvido no desenho (duas travas; só liga com as duas); a variável fica como corte de emergência.
- **O servidor não consegue ler a chave:** responde «desconhecido», nunca «desligado» nem «ligado» (nada calado); o Painel diz «não foi possível ler».
- **A medição perderia a primeira tela de todo visitante novo** se «sem leitura» a fechasse: por isso a exceção do REQ-07.
- **Uma feature recém-ligada aparece um instante depois** (na leitura nova), não na primeira tela: custo aceito pelo MJRP, em troca de «tirar de produção» funcionar na hora para todos.
- O NFR-03 é proposta do agente; sem a aceitação do MJRP não vira regra para as outras features.
- Separar o Discogs do inventário mexe em muitos arquivos de uma tela que já muda na migração para React (F83).
