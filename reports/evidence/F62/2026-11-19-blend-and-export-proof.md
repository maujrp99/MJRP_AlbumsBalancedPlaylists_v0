# F62 — blend e exportação fazem o que dizem: prova no navegador (2026-11-19 20:46)

Código: ramo `fix/f62-blend-and-export-do-what-they-say` com a `main` junto (`904ee33`). Testes: 1765 passando em 145 arquivos; build ok. App local com a conta do MJRP. Nada foi salvo nem exportado.

| # | Cenário | Resultado |
|---|---|---|
| 1 | Blend da série «Grunge Rock - Classics», receita recomendada | sem «Discovery Mode» no painel; 6 playlists, 63 faixas |
| 2 | Tela de playlists recém-gerada | caminho «Home › Blend › Playlists»; botões Undo e Redo presentes e desabilitados |
| 3 | Tirar uma faixa | 62 faixas; Undo habilita |
| 4 | Undo, depois Redo | 63 faixas, Redo habilita; depois 62 |
| 5 | Lixeira de uma playlist | 5 playlists, aviso «Playlist "Greatest Hits" removed»; Undo devolve as 6 |
| 6 | Editar o título de uma playlist e depois tirar uma faixa | o título novo continua («F62 proof title»), e só ele é editável; o prefixo «1. Nome do lote -» fica fora do campo |
| 7 | Dois Undo | desfazem a faixa e depois o título |
| 8 | Esc durante a edição do título | o título volta ao que era |

## Não visto

- As exportações para o Spotify e para a Apple Music (criam playlists de verdade; precisam de uma exportação real): renovação do acesso vencido, relatório do que foi criado, não duplicar, um link por playlist.
- Salvar, recarregar e reabrir o lote para ver o título e a receita de volta (não salvei na conta do MJRP).
- As outras três receitas e os agrupamentos, um a um; arrastar faixas junto com as edições novas.
- O painel «Reconfigure» lembrando a receita usada.
