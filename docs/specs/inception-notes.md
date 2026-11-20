# Inception notes

> Uma seção por rodada de exploração de tela (`mjrp-designing-ui`, modo explorar).

## [2026-11-20 00:26] F75 · valor estimado do inventário e onde comprar · rodada 1

- **Tela:** `design/inception/inventory-value-v1.html` (sete cenários; valores ilustrativos). **Proposta:** `design/proposals/f75-inventory-value/proposal.md`.
- **O que o MJRP pediu antes da tela:** preço médio dos CDs (Amazon, Discogs, iMusic), para todo o inventário ou por álbum, com link de compra; propósito: «ter uma estimativa de valor do seu inventory, podendo alterar os valores na mao»; três estados e a média; a edição mais comum; USD, EUR, GBP e BRL com o câmbio do dia.
- **O que ele pediu para a proposta considerar:** «como fica as adicoes novas de albums nas listas e depois no inventory, como o codigo vai captar os preços de forma automatizada»; «os cenários possiveis de novas entradas no inventory e … owned, not owned, wishlist. o que acontece qdo virá owned».
- **Decidido pelo agente, à espera da reação dele:** dois números por item (quanto paguei, quanto vale); uma fila de leitura para todo item que entra sem valor; o total separado em «o que tenho» e «o que falta comprar».
- **Não feito:** a pesquisa de referências (benchmark de apps de coleção), que ele pediu para depois; a crítica de UX, que não cabe no modo explorar. `docs/specs/info-arch.md` nasceu nesta rodada, só com esta tela.
- **Perguntas abertas:** as seis do fim da proposta.
- **Reação do MJRP:** ainda não houve.

## [2026-11-20 00:34] F75 · valor estimado do inventário e onde comprar · rodada 2

- **Reação do MJRP à rodada 1:** «o prototipo tem que ser fidedigno»; e «vc está usando a skill e criando o artefato comparador? deveria».
- **O que mudou:** a v2 (`design/inception/inventory-value-v2.html`) é a tela real do inventário, capturada como o app a desenha (HTML e estilos do app, doze álbuns dele, capas de verdade), com os elementos da F75 feitos só com classes que o app já usa. A v1 fica intacta. O total passou de uma caixa à direita para uma faixa sob o título, no lugar do «Total Owned».
- **Comparador:** `design/proposals/inventory/comparator.html`: «Referência» (o inventário de hoje), v2 «Nova» e v1 «Esboço», em 1440 e 390 px.
- **Como a captura foi feita:** uma rota só do ambiente local (`vite.config.local.js`, fora do git) guarda o HTML da tela em `design/.snapshots/`, e `design/.snapshots/assemble.py` monta o protótipo. Nada disso entra em produção.
- **Não feito:** a v2 em 390 px não foi conferida por mim; o benchmark de apps de coleção; a crítica de UX.
- **Perguntas abertas:** as seis do fim da proposta.

## [2026-11-20 00:41] F75 · o comparador como Artifact do Claude

- **Pedido do MJRP:** «o comparador deve ser um artifact do claude».
- **Feito:** https://claude.ai/artifact/R6r5dLJ48JXJZDSRy6T5Ck (privado). A tela de hoje, a v2 e a v1 vão como arquivos do próprio artifact, autocontidos: um Artifact não abre o servidor local nem imagens de fora, então as capas e os logotipos foram embutidos. A troca de cenário fala com as telas sem recarregá-las.
- **Limite:** a «Referência» do artifact é a tela capturada em 2026-11-20, não o inventário ao vivo; nela só a janela de «The Dark Side of the Moon» abre.
- **Como é montado:** `design/.snapshots/` no worktree da sessão (fora do git) guarda a captura e o montador; o pacote publicado fica na pasta temporária da sessão.

## [2026-11-20 00:52] F75 · a reação do MJRP à v2 e a prévia do cartão em três níveis

- **Reação, nas palavras dele:** sobre as contagens do topo: «parecem botoes e nao sao»; sobre o cartão: «as informações ficam no ar, consegue me mostrar alternativas para a UI do card? na linha do consolidar, elevar, transformar … o valor aí parece que estou vendendo, falta a info do que é esse valor em dolar. e tb algo para incentivar o usuario a clicar se ele quiser comprar … os botoes de comprar estao escondidos na tela que vc tem que clicar pra descobrir que eles existem»; e o futuro: uma rede de apaixonados por álbuns e colecionadores, com vender e trocar.
- **Prévia, fora do protótipo:** `design/proposals/inventory-card-proposal.html`, o cartão real do app em três níveis sobre um eixo só (quanto o cartão muda para dizer o que é o valor e onde comprar), ao lado do cartão da v2; e as contagens viradas em filtro. Está no comparador (Artifact), como «Prévia em aberto».
- **O protótipo não mudou:** muda depois da escolha dele.
- **Achado de desenho:** em «Transformar» o sentido do valor muda com o status: «worth about» no que ele tem, «costs about» no que falta. Responde ao «parece que estou vendendo».

## [2026-11-20 01:02] F75 · rodada 3: o cartão escolhido e as contagens como filtro

- **Escolha do MJRP:** «A opcao é transformar mas na parte do where to buy, quero um merge do elevar (O label WHERE TO BUY) com os links em laranja do consolidar». E sobre as contagens: «concordo com a proposta de torná-los filtros, mas ai o drop down nao deveria ser apenas para ordenacao?».
- **Como foi entendido:** o cartão é o «Transformar» com «Where to buy» em links; as contagens filtram por status e o seletor de status sai. O seletor de formato fica, além do de ordem: ele filtra outra coisa (CD, vinil). Se ele quiser a barra só com a ordem, o formato pode virar botões também.
- **v3:** `design/inception/inventory-value-v3.html`, com as duas decisões. A v2 e a v1 ficam intactas. No comparador (Artifact), a v3 é a «Nova».
- **Reserva:** «Sell» e «Trade» aparecem apagados no cartão do que é dele, com «not in the app yet». Mostra algo que não existe; é o lugar reservado para a rede de colecionadores.
- **Não feito:** a v3 em 390 px não foi conferida; a crítica de UX das telas no celular está em andamento (F76).

