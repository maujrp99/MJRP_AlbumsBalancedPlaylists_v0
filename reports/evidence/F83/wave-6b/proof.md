# F83 onda 6b: a prova no navegador das janelas

Sites CONSTRUÍDOS: as janelas em React (esta ponta) contra as à mão do pai (`315ae5f`, construído num worktree à parte). Roteiro `browser-proof.mjs` (Playwright do `node_modules`; dois servidores estáticos com o fallback para `app.html`). Firebase bloqueado (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`). O Discogs é de mentira: `/api/value-sources`, `/api/exchange-rates` e `/api/album-value` respondem por `page.route` (nada sai para o Discogs). Os itens do inventário entram pela costura da 6a (uma linha no fim do script principal, a mesma nos dois sites); as lojas da tela de álbuns já estão em `window`. Nenhuma chave em arquivo. Resultados: `raw/results-*.json`.

Cada estado compara: a figura da janela (pixel a pixel), as janelas sobre a página (elementos, atributos, classes, valor dos campos), o texto, as caixas das partes, o foco e a trava da página, os alvos de toque abaixo de 44 px, e erros na página. Estados: a janela do álbum aberta pelos álbuns e pelo inventário e fechada por ✕, «Close», fundo e Escape; a tabela ordenada (computador) ou as abas e a barra com o título (celular); a seção de valor (ler agora, valor inválido), «Where to buy»; editar (aberta, preenchida, fechada por ✕, Cancel, Escape e fundo); adicionar (aberta, preenchida, Cancel).

| Passada | Iguais |
|---|---|
| Chromium 1280 | 184 de 184 |
| Chromium 1280, antiga contra antiga (ruído) | 184 de 184 |
| Chromium 900 | 184 de 184 |
| WebKit 1280 (computador) | 184 de 184 |
| Chromium 899 (celular) | 166 de 168 |
| Chromium 393x852 | 182 de 184 |
| WebKit iPhone 14 (393x852) | 181 de 184 |
| WebKit iPhone SE (375x667) | 166 de 168 |
| WebKit iPhone 14, antiga contra antiga (ruído) | 166 de 168 |

Foco, texto, elementos, caixas e alvos de toque: iguais em TODAS as passadas. Alvos abaixo de 44 px: mesma lista nos dois lados (a janela não os mudou).

## O que sobrou, dito com todas as letras

- **«Close» no celular (2 em cada passada de celular):** o roteiro tentou tocar o botão do rodapé, que a folha do celular não desenha, nos DOIS sites (o tempo estourou dos dois lados). É limite do roteiro, não da janela; o roteiro foi corrigido para pular esse estado no celular depois da primeira rodada.
- **A figura da janela de adicionar no celular (WebKit 375, 393, Chromium 899; 8.573 a 353.308 pixels):** texto, elementos, caixas, foco e alvos de toque desse mesmo estado são IGUAIS. A diferença aparece também de antiga contra antiga (WebKit 393: 213.673 pixels) e em passadas diferentes dá 0 pixels (WebKit 393, estado «aberta»), então é ruído da foto da folha em movimento. **A causa exata não foi localizada** (não achei qual quadro da folha a foto pega); não a chamo de explicada, só de coberta pelo controle.
- **A janela do álbum sai com a tela** (muda de propósito): `leave-proof.mjs`, Chromium sobre o site construído: a à mão fica (1 janela na tela seguinte), a em React sai (0). Provado a partir do inventário; a rota de álbuns tem a mesma linha de `dispose` (`closeAllWindows`) e a camada é provada no teste `AlbumWindow.leave`, mas a saída da tela de álbuns NÃO foi exercitada no navegador.

## O que não deu para provar

- O Discogs de verdade (a chave é do servidor): a seção de valor foi provada com respostas postas; escrever um valor válido grava no Firestore (bloqueado) e não foi percorrido de ponta a ponta no navegador (o dourado cobre a chamada).
- O MusicKit de verdade e a popularidade de uma conta Spotify: a janela recebe álbuns postos, como na onda 5.
- Largura 820 e iPhone 14 em «antiga contra antiga» no Chromium: sem passada própria.
- Foco de volta e prisão de foco: as janelas à mão não têm (defeito mantido); a prova só confirma que o foco fica igual.
