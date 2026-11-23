# Plan — Feature F95: Os álbuns da página de entrada como curadoria do The Album Blender · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
Em esboço. Começa por uma rodada de protótipo com o MJRP, antes de qualquer decisão técnica. O que é sabido (conferido na `main` em 2026-11-23): os álbuns da página de entrada vêm de um arquivo de dados fixo (`public/splash/covers.js`), com um conjunto fictício e um real escolhido no build; a escolha dos álbuns pelo CMS está registrada na F82 (REQ-03 e REQ-11).

## Technical Design
A escrever depois do protótipo aprovado. Depende das respostas: o nome, o rótulo e o lugar, quem troca e com que frequência, e se a indicação nasce no código ou espera o CMS.

## Dependencies
F80 (a página de entrada, onde a indicação aparece); F82 REQ-03 e REQ-11 (a escolha dos álbuns no CMS), se a resposta for esperar o CMS; F81 (o site em mais de uma língua), para o texto do rótulo.

## Documents Consulted
`public/splash/covers.js` e `public/splash.html` (`main`, só leitura); `docs/specs/features/F80-splash-page-for-album-lovers/spec.md`; `docs/specs/features/F82-admin-with-the-cms-kit/spec.md` (REQ-03, REQ-11); S-62.

## Risks & Considerations
- Um nome com prazo («da semana») é uma promessa: se os álbuns não mudam no prazo, a página mente.
- O que a S-62 garante não pode quebrar: leitura sem script, «reduzir movimento», o crédito das capas reais.
- O padrão do build são as capas fictícias; a indicação só faz sentido com álbuns reais (S-62: capa real só com a palavra do MJRP).
