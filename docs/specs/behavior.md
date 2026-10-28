# Behavior - MJRP_AlbumsBalancedPlaylists_v0

Onde se vê o comportamento que não é tela: a saída de um comando, um código de saída, um arquivo gerado, um hook que
bloqueia, a resposta de uma API, o que um agente faz. Cada estado é um nó do grafo de requisitos, com block ID no fim
da linha; o requisito aponta para ele com `points_to`. A superfície visual mora no `info-arch.md`.

Escreve-se só uma direção: o requisito aponta para o estado. Um estado descreve **onde o comportamento se vê**, não o
critério de aceite. Em vez do protótipo de tela, o que o humano julga aqui são os exemplos: um estado entra quando os
exemplos que ele mostra foram julgados.

## [superfície - por exemplo, a linha de comando, a API, o agente]

- **[o que se vê, numa frase.]** [onde se vê: comando, arquivo, mensagem.] ^[id-em-kebab-case]
