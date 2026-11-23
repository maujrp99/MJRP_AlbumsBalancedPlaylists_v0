# F83 onda 6c: a prova das frases dos modelos do inventário no dicionário

Os modelos do inventário devolvem código e números; `i18n/inventoryTexts.js` diz pelo dicionário. Esta prova mostra que o inglês é o de antes e que o português não deixa inglês nem estoura caixa.

## Inglês: o site construído desta ponta contra o pai (`6622654`)

Dois sites CONSTRUÍDOS, servidos por `browser-proof-screen.mjs` (a tela do inventário, o roteiro da 6a com o Discogs de mentira ligado por `VALUES=1`) e `browser-proof-window.mjs` (as janelas, o roteiro da 6b). Chromium; Firebase bloqueado (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`); `/api/value-sources`, `/api/exchange-rates` e `/api/album-value` respondem por `page.route` (nada sai para o Discogs); nenhuma chave em arquivo. Os registros de cada passada estão em `raw/logs/`.

| Passada | Iguais | Controle: pai contra pai |
|---|---|---|
| Tela, 1280, valores desligados (45 comparações) | 44 de 45 | 44 de 45 (o mesmo estado, «the search typed», só na figura: o cursor do campo piscando) |
| Tela, 1280, valores ligados (10: o aviso «waiting», «Read them now», euro) | 10 de 10 | 10 de 10 |
| Tela, 393x852, valores desligados (60) | 60 de 60 | 60 de 60 |
| Tela, 393x852, valores ligados (5) | 5 de 5 | 5 de 5 |
| Janelas (álbum, valor, editar, adicionar), 1280 (184) | 184 de 184 | não rodado (a passada não tem diferença a explicar) |
| Janelas, 393x852 (168) | 168 de 168 | não rodado, idem |

Em todas: o texto visível, as caixas, o foco e a rolagem, e nas janelas também os elementos, atributos e campos, são IGUAIS; 0 diferença de texto. A única figura diferente (a busca digitada a 1280) também difere de pai contra pai: é o cursor.

Os testes dourados da 6a (`Inventory.sameAsBefore`, 50) e da 6b passam SEM recaptura.

## Português: o servidor de desenvolvimento

`browser-proof-pt.mjs` (Chromium, `vite` na 5191, Discogs de mentira, Firebase bloqueado): 14 estados, a 1280 (tela, galeria com a ordem por valor, as ordens lidas do seletor, um status do cabeçalho, o aviso «esperando um valor» e «Ler todos agora», euro, a janela do álbum com valor e onde comprar, a janela de editar) e a 393 (tela, folhas de filtros e ordem, de status, do álbum, das ações, e a janela do álbum). Para cada um: todo texto visível (nós de texto, `title`, `aria-label`, `placeholder`, opções) contra os pedaços em inglês do dicionário e uma lista de palavras, e os elementos que passam da caixa ou da página.

Resultado: **13 de 14 limpos**; nenhum inglês sobrando em nenhum. O que sobrou é um elemento DECORATIVO da janela do álbum no celular (`div.album-window__glow`, o brilho do fundo, e a `img` dele, 489 px) que passa da página: é o desenho da janela, igual em inglês, não é texto. Fotos: `raw/pt/` (tela a 1280 e a 393, a folha de filtros, a janela do álbum a 1280); resultado completo em `raw/pt/results-pt.json`.

O que a passada em português achou e foi consertado: «Lista de desejos» (o rótulo de status) estourava o selo do cabeçalho a 393 px; virou «Desejos».

## O que não deu para provar

- O português só passou pelo Chromium; o inglês também só pelo Chromium (a 6a e a 6b passaram também pelo WebKit; esta onda não mexe em layout).
- «Update ratings» e «Add the albums of my series» (as perguntas e os finais) não foram percorridos no navegador (precisam do catálogo e do banco); o controlador e os testes dos modelos e da camada de texto cobrem as frases, e os dourados da 6a, as chamadas.
- Os finais de uma rodada de valores («Values read for…», «could not be read…») e as falhas por motivo só são provados nos testes (`test/i18n/inventoryTexts.test.js`, 9 casos, em inglês e em português), não no navegador.
- O servidor de desenvolvimento mostrou que, depois de editar um dicionário, o site fica em inglês até reiniciar o `vite` (outra instância do módulo): registrado em `wave-lessons.md` § 17.

## Peso (`bundle-budget-wave-6c.txt`)

Script principal 213.079 B → 214.274 B (+1.195 B: o inglês das 191 chaves novas); o que vem depois da primeira tela 213.896 B → 214.626 B; arquivo novo sob demanda `inventoryTexts-*.js`, 5.858 B. Tetos: `main` 214.418 B (o medido mais 144 B), `background` 55.500 B; o motivo está em `scripts/bundle-budget.json`.
