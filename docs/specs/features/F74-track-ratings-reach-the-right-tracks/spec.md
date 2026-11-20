---
status: Draft
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-221"]
planned_for: "[[ROADMAP#^REL-40]]"
---
# Feature F74: A nota de cada faixa chega à faixa certa
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Uma regra só diz quando o título de uma faixa do álbum e o título de uma faixa de uma fonte de notas são a mesma faixa. Hoje a comparação apaga tudo o que está entre parênteses: faixas originais ficam sem nota e faixas extras levam a nota da original.

**Por quê:** O MJRP quer as notas das faixas originais nas edições ampliadas; a média do álbum sai errada sem elas.

**Como saber que funcionou:** Em «In the Court of the Crimson King (Expanded Edition)» as cinco faixas originais têm a nota do BestEverAlbums e as três extras não; a contagem de faixas com nota nos álbuns do MJRP sobe e nenhuma faixa extra ganha nota de original.

## Problem Statement
Relato do MJRP de 2026-11-20 00:00: «precisamos melhorar o algoritmo do BEA pra que ele encontre a media das faixas … as 5 faixas do album tem notas e sao so 5 mesmo, o resto que aparece no album blender sao faixas da expanded edition, faixas extras e o que quero são o ratings das originais mesmo».

Causa lida no código: `shared/normalize.js` (`normalizeKey`) apaga todo parêntese antes de comparar títulos. O BestEverAlbums escreve «21st Century Schizoid Man Including Mirrors»; o Apple Music, «21st Century Schizoid Man (Including "Mirrors")». E «I Talk to the Wind (Duo Version)» vira «i talk to the wind».

## Requirements
- [REQ-01] Uma faixa do álbum recebe a nota de uma faixa da fonte quando os dois títulos são a mesma faixa, mesmo que um escreva entre parênteses o que o outro escreve sem. · fixes UAT-221
- [REQ-02] Uma faixa que é outra versão (ao vivo, demo, versão de rádio, remix, tomada alternativa) não recebe a nota da faixa original. · fixes UAT-221
- [REQ-03] Cada nota da fonte vai para uma faixa só do álbum. · fixes UAT-221
- [REQ-04] A regra mora num lugar só, com nome, exemplo real e teste para cada exceção, e é a mesma no servidor e no app. · fixes UAT-221

## Observable States
A escrever com o conserto.

## Success Criteria
A escrever com o conserto: medida antes e depois nos álbuns das séries do MJRP.

## Out of Scope
A identidade do álbum (F55, F68).

## Open Questions
- A regra vale também para casar faixas com o Spotify (popularidade)? A ver na leitura do código.
