# HOTFIX: Ranking de Aclamação (BestEver ratings) — Registro, ações e verificação

Data: 2025-11-24

Resumo executivo
----------------
- Problema: o painel "Ranking de Aclamação" às vezes mostrava faixas fora da ordem esperada — menções do BestEver não estavam sendo reconhecidas corretamente e algumas faixas (ex.: "Another Brick in the Wall" partes) apareciam com rawScore 0 e foram empurradas para o fim.
- Ações imediatas (hotfix cliente): ajustes em `public/js/app.js` e `public/hybrid-curator.html` para restauração visual da ordenação por `rating` quando disponível, preservando a numeração original das faixas nos álbuns e adicionando um log discreto no footer.
- Correção principal aplicada: reforço da normalização e do mapeamento server-side (em `server/lib/ranking.js` e `server/index.js`) e melhorias no `collectRankingAcclaim` do cliente para evitar deduplicação incorreta.

Histórico técnico detalhado (trecho do chat e passos executados)
----------------------------------------------------------------
1) Investigação inicial (reprodução):
   - Comando usado para reproduzir o payload do servidor:
```bash
curl -sS -X POST http://localhost:3000/api/generate -H "Content-Type: application/json" -d '{"albumQuery":"Pink Floyd - The Wall"}' | jq .
```
   - Observação: o `rankingAcclaim` vinha com títulos levemente diferentes (pontuação/maiúsculas/virgulas), por exemplo:
     - "Another Brick In The Wall Part 2" vs "Another Brick in the Wall, Part 2".

2) Mudanças no servidor (normalização/mapeamento):
   - Arquivo: `server/lib/ranking.js` (consolidateRanking)
   - Ação: Melhorei `normalizeKey` para:
     - lowercase;
     - remover diacríticos (NFD + remoção de \p{M});
     - remover caracteres não alfanuméricos (pontuação/virgulas);
     - colar múltiplos espaços.
   - Efeito: agora diferentes variantes dos títulos mapeiam para a mesma chave, permitindo que contagens Borda e supporting evidence sejam aplicadas corretamente.

3) Mapeamento robusto de `rankingConsolidated` para `tracks[]`:
   - Arquivo: `server/index.js` (endpoint /api/generate)
   - Ação: usei a mesma normalização ao mapear `finalPosition` para `tracks[].rank` para reduzir misses.

4) Mudanças no cliente (deduplicação e coleta de aclamação):
   - Arquivo: `public/js/app.js`
   - Ações aplicadas:
     - `collectRankingAcclaim` agora inclui `trackTitle` e `albumId` em cada item retornado.
     - A chave de deduplicação foi fortalecida para: `provider::albumId::trackTitle::position::referenceUrl`.
       - Isso evita que entradas sem `position` ou sem `referenceUrl` sobrescrevam outras, reduzindo colisões no conjunto `seen`.
     - O `renderRankingAcclaimList` foi ajustado para preferir `rating` quando presente para ordenação visual (hotfix UI).
   - Efeito: evita perda de entradas do BestEver em caso de campos faltantes; garante `trackTitle` disponível para renderização.

5) Reinício e validação local:
   - Reiniciei o servidor estático / proxy local:
```bash
./scripts/stop-local.sh || true && ./scripts/start-local.sh
```
   - Re-executei o `curl` para `Pink Floyd - The Wall` e observei:
     - Antes: as três partes de "Another Brick..." tinham `rawScore: 0` e `supporting: []`.
     - Agora: `rankingConsolidated` mostra:
         - "Another Brick in the Wall, Part 2" com `supporting` (position:3) e `finalPosition: 4`
         - "Another Brick in the Wall, Part 1" com `supporting` (position:8) e `finalPosition: 8`
         - "Another Brick in the Wall, Part 3" com `supporting` (position:15) e `finalPosition: 14`
     - `tracks[].rank` foi atualizado em conformidade no payload.

Razão raiz identificada
------------------------
- A função de consolidação só contava menções quando o título normalizado do BestEver batia exatamente com a normalização dos títulos do `tracks[]`.
- A normalização antiga era insuficiente (`trim().toLowerCase()`), então variantes com vírgulas/pontuação não batiam e eram ignoradas.
- Além disso, a deduplicação no cliente poderia colidir entradas sem `position` ou `referenceUrl`, descartando menções válidas.

Alterações-chave aplicadas
-------------------------
- `server/lib/ranking.js`: normalizeKey reforçada (diacríticos + remover não-alfanuméricos).
- `server/index.js`: mapeamento de `rankingConsolidated.finalPosition` para `tracks[].rank` usando normalização consistente.
- `public/js/app.js`: `collectRankingAcclaim` agora inclui `trackTitle` e `albumId`; dedup key: `provider::albumId::trackTitle::position::referenceUrl`.

Como validar a correção (passos para reproduzir e checar)
------------------------------------------------------
1) Garantir que o servidor local esteja rodando (ou que a versão de prod tenha rodado o deploy com as mudanças):
```bash
./scripts/stop-local.sh || true
./scripts/start-local.sh
```
2) Rodar o request de geração e inspecionar JSON (exemplo recomendado):
```bash
curl -sS -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"albumQuery":"Pink Floyd - The Wall"}' | jq .
```
3) Verificações a fazer no JSON retornado:
   - Em `rankingConsolidated` as entradas correspondentes a "Another Brick..." devem ter `supporting` preenchido e `finalPosition` coerente (não mais rawScore 0).
   - `tracks[]` deve conter `rank` definido a partir de `finalPosition` quando aplicável.
   - Os `provider` entries em `rankingAcclaim` não devem ser descartados por duplicação indevida.
4) Verificações na UI:
   - Hard-reload do cliente (⌘⇧R) para garantir novo `app.js` carregado.
   - Abra `http://localhost:8000/hybrid-curator.html` e gere as playlists.
   - No painel `Ranking de Aclamação` verifique que as partes de "Another Brick..." aparecem com as posições/ratings corretos.
   - Na view `Álbuns` confirme que as faixas continuam numeradas 1..N (ordem original não alterada).

Se ainda houver problema
-----------------------
- Cole aqui o payload JSON completo retornado pelo servidor para o álbum problemático (substitua `<Artista> - <Álbum>` pelo álbum em questão). Ex.:
```bash
curl -sS -X POST http://localhost:3000/api/generate -H "Content-Type: application/json" -d '{"albumQuery":"The Rolling Stones - Exile on Main St."}' | jq . > /tmp/payload.json
```
- Analisarei onde a origem do problema permanece: se `rankingConsolidated` não contém supporting evidence (problema do scraper/model), ou se o server mapeou incorretamente para `tracks[]` (problema do mapeamento), ou se o cliente está filtrando/ordenando de forma errada.

Reaplicar / Deploy (passos sugeridos para produção)
-------------------------------------------------
1. Commit das mudanças (se ainda estiverem em branch):
```bash
git checkout -b feature/server-acclaim-order
git add server/lib/ranking.js server/index.js public/js/app.js
git commit -m "fix(ranking): normalize keys and robust dedupe; include trackTitle+albumId in acclaim" 
git push origin feature/server-acclaim-order
```
2. Abrir PR, revisão e CI. Rodar `cd server && npm test` e validar fixtures (ex.: The Wall).
3. Merge em `main` e deploy (seguindo seu fluxo: Cloud Build / Cloud Run / Firebase Hosting). Exemplo deploy script local já existente:
```bash
./scripts/deploy-prod.sh 2>&1 | tee ~/deploy-prod.log
```
4. Monitorar pós-deploy: gerar o álbum em produção e comparar payload com o local.

**Troubleshooting em produção (passos rápidos)**

- Verifique a versão publicada do frontend: abra `https://mjrp-playlist-generator.web.app` e force full-refresh (⌘⇧R) para garantir que a nova `app.js` foi carregada.
- Obtenha o payload de geração em produção (se o backend estiver publicamente acessível):

```bash
# Exemplo (substitua <BACKEND_URL> pelo proxy público do ambiente):
curl -sS -X POST https://<BACKEND_URL>/api/generate \
   -H "Content-Type: application/json" \
   -d '{"albumQuery":"Pink Floyd - The Wall"}' | jq . > /tmp/prod_payload.json

# Inspecione se `tracksByAcclaim` existe e contém `rank` + possivelmente `rating`:
jq '.data.tracksByAcclaim | length, .data.tracksByAcclaim[0:5]' /tmp/prod_payload.json

# Verifique `rankingConsolidated` e metadados de divergência:
jq '.data.rankingConsolidated | length, .data.rankingConsolidated[0:5]' /tmp/prod_payload.json
jq '.data.rankingConsolidatedMeta' /tmp/prod_payload.json
```

- Cheque logs do servidor (procure por chaves):
   - `bestever_fast_accept` — indica que o scraper aceitou um resultado do `suggest.php` (útil para auditar a escolha do id). 
   - `model_truncation_detected` — indica resposta cortada do modelo (pode faltar faixas no resultado do modelo).
   - `rankingConsolidatedMeta` entries retornados no payload (unmatchedMentions / tracksWithoutSupport) — ajuda a identificar onde a consolidação não encontrou evidências.

- Se a UI mostra numeração correta mas a ordenação por rating ainda não aparece:
   1. Confirme que `tracksByAcclaim` no payload contém ratings. Se não contiver, o problema veio do scraper/enrichment (server-side).
   2. Se `tracksByAcclaim` contiver ratings, confirme que `public/js/app.js` em produção é a versão que prioriza rating quando presente (veja o cabeçalho do arquivo em um browser devtools: `/* UI: prefer tracksByAcclaim for numbering; preserve rating ordering when available */`).

**Rollback rápido (se necessário)**

- Reverter o commit frontend e re-publicar:

```bash
# reverter commit localmente (substitua ce78f9b pelo commit que deseja reverter)
git revert ce78f9b --no-edit
git push origin main
./scripts/deploy-prod.sh
```

- Alternativa: restaurar a versão anterior no Firebase Hosting usando a UI do Console (Console → Hosting → Releases → selecionar versão anterior e clicar em `Rollback`).

**Checks pós-deploy**

- Gere o álbum problemático na UI e confirme:
   - A numeração (nº à esquerda) corresponde ao `rank` em `tracksByAcclaim`.
   - A ordem visual dos itens segue `rating` desc quando ratings existem.
- Se divergências persistirem, cole o JSON do payload retornado pelo backend (arquivo `/tmp/prod_payload.json` ou saída do curl acima) e eu faço a análise detalhada.

O que eu preciso para conferir e reaplicar a solução agora
--------------------------------------------------------
- Permissão para rodar comandos locais (já tenho acesso ao workspace e aos scripts). Vou:
  1. Reiniciar o servidor local (`./scripts/stop-local.sh && ./scripts/start-local.sh`).
  2. Rodar o `curl` para o álbum de sua escolha e analisar o JSON.
  3. Se necessário, abrir a branch `feature/server-acclaim-order`, aplicar ajustes e rodar `cd server && npm test`.

- Informações que você pode fornecer (ajuda a priorizar):
  - Quer que eu valide `Pink Floyd - The Wall` agora? (recomendado — foi o exemplo problemático)
  - Ou prefere outro álbum que está apresentando erro em produção?

Resumo final e próximos passos recomendados
-----------------------------------------
- Estado atual: hotfix UI aplicado; normalização e deduplicação reforçadas tanto server-side quanto client-side — a validade foi verificada localmente com `Pink Floyd - The Wall`.
- Próximo passo (prioritário): consolidar as mudanças server-side em `feature/server-acclaim-order`, adicionar testes e promover para produção via PR/CD pipeline.
- Posso executar agora a verificação do payload para `Pink Floyd - The Wall` ou qualquer outro álbum que você indicar, analisar o JSON e relacionar exatamente onde persistir qualquer divergência.

FIM
