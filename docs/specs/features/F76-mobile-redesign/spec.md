---
status: In Progress
lane: standard
solution_type: feature
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
- [REQ-02] No celular, todo alvo de toque tem pelo menos 44x44 px, todo texto pelo menos 12 px, e todo campo e seletor 16 px (o iPhone não dá zoom ao focar). · fixes S-58
- [REQ-03] No celular, os destinos do app (Home, Albums, Blend, Playlists, Inventory) ficam numa barra de baixo sempre à vista, que respeita a área segura do iPhone; a barra do topo fica baixa e diz onde a pessoa está. · fixes S-58
- [REQ-04] No celular, toda janela abre como folha: de tela cheia quando tem conteúdo para ler ou editar, de baixo quando é uma escolha curta; a página atrás não rola; fechar fica sempre à vista. · fixes S-58
- [REQ-05] Albums no celular: o primeiro álbum aparece acima da dobra; os filtros e a ordem ficam numa folha, e a tela diz quantos filtros estão ligados; o cabeçalho da série cabe; cada ação do álbum tem nome; a visão em lista é uma linha compacta por álbum. · fixes S-58
- [REQ-06] A janela do álbum no celular mostra o título inteiro e pelo menos cinco faixas sem rolar; as abas das fontes cabem numa linha. · fixes S-58
- [REQ-07] Meu ranking no celular: o título de cada faixa se lê, a faixa sobe e desce por botão além de arrastar, e gravar fica sempre à vista. · fixes S-58
- [REQ-08] Playlists no celular: cada playlist fechada diz nome, faixas e duração, e aberta rola com a página; remover e mover faixa têm alvo de 44 px e não se confundem; gerar, gravar e exportar ficam à mão. As playlists gravadas cabem na tela e mostram o nome do lote inteiro. · fixes S-58
- [REQ-09] Criar e editar uma série no celular: ao tocar num álbum a pessoa vê, sem rolar, quantos escolheu, e a ação de criar ou gravar fica sempre à vista; a tela tem margem. · fixes S-58
- [REQ-10] Blend no celular: as séries se alcançam sem rolagem dentro de rolagem, com busca. · fixes S-58
- [REQ-11] Inventário no celular: uma linha compacta por álbum (capa, título, artista, status, valor), com paginação; mudar o status, editar, ver o álbum e os links de compra com alvos de 44 px; os totais e os filtros por status à vista. · fixes S-58
- [REQ-12] A tela de 768 px para cima não muda: nenhuma regra, marcação ou comportamento desta feature age fora do celular, e isso é provado por comparação antes e depois. · fixes S-58
- [REQ-13] O app aberto pelo ícone da tela de início do iPhone ocupa a tela inteira, com o nome e o ícone do app, e respeita as áreas seguras. · fixes S-58

## Observable States
A escrever com o protótipo.

## Success Criteria
A escrever.

## Out of Scope
- Mudar a tela de computador.
- App nativo. Uso sem rede.
- Uma identidade visual nova: as cores e a tipografia do app ficam.

## Open Questions
- Quais telas primeiro: a crítica propõe a ordem; o MJRP decide.
