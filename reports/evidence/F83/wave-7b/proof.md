# F83 onda 7b: a prova no navegador da tela Blend em React

Sites CONSTRUÍDOS (`npx vite build`, pela fila, sem chaves: um worktree não tem `.env`): a tela Blend em React (a ponta `claude/f83-wave-7b-blend-screen`) contra a tela à mão do pai (a ponta da junta, `ace99a9`, construído num worktree à parte). Os dois são servidos por um servidor estático com a volta a `app.html` (as rotas fundas respondem como a hospedagem). Firebase (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`) e todo host de fora são bloqueados; o relógio do rodapé é fixo; nenhuma chave é lida nem escrita. O roteiro é `browser-proof.mjs` (o arreio da onda 7a com os fluxos da Blend); o Playwright é o emprestado de `MJRPpersonal`.

## O que se dirige (igual dos dois lados; clique de mouse ou toque, teclas de verdade)

Sete fluxos: **blend** (sem escolha; uma série; cada receita; Top 1 e 10; as cinco formas de agrupar; as três estruturas; as três fontes; o deslizador por teclas e `End`; um botão depois do deslizador; a ordem do Tab), **generate** (pronto, em «multiple»; gerar: ocupado aos 0,3 s e o fim, que é uma falha porque o Apple Music está bloqueado; para onde a página foi), **many** (14 séries; a lista rolada; no celular a folha, a busca, nenhum resultado, um nome com `&amp;`, fechar), **address** (`?seriesId=` de uma série e de uma que não existe), **none** (sem séries), **covers** (a diferença de propósito) e **leave** (sair no meio da carga, Voltar, Avançar). Em cada passo: o `#app` como elementos (etiqueta, atributos, classes como conjunto, texto, valor dos campos), a caixa de cada elemento, o foco, a rolagem, os avisos e duas figuras (o `#app` sem o que é fixo na janela, e a janela), comparadas pixel a pixel. A janela é alta (3.200 px) e as figuras não são de página inteira: a figura de página inteira do Chromium vira a largura da janela por um instante e dispara a mudança de «é celular?», o que faz a tela à mão se redesenhar inteira (e a nova só se o resultado muda): um artefato da prova que apareceu na primeira rodada e foi tirado.

**Controle de ruído:** cada rodada tem a sua versão «à mão contra à mão» (`-oo`): o que ela mostra de diferença é ruído da prova.

## Resultados (a nova contra a à mão; `-oo` é o ruído)

| run | equal | pictures | spinner | rest |
|---|---|---|---|---|
| chromium-1280-oo | 201/202 (32 steps) | 0 pictures (largest 0 px, at most 0/255) | 0 spinner box | 1 on purpose, 0 other |
| chromium-1280 | 164/203 (32 steps) | 38 pictures (largest 25 px, at most 6/255) | 1 spinner box | 0 on purpose, 0 other |
| chromium-899-oo | 222/222 (35 steps) | 0 pictures (largest 0 px, at most 0/255) | 0 spinner box | 0 on purpose, 0 other |
| chromium-899 | 174/222 (35 steps) | 48 pictures (largest 31 px, at most 6/255) | 0 spinner box | 0 on purpose, 0 other |
| chromium-900-oo | 200/202 (32 steps) | 0 pictures (largest 0 px, at most 0/255) | 1 spinner box | 1 on purpose, 0 other |
| chromium-900 | 166/203 (32 steps) | 36 pictures (largest 23 px, at most 6/255) | 1 spinner box | 0 on purpose, 0 other |
| chromium-iphone14-oo | 221/222 (35 steps) | 0 pictures (largest 0 px, at most 0/255) | 1 spinner box | 0 on purpose, 0 other |
| chromium-iphone14 | 221/222 (35 steps) | 0 pictures (largest 0 px, at most 0/255) | 1 spinner box | 0 on purpose, 0 other |
| webkit-1280-oo | 192/202 (32 steps) | 8 pictures (largest 44024 px, at most 2/255) | 1 spinner box | 1 on purpose, 0 other |
| webkit-1280 | 200/203 (32 steps) | 2 pictures (largest 1196 px, at most 2/255) | 1 spinner box | 0 on purpose, 0 other |
| webkit-iphone14-oo | 221/222 (35 steps) | 0 pictures (largest 0 px, at most 0/255) | 1 spinner box | 0 on purpose, 0 other |
| webkit-iphone14 | 217/222 (35 steps) | 4 pictures (largest 428866 px, at most 1/255) | 1 spinner box | 0 on purpose, 0 other |
| webkit-se-oo | 218/222 (35 steps) | 3 pictures (largest 103080 px, at most 85/255) | 1 spinner box | 0 on purpose, 0 other |
| webkit-se | 214/222 (35 steps) | 7 pictures (largest 185374 px, at most 85/255) | 1 spinner box | 0 on purpose, 0 other |

(Os `-oo` foram rodados antes das duas últimas edições do roteiro, a limpeza do atributo `style` vazio e o fluxo das capas; elas não mudam o que o ruído mede. As «caixas do círculo» são o círculo que gira, 0,01 px.)

## O que a prova diz

1. **Igual, em todos os passos de todas as rodadas:** os elementos, os atributos, as classes, o texto e o valor dos campos do `#app`, a caixa de cada elemento (exceto uma caixa do círculo que gira, 0,01 px, que o ruído também mostra), o foco, a rolagem, a largura da página, os avisos, a ordem do Tab, para onde a página foi depois de gerar, o que aconteceu ao sair no meio da carga (nada dito, nenhum erro de página) e Voltar/Avançar (a Blend de novo, sem escolhas; o Avançar vai à tela de onde saiu).
2. **A diferença de propósito (as capas que chegam em segundo plano): provada nos dois sentidos no teste «igual ao de antes» (jsdom), NÃO conclusiva no navegador.** No jsdom, a tela à mão se desenha de novo quando as capas chegam (o foco que estava num cartão vai para a página, e no navegador a lista voltaria ao topo) e a nova mantém o foco, com a página igual. No navegador o fluxo `covers` (consultas em texto «Artista - Álbum», o arquivo do conjunto local atrasado 4 s por `page.route`, o foco num cartão e a lista rolada 120 px antes) não pegou a chegada: as duas telas terminaram com o mesmo foco e a mesma rolagem (as capas já tinham chegado, ou o trabalhador as devolveu antes). O passo está no roteiro como «não conclusivo» quando as duas são iguais; a prova da diferença fica com o jsdom.
3. **Figuras: o que sobra é abaixo do que se vê.** No Chromium a 1280, 900 e 899, algumas figuras diferem em 12 a 31 pixels (e, a 900, em áreas maiores) com no máximo 6 de 255 de intensidade, nos mesmos lugares em todos os passos (o canto de um painel de vidro, o brilho do passo atual da faixa); a rodada à mão contra à mão dá zero. **Não explicado**: os elementos e as caixas são iguais, as classes também; a hipótese (o fundo desfocado dos painéis de vidro com camadas que a nova mantém e a antiga cria de novo) não foi provada. No WebKit (computador e iPhone) a diferença é de 1 de 255 em áreas grandes e a rodada à mão contra à mão mostra o mesmo; a barra do alto (o nome «The Album Blender» com fogo) é animada e muda de quadro: 85 a 240 de 255 numa faixa estreita, também no ruído.
4. **O que a prova achou e a onda consertou:** o botão da barra do celular, depois de tocado, ficava com o `:hover` preso (a barra à mão era trocada a cada passo; a nova mantinha o elemento): agora a nota e o botão da barra, e a seção do botão do computador, levam uma `key` que muda a cada desenho da antiga. Antes do conserto a rodada Chromium iPhone 14 tinha duas figuras que diferiam em até 240 de 255 e a caixa do botão 1 px acima; depois, nada acima do ruído.

## Não provado no navegador

- **A configuração entregue ao controlador** (`generateFromSeries` com as cinco chaves, e as chamadas ao aviso e ao roteador) está provada nos 40 cenários do teste «igual ao de antes» (jsdom, com o mundo de fora trocado), não no navegador: o controlador e os algoritmos estão dentro dos arquivos empacotados e nada os expõe na janela; a geração no site construído acaba em falha (o Apple Music está bloqueado) nos dois lados, com o mesmo painel vermelho.
- **O MusicKit de verdade e uma conta Spotify conectada** (sem conta); a ida às playlists depois de gerar com sucesso (precisa de álbuns postos na carga): vale o jsdom.
- **O «carregando» das séries no site construído:** no site sem login a leitura é imediata; o estado, e a leitura que falha, estão no dourado do jsdom.
- **Rodadas feitas:** Chromium a 1280, 900, 899 e iPhone 14; WebKit a 1280, iPhone 14 e iPhone SE. **Não feitas:** Chromium com perfil de iPhone SE; WebKit a 899 e a 900 (o WebKit de computador foi só a 1280).
