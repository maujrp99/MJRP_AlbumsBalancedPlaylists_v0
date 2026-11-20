---
type: evidence
feature: F76
subject: "F76 em produção: o app no celular, redesenhado"
written: "2026-11-20 03:48"
who: integrador (agente), no navegador embutido, conta do MJRP
---
# F76 — prova em produção · 2026-11-20 03:48

**No ar:** site publicado da `main` (`0359e3d`, pacote `main-D5xyTKX2.js`). A F76 não mexe no servidor.

**Como foi provado:** o app local (`http://127.0.0.1:5010`, código da `main`) na conta do MJRP, com o navegador embutido emulando 393x852, 393x660 e 1280x800. No site publicado, a 393 px, só a Home e os arquivos do celular servidos (`css/mobile.css`, `css/mobile/*.css`, `css/safe-area.css`, o manifesto e o ícone).

## O que vi funcionando, na conta dele

| Tela | 393 px | O que foi feito na prova |
|---|---|---|
| Barras | topo com o nome da tela; cinco destinos embaixo | navegar entre as cinco |
| Albums | busca e «Filters» no topo; primeiro álbum acima da dobra; 0 alvos abaixo de 44 px; não rola de lado | abrir a folha de ações de um álbum (sete ações nomeadas, «Remove» por último) |
| Ranking | títulos inteiros, valores de referência embaixo, «Save ranking» fixo | selecionar uma faixa: «Up», «Down», «Move to…», «Done»; sair sem gravar |
| Janela do álbum | título no topo ao rolar; «Original · BEA · Spotify» numa linha; faixas legíveis | abrir pelo inventário, rolar as 16 faixas |
| Inventário | três filtros por status, totais em duas linhas curtas, busca, A–Z, filtros, «⋯»; 3 linhas visíveis a 393x660 | conferir os valores e a troca de moeda |
| Playlists gravadas | busca e «Filters»; séries como linhas com capas | abrir a tela |
| Home | filtros de tipo em duas colunas; barra «No albums chosen · Create series» | abrir a tela |
| Blend | quatro passos; «Choose a series» abre folha; barra «Step 1 of 4» | abrir a tela |

A 1280x800: Albums, Inventário e Playlists gravadas sem nenhum elemento do celular na tela e sem rolagem lateral. Os agentes das telas compararam antes e depois pixel a pixel nas páginas de teste deles (`reports/evidence/F76/<tela>/`).

## Juízo independente

`reports/audits/2026-11-20-mjrpalbumblender-v0-mobile-ux-recheck.md`: sem P0, 11 P1, 11 P2; dos 24 achados da crítica de origem, 19 fechados, 3 em parte, 2 não medidos. O acabamento publicado depois fechou N1, N2, N3, N4, N5, N6, N7, N8, N9, N10, N20; N22 em parte; N15 e N16 em parte; ficam abertos N11 e N14.

## Suíte

3064 testes em 237 arquivos, lint e build verdes, na `main` (`0359e3d`).

## Não verificado

- Um iPhone de verdade: Safari, áreas seguras, teclado sobre as barras e as folhas, arrastar com o dedo, o app aberto pelo ícone da tela de início, VoiceOver.
- Gravar pelo celular: criar série, gravar ranking, gerar, gravar e exportar playlists, mudar status no inventário. Nada foi gravado na conta dele durante a prova.
- A edição de playlists recém-geradas com dados reais (só testes e página de teste).
- O site publicado com login em cada tela.
