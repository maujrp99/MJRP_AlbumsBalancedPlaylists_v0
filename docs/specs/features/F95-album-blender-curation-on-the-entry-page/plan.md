# Plan — Feature F95: Os álbuns da página de entrada como curadoria do The Album Blender · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
Em esboço. Via rápida (o MJRP, 2026-11-23: «tudo em fast lane.»): a construção parte do protótipo e do resumo da spec; este plano se completa no passo retroativo. O nome está escolhido («Na caixa do The Album Blender») e o celular é da F96: o deslize da caixa se constrói lá, uma vez. Aqui fica o computador (o selo ou rótulo junto da caixa), as datas ou notas se o MJRP as quiser, e a ligação com o CMS.

O que é sabido (conferido na `main` em 2026-11-23): os álbuns da página de entrada vêm de um arquivo de dados fixo (`public/splash/covers.js`), com um conjunto fictício e um real escolhido no build; a escolha dos álbuns pelo CMS está registrada na F82 (REQ-03 e REQ-11). No protótipo, o selo usa o lugar que a página já tem para o rótulo dos álbuns fictícios, no canto da caixa; os dois nunca aparecem juntos.

## Technical Design
A completar no passo retroativo. Depende das respostas abertas: a forma no computador (só o selo, ou também a faixa), datas ou notas, e se a troca dos álbuns nasce no código ou espera o CMS.

## Dependencies
F80 (a página de entrada, onde a indicação aparece); F96 (o celular: o deslize da caixa); F82 REQ-03 e REQ-11 (a escolha dos álbuns no CMS), se a resposta for esperar o CMS; F81 (o site em mais de uma língua), para o texto do nome.

## Documents Consulted
`public/splash/covers.js` e `public/splash.html` (`main`, só leitura); `docs/specs/features/F80-splash-page-for-album-lovers/spec.md`; `docs/specs/features/F82-admin-with-the-cms-kit/spec.md` (REQ-03, REQ-11); `docs/specs/features/F96-entry-page-in-swipes-on-the-phone/spec.md`; S-62; `docs/wiki/harness/pdlc-loops.md` (a via rápida); no ramo `wip/f95-blender-curation-prototype`: `design/proposals/f95-blender-curation/proposal.md`.

A declarar no passo retroativo, um a um («atualizado» ou «sem mudança»): `arch.md`, `data-model.md`, `tech-stack.md`, `constitution.md`, `design-system.md`, `behavior.md`.

## Risks & Considerations
- Um nome com prazo («da semana») é uma promessa: o nome escolhido não promete; uma data na caixa («desde tal dia») volta a prometer, e envelhece mal se ninguém troca.
- O que a S-62 garante não pode quebrar: leitura sem script, «reduzir movimento», o crédito das capas reais.
- O padrão do build são as capas fictícias; a indicação só faz sentido com álbuns reais (S-62: capa real só com a palavra do MJRP).
- Duas features mexem na mesma caixa (esta e a F96): quem constrói primeiro define a peça, e a outra a reaproveita.
