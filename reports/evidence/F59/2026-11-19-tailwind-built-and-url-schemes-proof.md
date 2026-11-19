# F59 fatia E — Tailwind compilado com o site e endereços conferidos: prova (2026-11-19 19:28)

Código: ramo `fix/f59-tailwind-local-and-url-schemes` com a `main` junto (`2cdaf62`). Testes: 1079 passando em 99 arquivos; build ok.

## Como o visual foi comparado

Dois navegadores lado a lado, os dois como visitante, janela de 1280 x 900: produção (Tailwind do CDN) e uma cópia local do ramo (Tailwind compilado). Em cada um, para todo elemento da página, 38 propriedades de estilo calculado (cor, fundo, fonte, espaçamentos, borda, tamanho, sombra, grade, transformação e outras) viraram uma impressão digital, comparada bloco a bloco.

| Tela | Elementos | Resultado |
|---|---|---|
| Home | 191 | igual |
| Álbuns (sem séries) | 198 | igual |
| Blending menu | 166 | igual |
| Playlists | 184 | igual |
| Playlists guardadas | 151 | igual |
| Inventário | 150 | igual |
| Home depois de buscar «pavement» e pôr um álbum na pilha | 315 | igual |
| Janela de entrada aberta | 337 | igual |

As únicas diferenças achadas, nenhuma visível:
- a lista de propriedades animadas de `transition-colors` não traz mais o apelido `-webkit-text-decoration-color`;
- um gradiente idêntico escrito com as paradas explícitas (0%, 50%, 100%);
- a largura do texto «Last updated», que muda com a hora;
- a janela de entrada pega no meio da animação de abertura.

## Com a conta do MJRP, na cópia local

- Blending menu: 47 séries; receita selecionada com o gradiente das classes montadas em tempo de execução (`from-amber-400/10 to-orange-500/10` vira `linear-gradient(to right bottom, rgba(251, 191, 36, 0.1), rgba(249, 115, 22, 0.1))`).
- Nenhuma página pede `cdn.tailwindcss.com`.

## Não visto

- Comparação elemento a elemento das telas com dados (cartões de álbum, ranking, playlists geradas, inventário cheio): só existem com login, e o login de produção não foi usado no navegador de teste.
- Largura de celular.
- Os três lugares onde um endereço de fora vira link (selo do Spotify, link da fonte no ranking consolidado, «abrir no Spotify» depois de exportar): só nos testes.
