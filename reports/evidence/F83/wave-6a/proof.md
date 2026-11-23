# F83 onda 6a: a prova no navegador da tela do inventário

Sites CONSTRUÍDOS, a tela em React (esta ponta) contra a tela à mão do pai (`12f0234`, construído num worktree à parte). Roteiro: `browser-proof.mjs` (Playwright emprestado de `MJRPpersonal`; dois servidores estáticos com o fallback para `app.html`). Firebase bloqueado (`identitytoolkit`, `securetoken`, `firestore.googleapis`, `firebaseinstallations`). Resultados: `raw/results-*.json`; as figuras de diferença que sobraram: `diffs/`.

**Como os itens entram no site construído (a costura):** o site construído não expõe a loja do inventário. O roteiro responde o pedido do script principal com o mesmo texto e uma linha no fim (`window.__inv = <a loja>`), a mesma nos dois sites, e escreve 60 itens na loja, como o serviço faria depois da leitura. Os valores do Discogs não entram (o servidor não é tocado); os estados com valores são provados pelo dourado (45 cenários), não aqui.

| Passada | Estados | Iguais |
|---|---|---|
| Chromium 1280 | grade, lista, busca digitada, formato Vinyl, ordem Z-A, um contador, janela do álbum (à mão) | 31 de 35 (as 4 sobras abaixo) |
| Chromium 1280, antiga contra antiga (ruído) | os mesmos | 34 de 35 (a busca digitada) |
| Chromium 900 | os mesmos | 33 de 35 |
| Chromium 899 (celular, com o perfil de iPhone) | 11 estados do celular | 55 de 55 |
| Chromium 393 | os 11 estados do celular | 55 de 55 |
| WebKit 1280 | os 7 do computador | 34 de 35 |
| WebKit iPhone 14 (393x852) | lista, galeria, as seis folhas com toques de verdade e cada escolha, «Show 50 more», busca sem resultado e limpar | 55 de 55 |
| WebKit iPhone SE (375x667) | os mesmos | 55 de 55 |
| WebKit iPhone 14, antiga contra antiga | os mesmos | 55 de 55 |

Cada estado compara: a figura (pixel a pixel), o texto visível, as caixas das peças principais e a altura da página, o foco e a rolagem, e a falta de erro na página. **No celular, nos dois motores, tudo igual: 0 pixels, mesmo texto, mesmas caixas, mesmo foco.** No WebKit sobre o site construído as seis folhas abrem e escolhem como na antiga (o defeito da lição 10, da ordem da ref, não apareceu).

## O que sobrou, dito com todas as letras

- **A busca digitada, no computador (Chromium e WebKit): 944 a 1.092 pixels, até 77 de 255, no canto de baixo à direita da primeira tela.** Aparece também de antiga contra antiga (1.092 pixels): é o cursor piscando dentro do campo no instante da foto. Texto, caixas e foco são iguais.
- **A lista, no computador (Chromium 1280: 62 pixels, até 77; Chromium 900: 29 pixels, até 56): manchas pequenas dentro de uma linha** (a caixa de diferença, em 1280: x 434–673, y 514–817; em 900: x 630–633, y 687–697). **Não achei a causa**: a antiga contra a antiga deu 0 pixels no mesmo estado, o texto, as caixas e a altura são iguais, e o WebKit deu 0. Não é diferença que eu possa chamar de ruído; é abaixo de uma centena de pixels, só no Chromium, só depois de trocar para a lista, sem mudança de caixa nem de texto. Fica registrado como não explicado; as figuras: `diffs/chromium-1280-the_list.png` e `diffs/chromium-900-the_list.png`.
- **Formato Vinyl e ordem Z-A, no Chromium 1280: 8 pixels, até 1 de 255**, em x 329–333, y 298–338 (a borda de um total): uma diferença de arredondamento de 1 nível, sem importância.

## O que não deu para provar

- O que o servidor do Discogs devolve (a chave é do servidor): a prova usa a loja do inventário sem valores. Cada origem de valor, o câmbio, a rodada de «Update values» e as notas estão no dourado, com o serviço de valores de mentira.
- O MusicKit de verdade, a popularidade de uma conta Spotify conectada, e a leitura do Firestore (bloqueado): a janela do álbum e a de editar são as à mão, abertas pela mesma porta; a janela aberta pela capa deu 0 pixels.
- A largura 820 (celular desde a F88) foi provada pelas passadas de 899 e 393; não há passada própria a 820.

## Acrescentado depois da junta independente: «mostrar mais 50» com os valores ligados

A prova acima usa itens sem valores do Discogs (o servidor não era tocado), e por isso não via o aviso do Discogs sob a lista nem o salto de página que ele causava no Chromium do celular. O estado «valores ligados + Mostrar mais 50» entrou na prova (a rolagem antes e depois, contra o pai, lista e galeria, Chromium 393 / 820 / 899 e WebKit iPhone 14, com um controle que falha sem a correção) em `fix-show-more/proof.md`.

