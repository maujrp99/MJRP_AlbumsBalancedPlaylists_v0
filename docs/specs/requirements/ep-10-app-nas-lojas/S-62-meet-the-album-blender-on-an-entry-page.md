---
id: S-62
aliases: [S-62]
type: requirement
format: story
status: Done
epic: "[[prd#^EP-10]]"
points_to: ["[[info-arch#^splash-v2-hero]]", "[[info-arch#^splash-v2-track]]", "[[info-arch#^splash-v2-flip]]", "[[info-arch#^splash-v2-side-b]]", "[[info-arch#^splash-v2-css-crate]]", "[[info-arch#^splash-v2-reduced-motion]]", "[[info-arch#^splash-v2-motion-rest]]", "[[info-arch#^splash-v2-no-js]]", "[[info-arch#^splash-v2-phone]]", "[[behavior#^entry-root-signed-out]]", "[[behavior#^entry-root-signed-in]]", "[[behavior#^entry-app-addresses]]", "[[behavior#^entry-sign-in-link]]", "[[behavior#^entry-machine-reading]]", "[[behavior#^entry-covers-switch]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# S-62 · Como quem chega ao Album Blender pela primeira vez, quero uma página de entrada que mostre o que ele é e me dê vontade de ouvir álbuns inteiros, para que eu entenda o produto antes de entrar.

## pt-BR

Origem: o MJRP, em 2026-11-20: «Tb gostaria de prototipo de uma home splash page para o site, com design moderno imersivo com animações, 3d...tudo relacionado a paixao por ouvir e apreciar ALBUNS completos de musica.»
Hoje o site abre direto no app; não há página pública. É também a primeira página que um buscador ou um assistente de IA leria (candidato de GEO e AEO).

Protótipo: `design/inception/splash-crate-v2.html` (Caixote v2, fogo brando), aprovado pelo MJRP em 2026-11-20 22:15 («aprovado a home v2, fogo vivo na página de entrada, ficou sensacional! bora implementar», corrigido por «fogo brando na verdade») · ux-audit: passa, sem P0 (`reports/audits/2026-11-20-mjrpalbumblender-v0-f80-splash-round2-ux-audit.md`).
Pronto para construir pela aprovação do protótipo e pelo «bora implementar» do MJRP; os critérios abaixo foram escritos pelo agente — revisável (dispensa de 2026-11-19). Os estados sem tela (a raiz, o interruptor das capas) estão no `behavior.md`, escritos pelo agente — revisáveis.

Regras: R1 a primeira tela diz o que o produto é, com o nome, antes de qualquer imagem · R2 a página é a do protótipo aprovado, no fogo brando · R3 quem entrou com conta nunca vê a página e nenhum endereço do app muda · R4 as chamadas levam ao app · R5 movimento só onde cabe: nada se move com «reduzir movimento», o automático para sozinho, sem WebGL fica o caixote parado · R6 sem script a página se lê inteira · R7 capa real só com a palavra do MJRP: o padrão é o fictício, cada conjunto com o seu crédito.

AC:
- Given um visitante sem conta, When abre a raiz do site a 1280 px, Then vê o sobretítulo, o título «Dig through the albums you love. Keep every track.», a frase «The Album Blender is a web app for people who listen to whole albums.», «Open the app» e «Sign in», o caixote à direita e o fio com o primeiro grupo aceso (R1, R2 · ^splash-v2-hero, ^entry-root-signed-out)
- Given a página aberta, When a pessoa rola até «Series», «Ranking», «Blend» ou «Your shelf», Then o disco da faixa sobe do caixote, a legenda troca para ele e o fio acende até a faixa (R2 · ^splash-v2-track)
- Given a página no fim do lado A, When a pessoa rola por «Flip the record», Then o caixote gira para o lado B, sem sequestrar a rolagem (R2 · ^splash-v2-flip)
- Given o lado B, When a pessoa chega ao convite, Then vê «Drop the needle on your first series.» com «Open the app» e «Sign in», e o fogo forte de novo (R2, R4 · ^splash-v2-side-b)
- Given quem entrou com conta Google ou Apple, When abre a raiz, Then chega a `/home` sem que nenhum pedaço da página seja pintado (R3 · ^entry-root-signed-in)
- Given qualquer endereço do app (`/home`, `/albums/<id>`, `/inventory`, `/callback`), When é aberto direto, Then abre o app como antes (R3 · ^entry-app-addresses)
- Given a página, When a pessoa toca «Open the app», Then chega à Home do app; When toca «Sign in», Then chega ao app com a janela de entrar aberta (R4 · ^entry-sign-in-link)
- Given um computador sem WebGL, ou o celular, ou antes de o 3D desenhar, When a página abre, Then o caixote é o caixote em CSS com as mesmas capas, a da faixa erguida (R5 · ^splash-v2-css-crate)
- Given o sistema pedindo menos movimento, When a página abre, Then nada se move, o 3D não é baixado e não há «Pause motion» (R5 · ^splash-v2-reduced-motion)
- Given a página com movimento, When passam dez segundos sem rolagem, Then o fogo e o equalizador param; When a pessoa toca «Pause motion», Then tudo para e o botão diz «Play motion» (R5 · ^splash-v2-motion-rest)
- Given um navegador sem JavaScript, When abre a raiz, Then lê todo o texto e as chamadas, e o caixote parado mostra as capas do lado A (R6 · ^splash-v2-no-js)
- Given um buscador ou um assistente, When lê o HTML da raiz sem rodar script, Then encontra o título, a descrição, a frase que define o produto e os dados estruturados (R1, R6 · ^entry-machine-reading)
- Given o celular a 393 px, When a pessoa rola a página, Then lê uma coluna, cada faixa com o seu disco e o crédito dele, e a barra de baixo com o fio e «Open the app» (R2 · ^splash-v2-phone)
- Given o build sem `VITE_SPLASH_COVERS=real`, When a página é gerada, Then as capas são as fictícias, com «Fictional album · original art» e sem link do Apple Music; com `real`, as do protótipo, com crédito, link e a linha de marcas da Apple (R7 · ^entry-covers-switch)
Fora desta story: publicar com as capas reais (decisão do MJRP); página de privacidade; medição de uso na página.

## en

**As someone arriving at the Album Blender for the first time, I want an entry page that shows what it is and makes me want to listen to whole albums, so that I understand the product before signing in.**

Origin: the MJRP's request of 2026-11-20. Prototype: `design/inception/splash-crate-v2.html` (Crate v2, soft fire), approved by the MJRP on 2026-11-20 22:15. The page lives at the site's root for whoever has not signed in with an account; a signed-in person goes straight to the app; every address of the app keeps working; the page reads whole without script; the covers come from one data file with a fictional set (default) and the real set, chosen at build time.
