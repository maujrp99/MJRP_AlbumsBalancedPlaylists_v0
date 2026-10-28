---
type: architecture-audit
subject: "arch.md, data-model.md, tech-stack.md, constitution.md e ADR-0015…0018 contra o código do v0 (Brownfield, em produção)"
project: MJRP_AlbumsBalancedPlaylists_v0
moment: drift
judged: "2026-10-28 12:31"
who_judged: separate-agent
verdict: ordered-cut
p0: 1
p1: 11
p2: 5
hygiene_notes: 4
human_decisions: 5
status: open
supersedes: "none"
---

# Architecture audit — documentos de arquitetura do v0 contra o código · 2026-10-28 12:31 (nova passada após a correção dos documentos; primeira passada: 12:19)

> Momento: deriva / Brownfield (o produto está em produção; o que está fechado não é re-julgado quanto ao aceite — julga-se se os documentos dizem a verdade sobre o código e se as regras aprovadas estão sendo cumpridas)
> Objeto: `docs/specs/arch.md`, `docs/specs/data-model.md`, `docs/specs/tech-stack.md`, `docs/specs/constitution.md`, `docs/decisions/0015…0018-*.md`, contra `public/js`, `server/`, `shared/`, `firestore.rules`, `firebase.json`, `cloudbuild.yaml` (somente leitura) · Critérios: as regras técnicas de architecture-review (IDs com nome), engineering-canon, `PRINCIPLES.md`, `constitution.md` e as ADRs `Accepted`
> Quem julgou: agente separado — recebeu a skill `mjrp-critiquing-architecture`, os artefatos e o código; não participou da escrita dos documentos (pacote B do conform). Nada foi executado (nem testes, nem doctor); tudo é leitura de arquivo, e cada `arquivo:linha` abaixo foi lido na linha.
> Não conferido: `docs/specs/info-arch.md` (não existe), `VISION.md` e `docs/specs/prd.md` (fora do eixo técnico desta passada), `MEMORY.md` (só a linha *Do Not Forget*: herdar o `PRINCIPLES.md`). Não executei `npm test` do servidor: a afirmação «falha no 1º arquivo» do autor fica sem confirmação por execução (ver achado 11).
> Checador do harness: `python3 mjrp-scripts/conformance_check.py . --check-note CM-0011` → «CM-0011 (arch-critique@0→1): passou» (o item `arch-critique` pede ≥ 1 arquivo `reports/audits/*architecture-audit*.md`). `python3 mjrp-scripts/report_types_check.py .` → VERDE, 0 erro: este relatório conta como 1 de 1 com tipo da lista (`architecture-audit`, com `status: open`). O único aviso do checador é do parecer `reports/harness-feedback/2026-10-28-mjrpalbumblender-v0-checks-pass-untouched-templates.md` (nome sem o segmento `mjrp_albumsbalancedplaylists_v0`: o `project_slug` do harness não aceita o `_` da pasta); este relatório fica em `reports/audits/`, que não tem regra de nome de projeto, e não dispara aviso. Não é daqui consertar o checador.
> Auditoria anterior: nenhuma. O mapa do V1 (`MJRPalbumblender-v1/reports/audits/2026-10-27-…-project-bootstrap-report.md`) foi usado só para localizar; nenhuma âncora foi copiada sem reler a linha.
> Sem arquitetura-alvo: as camadas são **as declaradas em `arch.md`** (View → Controller → Service → Repository), medidas contra o código.

## Veredito

**Recorte em ordem — continua sem passar: P0 1, P1 11, P2 5 (1 achado fechado: o 3).** Nova passada às 12:31, depois que o autor dos documentos corrigiu `arch.md`, `data-model.md`, `tech-stack.md` e `constitution.md` (git diff relido, âncoras novas reconferidas no código; ver *Nova passada*). **Os documentos agora dizem a verdade nos pontos que eu havia apontado como falsos**: o projeto Firebase é `mjrp-playlist-generator`, a tabela de quem lê e escreve cada coleção traz as regras abertas, a fronteira do Firestore, a direção das dependências, a migração que não executa, o corte de 20 séries, a falha que vira vazio, as duas receitas de implantação e o Node 18 estão escritos, cada um com a regra e o ponteiro «Conserto: achado N». Por isso os P0 que eram «documento falso» caem: o achado 3 fecha, e o achado 2 (regras abertas) deixa de ser P0 de documento e fica como defeito de código aberto (P1 pela tabela da skill, MA-05; violates:: Constituição Art. V), **sem dobrar a regra**.

**O P0 que sobra é de código e é regra do cânone:** VT-06 SDK de terceiro no domínio (achado 1). O veto não cai por o documento ser honesto: o código ainda importa o SDK do Firestore em `PlaylistsService.js:17`, `stores/albums.js:9` e `SaveAllView.js:5-6`. Caminho: correção (item de Fix, `violates:: PRINCIPLES §I.3, ADR-0017`); nenhuma exceção pedida.

P1 por tema, em ordem de custo de mudança: **regras abertas e superfície** (2, 9, 10), **fronteira do dado e direção das dependências** (4, 5), **falha silenciosa e caminhos mortos** (6, 7, 8), **regras sem sensor e implantação** (11, 12), **ciclo de vida do dado** (13). O que ainda está falso ou impreciso nos documentos é pouco e vai em *Higiene* (a frase da constituição de que o `localStorage` «passa por» `StorageService`). A lista de dívidas do autor (§ e do pacote B) é **verdadeira em 12 dos 15 itens** (três incompletos), 1 parcial (o 3), 1 falso (o 10, agora corrigido nos documentos), 1 obsoleto (o 15); a seção *Auditoria das dívidas do autor* segue como estava.

## Vetos

| Veto | Resposta | Evidência (uma linha) |
|---|---|---|
| VT-01 banco compartilhado | passa | Um só armazenamento (Firestore) e um só escritor de aplicação: o servidor não tem nenhum import de Firebase/Firestore (grep em `server/` sem resultado; `shared/` só tem `services/AuthService.js` com `firebase/auth`, que o servidor não importa). A abertura das regras sobre coleções globais é MA-05 (achado 3) e ciclo de vida (achado 13), não VT-01. |
| VT-02 cadeia síncrona sem timeout | passa | Timeouts no servidor: Gemini 60 s (`server/lib/aiClient.js:10`), raspador 30 s (`server/lib/scrapers/besteveralbums.js:8-9`), com degradação: Spotify e IA no fallback (`server/lib/fetchRanking.js:162-204`), `trackRatings` nulos em `/enrich-album` (`EnrichmentService.js:99-104`). Sem circuit breaker e com `fetch` do cliente sem timeout (`public/js/api/client.js:207`): vai no achado P2 17, não é veto. |
| VT-03 mensageria sem DLQ | não se aplica | Não há fila nem mensageria. |
| VT-04 sem traces | não se aplica | Um só processo de servidor atrás do cliente; sem chamada serviço-a-serviço. A falta de observabilidade em operação entra em IV-08 (achado 6) e SN-07. |
| VT-05 mutação destrutiva de schema | não se aplica | Nenhum contrato muda hoje; `data-model.md` §Migration Notes: «Não há migração em andamento». |
| VT-06 SDK de terceiro no domínio | **viola** | `public/js/services/PlaylistsService.js:17` (`writeBatch`), `public/js/stores/albums.js:9,273,312,315` (`getDocs`/`setDoc`/`addDoc`) e `public/js/views/SaveAllView.js:5-6` (SDK 11.6.1 por CDN) — fora de `repositories/`. O domínio de verdade (algoritmos, modelos, ranking, `shared/curation.js`) está limpo: grep de `firebase`, `document.`, `window.`, `localStorage` nessas pastas sem resultado. |

## Achados

| # | Regra | Sev | O achado, em uma linha | Dono |
|---|---|---|---|---|
| 1 | VT-06 SDK de terceiro no domínio · IV-03 Dependency Rule | P0 | **Código aberto:** Firestore importado por um Service, uma Store e uma View; trocar o banco mexe em ≥ 10 arquivos, não em um. Documento corrigido. | mjrp-implementing-tasks · corrigir agora |
| 2 | MA-05 Modelagem de ameaças (superfície escrita) | P1 (era P0) | **Código aberto:** `firestore.rules:35` `allow read, write: if true`; `/albums` e `spotify_enrichment` abertos a qualquer login anônimo. Documento corrigido (tabela em `arch.md` §Infrastructure). | mjrp-designing-architecture + mjrp-implementing-tasks · corrigir agora |
| 3 | MA-05 Modelagem de ameaças · AD-06 (origem) | fechado (era P0) | Os dois documentos nomeavam o projeto Firebase `mjrp-albums`; o código carrega `mjrp-playlist-generator`. **Corrigido** em `arch.md` e `data-model.md`. | mjrp-syncing-docs · feito |
| 4 | IV-03 Dependency Rule | P1 | A direção «View → Controller → Service → Repository» não vale: 3 controllers falam com Repository, 3 views/componentes pegam o `db`, uma Store importa o `app.js`. | mjrp-implementing-tasks · corrigir agora |
| 5 | AD-14 Restrições respeitadas (deriva do marco) | P1 | 4 das 6 Stores não são puras (ADR-0017 e Padrão «Store» da constituição); `playlists.js` está em 161 linhas contra «abaixo de 150». | mjrp-implementing-tasks · corrigir agora |
| 6 | IV-08 Sem falha silenciosa | P1 | Exclusão do inventário chama método que não existe, e a migração convidado → usuário tem três defeitos independentes; o handler global só faz `console.error`. | mjrp-debugging · corrigir agora |
| 7 | IV-08 Sem falha silenciosa | P1 | No servidor, falha de leitura volta como vazio com 200: `/enrich-album`, `/ai/studio-albums`, e `loadPrompts()` que cai em `{}` sem aviso ao usuário. | mjrp-implementing-tasks · corrigir agora |
| 8 | DD-03 Volume e particionamento · IV-08 | P1 | A lista de séries é cortada em 20 sem paginação e sem sinal: a 21ª série «some». | mjrp-implementing-tasks · corrigir agora |
| 9 | MA-05 · RS-01 Contrapressão · MA-04 FinOps | P1 | Backend público sem autenticação nem limite de taxa, rotas de depuração montadas em produção (uma lista qualquer pasta do contêiner) e uma rota que injeta texto livre no prompt do Gemini pago. | mjrp-designing-architecture · corrigir agora |
| 10 | IV-11 Segredo zero no código | P1 | Token do Discogs escrito em 2 scripts rastreados; tokens do Spotify no `localStorage` sem o padrão BYOK que o §I.14 exige aprovado. | mjrp-implementing-tasks · corrigir agora; humano decide o alcance do §I.14 |
| 11 | GV-03 Guias são caros, sensores são baratos · SN-01 · SN-03 · IV-09 | P1 | Nenhuma regra de arquitetura tem sensor: lint não bloqueia, não há linter de dependência nem scanner de segredo, testes de curadoria apontam para arquivo inexistente. | mjrp-designing-architecture · corrigir agora |
| 12 | IV-05 ETC e DRY · RS-04 Runtime | P1 | Duas receitas de implantação do backend divergem (a do Cloud Build não copia `config/` nem marca o `shared/` como ESM) e o runtime é Node 18, fora de suporte. | mjrp-designing-architecture · corrigir agora |
| 13 | AD-04 Ciclo de vida do dado · DD-02 Concorrência | P1 | Coleções globais `/albums` e `spotify_enrichment` sem dono, validação nem purga; `albumQueries` é regravado por inteiro (último a gravar vence). | mjrp-designing-architecture · vigiar |
| 14 | CM-03 Evolução de schemas | P2 | `_schemaVersion` é gravado em tudo e lido em um lugar só; os contratos da API não têm teste. | mjrp-designing-architecture · vigiar |
| 15 | AD-14 Restrições respeitadas | P2 | «Flavor» ainda em 4 arquivos (7 ocorrências) contra a ADR-0015. | mjrp-implementing-tasks · corrigir agora |
| 16 | IV-02 SRP e módulo pequeno | P2 | 62 arquivos acima do alarme de 200 linhas (sinal, não regra); 27 singletons. | mjrp-assessing-code-quality · adiar |
| 17 | RS-02 Retries e proteção a jusante | P2 | Retentativa do cliente com espera fixa de 1 s, sem *jitter*, e a retentativa de `/generate` repete uma chamada paga. | mjrp-implementing-tasks · adiar |
| 18 | IV-05 ETC e DRY | P2 | Dois «AuthService» em camadas diferentes, 8 de 14 algoritmos sem uso, `window.albumsStore`/`router` expostos em produção. | mjrp-implementing-tasks · adiar |

### 1 · VT-06 SDK de terceiro no domínio · IV-03 Dependency Rule · P0
- **Âncora:** `public/js/services/PlaylistsService.js:17` (`import { writeBatch } from 'firebase/firestore'`) e `:243` (`writeBatch(this.db)`); `public/js/stores/albums.js:9` (importa `collection, doc, addDoc, updateDoc, setDoc, getDocs`), `:273` (`getDocs`), `:312` (`setDoc`), `:315` (`addDoc`); `public/js/views/SaveAllView.js:5-6` (SDK Firestore/Auth **11.6.1 pelo CDN `gstatic`**, enquanto o app usa o npm 10.14.1).
- **Evidência:** o adaptador declarado é o Repository (`constitution.md` «Padrões com endereço»; `PRINCIPLES.md` §I.3). Fora de `repositories/`, três arquivos importam o SDK de infraestrutura. Teste de troca (IV-03): hoje trocar a fonte de dados mexe em `BaseRepository` + 6 repositórios + `PlaylistsService` + `stores/albums.js` + `SaveAllView` + `MigrationUtility` + `firebase-init` ≥ 10 arquivos. O `albums.js` ainda carrega o contexto de `db` por parâmetro (`updateAlbum(db, album)`, chamado de `views/controllers/AlbumsStateController.js:137-139`).
- **Critério:** `PRINCIPLES.md` §I.3 (o teste: «um arquivo»); ADR-0017 («Stores … sem lógica, sem chamadas de API, sem efeitos colaterais»); `constitution.md` Padrão «Store Pattern». Violates:: ADR-0017, PRINCIPLES §I.3. Não é pedido para dobrar a regra.
- **Custo se ficar:** a próxima mudança de persistência (ou de regra de segurança) obriga a varrer a SPA inteira; o SDK de duas versões (10.14.1 e 11.6.1) é bundle duplicado e bug latente de estado de auth entre instâncias; a ADR-0017 `Accepted` deixa de ser verdadeira.
- **Check de aceite:** «Existe algum `import` de `firebase/*` ou `firebase-firestore` fora de `public/js/repositories/` e `public/js/firebase-init.js` (e do `AuthService` de integração)? S/N». Esperado N, e com um sensor (achado 11).
- **Dono · recomendação:** `mjrp-implementing-tasks`, *corrigir agora*. Item de Fix: mover `saveToFirestore`/`loadFromFirestore` da store `albums` e o `writeBatch` do `PlaylistsService` para os repositórios; reescrever `SaveAllView` sobre o repositório (ou retirá-lo, se é rota legada `/save-all`). Por que não a alternativa «emendar o artigo para permitir SDK no Service»: o `PRINCIPLES.md` §I.3 manda, e o custo de conformar é pequeno (a camada Repository já existe).

### 2 · MA-05 Modelagem de ameaças (superfície escrita) · P1 (era P0 — rebaixado às 12:31: o documento agora diz a verdade; o defeito de código segue aberto)
- **Âncora:** `firestore.rules:32-35` (`match /users/{userId}/albumRankings/{albumId}` … `allow read, write: if true;` com o comentário «DEBUG … Production Requirement: Change to `request.auth != null` before launch»); `:42-43` (`/albums/{albumId}` `request.auth != null`); `:49-51` (`/spotify_enrichment/{albumKey}` leitura e escrita por qualquer login). `public/js/services/AuthService.js:58` faz `signInAnonymously` para qualquer visitante, então «autenticado» não filtra ninguém. `arch.md` §Constraints «Segurança» e `data-model.md` §Persistence (rules «descritas no mapa do V1», que é outro repositório).
- **Evidência:** qualquer pessoa na internet, sem login, lê e escreve o ranking de qualquer usuário; qualquer visitante anônimo sobrescreve ou apaga documentos de `/albums` (todos os usuários compartilham) e envenena o cache global `spotify_enrichment`. O texto de `arch.md` diz que as regras «escopam o inventário, as séries e as playlists ao dono», verdadeiro e incompleto: omite as três exceções e promete segurança que o repositório não tem. O próprio arquivo de regras registra que a abertura era provisória («before launch»). E `firebase.json` não tem bloco `firestore`, nenhum pipeline do repositório publica `firestore.rules` (`ci-firebase.yml:73,120` só `--only hosting`; `scripts/deploy-prod.sh` idem): o que está em produção pode nem ser este arquivo.
- **Critério:** pela tabela da skill é P1 (MA-05). Na primeira passada estava em P0 porque o documento era falso por omissão; às 12:31 o documento diz a verdade (ver *Nova passada*), então o P0 cai e fica o defeito de código. Violates:: Constituição Art. V (config e estabilidade), IV-07 (atalho com «depois» sem custo nem dono). A regra continua valendo; o código é que deve mudar. Em produção, e com o comentário do próprio arquivo prometendo corrigir «before launch», recomendo tratar como o primeiro P1 a corrigir.
- **Custo se ficar:** adulteração e vazamento de dados de usuário a custo zero; envenenamento de um cache que todos leem; cobrança de leitura/escrita do Firestore sem teto.
- **Check de aceite:** «Alguma regra de `firestore.rules` tem `if true` ou aceita escrita a quem não é o dono do documento (ou a quem apenas está autenticado, nas coleções globais)? S/N». Esperado N. (O segundo check, «`arch.md` lista por coleção quem lê e quem escreve? S/N», já é S.)
- **Dono · recomendação:** o `arch.md` já traz a superfície por coleção (feito às 12:31); `mjrp-implementing-tasks` fecha as regras. A decisão de **quem** pode escrever em `/albums` e em `spotify_enrichment` (só o servidor, que hoje não toca o Firestore? só o dono do álbum?) é do humano — ver *Decisões do humano* 2. Por que não «adiar»: já é produção.

### 3 · MA-05 Modelagem de ameaças (superfície escrita) · AD-06 (origem) · FECHADO (era P0; corrigido em 12:31)
- **Âncora:** `arch.md` §Infrastructure «Database» («projeto Firebase `mjrp-albums` no SDK do app, `firebase-init.js:10`») e `data-model.md` §Persistence («projeto Firebase `mjrp-albums`, `firebase-init.js:10`»). Contra: `public/index.html:111` carrega `/js/firebase-config.js` como módulo, **antes** de `app.js:112`; `public/js/firebase-config.js:3-10` define `window.__firebase_config` com `projectId: 'mjrp-playlist-generator'`; `public/js/firebase-init.js:6` usa `window.__firebase_config ||` o bloco `mjrp-albums`, e esse bloco tem `apiKey: "API_KEY_PLACEHOLDER"` (`:8`), isto é, não funciona; `.firebaserc` e `scripts/deploy-backend.sh` (`PROJECT_ID="mjrp-playlist-generator"`), `scripts/deploy-prod.sh` (copia `firebase-config.js` para `dist/js/`) e o padrão de CORS em `server/index.js:58` (`https://mjrp-playlist-generator.web.app`) dizem o mesmo.
- **Evidência:** o projeto efetivo em produção, pelo código, é `mjrp-playlist-generator`; `mjrp-albums` é só o valor reserva (e o nome do segmento de caminho `artifacts/mjrp-albums/…` em `InventoryRepository.js:20` e `SeriesRepository.js:21`, uma constante literal, **não** o projeto). O manual `00_Deployment_and_Setup.md` estava certo; os dois documentos novos importaram o erro do mapa do V1 e a dívida 10 do autor o afirma («o app usa `mjrp-albums` … e `.firebaserc` aponta para o outro»): é o inverso.
- **Critério:** AD-06 (premissa verdadeira) é higiene; vira P0 aqui porque muda uma conclusão técnica — em qual projeto vivem os dados, as regras e o Auth. Quem lesse `arch.md` para publicar `firestore.rules` ou para apontar o v1 para os dados usaria o projeto errado.
- **Custo se ficar:** regra publicada no projeto errado; migração do v1 (mesmo esquema do Firestore) apontada para um projeto que talvez nem exista.
- **Check de aceite:** «`arch.md` e `data-model.md` nomeiam como projeto Firebase o mesmo `projectId` que `public/js/firebase-config.js` carrega? S/N», e «o segmento `artifacts/mjrp-albums` é descrito como constante de caminho e não como projeto? S/N». **Passada de 12:31: S e S** (`arch.md` §Infrastructure «Database» e Data Flow 4; `data-model.md` Convenções e Persistence). Fechado. Resta o Fix de código P2 de `firebase-init.js` (valor reserva que não funciona).
- **Dono · recomendação:** `mjrp-syncing-docs` corrige as duas frases (o `data-model.md` §Persistence e o `arch.md` §Infrastructure). Fix de código associado (P2): trocar o valor reserva de `firebase-init.js` por falha explícita quando a config não carrega (hoje cai num projeto que não funciona).

### 4 · IV-03 Dependency Rule · P1
- **Âncora:** `public/js/controllers/PlaylistsController.js:92,312,325,334` (`await import('../repositories/PlaylistRepository.js')`, `SeriesRepository.js`) e `:93` (`new PlaylistRepository(db, cacheManager, …)`); `public/js/controllers/SeriesController.js:22` e `BlendingController.js:22` (`userRankingRepository`); `public/js/views/SeriesView.js:16,68` (`import { db }` e `this.controller.init(db, this)`); `public/js/views/controllers/AlbumsStateController.js:137`; `public/js/components/TopNav.js:8` e `public/js/stores/inventory.js:7` (`import { db } from '../app.js'`).
- **Evidência:** `arch.md` §Data Flow desenha «View -> Controller -> Service -> Repository» e §Data Flow final repete «direção das dependências: View -> Controller -> Service -> Repository», sem exceção. No código, Controller pula o Service e fala com o Repository; View pega o `db`; e uma Store importa o ponto de composição (`app.js`), que importa todas as Views, criando um ciclo.
- **Custo se ficar:** a «regra de negócio nasce como Service» (ADR-0016) não tem como ser testada onde o Controller grava direto; o ciclo `app.js ↔ stores/inventory.js` quebra a ordem de inicialização com qualquer reordenação de imports.
- **Check de aceite:** «Algum arquivo em `controllers/`, `views/` ou `components/` importa de `repositories/` ou de `firebase-init.js`/`app.js`? S/N» (esperado N) e «`arch.md` descreve as exceções restantes, se houver? S/N».
- **Dono · recomendação:** `mjrp-implementing-tasks` (Fix com `violates:: ADR-0016`); `mjrp-syncing-docs` tira a frase de que a direção «vale» enquanto o Fix não fecha.

### 5 · AD-14 Restrições respeitadas (deriva do marco) · P1
- **Âncora:** `public/js/stores/inventory.js:6-10,49-77,126-250` (Repository, cache, `dataSyncService`, Firestore); `public/js/stores/SpotifyEnrichmentStore.js:16-23,38-125` (`db`, `SpotifyEnrichmentRepository`, `CacheManager`, remoção de órfãos); `public/js/stores/UserStore.js:1,40-74` (`authService.signInWithGoogle/Apple/logout`); `public/js/stores/albums.js` (385 linhas, achado 1); `public/js/stores/playlists.js` (161 linhas; a ADR-0017 diz 132).
- **Evidência:** `constitution.md`, Padrão «Store Pattern»: «a store só guarda o estado … sem lógica, sem API, sem efeito colateral (ADR-0017)». Só `albumSeries.js` (134) e `playlists.js` cumprem. A dívida 6 do autor cita `inventory.js` e `albums.js` e **omite** `SpotifyEnrichmentStore` e `UserStore`. `arch.md` §Component Map diz «alvo: só estado (ADR-0017)» sem dizer quais Stores faltam.
- **Critério:** ADR-0017 (`Accepted`) e constituição. A ADR dizia «future thick stores should follow this split»: nunca foi aplicada às demais.
- **Custo se ficar:** a regra aprovada deixa de informar o próximo agente; Stores com I/O são o que o `test/stores/*` precisa mockar.
- **Check de aceite:** «Alguma Store em `public/js/stores/` importa de `repositories/`, `cache/`, `services/` ou `firebase/*`? S/N», esperado N, com o sensor do achado 11.
- **Dono · recomendação:** `mjrp-implementing-tasks`, *corrigir agora*, um Fix por Store (`violates:: ADR-0017`).

### 6 · IV-08 Sem falha silenciosa · P1
- **Âncora:** `public/js/controllers/InventoryController.js:315` (`inventoryStore.deleteAlbum` — o método é `removeAlbum`, `public/js/stores/inventory.js:222`; chamado de `InventoryView.js:250` sem `try`); `public/js/services/auth/UserSyncService.js:38` (`dataSyncService.saveSeries`, que não existe: `DataSyncService.js` só tem `migrateInventory` e `migrateSeries`), `:22` (`currentUserId === 'guest'`: o valor `'guest'` nunca é atribuído — `albumSeries.js:19,74` usa `'anonymous-user'`), `:19` (`newUser.id`: o usuário do Firebase tem `uid`), `public/js/services/SeriesService.js:63` (chama `migrateSeries(this.repository, seriesToMigrate)` com a assinatura `migrateSeries(series)`); `public/js/app.js:174-176` (único handler global: `console.error`, sem `unhandledrejection`).
- **Evidência:** (a) o botão «remover» do inventário lança `TypeError` numa promessa sem tratamento: clique morto, ninguém fica sabendo. (b) A migração convidado → usuário nunca roda (condição inatingível) e, se rodasse, quebraria duas vezes; `signInWithPopup` (`shared/services/AuthService.js:22`) troca de `uid` e deixa os dados da sessão anônima órfãos no `uid` antigo. `data-model.md` §Persistence/Sync afirmava «A migração do convidado para o usuário é de DataSyncService/UserSyncService» (capacidade que não executa) — **corrigido em 12:31**; o defeito de código segue aberto. O autor listou a metade desta dívida (7) e não viu as outras duas partes.
- **Critério:** `PRINCIPLES.md` §I.8; Constituição Art. I («No dead clicks or silent failures»). Violates:: Art. I, §I.8.
- **Custo se ficar:** perda aparente de dados no primeiro login real; função de exclusão que não existe.
- **Check de aceite:** «Excluir um álbum do inventário remove o documento e a linha, com teste? S/N» e «Entrar com Google a partir da sessão anônima leva as séries para o novo `uid`, com teste? S/N». E «um erro não tratado chega a um log ou a um sensor além do console do navegador? S/N».
- **Dono · recomendação:** `mjrp-debugging` (um defeito conhecido cada, com teste que falha primeiro); a decisão de **como** migrar (vincular a conta anônima em vez de trocar de `uid`) é de `mjrp-designing-architecture`.

### 7 · IV-08 Sem falha silenciosa · P1
- **Âncora:** `server/lib/services/EnrichmentService.js:27-33,99-104,119-123` (falha do raspador vira `console.warn` na `:32` e a resposta é `bestEverInfo: null` + `trackRatings` nulos com 200, igual ao álbum sem nota); `server/routes/ai.js:62-66` («Return empty array on error»: `res.json({ albums: [], error })` com 200 e o regex de `:42-48` que transforma texto em nomes de álbum); `server/lib/prompts.js:6-22` (arquivo ausente → `cachedPrompts = {}` + `console.warn`) com `server/lib/fetchRanking.js:103-104` (`if (!template) return { entries: [], … }`) e `:363` (`catch (e) { }`).
- **Evidência:** a leitura que falha é indistinguível da leitura vazia, na resposta (a única pista é o log). É o exemplo literal do IV-08: «leitura que falha e vira "vazio"».
- **Custo se ficar:** uma queda do BestEverAlbums ou um deploy sem `config/` (achado 12) degrada o ranking de todos sem sinal para o usuário e sem alerta; o produto parece «sem aclamação» em vez de «fora do ar».
- **Check de aceite:** «Quando o raspador falha, a resposta de `/enrich-album` carrega um estado próprio (campo de erro/estado de fonte) distinto de «sem notas»? S/N» e «`loadPrompts()` lança (ou o servidor se recusa a subir) quando `prompts.json` não existe? S/N».
- **Dono · recomendação:** `mjrp-implementing-tasks` (Fix); o contrato da resposta (estado de fonte) é de `mjrp-designing-architecture`.

### 8 · DD-03 Volume e particionamento · IV-08 · P1
- **Âncora:** `public/js/services/SeriesService.js:140-143` (`findAll({ orderBy: ['updatedAt','desc'], limit: 20 })`), sem paginação em nenhum chamador.
- **Evidência:** `data-model.md` §Persistence cita «a única consulta ordenada é … com `limit 20`» como detalhe de índice. Na prática, quem tem 21 séries deixa de ver a 21ª — sem aviso — e uma série sem `updatedAt` (a que não nasceu por `createSeries`, que grava `updatedAt: new Date()`) também some. O documento não registra o corte como limite de produto.
- **Custo se ficar:** parece perda de dados; o usuário mais engajado é o primeiro afetado.
- **Check de aceite:** «Um usuário com 25 séries as vê todas (ou uma indicação clara de que há mais)? S/N», com teste.
- **Dono · recomendação:** `mjrp-implementing-tasks`; o limite certo é decisão de produto (humano, 20 foi escolha ou acidente?).

### 9 · MA-05 Modelagem de ameaças · RS-01 Contrapressão · MA-04 FinOps · P1
- **Âncora:** `cloudbuild.yaml` (`--allow-unauthenticated`); `server/index.js:134-136` (rotas de depuração montadas sem condição de ambiente); `server/routes/debug.js:98-104` (`GET /api/debug/files` lista qualquer pasta do contêiner por `req.query.path`; o único teste é a existência de `AI_API_KEY`, não quem chama), `:34` (`/api/list-models`), `:89` (`stack: err.stack` na resposta); `server/routes/ai.js:7-27` (`artistName` livre concatenado no prompt, 10.000 *tokens* de saída, com busca do Google ligada em `aiClient.js:32`); `server/index.js:66` (CORS aceita requisição sem `Origin`); sem *rate limiting* em lugar nenhum.
- **Evidência:** `arch.md` §Constraints não trata de abuso nem de custo (a linha de desempenho é um `TBD` nomeado, o que é compromisso declarado e não achado, mas custo de chamada paga e abuso não estão nele). Qualquer cliente HTTP chama o Gemini pago com a chave do servidor.
- **Custo se ficar:** fatura do Gemini sem teto; enumeração do sistema de arquivos do contêiner; a chave nunca vaza, mas o uso dela sim.
- **Check de aceite:** «`/api/debug/*` e `/api/list-models` respondem 404 em produção? S/N», «uma chamada anônima a `/api/ai/studio-albums` é limitada por usuário/IP ou exige token do Firebase? S/N», «`arch.md` estima o custo por álbum carregado? S/N».
- **Dono · recomendação:** `mjrp-designing-architecture` decide o controle (verificar o ID token do Firebase no servidor, limite de taxa, remover as rotas de produção); `mjrp-implementing-tasks` executa. Por que não «aceitar o risco»: a exceção seria do humano e hoje o `arch.md` nem o nomeia.

### 10 · IV-11 Segredo zero no código · P1
- **Âncora:** `scripts/generate-dataset.js:8` e `scripts/fetch-missing-artists.js:12` (`const DISCOGS_TOKEN = '<valor literal>'`; o valor não foi copiado para este relatório), rastreados (`git log` mostra commits `a046143`, `bd9f35a`); `public/js/services/SpotifyAuthService.js:179,182,191` (`spotify_access_token`, `spotify_refresh_token` no `localStorage`); `public/index.html:9` (`script-src 'self' 'unsafe-inline' … cdn.tailwindcss.com`).
- **Evidência:** o token do Discogs é uma credencial no repositório (`PRINCIPLES.md` §I.14: «o repositório inteiro pode ficar público amanhã sem que nenhuma credencial precise ser trocada» — N). **Correção à dívida 3 do autor:** `public/js/firebase-config.js` rastreado **não** é segredo (é a chave pública do app web do Firebase); o problema dele é outro (achado 3 e a contradição com `.gitignore:22`). O Spotify é diferente: refresh token de OAuth guardado no navegador, com CSP que libera script inline e um script de terceiro executado em tempo de execução (Tailwind CDN). §I.14 só admite credencial no cliente «com o padrão BYOK aprovado na `constitution.md»; a constituição não o aprova.
- **Custo se ficar:** revogar e trocar o token do Discogs (está no histórico do git); a superfície XSS lê um refresh token de longa vida.
- **Check de aceite:** «`git grep` por `TOKEN =` com literal em `scripts/` e `server/` volta vazio? S/N» e «os tokens do Spotify deixam de ser lidos do `localStorage`, ou a `constitution.md` aprova o padrão com a ameaça escrita? S/N».
- **Dono · recomendação:** `mjrp-implementing-tasks` (mover para ambiente, **revogar o token já exposto**); a leitura do §I.14 para o token OAuth do usuário é do humano (*Decisões do humano* 4).

### 11 · GV-03 Guias são caros, sensores são baratos · SN-01 · SN-03 · IV-09 · P1
- **Âncora:** `eslint.config.mjs:6-12` (só `recommended`, `no-unused-vars` e `no-undef` em `warn`, nenhuma regra de importação); `.github/workflows/ci-firebase.yml:32-33` (`npm run lint … || true`; o do servidor também); sem scanner de segredo no CI (grep de `gitleaks`/`trufflehog` sem resultado); `server/test/unit-tests.js:103`, `curation.test.mjs:8`, `curation-enrichment.test.mjs:9` importam `../../public/js/curation.js`, que não existe (o código é `shared/curation.js`); `vitest.config.js:9` só roda `test/**/*.test.js` (os `tests/cache` e `tests/repositories` não rodam em comando nenhum); `ci-firebase.yml:73,120` implanta só o hosting; `firebase.json` sem bloco `firestore`.
- **Evidência:** as regras da constituição e das ADRs (Repository, Store pura, camadas, Strategy) não têm nenhum sensor; o motor de curadoria (`shared/curation.js`, 517 linhas) não tem teste executável; a implantação das regras do Firestore não é automática. A frase do autor sobre `npm test` do servidor «falhar no 1º arquivo» não foi conferida por execução.
- **Custo se ficar:** toda correção dos achados 1, 4, 5 volta a derivar em silêncio; o P0 2 pode regredir sem alarme.
- **Check de aceite:** «O CI reprova (exit ≠ 0) um `import 'firebase/firestore'` em `stores/`, `services/` ou `views/`? S/N»; «o CI reprova um token literal commitado? S/N»; «há teste executado em comando que cobre `shared/curation.js`? S/N»; «um pipeline publica `firestore.rules`? S/N».
- **Dono · recomendação:** `mjrp-designing-architecture` escolhe os sensores (SN-01 como regra de ESLint de importação ou `dependency-cruiser`; SN-03; corrigir o caminho dos testes de curadoria); itens de Fix para o resto. Isto também fecha o P0 1 de forma durável.

### 12 · IV-05 ETC e DRY · RS-04 Runtime · P1
- **Âncora:** `cloudbuild.yaml` (passo 1: `mkdir -p server/_shared_temp; cp -r shared/* server/_shared_temp/`; sem cópia de `config/`; sem `package.json`) contra `scripts/deploy-backend.sh` (`cp -r shared server/_shared_temp`, **`echo '{"type": "module"}' > server/_shared_temp/package.json`**, `cp -r config server/config`, `gcloud run deploy --source server`, `PROJECT_ID="mjrp-playlist-generator"`); `server/lib/prompts.js:4-5` (procura `server/config/prompts.json` ou `<raiz>/config/prompts.json`); `server/routes/playlists.js:23` e `server/lib/ranking.js:8`, `fetchRanking.js:13` (`import()` dinâmico de `../../shared/*.js`, ESM, a partir de CommonJS); `server/Dockerfile:1`, `.github/workflows/ci-firebase.yml:22,55,102` (Node 18).
- **Evidência:** o conhecimento «como montar a imagem» existe em dois lugares e eles divergiram. Pela receita do Cloud Build, o contêiner fica sem `prompts.json` (`loadPrompts()` devolve `{}` — achado 7 — e o ranking sai vazio) e sem `package.json` com `type: module` no `shared/` (o Node 18 trata o `.js` como CommonJS e o `import()` falha com `SyntaxError`), o que derruba `/api/playlists` e a normalização de ranking. `arch.md` §Infrastructure apresenta as duas receitas como equivalentes («ou»). Não sei qual delas gerou a produção atual; o documento deveria dizer. O Node 18 saiu de suporte em 2025-04: o contêiner não recebe correção de segurança do runtime, e `tech-stack.md` lista «Node.js 18» sem nomear o custo (AD-05).
- **Critério:** `PRINCIPLES.md` §I.5; Constituição Art. V («zero-downtime deployments via CI/CD»); a CI não implanta o backend.
- **Custo se ficar:** um deploy «normal» pelo caminho errado entrega uma API que responde 200 vazia; o runtime fica sem patch.
- **Check de aceite:** «Existe uma única receita de imagem do backend, usada pelo CI e pelo script? S/N», «o contêiner sobe (ou o *health* reprova) sem `prompts.json`? S/N», «o runtime é uma versão LTS em suporte? S/N».
- **Dono · recomendação:** `mjrp-designing-architecture` (uma receita; ADR se trocar de runtime — a escolha de Node 20/22 é irreversível-ish para o v0 só por custo de teste); implementação em Fix.

### 13 · AD-04 Ciclo de vida do dado · DD-02 Concorrência e conflitos · P1
- **Âncora:** `public/js/stores/albums.js:302-318` (`setDoc(…, serialized, { merge: true })` e `addDoc` na raiz `albums`, gravação de `JSON.parse(JSON.stringify(album))` — «serialização cega» que persiste campos de execução, `data-model.md` §Album); `public/js/repositories/SpotifyEnrichmentRepository.js:12,56` (30 dias só na **leitura**; nada apaga o registro vencido nem apaga órfãos fora da leitura preguiçosa de `SpotifyEnrichmentStore.js:49-55`); `public/js/services/SeriesService.js:178-180` (`albumQueries.push(...)` e `updateSeries(seriesId, { albumQueries })`, array inteiro sobrescrito).
- **Evidência:** `data-model.md` descreve campos e caminhos, mas para as duas coleções globais não diz **quem escreve**, **como conflito se resolve** nem **quanto o dado vive** (AD-04); para `albumQueries`, duas abas/aparelhos regravam o array inteiro (último a gravar vence) e a cópia em `localStorage` (`mjrp_series`) pode divergir. Isso é conhecido pelo autor só em parte (dívida 14).
- **Custo se ficar:** a coleção `/albums` cresce sem dono nem limite; série editada em duas abas perde álbuns.
- **Check de aceite:** «`data-model.md` diz, para cada coleção, quem escreve, a regra de conflito e a retenção? S/N».
- **Dono · recomendação:** `mjrp-designing-architecture` (escrever o ciclo de vida; decidir se `albums` precisa existir como coleção global); *vigiar*.

### 14 · CM-03 Evolução de schemas · P2
- **Âncora:** `public/js/repositories/BaseRepository.js:158-175` grava `_schemaVersion`; só `SpotifyEnrichmentRepository.js` o lê (versão ≠ 1 invalida o registro); nenhuma leitura de Series/Playlist/Inventory/UserRanking confere versão; `test/` e `server/test/` não têm teste de contrato para `/enrich-album` e `/generate`.
- **Evidência:** o campo existe, a regra de compatibilidade não. **Custo se ficar:** o dia em que o v1 (mesmo esquema do Firestore) ou uma migração mudar um campo, não há como saber quais documentos são de qual forma. **Check:** «um teste de contrato falha se uma resposta da API perder `trackRatings`? S/N». **Dono:** `mjrp-designing-architecture` · vigiar.

### 15 · AD-14 Restrições respeitadas · P2
- **Âncora:** `public/js/algorithms/index.js:25-27` («Blending Menu flavors», «2 generic flavors», «Added User-Generated-Rank flavor»), `algorithms/TopNAlgorithm.js:5`, `components/blend/BlendIngredientsPanel.js:130,144`, `views/BlendingMenuView.js` (7 ocorrências em 4 arquivos).
- **Evidência:** ADR-0015, *Compliance*: «All future algorithm additions must use the "Recipe" nomenclature»; a constituição diz «"Flavor" não se usa mais». Só comentários e nomes locais, mas é a regra aprovada contra o código. **Check:** «`grep -ri flavor public/js` volta vazio? S/N». **Dono:** `mjrp-implementing-tasks`. Violates:: ADR-0015.

### 16 · IV-02 SRP e módulo pequeno · P2
- **Âncora:** `wc -l` (reproduzido, sem `vendor/`, `tests/`, `scripts/`): 58 arquivos em `public/js`, 3 em `server/`, 1 em `shared/` acima de 200 linhas; maiores: `controllers/SeriesController.js` 647, `api/client.js` 585, `services/SpotifyService.js` 535, `scrapers/besteveralbums.js` 525, `services/SeriesService.js` 521, `shared/curation.js` 517. 27 `export const x = new X(` (singletons).
- **Evidência:** `constitution.md` chama 200 linhas de «sinal, não regra»; logo não é violação por si, e a ADR-0018 (que quer orquestradores < 200) está `Proposed`. É o tema de `mjrp-assessing-code-quality`. **Check:** entregue àquela skill. **Dono:** `mjrp-assessing-code-quality` · adiar.

### 17 · RS-02 Retries e proteção a jusante · P2
- **Âncora:** `public/js/api/client.js:21-23,196-232` (2 retentativas, espera fixa `retryDelay = 1000`, sem *jitter*, sem recuo); a retentativa refaz `/generate`, que chama o Gemini pago.
- **Check:** «a retentativa usa recuo exponencial com *jitter* e teto? S/N». **Custo:** repetição de custo e de carga em queda do upstream. **Dono:** `mjrp-implementing-tasks` · adiar.

### 18 · IV-05 ETC e DRY · P2
- **Âncora:** dois «AuthService» — `public/js/services/AuthService.js:1-60` (anonymous bootstrap, importa Stores e `SeriesService`) e `shared/services/AuthService.js:1-60` (login Google/Apple, importa `firebase/auth`) —, o segundo dentro de `shared/` (cuja razão de ser, em `constitution.md`, é «lógica compartilhada com o frontend» no servidor; o servidor não o usa e o Cloud Build o copia para a imagem); `public/js/algorithms/`: 14 arquivos, 4 registrados (`index.js:24-30`), `Legacy…`, `MJRPBalancedCascadeV0`, `SDraftBalanced`, `SDraftOriginal`, `Top3/Top5…` sem nenhuma importação (grep); `public/js/app.js:181-185` expõe `window.albumsStore`, `window.router` e outros «para Puppeteer» em produção.
- **Check:** «existe um só arquivo `AuthService` por responsabilidade e `shared/` contém só código que o servidor também usa? S/N». **Dono:** `mjrp-implementing-tasks` · adiar.

Não se aplica: DD-01 Transacionalidade entre limites (nenhuma operação escreve em dois armazenamentos); CM-01 Semântica de entrega e idempotência (sem fila); CM-02 Latência em cascata (cadeia síncrona curta, medida pelo VT-02); RS-03 Comportamento de caches (a invalidação declarada — TTL de 7 dias no L2, 30 dias no enriquecimento — existe; o reinício a frio não é problema, o cache é do cliente); SN-04…08 (sem contrato versionado com amostras, sem consumidores separados, sem mensageria, sem meta numérica em operação, sem réplicas).

## O que está bom, manter
- **O núcleo está limpo.** `algorithms/`, `models/`, `ranking/`, `transformers/` e `shared/curation.js` não importam Firebase, DOM nem `localStorage` (grep). As Recipes são Strategy de verdade, com registro em `algorithms/index.js:24-30`, exatamente como `arch.md` e a constituição dizem.
- **A fachada de ranking e a injeção das rotas.** `server/lib/fetchRanking.js` (Facade, `DP-11`) esconde raspagem, IA e fallbacks; `initAlbumRoutes(deps)` (`server/routes/albums.js:20-23`) recebe os Services prontos; as rotas de álbum são finas como a ADR-0016 pede. O servidor de fato **não** toca o Firestore, como `arch.md` afirma.
- **Os documentos são honestos sobre o que não sabem.** `data-model.md` marca `TBD` onde o mapa não leu; `arch.md` deixa «Desempenho e escala: TBD» como decisão do produto; `tech-stack.md` marca todas as decisões como `—` em vez de inventar ADR; e as versões batem com os lockfiles (tabela abaixo).
- **A Repository com `BaseRepository`** existe, é usada pela maioria dos caminhos e tem cache de duas camadas com TTL declarado; a camada para a correção do P0 1 já está pronta.
- **Segredos do servidor** realmente vêm do Secret Manager (`cloudbuild.yaml` `--set-secrets`); nenhum segredo do servidor foi achado no repositório.

## Análise estrutural

| Componente | Camada (declarada → medida) | Observação / achado |
|---|---|---|
| `algorithms/`, `models/`, `ranking/`, `transformers/`, `shared/curation.js` | Entidades / regras → limpo | sem dependência para fora (grep) |
| `services/` (Series, Playlists, Generation, Persistence, Export…) | Casos de uso → mistos | `PlaylistsService` importa o SDK (1); importam Stores e uns aos outros |
| `repositories/`, `cache/` | Adaptadores → corretos | único lugar que deveria tocar o Firestore |
| `stores/` | Estado (ADR-0017) → 4 de 6 com I/O | 1, 5 |
| `controllers/` | Orquestradores → pulam o Service | 4 |
| `views/`, `components/` | Tela → pegam `db` | 4 |
| `app.js` | Composição → importado por uma Store | 4 (ciclo) |
| `server/routes/` | Rotas finas → finas, exceto `playlists.js` (lógica de unidade) e `debug.js` | 9 |
| `server/lib/services/`, `fetchRanking.js` | Services / Facade → corretos | 7 (falha vira vazio) |
| `shared/` | Compartilhado servidor + cliente → inclui `services/AuthService.js` com SDK | 18 |

Direção das dependências: não é «nada aponta para fora». Violações: Service → SDK (1), Store → SDK/Repository/Service (1, 5), Controller → Repository (4), View/Component → `db` (4), Store → `app.js` (4, ciclo), `shared/` → SDK de auth (18).

Tecnologias (as que os documentos declaram):
| Tecnologia | Detalhe ou núcleo? | Custo de trocar | Vazou? |
|---|---|---|---|
| Firestore (direto do navegador, regras como única autorização) | detalhe | ≥ 10 arquivos hoje; regras reescritas | sim — achados 1, 2 |
| Firebase Auth anônimo | detalhe | médio (uid é a chave de todos os caminhos) | sim — achado 6 |
| Gemini REST | detalhe | baixo (`aiClient.js` único) | não; custo/abuso no 9 |
| BestEverAlbums (raspagem) | detalhe frágil | médio; sem API, HTML mutável | atrás do Facade; falha vira vazio (7) |
| Vanilla JS + Vite | núcleo (Art. II) | alto, deliberado | n/a |
| Tailwind CDN | detalhe | baixo | não; `'unsafe-inline'` no CSP, nota no achado 10 |

## Recomendações
1. **Corrigir agora:** 1 (P0, refatoração guiada pelo sensor do 11); 2 (regras abertas: o primeiro P1; regra + decisão do humano); depois 4, 5, 6, 7, 8 (Fix com `violates::` e teste que falha primeiro); 9 e 10 (**revogar o token do Discogs**, fechar as rotas de depuração) são de segurança e não esperam os demais; 11 e 12.
2. **Vigiar:** 13, 14.
3. **Adiar:** 15 a 18 (16 vai para `mjrp-assessing-code-quality`).
4. **Documentos:** feito às 12:31 (projeto Firebase, regra + «Conserto: achado N» ao lado de cada regra quebrada, correções da tabela de verificação). Resta só a nota de *Higiene* sobre o `StorageService`.
5. **Persistir a dívida:** a lista de itens de Fix do autor está em `/private/tmp/claude-501/…/scratchpad/pacote-B-relatorio.md`, **fora do repositório**; a constituição promete «registrada no relatório do conform» e o `grep violates::` do repositório não a encontra (a nota é do orquestrador, ver *Higiene* 3). Os itens 1 a 18 deste relatório, mais os 15 do autor, entram no board como Fix com `violates::`.

## Higiene da decisão
(Atualizada na passada de 12:31; as notas já corrigidas pelo autor saíram da lista.)
- **AD-06 Premissas verdadeiras (resíduo):** `constitution.md`, Padrões com endereço, Repository, diz «O `localStorage` passa por `public/js/services/infra/StorageService.js`». Só `PlaylistsService.js` e `SeriesService.js` o usam; dez arquivos de `public/js` tocam `localStorage` direto (`SpotifyAuthService.js:179-191`, `cache/albumCache.js`, `controllers/SeriesController.js`, `controllers/InventoryController.js`, `views/SeriesView.js`, `components/Footer.js`, `migration/MigrationUtility.js` e outros). Dizer «o `localStorage` deve passar por» (regra) em vez de «passa» (fato), ou apontar o Fix. Quem age: o autor dos documentos. Todas as outras imprecisões da primeira passada (cascata 40%/< 3, 18 rotas, `shared/services/AuthService.js`, timeout do Gemini, pastas `services/infra|playlists|auth`, Axios, SDK 11.6.1, uFuzzy, Tailwind inline, âncora `:253` → `:248`, migração convidado → usuário) **foram corrigidas e reconferidas no código**.
- **AD-12 / AD-14 e aceite das ADRs:** a constituição deixou de citar a ADR-0018 `Proposed` como regra («é só uma proposta … e **não é regra** até essa ADR ser aceita») — corrigido. Segue aberto, e é do humano: a ADR-0018 continua `Proposed` com metade aplicada no código (`PlaylistHistoryService`, `StorageService` existem; `UserMigrationService` não), e a ADR-0015 está `APPROVED` (fora do vocabulário `Proposed`/`Accepted`).
- **IV-07 / registro da dívida:** a constituição agora aponta para este relatório como registro («itens de Fix com `violates::`»). Mas os achados deste relatório estão em prosa, não são itens do board; e os 15 itens do autor continuam só num arquivo temporário fora do repositório. Quem age: o orquestrador, que cria os itens de Fix no board (`lane`/`solution_type`/`violates::`).
- **GV-05 / AD-09:** `tech-stack.md` segue `Draft` com a coluna Decisão toda `—`; a escolha mais irreversível do sistema (Firestore direto do navegador, regras como única autorização — o `arch.md` agora o diz) não tem ADR nem gatilho de revisão. Quem age: o humano e `mjrp-recording-decisions`.

## Decisões do humano
- **1. Exceção para o P0 1?** O único P0 aberto (VT-06) se fecha por conserto. Se o humano preferir aceitá-lo como exceção, ela precisa estar na ADR-0017 ou na constituição; recomendo **não**: a camada que o corrige (Repository) já existe.
- **2. Quem escreve em `/albums` e em `spotify_enrichment`?** (a) só o servidor (o Cloud Run passaria a gravar; hoje não toca o Firestore); (b) só o dono do dado, por uid; (c) manter global e aberto a qualquer login, aceitando o risco por escrito. Recomendo (b) ou (a).
- **3. O limite de 20 séries é decisão de produto?** (a) paginar; (b) subir o teto e documentar; (c) manter 20 e sinalizar na tela.
- **4. O §I.14 cobre o token OAuth do usuário (Spotify) guardado no `localStorage`?** Se sim, o conserto é do código; se não, a `constitution.md` precisa dizer isso por escrito (emenda é do humano, não deste relatório).
- **5. ADR-0018 `Proposed`, ADR-0015 `APPROVED` e `tech-stack.md` `Draft`:** aceitar, rejeitar ou emendar a ADR-0018 (tech lead ou humano); dizer se a ADR-0015 vira `Accepted`; aprovar o `tech-stack.md` como baseline (as correções já entraram).

---

## Tabela de verificação — afirmações dos documentos conferidas contra o código

| # | Documento · afirmação | Âncora lida | Resultado |
|---|---|---|---|
| V1 | `arch.md` — Recipes registradas: `mjrp-balanced-cascade`, `top-n-popular`, `top-n-acclaimed`, `top-n-user` em `algorithms/index.js:24-30` | `algorithms/index.js:24,28,29,30` | confere |
| V2 | `arch.md` — «as 17 rotas por History API (`app.js:113-171`)» | 18 chamadas `router.register` (`app.js:113,114,115,116,117,120,121,122,123,126,144,147,151,155,159,165,170,171`) | **não confere** (18) |
| V3 | `arch.md` — «O servidor não acessa o Firestore» | grep de `firebase|firestore` em `server/` (`.js`): sem resultado | confere |
| V4 | `arch.md` — saúde em `/_health` (`server/index.js:87`); CORS por `ALLOWED_ORIGIN`, padrão `…web.app` (`:58-70`) | `index.js:87`; `:58` (padrão `https://mjrp-playlist-generator.web.app`), `:60-70` | confere |
| V5 | `arch.md` — login anônimo automático em `services/AuthService.js:58` | `services/AuthService.js:58` `await signInAnonymously(auth)` | confere |
| V6 | `arch.md` — `firebase.json:3-20` reescreve `/api/**` para o Cloud Run `mjrp-proxy`, região `southamerica-east1`; resto para `/index.html` | `firebase.json:3-20` | confere |
| V7 | `arch.md` — projeto Firebase `mjrp-albums` no SDK do app (`firebase-init.js:10`) | `index.html:111` + `firebase-config.js:3-10` (`mjrp-playlist-generator`) sobrepõem `firebase-init.js:6-13` (reserva com `API_KEY_PLACEHOLDER`) | **não confere** (achado 3) |
| V8 | `arch.md` — cascata «BEA, depois Spotify se menos de 50% das faixas, depois Gemini, depois Borda»; só roda em `/generate` | `fetchRanking.js:162-169` (40% e < 3 faixas); `EnrichmentService.js` só raspa BEA | **parcial**: o «só em `/generate`» confere, o 50% não |
| V9 | `arch.md` — «a direção das dependências: View → Controller → Service → Repository» | `PlaylistsController.js:92,312,325,334`; `SeriesView.js:16,68`; `inventory.js:7` | **não confere** (achado 4) |
| V10 | `arch.md` — tudo em `shared/` é `curation.js` e `normalize.js` | `shared/services/AuthService.js` existe e importa `firebase/auth` | **não confere** (achado 18) |
| V11 | `arch.md` — CI: lint, testes, build, `firebase deploy --only hosting` em `main`, `v0.2`, tags; `cloudbuild.yaml --allow-unauthenticated` | `ci-firebase.yml:6-11,120`; `cloudbuild.yaml` | confere |
| V12 | `arch.md` — Tailwind CDN `public/index.html:12`; fonte Syne `:15-17`; MusicKit `MusicKitAuth.js:124` | `index.html:12,15-17`; `MusicKitAuth.js:124` | confere |
| V13 | `arch.md` — raspador com prazo de 30 s, sem retentativa nem cache | `scrapers/besteveralbums.js:8-9,22,54` (timeout 30000), sem retry/cache | confere |
| V14 | `data-model.md` — `appId` fixo `mjrp-albums` (`InventoryRepository.js:20-21`); séries em `…/curator/data/series` (`SeriesRepository.js:21-23`) | `InventoryRepository.js:20-21`; `SeriesRepository.js:21-23` | confere (e é um segmento de caminho, não o projeto) |
| V15 | `data-model.md` — regras `firestore.rules:8-14, 32-36, 42-44, 49-52` | `firestore.rules:8-13, 32-35, 42-43, 49-51` | confere (±1 linha) |
| V16 | `data-model.md` — `BaseRepository` grava `createdAt` do servidor, sobrescreve o do cliente (`:161`); `_schemaVersion` | `BaseRepository.js:158-175` | confere |
| V17 | `data-model.md` — `AlbumRepository` com `_schemaVersion` 2, os demais 1 | `AlbumRepository.js:27` (2); demais `schemaVersion = 1` | confere |
| V18 | `data-model.md` — `Playlist.updatedAt` ISO em `create`, Timestamp em `save` (`PlaylistsService.js:253`) | `PlaylistsService.js:248` (ISO) + `BaseRepository.js:239` (`save` com `serverTimestamp`) | confere, **âncora errada** (`:248`, não `:253`) |
| V19 | `data-model.md` — playlist com `name` (`PlaylistRepository.js:56`) ou `title` (`models/Playlist.js:14`) | `PlaylistRepository.js:56`; `models/Playlist.js:14` | confere |
| V20 | `data-model.md` — `SpotifyEnrichment`: 30 dias (`:12,56`), chave normalizada de 100 caracteres (`:35-44`), exige `spotifyId` (`:67`) | `SpotifyEnrichmentRepository.js:12,56,67,35-44` | confere |
| V21 | `data-model.md` — `UserRanking` em `users/{uid}/albumRankings`, id sanitizado (`UserRankingRepository.js:55`) | `UserRankingRepository.js:55` | confere |
| V22 | `data-model.md` — IndexedDB `mjrp-cache` v1, TTL 7 dias (`CacheManager.js:77`) | `IndexedDBCache.js:7`; `CacheManager.js:77` | confere |
| V23 | `data-model.md` — `createFromInventory` e `findWithAlbums` sem chamador | grep em `public/js` e `test`: só as definições (`SeriesRepository.js:32,70`) | confere |
| V24 | `data-model.md` — «A migração do convidado para o usuário é de DataSyncService/UserSyncService» | `UserSyncService.js:19,22,38`; `SeriesService.js:63` | **não confere** (não executa; achado 6) |
| V25 | `data-model.md` — consulta única `orderBy('updatedAt','desc')` `limit 20` (`SeriesService.js:140-143`) | `SeriesService.js:140-143` | confere (o alcance não está dito: achado 8) |
| V26 | `tech-stack.md` — versões (Vite 5.4.21, Axios 1.13.2, Firebase 10.14.1, SortableJS 1.15.6, Vitest 1.6.1, jsdom 23.2.0, Puppeteer 24.31.0, ESLint 9.39.2/9.39.1; servidor: Express 4.21.2, cors 2.8.5, dotenv 16.6.1, Cheerio 1.1.2, AJV 8.17.1, jsonwebtoken 9.0.3, Jest 29.7.0, standard 17.1.2, prettier 3.6.2) | `package-lock.json` e `server/package-lock.json`, lidos por script | confere |
| V27 | `tech-stack.md` — Node 18 (`server/Dockerfile:1`; CI `node-version: 18.x`); Vite porta 5000, proxy `/api`→3000 | `Dockerfile:1`; `ci-firebase.yml:22,55,102`; `vite.config.js:33-39` | confere |
| V28 | `tech-stack.md` — Gemini `gemini-2.5-flash` em `aiClient.js:7, 15` | `aiClient.js:7,15` | confere |
| V29 | `tech-stack.md` — Axios no front «chamadas HTTP do cliente» | `api/client.js:1` importa; nenhum `axios.` no cliente; `fetch` em `:174,207,298` | **não confere** |
| V30 | `tech-stack.md` — Firebase SDK 10.14.1 «direto do navegador» (único) | `views/SaveAllView.js:5-6` carrega 11.6.1 do CDN | **parcial** |
| V31 | `tech-stack.md` — Tailwind «sem configuração no disco» | `index.html:22-44` `tailwind.config` inline | **parcial** (nenhum `tailwind.config.js`, mas há configuração) |
| V32 | `constitution.md` — Padrões com endereço: Strategy em `ranking/`, `algorithms/`, `album-search/classification/`; Facade em `fetchRanking.js`; Factory por injeção em `server/routes/albums.js` | pastas e arquivos existem; `albums.js:20-23` | confere |
| V33 | `constitution.md` — Repository «Firestore, LocalStorage» | só repositórios Firestore em `repositories/`; localStorage vai por `StorageService` e acesso direto em 8 arquivos | **parcial** (não há LocalStorage-Repository) |
| V34 | ADR-0016 — arquivos criados (`EnrichmentService`, `GenerationService`, `SpotifyExportService`, `AuthNav`, `AlbumCardRenderer`) | existem (`server/lib/services/*`, `services/SpotifyExportService.js`, `components/navigation/AuthNav.js`); `components/ui/AlbumCardRenderer.js` | confere |
| V35 | ADR-0017 — `playlists.js` 132 linhas, `albumSeries.js` 108 | `wc -l`: 161 e 134 | **deriva** (> 150 da constituição; achado 5) |

Resumo: 35 afirmações conferidas — 21 conferem, 3 conferem com âncora ou alcance a corrigir (V15, V18, V25), 4 são parciais (V8, V30, V31, V33) e 7 não conferem (V2, V7, V9, V10, V24, V29, V35). As de maior consequência são V7, V9 e V24. **Em 12:31:** V2, V7, V8, V9, V10, V18, V24, V29, V30, V31 foram corrigidos nos documentos e reconferidos (ver *Nova passada*); V33 melhorou mas ainda é parcial (N9); V35 é texto de ADR `Accepted`, não editado.

## Auditoria das dívidas do autor (§ e do pacote B)

| # do autor | Veredito | Evidência / correção |
|---|---|---|
| 1 DEBUG_LOG × harness | verdadeiro | `docs/debug/DEBUG_LOG.md` tem 4.544 linhas; a constituição Art. III o exige |
| 2 Tailwind em tempo de execução | verdadeiro | `index.html:12,46`; CSP `'unsafe-inline'` `:9` |
| 3 Segredos / configuração rastreada | **parcial** | token do Discogs: verdadeiro (`scripts/generate-dataset.js:8`, `fetch-missing-artists.js:12`); `firebase-config.js` rastreado: verdadeiro, mas **não é segredo**, e o seu conteúdo prova o erro do projeto Firebase (achado 3) |
| 4 Regras abertas | verdadeiro (e subestimado) | `firestore.rules:35`; achado 2 |
| 5 Backend público | verdadeiro | `cloudbuild.yaml`; `debug.js:98`; `index.js:134-136`; achado 9 |
| 6 Stores não puras | verdadeiro, **incompleto** | falta `SpotifyEnrichmentStore` e `UserStore` (achado 5) |
| 7 Exclusão quebrada | verdadeiro, **incompleto** | a migração tem 3 defeitos, não 1 (achado 6) |
| 8 Teste e CI | verdadeiro, parte não executada | caminho `public/js/curation.js` inexistente confirmado; `|| true` em `ci-firebase.yml:32-33`; «npm test do servidor falha» não confirmado por execução |
| 9 Implantação | verdadeiro, **incompleto** | falta a divergência `cloudbuild.yaml` × `deploy-backend.sh` (achado 12) |
| 10 Manual × código | **falso no ponto central** | o app usa `mjrp-playlist-generator`, não `mjrp-albums`; o manual `00_Deployment_and_Setup` estava certo e `.firebaserc` também; `Series.albumIds/type` × `albumQueries` e a cascata: verdadeiros |
| 11 Tamanho de arquivo | verdadeiro | reproduzido: 58 / 3 / 1; maiores conferem |
| 12 «Flavor» | verdadeiro | 7 ocorrências, 4 arquivos |
| 13 Singleton | verdadeiro | 27 `export const … = new …` |
| 14 Dívida de dados | verdadeiro nos itens verificados | `createFromInventory`/`findWithAlbums` sem chamador; `updatedAt` em dois tipos; «/albums grava o ranking do usuário» não conferido |
| 15 `screen: [web/src/]` | **obsoleto** | `.mjrp-project.yml` já diz `screen: [public/]` |

**O que o autor deixou de fora:** (a) o projeto Firebase errado nos documentos; (b) a divergência entre as duas receitas de implantação do backend e o `prompts.json` que cai em `{}`; (c) Controllers → Repository e Views/Componentes → `db`; (d) as Stores `SpotifyEnrichmentStore` e `UserStore`; (e) o corte silencioso de 20 séries; (f) tokens do Spotify no `localStorage` frente ao §I.14; (g) `shared/services/AuthService.js` (SDK em `shared/`); (h) `axios` importado e nunca usado no cliente, e o SDK Firebase 11.6.1 do `SaveAllView`; (i) o handler global de erro que só registra no console. **O que o autor afirmou falso:** a dívida 10 («o app usa `mjrp-albums`») e as frases de `arch.md`/`data-model.md` listadas em *Higiene*.

## Nova passada — 2026-10-28 12:31
> Quem julgou: agente separado (o mesmo desta auditoria; releu só o que o autor alterou — `git diff` de `arch.md`, `data-model.md`, `tech-stack.md`, `constitution.md` — e reconferiu no código cada âncora nova). Corrido: nenhum teste, nenhum git de escrita, sem doctor.

**Estado de cada achado de documento (P0 e P1), pelo diff:**

| # | O que o documento dizia de errado | Estado | Onde está agora / âncora reconferida |
|---|---|---|---|
| 1 | a fronteira do Firestore «vale» | **corrigido** (doc); código **aberto** (P0) | `arch.md` §Direção das dependências e fronteira do Firestore: lista `PlaylistsService.js:17,243`, `stores/albums.js:9,273,312,315`, `SaveAllView.js:5-6` (SDK 11.6.1); «Conserto: achado 1». Relido: as três âncoras conferem |
| 2 | segurança «escopo por dono» sem as regras abertas | **corrigido** (doc); código **aberto** | tabela em `arch.md` §Infrastructure e `data-model.md` (`firestore.rules:8-13, 19-28, 32-35, 42-43, 49-51`) — conferem linha a linha; diz também que nenhum pipeline publica as regras. Rebaixado a P1 |
| 3 | projeto Firebase `mjrp-albums` | **corrigido** → **fechado** | `arch.md` Database e Data Flow 4; `data-model.md` Convenções e Persistence (`firebase-config.js:3-10`, `index.html:111-112`, `firebase-init.js:6-13`, `deploy-backend.sh`, `server/index.js:58`) |
| 4 | View→Controller→Service→Repository sem exceção | **corrigido** | linha Controllers do Component Map e §Direção (`PlaylistsController.js:92-93,312,325,334`; `SeriesController.js:22`; `BlendingController.js:22`; `SeriesView.js:16,68`; `TopNav.js:8`; `stores/inventory.js:7`) |
| 5 | Stores «alvo: só estado» sem dizer quais faltam | **corrigido** | linha Stores: só `albumSeries.js` e `playlists.js` cumprem; nomeia as quatro com I/O |
| 6 | migração convidado → usuário funciona | **corrigido** | `data-model.md` Persistence/Sync: `UserSyncService.js:22,38`, `SeriesService.js:63`, `albumSeries.js:19,74`, `shared/services/AuthService.js:22` — conferem. (Um detalhe que o texto não diz, e que não precisa: `UserSyncService.js:19` usa `newUser.id`.) |
| 7 | falha de leitura do servidor não descrita | **corrigido** | `arch.md` Data Flow 6: `EnrichmentService.js:27-33,99-104`, `ai.js:62-66`, `prompts.js:6-22` — conferem |
| 8 | corte de 20 séries não descrito | **corrigido** | `data-model.md` «Corte de 20 séries» (`SeriesService.js:140-143`) e a coluna `updatedAt` |
| 9 | superfície pública, debug, custo | **corrigido** | `arch.md` «Segurança e abuso»: `server/index.js:66,134-136`, `debug.js:98-104`, `ai.js:7-27`, `aiClient.js:32`, `SpotifyAuthService.js:179-182`, `index.html:9` — conferem; «custo por chamada paga não está estimado» entra em Desempenho |
| 12 | duas receitas de implantação «equivalentes»; Node 18 sem custo | **corrigido** | `arch.md` Implantação do backend e Runtime; `scripts/deploy-backend.sh:27-33` (cópia de `shared`, `package.json` `type: module` e `config/`); `ci-firebase.yml:22,55` |
| 13 | ciclo de vida das coleções globais e `albumQueries` | **corrigido** | `data-model.md` Album, SpotifyEnrichment e Series (`SeriesService.js:176-180`, `firestore.rules:42-43,49-51`, `SpotifyEnrichmentStore.js:49-55`) |
| 14 | `_schemaVersion` | **corrigido** | `data-model.md` «Versão de esquema»: `BaseRepository.js:162,195` gravam, `update` (`:239`) não; só `SpotifyEnrichmentRepository` lê |
| 18 | `shared/` só tem curadoria e normalização; Axios no cliente | **corrigido** | `arch.md` linha «Autenticação de usuário (`shared/services/AuthService.js`)» e §Compartilhamento; `tech-stack.md` (Axios só no servidor, uFuzzy, SDK 11.6.1, Tailwind inline) |
| 10, 11 | (não eram afirmações dos documentos) | sem alteração | token do Discogs, sensores: continuam abertos no código |

**Seis (na verdade nove) afirmações novas das seções acrescentadas, que eu não havia conferido:**

| # | Afirmação nova | Âncora lida | Resultado |
|---|---|---|---|
| N1 | `scripts/deploy-backend.sh` faz as duas coisas em `:27-33` e usa `gcloud run deploy --source server` | `deploy-backend.sh:27` (`cp -r shared server/_shared_temp`), `:29` (`package.json` `type: module`), `:33` (`cp -r config server/config`) | confere |
| N2 | uFuzzy 1.0.14 copiado para `public/js/vendor/uFuzzy.js` (não vem do npm) | cabeçalho do arquivo «(v1.0.14)»; importado por `workers/search.worker.js:6` | confere |
| N3 | a store pura fica < 150 linhas; trabalho do Sprint 19 em `docs/technical/specs/archive/sprint19-frontend-modularization/` | pasta existe; ADR-0017 «< 150 LOC» | confere |
| N4 | `_schemaVersion` gravado por `BaseRepository` em criar e salvar; só o Spotify o lê | `BaseRepository.js:162,195`; leitura só em `SpotifyEnrichmentRepository.js` | confere |
| N5 | `users/{uid}/series/**` (regras `:19-28`) sem uso, só migração legada | `AlbumRepository.js:26` usa esse layout; `MigrationUtility`; nenhum outro | confere |
| N6 | `shared/services/AuthService.js` só é usado pelo navegador | importadores: `UserStore.js:1`, `LoginModal.js:5`, `TopNav.js:5`, `AuthNav.js:8`; nenhum em `server/` | confere |
| N7 | `createSeries` grava `updatedAt`; a migração e `createFromInventory` não | `SeriesService.js:81-84`; `DataSyncService.js:58-66`; `SeriesRepository.js` sem `updatedAt` | confere |
| N8 | Node 18 fora de suporte desde abril de 2025 | fato externo (fim de vida do Node 18 em 2025-04-30); usado em `Dockerfile:1`, `ci-firebase.yml:22,55` | confere |
| N9 | constituição: «O `localStorage` passa por `StorageService`» | só `PlaylistsService.js` e `SeriesService.js` o usam; 10 arquivos tocam `localStorage` direto | **ainda falso em parte** (nota de Higiene) |

**O que ainda está falso ou impreciso nos documentos:** só o N9 (constituição, Repository). A ADR-0017 diz «`playlists.js` 132 linhas» e o arquivo tem 161; a ADR é registro `Accepted` e não é editada (o `arch.md` já diz que `playlists.js` cumpre «só estado»; a constituição fala em «abaixo de 150» — 161 > 150 é pequena divergência de código, P2 dentro do achado 5). `tech-stack.md` segue `Draft`, e a ADR-0018 `Proposed`: decisões do humano.

**Defeitos de código que seguem abertos e são itens de Fix (`violates::`), sem dobrar a regra:** 1 (`PRINCIPLES §I.3`, ADR-0017); 2 (Constituição Art. V); 4 (`§I.3`, ADR-0016); 5 (ADR-0017); 6 e 7 (`§I.8`, Art. I); 8; 9 (Art. V); 10 (`§I.14`); 11 (`§I.9`, GV-03); 12 (`§I.5`, Art. V); 13; 14 a 18.

Veredito de novo: **recorte em ordem; P0 1 (VT-06, código), P1 11, P2 5; achado 3 fechado.** Os documentos passam como retrato do código; o baseline do `arch.md` pode ir ao humano com o P0 1 explícito como conserto aberto.

## Entrada para o log (a escrever pelo orquestrador — este agente não edita `docs/log.md`)

```
## [2026-10-28 12:31] review — mjrp-critiquing-architecture: nova passada após a correção dos documentos · recorte em ordem (1 P0 de código)

- Relatório: `reports/audits/2026-10-28-mjrpalbumblender-v0-architecture-audit.md` (primeira passada 12:19: P0 3 · P1 10 · P2 5) · agora P0 1 · P1 11 · P2 5 · higiene 4 · quem julgou: agente separado.
- Decisões do humano: exceção de algum P0 (recomendo não); quem escreve em `/albums` e `spotify_enrichment`; limite de 20 séries; alcance do §I.14 para o token do Spotify; aceite da ADR-0018 e aprovação do `tech-stack.md`.
```
