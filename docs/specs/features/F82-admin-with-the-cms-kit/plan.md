# Plan — Feature F82: Um admin para o site, com o CMS-kit do MJRP · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
O desenho inteiro, com os riscos, as opções e as vistas, está em `design/proposals/f82-cms/architecture-proposal.md` (criticada por um agente separado: `reports/audits/2026-11-22-mjrpalbumblender-v0-cms-published-content-architecture-audit.md`, pode ir, 0 P0, 9 P1 respondidos); a decisão, na ADR-0024 (Proposed, aceita o MJRP). Em resumo:

- O conteúdo publicado mora no Firestore, em `published/*` (`site`, `texts_en`, `texts_pt`, `recipes`), só o que difere do código; o código continua a reserva. O dono grava pelo Painel; o site lê ao abrir, sem esperar, com uma cópia no navegador (até 30 dias; só pode desligar chaves; some quando o documento some).
- **Quem grava:** só quem tem o registro `cmsAdmins/{uid}`, criado por ele no console, com login que não seja anônimo; `cmsWork/*` guarda as aprovações do português e quem salvou. Nenhum identificador dele no repositório.
- **Três barreiras** (REQ-06): o Painel, as regras, o leitor de cada visitante. O mesmo validador (`shared/content/`, núcleo puro, sem Firebase nem `fetch`) serve ao Painel, ao site, à página de entrada e ao servidor.
- **O Painel** é uma rota do mesmo app (`/admin`), carregada sob demanda e fora da pré-carga; antes de baixar o arquivo, a rota lê o registro do administrador. Um adaptador junta os dicionários de um arquivo por idioma com os pares `{pt, en}` do kit; os textos do próprio Painel vão no dicionário, numa área `admin.*`.
- **A leitura do site:** o `t()` ganha as camadas publicado > dicionário do código > inglês do código e uma versão dos textos que faz as telas se redesenharem (`public/js/i18n/t.js`, `public/js/react-bridge/useLocale.ts`).
- **A página de entrada** (fatia 2): leitor depois do `load`, validador do núcleo, `textContent`, conferência de endereços, política de `splash.html` nova (REQ-11).
- **A rede de segurança:** `previous` e `rev` na mesma gravação (REQ-08); a publicação do site lista os textos vivos que o novo build recusa.

## Delivery slices
Cada fatia é publicável sozinha e reversível (cada uma pelo histórico do Hosting ou a revisão do Cloud Run; o conteúdo, apagando o documento; as regras, pela versão anterior no console). Nada da fatia 0 fica sem importador: o catálogo, o registro, o adaptador e os validadores de texto e de receita entram **com a fatia que os usa**.

| Fatia | O que traz | O que pede antes | Ele faz |
|---|---|---|---|
| **0 · Alicerce** (só o que tem usuário já) | o rascunho das regras (`published/*`, `cmsAdmins/*`, `cmsWork/*`, fechar `albums/`); o teste que as roda no emulador (REQ-07; com a ADR-0024 aceita e a linha em `tech-stack.md`); `shared/content` com o validador das chaves e o servidor lendo a chave do Discogs (F93) | nada: sem React, sem o kit | publica as regras; cria o registro `cmsAdmins/{uid}`; liga a chave no console |
| 1 · Textos | camadas do `t()` e versão; leitor no arranque; `/admin` com o Painel de textos e a revisão do português; validador de textos; adaptador; `previous` e `rev`; a conferência dos textos vivos na publicação | a linha do React em produção (F83: o `t()` e `useLocale` estão nela, não na `main`) e o kit do CMS pelo harness (F332) | revisa e aprova o português |
| 2 · Chaves e página de entrada | o registro das features ligado às telas; o leitor da página de entrada e a política de `splash.html` (F93 traz o registro) | a fatia 1 | aceita o NFR-03 (F93) |
| 3 · Receitas: aparecer e configurar | o catálogo no Blend e no gerar de novo (F92) | a fatia 1 | — |
| 4 · Receitas por blocos | o motor generalizado, o construtor, as duas receitas novas (F92) | a fatia 3 e a escrita de convidados em `spotify_enrichment/` fechada | publica as regras que fecham essa escrita |

Fatias 1 a 4 esperam duas coisas fora desta feature: a linha do React chegar à produção (a migração da F83 termina; até lá ela vive no canal de pré-visualização) e o kit do CMS chegar pelo harness (F332, ainda só em esboço lá). A fatia 0 não espera nenhuma.

## Technical Design
Os módulos novos e a quem pertencem (os de chaves e receitas estão no plano da F93 e da F92):

| Módulo | O que é | REQ |
|---|---|---|
| `shared/content/` (novo) | o formato e a versão de cada documento; o validador de texto contra a reserva inglesa; sem Firebase e sem `fetch` (`coreStaysPortable` sem exceção) | 06, 10, 11 |
| `shared/data/PublishedContentRepository` (novo) | os caminhos e o formato de `published/*`, `cmsAdmins/*`, `cmsWork/*`; recebe de fora a função de ler e a de gravar | 06, 07, 08 |
| `public/js/repositories/` (o lado do site) | o único lugar do site que fala com `published/*` | 10 |
| `public/js/services/content/` (novo) | o leitor: camada publicada, cópia no navegador, estado «publicado, cópia, código» | 10 |
| `public/js/i18n/t.js`, `public/js/react-bridge/useLocale.ts` | camadas e versão dos textos | 10 |
| `public/js/screens/admin/` (novo) | o Painel, só por `import()` do `app.js` | 01, 09 |
| `public/splash/` (`lang.js`, o leitor novo, `splash.html`) | a leitura da página de entrada | 11 |
| `firestore.rules`, `test/security/` | as regras e o emulador | 06, 07 |
| o script de publicação do site | lista os textos vivos que o novo build recusa | 06 |

Sensores que esta feature toca: `noDeadModules`, `coreStaysPortable`, `firestoreBehindRepositories` (também `firestore.googleapis.com`), `scripts/bundle-budget.json` (+2.000 B declarados; o Painel 0 B no pacote de todos).

## Dependencies
- **A F332 do harness** («o kit do admin passa a morar no harness e vai aos filhos», S-253 de lá; registrada em esboço, ainda não priorizada): o V0 não copia a pasta do kit. Pedidos do projeto ao kit: o adaptador para dicionários de um arquivo por idioma e os papéis com super administrador (REQ-05). O passo «publicar» com rascunho **não** é pedido: ele decidiu que salvar publica.
- A F83 (React no site): o `t()` e `useLocale` na linha do React; `/admin` como rota. A F81 (o dicionário de textos, no formato de par pt/en).
- A ADR-0024 aceita pelo MJRP: o emulador das regras é tecnologia nova.
- A F93 e a F92 dependem desta feature e dividem a mesma leitura (`published/*`).

## Documents Consulted
- `design/proposals/f82-cms/architecture-proposal.md`, `proposal.md` e `prototype.html` (o Painel aprovado como direção); `reports/proposals/2026-11-22-mjrpalbumblender-v0-cms-framing.md`; o relatório de crítica da arquitetura; `docs/log.md` (as decisões de 2026-11-22).
- O kit: `/Users/maujrp/mjrp/projects/MJRPpersonal/src/admin-kit/` (entrada `index.ts`; `ports.ts`, `skin-contract.ts`, `schema.ts`, `example/`), regido pela ADR-0011 do MJRPpersonal; ADRs 0003, 0008, 0009, 0013 e 0015 de lá.
- `docs/specs/constitution.md` (V.1, V.5, V.6, V.9, V.14, III.3, III.5, III.7), `tech-stack.md`, `arch.md`.
- Declarações: `docs/specs/tech-stack.md` (a linha do emulador e a do servidor que lê um documento do Firestore: depois da aceitação da ADR-0024), `data-model.md` (as coleções novas), `arch.md`, `behavior.md` e `info-arch.md` (o Painel): atualizados no fecho.

## Risks & Considerations
- **Salvar publica, sem desfazer:** um erro vai a todos na hora; as três barreiras e o valor anterior reduzem, não eliminam (R4 da proposta).
- **As regras só valem quando ele as publica** (V.5): até lá a recusa dos convidados não está no ar, e o teste no emulador prova o rascunho, não a produção.
- **Duas fontes da verdade** (código e banco): o código é só a reserva; o Painel mostra «órfão» e «recusado pela versão atual» para não deixar divergência calada.
- **O custo de leitura do banco** cresce com as aberturas (cota gratuita perto de 20.000 por dia).
- As fatias 1 a 4 dependem de duas coisas que não são desta feature (a produção do React e o kit); se uma atrasar, só a fatia 0 anda.
