---
type: regression-report
subject: "Regressão completa do Album Blender v0 no navegador: cenários, resultados e diagnóstico"
project: mjrpalbumblender-v0
run: "2026-11-19, das 14:05 às 14:30 (Brasília)"
written: "2026-11-19 14:21"
who_ran: o agente implementador da sessão de consertos do v0 (o mesmo que fez os consertos; não é um juiz separado)
asked_by: MJRP
---

# Regressão completa do Album Blender v0 no navegador (2026-11-19)

## Resumo

Os fluxos principais funcionam de ponta a ponta: criar, editar e apagar série; blend; editar, salvar e apagar playlists; adicionar e editar no inventário. Um fluxo não funciona (apagar do inventário) e três são lentos (playlists guardadas, blend, salvar a edição de uma série). O achado mais grave é de dado errado sem aviso: uma série pode mostrar um álbum diferente do pedido.

| | Quantos |
|---|---|
| Cenários executados | 20 |
| Passaram | 15 |
| Passaram com ressalva | 4 |
| Falharam | 1 |
| Issues novas abertas | 10 (UAT-184 a UAT-193) |
| Issues antigas confirmadas | 1 (UAT-01) |

## Como foi feito

- **Pedido do MJRP:** «fazer um regression teste gerar criando uma lista de albuns do claude, vc faz um blending, edita playlists, adiciona no inventory. Faz um full testing no site, (testando os cruds) e vai logando issue encontradas».
- **Onde:** `http://127.0.0.1:5010` (código da `main` de 2026-11-19, com a F46, a F48 e a F50), no navegador embutido do Claude, falando com o servidor e o banco de produção.
- **Conta:** a do MJRP, com login feito por ele. Na conta havia 46 séries.
- **Dados de teste:** a série «Claude Regression Test» (depois «Claude Regression Test v2»), com álbuns de Kendrick Lamar e Madvillain; o lote de playlists «Claude Regression Batch»; o item «GNX» no inventário.
- **Como:** cliques e digitação reais na tela; o estado conferido lendo a tela, as lojas do app e o console.

## Cenários e resultados

| # | Área | Cenário | Resultado | Observação |
|---|---|---|---|---|
| 1 | Home | Buscar o artista «Kendrick Lamar» e clicar em «Scan» | passou com ressalva | A lista veio, mas dois álbuns de estúdio caíram na aba «?» (UAT-185) |
| 2 | Home | Dar nome à série, escolher 3 álbuns e clicar em «Initialize Load Sequence» | passou | A série foi criada e os 3 álbuns carregaram com nota e popularidade em cerca de 8 s |
| 3 | Álbuns | Abrir a série recém-criada | passou | 3 cartões, sem aviso de falha |
| 4 | Álbuns | Adicionar um álbum («GNX») ao inventário, com preço e nota | passou | Aviso «Album added to inventory!» |
| 5 | Álbuns | Remover um álbum da série («To Pimp a Butterfly») | passou | Pede confirmação; continua removido depois de recarregar |
| 6 | Blend | Escolher a série, a receita recomendada e gerar | passou com ressalva | Gerou 3 playlists, mas ficou de 8 a 18 s em «Loading album 1/2...» para 2 álbuns já carregados (UAT-189) |
| 7 | Playlists | Renomear o lote | passou | Os títulos das playlists mudam na hora |
| 8 | Playlists | Remover uma faixa | passou | De 26 para 25 faixas, sem pedir confirmação |
| 9 | Playlists | Salvar no histórico da série | passou | Aviso de sucesso com o nome do lote |
| 10 | Playlists guardadas | Abrir a tela | passou com ressalva | 20,1 s e 19,9 s até a lista aparecer, em duas visitas (UAT-186) |
| 11 | Playlists guardadas | Buscar «claude regression» digitando de uma vez | passou | O campo mantém o foco e a lista filtra (confirma a UAT-179) |
| 12 | Playlists guardadas | «Edit Batch» | passou | Abre em 0,4 s com a faixa removida e o nome salvos; o topo mostra «EDITING: ...» (UAT-190) |
| 13 | Playlists guardadas | Apagar o lote | passou | Pede confirmação; o lote não volta depois de recarregar |
| 14 | Inventário | Abrir a tela | passou | 24 álbuns em 1,2 s; as capas chegam depois |
| 15 | Inventário | Editar o item (preço de 10 para 25) | passou | O cartão mostra «R$ 25.00» |
| 16 | Inventário | Apagar o item | **falhou** | Nada é apagado e nenhum aviso aparece; o console mostra `inventoryStore.deleteAlbum is not a function` (UAT-01) |
| 17 | Álbuns | Editar a série: renomear e acrescentar um álbum pela busca | passou com ressalva | Salvou; a busca levou cerca de 8 s e, depois de salvar, todas as séries recarregaram por cerca de 10 s (UAT-191) |
| 18 | Álbuns | Apagar a série | passou | Pede confirmação com o nome da série; de 47 para 46 séries |
| 19 | Álbuns | Ranquear dois álbuns pela janela «Rank Your Album» | passou | Depois do conserto do mesmo dia (seção 19 do `arch.md`), o ranking aparece na tela em 1,5 s |
| 20 | Menus | Abrir «By Artist», «By Genre», «By Track» | passou | As três mostram «Coming Soon», como esperado |

## Diagnóstico

### 1. Álbum trocado por outro do mesmo artista (UAT-184) — o mais grave
- **O que se vê:** na série «Grunge Rock - Classics», o pedido «Stone Temple Pilots - Core» (1992) carrega «Shangri-La Dee Da» (2001).
- **Causa provada:** quando o identificador da Apple Music guardado na série responde 404, o app busca por nome e confere o primeiro resultado contra o pedido. A conta (`public/js/models/AlbumIdentity.js`) dá 30% do peso ao artista e o corte é 0,35. Com o artista certo, qualquer álbum passa: «Core» contra «Shangri-La Dee Da» dá 0,38; contra «Purple», 0,53.
- **Causa provável:** vários identificadores guardados respondem 404 (o console mostrou pelo menos seis numa visita), o que empurra esses álbuns para a busca por nome.
- **Não investigado:** por que a busca devolveu «Shangri-La Dee Da» em primeiro, e quantos álbuns da conta estão trocados hoje.

### 2. Apagar do inventário não apaga (UAT-01)
- **Causa provada:** o controlador chama `inventoryStore.deleteAlbum`, que não existe; a loja tem `removeAlbum`.

### 3. Telas lentas
- **Playlists guardadas, 20 s (UAT-186):** a tela mostra «Scanning all series for playlists...» enquanto varre as séries. Causa não investigada.
- **Blend, 8 a 18 s (UAT-189):** o blend tem o seu próprio laço de carga e busca de novo álbuns que a tela de álbuns já tinha.
- **Salvar a edição de uma série (UAT-191):** a tela inteira volta para «pendente» e recarrega, em vez de só a série editada.

### 4. Categoria dos álbuns na busca por artista (UAT-185, UAT-193)
- **O que se vê:** «To Pimp a Butterfly» e «good kid, m.A.A.d city (Deluxe Version)» na aba «?»; em «Studio», uma participação («Set Precedent») e «untitled unmastered.».
- **Lido no código:** a Home e a janela «Edit Series» usam o mesmo serviço de busca e classificação; o que é duplicado é a parte de tela. A edição junta «sem categoria» em «Albums»; a Home mostra em «?». Por que o classificador deixa esses dois álbuns sem categoria não foi investigado.

### 5. Janela de ranking
- **Reabrir na ordem do disco (UAT-187):** relatado pelo MJRP durante a regressão; consertado no mesmo dia (a janela ignorava o ranking salvo).
- **Duração «0:00» (UAT-188):** a duração é guardada em segundos e a janela lê como milissegundos.

### 6. Acabamento (UAT-190, UAT-192)
«EDITING: ...» no lugar do nome do lote; rótulo «Batch Name» duplicado; caminho «Home › Albums» na tela de playlists; título da aba do navegador que não acompanha a tela; descrições das receitas em português numa tela em inglês; a série de origem não vem escolhida ao entrar no blend por ela.

## O que não foi testado

- Exportar para o Spotify e para a Apple Music: criaria playlists nas contas do MJRP.
- «Download JSON».
- «Refetch» de um álbum.
- Colar em lote na Home («Bulk Paste»).
- A janela de detalhe do álbum.
- Arrastar faixas entre playlists.
- A migração de visitante para conta (UAT-12) e o uso sem login.
- Telas em largura de celular.
- Produção: a regressão rodou no endereço local, com o mesmo código que está em produção menos o conserto da UAT-187.
- Erros 500 do servidor apareceram no console durante a carga e não foram investigados.

## Dados de teste que ficaram na conta do MJRP

- «GNX» (Kendrick Lamar) no inventário: não pôde ser apagado, pelo defeito da UAT-01.
- Rankings de teste em «Brothers In Arms» (Dire Straits) e «Rapture of the Deep» (Deep Purple).
- A série e o lote de playlists de teste foram apagados.

## Issues

| Issue | Título curto | Estado em 2026-11-19 |
|---|---|---|
| UAT-01 | Apagar do inventário | aberta, confirmada no navegador |
| UAT-184 | Álbum trocado | aberta, causa provada em parte |
| UAT-185 | Categoria na busca da Home | aberta, reproduzida |
| UAT-186 | Playlists guardadas lentas | aberta, medida |
| UAT-187 | Janela de ranking na ordem do disco | consertada na `main`, fora de produção |
| UAT-188 | Duração «0:00» na janela de ranking | aberta |
| UAT-189 | Blend lento | aberta |
| UAT-190 | Tela de edição de playlists | aberta |
| UAT-191 | Editar uma série recarrega todas | aberta |
| UAT-192 | Título da aba, idioma, série de origem no blend | aberta |
| UAT-193 | Criar × editar com lógicas separadas | aberta, investigação pedida pelo MJRP |

## Backlog proposto ao MJRP (ordem sugerida, à espera da priorização dele)

1. Álbum certo ou aviso (UAT-184).
2. Apagar do inventário (UAT-01).
3. Playlists guardadas rápidas (UAT-186).
4. Blend e edição de playlists pelo serviço de carga (UAT-189, UAT-191).
5. Servidor: erro verdadeiro, prazo e cache das notas (F52, UAT-181).
6. Uma peça só para escolher álbuns, com um classificador só (UAT-185, UAT-193), com proposta de arquitetura antes do código.
7. Acabamento (UAT-188, UAT-190, UAT-192).
8. Login pela Apple no ambiente local.
9. Pendências antigas: UAT-05, UAT-12, colar em lote com hífen, F49.
