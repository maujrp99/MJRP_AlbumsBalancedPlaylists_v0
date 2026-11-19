# F57 — um seletor de álbum e um classificador: prova no navegador (2026-11-19 20:44)

Código: ramo `fix/f57-one-album-picker-and-one-classifier` com a `main` junto (`0bfac88`). Testes: 1647 passando em 137 arquivos; build ok. App local com a conta do MJRP. Nada foi salvo.

| # | Cenário | Home | Edição de série |
|---|---|---|---|
| 1 | Buscar «Kendrick Lamar»: resposta ao clique | botão «Scanning…», desabilitado | botão «Scanning…», desabilitado |
| 2 | Filtros e contagens | Studio (10), EPs, Singles (47), Live, Compendiums (1), ? | os mesmos seis, com as mesmas contagens |
| 3 | «To Pimp a Butterfly» e «good kid, m.A.A.d city» | em Studio; «?» vazio | em Studio |
| 4 | Como os álbuns aparecem | cartões com capa, mais novo primeiro (GNX, Mr. Morale, DAMN.…) | cartões com capa (10); primeiros álbuns em 1,9 s |
| 5 | Fechar a edição com «Cancel» | — | janela fechada, nada gravado |

Antes da F57 os dois álbuns do Kendrick caíam em «?» (o gênero «Hardcore Rap» era lido como eletrônico por conter «hardcore»), e a edição de série esperava a lista da IA antes de mostrar qualquer álbum, com quatro filtros sem contagem e linhas de texto.

## Não visto

- Salvar a edição de uma série (o botão «Saving…», a falha com a janela aberta): só nos testes.
- Um artista eletrônico com a lista da IA chegando depois; o catálogo fora do ar dentro da janela de edição.
- A aparência da grade dentro da janela (colunas, rolagem): a página não foi fotografada.
- Efeito colateral do meu teste: clicar duas vezes no lápis por script abriu duas janelas; no uso real a primeira cobre o botão.
