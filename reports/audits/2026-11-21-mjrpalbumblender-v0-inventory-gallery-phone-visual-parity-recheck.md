---
type: ux-audit
subject: "Reconferência visual pré-merge do ramo feat/f76-inventory-gallery-on-the-phone, no site CONSTRUÍDO (vite build) e no WebKit com perfis de iPhone: a galeria de capas do inventário no celular (F89, UAT-274), irmã da grade de Albums"
project: mjrpalbumblender-v0
features: [F89]
moment: delivery
date: "2026-11-21 23:40"
judged: "2026-11-21 23:40"
judged_commit: 869ec36
who_judged: separate-agent
verdict: pass
p0: 0
p1: 0
p2: 6
duration_s: 3000
status: open
---

# Reconferência visual — a galeria do inventário no celular

**Veredito: passa (`pass`), sem P0 e sem P1; 6 P2.** A galeria tem as mesmas colunas, os mesmos vãos e o mesmo tamanho de capa da grade **real** de Albums em todas as larguras do celular (320 a 899 px): 2 colunas até 639 px, 3 a partir de 640 px, vãos de 12 × 20 px. Na mesma posição, a capa tem o mesmo tamanho ao centésimo de pixel. Os cartões mostram tudo e nada se sobrepõe: título em até duas linhas, a capa substituta, o «—» com o motivo, as duas médias, a situação e «⋯». A busca, os filtros, a ordem, as contagens e o aviso dos valores dão o mesmo resultado nas duas visões. A lista do celular e o computador a 1280 px ficaram iguais ao `main`, com 0 pixel diferente. A única diferença que separa a galeria de Albums é o canto da capa, 8 px em vez de 10 (P2-1). O resto são acabamentos.

## Como foi feito
- **Quem julgou:** agente juiz separado (Opus), que não construiu o ramo.
- **Objeto:** `869ec36` e `main` (`1330ba9`, que é a base do ramo). Cada um foi exportado (`git archive`) para uma pasta de rascunho e construído com `vite build` pela fila da máquina (`machine_load.py`, rótulo `judge-f89-build`), de duas formas:
  - o site inteiro, que construiu sem erro nas duas versões;
  - a página de ensaio do construtor (`harness/`, com a tela real, as folhas de estilo na ordem do app e itens de mentira), copiada também para o `main` como controle.
- **Albums real:** no ensaio acrescentei um cenário do juiz que desenha a grade de Albums com o código dela, `renderAlbumsGrid` e `wrapInGrid`, com o cartão do celular dentro de `.albums-view.container`. O construtor comparou com uma caixa que só imitava as classes.
- **Navegadores:** Playwright 1.56.1, emprestado de outro projeto do MJRP na máquina.
  - WebKit com os perfis `iPhone 14` (390 × 664) e `iPhone SE` (320 × 568);
  - WebKit a 820 × 1180 e em larguras livres de 320, 360, 375, 393, 430, 600, 640, 768, 820 e 899 px;
  - Chromium a 1280 × 800, e também para o teclado.
- **Rede:** os pedidos a `identitytoolkit`, `securetoken`, `firestore.googleapis` e `firebaseinstallations` ficaram bloqueados. Nenhum foi feito, porque o ensaio troca o Firebase por um módulo vazio. Não houve login, e nada foi escrito fora da memória da página.
- **Roteiros e medidas** (no rascunho, fora do repositório): `work/judge.mjs`, `work/judge2.mjs`, `work/judge.json`, `work/judge2.json`. Os servidores foram parados ao fim de cada roteiro.
- **Capturas:** `captures/` (12 recortes, 0,9 MB).

## O que foi conferido
1. **Colunas, vãos e capas iguais aos de Albums** (`albums-left-gallery-right-{320,393,640,899}px.jpg`):

   | largura | colunas | capa (px) |
   |---|---|---|
   | 320 | 2 | 138 |
   | 360 | 2 | 158 |
   | 375 | 2 | 165,5 |
   | 393 | 2 | 174,5 |
   | 430 | 2 | 193 |
   | 600 | 2 | 278 |
   | 640 | 3 | 194,66 |
   | 768 | 3 | 237,33 |
   | 820 | 3 | 254,66 |
   | 899 | 3 | 281 |

   - Os vãos são `12px` × `20px` nas duas grades.
   - As bordas da grade, a largura da célula e o passo entre capas são idênticos nas dez larguras.
   - Nenhuma largura rola para o lado.
   - Só o canto difere (P2-1).
2. **O cartão** (`cards-long-title-no-cover-wishlist-no-value-SE-and-iPhone14.jpg`, `w820-gallery-top.jpg`). Uma auditoria por caixa nos 50 cartões de cada perfil achou 0 peça fora do cartão, 0 sobreposição, 0 pílula cortada e 0 valor cortado; nenhum título passa de 2 linhas.
   - O título longo corta com «…» na segunda linha, e o artista longo corta em uma linha.
   - Sem capa, aparece o mesmo disco substituto da lista.
   - O item da lista de desejos mostra «♡ Wishlist» rosa.
   - Sem valor, o cartão mostra «—» cinza e «CD · Waiting for a value». No SE, o motivo corta (P2-2).
   - As médias aparecem com os ícones da lista (fita e Spotify).
   - A frase da Discogs está ao pé da tela nas duas visões, e «Data provided by Discogs.» está na folha «⋯».
3. **A troca entre galeria e lista** (`switch-in-filters-sheet-SE-and-iPhone14.jpg`):
   - **Onde fica:** é o primeiro grupo da folha «Filters and order» («View»), com dois botões de 44 px de altura, ícone e nome, e cabe sem rolar no SE.
   - **Achar:** é o mesmo lugar de Albums no celular. Fica atrás do ícone de controles deslizantes, que não sugere «visão», mas o dono disse onde está e Albums já ensina o caminho. Fica como pergunta aberta da spec, não como achado.
   - **Escolher:** a escolha não acende o «filtro ligado» (`data-on="0"`).
   - **Guardar:** a escolha volta depois de recarregar, nas duas direções.
   - **Padrão:** quem nunca escolheu vê a lista (50 linhas, 0 cartões).
   - **A mesma escolha do computador:** a chave é a mesma (`mjrp_inventory_view_mode`), mas fica no navegador, então só é compartilhada no mesmo aparelho (o iPad que gira, ou a janela estreita no Mac). O padrão de grade do computador não passa para o celular, porque o celular só mostra a galeria para quem a escolheu (`viewChosen`). Para quem usa o iPhone e o Mac, cada aparelho guarda a sua escolha. Acho certo e nada surpreendente.
4. **As mesmas coisas funcionam nas duas visões** (`tap-card-album-window-and-more-sheet-iPhone14.jpg`, `keyboard-focus-open-status-more.jpg`):
   - **Os mesmos itens, na mesma ordem:** nenhuma busca, busca «pink», formato Vinyl, contagem Wishlist e ordem «Value (↓)», com as mesmas contagens embaixo («Showing 50 of 60», «All 7 albums»).
   - **Aviso dos valores:** «11 albums are waiting for a value» com «Read them now» e «About the values» nas duas.
   - **Folha «⋯»:** idêntica à da lista: Open album, Edit, a edição na Discogs, Discogs, Amazon e iMusic, Sell, Trade, Remove from inventory.
   - **Folha da situação:** Owned, Not Owned e Wishlist.
   - **A janela do álbum:** abre ao tocar no título (toque do WebKit) e com Enter.
   - **Alvos:** todos os botões do cartão têm pelo menos 44 × 44 px. O espaço entre a pílula e «⋯» pertence ao botão da situação, não abre o álbum.
   - **Teclado** (Chromium, e WebKit com Option+Tab): abrir, depois situação, depois «⋯», depois o próximo cartão, com o anel visível.
5. **Fim da tela, rolagem lateral, console e fluidez:**
   - **Fim da tela** (`end-gallery-vs-list-SE-back-to-top-over-discogs.jpg`): o último cartão e a contagem terminam 96 px acima do menu de baixo (iPhone 14: 492 contra 588; SE: 396 contra 492; 820: 1024 contra 1104).
   - **Rolagem lateral:** nenhuma.
   - **Console:** nenhum erro da página. O único 404 veio de um recarregamento do meu roteiro numa rota que o servidor de ensaio não serve; ele não aparece na segunda rodada.
   - **300 itens na galeria** (seis blocos de 50): rolar de cima a baixo, 40 px por quadro, deu mediana de 33 ms por quadro e percentil 95 de 35 ms. Houve 0 quadro acima de 50 ms no iPhone 14 e no 820, e 2 de 1187 no SE. É o ritmo do WebKit sem tela, não de um iPhone.
6. **Nada mudou fora da galeria:**
   - **Controle de ruído:** `main` contra `main` deu 0 pixel diferente em todas as capturas.
   - **A lista do celular**, página inteira no iPhone 14 e no SE: o ramo contra o `main` deu **0 pixel** (`phone-list-main-vs-branch-iPhone14-0px-diff.jpg`).
   - **O computador a 1280 px**, sem escolha, com grade e com lista: o ramo contra o `main` deu **0 pixel** (`desk1280-default-branch-0px-diff-vs-main.jpg`), sem nenhum `.inv-tile`.
   - **A folha «Filters and order»:** só ela difere, porque ganhou o grupo «View», como esperado.

## Achados
- **P2-1 · o canto da capa é 8 px, e o de Albums é 10 px.** As duas grades têm medidas iguais, mas a capa irmã é mais quadrada. O design system manda 10 px para «canto de capa e cartão».
  - **Âncora:** `public/css/mobile/inventory.css`, `.inv-tile__cover` e `.inv-tile__open` (`border-radius: 8px`).
  - **Evidência:** `judge.json` → `widths.*.albums.radius` `10px` contra `inventory.radius` `8px`; `albums-left-gallery-right-393px.jpg`.
  - **A mudança:** usar `10px` nos dois.
- **P2-2 · no iPhone SE, o motivo do «—» corta: «CD · Waiting for a val…».** O motivo é justamente o que explica o traço. O `title` não serve num toque.
  - **Âncora:** `.inv-tile__origin` (`white-space: nowrap; text-overflow: ellipsis`), `InventoryPhoneTile.js` `tileValue`.
  - **Evidência:** `cards-long-title-no-cover-wishlist-no-value-SE-and-iPhone14.jpg`; `judge.json` → `profiles.iphoneSE.audit.originsCut`.
  - **A mudança:** quando não há valor, deixar a linha quebrar em duas, ou pôr o formato numa linha própria.
- **P2-3 · no fim da galeria, o botão «voltar ao topo» cobre o fim da frase da Discogs.** No SE ele cobre «Discogs.» e «LLC.». Na lista isso não acontece, porque a página é curta demais para o botão aparecer; a galeria é mais alta, então o botão aparece mais vezes.
  - **Âncora:** o botão de voltar ao topo (`public/css/mobile.css` § 6) e `.inv-discogs-notice`.
  - **Evidência:** `end-gallery-vs-list-SE-back-to-top-over-discogs.jpg`.
  - **A mudança:** dar à frase um respiro embaixo do tamanho do botão (cerca de 64 px), ou esconder o botão quando o fim da página está à vista.
- **P2-4 · a pílula da situação na galeria não tem a seta «⌄» que a lista tem.** Na lista, «✓ Owned ⌄» diz que se pode tocar. Na galeria, «✓ Owned» parece só uma etiqueta.
  - **Âncora:** `InventoryPhoneTile.js`, `phoneTile`, `.inv-tile__pill`.
  - **Evidência:** `end-gallery-vs-list-SE-back-to-top-over-discogs.jpg`, galeria à esquerda e lista à direita.
  - **A mudança:** a mesma seta da linha, se couber a 320 px. Mede-se com «Not Owned», a mais longa.
- **P2-5 · com teclado, o cartão em foco pode ficar meio escondido sob o menu de baixo.** O `.inv-tile` tem `scroll-margin-top`, mas não tem margem embaixo. Ao focar um cartão perto do fim da tela, a situação e «⋯» ficam atrás da barra de 76 px. No celular quase não acontece; no iPad com teclado, sim.
  - **Âncora:** `public/css/mobile/inventory.css`, `.inv-tile`.
  - **Evidência:** `keyboard-focus-open-status-more.jpg`, os dois primeiros quadros.
  - **A mudança:** `scroll-margin-bottom: calc(var(--phone-tabbar-h) + 8px)` no cartão, e o mesmo na linha, se ela também não tiver.
- **P2-6 · os documentos ainda dizem 3 colunas a 393 px.** A linha UAT-274 em `docs/specs/uat.md` diz «3 por linha a 393 px». O comentário de `shoot.mjs` diz que o `iphoneSE3` (375 px) é «the narrowest width with 3 columns». Os dois contradizem a spec da F89 e o commit `869ec36` (2 colunas até 639 px). Quem ler a issue vai esperar outra grade.
  - **A mudança:** alinhar os dois textos com a regra de Albums.

Observação, sem achado: numa linha da galeria, a pílula e «⋯» não ficam na mesma altura quando um título tem duas linhas e o vizinho uma. Na grade de Albums é igual, porque os cartões têm alturas livres.

## Não visto
- **Um iPhone de verdade:** só o WebKit do Playwright com os perfis. Não foram vistos:
  - o Safari do iOS, com a rolagem e a inércia de verdade, e o toque real;
  - o aA e o Dynamic Type;
  - a área segura real.
- **Dados reais:** com o Firestore bloqueado, a tela real `/inventory` do site construído não carrega itens sem login. A galeria foi vista na página de ensaio, construída com o mesmo `vite build` e as mesmas folhas de estilo, com itens de mentira. «Update values» não é um botão solto nas duas visões. Fica na folha dos valores, que não abri.
- **Remover e editar:** a folha «⋯» mostra as ações, mas não as executei, para nada mudar, nem em memória.
