---
type: ux-audit
subject: "Reconferência visual pré-merge do ramo fix/f75-clear-cache-keeps-the-inventory-values (UAT-267): «Clear Cache» guarda os valores lidos do Discogs e o câmbio, esvazia os caches de álbuns pelo nome, e nada mais é desenhado diferente"
project: mjrpalbumblender-v0
features: [F75]
moment: delivery
date: "2026-11-21 21:00"
judged: "2026-11-21 21:00"
judged_commit: 01d26d9
who_judged: separate-agent
verdict: pass
p0: 0
p1: 0
p2: 1
duration_s: 2100
status: open
---

# Reconferência visual — «Clear Cache» guarda os valores do inventário

**Veredito: passa (`pass`), sem P0 e sem P1; 1 P2.** Depois de «Clear Cache», no computador (1280) e no celular (393), os valores lidos continuam na tela, recarregar não mostra «N albums are waiting for a value» e o servidor não é chamado de novo. Às seis horas e um minuto os valores somem e o aviso volta. Os caches de álbuns, rankings, Spotify e documentos são esvaziados. O inventário e o rodapé são os mesmos pixels de antes. Fica um P2 de texto: o rodapé diz «Clear Cache» / «Cache Cleared!» e agora guarda parte do cache.

## Como foi feito
- **Quem julgou:** um agente juiz (Opus) que não construiu o ramo.
- **Objeto:** `01d26d9` (depois) contra `main` = `ccc9feb` (antes, a base do ramo), cada um extraído com `git archive` para a pasta de rascunho (`roots/after`, `roots/before`). Nada foi escrito no repositório.
- **Costura:** sem entrar não se chega ao inventário, então usei a costura das provas da F76 (`reports/evidence/visual-recheck-batch/2026-11-21/inventory/harness/`), estendida (`harness/inventory.js`):
  - **Reais:** a `InventoryView` e o controlador, a casca do celular, o `Footer` com o `clearAppAlbumCaches` do app, o `InventoryValueService` sobre o `cacheManager` do app (memória e IndexedDB `mjrp-cache`) e a folha «Clear the album cache?».
  - **Substituídos:** a chamada de valor ao servidor (`valueSources`, `exchangeRates`, `albumValue`), como em `test/visual/inventoryValuesStayInBrowser.mjs`, que conta as chamadas. O Firebase é um módulo vazio, e todo endereço que não é 127.0.0.1 é recusado (nenhum foi pedido: zero recusas, então nenhum pedido ao Firebase Auth nem ao Firestore). Sem login de verdade.
  - **Servidor:** Vite de desenvolvimento, `vite.harness.config.mjs`, nas portas 5611 (antes) e 5612 (depois), fechado no fim do roteiro.
- **Navegador:** Chromium do Playwright 1.56.1, de `/Users/maujrp/mjrp/projects/MJRPpersonal/node_modules/playwright` (este repositório não tem Playwright). 1280 × 800, e 393 × 852 com toque e escala 2. O relógio fixo (`page.clock.setFixedTime`) foi movido para seis horas e um minuto depois.
- **Fila:** rodado por `machine_load.py run --label judge-f75-clearcache`. Roteiro em `drive.mjs`, resultados em `results.json` e `parity.json`.

## O que foi conferido
1. **Valores, «Clear Cache», recarregar e seis horas, em 1280 e 393** (`results.json` → `after-1280`, `after-393`):
   - **Ao abrir, sem nada guardado:** «8 albums are waiting for a value.» e «Read them now». Depois do clique, 8 chamadas de valor e os valores aparecem (`*-1-open`, `*-2-values`).
   - **No computador:** o rodapé diz «Clear Cache», sem pergunta (igual a antes). Depois do clique, «Cache Cleared!» em vermelho, e a página recarrega um segundo depois (`after-1280-3-footer-before-click`, `-4-footer-cleared`).
   - **No celular:** o rodapé não aparece. «Clear album cache» fica no menu e abre a folha «Clear the album cache?» com «The albums are loaded again from their sources the next time you open them. Your series, rankings, playlists and inventory are kept.», «Cancel» e «Clear cache». Depois aparece o aviso «Cache cleared» (`after-393-3-menu`, `-4-sheet`, `-4b-toast`). O texto é o mesmo de antes; o código desses textos não mudou no ramo.
   - **Depois da recarga e de mais uma:** os valores continuam (`≈ $22.33`, «Discogs»), sem o aviso de espera. As chamadas de valor ficam em 8, e o câmbio não é pedido de novo (`*-5-after-clear-reload`).
   - **Seis horas e um minuto depois:** as leituras somem do IndexedDB, «8 albums are waiting for a value.» volta e os cartões dizem «Waiting for a value» (`*-7-after-6h`).
   - **Controle no `main`:** a mesma sequência mostra o defeito de UAT-267. Depois de «Clear Cache», o aviso de espera volta na hora e as leituras somem (`before-*-5-after-clear-reload`). O roteiro, portanto, separa o antes do depois.
2. **«Clear Cache» ainda faz o trabalho dele:**
   - **O que saiu:** antes do clique, pus no cache do app uma chave de cada nome que o botão deve apagar: `albumload:v1:…`, `userRanking:…`, `spotify_enrichment:…`, `artifacts/…/inventory:…` e `artifacts/…/series:all`. Depois do clique, as cinco saíram do IndexedDB.
   - **O que ficou:** só `inventoryvalue:v2:user-1:*` (8) e `exchangerates:v1`.
   - **Textos:** a folha do celular e do painel diz «album cache», e o que ela promete como guardado (séries, rankings, listas, inventário) fica guardado na nuvem. O que ela não lista (os valores e o câmbio) também fica. Nada afirma algo falso, exceto o rótulo do rodapé (P2-1).
3. **Nada mais desenhado diferente** (`parity.json`): a página inteira com os valores lidos, comparada pixel a pixel (limiar 16):
   - **Antes contra antes (controle):** 0 px diferentes em 1280 (1280 × 1653) e em 393 (786 × 2670).
   - **Antes contra depois:** 0 px diferentes em 1280 e em 393. O rodapé está dentro dessa comparação.
   - **Arquivos do ramo:** nenhum arquivo de vista, componente ou CSS mudou. O diff toca só `cache/` e `services/albums/clearAlbumCaches.js`.

## Achados
- **P2-1 · o rodapé do computador diz «Clear Cache» / «Cache Cleared!», mas agora apaga só os caches de álbuns.**
  - **O problema:** o rótulo e o aviso não têm pergunta nem explicação. Quem clica para limpar tudo (por exemplo, para forçar uma nova leitura de valores) vê «Cache Cleared!», e os valores do Discogs e o câmbio continuam. Antes do ramo o rótulo era verdadeiro: o botão esvaziava o IndexedDB inteiro. O menu do celular e o painel do computador já dizem «Clear album cache».
  - **Âncora:** `public/js/components/Footer.js:1` (`CLEARED_TEXT`) e `:44` (o rótulo).
  - **Evidência:** `after-1280-4-footer-cleared.png`.
  - **A mudança:** o rodapé diz «Clear album cache» e «Album cache cleared», como o menu; ou passa a abrir a mesma folha `askToClearCache`. O `behavior.md` (`^app-clear-cache`) já descreve o que fica.

## Não visto
- **A tela de álbuns recarregando do catálogo de verdade:** precisa de login e do Firestore, que ficaram bloqueados. Conferi a causa (as chaves `albumload:` saem do IndexedDB pelo código real do botão), não a tela de álbuns carregando de novo.
- **O app pelo próprio servidor (`vite.config.js`, `app.html`) com uma conta real:** julguei pela costura, com os componentes reais.
- **A memória (L1) do `CacheManager` próprio do Spotify (`spotifyPopularityWiring.js`):** o botão não a esvazia, nem antes nem agora. A página recarrega logo depois, então isso não aparece na tela.
- **Chaves de versões antigas que um navegador real ainda guarde em `mjrp-cache` com outros nomes:** agora elas ficam, porque o botão só apaga os nomes da lista. Não há como ver isso sem o navegador do dono.
- **Safari e iPhone de verdade:** só o Chromium.
