<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F59: Fechar o que está aberto: banco, servidor e chaves · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito junto com o código, fatia por fatia (via rápida). A fatia C teve o desenho escrito aqui antes do código.

## Architecture Approach
A segurança entra em três pontos, cada um com um dono só:
- **Regras do banco:** o arquivo `firestore.rules` do repositório é a fonte, igual ao que está em vigor, e um teste lê o arquivo e recusa regra sem condição ou dado pessoal sem dono (uma regra de arquitetura como teste).
- **Porta do servidor (fatia C):** três peças puras e uma de montagem (DP-14 porta, DP-15 raiz de composição). `verifyIdToken.js` confere o login e recebe de fora quem busca as chaves; `requireUser.js` é a porta (401, 403, 503); `rateLimit.js` conta por pessoa; `guards.js` é o único arquivo que conhece o endereço do Google e as variáveis de ambiente. Fechado por padrão: sem variável nenhuma, quem não está logado não passa; sem conseguir buscar as chaves, ninguém passa.
- **Borda do app:** `api/serverFetch.js` é o único jeito de o app chamar o próprio servidor; ele junta o login a cada chamada. `createServerFetch` é puro.

**Alternativas pesadas para a fatia C:**
- *Firebase Admin SDK no servidor:* faria a mesma conferência com uma dependência grande; a conferência à mão é a que o Firebase documenta, cabe em um arquivo e é testada com chaves geradas no teste.
- *Firebase App Check:* prova que a chamada vem do app, não só de alguém logado; pede cadastro no console (reCAPTCHA) e fica como reforço possível depois.
- *Limite por endereço IP em vez de por pessoa:* atrás do Hosting o endereço é o do Google; por pessoa é o que distingue alguém.
- *Limite guardado fora da memória (banco):* daria um teto exato com várias instâncias; custa uma leitura por chamada. O limite em memória já impede um login de gastar sem fim; não é garantia de cobrança, e isso está escrito no arquivo.

## Technical Design
- `firestore.rules`, `firebase.json`, `test/security/firestoreRules.test.js` (fatia A).
- `public/js/services/SpotifyAuthService.js`, `public/js/components/navigation/AuthNav.js`, `vite.config.js` (fatia A).
- `server/lib/debugGate.js`, `server/lib/asyncRoute.js`, `server/index.js`, `server/routes/albums.js`, `server/lib/services/GenerationService.js` (fatia B).
- `server/lib/auth/verifyIdToken.js`, `requireUser.js`, `guards.js`, `server/lib/rateLimit.js`, `server/index.js` (fatia C, servidor).
- `public/js/api/serverFetch.js`, `public/js/api/client.js`, `public/js/services/album-search/AlbumSearchService.js` (fatia C, app).

## UI/UX Design (if the feature touches a screen)
Nenhuma tela muda. Um visitante que busca um artista na Home deixa de receber a lista de álbuns por IA e cai na classificação sem ela, como já acontecia quando a IA falhava.

## Dependencies
Nenhuma dependência nova. O servidor passa a buscar as chaves públicas do Google (`googleapis.com`), com o `axios` que já usa.

## Documents Consulted
- `reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`, seção B
- A documentação do Firebase sobre conferir ID tokens sem o Admin SDK (as regras de `aud`, `iss`, `exp`, `iat`, `sub` e as chaves públicas)
- `docs/wiki/harness/design-patterns.md` (DP-14, DP-15, DP-20)

## Risks & Considerations
- **Ordem de publicação:** o site vai primeiro (passa a mandar o login; o servidor antigo ignora), o servidor depois (passa a exigir). Ao contrário, o app em produção ficaria sem notas e sem a segunda fonte até o site sair.
- **Quem está com a página aberta desde antes** não manda o login até recarregar: recebe 401 nas notas e vê o aviso de falha; recarregar resolve.
- **Se o servidor não conseguir buscar as chaves do Google**, responde 503 e ninguém passa. Volta: a revisão anterior do Cloud Run.
- **Visitante sem conta** perde as rotas pagas (decisão do agente, revisável).

## Test plan
- `test/security/firestoreRules.test.js`, `test/services/spotify/SpotifyAuthSafety.test.js`, `test/components/AuthNav.signout.test.js` (fatia A).
- `test/server/debugGate.test.js` (fatia B).
- `test/server/authGuard.test.js` (31 casos: o que o conferidor aceita e recusa, a porta, o limite) e `test/api/serverFetch.test.js` (fatia C).
- No servidor de verdade, numa cópia local e em produção: a evidência da feature.
