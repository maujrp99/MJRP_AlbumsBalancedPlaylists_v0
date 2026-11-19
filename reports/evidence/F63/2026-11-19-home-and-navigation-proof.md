# F63 — Home e navegação que respondem: prova no navegador (2026-11-19 19:57)

Código: ramo `fix/f63-home-and-navigation-answer` com a `main` junto e as duas sobras das playlists guardadas (`df05727`). Testes: 1307 passando em 119 arquivos; build ok. App local com a conta do MJRP.

| # | Cenário | Resultado |
|---|---|---|
| 1 | «Process List» com a caixa vazia | aviso «Please paste some "Artist - Album" lines first.», sem erro |
| 2 | Colar cinco linhas com hífen no nome (Jay-Z, Alt-J, Blink-182, AC/DC, «OK Computer - OKNOTOK») | borda verde; quatro álbuns certos na pilha (alt-J, blink-182, AC/DC, Radiohead «OK Computer OKNOTOK 1997 2017»); «Jay-Z - The Blueprint» lido certo, mas o catálogo não devolveu o álbum: ficou na caixa, listado como «not found in the catalog» |
| 3 | Colar uma linha boa, uma sem separador e uma inexistente | «Animals» entra; aviso; sob a caixa «Skipped lines (2)» com a linha 2 (sem « - ») e a linha 3 (não achada); as duas ficam na caixa; nenhum `alert` |
| 4 | Menu da conta | fechado ao abrir a página; um clique abre (`aria-expanded` verdadeiro, «Signed in as…»); Esc fecha |
| 5 | Blend aberto a partir de uma série (`/blend?seriesId=…`) | as quatro receitas já aparecem (passo 2 liberado) |
| 6 | Idioma das receitas | as quatro descrições em inglês |
| 7 | Endereço antigo `/album-series` e voltar | abre `/albums`; um «voltar» retorna à tela de antes |

## Não visto

- A volta do Spotify de verdade e o histórico depois dela; criar uma série e voltar (não criei série na conta do MJRP).
- Largura de celular e toque: o ✕ das faixas e os botões das linhas de playlist sem mouse.
- Esc numa janela de confirmação; os itens «Soon» do menu (não achados pelo meu seletor; só nos testes).
- O botão «Create Series» do estado vazio das playlists guardadas (a conta tem playlists).

## Achado à parte

«Jay-Z - The Blueprint» não é achado pela busca da Home no catálogo. Não é do leitor de linhas; fica anotado para a revisão das regras de identidade (F68) e para o seletor único de álbum (F57).
