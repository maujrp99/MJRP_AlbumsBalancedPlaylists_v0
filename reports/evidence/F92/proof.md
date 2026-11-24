# F92 · «Deep cuts», «As menos ouvidas» e o controle de pulo — a prova

Ramo `claude/f92-deep-cuts-and-least-played` · 2026-11-24 · TASK-07, TASK-02, TASK-10 (REQ-04, REQ-05, REQ-06 parte do motor, REQ-10).

## Testes
- Novos: `test/shared/content/recipeDefinition.test.js` (vocabulário e limites: pegar 11 recusado; pular 10 + pegar 6 recusado; bloco desconhecido recusado), `test/algorithms/blockRecipes.test.js` (as duas receitas na amostra fixa, faixa sem dado nunca conta, desempate pela ordem no álbum, pulo 3 + X preso nos limites, determinismo, exclusão por duração, o id da receita e o pulo guardados na playlist, equivalência), casos novos em `test/models/recipeIngredients.test.js` e `test/ui/recipe/Ingredients.test.tsx` (o controle).
- Antes do código: vermelhos (módulos inexistentes, 9 falhas nos testes da tela).
- Suíte inteira: verde (ver o log da sessão); `npm run lint` (typecheck + eslint): 0 erros.

## Equivalência das três «Top N» (REQ-05)
Cada «Top N» de hoje e a sua forma em blocos dão as mesmas faixas na amostra fixa (3 álbuns, todas as faixas com dado, sem empate), para N = 1, 3, 5: 9 casos, iguais.
As «Top N» seguem com o comportamento de hoje (nada mudou nelas). Diferenças que a regra dos blocos causaria, **listadas para o MJRP** antes de qualquer mudança:
1. **Faixa sem popularidade:** «Top N por popularidade» pega uma faixa sem dado quando o álbum tem poucas com dado (vai no fim); a forma em blocos nunca pega.
2. **Empate de popularidade:** «Top N por popularidade» desempata pela nota do BestEverAlbums; os blocos, pela ordem da faixa no álbum.

Corpus dourado (`test/fixtures/golden-core`, regravado): 784 casos novos (as duas receitas), 0 sumidos; 163 mudados = a lista do registro + 162 casos de embaralhar, todos com as mesmas faixas, só a ordem (a semente de cada caso andou porque há casos novos antes deles). Nenhum caso sem embaralhar mudou.

## Navegador (Playwright, site construído)
`browser-proof.mjs`, Chromium 1440 e 393, WebKit 1440: 14 de 14 em cada. Os seis cartões (os dois novos por último), o controle de «Deep cuts» de 3 a 10 começando em 3, a seta move para 5 e para em 10, o foco fica no controle, «As menos ouvidas» sem controle, sem Top nº e sem embaralhar. Endereços da Apple, do Spotify, os esquemas `music:`/`itms:`/`spotify:` e o Firebase de produção abortados; nenhum link para fora pressionado. Figuras em `figures/`, resultados em `raw/`.

## O que não foi provado
- Uma mistura gerada no navegador com álbuns de verdade (os álbuns vêm da Apple, bloqueada): as faixas escolhidas estão provadas nos testes do motor.
- Os textos em português no navegador (o site abre em inglês): provados pelo teste de dicionários.
