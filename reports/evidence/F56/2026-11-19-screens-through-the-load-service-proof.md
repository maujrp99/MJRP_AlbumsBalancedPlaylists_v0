# F56 — toda tela carrega pelo serviço de carga: prova no navegador (2026-11-19 20:07)

Código: ramo `fix/f56-screens-load-through-the-service` com a `main` junto (`8a595a3`). Testes: 1394 passando em 126 arquivos; build ok. App local com a conta do MJRP.

| # | Cenário | Antes (`main`) | Depois |
|---|---|---|---|
| 1 | Abrir a série «Grunge Rock - Classics» (5 álbuns), esperar carregar, ir ao blend, escolher a receita recomendada e clicar em «Blend»: tempo até as playlists na tela | 19,2 s | 0,05 s |
| 2 | Avisos do blend quando falta uma fonte | nenhum (uma pergunta genérica «No ratings detected») | «Acclaim ratings are missing for 1 of 5 albums (1 has none at the source): Nirvana - Nevermind.» e «Spotify popularity is missing for 1 of 5 albums…: Stone Temple Pilots - Core (Remastered).»; 6 playlists geradas |
| 3 | Playlists guardadas → «Edit Batch» de um lote de outra série (Pitchfork Indie 100) | — | abre com as 33 faixas do lote |
| 4 | «Regenerate Playlists» na edição | — | 0,1 s; 5 playlists da série certa (faixas do Pavement, Neutral Milk Hotel, Elliott Smith; nenhuma da série aberta antes); sem janela de confirmação |

O aviso do «Nevermind» em 2 é o «não tem» falso que o navegador guardou antes do conserto do artista com nota da fonte (vale 24 horas); a F68 derruba esses registros.

## Não visto

- Salvar a edição de uma série e ver só o álbum novo carregar (não editei série do MJRP).
- «Refetch» de um álbum; um álbum inexistente no blend (aviso «could not be loaded»); sair do blend no meio.
- Blend de uma série que nenhuma tela carregou (vindo só do guardado do navegador) e blend com a tela de álbuns ainda carregando.
- Nada foi salvo: as playlists geradas e a regeneração ficaram só na memória do navegador de teste.
