---
id: S-61
aliases: [S-61]
type: requirement
format: story
status: Done
epic: "[[prd#^EP-01]]"
points_to: ["[[info-arch#^home-empty]]", "[[info-arch#^home-typing]]", "[[info-arch#^home-searching]]", "[[info-arch#^home-discography]]", "[[info-arch#^home-dock-one]]", "[[info-arch#^home-albums-chosen]]", "[[info-arch#^home-dock-many]]", "[[info-arch#^home-dock-reorder]]", "[[info-arch#^home-dock-removed-undo]]", "[[info-arch#^home-paste-list]]", "[[info-arch#^home-paste-report]]", "[[info-arch#^home-artist-not-found]]", "[[info-arch#^home-catalog-error]]", "[[info-arch#^home-name-missing]]", "[[info-arch#^home-creating]]", "[[info-arch#^home-created]]", "[[info-arch#^home-create-failed]]", "[[info-arch#^home-guest]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# S-61 · Como quem monta uma série de álbuns, quero que a tela inicial diga com clareza o que fazer e para que serve, para que eu monte a série sem decifrar a tela.

## pt-BR

Protótipo: design/inception/home-transformar-v2.html («Transformar · v2», aprovado pelo MJRP em 2026-11-20, por volta das 22:15; registro em `info-arch.md` § Protótipos aprovados) · ux-audit: passa (2026-11-20 19:47, `reports/audits/2026-11-20-F79-home-r2-ux-audit.md`)
Regras: R1 a tela diz o que é uma série e o que fazer antes de qualquer controle · R2 um campo só acha os álbuns, por artista ou por lista colada, e cada espera e cada falha diz o que ainda vale · R3 a série sendo montada fica sempre à vista, com a ação que conclui · R4 mudar a ordem e tirar um álbum não pede arrastar, e tirar se desfaz · R5 o nome é sugerido, nunca imposto em silêncio · R6 criar diz o que está acontecendo, onde a série ficou e o que vem depois · R7 quem não entrou sabe onde a série fica guardada
AC (computador a 1280 px e celular a 393 px; no celular a base da série é a barra de ação):
- Given a Home aberta pela primeira vez, When ela aparece, Then o título «Pick the albums. We blend the playlists.», a frase do que é uma série, o campo «An artist, or paste a list of albums» com «Search» (o único botão com o fogo), os três passos e a base vazia «Your series is empty» com «Create series» apagado e «Add one album to create the series»  (R1 · ^home-empty)
- Given o campo com o foco e um artista pela metade, When a pessoa digita, Then a ajuda diz «Press Enter or Search to see their albums. A list with one album per line works too.»  (R2 · ^home-typing)
- Given um artista no campo, When a pessoa busca, Then o botão diz «Searching…» e fica ocupado, a tela diz «Looking for «artista» in the catalog… the covers appear as soon as it answers.» e o equalizador se mexe (parado com movimento reduzido)  (R2 · ^home-searching)
- Given o catálogo respondeu, When as capas aparecem, Then o artista grande, «N studio albums · newest first», as fichas de tipo com a contagem (Studio, EPs, Singles, Live, Compendiums, Other), «Add all N studio albums» e a grade, cada capa com «+»  (R2 · ^home-discography)
- Given o artista não existe no catálogo, When a busca termina, Then «No albums found for «texto».», a saída «Check the spelling, or paste the albums as a list: one per line, Artist - Album.» e «Paste a list»  (R2 · ^home-artist-not-found)
- Given o catálogo não respondeu no prazo, When a busca falha, Then «The catalog did not answer in 15 seconds.», o que ainda vale («Your series still has its N albums. Try again in a moment.») e «Try again», que busca o mesmo texto; o equalizador cai  (R2 · ^home-catalog-error)
- Given uma lista colada no campo, When as linhas aparecem, Then cada linha diz «ready» ou o motivo, o rodapé diz «N lines: N ready, N to fix. Lines to fix are skipped; the rest go in.» e «Add N albums» está inteiro à vista  (R2 · ^home-paste-list)
- Given a lista foi adicionada com uma linha que não entrou, When o resultado aparece, Then «Added N albums. 1 line was skipped and is still here to fix.», a linha pulada vira um campo com o motivo e «Add this line» manda o que estiver nele  (R2 · ^home-paste-report)
- Given a discografia na tela, When a pessoa clica numa capa, Then a capa ganha o anel e o número da ordem, a base mostra a capa numerada, o nome sugerido como texto («Pink Floyd selection», «suggested · edit it»), «1 album from 1 artist · the order counts» e «Create series» ativo  (R3 · ^home-dock-one)
- Given vários álbuns escolhidos, When a pessoa olha a base, Then as capas numeradas, a contagem com «the order counts», «Edit order», «Create series» com o fogo e «Next: the Blend turns the series into playlists.»  (R3 · ^home-albums-chosen)
- Given muitos álbuns (13, por «Add all»), When a base se desenha, Then sete capas e «+6» (no celular, uma capa com a contagem), e a faixa «Added 13 albums. Undo» por 8 segundos  (R3, R4 · ^home-dock-many)
- Given a série com álbuns, When a pessoa abre «Edit order» (no celular, toca na base), Then um painel (no celular, a folha inteira) com «Your series · N albums», a frase da ordem e uma linha por álbum com ↑ ↓ ✕ de 44 px; ↑ do primeiro e ↓ do último apagados; a linha movida fica marcada  (R4 · ^home-dock-reorder)
- Given um álbum na série, When a pessoa o tira (✕, ou clica de novo na capa escolhida), Then os números se refazem e a faixa «Removed «título». Undo» fica 8 segundos; «Undo» o põe de volta no mesmo lugar  (R4 · ^home-dock-removed-undo)
- Given o nome apagado, When a pessoa clica «Create series», Then nada é criado: «Give the series a name first.» e «Use «nome sugerido»», com o cursor no nome; nunca «New Album Series» em silêncio  (R5 · ^home-name-missing)
- Given a série com nome, When a pessoa clica «Create series», Then o botão diz «Creating…», ocupado, e a base diz «Saving your series…» com o equalizador pequeno  (R6 · ^home-creating)
- Given a série gravada, When a gravação termina, Then a base diz ««nome» is saved» e onde ela fica, com «Blend it now» (abre o Blend com a série escolhida) e «Open the series»; as capas perdem os números e um clique numa capa começa outra série sem mudar a gravada  (R6 · ^home-created)
- Given a gravação falhou, When a resposta chega, Then a base diz que a série não foi gravada e que os álbuns continuam ali, e o botão vira «Try again»  (R6 · ^home-create-failed)
- Given quem não entrou com uma conta, When a Home aparece, Then a linha «You're not signed in: the series is saved to this browser only. Sign in to keep it on every device.» (na base no computador, sob o campo no celular), com «Sign in»  (R7 · ^home-guest)
Fora desta story: arrastar para mudar a ordem (↑ ↓ basta, decidido na rodada 2); a página de entrada para quem não entrou (F80); a janela de edição de série, que usa a mesma peça de escolher álbuns e só não pode quebrar.
Origem: o MJRP, em 2026-11-20, com uma captura da Home: «vamos utilizar as skills de UI e UX e de writing copy para melhorar essa seção inicial do site pra carregar e gerar as series de albums que poderão ser utilizadas no blender pra gerar playlist. Gostaria de ver uma proposta consolidar, elevar, transformar, considerando copy, elementos de UI e UX e usabilidade.»
A tela de hoje usa nomes de código («01 // SERIES CONFIGURATION», «Initialize Load Sequence», «Stack Empty») e não diz o que é uma série nem o que acontece depois.

## en

**As someone building a series of albums, I want the home screen to say clearly what to do and what it is for, so that I build the series without decoding the screen.**

Prototype: design/inception/home-transformar-v2.html, approved by the MJRP on 2026-11-20 (around 22:15). Rules: R1 the screen says what a series is and what to do before any control · R2 one field finds the albums, by artist or by a pasted list, and every wait and failure says what still holds · R3 the series being built stays in view with the action that completes it · R4 reordering and removing need no dragging, and a removal can be undone · R5 the name is suggested, never imposed silently · R6 creating says what is happening, where the series went and what comes next · R7 a visitor without an account knows where the series is kept. Each acceptance criterion above points to the judged state of `info-arch.md` § A Home (F79) → Estados.

Origin: the MJRP's request of 2026-11-20.
