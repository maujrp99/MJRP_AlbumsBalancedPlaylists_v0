# F52 fatias 3 e 4 — prova no servidor local e no navegador (2026-11-19 19:36)

Código: ramo `fix/f52-slices-3-4` com a `main` junto e o conserto do integrador. Testes: 1217 passando em 107 arquivos; build ok.

## Servidor local (sem login, sem chave de IA)

| # | Cenário | Resultado |
|---|---|---|
| 1 | Dois pedidos iguais ao mesmo tempo (Pink Floyd «Animals») | os dois `found` em 1,9 s; no registro, um `how: source` com 3 pedidos à fonte e um `how: joined` com 0 |
| 2 | Álbum inventado | `not_found` em 0,9 s, 4 pedidos à fonte |
| 3 | Pedido inválido | 400 `invalid_request`; registro com `how: none` |

## Defeito achado na prova, em produção desde a F55 fatia 1

Com o app local e o servidor de produção, a série «Grunge Rock - Classics» carregou em 5,1 s, mas «Nirvana - Nevermind» veio com a nota como «não tem» (0 de 13 faixas). A fonte escreve o artista com uma nota própria no fim: «Nevermind by Nirvana (US)». A regra de identidade comparava «Nirvana (US)» com «Nirvana» e recusava. Conserto na regra (`artistNamesFromLabel`: o rótulo da fonte é lido com e sem a nota) e no caminho da página do artista. Depois do conserto, no servidor local:

| Pedido | Resposta |
|---|---|
| Nirvana - Nevermind | `found`, página 187, In Bloom 89 |
| Pearl Jam - Ten | `found`, página 198 |
| Genesis - Selling England by the Pound | `found`, página 935 |
| Kiss - Rock And Roll Over (2026 Remaster) | `found`, página 6187 |
| T. Rex - Electric Warrior (2007 Remaster) | `found`, página 1171 |

## Não visto

- A fonte respondendo 429 ou 503 de verdade; a carga segurada por «fonte ocupada».
- A confiança de 24 horas e de 7 dias passando no relógio (só em teste de unidade).
- O servidor de produção com mais de uma instância: a fila educada vale por instância e o serviço permite até 20. Fixar uma instância é configuração do serviço e fica para o MJRP.
