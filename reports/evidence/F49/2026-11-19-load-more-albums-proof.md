# F49 — «Load N more albums»: prova (2026-11-19 20:11)

Código: ramo `fix/f49-load-more-albums` com a `main` junto (`36c6ddd`). Testes: 1417 passando em 129 arquivos; build ok.

## O que foi provado

- **Por teste, com a tela de verdade** (`test/views/SeriesView.loadMore.test.js`: a tela, o controlador, a grade e o tratador de clique reais; só o serviço de carga é dublê): o clique mostra os 15 álbuns em ordem e tira o botão; nenhum pedido novo de carga; a escolha sobrevive aos redesenhos, à troca de página, à busca e à troca grade/lista; é esquecida ao trocar de escopo e ao sair da tela. Quatro desses oito testes falhavam antes do conserto.
- **No navegador, com a conta do MJRP:** a tela de álbuns abre e carrega como antes (sem regressão visível).

## O que NÃO foi provado no navegador

O clique no botão. Nenhuma série do MJRP tem mais de 12 álbuns (a maior tem 9), então o botão não aparece na conta dele, e eu não criei uma série de teste na conta. Fica para o MJRP ver quando tiver uma série com 13 álbuns ou mais.

## A causa

O botão era desenhado com `data-action="load-more-series"`, mas o único ouvinte de cliques da tela não conhecia essa ação e a deixava cair. Os álbuns além dos 12 já estavam carregados; só não eram desenhados.
