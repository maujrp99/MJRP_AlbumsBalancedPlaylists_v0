---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-173", "UAT-174"]
---
# Feature F46: Cada série termina carregada, vazia ou com aviso de falha, e nada some durante a carga
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Durante a carga e depois dela, cada série mostra um estado claro: carregando, carregada, sem álbuns, ou com aviso de que algum álbum falhou. Sair da tela e voltar não faz série nenhuma sumir. O ranking que a pessoa salva num álbum aparece na tela sem recarregar o resto, e o filtro «My Ranking» responde sobre todas as séries.

**Por quê:** Séries com álbum ficavam em bloco cinza até a pessoa rolar, séries sumiam ao sair e voltar no meio da carga, e um álbum que falhava não deixava sinal. O ranking salvo só aparecia porque a tela alterava o álbum à mão, e o filtro «My Ranking» só enxergava os álbuns já carregados.

**Como saber que funcionou:** Sair para a Home no meio da carga e voltar mostra o mesmo número de séries; uma série com um álbum que falhou continua na tela com o aviso; salvar um ranking muda só aquele álbum; «My Ranking» traz séries de páginas que nunca foram abertas.

## Problem Statement
A tela usava um único sinal de «carregando» para três coisas (bloco cinza, série oculta, tela vazia), e qualquer carga que terminava o desligava, mesmo uma carga antiga. O resultado era série que some, bloco cinza que não vira conteúdo e falha sem aviso (UAT-173, UAT-174). A maior parte disso foi consertada dentro da F45 e da F51, porque a grade desenhada pelo estado de cada série e a paginação já o pediam. Esta feature fecha o que sobrou: o controlador continuava inscrito nas stores depois de a tela fechar, o modal de ranking gravava direto no repositório e a tela mutava o álbum publicado, e o ranking pessoal não tinha dono no cliente.

## Requirements
- [REQ-01] Cada série tem um estado derivado dos seus álbuns: carregando, completa, com falha ou vazia. Nenhum sinal global decide o que aparece. · fixes UAT-173 · **entregue pela F45**
  verified_by:: `test/models/albumLoadState.test.js`, `test/stores/albumLoad.test.js`
- [REQ-02] Uma série com álbum que não carregou continua na tela e diz quantos faltaram, com «Try again», que busca de novo só os que falharam. · fixes UAT-174 · **entregue pela F45**
  verified_by:: `test/services/albums/AlbumLoadService.test.js`, `test/controllers/SeriesController.test.js`
- [REQ-03] A página é desenhada inteira: nenhuma série com álbum espera a pessoa rolar para sair do bloco cinza. · fixes UAT-173 · **entregue pela F51**
  verified_by:: `reports/evidence/F51-album-filters-search-and-paging/F51-probe-2026-11-19.json`
- [REQ-04] Sair da tela e voltar não perde nem duplica nada: a carga segue no serviço, as inscrições da visita anterior terminam quando a tela fecha, e a visita seguinte mostra o progresso feito. · fixes UAT-173
  verified_by:: `test/controllers/SeriesController.test.js`
- [REQ-05] O ranking que a pessoa salva num álbum aparece na tela: só a fonte `userRanking` daquele álbum é lida de novo, em todas as séries que o têm, sem buscar nem enriquecer mais nada, e o álbum publicado antes não é alterado.
  verified_by:: `test/services/albums/AlbumLoadService.test.js`, `test/controllers/SeriesController.test.js`, `test/components/ranking/UserRankModal.test.js`
- [REQ-06] O filtro «My Ranking» responde sobre todas as séries, carregadas ou não, a partir de uma leitura só da lista de álbuns ranqueados.
  verified_by:: `test/models/ownRanking.test.js`, `test/services/ranking/OwnRankingService.test.js`, `test/controllers/SeriesController.test.js`
- [REQ-07] A tela não fala com o repositório de ranking nem com o serviço de carga: o modal avisa quem o abriu, e quem salva é o controlador, por um serviço.
  verified_by:: `test/architecture/ownRankingBoundaries.test.js`

## Observable States
N/A: a feature não importa nenhum requisito (conserto das issues UAT-173 e UAT-174), então nenhum estado é apontado. O que a tela mostra, para registro:
- Série carregando: bloco cinza. Série completa: os álbuns. Série com falha: os álbuns achados e o aviso «N albums did not load · Try again». Série vazia: o cabeçalho, sem álbum.
- Ranking salvo: o modal fecha, aparece «Rankings saved for "<álbum>"», e o cartão daquele álbum passa a mostrar o ranking.
- «My Ranking» escolhido: a tela mostra de imediato os álbuns carregados que têm ranking e, quando a lista chega, as séries de todas as páginas.

## Prototype Parity (if the feature touches a screen)
- Prototype: nenhum. Nada de tela nova: os estados da série são os da F45, e o modal de ranking é o mesmo.
- Transversal layer touched: nenhuma. O modal deixou de escapar texto que já desenha como nó de texto (um nome com «&» aparecia como «&amp;»).
- Design-system cuts or swaps: none. O projeto não tem `design-system.md`.

**Prototype**: none — MJRP, 2026-11-20 00:10: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
- Com a carga em andamento, ir à Home e voltar: o mesmo número de séries, e o console sem desenho em tela fechada. A conferir no navegador pela sessão de integração.
- Uma série com um pedido que o catálogo não tem mostra «1 album did not load · Try again»; o clique busca de novo só esse álbum. Conferido na F47 (4 álbuns com aviso em 217); o clique a conferir no navegador.
- Salvar um ranking: uma leitura do ranking daquele álbum, nenhuma busca no catálogo, nenhuma nota pedida de novo (teste do serviço).
- «My Ranking» com só a primeira página carregada traz as séries das outras páginas que têm álbum ranqueado (teste do controlador; a conferir no navegador).

## Out of Scope
- O observador de visibilidade por série, que a proposta punha aqui. Não foi construído: a paginação por série (F51) limita o que está na tela.
- Adicionar e remover álbum pela reconciliação, sem a «injeção cirúrgica» de `SeriesService` (linhas 15 da tabela da seção 15 do `arch.md`). O arquivo é da F48, em curso em outra sessão.
- Gravar o id do álbum achado junto do pedido (`facts.albumId`), que casaria ranking e pedido de forma exata sem carregar. Muda dado gravado: vai ao MJRP antes.
- O ranking lido pela mistura (`BlendingController`) e pela injeção de `SeriesService`, que ainda falam com o repositório direto.
- Apagar um ranking: o app não tem essa ação na tela.

## Open Questions
- O casamento por nome entre ranking e pedido basta? — para o que diverge em caixa, acento, pontuação, «&», entidade HTML e nota de edição, sim (testado). Quando o catálogo deu outro título ao álbum, só casa depois de o álbum carregar. A saída exata é `facts.albumId`; decisão do MJRP, sem data.
- Nenhuma outra.
