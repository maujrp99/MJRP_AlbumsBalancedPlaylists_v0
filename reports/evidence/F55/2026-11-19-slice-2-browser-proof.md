# F55 fatia 2 — prova no navegador (2026-11-19 19:12)

Código: ramo `fix/f55-identity-slice-2` com a `main` junto e o ajuste do integrador (`4ffdc33`). Testes: 1059 passando em 94 arquivos; build ok. App local com a conta do MJRP, servidor de produção.

| # | Cenário | Resultado |
|---|---|---|
| 1 | Abrir «All Series» sem limpar o guardado | contagem `albumIdentityAudit()`: 227 pedidos, 226 iguais, 1 diferente («No Quarter», registro antigo sem motivo) |
| 2 | Identificador corrigido gravado na série | «Core» em «Grunge Rock - Classics»: `appleMusicId` 300973540 → 1285806791; artista e título pedidos iguais. «Rock and Roll Over» em «Kiss Early Days»: identificador novo, ano 2026 (o da edição achada, «2026 Remaster») |
| 3 | «No Quarter» antes do ajuste | falhou com «No catalog has…»: o catálogo da Apple (loja dos EUA) não devolve esse álbum em nenhuma busca (por artista e título, só por título, 25 resultados, álbuns do artista). Ele sempre veio da busca por IA, e a resposta única da IA estava fora do segundo nível |
| 4 | «No Quarter» depois do ajuste (`compareOnlyAnswer`) | `found`: «No Quarter: Jimmy Page and Robert Plant Unledded», motivo `title-before-subtitle`; no cartão, a linha «Asked for by its short title: the catalog only has this one, with a subtitle.» (uma chamada paga à IA) |
| 5 | Contagem depois | **227 pedidos, 227 iguais, 0 diferentes, 0 sem carregar**; «No Quarter» aparece como igual com o motivo do segundo nível |

## Não visto

- Remover um álbum de uma série pela regra (só teste de unidade).
- Blend e edição de playlist numa série que tinha álbum trocado.
- Notas e popularidade do «No Quarter» com o título longo.
- No navegador do MJRP: o descarte dos álbuns trocados guardados (o navegador de teste já os tinha recarregado na fatia 1; o descarte foi visto só no registro antigo do «No Quarter» e nos testes).

## Em produção (2026-11-19 19:14)

Site `dd16b01` (pacote `main-P636MPJB.js`), depois servidor `dd16b01` (revisão `mjrp-proxy-00201-kcq`; a volta é `mjrp-proxy-00200-2nh`).

| Pedido à fonte de notas, com login | Resposta |
|---|---|
| STP - Core | `found`, página 2906, Plush 89 |
| Page & Plant - No Quarter | `found`, página 11402, Kashmir 81 |
| Page & Plant - No Quarter: Jimmy Page and Robert Plant Unledded | `found`, a mesma página 11402 |

Com isso as notas do «No Quarter» com o título longo, que faltavam ver, foram vistas.
