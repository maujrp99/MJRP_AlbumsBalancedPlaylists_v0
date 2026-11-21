---
status: Done
lane: standard
solution_type: feature
needs_human: "ver: o app no iPhone dele, em produção — o desenho foi decidido pelo agente, sem protótipo julgado"
imports: ["[[S-58-use-the-app-comfortably-on-the-phone]]"]
planned_for: "[[ROADMAP#^REL-40]]"
---
# Feature F76: O app no celular, redesenhado
**Approved**: pendente. O MJRP priorizou a F76 e deu liberdade de desenho em 2026-11-20: «total liberdade pra vc na versao mobile, na f76....quero a melhor usabilidade e design na app mobile (sem impactar a versao web)»; «só eu uso app por enqto, por isso te dou essa liberdade criativa … uso o iphone 15 pro». O protótipo julgado antes da construção foi dispensado por essas palavras: o que ele julga é o app em produção, no celular dele (decidido pelo agente — revisável).

## Summary
**A feature:** As telas do app redesenhadas para o celular, a partir de uma crítica de UX.

**Por quê:** O MJRP usa o app no celular e achou a versão responsiva ruim.

**Como saber que funcionou:** No iPhone 15 Pro (393x852, Safari), o MJRP faz o ranking de um álbum, gera e edita playlists, cria e edita uma série de álbuns e cuida do inventário sem rolar de lado, sem dar zoom e sem errar o toque; e a tela de 1024 px para cima continua igual.

## Problem Statement
Dito pelo MJRP em 2026-11-20 00:52: «a versao responsiva mobile é bem ruim. penso que teremos que ter um redesign pra ser mais funcional na versao mobile. precisar de uma critica de UX». Issues: UAT-223, UAT-216.

## Requirements
A crítica de UX está em `reports/audits/2026-11-20-mjrpalbumblender-v0-mobile-ux-audit.md` (3 P0, 12 P1, 9 P2). «Celular» aqui é a tela de até 767 px de largura; o aparelho de referência é o iPhone 15 Pro (393x852, Safari, com a ilha no topo e a barra de início embaixo).

- [REQ-01] Nenhuma tela rola de lado no celular: a largura do conteúdo é a da tela, em pé e deitado. · fixes S-58
  verified_by:: `reports/evidence/F76/2026-11-20-foundation-proof.md`, `reports/evidence/F76/2026-11-20-production-proof.md`
- [REQ-02] No celular, todo alvo de toque tem pelo menos 44x44 px, todo texto pelo menos 12 px, e todo campo e seletor 16 px (o iPhone não dá zoom ao focar). · fixes S-58
  verified_by:: `reports/evidence/F76/2026-11-20-foundation-proof.md`, `reports/evidence/F76/2026-11-20-production-proof.md`
- [REQ-03] No celular, os destinos do app (Home, Albums, Blend, Playlists, Inventory) ficam numa barra de baixo sempre à vista, que respeita a área segura do iPhone; a barra do topo fica baixa e diz onde a pessoa está. · fixes S-58
  verified_by:: `reports/evidence/F76/2026-11-20-production-proof.md`
- [REQ-04] No celular, toda janela abre como folha: de tela cheia quando tem conteúdo para ler ou editar, de baixo quando é uma escolha curta; a página atrás não rola; fechar fica sempre à vista. · fixes S-58
  verified_by:: `reports/evidence/F76/2026-11-20-production-proof.md`
- [REQ-05] Albums no celular: o primeiro álbum aparece acima da dobra; os filtros e a ordem ficam numa folha, e a tela diz quantos filtros estão ligados; o cabeçalho da série cabe; cada ação do álbum tem nome; a visão em lista é uma linha compacta por álbum. · fixes S-58
  verified_by:: `reports/evidence/F76/2026-11-20-production-proof.md`
- [REQ-06] A janela do álbum no celular mostra o título inteiro e pelo menos cinco faixas sem rolar; as abas das fontes cabem numa linha. · fixes S-58
  verified_by:: `reports/evidence/F76/2026-11-20-production-proof.md`
- [REQ-07] Meu ranking no celular: o título de cada faixa se lê, a faixa sobe e desce por botão além de arrastar, e gravar fica sempre à vista. · fixes S-58
  verified_by:: `reports/evidence/F76/2026-11-20-production-proof.md`
- [REQ-08] Playlists no celular: cada playlist fechada diz nome, faixas e duração, e aberta rola com a página; remover e mover faixa têm alvo de 44 px e não se confundem; gerar, gravar e exportar ficam à mão. As playlists gravadas cabem na tela e mostram o nome do lote inteiro. · fixes S-58
  verified_by:: `reports/evidence/F76/2026-11-20-production-proof.md`
- [REQ-09] Criar e editar uma série no celular: ao tocar num álbum a pessoa vê, sem rolar, quantos escolheu, e a ação de criar ou gravar fica sempre à vista; a tela tem margem. · fixes S-58
  verified_by:: `reports/evidence/F76/2026-11-20-production-proof.md`
- [REQ-10] Blend no celular: as séries se alcançam sem rolagem dentro de rolagem, com busca. · fixes S-58
  verified_by:: `reports/evidence/F76/2026-11-20-production-proof.md`
- [REQ-11] Inventário no celular: uma linha compacta por álbum (capa, título, artista, status, valor), com paginação; mudar o status, editar, ver o álbum e os links de compra com alvos de 44 px; os totais e os filtros por status à vista. · fixes S-58
  verified_by:: `reports/evidence/F76/2026-11-20-production-proof.md`
- [REQ-12] A tela de 768 px para cima não muda: nenhuma regra, marcação ou comportamento desta feature age fora do celular, e isso é provado por comparação antes e depois. · fixes S-58
  verified_by:: `reports/evidence/F76/2026-11-20-foundation-proof.md`, `reports/evidence/F76/2026-11-20-production-proof.md`
- [REQ-13] O app aberto pelo ícone da tela de início do iPhone ocupa a tela inteira, com o nome e o ícone do app, e respeita as áreas seguras. · fixes S-58
  verified_by:: `reports/evidence/F76/2026-11-20-production-proof.md`

## Observable States
Os estados do celular estão em `docs/specs/info-arch.md` § Estados no celular, cada um com o seu block ID; as regras de comportamento, em `docs/specs/behavior.md` § No celular. Todos foram decididos pelo agente e esperam o juízo do MJRP no iPhone (TASK-09).

- **Navegação:** [[info-arch#^phone-shell-bars]], [[info-arch#^phone-menu-open]], [[info-arch#^phone-back-to-top]]
- **Albums:** [[info-arch#^albums-phone-default]], [[info-arch#^albums-phone-filters-open]], [[info-arch#^albums-phone-filters-on]], [[info-arch#^albums-phone-list-view]], [[info-arch#^albums-phone-album-sheet-open]], [[info-arch#^albums-phone-series-sheet-open]], [[info-arch#^albums-phone-loading]], [[info-arch#^albums-phone-empty]], [[info-arch#^albums-phone-series-failed]], [[info-arch#^albums-phone-no-match]]
- **Janela do álbum e ranking:** [[info-arch#^album-window-phone-default]], [[info-arch#^album-window-phone-scrolled]], [[info-arch#^album-window-phone-inventory]], [[info-arch#^ranking-phone-default]], [[info-arch#^ranking-phone-track-chosen]], [[info-arch#^ranking-phone-move-to-open]], [[info-arch#^ranking-phone-reset-undo]], [[info-arch#^ranking-phone-discard-open]], [[info-arch#^ranking-phone-saved]]
- **Playlists:** [[info-arch#^playlists-phone-default]], [[info-arch#^playlists-phone-empty]], [[info-arch#^playlists-phone-track-sheet-open]], [[info-arch#^playlists-phone-track-removed]], [[info-arch#^playlists-phone-playlist-sheet-open]], [[info-arch#^playlists-phone-export-open]], [[info-arch#^saved-playlists-phone-default]], [[info-arch#^saved-playlists-phone-filters-open]], [[info-arch#^saved-playlists-phone-series-open]], [[info-arch#^saved-playlists-phone-series-sheet-open]], [[info-arch#^saved-playlists-phone-batch-sheet-open]]
- **Home e Blend:** [[info-arch#^home-phone-default]], [[info-arch#^home-phone-album-chosen]], [[info-arch#^home-phone-chosen-sheet-open]], [[info-arch#^home-phone-name-required]], [[info-arch#^home-phone-creating]], [[info-arch#^series-edit-phone-default]], [[info-arch#^blend-phone-step1-empty]], [[info-arch#^blend-phone-series-sheet-open]], [[info-arch#^blend-phone-ready]], [[info-arch#^blend-phone-blending]]
- **Inventário:** [[info-arch#^inventory-phone-default]], [[info-arch#^inventory-phone-loading]], [[info-arch#^inventory-phone-empty]], [[info-arch#^inventory-phone-no-match]], [[info-arch#^inventory-phone-show-more]], [[info-arch#^inventory-phone-status-sheet-open]], [[info-arch#^inventory-phone-item-sheet-open]], [[info-arch#^inventory-phone-filters-open]], [[info-arch#^inventory-phone-actions-open]], [[info-arch#^inventory-phone-jump-open]], [[info-arch#^inventory-phone-values-sheet-open]], [[info-arch#^inventory-phone-working]]

## Success Criteria
Medidas do fecho (as notas de cada tela em `screens/` e a re-conferência `reports/audits/2026-11-20-mjrpalbumblender-v0-mobile-ux-recheck.md`, 2026-11-20 23:40). Cada critério vale a 393x852 e, onde dito, a 393x660 (o que o Safari deixa visível):

- **REQ-01** · nenhuma tela rola de lado: `scrollWidth` igual a `clientWidth` (393) em Home, Albums, Blend, Playlists, Playlists gravadas, Inventário e nas janelas. Medido: 393 em todas (re-conferência, 24 falhas antigas: #1, #2, #4 fechadas).
- **REQ-02** · 0 alvos abaixo de 44x44 px, 0 textos abaixo de 12 px, 0 campos abaixo de 16 px, em cada tela e em cada folha aberta. Medido: 0, 0 e 0 em todas as telas dos arnês e na re-conferência (falhas #5, #7, #11, #12, #21, #22 fechadas); o contraste do texto cinza é de 4,5:1 ou mais, com uma exceção conhecida (o estado vazio da janela Edit Series, 2,43:1, N16).
- **REQ-03** · a barra de baixo com os cinco destinos está sempre à vista, a do topo tem 48 px e diz a tela. Medido: barra do topo fixa de 0 a 48 px; barra de baixo de 56 px com `aria-current`.
- **REQ-04** · toda janela do celular abre como folha, a página de trás não rola e fechar fica à vista. Medido: 0 caixas com rolagem própria fora do corpo da folha; a página soltou em todas as aberturas e fechamentos medidos (uma exceção não reproduzida, N22).
- **REQ-05** · Albums: o primeiro álbum de 1126 px para **261 px** (a capa termina em 436 px); 0 botões só-ícone sem nome (eram 6); a lista de 10 séries com 7 431 px (a crítica mediu 205 896 px).
- **REQ-06** · janela do álbum: título inteiro; **8 faixas inteiras** à vista a 393x852 e 5 a 393x660; as três fontes numa linha.
- **REQ-07** · ranking: 10 faixas à vista a 393x852 e 7 a 393x660, nenhum título cortado (o mais estreito tem 267 px); «Save ranking» sempre à vista; a faixa se move por botão (a alça leva a faixa 1 ao 4º lugar; o mesmo gesto no título rola a lista sem mudar a ordem).
- **REQ-08** · Playlists: a primeira faixa sobe de y=496 para **y=270**; **4 faixas inteiras** acima da barra de ação a 393x660 (eram 0); 0 caixas com rolagem própria (eram 6). Gravadas: a página de 12 séries de 10 756 px para 1 793 px; a primeira série em y=120 (era 370).
- **REQ-09** · Home: a barra «N albums chosen · Create series» sempre à vista; a Home tem margem de 16 px; 0 alvos abaixo de 44 px em todas as cenas, a 393x852 e 393x660.
- **REQ-10** · Blend: 5 toques do zero até «Blend it!»; 48 séries alcançadas sem rolagem interna, com busca.
- **REQ-11** · Inventário: linha de 102 px (122 com título em duas linhas), 50 por vez; os 211 álbuns de ~95 000 px para ~23 000 px; do topo ao 150º álbum em **2 gestos**; a primeira linha em y=365 (antes 721), com 2 linhas inteiras a 393x660 e 4 a 393x852.
- **REQ-12** · a tela de 768 px para cima não muda: 0 pixels diferentes a 1280x800, antes e depois, em Albums (7 cenários), janela do álbum, Home, Playlists, Playlists gravadas e Inventário (exceções de antisserrilhado de 1/255 e de uma faixa de 5 px no botão «Sign In», que nenhum ramo da F76 toca); o teste `test/architecture/phoneStylesStayOnThePhone.test.js` passa.
- **REQ-13** · o app aberto pelo ícone da tela de início ocupa a tela inteira e respeita as áreas seguras: **ainda sem prova**, só no iPhone (TASK-09).
- **Do todo (a prova que falta):** das 24 falhas da crítica de UX, 19 fecharam, 3 fecharam em parte e 2 não foram re-medidas; a re-conferência achou 0 P0, 11 P1 e 11 P2, e o polimento tratou N1 a N10 (as notas das telas dizem como; N22 não reproduzida). O juízo do MJRP no iPhone dele (TASK-09) é o que diz se a feature funcionou.

## Out of Scope
- Mudar a tela de computador.
- App nativo. Uso sem rede.
- Uma identidade visual nova: as cores e a tipografia do app ficam.

## Open Questions
- Quais telas primeiro: a crítica propõe a ordem; o MJRP decide.
