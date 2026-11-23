# Tasks — Feature F96: A página de entrada no celular, organizada em swipes · Plan: [[plan]]
**Approved**: pendente

Via rápida (o MJRP, 2026-11-23: «tudo em fast lane.»): constrói-se do protótipo escolhido; o MJRP valida olhando a tela; os documentos vêm depois, no passo retroativo.

## Pre-Implementation
- [x] TASK-01 o protótipo e a escolha: comparador publicado como artefato do Claude (https://claude.ai/artifact/Qs64Xut1fuKQ6z1Sf8tjTd), com três versões e a crítica separada de UX e UI; o MJRP escolheu em 2026-11-23 («escolho a do especialista, mas com essa landing aqui, muito melhor») · evidência: ramo `wip/f96-phone-home-prototype` (`design/proposals/f96-phone-home/proposal.md`, `reports/audits/2026-11-23-mjrpalbumblender-v0-f96-phone-home-swipe-ux-audit.md`) e `docs/log.md` de 2026-11-23 15:55 · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05 · model:: opus · rounds:: 1
- [x] o MJRP pôs a F96 na «Priorizada» (2026-11-23; `docs/specs/priority.md`, commit `71a9f6b`)

## Implementation
- [ ] TASK-02 a abertura no celular: sem o botão grande; a caixa de álbuns na diagonal, com a legenda de álbum e ano e o botão «Ouça no Apple Music». A caixa deve ser a caixa leve em CSS, girada como no protótipo (30 graus), se ela se sustentar na página de verdade; a cena 3D no celular custa 152 KB a mais na primeira visita (medido em 2026-11-23, ramo `fix/f80-crate-animation-break`, `reports/evidence/F80/crate-diagonal-on-phone/`) e só entra com a palavra do MJRP · implements:: REQ-02 · model:: sonnet
- [ ] TASK-03 a parte que ensina: o título da seção e cada um dos cinco passos na ordem rótulo, título, texto, ilustração, com a marca de troca de passo; o texto escrito no HTML · implements:: REQ-03 · model:: sonnet · depende do MJRP: o título da seção e a marca da troca de passo são escolhas do MJRP; o MJRP diz qual das três redações do título e qual das três marcas de passo (rótulo e linha, faixas alternadas, dois lados)
- [ ] TASK-04 os álbuns saem dos passos: cada passo fica com uma ilustração só (o painel ilustrativo na medida que ele já tem no computador), sem a capa e sem o segundo botão do Apple Music · implements:: REQ-04 · model:: sonnet
- [ ] TASK-05 a caixa «Na caixa do The Album Blender», no fim, como o único deslize de lado: fila que rola pelo próprio navegador, a ponta do álbum seguinte à vista, setas que se tocam com nome para o leitor de tela, nenhum avanço automático; cada álbum com a capa, o nome e «Ouça no Apple Music» (é a parte da F95 no celular) · implements:: REQ-04, REQ-05 · model:: sonnet
- [ ] TASK-06 quem não tem conta: «Entrar» continua no alto e o «Criar» da barra de baixo abre o app em vez de rolar até o passo; os outros itens da barra seguem como hoje · implements:: REQ-06 · model:: sonnet
- [ ] TASK-07 os textos novos em português e inglês (o título da seção, o nome da caixa em inglês, os nomes das setas), com «The Album Blender» inteiro e «álbum/álbuns» · implements:: REQ-08 · model:: sonnet

## Verification
- [ ] TASK-08 a prova no navegador (WebKit com perfil de iPhone a 390 e a 375; 1280 px para conferir que o computador não mudou; sem conta e com conta; sem script; com «reduzir movimento»; o peso da primeira visita contra o de hoje; sem erro no console), com a evidência em `reports/evidence/F96/` · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08 · model:: sonnet
- [ ] TASK-09 o MJRP valida olhando a tela no iPhone dele (na via rápida o juiz é ele; o merge pede o Touch ID) · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06 · model:: sonnet · depende do MJRP: só ele julga a tela; o MJRP abre a prévia no iPhone e diz se passa

## Documentation
- [ ] TASK-10 o passo retroativo, depois do OK dele e antes de fechar: trazer o protótipo e a crítica do ramo `wip/f96-phone-home-prototype`; `docs/specs/info-arch.md` (os estados da página no celular) e os wireframes; `docs/specs/behavior.md`; `design-system.md` (a prateleira de capas como padrão novo; o tom de fundo, se a marca de passo pedir); a spec e o plano completos; a S-78 com `delivered_by` e `points_to`; a declaração de cada documento no `plan.md` · implements:: REQ-01 · model:: sonnet
- [ ] TASK-11 fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do `Done` · implements:: REQ-01 · model:: sonnet
