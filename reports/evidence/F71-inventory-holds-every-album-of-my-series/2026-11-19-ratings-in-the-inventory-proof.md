# F71, segunda fatia (S-56) — prova no navegador e execução na conta do MJRP

**Quando:** 2026-11-19 23:44 · **Onde:** `http://127.0.0.1:5010/inventory`, servindo o ramo `feat/f71-inventory-averages-2` com a `main` `cbd96fa` juntada, na conta do MJRP, com o Spotify conectado.

## A tela

- Filtros: busca, formato, status, e o novo «Sort by» com «Artist», «Avg Rating», «Avg Pop», «Recently added».
- Botões: «Add the albums of my series» e «Update ratings».

## «Update ratings», na conta do MJRP

1. Confirmação: «Update ratings? Read the ratings of 211 albums? This can take a few minutes.» com «Cancel» e «Read ratings».
2. O botão contou «Reading ratings… N of 211» até 210, depois «Saving ratings…». Tudo levou cerca de 25 segundos (os álbuns já estavam guardados no navegador e no servidor).
3. Aviso final: «Ratings updated for 209 of 211 albums. 1 album was not found. 1 album had no ratings at its sources.»

## Depois (página recarregada, lido do Firestore)

| O quê | Valor |
|---|---|
| Itens com `averages` | 209 de 211 |
| Com nota média | 196 |
| Com popularidade média | 203 |
| Sem nada | «No Quarter» (Jimmy Page & Robert Plant) e «Thick As A Brick (2012 Steven Wilson Stereo Remix)» (Jethro Tull) |
| Exemplo gravado | `{ rating: 81.4, ratedTracks: 11, popularity: 44.2, popTracks: 10, at: … }` |
| Cartão | «Avg Rating: 74.6 · Avg Pop: 39.4%» em «Group Therapy» |
| Ordem por «Avg Rating» | «In the Court of the Crimson King (Expanded Edition)», «The Dark Side of the Moon», «Close to the Edge», «OK Computer», «The Rise and Fall of Ziggy Stardust…»; os dois sem nota no fim |
| Ordem por «Avg Pop» | «Blonde», «The Dark Side of the Moon», «OK Computer», «DAMN.», «Parachutes» |

## A saber

- **Dois álbuns têm a nota média tirada de menos de três faixas.** «In the Court of the Crimson King (Expanded Edition)» está em primeiro com a média de 2 das suas faixas: o casamento de títulos em edições ampliadas é parcial (anotado desde a F68). O número de faixas contadas fica gravado (`ratedTracks`), mas o cartão não o mostra.
- A ordem «Recently added» empata nos 188 itens acrescentados juntos e cai para artista e título.

## Não conferido

- O cabeçalho da comparação de faixas de um álbum com «Avg Rating» no lugar de «Avg Rank»: coberto por teste de unidade, não aberto no navegador nesta sessão.
- O caminho com o Spotify desconectado e o de uma gravação que falha: só em teste de unidade.
