# F55 fatia 1 — prova no navegador e no servidor local (2026-11-19 18:16)

Código: ramo `fix/f55-one-album-identity-rule` com a `main` junto (`c44092a`). Testes: 919 passando em 86 arquivos; build ok. App local com a conta do MJRP, servidor de produção para o resto.

## Contagem antes (álbuns guardados, carregados pela regra antiga)

`await albumIdentityAudit()` na tela «All Series»: 47 séries, 227 álbuns pedidos, 218 iguais, **9 diferentes** (8 álbuns; uma série repetida), nenhum sem carregar.

| Série | Pedido | Mostrado |
|---|---|---|
| Grunge Rock - Classics | Stone Temple Pilots - Core | Shangri-La Dee Da |
| Kiss Early Days | Kiss - Rock and Roll Over | The Very Best of Kiss |
| Dire Straits Vol.1 (duas séries) | Dire Straits - Dire Straits (Remastered) | Sultans of Swing: The Very Best of Dire Straits |
| Live Classics | Thin Lizzy - Live and Dangerous (Deluxe Edition) | Jailbreak (Deluxe Edition) |
| Robert Plant 00-10s | Robert Plant & Jimmy Page - Walking Into Clarksdale | Robert Plant & Alison Krauss - Raising Sand |
| Robert Plant 00-10s | Jimmy Page & Robert Plant - No Quarter | No Quarter: Jimmy Page & Robert Plant Unledded |
| A&B and Solarstone | Above & Beyond - Group Therapy | Group Therapy 697 (DJ Mix) |
| Series 3 | T. Rex - Electric Warrior | Tommy T-rex - Heart of a Warrior - Single |

## Depois: as oito séries carregadas de novo com a regra nova

| Pedido | Resultado |
|---|---|
| Stone Temple Pilots - Core | Core (Remastered); o identificador guardado não foi obedecido |
| Kiss - Rock and Roll Over | Rock And Roll Over (2026 Remaster) |
| Dire Straits - Dire Straits (Remastered) | Dire Straits |
| Thin Lizzy - Live and Dangerous (Deluxe Edition) | Live and Dangerous (Deluxe Edition) |
| Robert Plant & Jimmy Page - Walking Into Clarksdale | Walking Into Clarksdale |
| Above & Beyond - Group Therapy | Group Therapy (Bonus Track Version) |
| T. Rex - Electric Warrior | Electric Warrior (2007 Remaster) |
| Jimmy Page & Robert Plant - No Quarter | **falhou, «No catalog has…»**: o catálogo só tem «No Quarter: Jimmy Page & Robert Plant Unledded», e um subtítulo que não é nota de edição faz parte do título |

Contagem depois: 226 iguais, 1 diferente (o «No Quarter», lido do que o navegador ainda guarda).

Também trocaram de identificador, para o mesmo álbum: «Making Movies» e «Brothers In Arms (Remastered 1996)» do Dire Straits.

## Fonte de notas, servidor local (sem login, sem chave de IA)

| Pedido | Resposta |
|---|---|
| STP - Core | `found`, página 2906, Plush 89, Creep 86 |
| STP - Core (Remastered) | `found`, a mesma página 2906 |
| STP - Shangri-La Dee Da | `found`, página 8473 |
| Kiss - Rock And Roll Over (2026 Remaster) | `found`, página 6187 |
| STP - Core Memories (não existe) | `not_found` (antes «um título contém o outro» aceitaria Core) |

## Não visto

- Spotify (app e servidor) com respostas reais; o caminho antigo do blend e da edição de playlist; a busca por IA aceitando ou recusando um álbum.
- Em produção: nada ainda neste arquivo.
