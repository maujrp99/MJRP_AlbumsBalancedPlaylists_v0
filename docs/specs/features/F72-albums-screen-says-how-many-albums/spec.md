---
status: Accepted
lane: fast
solution_type: feature
imports: ["[[S-55-see-how-many-albums-the-albums-screen-holds]]"]
planned_for: "[[ROADMAP#^REL-40]]"
accepted_in: "log 2026-11-24 10:30"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: feature`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F72: A tela de séries diz quantos álbuns e quantas séries ela mostra
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** O cabeçalho da tela de séries de álbuns passa a dizer quantas séries e quantos álbuns ela reúne; com um filtro ou uma busca ligados, diz quantos passam e de quantos.

**Por quê:** O MJRP quer saber o tamanho do que tem na tela sem contar série por série.

**Como saber que funcionou:** Com todas as séries, o cabeçalho mostra o total de séries e de álbuns; ao filtrar, o número acompanha; numa série só, mostra os álbuns dela.

## Problem Statement
O MJRP, em 2026-11-20: «outra melhoria conseguimos colocar quantos albums estao na página de albuns series?».

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here. -->
- [REQ-01] O cabeçalho da tela de séries de álbuns diz quantas séries e quantos álbuns ela reúne; com filtro ou busca, quantas séries passam, de quantas, e os álbuns delas; com uma série só, os álbuns dela. · traces [[S-55-see-how-many-albums-the-albums-screen-holds]] · a linha do cabeçalho foi substituída pelo REQ-03 em 2026-11-20 00:55 (decisão do MJRP); a contagem de uma série só não ficou (UAT-248)
  verified_by:: `test/models/seriesCounts.test.js`, `reports/evidence/F72/2026-11-20-albums-count-proof.md`
- [REQ-02] A caixa da paginação aparece também acima da lista de séries, com a mesma contagem, o tamanho da página, a forma e os números de página; o que uma muda, as duas mostram. «Load N more» e o aviso de álbuns não conferidos ficam só na de baixo. · fixes S-55
  verified_by:: `test/components/ui/Pager.test.js`, `reports/evidence/F72/2026-11-20-albums-count-proof.md`
- [REQ-03] A contagem de álbuns é a das séries que estão na tela (a página, ou o que o scroll já carregou), fica na linha da paginação («Showing 1–20 of 48 series · 97 albums») e muda quando a página muda ou o scroll carrega mais. A linha sob o título, da primeira versão, sai. · fixes S-55
  verified_by:: `test/models/seriesCounts.test.js`, `test/components/series/SeriesHeader.counts.test.js`, `reports/evidence/F72/2026-11-20-albums-count-proof.md`

## Observable States
`docs/specs/behavior.md` `^library-counts`.

**Prototype**: none — MJRP, 2026-11-20 00:09: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
- Com todas as séries: «47 series · 227 albums» (os números da conta do MJRP em 2026-11-20).
- Com a busca «floyd»: «2 of 47 series · 4 albums».
- Com uma série escolhida: «5 albums».

## Out of Scope
- Contar álbuns distintos (o mesmo álbum pedido em duas séries conta duas vezes: é a contagem do que a tela mostra).
- Contar só os álbuns já carregados.

## Open Questions
- O número é o dos álbuns pedidos nas séries que passam pelos filtros, em todas as páginas, não o dos distintos (199 na conta do MJRP). Decidido pelo agente, revisável: se o MJRP preferir os distintos, a regra de identidade já sabe juntá-los.
