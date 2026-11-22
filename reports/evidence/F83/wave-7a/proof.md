# F83 onda 7a: a prova no navegador do painel de gerar de novo

Sites CONSTRUÍDOS (`npx vite build`, pela fila, sem chaves: um worktree não tem `.env`): o painel «Reconfigure your Music Playlist Blend» da tela de playlists em React (esta ponta, `claude/f83-wave-7a-recipe-pieces`) contra o à mão do pai (`b29b552`, construído num worktree à parte, `git worktree add --detach`). Roteiro `browser-proof.mjs` (Playwright de `MJRPpersonal/node_modules/playwright`; dois servidores estáticos que respondem as rotas fundas como a hospedagem, com o `app.html`). O Firebase (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`) e todo hospedeiro de fora estão BLOQUEADOS nas duas pontas (a página não recebe fonte nem capa de fora, igual dos dois lados); a hora do rodapé é fixa; nenhuma chave é lida nem escrita.

**O que se toca, igual dos dois lados** (clique de verdade, toque nos perfis de celular, teclas de verdade): a tela de playlists com um conjunto posto na loja de playlists (a loja está em `window` no site construído) e, no computador, o painel fechado; aberto; cada uma das quatro receitas escolhida; Top 1 e Top 10; cada um dos cinco agrupamentos e das três estruturas; cada uma das três fontes; o deslizador com as setas e com «End» (o foco fica nele); um botão depois do deslizador (o deslizador guarda o lugar); a ordem do Tab pelo painel (24 paradas); «Regenerate Playlists» **sem série** (a falha: o aviso «No series to take the albums from») e **com uma série cujos álbuns não vêm** (o estado «gerando»: a cobertura fica de pé; depois a falha «None of the 2 albums could be loaded»). No celular: o «⋯» de uma playlist → a folha → «Reconfigure and regenerate» (o painel abre e a página rola até ele), receita, Top 6/embaralhar/uma playlist, o deslizador, pedir de novo com o painel aberto, fechar pelo cabeçalho (o painel inteiro sai do celular fechado: `#regeneratePanelMount:has(.regenerate-content.hidden)`), pedir de novo com ele fechado, e a falha. Mais, em `PART=blend`, a tela Blend **à mão** (não tocada), no pai e na ponta: sem escolha, uma série escolhida (a folha, no celular), cada receita, Top 5, estrutura, o deslizador.

**Cada passo compara:** o painel como elementos (tag, atributos, classes como conjunto, texto, valor dos campos, nó de texto partido), a **caixa de cada elemento** (x, y, largura, altura), o foco, a rolagem, a largura da página, o aviso e a cobertura de «gerando», e **duas figuras** (o painel, tirado sem o que é fixo na janela, e a janela), pixel a pixel, com as animações desligadas (`animations: 'disabled'`) e o que ainda corre esperado antes. Nos perfis de computador a faixa de 80 px do topo não conta na figura da janela (a barra do topo tem as barras animadas do Apple Music; o ruído de antiga contra antiga está nela).

| Passada | Passos | Comparações iguais |
|---|---|---|
| Chromium 1280 | 25 | 153 de 153 |
| Chromium 1280, antiga contra antiga (ruído) | 25 | 153 de 153 |
| Chromium 900 | 25 | 153 de 153 |
| WebKit 1280 (computador) | 25 | 153 de 153 |
| WebKit 1280, antiga contra antiga (ruído) | 25 | 153 de 153 |
| Chromium 899 (celular, mouse) | 13 | 80 de 80 |
| Chromium 899, antiga contra antiga | 13 | 80 de 80 |
| WebKit iPhone 14 (toque) | 13 | 80 de 80 |
| WebKit iPhone 14, antiga contra antiga | 13 | 80 de 80 |
| WebKit iPhone SE (toque) | 13 | 80 de 80 |
| WebKit iPhone SE, antiga contra antiga | 13 | 80 de 80 |
| Blend à mão, Chromium 1280 / 900 / 899 | 9 / 9 / 10 | 55 de 55 / 55 de 55 / 61 de 61 |
| Blend à mão, WebKit 1280 / iPhone 14 / SE | 9 / 10 / 10 | 55 de 55 / 61 de 61 / 61 de 61 |
| Blend à mão, antiga contra antiga: Chromium 1280 e 899, WebKit iPhone 14 | 9 / 10 / 10 | 55 de 55 / 61 de 61 / 61 de 61 |

Total das passadas da ponta contra o pai: **1.047 comparações iguais de 1.047** (171 passos); os controles de antiga contra antiga também iguais. `summary.txt` tem uma linha por passada; `raw/*.json` o detalhe. A página, as caixas de cada elemento, o foco, a rolagem e o aviso são iguais em TODOS os passos, no computador e no celular, no Chromium e no WebKit.

## O que a prova achou antes da última passada (e foi consertado)

1. **WebKit: dois selos 0,19 e 0,38 px mais largos (as caixas de «SPOTIFY» e «BEA»).** O texto da peça em React era « SPOTIFY » (um nó, com espaços); o do molde à mão era «\n   SPOTIFY\n  ». O WebKit mede o que recebe: «Y» e «A» antes de um espaço são kernados, antes de uma quebra de linha não. O teste da página (que colapsa o branco) não via; as caixas do navegador sim. A peça passou a escrever o texto como o molde o quebrava (`ui/recipe/broken.ts`) e `RecipePieces.sameAsHandMade` compara cada nó de texto até o último espaço.
2. **O atributo `value` do deslizador:** o React o reescrevia a cada passo (`defaultValue` seguia o estado); a antiga o escrevia uma vez. Ficou o valor do desenho (`useState`), e a propriedade e o número seguem o estado.
3. **O passo «6 s depois do aperto» corria com a rede:** a geração acaba por si (o Apple Music está bloqueado) em 6 s ou um pouco mais, e a antiga contra a antiga já discordava do próprio resultado; o passo passou a esperar o fim da cobertura.

## O que sobrou, dito com todas as letras

- **Duas figuras que discordaram uma vez e não se repetiram** (a primeira passada; a segunda deu 0 pixel nas duas): (a) WebKit iPhone SE, «aberto pela folha, rolado até o painel», figura da janela, 61.686 pixels de no máximo 34/255, num bloco de 261 × 95 px: é a barra de baixo («Export»/«Save») com fundo desfocado sobre o cartão de receita que passa por baixo (`diffs/panel-webkit-se-…-view.png`); (b) Blend à mão, Chromium 899, «estrutura multiple», figura da parte, 34 pixels de no máximo 41/255, num arco de 30 × 10 px (`diffs/blend-chromium-899-…-panel.png`). **Não foram explicadas além de «ruído de rasterização que não repete»:** texto, elementos, caixas e foco desses passos são iguais, e a passada repetida é igual.
- **Ruído de antiga contra antiga que a faixa do topo escondia (visto nas passadas anteriores):** as barras do equalizador (animadas) da barra do topo e do menu de baixo do celular, o logotipo (WebKit 1280: 4.886 px) e o aviso «Authentication issue» do Firebase bloqueado, que vai e vem com o tempo desde a abertura. A prova o trata assim (faixa de 80 px, elementos fixos escondidos na figura do painel, aviso fora da comparação) e diz isso aqui.
- **Nada muda de propósito neste painel.** As peças mortas do à mão não foram levadas (nada as chamava).

## O que não deu para provar

- **O MusicKit de verdade, a popularidade de uma conta Spotify e a classificação de uma pessoa real:** a geração que dá certo não rodou no navegador (os álbuns vêm do Apple Music, o primeiro caminho do dono, que a prova bloqueia): rodaram a falha («No series…», «None of the 2 albums could be loaded») e o estado «gerando». O caminho feliz (a configuração entregue, o painel que segue as playlists novas) está provado pelo dourado do painel (`RegeneratePanel.sameAsBefore`, que troca `handleGenerate` por um que anota a configuração) e os 16 casos de `BlendingController` seguem verdes.
- **A leitura da tela em português por um olho:** só o teste lê o português (as propostas esperam o MJRP).
- **Largura 820 do celular e iPhone 14 no Chromium:** sem passada própria (o 899 e o iPhone 14 no WebKit cobrem o layout do celular).
