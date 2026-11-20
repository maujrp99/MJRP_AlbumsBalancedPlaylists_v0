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
- **O que vem de fora e entra na página (fatia E):** duas funções puras, cada uma dona de um caminho. `escapeHtml` (`utils/stringUtils.js`) para texto que entra num HTML; `safeUrl` (`utils/safeUrl.js`) para endereço que vira link ou é aberto: devolve o endereço só quando ele é absoluto e http ou https, lido pelo mesmo analisador que o navegador usa (`URL`). Cada uma tem a sua regra de arquitetura como teste, que lê o código e recusa o ponto que não passou pela função.
- **Estilos (fatia E):** o Tailwind é uma etapa do build do Vite, e só dele: `vite.config.js` (`css.postcss`) roda o Tailwind com o `tailwind.config.js` da raiz, no servidor de desenvolvimento e no build. A entrada é `public/css/tailwind.css` (as três linhas `@tailwind` e as classes de componente que estavam no `index.html`), importada pelo `app.js` depois do `index.css`, para as regras do Tailwind continuarem por último, como quando o script do CDN as acrescentava no fim da página. O `tailwind.config.js` diz onde há classes (`public/index.html`, `public/js/**/*.js`), guarda o tema e a lista das classes montadas na hora.

**Alternativas pesadas para o Tailwind (fatia E; detalhe na [[ADR-0021]]):**
- *Manter o CDN e registrar:* sem risco para a aparência; mantém o script de terceiros na página e a versão solta.
- *Tailwind 4 com o plugin do Vite:* a linha atual; muda padrões (cor de borda, largura de anel, jeito de escrever o tema) e mudaria a aparência sem ninguém pedir.
- *Tailwind 3.4 pelo PostCSS do Vite:* a mesma linha do CDN, as mesmas classes dão o mesmo CSS. Escolhida.
- *Tailwind CLI num passo separado:* seria um segundo caminho de build, que o script de publicação teria de conhecer. Recusada: um caminho só.

**Alternativas pesadas para o endereço (fatia E):**
- *Conferir dentro do `SafeDOM.a`:* pegaria todo link criado por ele, mas não o `window.open` nem o `href` escrito em template; e os endereços internos (`/playlists`) teriam de passar por uma regra à parte. Recusada: a função chamada onde o endereço de fora entra, mais o teste que lê todos os pontos.
- *Aceitar endereço relativo:* um provedor não manda endereço relativo; aceitar abriria `//outro-host/...`. Recusada.

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
- `public/js/utils/stringUtils.js` (`escapeHtml`) e os 20 arquivos que desenham texto de fora (fatia E, texto).
- `public/js/utils/safeUrl.js`, `public/js/components/ui/Card.js`, `public/js/views/ConsolidatedRankingView.js`, `public/js/components/SpotifyExportModal.js` (fatia E, endereços).
- `tailwind.config.js`, `vite.config.js`, `public/css/tailwind.css`, `public/js/app.js`, `public/index.html`, `public/css/tech-theme.css`, `package.json`, `package-lock.json` (fatia E, Tailwind).

## UI/UX Design (if the feature touches a screen)
Nenhuma tela muda. Um visitante que busca um artista na Home deixa de receber a lista de álbuns por IA e cai na classificação sem ela, como já acontecia quando a IA falhava. Na fatia E a troca do Tailwind não deve mudar nenhuma tela: a ordem das folhas de estilo, o tema e as classes de componente são os mesmos. Um endereço de fonte que não é da web vira um traço na tabela do ranking consolidado.

## Dependencies
Uma dependência nova, de desenvolvimento, na fatia E: `tailwindcss` 3.4.19 ([[ADR-0021]]); quem compila precisa rodar `npm ci`. O `scripts/deploy-site.sh` já roda `npm ci` e `npx vite build` numa cópia limpa: não muda. O servidor passa a buscar as chaves públicas do Google (`googleapis.com`), com o `axios` que já usa.

## Documents Consulted
- `reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`, seção B
- A documentação do Firebase sobre conferir ID tokens sem o Admin SDK (as regras de `aud`, `iss`, `exp`, `iat`, `sub` e as chaves públicas)
- `docs/wiki/harness/design-patterns.md` (DP-14, DP-15, DP-20)
- `docs/specs/constitution.md`, Art. II («Tailwind only if requested») e a nota CM-0071 do harness (a stack só muda por ADR)
- A configuração e o bloco de estilos do Tailwind que estavam em `public/index.html` (levados sem mudança)

Declarações do passo retroativo da via rápida (conferidas no histórico do repositório em 2026-11-19):
- `docs/specs/constitution.md` — sem mudança: nenhum padrão de código nem dependência novos
- `docs/specs/arch.md` — atualizado (commit `0daec03`)
- `docs/specs/data-model.md` — sem mudança: nenhuma entidade, campo ou esquema mudou
- `docs/specs/tech-stack.md` — atualizado (commit `0daec03`)
- `docs/specs/design-system.md` — sem mudança: o projeto não tem `docs/specs/design-system.md`; nenhum token, fonte ou componente compartilhado mudou
- `docs/wiki/` — sem mudança: as páginas de `docs/wiki/` do projeto são só as do harness; nenhuma descreve uma regra do app que esta feature mudou

## Risks & Considerations
- **Ordem de publicação:** o site vai primeiro (passa a mandar o login; o servidor antigo ignora), o servidor depois (passa a exigir). Ao contrário, o app em produção ficaria sem notas e sem a segunda fonte até o site sair.
- **Quem está com a página aberta desde antes** não manda o login até recarregar: recebe 401 nas notas e vê o aviso de falha; recarregar resolve.
- **Se o servidor não conseguir buscar as chaves do Google**, responde 503 e ninguém passa. Volta: a revisão anterior do Cloud Run.
- **Visitante sem conta** perde as rotas pagas (decisão do agente, revisável).
- **Classe sem regra depois da troca do Tailwind (fatia E).** O Tailwind compilado só escreve a classe que acha inteira nos arquivos da lista; o do CDN olhava a página viva e achava tudo. Uma classe montada por pedaços, ou escrita numa pasta fora da lista, fica sem estilo e nada avisa. Rede: o teste `tailwindBuiltWithSite` (toda classe que o Tailwind acha no texto está no CSS; toda montagem de nome de classe está lida e listada). O teste lê formas, não sentido: um jeito novo de montar classe pode passar.
- **Versão do Tailwind.** O CDN servia a linha 3 sem versão fixa (o número exato do dia não foi conferido: esta sessão não chamou o CDN); o build fixa a 3.4.19. Uma diferença de detalhe entre versões da linha 3.4 só aparece no navegador.
- **Ordem das folhas.** No build as regras do Tailwind ficam no fim do mesmo arquivo CSS, depois das do app, como ficavam quando o script as acrescentava no fim da página. No servidor de desenvolvimento a ordem é a dos `import` do `app.js`, a mesma.
- **Quem está com a página aberta desde antes** continua com o Tailwind do CDN até recarregar; nada quebra.
- **Nada da fatia E deste ramo foi visto num navegador por quem implementou.**

## Test plan
- `test/security/firestoreRules.test.js`, `test/services/spotify/SpotifyAuthSafety.test.js`, `test/components/AuthNav.signout.test.js` (fatia A).
- `test/server/debugGate.test.js` (fatia B).
- `test/server/authGuard.test.js` (31 casos: o que o conferidor aceita e recusa, a porta, o limite) e `test/api/serverFetch.test.js` (fatia C).
- `test/utils/escapeHtml.test.js`, `test/security/outsideTextIsText.test.js`, `test/architecture/outsideTextEscaped.test.js` (fatia E, texto).
- `test/utils/safeUrl.test.js` (o que a função aceita e recusa), `test/security/outsideUrlIsChecked.test.js` (o cartão e a linha do ranking desenhados com `javascript:...`), `test/architecture/outsideUrlChecked.test.js` (todo `href`, `window.open` e troca de endereço de `public/js`) (fatia E, endereços).
- `test/architecture/tailwindBuiltWithSite.test.js` (7 casos: nenhuma página do site cita o CDN; o `app.js` importa a folha do Tailwind depois da do app; toda classe achada no texto está no CSS construído; o tema veio junto; as classes de componente em uso estão lá; toda montagem de nome de classe está listada; as cores de receita com `/10` estão lá) e `test/security/buildHandsOutNoSource.test.js` (fatia E, Tailwind; fatia A, mapas).
- No servidor de verdade, numa cópia local e em produção: a evidência da feature.
- No navegador, pelo integrador: as telas listadas na TASK-13 do `tasks.md`, antes e depois, para a troca do Tailwind.
