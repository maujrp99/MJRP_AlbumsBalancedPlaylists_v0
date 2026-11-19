---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-175", "UAT-176", "UAT-177"]
---
# Feature F48: O guardado de álbuns é confiável: nova tentativa, sem gravar à toa, e o Clear Cache limpa de verdade
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** O que o app guarda no navegador sobre álbuns passa a se comportar como a pessoa espera: uma falha passageira do servidor é tentada de novo, o ranking pessoal já lido não é pedido outra vez a cada visita, o álbum gravado na nuvem não leva o ranking pessoal de ninguém, e o botão «Clear Cache» apaga de fato o que está guardado, sem derrubar o login do Spotify.

**Por quê:** A nova tentativa nunca rodava e escondia o erro real; o guardado do ranking pessoal nunca agia; e o botão de limpar apagava tudo menos o guardado de álbuns.

**Como saber que funcionou:** Os testes da nova tentativa, do ranking e da limpeza passam; na segunda visita à tela de álbuns não há leitura de ranking por álbum; depois do «Clear Cache» a tela busca os álbuns de novo e o Spotify continua conectado.

## Problem Statement
Três defeitos do mesmo assunto, o guardado de álbuns (issues UAT-175, UAT-176 e UAT-177), e uma dívida de arquitetura ligada a eles (parte da UAT-14):
- A nova tentativa ao servidor (`POST /api/generate`, IA paga) lia uma variável declarada noutro bloco e estourava `ReferenceError` antes de rodar: a primeira falha encerrava o álbum e o erro mostrado não era o verdadeiro.
- O repositório do ranking pessoal guardava a classe do cache em vez da instância: nenhuma leitura era guardada, e cada visita relia o ranking de cada álbum na nuvem. (A outra metade da UAT-176, a regravação de cada álbum a cada carga, saiu com a F45.)
- O botão «Clear Cache» só fazia `localStorage.clear()`: os álbuns, que moram no IndexedDB `mjrp-cache` e na memória, ficavam; e o login do Spotify e as escolhas de tela iam embora.
- A prateleira de álbuns (`stores/albums.js`) ainda falava com o Firestore, e a gravação do «Refetch Metadata» levava o ranking pessoal para dentro de um documento compartilhado.

## Requirements
- [REQ-01] Quando a busca de um álbum no servidor falha por falta de resposta da rede ou com erro 5xx, o app tenta de novo até duas vezes, esperando mais a cada vez, com variação na espera. · fixes UAT-175
  verified_by:: `test/api/client.test.js`, `test/utils/retry.test.js`
- [REQ-02] Uma resposta 4xx do servidor (400, 402, 404, 429) nunca é tentada de novo, e uma chamada que passou do prazo também não. · fixes UAT-175
  verified_by:: `test/api/client.test.js`
- [REQ-03] O erro que chega a quem pediu o álbum é o verdadeiro: diz se o servidor respondeu, não respondeu ou demorou demais, e traz o código da resposta quando há. · fixes UAT-175
  verified_by:: `test/api/client.test.js`
- [REQ-04] O ranking pessoal de um álbum, depois de lido, não é pedido de novo à nuvem por uma hora, inclusive quando a resposta foi «este álbum não tem ranking». · fixes UAT-176
  verified_by:: `test/repositories/UserRankingRepository.test.js`
- [REQ-05] Salvar ou apagar um ranking faz a leitura seguinte buscar o dado novo. · fixes UAT-176
  verified_by:: `test/repositories/UserRankingRepository.test.js`
- [REQ-06] O botão «Clear Cache» para a carga em andamento e apaga tudo o que o app guardou no navegador sobre álbuns; a carga seguinte busca os dados de novo. · fixes UAT-177
  verified_by:: `test/services/albums/clearAlbumCaches.test.js`, `test/components/Footer.test.js`, `test/cache/CacheManager.clear.test.js`
- [REQ-07] O botão «Clear Cache» não apaga o resto do que o navegador guarda: o login do Spotify, as séries salvas e as escolhas de tela continuam. · fixes UAT-177
  verified_by:: `test/services/albums/clearAlbumCaches.test.js`, `test/components/Footer.test.js`
- [REQ-08] Quando a limpeza falha, o botão diz que não limpou e não recarrega a página. · fixes UAT-177
  verified_by:: `test/components/Footer.test.js`, `test/cache/CacheManager.clear.test.js`
- [REQ-09] O álbum que o «Refetch Metadata» grava na coleção compartilhada não leva o ranking pessoal de ninguém. · fixes UAT-14 (parte)
  verified_by:: `test/repositories/SharedAlbumRepository.test.js`
- [REQ-10] A prateleira de álbuns só guarda estado: não fala com o banco de dados; quem grava o álbum é um repositório. · fixes UAT-14 (parte)
  verified_by:: `test/architecture/albumLoadBoundaries.test.js`, `test/services/SeriesService.test.js`

## Observable States
N/A: a feature não importa nenhum requisito (conserto das issues UAT-175, UAT-176 e UAT-177), então nenhum estado é apontado. O que a tela mostra, para registro:
- Rodapé, depois de clicar em «Clear Cache» com sucesso: «Cache Cleared!», e a página recarrega um segundo depois.
- Rodapé, quando a limpeza falha: «Could not clear the cache», sem recarregar; o botão volta a aceitar clique.

## Prototype Parity (if the feature touches a screen)
- Prototype: N/A. Não há protótipo: o botão do rodapé e o seu aviso já existiam; só mudou o que o botão faz e um texto de falha novo no mesmo lugar.
- Transversal layer touched: shell (o rodapé). Nenhum token, fonte ou componente compartilhado novo.
- Design-system cuts or swaps: none. O projeto não tem `design-system.md`.

## Success Criteria
- Servidor respondendo 503 e depois 200: dois pedidos e o álbum na mão (teste).
- Rede fora: três pedidos, esperas de até 1 s e 2 s, e um erro que diz «got no answer» (teste).
- Servidor respondendo 402: um pedido só, e o erro traz `status: 402` (teste). É o que produção responde hoje.
- Duas leituras seguidas do ranking do mesmo álbum: uma ida à nuvem (teste). A conferir no navegador: na segunda visita à tela de álbuns, nenhuma leitura de `albumRankings` por álbum.
- Depois do «Clear Cache»: o cache do app vazio, zero chaves `album_cache_v…`, e as outras chaves do `localStorage` intactas (teste). A conferir no navegador: a tela de álbuns busca tudo de novo e o Spotify segue conectado.
- O documento gravado pelo «Refetch» não tem `hasUserRanking`, `userRanking` nem `userRank` nas faixas (teste).
- A lista de arquivos fora de `repositories/` que importam o Firestore caiu de três para dois (função de aptidão).
- Suíte inteira: 271 passam; as mesmas 28 falhas da linha de base, nenhuma nova. `npx vite build` compila.

## Out of Scope
- Fazer o servidor voltar a responder em `POST /api/generate` (hoje 402): é a F52.
- Mostrar na tela «o servidor falhou» em vez de «álbum não encontrado» quando a segunda fonte falha: o adaptador do catálogo continua tratando a falha como «não encontrado» e agora registra o motivo no console. Mudar o estado da tela é assunto da F46.
- Passar o «Refetch Metadata» pela fila da carga (tarefa aberta, TASK-12).
- Decidir se a coleção compartilhada `albums` continua a ser gravada: nenhum ponto do app a lê de volta (decisão 1 da proposta de arquitetura, do MJRP).
- Limpar dos documentos já gravados o ranking pessoal que entrou antes desta feature.
- As regras do Firestore da coleção `albums` e de `albumRankings` (UAT-15).

## Open Questions
- O «Clear Cache» devia apagar também o resto do `localStorage` (login do Spotify, séries salvas, escolhas de tela), como fazia? — o agente construiu «só o guardado de álbuns», como o pedido da sessão de integração mandou; a pergunta fica para o MJRP no julgamento, sem bloquear. Sessão de integração, 2026-11-19.
- A chamada que passa do prazo de 90 s não é tentada de novo, para não pagar duas vezes pela IA: o prazo e a regra servem? — decisão do agente, revisável pelo MJRP no julgamento. 2026-11-19.
