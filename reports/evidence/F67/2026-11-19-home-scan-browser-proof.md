# F67 — o Scan da Home responde ao clique: prova no navegador (2026-11-19 18:33)

Código: ramo `fix/f67-home-scan-answers` com a `main` junto (`5dd2198`). Testes: 982 passando em 92 arquivos; build ok. App local com a conta do MJRP, servidor de produção.

| # | Cenário | Resultado |
|---|---|---|
| 1 | «pavement», clique em Scan | na hora: botão «Scanning…», desabilitado e ocupado; estado «Scanning…»; painel «Searching the catalog for «pavement»…». Depois: 12 álbuns, «→ Pavement», botão livre |
| 2 | Segundo clique durante a busca | sem efeito (botão desabilitado); um resultado só |
| 3 | Catálogo travado (simulado pelo console) | aos 5 s ainda «Scanning…»; aos 16 s «→ Search failed», «The catalog did not answer in 15 seconds.», botão «Try again», botão Scan livre |
| 4 | Catálogo falhando (simulado) | «The search could not be completed.» com «Try again», sem `alert`; «Try again» trouxe os 12 álbuns |
| 5 | Artista que não existe | «No albums found for «zzzzqqqqxxxx».» no painel, «→ Not found», sem `alert` |
| 6 | Campo vazio | aviso «Type an artist name first.» |
| 7 | Navegação sobreposta (rota que navega e devolve nada, registrada pelo console) seguida de Scan | a Home respondeu: 12 álbuns |

## Não visto

- A lista da IA chegando depois dos álbuns (só acontece em artista de gênero eletrônico; não fiz a chamada paga).
- O MusicKit travando na partida de verdade, e o prazo de 10 s dele numa rede lenta.
- A causa do caso do MJRP não pôde ser determinada. Dois defeitos reais explicam um clique sem resposta e sem pedido ao servidor: a consulta ao catálogo da Apple não tinha prazo (ela vai do navegador direto à Apple, não passa pelo nosso servidor), e uma navegação sobreposta deixava a tela desenhada sem ligar os botões. Os dois estão consertados.
