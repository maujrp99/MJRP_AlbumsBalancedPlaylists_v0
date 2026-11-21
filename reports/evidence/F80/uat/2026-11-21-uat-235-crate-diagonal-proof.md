# Prova · a caixa de discos em diagonal, inteira no quadro (UAT-235, página de entrada · F80)

**Data:** 2026-11-21 · **Ramo:** fix/f80-uat-entry-page · **Escolha do MJRP:** «escolha: 2- palco largo» (a prévia 2, «Palco largo»).

## O que mudou
- `public/splash/framing.js` (novo): a geometria da caixa e a regra da câmera, em matemática pura. A câmera fica 30° para o lado e 18° acima e se ajusta ao quadro a cada giro da caixa, de modo que todos os cantos de todas as tábuas e capas, em todas as poses da página, caiam dentro do quadro com 6% de folga.
- `public/splash/crate3d.js`: usa essa regra (câmera, poses das capas); as luzes do fogo andam com a câmera, para continuar iluminando a caixa por baixo e pela frente.
- `public/splash/splash.js`: no computador, o palco vai até a borda direita da janela (a legenda e o texto não mudam); a caixa em CSS gira para o mesmo lado, pela metade do ângulo. No celular nada muda.
- `public/splash.html`: a caixa em CSS lê o giro (`--yaw`).

## Testes
- `test/splash/framing.test.js`: escrito antes e vermelho na câmera de hoje (6 de 11), verde depois. Confere os cantos projetados em todas as poses (a abertura, cada disco puxado, a virada em 7 passos, o lado B) em quadros de 900, 1024, 1280, 1440, 1920, com o palco até a borda em 1440 e 1920, e nos extremos 0,5 e 1,3 de proporção. A câmera de hoje fica como referência do defeito (passa da borda em 900 e 1920).
- `test/splash/splash.test.js`: a caixa em CSS gira −15° no computador e não gira no celular, onde o palco também não se alarga.
- `test/splash/`: 71 de 71 verdes.

## Navegador (Chromium, WebGL por SwiftShader, capas reais `VITE_SPLASH_COVERS=real`)
- 1280 × 800, 1440 × 900, 1920 × 1080: a caixa inteira em todas as poses; o disco puxado legível; o fogo por baixo. `uat-235-<largura>-<pose>.webp`.
- Sem WebGL (`?nogl`) e com menos movimento: a caixa em CSS, girada −15°. `uat-235-1440x900-*-nogl.webp`, `*-reduce.webp`.
- 393 × 852 (celular): igual à produção, lado a lado; sem 3D, sem giro, sem rolagem lateral (largura da página 393). `uat-235-393-phone-ours-vs-production.webp`.

## O que não foi conferido
- Safari e Firefox de verdade, e uma GPU real (só Chromium com WebGL por software).
- Larguras entre 900 e 1024 só pelo teste, não por captura.
- Na primeira fração de segundo o 3D aparece com o fade de 0,8 s que já existia; não mudou.
- A caixa em CSS não tem laterais de madeira nem a luz do fogo nas capas, e na virada troca de lado em vez de girar.
