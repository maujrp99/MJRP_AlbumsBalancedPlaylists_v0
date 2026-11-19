# F61 — playlists guardadas rápidas: tempos no navegador (2026-11-19 19:30)

App local com a conta do MJRP (47 séries, 33 com playlists), banco de produção. Testes: 1143 passando em 104 arquivos; build ok (ramo `fix/f61-saved-playlists-fast` com a `main` junto, `ad2160b`).

| Medida | Antes (`main` de hoje, sem a F61) | Depois |
|---|---|---|
| Até a primeira série aparecer, chegando da Home | 4,6 s (a lista inteira aparecia de uma vez) | 0,26 s |
| Até todas as séries | 4,6 s a 9 s (o fim não era marcado) | 0,79 s |
| Voltar à tela na mesma sessão: primeira série | — | 0,05 s (da memória) |
| Voltar à tela: lista conferida de novo | — | 0,68 s |

A regressão de 2026-11-19 mediu 20 s nessa tela; hoje, antes da F61, a mesma tela levou 4,6 s (a rede variou). A causa era a mesma: uma leitura por série, uma depois da outra, e a tela esperava a última.

Também visto: abrir um lote mostra as linhas de playlist (construídas ao abrir); 33 grupos na tela.

## Não visto

- Apagar um lote (não apaguei dado do MJRP), o aviso de falha com «Try again» (sem rede), a tela com a rede lenta.
