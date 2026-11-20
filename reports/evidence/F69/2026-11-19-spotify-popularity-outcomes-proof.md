# F69 — popularidade do Spotify, três desfechos: prova no navegador (2026-11-19 21:13)

Código: ramo `fix/f69-spotify-popularity-failure` sobre a `main` de hoje (`1eb1977`). Testes: 1933 passando em 162 arquivos; build ok. App local com a conta do MJRP; o navegador de teste tinha uma sessão do Spotify já vencida, mas renovável.

| # | Cenário | Resultado |
|---|---|---|
| 1 | Conectado (sessão vencida há horas, com chave de renovação): abrir «Grunge Rock - Classics» | 7 pedidos ao Spotify; popularidade `done` nos 5 álbuns, incluído «Core (Remastered)», que antes aparecia «sem dado»; nenhum erro no console |
| 2 | Não conectado (as chaves do Spotify guardadas de lado no próprio navegador de teste): recarregar «A&B and Solarstone» do zero | nenhum pedido ao Spotify; 5 álbuns com a popularidade já guardada seguem `done`; «Group Therapy (Bonus Track Version)», sem popularidade guardada, fica `not-connected`, não `empty` nem `failed`; as notas não mudam |
| 3 | Chaves devolvidas | as cinco chaves de volta, cópia de apoio apagada |

O caso 1 mostra a causa provável do defeito no uso real: «conectado» queria dizer «acesso ainda não vencido»; depois de uma hora ninguém perguntava ao Spotify e todo álbum virava «sem dado».

## Não visto

- A linha «Connect Spotify to see popularity.» na tela (ela só aparece na vista expandida; o estado foi lido do store).
- A pergunta automática ao conectar para os álbuns que estão na tela (meu teste carregou a série fora da tela).
- Falha do Spotify («did not answer», «Try again») e a pausa por 429.
- O aviso do blend «because Spotify is not connected».
- A parte do servidor (a popularidade do Spotify como fonte reserva do ranking em `/api/generate`): só prova publicando.
