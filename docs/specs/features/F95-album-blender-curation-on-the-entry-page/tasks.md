# Tasks — Feature F95: Os álbuns da página de entrada como curadoria do The Album Blender · Plan: [[plan]]
**Approved**: pendente

Via rápida (o MJRP, 2026-11-23: «tudo em fast lane.»): constrói-se do protótipo; o MJRP valida olhando a tela; os documentos vêm depois, no passo retroativo. No celular, a curadoria é o deslize da F96 e se constrói lá.

## Pre-Implementation
- [x] TASK-01 o protótipo e o nome: comparador publicado como artefato do Claude (https://claude.ai/artifact/FhWNQqENfJUgMtPdnjKDxn); o MJRP escolheu o nome em 2026-11-23 («gostei no Na Caixa....Mas colocaria na web "Na caixa do "The Album Blender" e não só blender») · evidência: ramo `wip/f95-blender-curation-prototype` (`design/proposals/f95-blender-curation/proposal.md`) e `docs/log.md` de 2026-11-23 15:23 · implements:: REQ-01, REQ-02 · model:: opus · rounds:: 1
- [x] o MJRP pôs a F95 na «Priorizada» (2026-11-23; `docs/specs/priority.md`, commit `71a9f6b`)

## Implementation
- [x] TASK-02 no computador, o nome «Na caixa do The Album Blender» junto da caixa (o selo no lugar que a página já tem para o rótulo dos álbuns fictícios; os dois nunca juntos), em português e inglês, só com o conjunto de álbuns reais; feito: o rótulo no lugar do rótulo dos álbuns fictícios (`stageTagHtml`, `public/splash/covers.js`), com o mesmo nome e a mesma chave da fileira do celular (`shelf.title`), só no computador (no celular a fileira já traz o nome); a forma (só o selo) foi a do pedido do MJRP de 2026-11-23, a validar por ele na tela · implements:: REQ-01, REQ-02, REQ-04 · model:: sonnet · depende do MJRP: a forma no computador (só o selo, ou também a faixa com todos os álbuns) é escolha do MJRP; o MJRP diz se no computador basta o selo
- [ ] TASK-03 datas ou notas, só se o MJRP as quiser: «desde tal dia» na caixa e a frase por álbum, vindas do mesmo arquivo dos álbuns · implements:: REQ-01 · model:: sonnet · depende do MJRP: ter data ou nota é escolha do MJRP; o MJRP diz se quer data, nota, as duas ou nenhuma
- [x] TASK-04 a ligação com o CMS: quando os álbuns da página forem escolhidos no Painel (F82 REQ-03, TASK-04 de lá), a curadoria mostra essa escolha, com o conjunto fixo como reserva; até lá vale o arquivo fixo; feito: a página lê `published/crate` depois de carregar e troca os álbuns na caixa do computador e na fileira do celular, com o conjunto fixo como reserva (`public/splash/publishedCrate.js`); a escolha é feita no Painel, seção «Caixa» (F82 TASK-04) · implements:: REQ-01, REQ-03 · model:: sonnet

## Verification
- [x] TASK-05 a prova no navegador (1280 px e iPhone, depois da F96; sem script; com «reduzir movimento»; cada álbum leva ao Apple Music; sem erro no console), com a evidência em `reports/evidence/F95/`; feito: 272 de 272, Chromium e WebKit a 1280 e 390 px, no site montado (`reports/evidence/F95/browser-proof.txt`, `proof.mjs`): nada publicado, caixa publicada, valor hostil publicado, leitura que falha e que demora, sem script, em inglês; cada álbum julgado pelo endereço do Apple Music, sem abrir. Não coberto pela prova: «reduzir movimento» ligado e desligado (a prova roda com ele ligado) e um iPhone de verdade · implements:: REQ-01, REQ-02, REQ-03, REQ-04 · model:: sonnet
- [ ] TASK-06 o MJRP valida olhando a tela (na via rápida o juiz é ele; o merge pede o Touch ID) · implements:: REQ-01, REQ-02 · model:: sonnet · depende do MJRP: só ele julga a tela; o MJRP abre a prévia e diz se passa

## Documentation
- [ ] TASK-07 o passo retroativo, depois do OK dele e antes de fechar: trazer o protótipo do ramo `wip/f95-blender-curation-prototype`; `docs/specs/info-arch.md`, `docs/specs/behavior.md` e `design-system.md` (o selo); a spec e o plano completos; a S-77 com `delivered_by` e `points_to`; a declaração de cada documento no `plan.md` · implements:: REQ-01 · model:: sonnet
- [ ] TASK-08 fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do `Done` · implements:: REQ-01 · model:: sonnet
