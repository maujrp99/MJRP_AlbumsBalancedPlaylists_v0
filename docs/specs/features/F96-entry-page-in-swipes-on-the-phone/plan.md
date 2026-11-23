# Plan — Feature F96: A página de entrada no celular, organizada em swipes · Spec: [[spec]]
**Approved**: pendente

## Architecture Approach
Em esboço. Começa por uma rodada de protótipo com o MJRP, antes de qualquer decisão técnica. O que é sabido (conferido na `main` em 2026-11-23): a página de entrada é `public/splash.html`, com os textos em `public/splash/copy.js` (os rótulos dos passos já existem) e os álbuns em `public/splash/covers.js`.

## Technical Design
A escrever depois do protótipo aprovado. Depende das respostas: como se descobre o swipe, o botão «Criar», a caixa na diagonal no celular, o que o computador mantém, e a forma sem script.

## Dependencies
F80 (a página de entrada, e a issue dela que investiga a caixa na diagonal no celular); F95 (a curadoria, que vira o segundo swipe); F81 (o site em mais de uma língua), para os rótulos; F88 e F91 (o menu do alto, onde o «Criar» já aparece).

## Documents Consulted
`public/splash/copy.js` (`main`, só leitura); `docs/specs/features/F80-splash-page-for-album-lovers/spec.md`; `docs/specs/features/F95-album-blender-curation-on-the-entry-page/spec.md`; S-62; S-77.

## Risks & Considerations
- Um swipe que ninguém descobre esconde o conteúdo: quatro dos cinco passos ficam fora da tela.
- O que a S-62 garante não pode quebrar: leitura sem script, «reduzir movimento», o crédito das capas reais.
- Dois swipes, um abaixo do outro, mais a rolagem vertical: o gesto de um não pode prender o outro.
- A caixa na diagonal pesa no celular (em investigação na F80); o cabeçalho depende desse resultado.
