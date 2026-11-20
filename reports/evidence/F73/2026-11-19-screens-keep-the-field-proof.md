# F73 — prova no navegador

**Quando:** 2026-11-19 23:34 · **Onde:** `http://127.0.0.1:5010`, servindo o ramo `fix/f73-screens-keep-the-field`, na conta do MJRP.

## Antes do conserto (a `main` de então)

| O quê | Visto |
|---|---|
| Foco no «Batch Name» e um aviso da loja de playlists | o campo foi trocado por outro; o foco foi para a página (`activeElement: BODY`) |
| Sonda em todas as telas (foco em cada campo, aviso de cada loja) | só o «Batch Name» perde o foco (lojas de playlists, de séries e de álbuns); a busca do inventário era trocada a cada tecla e recebia o foco de volta por um remendo; as buscas de `/albums` e `/saved-playlists` e os campos da Home não são trocados |
| Em `/saved-playlists`, depois de visitar o inventário, um aviso da loja do inventário | o conteúdo da tela virou «My Collection · 211 albums»; a loja tinha 2 ouvintes da tela deixada |

## Depois do conserto

| REQ | O quê | Visto |
|---|---|---|
| REQ-01 | Clique no «Batch Name», tecla End, digitar « x1» com a tela redesenhada a cada 150 ms | foco no campo; valor «… 22:17 x1» |
| REQ-01 | Digitar « road trip mix» com duas lojas avisando a cada 150 ms | 14 letras entraram; cursor no fim; nenhum instante sem foco |
| REQ-02 | Uma promessa recusada com «Failed to fetch dynamically imported module…» que ninguém pegou | o app recarregou uma vez; a marca da recarga ficou gravada; as playlists não salvas voltaram com o nome |
| REQ-03 | `/playlists` sem playlists e sem rascunho | «No playlists here yet», botão «Go to The Blending Menu» (`/blend`); sem campo do nome, sem exportar, sem o formulário antigo |
| REQ-04 | Visitar o inventário, ir a `/saved-playlists`, aviso da loja do inventário | a tela de playlists salvas ficou como estava |

## Não conferido

- O `vite:preloadError` de verdade: só acontece no site construído, numa aba aberta antes de uma publicação. Está coberto por teste de unidade; a próxima publicação com uma aba aberta é a prova real.
- Por que o rascunho do MJRP não voltou ao recarregar em produção (não reproduzido; aqui o rascunho voltou).
- Um clique num botão no exato instante de um redesenho (o botão é trocado entre apertar e soltar) ainda pode se perder. A tela de playlists continua se redesenhando inteira; redesenhar por partes ficou fora do escopo.

## REQ-05 — a rolagem fica onde estava (2026-11-19 23:38)

No inventário (211 álbuns, página de 62957 px), com a rolagem em 9000: a loja foi trocada pela mesma lista, que é o redesenho que uma mudança de status provoca. Rolagem depois: 9000; o primeiro cartão visível era «Desire, I Want to Turn Into You» antes e depois.

**Não conferido:** a mudança de status de verdade não foi feita, para não gravar na conta do MJRP enquanto ele marca os álbuns; o redesenho provocado é o mesmo.
