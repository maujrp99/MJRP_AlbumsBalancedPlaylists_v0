# Plan — Feature F96: A página de entrada no celular, organizada em swipes · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
Em esboço. Via rápida (o MJRP, 2026-11-23: «tudo em fast lane.»): a construção parte do protótipo escolhido e do resumo da spec; este plano se completa no passo retroativo, com o que foi construído. A versão está escolhida (o MJRP, 2026-11-23): o corpo da versão do especialista, com a abertura da versão dele; um deslize só, o da caixa. O nome «em swipes» é histórico (ver a spec).

O que é sabido (conferido na `main` em 2026-11-23): a página de entrada é `public/splash.html`, com os textos em `public/splash/copy.js` (os rótulos dos passos já existem) e os álbuns em `public/splash/covers.js`. O protótipo (ramo `wip/f96-phone-home-prototype`, `design/proposals/f96-phone-home/`) é a página real com uma camada por cima (`build/variant.css`, `build/variant.js`, `build/strings.json`): serve de referência do desenho, não de código pronto, porque na página de verdade o texto vem escrito no HTML.

## Technical Design
A completar no passo retroativo. Já decidido:
- A abertura: sem botão grande; a caixa na diagonal é, de preferência, a caixa leve em CSS girada 30 graus, como no protótipo. A cena 3D no celular custa 152 KB a mais na primeira visita (medido em 2026-11-23, ramo `fix/f80-crate-animation-break`, `reports/evidence/F80/crate-diagonal-on-phone/`); só entra se a caixa em CSS não servir, e com a palavra do MJRP.
- Os passos: texto escrito no HTML, na ordem rótulo, título, texto, ilustração; nenhum carrossel.
- A caixa: uma fila que rola de lado feita pelo próprio navegador (os álbuns continuam no HTML e se leem sem script), com a ponta do seguinte à vista, setas e nenhum avanço automático. É a mesma peça da F95 no celular: constrói-se uma vez, aqui.
- Sem conta: «Entrar» no alto; o «Criar» da barra de baixo abre o app.

## Dependencies
F80 (a página de entrada, e a issue dela sobre a caixa na diagonal no celular); F95 (a curadoria: no celular ela é o deslize desta feature); F81 (o site em mais de uma língua), para os textos novos; F88 e F91 (o menu do alto e a barra de baixo, onde o «Criar» aparece).

## Documents Consulted
`public/splash/copy.js` (`main`, só leitura); `docs/specs/features/F80-splash-page-for-album-lovers/spec.md`; `docs/specs/features/F95-album-blender-curation-on-the-entry-page/spec.md`; S-62; S-77; `docs/wiki/harness/pdlc-loops.md` (a via rápida); no ramo `wip/f96-phone-home-prototype`: `design/proposals/f96-phone-home/proposal.md` e `reports/audits/2026-11-23-mjrpalbumblender-v0-f96-phone-home-swipe-ux-audit.md`; no ramo `fix/f80-crate-animation-break`: `reports/evidence/F80/crate-diagonal-on-phone/results.txt`.

A declarar no passo retroativo, um a um («atualizado» ou «sem mudança»): `arch.md`, `data-model.md`, `tech-stack.md`, `constitution.md`, `design-system.md`, `behavior.md`.

## Risks & Considerations
- A página não encurta: medida no protótipo, a versão escolhida tem 5,7 telas, como a de hoje. O ganho é ordem e clareza, não altura.
- Sem botão na abertura, quem não tem conta depende do «Criar» da barra de baixo: ele precisa abrir o app de fato, e isso muda o que a barra faz hoje para o visitante (hoje leva ao passo).
- O que a S-62 garante não pode quebrar: leitura sem script, «reduzir movimento», o crédito das capas reais.
- O deslize da caixa dentro de uma página que rola: o gesto de lado não pode prender a rolagem, e a borda esquerda do Safari volta a página.
- A caixa em CSS girada pode não se ler bem na página de verdade; a alternativa (3D) pesa.
- Faixas alternadas ou dois lados, se escolhidos, pedem um papel novo de cor no `design-system.md`, com a aprovação do MJRP.
