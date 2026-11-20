---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-221"]
planned_for: "[[ROADMAP#^REL-40]]"
---
# Feature F74: A nota de cada faixa chega à faixa certa
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Uma regra só diz quando o título de uma faixa do álbum e o título de uma faixa de uma fonte de notas são a mesma faixa. Antes a comparação apagava tudo o que estava entre parênteses: faixas originais ficavam sem nota e faixas extras levavam a nota da original.

**Por quê:** O MJRP quer as notas das faixas originais nas edições ampliadas; a média do álbum sai errada sem elas.

**Como saber que funcionou:** Em «In the Court of the Crimson King (Expanded Edition)» as cinco faixas originais têm a nota do BestEverAlbums e as três extras não; nos 12 álbuns medidos, 102 das 105 notas que as páginas têm chegam à sua faixa, e nenhuma nota fica em duas faixas.

## Problem Statement
Relato do MJRP de 2026-11-20 00:00: «precisamos melhorar o algoritmo do BEA pra que ele encontre a media das faixas … as 5 faixas do album tem notas e sao so 5 mesmo, o resto que aparece no album blender sao faixas da expanded edition, faixas extras e o que quero são o ratings das originais mesmo».

Causa lida no código: `shared/normalize.js` (`normalizeKey`) apagava todo parêntese antes de comparar títulos. O BestEverAlbums escreve «21st Century Schizoid Man Including Mirrors»; o Apple Music, «21st Century Schizoid Man (Including "Mirrors")». E «I Talk to the Wind (Duo Version)» virava «i talk to the wind».

**Alcance, dito pelo MJRP em 2026-11-20:** «não só das edicoes ampliadas, mas dos albuns que nao tiverem todas as faixas com ratings, algo aconteceu que o scrapper do algoritmo nao captura». A investigação separou o que é o leitor da página (scraper) do que é o casamento de títulos.

**Medida de partida (2026-11-20 00:02, inventário do MJRP, 209 álbuns com médias):** 84 álbuns têm nota em só parte das faixas e 13 não têm nota em nenhuma. Os piores: «High Voltage» (AC/DC) 2 de 9; «Mirage (Deluxe Edition)» 10 de 42; «In the Court of the Crimson King (Expanded Edition)» 2 de 8; «Larks' Tongues In Aspic (Expanded Edition)» 4 de 8; «Before the Frost... Until the Freeze» 10 de 20; «Substance» (New Order) 13 de 24; «Substance 1977-1980» 11 de 19; «Are You Experienced (Deluxe Version)» 11 de 18; «Who's Next (Bonus Track Version)» 10 de 16; «Live At The Apollo (1962)» 7 de 11; «Free Live!» 10 de 15; «Black Rose: A Rock Legend» 6 de 9.

**O que a investigação achou (2026-11-20, as 12 páginas lidas; `reports/evidence/F74/2026-11-20-track-identity-measure.md`).** Das 103 faixas sem nota nesses álbuns:
- 83 não têm nota na fonte: a página lista menos faixas do que a edição (faixas extras, o segundo disco). Não é defeito.
- 12 são a mesma faixa escrita de outro jeito: parênteses de um lado só, «Pt. 1» e «Part One», «Foxey Lady» e «Foxy Lady», uma palavra a mais («My Sarah» e «Sarah»).
- 7 são do «High Voltage»: a fonte tem duas páginas com esse nome, o disco australiano e o internacional, e a busca pegava a australiana.
- 1 tem outro nome na fonte (a abertura de «Live At The Apollo»).
- 0 por falha do leitor: ele lê todas as linhas que a página tem.

E 12 notas estavam em duas faixas ao mesmo tempo: a extra com a nota da original.

## Requirements
- [REQ-01] Uma faixa do álbum recebe a nota de uma faixa da fonte quando os dois títulos são a mesma faixa, mesmo que um escreva entre parênteses o que o outro escreve sem. · fixes UAT-221
- [REQ-02] Uma faixa que é outra versão (ao vivo, demo, versão de rádio, remix, tomada alternativa) não recebe a nota da faixa original quando o álbum tem a original. · fixes UAT-221
- [REQ-03] Cada nota da fonte vai para uma faixa só do álbum. · fixes UAT-221
- [REQ-04] A regra mora num lugar só, com nome, exemplo real e teste para cada exceção, e é a mesma no servidor e no app. · fixes UAT-221
- [REQ-05] Quando a fonte tem duas páginas com o nome do álbum, uma para cada edição, a página usada é a que lista as faixas do álbum. · fixes UAT-221
- [REQ-06] As notas que o navegador guarda de antes desta regra são pedidas de novo, uma vez, sem a pessoa apagar nada. · fixes UAT-221
- [REQ-07] A mesma regra casa as faixas com o Spotify (popularidade) e com o ranking da busca por IA. · fixes UAT-221

**Sobre o REQ-02, mudado pela investigação.** O esboço dizia «nunca recebe». Os dados mostram álbuns em que a faixa com a marca é a única forma da música: todas as faixas de «Live At The Apollo (1962)» trazem «(Live 1962)» e a fonte as escreve sem; «Substance» (New Order) traz «The Perfect Kiss (Substance Edit)» e a fonte escreve «Perfect Kiss». Com «nunca», o primeiro cairia de 7 faixas com nota para nenhuma. A regra ficou: a faixa com a marca só recebe a nota quando o álbum não tem a faixa sem a marca.

## Observable States
A feature não importa nenhum requisito (conserto de uma issue). Os estados de comportamento que mudam ou nascem, em `docs/specs/behavior.md`:

- `^track-ratings-right-track` (nasce): qual faixa do álbum recebe cada nota e cada popularidade.
- `^local-album-cache` (muda): as notas guardadas valem só enquanto a regra das faixas que as decidiu for a do app.

## Success Criteria
- «In the Court of the Crimson King (Expanded Edition)»: as cinco originais com nota (93, 90, 93, 82, 93), as três extras sem; «Avg Rating: 90.2 (5 of 8)».
- «High Voltage» (AC/DC): as nove faixas com nota, da página internacional.
- Nos 12 álbuns medidos: 102 das 105 notas das páginas chegam à sua faixa (antes 82 na faixa certa, 12 em duas faixas, 2 de outro disco); nenhuma nota em duas faixas.
- Um álbum com notas guardadas no navegador de antes da regra mostra as notas novas na próxima vez que é aberto, sem «Clear Cache».
- Nenhum arquivo do app ou do servidor compara títulos de faixas por conta própria (`test/architecture/trackIdentityRule.test.js`).

## Out of Scope
- A identidade do álbum (F55, F68). «Before the Frost... Until the Freeze» segue «não tem página» na fonte: a regra do álbum decidiu que «Before The Frost...» é outro lançamento.
- «Lost Someone (Live 1962)»: a fonte dá nota a duas metades, «(Part 1)» e «(Part 2)», e o álbum tem a faixa inteira. Fica sem nota (tinha a nota da segunda metade).
- As médias que o inventário guarda: mudam quando o MJRP usar «Update ratings».

## Open Questions
- «Lost Someone»: dar à faixa inteira a nota de uma das metades, a média das duas, ou nenhuma (como está)?
- «(Single Version)»: sem exemplo nos dados, a regra a trata como outra versão. Um álbum cuja fonte chame a faixa do álbum de «(Single Version)» mostraria se está certo.
