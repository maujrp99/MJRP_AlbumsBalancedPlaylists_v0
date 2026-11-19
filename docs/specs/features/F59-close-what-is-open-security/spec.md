---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-15", "UAT-16", "UAT-28", "UAT-199", "UAT-25"]
planned_for: "[[ROADMAP#^REL-40]]"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F59: Fechar o que está aberto: banco, servidor e chaves
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** O que estava aberto fica fechado: as regras do banco no repositório fecham cada dado no seu dono e são a fonte do que é publicado; o servidor de produção sai sem rotas de depuração e com a IA paga atrás de login e de um limite; a volta do login do Spotify é conferida; o site publicado não entrega o código-fonte.

**Por quê:** O cruzamento com os relatórios anteriores achou que isso é mais grave que tudo no plano da v5.0. A conferência de 2026-11-19 mostrou o tamanho real: em produção as regras do banco já estavam fechadas (aberto estava o arquivo do repositório); as rotas de depuração e a IA paga estão abertas de fato.

**Como saber que funcionou:** Um pedido sem login ao ranking de outra pessoa é recusado; as rotas de depuração respondem 404 em produção; `/api/generate` sem login é recusado; uma volta do Spotify que não bate é recusada.

## Problem Statement
Decisão do MJRP de 2026-11-19: tudo entra na v5.0, cada feature pronta e testada vai para produção sozinha; e «Siga a sua prioridade», com a segurança em primeiro. Origem: `reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`, seção B.

## Fatias (cada uma vai para produção sozinha)
- **A. Só o site** — feita em 2026-11-19: arquivo de regras igual às regras em vigor e apontado pelo `firebase.json`; volta do Spotify conferida e segredos do aperto de mão vindos do gerador criptográfico; sair da conta encerra a sessão do Spotify; build sem mapas de código.
- **B. Servidor, sem mudar o app** — feita e publicada em 2026-11-19 (revisão `mjrp-proxy-00196-sj7`): rotas de depuração só com `ENABLE_DEBUG_ROUTES=true`; rota que quebra responde sem derrubar o servidor.
- **C. Servidor e app** — feita em 2026-11-19: as rotas pagas (`/api/generate`, `/api/ai/*`) só respondem a quem entrou com uma conta, 60 chamadas por hora por pessoa; as de trabalho (`/api/enrich-album`, `/api/playlists`) a qualquer pessoa logada, visitante incluído, 900 por hora. O app manda o login em toda chamada ao servidor, por um lugar só (`api/serverFetch.js`). **Decisão tomada pelo agente, revisável pelo MJRP:** visitante (login anônimo) não usa as rotas pagas; uma variável do servidor reabre isso.
- **D. Token do Discogs** — saiu desta feature em 2026-11-19, por decisão do MJRP, para a F59 poder fechar: é a F66.
- **E. Texto, endereços e conteúdo** — três partes.
  - **Texto, em produção desde 2026-11-19 (site `474f8cf`):** todo texto que vem de fora do código (nomes de álbum, faixa, artista, série, playlist e lote, mensagem de erro, endereço lido da URL, dados da conta) passa por uma função só, `escapeHtml` (`public/js/utils/stringUtils.js`), antes de entrar num HTML — 61 pontos em 20 arquivos; um nome como `<img src=x onerror=...>` aparece como texto e não cria elemento, e um nome com `&` continua aparecendo com `&`.
  - **Endereços, feito em 2026-11-19 no ramo `fix/f59-tailwind-local-and-url-schemes` (falta entrar na `main`):** um endereço que vem de um provedor ou de um registro guardado só vira link quando é da web (http ou https), por uma função só, `safeUrl` (`public/js/utils/safeUrl.js`), nos três lugares onde isso acontecia sem conferência: o selo do Spotify no cartão do álbum, o link da fonte no ranking consolidado e o botão que abre a playlist criada no Spotify.
  - **Tailwind servido do próprio site (UAT-25), feito em 2026-11-19 no mesmo ramo (falta a conferência visual no navegador, entrar na `main` e ir para produção):** o Tailwind é compilado junto com o site (3.4.19, pelo Vite; [[ADR-0021]], proposta); a página não carrega mais script de `cdn.tailwindcss.com` e a política de conteúdo não cita mais esse endereço. **Continua na política:** `'unsafe-inline'` em `script-src` e em `style-src` (o app ainda tem 6 manipuladores embutidos e estilos embutidos); tirar isso é outro trabalho.

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] O arquivo de regras do banco no repositório é a fonte do que é publicado e fecha cada dado pessoal no seu dono; nenhuma regra fica sem condição. · fixes UAT-15, UAT-199
  verified_by:: `test/security/firestoreRules.test.js`
- [REQ-02] A volta do login do Spotify que não bate com o pedido feito é recusada, e os segredos do aperto de mão vêm do gerador criptográfico. · fixes UAT-199
  verified_by:: `test/services/spotify/SpotifyAuthSafety.test.js`
- [REQ-03] Sair da conta encerra também a sessão do Spotify guardada no navegador. · fixes UAT-28
  verified_by:: `test/components/AuthNav.signout.test.js`
- [REQ-04] O site publicado não entrega mapas do código-fonte. · fixes UAT-199
  verified_by:: `test/security/buildHandsOutNoSource.test.js`
- [REQ-05] As rotas de depuração do servidor só existem com `ENABLE_DEBUG_ROUTES=true`; uma rota que quebra responde com erro sem derrubar o servidor. · fixes UAT-16
  verified_by:: `test/server/debugGate.test.js`
- [REQ-06] As rotas pagas do servidor só respondem a quem entrou com uma conta, com limite de chamadas por pessoa; as de trabalho, a qualquer pessoa logada, com limite próprio; sem conseguir conferir o login, ninguém passa. · fixes UAT-16
  verified_by:: `test/server/authGuard.test.js`
- [REQ-07] O app chama o próprio servidor por um lugar só, que junta o login a cada chamada. · fixes UAT-16
  verified_by:: `test/api/serverFetch.test.js`
- [REQ-08] Todo texto que vem de fora do código é tratado por uma função só antes de entrar num HTML: aparece como texto e não cria elemento. · fixes UAT-199
  verified_by:: `test/utils/escapeHtml.test.js`, `test/security/outsideTextIsText.test.js`, `test/architecture/outsideTextEscaped.test.js`
- [REQ-09] Um endereço que vem de fora do código só vira link (ou é aberto) quando é um endereço da web, http ou https, conferido por uma função só; um endereço recusado não chega à página. · fixes UAT-199
  verified_by:: `test/utils/safeUrl.test.js`, `test/security/outsideUrlIsChecked.test.js`, `test/architecture/outsideUrlChecked.test.js`
- [REQ-10] Os estilos do Tailwind são gerados quando o site é construído, a partir dos arquivos do próprio site; nenhuma página do site carrega script de estilos de outro endereço, e a política de conteúdo não autoriza esse endereço. · fixes UAT-25
  verified_by:: `test/architecture/tailwindBuiltWithSite.test.js`
- [REQ-11] Toda classe de estilo escrita no código do app tem a sua regra no CSS construído, inclusive as que o app monta na hora; o tema (fonte, cores da marca, gradientes) e as classes de componente são os mesmos de antes. · fixes UAT-25
  verified_by:: `test/architecture/tailwindBuiltWithSite.test.js`
## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
N/A: a feature não importa nenhum requisito (conserto de issues). Nenhum estado de tela novo. O que muda à vista: um visitante sem conta não recebe a lista de álbuns por IA (fatia C); um nome com sinais de HTML aparece como texto (fatia E); um endereço de fonte que não é da web vira um traço na tabela do ranking consolidado, e o selo do Spotify do cartão cai no endereço montado com o identificador (fatia E). A troca do Tailwind não deve mudar nada à vista: é o que a conferência no navegador julga.

## Prototype Parity (if the feature touches a screen)
- Prototype: none. Nenhuma tela foi redesenhada.
- Transversal layer touched: `public/index.html` (a casca: sai o script do Tailwind e a configuração embutida), `public/css/tailwind.css` e `tailwind.config.js` (os estilos utilitários de todas as telas), `public/js/utils/safeUrl.js` e `public/js/utils/stringUtils.js` (usados por várias telas).
- Design-system cuts or swaps: none. O projeto não tem `design-system.md`; o tema do Tailwind foi levado do `index.html` para o `tailwind.config.js` sem mudança.

## Success Criteria
<!-- One measurable item per acceptance criterion of the imported nodes. -->
- Um pedido sem login ao ranking de outra pessoa é recusado pelas regras do banco.
- As rotas de depuração respondem 404 em produção; `/api/generate` sem login responde 401.
- Uma volta do Spotify com `state` diferente do pedido é recusada.
- Nenhum arquivo `.map` no que é publicado.
- Uma série com nome `<img src=x onerror=...>` aparece como texto, sem imagem injetada.
- `safeUrl('javascript:alert(1)')` devolve `null`; o cartão e a linha do ranking desenhados com esse endereço não têm `href` com ele.
- `public/index.html` e o `dist/index.html` não contêm `cdn.tailwindcss.com`; o console do navegador deixa de avisar que o CDN do Tailwind não é para produção.
- Das 758 classes que o Tailwind acha no texto de `public/index.html` e de `public/js`, nenhuma falta no CSS construído; as 14 montadas na hora (cores da receita com `/10`) também estão lá.
- Suíte: 1002 testes passando (982 antes deste ramo); `npx vite build` compila e põe o CSS em `dist/assets/` (76,7 kB; 13,0 kB comprimido).

## Out of Scope
- O token do Discogs no repositório: é a F66.
- As chaves do Spotify continuam no armazenamento local do navegador (UAT-28): a F59 só as apaga ao sair da conta. Tirar de lá, ou aprovar o padrão na constituição, é decisão do MJRP.
- `'unsafe-inline'` continua em `script-src` e em `style-src`. Para sair de `script-src` é preciso trocar 6 manipuladores embutidos (`router.js:194`, `DiscographyToolbar.js:92` e `:109`, `BlendingMenuView.js:418` e `:421`, `AlbumCascade.js:65`); para sair de `style-src`, os estilos embutidos no código.
- A política de conteúdo continua numa `<meta>` do `index.html`; o `firebase.json` não manda cabeçalhos de segurança.
- A fonte Syne continua vindo do Google Fonts.
- Quatro páginas soltas que não fazem parte do site publicado ainda carregam o Tailwind do CDN quando abertas no servidor de desenvolvimento: `public/typography-preview.html`, `public/static_prototype_v3.html`, `public/debug-curator.html`, `public/legacy/hybrid-curator.html`.
- Endereço de imagem (`img src`) vindo de provedor não passa pela `safeUrl`: imagem não roda como código, e a política `img-src` da página a segura.
- O identificador do BestEverAlbums entra sem codificação no endereço do selo (`Card.js`); o endereço é fixo em `https://www.besteveralbums.com/`, então o pior caso é um parâmetro a mais numa página de fora.
- Classes com forma de Tailwind que nunca tiveram regra (o tema nunca definiu `accent-primary`, `surface`, `muted`, `gray-750`, `border-3` nem as animações `animate-fade-in` e parecidas) continuam sem regra: o CDN também não as gerava.
- Subir para o Tailwind 4: outra decisão, com conferência visual de todas as telas.
- `Card.renderRankingBadge` continua acima do limite de complexidade 10 (17, de antes): é da F58.

## Open Questions
<!-- ALL resolved before Plan. -->
- **Visitante (login anônimo) usa as rotas pagas?** Não — decidido pelo agente em 2026-11-19, revisável pelo MJRP; uma variável do servidor reabre.
- **O Tailwind fica?** Fica, compilado junto com o site — proposto pelo agente na [[ADR-0021]] (2026-11-19), à espera do aceite do MJRP. A constituição (Art. II) diz «Tailwind only if requested»; a ADR é o registro que faltava.
- **A linha `@apply` de `public/css/tech-theme.css` (`.tech-btn`) nunca teve efeito e foi removida, para o botão não mudar — decidido pelo agente em 2026-11-19, revisável.** Se a intenção era o botão ganhar aqueles estilos, é uma mudança de aparência a pedir.
