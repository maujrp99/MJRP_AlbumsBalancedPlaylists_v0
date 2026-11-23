# Tasks — Feature F95: Os álbuns da página de entrada como curadoria do The Album Blender · Plan: [[plan]]
**Approved**: pendente

Via rápida (o MJRP, 2026-11-23: «tudo em fast lane.»): constrói-se do protótipo; o MJRP valida olhando a tela; os documentos vêm depois, no passo retroativo. No celular, a curadoria é o deslize da F96 e se constrói lá.

## Pre-Implementation
- [x] TASK-01 o protótipo e o nome: comparador publicado como artefato do Claude (https://claude.ai/artifact/FhWNQqENfJUgMtPdnjKDxn); o MJRP escolheu o nome em 2026-11-23 («gostei no Na Caixa....Mas colocaria na web "Na caixa do "The Album Blender" e não só blender») · evidência: ramo `wip/f95-blender-curation-prototype` (`design/proposals/f95-blender-curation/proposal.md`) e `docs/log.md` de 2026-11-23 15:23 · implements:: REQ-01, REQ-02 · model:: opus · rounds:: 1
- [x] o MJRP pôs a F95 na «Priorizada» (2026-11-23; `docs/specs/priority.md`, commit `71a9f6b`)

## Implementation
- [ ] TASK-02 no computador, o nome «Na caixa do The Album Blender» junto da caixa (o selo no lugar que a página já tem para o rótulo dos álbuns fictícios; os dois nunca juntos), em português e inglês, só com o conjunto de álbuns reais · implements:: REQ-01, REQ-02, REQ-04 · model:: sonnet · depende do MJRP: a forma no computador (só o selo, ou também a faixa com todos os álbuns) é escolha do MJRP; o MJRP diz se no computador basta o selo
- [ ] TASK-03 datas ou notas, só se o MJRP as quiser: «desde tal dia» na caixa e a frase por álbum, vindas do mesmo arquivo dos álbuns · implements:: REQ-01 · model:: sonnet · depende do MJRP: ter data ou nota é escolha do MJRP; o MJRP diz se quer data, nota, as duas ou nenhuma
- [ ] TASK-04 a ligação com o CMS: quando os álbuns da página forem escolhidos no Painel (F82 REQ-03, TASK-04 de lá), a curadoria mostra essa escolha, com o conjunto fixo como reserva; até lá vale o arquivo fixo · implements:: REQ-01, REQ-03 · model:: sonnet

## Verification
- [ ] TASK-05 a prova no navegador (1280 px e iPhone, depois da F96; sem script; com «reduzir movimento»; cada álbum leva ao Apple Music; sem erro no console), com a evidência em `reports/evidence/F95/` · implements:: REQ-01, REQ-02, REQ-03, REQ-04 · model:: sonnet
- [ ] TASK-06 o MJRP valida olhando a tela (na via rápida o juiz é ele; o merge pede o Touch ID) · implements:: REQ-01, REQ-02 · model:: sonnet · depende do MJRP: só ele julga a tela; o MJRP abre a prévia e diz se passa

## Documentation
- [ ] TASK-07 o passo retroativo, depois do OK dele e antes de fechar: trazer o protótipo do ramo `wip/f95-blender-curation-prototype`; `docs/specs/info-arch.md`, `docs/specs/behavior.md` e `design-system.md` (o selo); a spec e o plano completos; a S-77 com `delivered_by` e `points_to`; a declaração de cada documento no `plan.md` · implements:: REQ-01 · model:: sonnet
- [ ] TASK-08 fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do `Done` · implements:: REQ-01 · model:: sonnet
